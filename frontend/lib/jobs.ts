// lib/jobs.ts
import { JobType, JobStatus, MyJobsDashboardResponse } from "@/types/jobs";
import { apiFetch } from "@/lib/config";

export interface CreateJobDto {
  title: string;
  description: string;
  requirements?: string;
  location: string;
  type: JobType;
  categoryId: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  featured?: boolean;
  tags?: string[];
  filled?: boolean;
  urgent?: boolean;
  jobSite?: string;
  gender?: string;
  salaryType?: string;
  vacancies?: number;
  experienceLevel?: string;
  yearsOfExperience?: string;
  qualification?: string;
  expiryDate?: string;
  applyType?: string;
  applyUrl?: string;
  applyEmail?: string;
  contactPhone?: string;
  companyName?: string;
  companyLogo?: string;
  status?: JobStatus;
  currency?: string;
}

export interface QueryJobsDto {
  q?: string;
  category?: string;
  location?: string;
  type?: JobType;
  page?: number;
  limit?: number;
}

export interface JobResponse {
  id: string;
  title: string;
  description: string;
  requirements?: string;
  location: string;
  type: JobType;
  categoryId: string;
  salaryMin?: number;
  salaryMax?: number;
  deadline?: string;
  featured?: boolean;
  tags?: string[];
  filled?: boolean;
  urgent?: boolean;
  jobSite?: string;
  gender?: string;
  salaryType?: string;
  vacancies?: number;
  experienceLevel?: string;
  yearsOfExperience?: string;
  qualification?: string;
  expiryDate?: string;
  applyType?: string;
  applyUrl?: string;
  applyEmail?: string;
  contactPhone?: string;
  companyName?: string;
  companyLogo?: string;
  status: JobStatus;
  currency?: string;
  createdAt: string;
  updatedAt: string;
  company: {
    id: string;
    name: string;
    logo?: string;
    location?: string;
  };
  category: {
    id: string;
    label: string;
    slug: string;
  };
  _count?: {
    applications: number;
  };
}

export interface PaginatedResponse {
  items: JobResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Category {
  id: string;
  label: string;
  slug: string;
  count?: number;
  icon?: string;
}

class JobsService {
  private getAccessToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await apiFetch(`/jobs/categories`, {
        method: "GET",
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  async findAll(query: QueryJobsDto = {}): Promise<PaginatedResponse> {
    try {
      const params = new URLSearchParams();
      if (query.q) params.append("q", query.q);
      if (query.category) params.append("category", query.category);
      if (query.location) params.append("location", query.location);
      if (query.type) params.append("type", query.type);
      if (query.page) params.append("page", String(query.page));
      if (query.limit) params.append("limit", String(query.limit));

      const url = `/jobs${params.toString() ? `?${params.toString()}` : ""}`;

      return await apiFetch(url, {
        method: "GET",
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      return {
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };
    }
  }

  async findOne(id: string): Promise<JobResponse> {
    try {
      return await apiFetch(`/jobs/${id}`, {
        method: "GET",
      });
    } catch (error) {
      console.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  }

  async create(data: CreateJobDto): Promise<JobResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to create a job");
    }

    return await apiFetch(`/jobs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<CreateJobDto>): Promise<JobResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to update a job");
    }

    return await apiFetch(`/jobs/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to delete a job");
    }

    return await apiFetch(`/jobs/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // lib/jobs.ts - Update the getMyJobs method

  async getMyJobs(): Promise<MyJobsDashboardResponse> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to view your jobs");
    }

    const response = await apiFetch(`/jobs/my`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // The response from the backend is already in the correct format
    // { jobs: [], totalCount: 0, activeCount: 0, allowedLimit: 10, canPostMore: true }
    return response;
  }
}

export const jobsService = new JobsService();
