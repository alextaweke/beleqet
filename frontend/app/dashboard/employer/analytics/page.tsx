// app/dashboard/employer/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  FileText,
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Download,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { analyticsService, CHART_COLORS } from "@/lib/analytics";
import StatCard from "@/components/analytics/StatCard";
import LineChart from "@/components/analytics/LineChart";
import BarChart from "@/components/analytics/BarChart";
import PieChart from "@/components/analytics/PieChart";

type Period = "day" | "week" | "month";

export default function EmployerAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [overview, setOverview] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && user?.role !== "EMPLOYER") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overview, jobs, apps] = await Promise.all([
        analyticsService.getEmployerOverview(),
        analyticsService.getEmployerJobAnalytics(period),
        analyticsService.getEmployerApplicationAnalytics(period),
      ]);
      setOverview(overview);
      setJobData(jobs);
      setAppData(apps);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "EMPLOYER") {
      fetchData();
    }
  }, [isAuthenticated, user, period]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Jobs",
      value: overview?.totalJobs || 0,
      icon: Briefcase,
      color: "blue",
    },
    {
      label: "Freelance Gigs",
      value: overview?.totalFreelanceJobs || 0,
      icon: TrendingUp,
      color: "purple",
    },
    {
      label: "Applications",
      value: overview?.totalApplications || 0,
      icon: Users,
      color: "green",
    },
    {
      label: "Bids",
      value: overview?.totalBids || 0,
      icon: Clock,
      color: "orange",
    },
    {
      label: "Active Contracts",
      value: overview?.totalContracts || 0,
      icon: CheckCircle,
      color: "teal",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Your job posting and application insights
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
              {(["day", "week", "month"] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    period === p
                      ? "bg-green-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                setRefreshing(true);
                fetchData();
              }}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-gray-400" />
              Job Postings Trend
            </h3>
            <LineChart data={jobData?.daily || []} color={CHART_COLORS.blue} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Applications by Status
            </h3>
            <BarChart
              data={overview?.applicationsByStatus || []}
              color={CHART_COLORS.green}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Top Jobs
            </h3>
            <BarChart
              data={appData?.topJobs || []}
              color={CHART_COLORS.purple}
              horizontal={true}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-gray-400" />
              Applications Trend
            </h3>
            <LineChart
              data={appData?.daily || []}
              color={CHART_COLORS.orange}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-400" />
              Recent Applications
            </h3>
            {appData?.recentApplications?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium text-gray-500">
                        Candidate
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">
                        Job
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">
                        Status
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {appData.recentApplications.map(
                      (app: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3 text-gray-900">
                            {app.candidate}
                          </td>
                          <td className="py-2 px-3 text-gray-600">
                            {app.jobTitle}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                app.status === "SUBMITTED"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : app.status === "SHORTLISTED"
                                    ? "bg-blue-100 text-blue-700"
                                    : app.status === "OFFERED"
                                      ? "bg-green-100 text-green-700"
                                      : app.status === "REJECTED"
                                        ? "bg-red-100 text-red-700"
                                        : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {app.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-400">
                            {new Date(app.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                No recent applications
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
