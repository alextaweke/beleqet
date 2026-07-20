// components/WalletCard.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Loader2,
  Eye,
  EyeOff,
  Clock,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  X,
} from "lucide-react";
import { freelanceService } from "@/lib/freelance";
import type { WalletData } from "@/types/freelance";
import { formatDistanceToNow, format } from "date-fns";

interface WalletCardProps {
  userId?: string;
  compact?: boolean;
}

export default function WalletCard({
  userId,
  compact = false,
}: WalletCardProps) {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawData, setWithdrawData] = useState({
    amount: 0,
    method: "CHAPA" as "CHAPA" | "TELEBIRR" | "CBE_BIRR",
    accountRef: "",
  });

  const fetchWallet = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await freelanceService.getWallet();
      setWallet(data);
    } catch (err: any) {
      console.error("Wallet fetch error:", err);
      setError(err.message || "Failed to load wallet");
      // Set empty wallet so component renders
      setWallet({
        id: "empty",
        userId: userId || "",
        pendingBalance: 0,
        availableBalance: 0,
        currency: "ETB",
        updatedAt: new Date().toISOString(),
        transactions: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [userId]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(false);

    if (withdrawData.amount <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }

    if (withdrawData.amount > (wallet?.availableBalance || 0)) {
      setWithdrawError("Insufficient balance");
      return;
    }

    if (!withdrawData.accountRef.trim()) {
      setWithdrawError("Please enter your account reference");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to withdraw ETB ${withdrawData.amount.toLocaleString()} via ${withdrawData.method}?`,
      )
    ) {
      return;
    }

    setWithdrawing(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setWithdrawError("Please login first");
        setWithdrawing(false);
        return;
      }

      await freelanceService.withdraw(withdrawData);

      setWithdrawSuccess(true);
      setTimeout(() => {
        fetchWallet();
        setShowWithdrawModal(false);
        setWithdrawSuccess(false);
        setWithdrawData({ amount: 0, method: "CHAPA", accountRef: "" });
      }, 2000);
    } catch (err: any) {
      console.error("Error withdrawing:", err);
      setWithdrawError(err.message || "Failed to process withdrawal");
    } finally {
      setWithdrawing(false);
    }
  };

  const totalBalance =
    (wallet?.availableBalance || 0) + (wallet?.pendingBalance || 0);

  // Compact version for dashboard sidebar
  if (compact) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Wallet</h3>
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-auto" />
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading...</span>
          </div>
        ) : error ? (
          <div className="text-center py-2">
            <p className="text-xs text-red-600">{error}</p>
            <button
              onClick={fetchWallet}
              className="mt-1 text-xs text-blue-600 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Available</span>
              <span className="text-green-600 font-medium">
                {wallet?.currency || "ETB"}{" "}
                {wallet?.availableBalance?.toLocaleString() || "0"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending (3-day hold)</span>
              <span className="text-yellow-600 font-medium">
                {wallet?.currency || "ETB"}{" "}
                {wallet?.pendingBalance?.toLocaleString() || "0"}
              </span>
            </div>
            <Link
              href="/freelance/wallet"
              className="block w-full text-center text-sm text-purple-600 hover:text-purple-700 font-medium mt-3 pt-3 border-t border-gray-100"
            >
              View Wallet Details →
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Full version for wallet page
  return (
    <div className="space-y-6">
      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchWallet}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!error && (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-6 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm opacity-80">Total Balance</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-3xl font-bold">
                      {showBalance
                        ? `${wallet?.currency || "ETB"} ${totalBalance.toLocaleString()}`
                        : "••••••"}
                    </p>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      {showBalance ? (
                        <EyeOff className="h-4 w-4 opacity-80" />
                      ) : (
                        <Eye className="h-4 w-4 opacity-80" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm opacity-80 mt-2">
                    Available:{" "}
                    {showBalance
                      ? `${wallet?.currency || "ETB"} ${(wallet?.availableBalance || 0).toLocaleString()}`
                      : "••••••"}
                  </p>
                </div>
                <Wallet className="h-12 w-12 opacity-50" />
              </div>
              <div className="mt-4 pt-4 border-t border-white/20 flex gap-6 text-sm">
                <div>
                  <p className="opacity-80">Pending (3-day hold)</p>
                  <p className="font-semibold">
                    {showBalance
                      ? `${wallet?.currency || "ETB"} ${(wallet?.pendingBalance || 0).toLocaleString()}`
                      : "••••••"}
                  </p>
                </div>
                <div>
                  <p className="opacity-80">Updated</p>
                  <p className="font-semibold">
                    {wallet?.updatedAt
                      ? formatDistanceToNow(new Date(wallet.updatedAt), {
                          addSuffix: true,
                        })
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col items-center justify-center">
              <button
                onClick={() => setShowWithdrawModal(true)}
                disabled={!wallet || wallet.availableBalance <= 0}
                className={`w-full py-3 rounded-xl font-medium transition-colors ${
                  wallet && wallet.availableBalance > 0
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                Withdraw Funds
              </button>
              <p className="text-xs text-gray-500 mt-2">
                {wallet && wallet.availableBalance > 0
                  ? `Available: ${wallet.currency || "ETB"} ${wallet.availableBalance.toLocaleString()}`
                  : "No funds available for withdrawal"}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {wallet?.transactions?.filter(
                  (t) =>
                    t.type === "CREDIT_AVAILABLE" ||
                    t.type === "CREDIT_PENDING",
                ).length || 0}
              </p>
              <p className="text-xs text-gray-500">Total Credits</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {wallet?.transactions?.filter(
                  (t) => t.type === "DEBIT_WITHDRAWAL",
                ).length || 0}
              </p>
              <p className="text-xs text-gray-500">Withdrawals</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {wallet?.pendingBalance || 0 > 0 ? "⏳" : "✅"}
              </p>
              <p className="text-xs text-gray-500">Hold Status</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {wallet?.transactions?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Transactions</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-500" />
                Transaction History
              </h3>
              <span className="text-xs text-gray-500">Recent transactions</span>
            </div>

            {wallet?.transactions && wallet.transactions.length > 0 ? (
              <div className="space-y-2">
                {wallet.transactions.slice(0, 10).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {transaction.type === "CREDIT_PENDING" && (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      {transaction.type === "CREDIT_AVAILABLE" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {transaction.type === "DEBIT_WITHDRAWAL" && (
                        <ArrowUpRight className="h-4 w-4 text-blue-500" />
                      )}
                      {transaction.type === "DEBIT_FEE" && (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.type === "CREDIT_PENDING" &&
                            "Pending (3-day hold)"}
                          {transaction.type === "CREDIT_AVAILABLE" &&
                            "Available"}
                          {transaction.type === "DEBIT_WITHDRAWAL" &&
                            "Withdrawal"}
                          {transaction.type === "DEBIT_FEE" && "Platform Fee"}
                        </p>
                        {transaction.note && (
                          <p className="text-sm text-gray-500">
                            {transaction.note}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {format(
                            new Date(transaction.createdAt),
                            "MMM d, yyyy 'at' h:mm a",
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-medium ${
                          transaction.type.includes("DEBIT")
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {transaction.type.includes("DEBIT") ? "-" : "+"}
                        {wallet?.currency || "ETB"}{" "}
                        {transaction.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">No transactions yet</p>
                <p className="text-sm text-gray-500">
                  Start earning by completing gigs
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                Withdraw Funds
              </h2>
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawError(null);
                  setWithdrawSuccess(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {withdrawSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Withdrawal Initiated!
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your withdrawal request has been processed. Funds typically
                    arrive within 1-2 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWithdraw} className="space-y-4">
                  {/* Available Balance */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-600">Available Balance</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {wallet?.currency || "ETB"}{" "}
                      {(wallet?.availableBalance || 0).toLocaleString()}
                    </p>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Amount
                    </label>
                    <input
                      type="number"
                      value={withdrawData.amount || ""}
                      onChange={(e) =>
                        setWithdrawData({
                          ...withdrawData,
                          amount: Number(e.target.value),
                        })
                      }
                      placeholder="Enter amount"
                      min="1"
                      max={wallet?.availableBalance || 0}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min: 1 • Max:{" "}
                      {wallet?.availableBalance?.toLocaleString() || 0}
                    </p>
                  </div>

                  {/* Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Payment Method
                    </label>
                    <select
                      value={withdrawData.method}
                      onChange={(e) =>
                        setWithdrawData({
                          ...withdrawData,
                          method: e.target.value as
                            | "CHAPA"
                            | "TELEBIRR"
                            | "CBE_BIRR",
                        })
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    >
                      <option value="CHAPA">Chapa</option>
                      <option value="TELEBIRR">TeleBirr</option>
                      <option value="CBE_BIRR">CBE Birr</option>
                    </select>
                  </div>

                  {/* Account Reference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Account Reference
                    </label>
                    <input
                      type="text"
                      value={withdrawData.accountRef}
                      onChange={(e) =>
                        setWithdrawData({
                          ...withdrawData,
                          accountRef: e.target.value,
                        })
                      }
                      placeholder={
                        withdrawData.method === "TELEBIRR"
                          ? "Enter your TeleBirr phone number"
                          : "Enter your account number"
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {withdrawData.method === "TELEBIRR"
                        ? "Enter your TeleBirr registered phone number"
                        : "Enter your bank account number"}
                    </p>
                  </div>

                  {/* Error */}
                  {withdrawError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-700">{withdrawError}</p>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Withdrawals typically take 1-2 business days to
                      process.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowWithdrawModal(false);
                        setWithdrawError(null);
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={withdrawing}
                      className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {withdrawing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Withdraw"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
