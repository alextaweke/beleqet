// app/dashboard/seeker/analytics/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  RefreshCw,
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

export default function SeekerAnalyticsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const [overview, setOverview] = useState<any>(null);
  const [appData, setAppData] = useState<any>(null);
  const [bidData, setBidData] = useState<any>(null);
  const [earningsData, setEarningsData] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (
      !isLoading &&
      user?.role !== "JOB_SEEKER" &&
      user?.role !== "FREELANCER"
    ) {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overview, apps, bids, earnings] = await Promise.all([
        analyticsService.getUserOverview(),
        analyticsService.getUserApplicationAnalytics(period),
        analyticsService.getUserBidAnalytics(period),
        analyticsService.getUserEarningsAnalytics(),
      ]);
      setOverview(overview);
      setAppData(apps);
      setBidData(bids);
      setEarningsData(earnings);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "JOB_SEEKER" || user?.role === "FREELANCER")
    ) {
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
      label: "Applications",
      value: overview?.totalApplications || 0,
      icon: FileText,
      color: "blue",
    },
    {
      label: "Bids",
      value: overview?.totalBids || 0,
      icon: Briefcase,
      color: "purple",
    },
    {
      label: "Active Contracts",
      value: overview?.activeContracts || 0,
      icon: CheckCircle,
      color: "green",
    },
    {
      label: "Available Balance",
      value: `ETB ${(overview?.availableBalance || 0).toLocaleString()}`,
      icon: DollarSign,
      color: "teal",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-wrap items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Analytics</h1>
            <p className="text-gray-600 mt-1">
              Track your applications, bids, and earnings
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
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-gray-400" />
              Applications Trend
            </h3>
            <LineChart data={appData?.daily || []} color={CHART_COLORS.blue} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              Application Status
            </h3>
            <BarChart
              data={overview?.applicationsByStatus || []}
              color={CHART_COLORS.purple}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-gray-400" />
              Bids Trend
            </h3>
            <LineChart
              data={bidData?.daily || []}
              color={CHART_COLORS.orange}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-gray-400" />
              Bids Status
            </h3>
            <PieChart data={overview?.bidsByStatus || []} />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              Earnings Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">
                  ETB {(earningsData?.totalEarned || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Available Balance</p>
                <p className="text-2xl font-bold text-blue-600">
                  ETB {(earningsData?.availableBalance || 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-600">Pending Balance</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ETB {(earningsData?.pendingBalance || 0).toLocaleString()}
                </p>
              </div>
            </div>
            {earningsData?.monthlyEarnings &&
              earningsData.monthlyEarnings.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Monthly Earnings
                  </h4>
                  <LineChart
                    data={earningsData.monthlyEarnings}
                    dataKey="sum"
                    color={CHART_COLORS.green}
                    showSum={true}
                  />
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
