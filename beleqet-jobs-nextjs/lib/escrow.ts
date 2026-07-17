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
  /**
   * Initiate escrow for a gig
   * POST /escrow/initiate/:gigId
   */
  async initiate(gigId: string): Promise<InitiateEscrowResponse> {
    // Check if we're in the browser
    if (typeof window === "undefined") {
      throw new Error("Cannot initiate escrow on server side");
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Please log in to make a payment");
    }

    try {
      // apiFetch will automatically add the Authorization header
      const response = await apiFetch(`/escrow/initiate/${gigId}`, {
        method: "POST",
      });

      // Validate response
      if (!response.escrowId || !response.checkoutUrl) {
        throw new Error("Invalid response from server");
      }

      return response;
    } catch (error: any) {
      console.error("Escrow initiation error:", error);

      // Better error messages
      if (error.message?.includes("404")) {
        throw new Error("Gig not found. Please check the gig ID.");
      }
      if (
        error.message?.includes("403") ||
        error.message?.includes("Forbidden")
      ) {
        throw new Error(
          "You don't have permission to initiate payment for this gig.",
        );
      }
      if (error.message?.includes("contract")) {
        throw new Error(
          "Please accept a bid first to create a contract before making a payment.",
        );
      }

      throw error;
    }
  }

  /**
   * Release a milestone payment
   * POST /escrow/milestones/:id/release
   */
  async releaseMilestone(
    milestoneId: string,
  ): Promise<ReleaseMilestoneResponse> {
    if (typeof window === "undefined") {
      throw new Error("Cannot release milestone on server side");
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Please log in to release milestone");
    }

    try {
      // apiFetch will automatically add the Authorization header
      const response = await apiFetch(
        `/escrow/milestones/${milestoneId}/release`,
        {
          method: "POST",
        },
      );

      return response;
    } catch (error: any) {
      console.error("Milestone release error:", error);

      if (error.message?.includes("404")) {
        throw new Error("Milestone not found");
      }
      if (error.message?.includes("403")) {
        throw new Error("You don't have permission to release this milestone");
      }

      throw error;
    }
  }

  /**
   * Get escrow details by ID
   * GET /escrow/:id
   */
  async getEscrowDetails(escrowId: string): Promise<EscrowTransaction> {
    if (typeof window === "undefined") {
      throw new Error("Cannot fetch escrow on server side");
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("Please log in to view escrow details");
    }

    try {
      const response = await apiFetch(`/escrow/${escrowId}`, {
        method: "GET",
      });
      return response;
    } catch (error: any) {
      console.error("Fetch escrow error:", error);
      throw new Error(error.message || "Failed to fetch escrow details");
    }
  }
  async getEscrowByGig(gigId: string): Promise<EscrowTransaction | null> {
    if (typeof window === "undefined") return null;

    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const response = await apiFetch(`/escrow/gig/${gigId}`, {
        method: "GET",
      });
      return response;
    } catch (error) {
      // No escrow found or error
      return null;
    }
  }
}

export const escrowService = new EscrowService();
