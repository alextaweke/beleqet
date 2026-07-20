// app/dashboard/freelancer/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  Eye,
  Clock,
  Plus,
  Settings,
  ArrowRight,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  RefreshCw,
  User,
  DollarSign,
  Wallet,
  Star,
  Calendar,
  MessageCircle,
  Award,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { freelanceService } from "@/lib/freelance";
import { formatDistanceToNow } from "date-fns";

// Types
interface FreelanceJob {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  pricingType: string;
  deadlineDays: number;
  skills: string[];
  status: string;
  featured: boolean;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  category: {
    id: string;
    label: string;
    slug: string;
  };
  _count: {
    bids: number;
  };
}

interface Bid {
  id: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: string;
  createdAt: string;
  freelanceJob: {
    id: string;
    title: string;
    category: {
      id: string;
      label: string;
      slug: string;
    };
    client: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

interface WalletData {
  id: string;
  userId: string;
  pendingBalance: number;
  availableBalance: number;
  currency: string;
  updatedAt: string;
}

export default function FreelancerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [availableGigs, setAvailableGigs] = useState<FreelanceJob[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalBids: 0,
    activeBids: 0,
    acceptedBids: 0,
    activeContracts: 0,
    completedContracts: 0,
    totalEarnings: 0,
  });

  // Redirect if not authenticated or not a freelancer
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (!isLoading && user?.role !== "FREELANCER") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      // Fetch available gigs (OPEN and FUNDED)
      const gigsResponse = await freelanceService.getJobs({
        limit: 5,
      });
      setAvailableGigs(gigsResponse.items || []);

      // Fetch my bids
      const bids = await freelanceService.getMyBids();
      setMyBids(bids || []);

      // Fetch wallet
      try {
        const walletData = await freelanceService.getWallet();
        setWallet(walletData);
      } catch (err) {
        console.error("Error fetching wallet:", err);
        setWallet(null);
      }

      // Calculate stats
      const totalBids = bids?.length || 0;
      const activeBids =
        bids?.filter((b) => b.status === "PENDING").length || 0;
      const acceptedBids =
        bids?.filter((b) => b.status === "ACCEPTED").length || 0;

      // Calculate earnings from accepted bids
      const earnings =
        bids
          ?.filter((b) => b.status === "ACCEPTED")
          .reduce((sum, b) => sum + b.amount, 0) || 0;

      setStats({
        totalBids,
        activeBids,
        acceptedBids,
        activeContracts: acceptedBids,
        completedContracts: 0,
        totalEarnings: earnings,
      });
    } catch (err: any) {
      console.error("Error fetching freelancer data:", err);
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "FREELANCER") {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      ACCEPTED: { label: "Accepted", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
      WITHDRAWN: { label: "Withdrawn", className: "bg-gray-100 text-gray-700" },
      OPEN: { label: "Open", className: "bg-blue-100 text-blue-700" },
      FUNDED: { label: "Funded", className: "bg-green-100 text-green-700" },
      IN_PROGRESS: {
        label: "In Progress",
        className: "bg-purple-100 text-purple-700",
      },
      COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-700" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };
    return (
      statusMap[status] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
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
                Welcome back, {user?.firstName || "Freelancer"}! 👋
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
              Find gigs, manage bids, and track your earnings
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.totalBids} total bids • {stats.activeBids} active • $
              {stats.totalEarnings} earned
            </p>
          </div>
          <Link
            href="/freelance"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            <Briefcase className="h-5 w-5" />
            Find Gigs
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalBids}
                </p>
                <p className="text-sm text-gray-600">Total Bids</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeBids}
                </p>
                <p className="text-sm text-gray-600">Active Bids</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.acceptedBids}
                </p>
                <p className="text-sm text-gray-600">Accepted</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-xl">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${stats.totalEarnings.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        {wallet && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex flex-wrap items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-6 w-6" />
                  <h3 className="text-lg font-semibold">Wallet Balance</h3>
                </div>
                <div className="mt-2 flex flex-wrap gap-6">
                  <div>
                    <p className="text-sm opacity-80">Available</p>
                    <p className="text-2xl font-bold">
                      {wallet.currency}{" "}
                      {wallet.availableBalance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Pending (3-day hold)</p>
                    <p className="text-2xl font-bold">
                      {wallet.currency} {wallet.pendingBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/freelance/wallet"
                className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                View Details
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Available Gigs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Available Gigs
                </h2>
                <Link
                  href="/freelance"
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {availableGigs.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No gigs available right now</p>
                  <p className="text-sm text-gray-500">
                    Check back later for new opportunities
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableGigs.slice(0, 4).map((gig) => {
                    const status = getStatusBadge(gig.status);
                    return (
                      <Link
                        key={gig.id}
                        href={`/freelance/${gig.id}`}
                        className="block p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {gig.title}
                              </h3>
                              {gig.featured && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {gig.client?.firstName} {gig.client?.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {gig.currency} {gig.budgetMin} - {gig.budgetMax}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {gig.deadlineDays} days
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            {gig.skills && gig.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {gig.skills.slice(0, 3).map((skill, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                  >
                                    {skill}
                                  </span>
                                ))}
                                {gig.skills.length > 3 && (
                                  <span className="text-xs text-gray-400">
                                    +{gig.skills.length - 3} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                            <span className="text-sm text-gray-500">
                              {gig._count.bids} bids
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(gig.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Bids */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-500" />
                  My Bids ({myBids.length})
                </h2>
                <Link
                  href="/freelance/bids"
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {myBids.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No bids placed yet</p>
                  <p className="text-sm text-gray-500">
                    Start browsing gigs and submit your proposals
                  </p>
                  <Link
                    href="/freelance"
                    className="mt-3 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Browse Gigs →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBids.slice(0, 4).map((bid) => {
                    const status = getStatusBadge(bid.status);
                    return (
                      <Link
                        key={bid.id}
                        href={`/freelance/${bid.freelanceJob.id}`}
                        className="block p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {bid.freelanceJob.title}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {bid.freelanceJob.client?.firstName}{" "}
                                {bid.freelanceJob.client?.lastName}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />${bid.amount}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {bid.timelineDays} days
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                            {bid.coverLetter && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                {bid.coverLetter}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(bid.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl font-bold mx-auto">
                  {user?.firstName?.charAt(0) || "F"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-3">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600">Freelancer</p>
                <div className="mt-2 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                  {stats.activeBids} active bids
                </div>
                <Link
                  href="/profile"
                  className="mt-3 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Edit Profile →
                </Link>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-sm">
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
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Total Earned</span>
                  <span className="text-green-600 font-medium">
                    ${stats.totalEarnings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/freelance"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  Find Gigs
                </Link>
                <Link
                  href="/freelance/bids"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <FileText className="h-4 w-4 text-gray-400" />
                  My Bids
                </Link>
                <Link
                  href="/freelance/wallet"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Wallet className="h-4 w-4 text-gray-400" />
                  Wallet
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Profile Settings
                </Link>
              </div>
            </div>

            {/* Bid Status Breakdown */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Bid Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Pending
                  </span>
                  <span className="font-medium text-gray-900">
                    {myBids.filter((b) => b.status === "PENDING").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Accepted
                  </span>
                  <span className="font-medium text-gray-900">
                    {myBids.filter((b) => b.status === "ACCEPTED").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Rejected
                  </span>
                  <span className="font-medium text-gray-900">
                    {myBids.filter((b) => b.status === "REJECTED").length}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    Withdrawn
                  </span>
                  <span className="font-medium text-gray-900">
                    {myBids.filter((b) => b.status === "WITHDRAWN").length}
                  </span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                💡 Pro Tip
              </h3>
              <p className="text-sm text-green-700">
                Complete your profile and showcase your skills to get more gigs.
                <Link href="/profile" className="font-medium underline ml-1">
                  Update now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
