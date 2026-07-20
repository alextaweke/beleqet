import { apiFetch } from "@/lib/config";

// ── Types ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  title: string;
  description: string;
  userId: string;
  category: string;
  imageUrl: string | null;
  demoUrl: string | null;
  githubUrl: string | null;
  videoUrl: string | null;
  technologies: string[];
  featured: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface WorkHistory {
  id: string;
  userId: string;
  title: string;
  company: string;
  companyUrl: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  current: boolean;
  description: string | null;
  achievements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Certification {
  id: string;
  userId: string;
  name: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  iconUrl: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  userId: string;
  authorId: string;
  authorName: string;
  authorRole: string | null;
  authorCompany: string | null;
  authorAvatarUrl: string | null;
  content: string;
  rating: number | null;
  projectId: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

export interface FullPortfolio {
  projects: Project[];
  workHistory: WorkHistory[];
  certifications: Certification[];
  testimonials: Testimonial[];
  totalProjects: number;
  totalWorkHistory: number;
  totalCertifications: number;
  totalTestimonials: number;
}

// ── DTOs ──────────────────────────────────────────────────────────────

export interface CreateProjectDto {
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  demoUrl?: string;
  githubUrl?: string;
  videoUrl?: string;
  technologies?: string[];
  featured?: boolean;
  completedAt?: string;
}

export interface CreateWorkHistoryDto {
  title: string;
  company: string;
  companyUrl?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  achievements?: string[];
}

export interface CreateCertificationDto {
  name: string;
  issuingOrg: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  iconUrl?: string;
}

export interface CreateTestimonialDto {
  userId: string;
  authorName: string;
  authorRole?: string;
  authorCompany?: string;
  authorAvatarUrl?: string;
  content: string;
  rating?: number;
  projectId?: string;
  isPublic?: boolean;
}

// ── Service Class ──────────────────────────────────────────────────────

class PortfolioService {
  private getAccessToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  // ── PROJECTS ──────────────────────────────────────────────────────────

  /**
   * Create a new project (requires authentication)
   * POST /portfolio/projects
   */
  async createProject(data: CreateProjectDto): Promise<Project> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to create a project");
    }

    return apiFetch("/portfolio/projects", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * Get all projects (public)
   * GET /portfolio/projects?userId={userId}
   */
  async getProjects(userId?: string): Promise<Project[]> {
    const url = userId
      ? `/portfolio/projects?userId=${userId}`
      : "/portfolio/projects";
    return apiFetch(url, { method: "GET" });
  }

  /**
   * Get project by ID (public)
   * GET /portfolio/projects/:id
   */
  async getProjectById(id: string): Promise<Project> {
    return apiFetch(`/portfolio/projects/${id}`, { method: "GET" });
  }

  /**
   * Update a project (requires authentication)
   * PATCH /portfolio/projects/:id
   */
  async updateProject(
    id: string,
    data: Partial<CreateProjectDto>,
  ): Promise<Project> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to update a project");
    }

    return apiFetch(`/portfolio/projects/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a project (requires authentication)
   * DELETE /portfolio/projects/:id
   */
  async deleteProject(id: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to delete a project");
    }

    return apiFetch(`/portfolio/projects/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── WORK HISTORY ──────────────────────────────────────────────────────

  /**
   * Create work history (requires authentication)
   * POST /portfolio/work-history
   */
  async createWorkHistory(data: CreateWorkHistoryDto): Promise<WorkHistory> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to add work history");
    }

    return apiFetch("/portfolio/work-history", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * Get work history by user ID (public)
   * GET /portfolio/work-history/:userId
   */
  async getWorkHistory(userId: string): Promise<WorkHistory[]> {
    return apiFetch(`/portfolio/work-history/${userId}`, { method: "GET" });
  }

  /**
   * Update work history (requires authentication)
   * PATCH /portfolio/work-history/:id
   */
  async updateWorkHistory(
    id: string,
    data: Partial<CreateWorkHistoryDto>,
  ): Promise<WorkHistory> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to update work history");
    }

    return apiFetch(`/portfolio/work-history/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete work history (requires authentication)
   * DELETE /portfolio/work-history/:id
   */
  async deleteWorkHistory(id: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to delete work history");
    }

    return apiFetch(`/portfolio/work-history/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── CERTIFICATIONS ────────────────────────────────────────────────────

  /**
   * Create a certification (requires authentication)
   * POST /portfolio/certifications
   */
  async createCertification(
    data: CreateCertificationDto,
  ): Promise<Certification> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to add a certification");
    }

    return apiFetch("/portfolio/certifications", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * Get certifications by user ID (public)
   * GET /portfolio/certifications/:userId
   */
  async getCertifications(userId: string): Promise<Certification[]> {
    return apiFetch(`/portfolio/certifications/${userId}`, { method: "GET" });
  }

  /**
   * Update a certification (requires authentication)
   * PATCH /portfolio/certifications/:id
   */
  async updateCertification(
    id: string,
    data: Partial<CreateCertificationDto>,
  ): Promise<Certification> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to update a certification");
    }

    return apiFetch(`/portfolio/certifications/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a certification (requires authentication)
   * DELETE /portfolio/certifications/:id
   */
  async deleteCertification(id: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to delete a certification");
    }

    return apiFetch(`/portfolio/certifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── TESTIMONIALS ──────────────────────────────────────────────────────

  /**
   * Create a testimonial (requires authentication)
   * POST /portfolio/testimonials
   */
  async createTestimonial(data: CreateTestimonialDto): Promise<Testimonial> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to add a testimonial");
    }

    return apiFetch("/portfolio/testimonials", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }

  /**
   * Get testimonials by user ID (public)
   * GET /portfolio/testimonials/:userId?public=true
   */
  async getTestimonials(
    userId: string,
    isPublic: boolean = true,
  ): Promise<Testimonial[]> {
    return apiFetch(`/portfolio/testimonials/${userId}?public=${isPublic}`, {
      method: "GET",
    });
  }

  /**
   * Delete a testimonial (requires authentication)
   * DELETE /portfolio/testimonials/:id
   */
  async deleteTestimonial(id: string): Promise<void> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error("Authentication required to delete a testimonial");
    }

    return apiFetch(`/portfolio/testimonials/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── FULL PORTFOLIO ──────────────────────────────────────────────────

  /**
   * Get complete portfolio for a user (public)
   * GET /portfolio/full/:userId
   */
  async getFullPortfolio(userId: string): Promise<FullPortfolio> {
    return apiFetch(`/portfolio/full/${userId}`, { method: "GET" });
  }

  // ── HELPER - CATEGORIES ─────────────────────────────────────────────

  /**
   * Get available portfolio categories
   */
  getCategories(): string[] {
    return [
      "Web Development",
      "Mobile App Development",
      "UI/UX Design",
      "Graphic Design",
      "Writing & Translation",
      "Digital Marketing",
      "Video & Animation",
      "Photography",
      "Music & Audio",
      "Business Consulting",
      "Data Analysis",
      "Machine Learning",
      "DevOps",
      "Cloud Architecture",
      "Cybersecurity",
      "Game Development",
      "AR/VR Development",
      "Blockchain Development",
    ];
  }
}

export const portfolioService = new PortfolioService();
