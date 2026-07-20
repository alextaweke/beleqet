// components/EmployerEscrow.tsx
"use client";

import { useState } from "react";
import { escrowService } from "@/lib/escrow";
import { ESCROW_STATUS_LABELS, ESCROW_STATUS_COLORS } from "@/lib/escrow";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
} from "lucide-react";

interface EmployerEscrowProps {
  gigId: string;
  escrowStatus?: string;
  milestones: Array<{
    id: string;
    title: string;
    amount: number;
    status: string;
  }>;
}

export default function EmployerEscrow({
  gigId,
  escrowStatus,
  milestones,
}: EmployerEscrowProps) {
  const [releasing, setReleasing] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [releaseSuccess, setReleaseSuccess] = useState(false);

  const handleReleaseMilestone = async (milestoneId: string) => {
    if (!confirm("Are you sure you want to release this milestone payment?")) {
      return;
    }

    setReleasing(true);
    setReleaseError(null);
    setReleaseSuccess(false);

    try {
      await escrowService.releaseMilestone(milestoneId);
      setReleaseSuccess(true);
      setTimeout(() => setReleaseSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error releasing milestone:", err);
      setReleaseError(err.message || "Failed to release milestone");
    } finally {
      setReleasing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const label =
      ESCROW_STATUS_LABELS[status as keyof typeof ESCROW_STATUS_LABELS] ||
      status;
    const className =
      ESCROW_STATUS_COLORS[status as keyof typeof ESCROW_STATUS_COLORS] ||
      "bg-gray-100 text-gray-700";
    return { label, className };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        Escrow Management
      </h3>

      {escrowStatus && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
          <span className="text-sm text-gray-600">Escrow Status</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(escrowStatus).className}`}
          >
            {getStatusBadge(escrowStatus).label}
          </span>
        </div>
      )}

      {releaseError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
          <p className="text-sm text-red-700">{releaseError}</p>
        </div>
      )}

      {releaseSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
          <p className="text-sm text-green-700">
            Milestone released successfully!
          </p>
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Milestones</h4>
        {milestones && milestones.length > 0 ? (
          milestones.map((milestone) => {
            const status = getStatusBadge(milestone.status);
            return (
              <div
                key={milestone.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-900">{milestone.title}</p>
                  <p className="text-sm text-gray-500">
                    ETB {milestone.amount.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </span>
                  {milestone.status === "PENDING" ||
                  milestone.status === "IN_PROGRESS" ? (
                    <button
                      onClick={() => handleReleaseMilestone(milestone.id)}
                      disabled={releasing}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {releasing ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Release"
                      )}
                    </button>
                  ) : milestone.status === "APPROVED" ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      Released
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500">No milestones created yet</p>
        )}
      </div>
    </div>
  );
}
