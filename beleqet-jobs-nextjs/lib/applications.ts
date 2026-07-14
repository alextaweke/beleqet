// lib/applications.ts
import { apiFetch } from "@/lib/config";

// ============================================
// Types
// ============================================

export interface CreateApplicationDto {
  jobId: string;
  coverLetter: string;
  resumeUrl: string;
  portfolioUrl?: string;
  expectedSalary?: number;
}

export interface UpdateApplicationStatusDto {
  status: ApplicationStatus;
}

export interface ApplicationResponse {
  id: string;
  jobId: string;
  userId: string;
  coverLetter: string;
  resumeUrl: string | null;
  portfolioUrl: string | null;
  expectedSalary: number | null;
  status: ApplicationStatus;
  interviewSlot: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    description: string;
    location: string;
    type: string;
    salaryMin: number | null;
    salaryMax: number | null;
    currency: string;
    company: {
      id: string;
      name: string;
      logoUrl: string | null;
      location: string | null;
    };
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
  };
  score: CandidateScore | null;
  _count?: {
    applications: number;
  };
}

export interface CandidateScore {
  id: string;
  applicationId: string;
  userId: string;
  overallScore: number;
  skillScore: number;
  experienceScore: number;
  cultureFitScore: number | null;
  reasoning: string | null;
  rawAiResponse: any | null;
  modelUsed: string;
  scoredAt: string;
}

export type ApplicationStatus =
  | "SUBMITTED"
  | "SCREENING"
  | "SHORTLISTED"
  | "INTERVIEW_SCHEDULED"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";

export interface ApplicationsResponse {
  items: ApplicationResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface JobApplicationsResponse {
  items: ApplicationResponse[];
  total: number;
}

// ============================================
// Status Helpers
// ============================================

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Submitted",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  OFFERED: "Offered",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const APPLICATION_STATUS_COLORS: Record<ApplicationStatus, string> = {
  SUBMITTED: "bg-blue-100 text-blue-700",
  SCREENING: "bg-purple-100 text-purple-700",
  SHORTLISTED: "bg-yellow-100 text-yellow-700",
  INTERVIEW_SCHEDULED: "bg-indigo-100 text-indigo-700",
  OFFERED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  WITHDRAWN: "bg-gray-100 text-gray-700",
};

export const APPLICATION_STATUS_ICONS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Clock",
  SCREENING: "Loader2",
  SHORTLISTED: "CheckCircle",
  INTERVIEW_SCHEDULED: "Calendar",
  OFFERED: "CheckCircle",
  REJECTED: "XCircle",
  WITHDRAWN: "XCircle",
};

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "SUBMITTED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW_SCHEDULED",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
];

// ============================================
// Service Class
// ============================================

class ApplicationsService {
  private getAccessToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  /**
   * POST /api/v1/applications
   * Submit a job application — triggers AI screening workflow
   */
  async submit(data: CreateApplicationDto): Promise<ApplicationResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to submit an application");
    }

    return apiFetch("/applications", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  /**
   * GET /api/v1/applications/my
   * Get all applications for the current user
   */
  async getMyApplications(params?: {
    page?: number;
    limit?: number;
    status?: ApplicationStatus;
  }): Promise<ApplicationsResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to view applications");
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.status) queryParams.append("status", params.status);

    const url = `/applications/my${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await apiFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle both array and paginated response
    if (Array.isArray(response)) {
      return {
        items: response,
        total: response.length,
        page: params?.page || 1,
        limit: params?.limit || response.length,
        totalPages: 1,
      };
    }

    return response;
  }

  /**
   * GET /api/v1/applications/job/{jobId}
   * Get all applications for a job (employer only)
   */
  async getJobApplications(
    jobId: string,
    params?: {
      page?: number;
      limit?: number;
      status?: ApplicationStatus;
    },
  ): Promise<JobApplicationsResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to view applications");
    }

    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", String(params.page));
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.status) queryParams.append("status", params.status);

    const url = `/applications/job/${jobId}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

    const response = await apiFetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Handle both array and paginated response
    if (Array.isArray(response)) {
      return {
        items: response,
        total: response.length,
      };
    }

    return response;
  }

  /**
   * GET /api/v1/applications/{id}
   * Get a single application by ID
   */
  async getApplication(id: string): Promise<ApplicationResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to view this application");
    }

    return apiFetch(`/applications/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * PATCH /api/v1/applications/{id}/status
   * Update application status (employer action)
   */
  async updateStatus(
    id: string,
    status: ApplicationStatus,
  ): Promise<ApplicationResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to update application status");
    }

    return apiFetch(`/applications/${id}/status`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
  }

  /**
   * Get application statistics for the current user
   */
  async getMyStats(): Promise<{
    total: number;
    byStatus: Record<ApplicationStatus, number>;
    recent: ApplicationResponse[];
  }> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required");
    }

    const applications = await this.getMyApplications({ limit: 100 });
    const items = applications.items || [];

    const byStatus = items.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<ApplicationStatus, number>,
    );

    return {
      total: items.length,
      byStatus,
      recent: items.slice(0, 5),
    };
  }

  /**
   * Check if user has already applied to a job
   */
  async hasApplied(jobId: string): Promise<boolean> {
    try {
      const applications = await this.getMyApplications({ limit: 100 });
      return applications.items.some((app) => app.jobId === jobId);
    } catch {
      return false;
    }
  }

  /**
   * Withdraw an application
   */
  async withdraw(id: string): Promise<ApplicationResponse> {
    return this.updateStatus(id, "WITHDRAWN");
  }
}

// ============================================
// Export Singleton Instance
// ============================================

export const applicationsService = new ApplicationsService();
