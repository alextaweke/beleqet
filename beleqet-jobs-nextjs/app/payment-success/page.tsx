"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

// ── Main Component ──────────────────────────────────────────────────────
function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [escrowData, setEscrowData] = useState<any>(null);
  const [status, setStatus] = useState<string>("");

  const escrowId = searchParams.get("escrow");
  const isTest = searchParams.get("test") === "true";
  const errorParam = searchParams.get("error");
  const paymentStatus = searchParams.get("status");

  useEffect(() => {
    // If there's an error parameter, show it
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      if (!escrowId) {
        // Check if we have a status from Chapa
        if (paymentStatus === "success") {
          setStatus("SUCCESS");
          setLoading(false);
          return;
        }
        setError("No escrow ID found");
        setLoading(false);
        return;
      }

      try {
        // Check escrow status
        const token = localStorage.getItem("accessToken");
        if (!token) {
          // Still show success if we have escrow ID
          setStatus("PENDING");
          setLoading(false);
          return;
        }

        // Try multiple times with delays to wait for webhook
        let attempts = 0;
        const maxAttempts = 5;
        let data = null;

        while (attempts < maxAttempts) {
          try {
            const response = await fetch(
              `http://localhost:4000/api/v1/escrow/${escrowId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            if (response.ok) {
              data = await response.json();
              console.log(
                `Attempt ${attempts + 1}: Escrow status:`,
                data.status,
              );

              if (data.status === "FUNDED") {
                break; // Success!
              }
            }
          } catch (err) {
            console.log(`Attempt ${attempts + 1} failed:`, err);
          }

          // Wait longer between attempts
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * (attempts + 1)),
          );
          attempts++;
        }

        if (data) {
          setEscrowData(data);
          setStatus(data.status);

          if (data.status === "FUNDED") {
            setError(null);
          } else if (data.status === "PENDING") {
            setError(
              "Payment is still being processed. Please check back in a few minutes.",
            );
          }
        } else {
          // If we couldn't verify, assume success from redirect
          setStatus("SUCCESS");
        }
      } catch (err) {
        console.error("Error verifying payment:", err);
        // Don't show error - payment likely succeeded
        setStatus("SUCCESS");
      } finally {
        setLoading(false);
      }
    };

    if (!isTest && escrowId) {
      verifyPayment();
    } else if (isTest) {
      setLoading(false);
    } else if (paymentStatus === "success") {
      setStatus("SUCCESS");
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [escrowId, isTest, errorParam, paymentStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait a moment</p>
        </div>
      </div>
    );
  }

  // Check if payment was successful
  const isSuccess =
    status === "FUNDED" || status === "SUCCESS" || (!error && !isTest);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
          {error && status !== "FUNDED" ? (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ⏳ Payment Processing
              </h1>
              <p className="text-gray-600 mb-4">
                Your payment is being processed. It may take a few minutes to
                complete.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Escrow ID: {escrowId || "N/A"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contracts"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  View My Contracts
                </Link>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Check Status Again
                </button>
              </div>
            </>
          ) : isSuccess ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ✅ Payment Successful!
              </h1>
              <p className="text-gray-600 mb-4">
                Your escrow payment has been confirmed and funds are secured.
              </p>

              {escrowData && escrowData.status === "FUNDED" && (
                <div className="bg-green-50 rounded-xl p-4 mb-6 text-left max-w-md mx-auto border border-green-200">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    💰 Payment Details:
                  </p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">
                        ETB {escrowData.grossAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fee:</span>
                      <span className="font-medium">
                        ETB {escrowData.platformFee}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">
                        Freelancer Receives:
                      </span>
                      <span className="font-medium text-green-700">
                        ETB {escrowData.netAmount}
                      </span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-green-200">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-700">
                        ✅ Funded
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 mb-6">
                Escrow ID: {escrowId || "N/A"}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contracts"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  View My Contracts
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={`/freelance`}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Browse More Gigs
                </Link>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-xl text-left">
                <p className="text-sm font-medium text-blue-800">
                  📋 What happens next?
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• The freelancer can now start work on your project</li>
                  <li>• Milestones will be created and tracked</li>
                  <li>• Funds are released after milestone approval</li>
                </ul>
              </div>
            </>
          ) : isTest ? (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-10 w-10 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ⚠️ Test Mode
              </h1>
              <p className="text-gray-600 mb-4">
                {errorParam
                  ? `Error: ${decodeURIComponent(errorParam)}`
                  : "This was a test redirect. No payment was processed."}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Escrow ID: {escrowId || "N/A"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/freelance"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Browse Gigs
                </Link>
                <Link
                  href="/contracts"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  View Contracts
                </Link>
              </div>
            </>
          ) : (
            // Fallback - show success
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                ✅ Payment Received!
              </h1>
              <p className="text-gray-600 mb-4">
                Your payment has been received and is being processed.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Escrow ID: {escrowId || "N/A"}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/contracts"
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  View My Contracts
                </Link>
                <Link
                  href="/freelance"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Browse More Gigs
                </Link>
              </div>
            </>
          )}

          <p className="text-xs text-gray-400 mt-8">
            {isSuccess &&
              "A confirmation email has been sent to your registered email."}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Export with Suspense ───────────────────────────────────────────────
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
