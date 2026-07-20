// app/dashboard/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Briefcase,
  Building2,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  Settings,
  Shield,
  BarChart3,
  Activity,
  ArrowRight,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { adminService } from "@/lib/admin";
import type { User, Dispute } from "@/lib/admin";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    totalDisputes: 0,
    resolvedDisputes: 0,
    pendingDisputes: 0,
    totalJobs: 0,
    activeJobs: 0,
  });

  // Redirect if not authenticated or not an admin
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isLoading && user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchAdminData = async () => {
    try {
      setError(null);

      // Fetch users
      const usersData = await adminService.getUsers();
      setUsers(usersData || []);

      // Fetch disputes
      const disputesData = await adminService.getDisputes();
      setDisputes(disputesData || []);

      // Fetch platform stats
      const platformStats = await adminService.getPlatformStats();

      // Calculate stats
      const totalUsers = usersData?.length || 0;
      const activeUsers = usersData?.filter((u) => u.isActive).length || 0;
      const suspendedUsers = usersData?.filter((u) => !u.isActive).length || 0;

      const totalDisputes = disputesData?.length || 0;
      const resolvedDisputes =
        disputesData?.filter((d) => d.resolution).length || 0;
      const pendingDisputes =
        disputesData?.filter((d) => !d.resolution).length || 0;

      setStats({
        totalUsers,
        activeUsers,
        suspendedUsers,
        totalDisputes,
        resolvedDisputes,
        pendingDisputes,
        totalJobs: platformStats?.jobs?.total || 0,
        activeJobs: platformStats?.jobs?.active || 0,
      });
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchAdminData();
    }
  }, [isAuthenticated, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Failed to load dashboard
          </h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Welcome Section */}
        <div className="flex flex-wrap items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || "Admin"}! 👋
              </h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <p className="text-gray-600 mt-1">
              Platform overview and management
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalUsers} users • {stats.totalJobs} jobs •{" "}
              {stats.totalDisputes} disputes
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/users"
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
            <Link
              href="/admin/disputes"
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              View Disputes
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-xl">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeUsers}
                </p>
                <p className="text-sm text-gray-600">Active Users</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Briefcase className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalJobs}
                </p>
                <p className="text-sm text-gray-600">Total Jobs</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingDisputes}
                </p>
                <p className="text-sm text-gray-600">Pending Disputes</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Users */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  Recent Users
                </h2>
                <Link
                  href="/admin/users"
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No users found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                          {user.firstName?.charAt(0) || "U"}
                          {user.lastName?.charAt(0) || ""}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.isActive ? "Active" : "Suspended"}
                        </span>
                        <span className="text-xs text-gray-400 capitalize">
                          {user.role?.toLowerCase().replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Disputes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Recent Disputes
                </h2>
                <Link
                  href="/admin/disputes"
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {disputes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <p className="text-gray-600">No disputes</p>
                  <p className="text-sm text-gray-500">
                    All disputes have been resolved
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {disputes.slice(0, 5).map((dispute) => (
                    <div
                      key={dispute.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {dispute.contract?.freelanceJob?.title ||
                            "Unknown Job"}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-gray-500">
                          <span>
                            {dispute.contract?.client?.firstName}{" "}
                            {dispute.contract?.client?.lastName}
                          </span>
                          <span className="text-gray-300">vs</span>
                          <span>
                            {dispute.contract?.freelancer?.firstName}{" "}
                            {dispute.contract?.freelancer?.lastName}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {dispute.contract?.agreedAmount || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            dispute.resolution
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {dispute.resolution ? "Resolved" : "Pending"}
                        </span>
                        <Link
                          href={`/admin/disputes/${dispute.id}`}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Admin Profile */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl font-bold mx-auto">
                  {user?.firstName?.charAt(0) || "A"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-3">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600">Administrator</p>
                <div className="inline-block mt-2 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                  Super Admin
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Email</span>
                  <span className="text-gray-900 font-medium">
                    {user?.email}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Member since</span>
                  {/* <span className="text-gray-900 font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "long",
                          year: "numeric",
                        })
                      : "Jan 2026"}
                  </span> */}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Admin Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/admin/users"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Users className="h-4 w-4 text-gray-400" />
                  Manage Users
                </Link>
                <Link
                  href="/admin/disputes"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <AlertTriangle className="h-4 w-4 text-gray-400" />
                  View Disputes
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Platform Settings
                </Link>
                <Link
                  href="/admin/analytics"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <BarChart3 className="h-4 w-4 text-gray-400" />
                  Analytics
                </Link>
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                System Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Status</span>
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Operational
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="flex items-center gap-1 text-sm text-green-600">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="text-sm text-gray-900">45% used</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Users Online</span>
                  <span className="text-sm text-gray-900 font-medium">23</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
