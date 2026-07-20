// app/dashboard/seeker/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Search,
  Star,
  FileText,
  Eye,
  Send,
  RefreshCw,
  User,
  Loader2,
  DollarSign,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { jobsService } from "@/lib/jobs";
import { applicationsService } from "@/lib/applications";
import { freelanceService } from "@/lib/freelance";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationResponse,
} from "@/lib/applications";
import type { JobResponse } from "@/lib/jobs";
import type {
  FreelanceJob,
  Bid,
  Contract,
  Milestone,
  Deliverable,
  Dispute,
  WalletData,
  WalletTransaction,
  CreateFreelanceJobDto,
  CreateBidDto,
  FreelanceCategory,
} from "@/types/freelance";
import { formatDistanceToNow } from "date-fns";
import WalletCard from "@/components/WalletCard";

export default function UnifiedDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // State
  const [recentJobs, setRecentJobs] = useState<JobResponse[]>([]);
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [availableGigs, setAvailableGigs] = useState<FreelanceJob[]>([]);
  const [myBids, setMyBids] = useState<Bid[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"jobs" | "freelance">("jobs");
  const [stats, setStats] = useState({
    totalApplications: 0,
    pending: 0,
    screening: 0,
    shortlisted: 0,
    offered: 0,
    rejected: 0,
    totalBids: 0,
    activeBids: 0,
    acceptedBids: 0,
    totalEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  // Main data fetch
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Jobs
      const jobsResponse = await jobsService.findAll({ limit: 6 });
      setRecentJobs(jobsResponse.items || []);

      // Applications
      const applicationsResponse = await applicationsService.getMyApplications({
        limit: 10,
      });
      const apps = applicationsResponse.items || [];
      setApplications(apps);

      // Gigs
      const gigsResponse = await freelanceService.getJobs({ limit: 5 });
      setAvailableGigs(gigsResponse.items || []);

      // Bids
      const bids = await freelanceService.getMyBids();
      setMyBids(bids || []);

      // Calculate stats (wallet will be fetched by WalletCard component)
      const total = apps.length;
      const pending = apps.filter((a) => a.status === "SUBMITTED").length;
      const screening = apps.filter(
        (a) => a.status === "SCREENING" || a.status === "SHORTLISTED",
      ).length;
      const shortlisted = apps.filter((a) => a.status === "SHORTLISTED").length;
      const offered = apps.filter((a) => a.status === "OFFERED").length;
      const rejected = apps.filter((a) => a.status === "REJECTED").length;

      const totalBids = bids?.length || 0;
      const activeBids =
        bids?.filter((b) => b.status === "PENDING").length || 0;
      const acceptedBids =
        bids?.filter((b) => b.status === "ACCEPTED").length || 0;
      const earnings =
        bids
          ?.filter((b) => b.status === "ACCEPTED")
          .reduce((sum, b) => sum + b.amount, 0) || 0;

      setStats({
        totalApplications: total,
        pending,
        screening,
        shortlisted,
        offered,
        rejected,
        totalBids,
        activeBids,
        acceptedBids,
        totalEarnings: earnings,
        availableBalance: 0,
        pendingBalance: 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusBadge = (status: string) => {
    const label =
      APPLICATION_STATUS_LABELS[
        status as keyof typeof APPLICATION_STATUS_LABELS
      ] || status;
    const className =
      APPLICATION_STATUS_COLORS[
        status as keyof typeof APPLICATION_STATUS_COLORS
      ] || "bg-gray-100 text-gray-700";
    return { label, className };
  };

  const getBidStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      ACCEPTED: { label: "Accepted", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
      WITHDRAWN: { label: "Withdrawn", className: "bg-gray-100 text-gray-700" },
    };
    return (
      map[status] || { label: status, className: "bg-gray-100 text-gray-700" }
    );
  };

  const getGigStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      OPEN: { label: "Open", className: "bg-green-100 text-green-700" },
      FUNDED: { label: "Funded", className: "bg-blue-100 text-blue-700" },
      IN_PROGRESS: {
        label: "In Progress",
        className: "bg-purple-100 text-purple-700",
      },
      COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-700" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    };
    return (
      map[status] || { label: status, className: "bg-gray-100 text-gray-700" }
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        {/* <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName || "User"}! 👋
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
            Apply to jobs, bid on freelance gigs, and track everything in one
            place
          </p>
        </div> */}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalApplications + stats.totalBids}
                </p>
                <p className="text-sm text-gray-600">Applications & Bids</p>
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
                  {stats.pending + stats.screening + stats.activeBids}
                </p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.shortlisted + stats.acceptedBids}
                </p>
                <p className="text-sm text-gray-600">Shortlisted / Accepted</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-xl">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats.offered + stats.totalEarnings).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Link
            href="/vacancy"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Search className="h-4 w-4" /> Find Jobs
          </Link>
          <Link
            href="/vacancy"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
          >
            <Star className="h-4 w-4" /> Find Gigs
          </Link>
          <Link
            href="/dashboard/seeker/applications"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <FileText className="h-4 w-4" /> My Applications
          </Link>
          <Link
            href="/freelance/bids"
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            <Send className="h-4 w-4" /> My Bids
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "jobs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Briefcase className="h-4 w-4 inline mr-2" />
            Jobs ({stats.totalApplications})
          </button>
          <button
            onClick={() => setActiveTab("freelance")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "freelance"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Star className="h-4 w-4 inline mr-2" />
            Freelance ({stats.totalBids})
          </button>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "jobs" ? (
              // JOBS TAB
              <>
                {/* Applications */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      Recent Applications
                    </h2>
                    <Link
                      href="/dashboard/seeker/applications"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No applications yet</p>
                      <Link
                        href="/vacancy"
                        className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Start applying →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 4).map((app) => {
                        const status = getStatusBadge(app.status);
                        return (
                          <Link
                            key={app.id}
                            href={`/dashboard/seeker/applications/${app.id}`}
                            className="block p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900">
                                  {app.job.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />{" "}
                                    {app.job.company.name}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />{" "}
                                    {app.job.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{" "}
                                    {formatDistanceToNow(
                                      new Date(app.createdAt),
                                      { addSuffix: true },
                                    )}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                                >
                                  {status.label}
                                </span>
                                {app.score && (
                                  <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    <TrendingUp className="h-3 w-3" />{" "}
                                    {Math.round(app.score.overallScore)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recommended Jobs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" /> Recommended
                      Jobs
                    </h2>
                    <Link
                      href="/jobs"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  {recentJobs.length > 0 ? (
                    <div className="space-y-3">
                      {recentJobs.slice(0, 3).map((job) => (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {job.title}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />{" "}
                                  {job.company?.name || job.companyName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" /> {job.location}
                                </span>
                                {job.salaryMin && job.salaryMax && (
                                  <span className="flex items-center gap-1 font-medium text-gray-700">
                                    <DollarSign className="h-3 w-3" />{" "}
                                    {job.currency || "$"}
                                    {job.salaryMin.toLocaleString()} -{" "}
                                    {job.currency || "$"}
                                    {job.salaryMax.toLocaleString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            {job.featured && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500 text-sm">
                        No job recommendations available
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // FREELANCE TAB
              <>
                {/* Available Gigs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" /> Available
                      Gigs
                    </h2>
                    <Link
                      href="/freelance"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {availableGigs.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">
                        No gigs available right now
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {availableGigs.slice(0, 4).map((gig) => {
                        const status = getGigStatusBadge(gig.status);
                        return (
                          <Link
                            key={gig.id}
                            href={`/freelance/${gig.id}`}
                            className="block p-4 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
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
                                    <User className="h-3 w-3" />{" "}
                                    {gig.client?.firstName}{" "}
                                    {gig.client?.lastName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />{" "}
                                    {gig.currency} {gig.budgetMin} -{" "}
                                    {gig.budgetMax}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{" "}
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
                                    {gig.skills.slice(0, 3).map((skill, i) => (
                                      <span
                                        key={i}
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
                                  {formatDistanceToNow(
                                    new Date(gig.createdAt),
                                    { addSuffix: true },
                                  )}
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
                      <Send className="h-5 w-5 text-gray-500" /> My Bids (
                      {myBids.length})
                    </h2>
                    <Link
                      href="/freelance/bids"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {myBids.length === 0 ? (
                    <div className="text-center py-8">
                      <Send className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No bids placed yet</p>
                      <Link
                        href="/freelance"
                        className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-700 font-medium"
                      >
                        Browse Gigs →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myBids.slice(0, 4).map((bid) => {
                        const status = getBidStatusBadge(bid.status);
                        return (
                          <Link
                            key={bid.id}
                            href={`/freelance/${bid.freelanceJob.id}`}
                            className="block p-4 border border-gray-100 rounded-xl hover:border-purple-200 hover:bg-purple-50/50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {bid.freelanceJob.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />{" "}
                                    {bid.freelanceJob.client?.firstName}{" "}
                                    {bid.freelanceJob.client?.lastName}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" /> $
                                    {bid.amount}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />{" "}
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
                                  {formatDistanceToNow(
                                    new Date(bid.createdAt),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl font-bold mx-auto">
                  {user?.firstName?.charAt(0) || "U"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-3">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600">Job Seeker & Freelancer</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                  <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {stats.totalApplications} Applications
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    {stats.totalBids} Bids
                  </span>
                </div>
                <Link
                  href="/users/profile"
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
              </div>
            </div>

            {/* Wallet Card - Using the component */}
            <WalletCard userId={user?.id} compact={true} />

            {/* Application Status */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Application Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>{" "}
                    Pending
                  </span>
                  <span className="font-medium text-gray-900">
                    {stats.pending}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>{" "}
                    Screening
                  </span>
                  <span className="font-medium text-gray-900">
                    {stats.screening}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>{" "}
                    Shortlisted
                  </span>
                  <span className="font-medium text-gray-900">
                    {stats.shortlisted}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>{" "}
                    Offers
                  </span>
                  <span className="font-medium text-gray-900">
                    {stats.offered}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>{" "}
                    Rejected
                  </span>
                  <span className="font-medium text-gray-900">
                    {stats.rejected}
                  </span>
                </div>
              </div>
            </div>

            {/* Bid Status */}
            {stats.totalBids > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Bid Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>{" "}
                      Pending
                    </span>
                    <span className="font-medium text-gray-900">
                      {stats.activeBids}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>{" "}
                      Accepted
                    </span>
                    <span className="font-medium text-gray-900">
                      {stats.acceptedBids}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                💡 Pro Tip
              </h3>
              <p className="text-sm text-green-700">
                Complete your profile and add your skills to get better job and
                gig recommendations.
                <Link
                  href="/users/profile"
                  className="font-medium underline ml-1"
                >
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

// Icons
function Building2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12h4" />
      <path d="M6 16h4" />
      <path d="M6 8h4" />
      <path d="M14 8h4" />
      <path d="M14 12h4" />
      <path d="M14 16h4" />
    </svg>
  );
}

function MapPin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
