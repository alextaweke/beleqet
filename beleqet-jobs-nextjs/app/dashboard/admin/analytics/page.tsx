// app/dashboard/admin/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { analyticsService, CHART_COLORS } from "@/lib/analytics";
import StatCard from "@/components/analytics/StatCard";
import LineChart from "@/components/analytics/LineChart";
import BarChart from "@/components/analytics/BarChart";
import PieChart from "@/components/analytics/PieChart";

type Period = "day" | "week" | "month";

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [overview, setOverview] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [freelanceData, setFreelanceData] = useState<any>(null);
  const [escrowData, setEscrowData] = useState<any>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overview, jobs, users, freelance, escrow] = await Promise.all([
        analyticsService.getAdminOverview(),
        analyticsService.getAdminJobAnalytics(period),
        analyticsService.getAdminUserAnalytics(),
        analyticsService.getAdminFreelanceAnalytics(period),
        analyticsService.getAdminEscrowAnalytics(),
      ]);
      setOverview(overview);
      setJobData(jobs);
      setUserData(users);
      setFreelanceData(freelance);
      setEscrowData(escrow);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
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
      label: "Total Users",
      value: overview?.totalUsers || 0,
      icon: Users,
      color: "blue",
    },
    {
      label: "Total Jobs",
      value: overview?.totalJobs || 0,
      icon: Briefcase,
      color: "green",
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
      icon: FileText,
      color: "yellow",
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
    {
      label: "Escrow Funded",
      value: overview?.totalEscrowFunded || 0,
      icon: DollarSign,
      color: "indigo",
    },
    {
      label: "Total Earnings",
      value: `ETB ${(overview?.totalEarnings || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "green",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Platform-wide performance and metrics
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Postings Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-gray-400" />
              Job Postings Trend
            </h3>
            <LineChart data={jobData?.daily || []} color={CHART_COLORS.green} />
          </div>

          {/* Job Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-gray-400" />
              Job Categories
            </h3>
            <PieChart data={jobData?.categories || []} />
          </div>

          {/* Application Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Application Status
            </h3>
            <BarChart
              data={jobData?.applicationStatus || []}
              color={CHART_COLORS.purple}
            />
          </div>

          {/* User Growth */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-gray-400" />
              User Growth
            </h3>
            <LineChart
              data={userData?.dailySignups || []}
              color={CHART_COLORS.teal}
            />
          </div>

          {/* Freelance Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-gray-400" />
              Freelance Categories
            </h3>
            <PieChart data={freelanceData?.categories || []} />
          </div>

          {/* Escrow Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              Escrow Overview
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-xl font-bold text-gray-900">
                  {escrowData?.total || 0}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Funded</p>
                <p className="text-xl font-bold text-green-600">
                  {escrowData?.funded || 0}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Released</p>
                <p className="text-xl font-bold text-blue-600">
                  {escrowData?.released || 0}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-600">Disputed</p>
                <p className="text-xl font-bold text-red-600">
                  {escrowData?.disputed || 0}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Total Amount:{" "}
              <span className="font-bold text-green-600">
                ETB {(escrowData?.totalAmount || 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
