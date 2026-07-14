// app/freelance/pay/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  Shield,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { escrowService } from "@/lib/escrow";
import { jobsService } from "@/lib/jobs";

export default function EscrowPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrowData, setEscrowData] = useState<any>(null);
  const [gigId, setGigId] = useState<string>("");

  useEffect(() => {
    const gigIdParam = searchParams.get("gig");
    if (gigIdParam) {
      setGigId(gigIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/freelance/pay?gig=${gigId}`);
      return;
    }
  }, [isLoading, isAuthenticated, router, gigId]);

  const handleInitiatePayment = async () => {
    if (!gigId) {
      setError("No gig specified");
      return;
    }

    setInitiating(true);
    setError(null);

    try {
      const response = await escrowService.initiate(gigId);
      setEscrowData(response);

      // Redirect to payment gateway
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      }
    } catch (err: any) {
      console.error("Error initiating escrow:", err);
      setError(err.message || "Failed to initiate payment");
    } finally {
      setInitiating(false);
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Back Button */}
        <Link
          href="/freelance"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gigs
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Secure Escrow Payment
            </h1>
            <p className="text-gray-600 mt-1">
              Your payment is protected by Beleqet's secure escrow system
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
            </div>
          )}

          {/* Payment Details */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount to Pay</span>
                <span className="text-2xl font-bold text-gray-900">
                  ETB {escrowData?.grossAmount || "..."}
                </span>
              </div>
              {escrowData && (
                <>
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-gray-500">Platform Fee (10%)</span>
                    <span className="text-gray-700">
                      ETB {escrowData.platformFee}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm border-t border-gray-200 pt-2">
                    <span className="text-gray-600 font-medium">
                      Freelancer Receives
                    </span>
                    <span className="text-green-600 font-medium">
                      ETB {escrowData.netAmount}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Security Features */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Funds Held in Escrow
                  </p>
                  <p className="text-sm text-gray-500">
                    Your payment is securely held until work is completed and
                    approved
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    3-Day Hold Period
                  </p>
                  <p className="text-sm text-gray-500">
                    Funds are released 3 days after milestone approval for your
                    protection
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Dispute Resolution
                  </p>
                  <p className="text-sm text-gray-500">
                    If issues arise, our team is here to help resolve them
                    fairly
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Button */}
            <button
              onClick={handleInitiatePayment}
              disabled={initiating || !gigId}
              className={`w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${
                initiating || !gigId
                  ? "bg-gray-300 cursor-not-allowed text-gray-500"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {initiating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay with Chapa / Telebirr
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              You will be redirected to our secure payment partner
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
