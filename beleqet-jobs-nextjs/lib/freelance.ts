// lib/freelance.ts
import { apiFetch } from "@/lib/config";
import type {
  FreelanceJob,
  Bid,
  Contract,
  Milestone,
  Deliverable,
  Dispute,
  WalletData,
  WalletTransaction,
  CreateFreelanceJobDto,
  CreateBidDto,
  FreelanceCategory,
} from "@/types/freelance";

// ============================================
// Service Class
// ============================================

class FreelanceService {
  private getAccessToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  // ============================================
  // Jobs
  // ============================================

  /**
   * GET /api/v1/freelance/jobs
   * Get all freelance jobs
   */
  async getJobs(params?: {
    q?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    items: FreelanceJob[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.q) queryParams.append("q", params.q);
      if (params?.category) queryParams.append("category", params.category);
      if (params?.page) queryParams.append("page", String(params.page));
      if (params?.limit) queryParams.append("limit", String(params.limit));

      const url = `/freelance/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
      return await apiFetch(url, { method: "GET" });
    } catch (error) {
      console.error("Error fetching freelance jobs:", error);
      return { items: [], total: 0, page: 1, limit: 20, totalPages: 0 };
    }
  }

  /**
   * GET /api/v1/freelance/jobs/{id}
   * Get freelance job by ID
   */
  async getJobById(id: string): Promise<FreelanceJob> {
    return await apiFetch(`/freelance/jobs/${id}`, { method: "GET" });
  }

  /**
   * POST /api/v1/freelance/jobs
   * Create a freelance job (Employer only)
   */
  async createJob(data: CreateFreelanceJobDto): Promise<FreelanceJob> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to create a gig");
    }

    return await apiFetch("/freelance/jobs", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH /api/v1/freelance/jobs/{id}
   * Update a freelance job (Employer only)
   */
  async updateJob(
    id: string,
    data: Partial<CreateFreelanceJobDto>,
  ): Promise<FreelanceJob> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to update a gig");
    }

    return await apiFetch(`/freelance/jobs/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE /api/v1/freelance/jobs/{id}
   * Delete a freelance job (Employer only)
   */
  async deleteJob(id: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to delete a gig");
    }

    return await apiFetch(`/freelance/jobs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ============================================
  // Bids
  // ============================================

  /**
   * POST /api/v1/freelance/jobs/{id}/bids
   * Submit a bid (Freelancer only)
   */
  async submitBid(gigId: string, data: CreateBidDto): Promise<Bid> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to submit a bid");
    }

    return await apiFetch(`/freelance/jobs/${gigId}/bids`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH /api/v1/freelance/bids/{id}/accept
   * Accept a bid (Client only)
   */
  async acceptBid(bidId: string): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to accept a bid");
    }

    return await apiFetch(`/freelance/bids/${bidId}/accept`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * PATCH /api/v1/freelance/bids/{id}/withdraw
   * Withdraw a bid (Freelancer only)
   */
  async withdrawBid(bidId: string): Promise<Bid> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch(`/freelance/bids/${bidId}/withdraw`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * GET /api/v1/freelance/my-bids
   * Get current user's bids (Freelancer only)
   */
  async getMyBids(): Promise<Bid[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch("/freelance/my-bids", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ============================================
  // Contracts
  // ============================================

  /**
   * GET /api/v1/freelance/contracts/{id}
   * Get contract by ID
   */
  async getContract(id: string): Promise<Contract> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch(`/freelance/contracts/${id}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * GET /api/v1/freelance/my-contracts
   * Get current user's contracts
   */
  async getMyContracts(role: "client" | "freelancer"): Promise<Contract[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch(`/freelance/my-contracts?role=${role}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => []);
  }

  // ============================================
  // Milestones
  // ============================================

  /**
   * POST /api/v1/freelance/milestones
   * Create a milestone (Client only)
   */
  async createMilestone(data: {
    contractId: string;
    title: string;
    description?: string;
    amount: number;
    deadline: string;
  }): Promise<Milestone> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch("/freelance/milestones", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH /api/v1/freelance/milestones/{id}/approve
   * Approve a milestone (Client only)
   */
  async approveMilestone(milestoneId: string): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch(`/freelance/milestones/${milestoneId}/approve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * POST /api/v1/freelance/milestones/{id}/deliverables
   * Submit a deliverable (Freelancer only)
   */
  async submitDeliverable(
    milestoneId: string,
    data: { fileUrl: string; notes?: string },
  ): Promise<Deliverable> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch(`/freelance/milestones/${milestoneId}/deliverables`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Disputes
  // ============================================

  /**
   * POST /api/v1/freelance/disputes
   * Create a dispute (Client or Freelancer)
   */
  async createDispute(data: {
    contractId: string;
    reason: string;
    evidenceUrls?: string[];
  }): Promise<Dispute> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch("/freelance/disputes", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Escrow
  // ============================================

  /**
   * POST /api/v1/freelance/escrow/fund
   * Fund escrow (Client only)
   */
  async fundEscrow(data: {
    freelanceJobId: string;
    grossAmount: number;
    platformFee?: number;
    gatewayRef?: string;
  }): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch("/freelance/escrow/fund", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * POST /api/v1/freelance/escrow/release
   * Release escrow (Client only)
   */
  async releaseEscrow(data: {
    escrowId: string;
    releaseAmount?: number;
  }): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch("/freelance/escrow/release", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Categories
  // ============================================

  /**
   * GET /api/v1/freelance/categories
   * Get all freelance categories
   */
  async getCategories(): Promise<FreelanceCategory[]> {
    return await apiFetch("/freelance/categories", { method: "GET" });
  }

  /**
   * POST /api/v1/freelance/categories
   * Create a new freelance category (Admin only)
   */
  async createCategory(data: {
    label: string;
    slug: string;
    icon?: string;
  }): Promise<FreelanceCategory> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return await apiFetch("/freelance/categories", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Wallet
  // ============================================

  /**
   * Get freelancer's wallet
   */
  async getWallet(): Promise<WalletData> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to view wallet");
    }

    try {
      const response = await apiFetch("/wallet", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response) {
        return {
          id: "new",
          userId: "user",
          pendingBalance: 0,
          availableBalance: 0,
          currency: "ETB",
          updatedAt: new Date().toISOString(),
          transactions: [],
        };
      }

      return response;
    } catch (error: any) {
      console.error("Wallet fetch error:", error);
      return {
        id: "empty",
        userId: "user",
        pendingBalance: 0,
        availableBalance: 0,
        currency: "ETB",
        updatedAt: new Date().toISOString(),
        transactions: [],
      };
    }
  }

  /**
   * Withdraw funds from wallet
   */
  async withdraw(data: {
    amount: number;
    method: "CHAPA" | "TELEBIRR" | "CBE_BIRR";
    accountRef: string;
  }): Promise<any> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to withdraw");
    }

    return await apiFetch("/wallet/withdraw", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }
}

export const freelanceService = new FreelanceService();
