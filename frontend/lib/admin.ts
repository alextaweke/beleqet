// lib/admin.ts - Updated with reactivate and toggle methods
import { apiFetch } from "@/lib/config";

// ============================================
// Types
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "EMPLOYER" | "JOB_SEEKER" | "FREELANCER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  avatarUrl: string | null;
  phone: string | null;
  _count?: {
    applications: number;
    bids: number;
    freelanceJobs: number;
  };
}

export interface Dispute {
  id: string;
  reason: string;
  evidenceUrls: string[];
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contract: {
    id: string;
    freelanceJobId: string;
    clientId: string;
    freelancerId: string;
    agreedAmount: number;
    currency: string;
    status: string;
    freelanceJob: {
      id: string;
      title: string;
      description: string;
    };
    client: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    freelancer: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface ResolveDisputeDto {
  resolution: string;
}

export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  byRole: Array<{
    role: string;
    count: number;
  }>;
}

export interface PlatformStats {
  users: {
    total: number;
    active: number;
  };
  jobs: {
    total: number;
    active: number;
  };
  applications: {
    total: number;
  };
  freelance: {
    total: number;
    open: number;
  };
  timestamp: string;
}

// ============================================
// Service Class
// ============================================

class AdminService {
  private getAccessToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  // ============================================
  // User Management
  // ============================================

  /**
   * GET /api/v1/admin/users
   * List all users
   */
  async getUsers(): Promise<User[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch("/admin/users", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /api/v1/admin/users/stats
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch("/admin/users/stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * PATCH /api/v1/admin/users/{id}/suspend
   * Suspend a user
   */
  async suspendUser(userId: string): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch(`/admin/users/${userId}/suspend`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * PATCH /api/v1/admin/users/{id}/reactivate
   * Reactivate a suspended user
   */
  async reactivateUser(userId: string): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch(`/admin/users/${userId}/reactivate`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * PATCH /api/v1/admin/users/{id}/toggle-status
   * Toggle user status (suspend/reactivate)
   */
  async toggleUserStatus(userId: string): Promise<User> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch(`/admin/users/${userId}/toggle-status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // ============================================
  // Dispute Management
  // ============================================

  /**
   * GET /api/v1/admin/escrow/disputes
   * List all escrow disputes
   */
  async getDisputes(): Promise<Dispute[]> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch("/admin/escrow/disputes", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /api/v1/admin/escrow/disputes/stats
   * Get dispute statistics
   */
  async getDisputeStats(): Promise<{
    total: number;
    resolved: number;
    pending: number;
  }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch("/admin/escrow/disputes/stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /api/v1/admin/disputes/{id}
   * Get a single dispute by ID
   */
  async getDispute(disputeId: string): Promise<Dispute> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch(`/admin/disputes/${disputeId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * PATCH /api/v1/admin/disputes/{id}/resolve
   * Resolve an escrow dispute
   */
  async resolveDispute(
    disputeId: string,
    data: ResolveDisputeDto,
  ): Promise<Dispute> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch(`/admin/disputes/${disputeId}/resolve`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  // ============================================
  // Platform Statistics
  // ============================================

  /**
   * GET /api/v1/admin/stats
   * Get platform statistics
   */
  async getPlatformStats(): Promise<PlatformStats> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch("/admin/stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * GET /api/v1/admin/jobs/stats
   * Get job statistics
   */
  async getJobStats(): Promise<{
    byStatus: Array<{ status: string; _count: number }>;
    byType: Array<{ type: string; _count: number }>;
    featured: number;
    urgent: number;
    filled: number;
  }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    return apiFetch("/admin/jobs/stats", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const adminService = new AdminService();
