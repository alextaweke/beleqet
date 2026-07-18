// lib/analytics.ts
import { apiFetch } from "@/lib/config";

export interface OverviewStats {
  totalUsers?: number;
  totalJobs?: number;
  totalFreelanceJobs?: number;
  totalApplications: number;
  totalBids?: number;
  totalContracts?: number;
  totalEscrowFunded?: number;
  totalEarnings?: number;
  activeContracts?: number;
  availableBalance?: number;
  pendingBalance?: number;
  jobCategories?: { label: string; count: number }[];
}

export interface AnalyticsData {
  daily: { date: string; count: number }[];
  categories: { label: string; count: number }[];
  status: { status: string; count: number }[];
  totalJobs?: number;
  totalGigs?: number;
  avgBudget?: number;
  avgSalary?: number;
  filledJobs?: number;
  totalApplications?: number;
  applicationsByStatus?: { status: string; count: number }[];
  bidsByStatus?: { status: string; count: number }[];
  topJobs?: { title: string; count: number }[];
  recentApplications?: any[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

class AnalyticsService {
  private getToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  // ── DASHBOARD OVERVIEW ──────────────────────────────────────────────
  async getDashboardOverview(): Promise<OverviewStats> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/dashboard/overview", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── ADMIN ──────────────────────────────────────────────────────────
  async getAdminOverview(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/admin/overview", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAdminJobAnalytics(
    period: "day" | "week" | "month" = "month",
  ): Promise<AnalyticsData> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch(`/analytics/admin/jobs?period=${period}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAdminUserAnalytics(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/admin/users", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAdminFreelanceAnalytics(
    period: "day" | "week" | "month" = "month",
  ): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch(`/analytics/admin/freelance?period=${period}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAdminEscrowAnalytics(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/admin/escrow", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── EMPLOYER ────────────────────────────────────────────────────────
  async getEmployerOverview(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/employer/overview", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getEmployerJobAnalytics(
    period: "day" | "week" | "month" = "month",
  ): Promise<AnalyticsData> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch(`/analytics/employer/jobs?period=${period}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getEmployerApplicationAnalytics(
    period: "day" | "week" | "month" = "month",
  ): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch(`/analytics/employer/applications?period=${period}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── JOB SEEKER ──────────────────────────────────────────────────────
  async getUserOverview(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/user/overview", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getUserApplicationAnalytics(
    period: "day" | "week" | "month" = "month",
  ): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch(`/analytics/user/applications?period=${period}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getUserBidAnalytics(
    period: "day" | "week" | "month" = "month",
  ): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch(`/analytics/user/bids?period=${period}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getUserEarningsAnalytics(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/user/earnings", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── FREELANCER ──────────────────────────────────────────────────────
  async getFreelancerContractAnalytics(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/freelancer/contracts", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getFreelancerPortfolioAnalytics(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");
    return apiFetch("/analytics/freelancer/portfolio", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const analyticsService = new AnalyticsService();

// ── CHART HELPERS ────────────────────────────────────────────────────

export const CHART_COLORS = {
  green: "#22c55e",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  red: "#ef4444",
  yellow: "#eab308",
  orange: "#f97316",
  cyan: "#06b6d4",
  pink: "#ec4899",
  indigo: "#6366f1",
  teal: "#14b8a6",
  gray: "#6b7280",
};

export const CHART_COLOR_PALETTE = [
  CHART_COLORS.green,
  CHART_COLORS.blue,
  CHART_COLORS.purple,
  CHART_COLORS.orange,
  CHART_COLORS.red,
  CHART_COLORS.yellow,
  CHART_COLORS.cyan,
  CHART_COLORS.pink,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
];

export function formatLineChartData(
  data: { date: string; count: number }[],
  label: string,
  color: string = CHART_COLORS.green,
): ChartData {
  return {
    labels: data.map((item) => item.date),
    datasets: [
      {
        label,
        data: data.map((item) => item.count),
        borderColor: color,
        fill: true,
        backgroundColor: color + "20",
        tension: 0.4,
      },
    ],
  };
}

export function formatBarChartData(
  data: { label: string; count: number }[],
  label: string,
  color: string = CHART_COLORS.blue,
): ChartData {
  return {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label,
        data: data.map((item) => item.count),
        backgroundColor: color + "80",
        borderColor: color,
      },
    ],
  };
}

export function formatPieChartData(
  data: { label: string; count: number }[],
  colors: string[] = CHART_COLOR_PALETTE,
): ChartData {
  return {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label: "Distribution",
        data: data.map((item) => item.count),
        backgroundColor: colors.slice(0, data.length),
      },
    ],
  };
}

export function formatStatusChartData(
  data: { status: string; count: number }[],
  colors: Record<string, string> = {
    OPEN: CHART_COLORS.green,
    PENDING: CHART_COLORS.yellow,
    FUNDED: CHART_COLORS.blue,
    IN_PROGRESS: CHART_COLORS.purple,
    COMPLETED: CHART_COLORS.teal,
    ACCEPTED: CHART_COLORS.green,
    REJECTED: CHART_COLORS.red,
    ACTIVE: CHART_COLORS.green,
    DISPUTED: CHART_COLORS.red,
    CANCELLED: CHART_COLORS.gray,
    SUBMITTED: CHART_COLORS.blue,
    APPROVED: CHART_COLORS.green,
    PUBLISHED: CHART_COLORS.green,
    CLOSED: CHART_COLORS.gray,
    DRAFT: CHART_COLORS.yellow,
    ARCHIVED: CHART_COLORS.gray,
    SCREENING: CHART_COLORS.blue,
    SHORTLISTED: CHART_COLORS.purple,
    OFFERED: CHART_COLORS.green,
    WITHDRAWN: CHART_COLORS.gray,
  },
): ChartData {
  return {
    labels: data.map((item) => item.status),
    datasets: [
      {
        label: "Status Distribution",
        data: data.map((item) => item.count),
        backgroundColor: data.map(
          (item) => colors[item.status] || CHART_COLORS.gray,
        ),
      },
    ],
  };
}
