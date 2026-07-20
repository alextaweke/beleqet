// app/components/EscrowStatus.tsx
"use client";

import {
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { ESCROW_STATUS_LABELS, ESCROW_STATUS_COLORS } from "@/lib/escrow";

interface EscrowStatusProps {
  escrow: {
    id: string;
    status: string;
    grossAmount: number;
    platformFee: number;
    netAmount: number;
    fundedAt: string | null;
  };
  gigId: string;
  currency?: string;
  showActions?: boolean;
  isClient?: boolean;
}

export function EscrowStatus({
  escrow,
  gigId,
  currency = "ETB",
  showActions = true,
  isClient = false,
}: EscrowStatusProps) {
  const statusColor =
    ESCROW_STATUS_COLORS[escrow.status as keyof typeof ESCROW_STATUS_COLORS] ||
    "bg-gray-100 text-gray-700";
  const statusLabel =
    ESCROW_STATUS_LABELS[escrow.status as keyof typeof ESCROW_STATUS_LABELS] ||
    escrow.status;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-600" />
          Escrow Protection
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="space-y-3">
        {/* Amounts */}
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Amount</span>
            <span className="text-lg font-bold text-gray-900">
              {currency} {escrow.grossAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 text-sm">
            <span className="text-gray-500">Platform Fee (10%)</span>
            <span className="text-gray-700">
              {currency} {escrow.platformFee.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1 text-sm border-t border-gray-200 pt-1">
            <span className="text-gray-600 font-medium">
              Freelancer Receives
            </span>
            <span className="text-green-600 font-medium">
              {currency} {escrow.netAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Status indicators */}
        {escrow.status === "FUNDED" && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>Funds secured. Work can begin!</span>
          </div>
        )}
        {escrow.status === "PENDING" && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <Clock className="h-4 w-4" />
            <span>Awaiting payment confirmation</span>
          </div>
        )}
        {escrow.status === "RELEASED" && (
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <CheckCircle className="h-4 w-4" />
            <span>Funds released to freelancer</span>
          </div>
        )}
        {escrow.status === "DISPUTED" && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>Dispute in progress</span>
          </div>
        )}

        {/* Action buttons */}
        {showActions && isClient && escrow.status === "PENDING" && (
          <Link
            href={`/freelance/pay?gig=${gigId}`}
            className="w-full mt-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Complete Payment
          </Link>
        )}

        {escrow.fundedAt && (
          <p className="text-xs text-gray-400 mt-2">
            Funded on {new Date(escrow.fundedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
}
