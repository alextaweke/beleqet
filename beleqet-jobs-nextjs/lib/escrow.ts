// lib/escrow.ts
import { apiFetch } from "@/lib/config";

// ============================================
// Types
// ============================================

export interface EscrowTransaction {
  id: string;
  freelanceJobId: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: EscrowStatus;
  gatewayRef: string | null;
  gatewayResponse: any;
  fundedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type EscrowStatus =
  | "PENDING"
  | "FUNDED"
  | "IN_REVIEW"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED";

export interface InitiateEscrowResponse {
  escrowId: string;
  checkoutUrl: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
}

export interface ReleaseMilestoneResponse {
  success: boolean;
}

// ============================================
// Status Helpers
// ============================================

export const ESCROW_STATUS_LABELS: Record<EscrowStatus, string> = {
  PENDING: "Pending",
  FUNDED: "Funded",
  IN_REVIEW: "In Review",
  RELEASED: "Released",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

export const ESCROW_STATUS_COLORS: Record<EscrowStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  FUNDED: "bg-green-100 text-green-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  RELEASED: "bg-purple-100 text-purple-700",
  REFUNDED: "bg-gray-100 text-gray-700",
  DISPUTED: "bg-red-100 text-red-700",
};

// ============================================
// Service Class
// ============================================

class EscrowService {
  private getAccessToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  /**
   * Initiate escrow for a gig
   * POST /escrow/initiate/:gigId
   */
  async initiate(gigId: string): Promise<InitiateEscrowResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to initiate escrow");
    }

    return apiFetch(`/escrow/initiate/${gigId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Release a milestone payment
   * POST /escrow/milestones/:id/release
   */
  async releaseMilestone(
    milestoneId: string,
  ): Promise<ReleaseMilestoneResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to release milestone");
    }

    return apiFetch(`/escrow/milestones/${milestoneId}/release`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const escrowService = new EscrowService();
