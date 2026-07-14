// app/dashboard/employer/page.tsx
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
  Star,
  Calendar,
  MessageCircle,
  Award,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { jobsService } from "@/lib/jobs";
import { applicationsService } from "@/lib/applications";
import { freelanceService } from "@/lib/freelance";
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
} from "@/lib/applications";
import type { MyJobsDashboardResponse } from "@/types/jobs";
import type { ApplicationResponse } from "@/lib/applications";
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
import DeleteJobButton from "@/components/DeleteJobButton";
import WalletCard from "@/components/WalletCard";
export default function EmployerDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Regular Jobs
  const [dashboardData, setDashboardData] =
    useState<MyJobsDashboardResponse | null>(null);
  const [recentApplications, setRecentApplications] = useState<
    ApplicationResponse[]
  >([]);
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    submitted: 0,
    screening: 0,
    shortlisted: 0,
    offered: 0,
    rejected: 0,
  });

  // Freelance Jobs
  const [freelanceJobs, setFreelanceJobs] = useState<FreelanceJob[]>([]);
  const [freelanceBids, setFreelanceBids] = useState<Bid[]>([]);
  const [freelanceStats, setFreelanceStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    completed: 0,
    totalBids: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"jobs" | "freelance">("jobs");

  // Redirect if not authenticated or not an employer
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!isLoading && user?.role !== "EMPLOYER") {
      router.push("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const fetchEmployerData = async () => {
    try {
      setError(null);

      // 1. Get employer's regular jobs
      const response = await jobsService.getMyJobs();
      setDashboardData({
        jobs: response?.jobs || [],
        totalCount: response?.totalCount || 0,
        activeCount: response?.activeCount || 0,
        allowedLimit: response?.allowedLimit || 10,
        canPostMore:
          response?.canPostMore !== undefined ? response.canPostMore : true,
      });

      // 2. Get applications for regular jobs
      const allApps: ApplicationResponse[] = [];
      const jobs = response?.jobs || [];

      for (const job of jobs) {
        try {
          const jobApps = await applicationsService.getJobApplications(job.id);
          if (jobApps && jobApps.items) {
            allApps.push(...jobApps.items);
          }
        } catch (err) {
          console.error(`Error fetching applications for job ${job.id}:`, err);
        }
      }

      setRecentApplications(allApps.slice(0, 5));

      const total = allApps.length;
      const submitted = allApps.filter((a) => a.status === "SUBMITTED").length;
      const screening = allApps.filter((a) => a.status === "SCREENING").length;
      const shortlisted = allApps.filter(
        (a) => a.status === "SHORTLISTED",
      ).length;
      const offered = allApps.filter((a) => a.status === "OFFERED").length;
      const rejected = allApps.filter((a) => a.status === "REJECTED").length;

      setApplicationStats({
        total,
        submitted,
        screening,
        shortlisted,
        offered,
        rejected,
      });

      // 3. Get employer's freelance jobs (created by this employer)
      try {
        // Fetch all freelance jobs and filter by clientId
        const allFreelanceJobs = await freelanceService.getJobs({ limit: 100 });
        const myFreelanceJobs = allFreelanceJobs.items.filter(
          (job) => job.client?.id === user?.id,
        );
        setFreelanceJobs(myFreelanceJobs);

        // 4. Get bids for freelance jobs
        const allBids: Bid[] = [];
        for (const job of myFreelanceJobs) {
          try {
            // Fetch job details with bids
            const jobDetail = await freelanceService.getJobById(job.id);
            if (jobDetail.bids) {
              allBids.push(...jobDetail.bids);
            }
          } catch (err) {
            console.error(
              `Error fetching bids for freelance job ${job.id}:`,
              err,
            );
          }
        }
        setFreelanceBids(allBids);

        // Calculate freelance stats
        const openJobs = myFreelanceJobs.filter(
          (j) => j.status === "OPEN" || j.status === "FUNDED",
        );
        const inProgressJobs = myFreelanceJobs.filter(
          (j) => j.status === "IN_PROGRESS",
        );
        const completedJobs = myFreelanceJobs.filter(
          (j) => j.status === "COMPLETED",
        );

        setFreelanceStats({
          total: myFreelanceJobs.length,
          open: openJobs.length,
          inProgress: inProgressJobs.length,
          completed: completedJobs.length,
          totalBids: allBids.length,
        });
      } catch (err) {
        console.error("Error fetching freelance data:", err);
        // Don't fail the whole dashboard if freelance fails
      }
    } catch (err: any) {
      console.error("Error fetching employer data:", err);
      setError(err.message || "Failed to load dashboard data");
      setDashboardData({
        jobs: [],
        totalCount: 0,
        activeCount: 0,
        allowedLimit: 10,
        canPostMore: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "EMPLOYER") {
      fetchEmployerData();
    }
  }, [isAuthenticated, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEmployerData();
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

  const getFreelanceStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
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
      statusMap[status] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  };

  const getBidStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      ACCEPTED: { label: "Accepted", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
      WITHDRAWN: { label: "Withdrawn", className: "bg-gray-100 text-gray-700" },
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

  const jobs = dashboardData?.jobs || [];
  const totalJobs = dashboardData?.totalCount || 0;
  const activeJobs = dashboardData?.activeCount || 0;
  const canPostMore =
    dashboardData?.canPostMore !== undefined ? dashboardData.canPostMore : true;
  const allowedLimit = dashboardData?.allowedLimit || 10;
  const totalApplications = jobs.reduce(
    (sum, job) => sum + (job._count?.applications || 0),
    0,
  );
  const views = 245;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Welcome Section */}
        <div className="flex flex-wrap items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.firstName || "Employer"}! 👋
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
              Manage your job postings, freelance gigs, and applications
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {totalJobs} regular jobs • {freelanceStats.total} freelance gigs •{" "}
              {totalApplications + freelanceStats.totalBids} total
              applications/bids
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/post-job"
              className={`inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-medium transition-colors ${
                canPostMore
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!canPostMore) {
                  e.preventDefault();
                  alert(
                    `You've reached the maximum of ${allowedLimit} active job postings. Please archive or fill some positions to post more.`,
                  );
                }
              }}
            >
              <Plus className="h-5 w-5" />
              Post a Job
              {!canPostMore && (
                <span className="text-xs ml-1">(Limit reached)</span>
              )}
            </Link>
            <Link
              href="/freelance/post"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              <Briefcase className="h-5 w-5" />
              Post a Gig
            </Link>
          </div>
        </div>

        {/* Combined Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalJobs + freelanceStats.total}
                </p>
                <p className="text-sm text-gray-600">Total Posts</p>
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
                  {activeJobs + freelanceStats.open}
                </p>
                <p className="text-sm text-gray-600">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalApplications + freelanceStats.totalBids}
                </p>
                <p className="text-sm text-gray-600">Applications / Bids</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Eye className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{views}</p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>
          </div>
        </div>

        {/* Application Stats for Regular Jobs */}
        {applicationStats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-gray-900">
                {applicationStats.total}
              </p>
              <p className="text-xs text-gray-500">Total Apps</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-blue-600">
                {applicationStats.submitted}
              </p>
              <p className="text-xs text-gray-500">Submitted</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-purple-600">
                {applicationStats.screening}
              </p>
              <p className="text-xs text-gray-500">Screening</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-yellow-600">
                {applicationStats.shortlisted}
              </p>
              <p className="text-xs text-gray-500">Shortlisted</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-green-600">
                {applicationStats.offered}
              </p>
              <p className="text-xs text-gray-500">Offers</p>
            </div>
          </div>
        )}

        {/* Freelance Stats */}
        {freelanceStats.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-blue-600">
                {freelanceStats.open}
              </p>
              <p className="text-xs text-gray-500">Open Gigs</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-purple-600">
                {freelanceStats.inProgress}
              </p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-green-600">
                {freelanceStats.completed}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 text-center">
              <p className="text-xl font-bold text-yellow-600">
                {freelanceStats.totalBids}
              </p>
              <p className="text-xs text-gray-500">Total Bids</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("jobs")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "jobs"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Briefcase className="h-4 w-4 inline mr-2" />
            Regular Jobs ({totalJobs})
          </button>
          <button
            onClick={() => setActiveTab("freelance")}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === "freelance"
                ? "border-green-600 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Star className="h-4 w-4 inline mr-2" />
            Freelance Gigs ({freelanceStats.total})
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === "jobs" ? (
              // Regular Jobs Section
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Your Job Postings ({jobs.length})
                    </h2>
                    <Link
                      href="/dashboard/employer/jobs"
                      className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {jobs.slice(0, 5).map((job) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-green-200 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{" "}
                              {job.location || "N/A"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />{" "}
                              {job.createdAt
                                ? formatDistanceToNow(new Date(job.createdAt), {
                                    addSuffix: true,
                                  })
                                : "Recently"}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                job.status === "PUBLISHED" &&
                                job.filled !== true
                                  ? "bg-green-100 text-green-700"
                                  : job.filled === true
                                    ? "bg-gray-100 text-gray-700"
                                    : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {job.filled
                                ? "Filled"
                                : job.status === "PUBLISHED"
                                  ? "Active"
                                  : "Draft"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                            {job._count?.applications || 0} apps
                          </span>
                          <Link
                            href={`/jobs/${job.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                          <Link
                            href={`/jobs/${job.id}/edit`}
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            Edit
                          </Link>
                          <DeleteJobButton
                            jobId={job.id}
                            jobTitle={job.title}
                            variant="text"
                          />
                        </div>
                      </div>
                    ))}
                    {jobs.length === 0 && (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">No jobs posted yet</p>
                        <Link
                          href="/post-job"
                          className="mt-2 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Post your first job →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Applications for Regular Jobs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      Recent Applications
                    </h2>
                    <Link
                      href="/dashboard/employer/applications"
                      className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {recentApplications.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No applications yet</p>
                      <p className="text-sm text-gray-500">
                        Applications will appear here when candidates apply to
                        your jobs.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentApplications.map((app) => {
                        const status = getStatusBadge(app.status);
                        return (
                          <div
                            key={app.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/dashboard/employer/applications/${app.id}`}
                                className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                              >
                                {app.user?.firstName || "Candidate"}{" "}
                                {app.user?.lastName || ""}
                              </Link>
                              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {app.job?.title || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
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
                              <Link
                                href={`/dashboard/employer/applications/${app.id}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                Review
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Freelance Jobs Section
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Your Freelance Gigs ({freelanceJobs.length})
                    </h2>
                    <Link
                      href="/freelance"
                      className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="space-y-3">
                    {freelanceJobs.slice(0, 5).map((job) => {
                      const status = getFreelanceStatusBadge(job.status);
                      return (
                        <div
                          key={job.id}
                          className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-green-200 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">
                                {job.title}
                              </h3>
                              {job.featured && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {job.currency} {job.budgetMin} - {job.budgetMax}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {job.deadlineDays} days
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {job._count.bids} bids
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <Link
                              href={`/freelance/${job.id}`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                            >
                              View
                            </Link>
                            <Link
                              href={`/freelance/${job.id}/edit`}
                              className="text-sm text-green-600 hover:text-green-800"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                    {freelanceJobs.length === 0 && (
                      <div className="text-center py-8">
                        <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600">
                          No freelance gigs posted yet
                        </p>
                        <Link
                          href="/freelance/post"
                          className="mt-2 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
                        >
                          Post your first gig →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bids on Freelance Gigs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-gray-500" />
                      Recent Bids on Gigs
                    </h2>
                    <Link
                      href="/freelance/bids"
                      className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {freelanceBids.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600">No bids yet</p>
                      <p className="text-sm text-gray-500">
                        Bids will appear here when freelancers apply to your
                        gigs.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {freelanceBids.slice(0, 5).map((bid) => {
                        const status = getBidStatusBadge(bid.status);
                        return (
                          <div
                            key={bid.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/freelance/${bid.freelanceJob}`}
                                className="font-medium text-gray-900 hover:text-green-600 transition-colors"
                              >
                                {bid.freelancer?.firstName || "Freelancer"}{" "}
                                {bid.freelancer?.lastName || ""}
                              </Link>
                              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {bid.freelanceJob?.title || "N/A"}
                                </span>
                                <span className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />$
                                  {bid.amount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {bid.timelineDays} days
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(
                                    new Date(bid.createdAt),
                                    { addSuffix: true },
                                  )}
                                </span>
                              </div>
                              {bid.coverLetter && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                  {bid.coverLetter}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                              >
                                {status.label}
                              </span>
                              <Link
                                href={`/freelance/${bid.freelanceJob}`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                View Gig
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-3xl font-bold mx-auto">
                  {user?.firstName?.charAt(0) || "E"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mt-3">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600">Employer</p>
                <div className="mt-2 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                  {activeJobs} / {allowedLimit} active jobs
                </div>
                <div className="mt-1 inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                  {freelanceStats.open} open gigs
                </div>
                <Link
                  href="/profile"
                  className="mt-3 inline-block text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Edit Profile →
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/post-job"
                  className={`flex items-center gap-2 p-2 rounded-lg transition-colors text-sm ${
                    canPostMore
                      ? "text-gray-700 hover:bg-gray-50"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={(e) => {
                    if (!canPostMore) {
                      e.preventDefault();
                      alert(
                        `You've reached the maximum of ${allowedLimit} active job postings.`,
                      );
                    }
                  }}
                >
                  <Plus
                    className={`h-4 w-4 ${canPostMore ? "text-gray-400" : "text-gray-300"}`}
                  />
                  Post a New Job
                  {!canPostMore && (
                    <span className="text-xs text-gray-400 ml-auto">
                      (Limit reached)
                    </span>
                  )}
                </Link>
                <Link
                  href="/freelance/post"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Star className="h-4 w-4 text-gray-400" />
                  Post a Gig
                </Link>
                <Link
                  href="/dashboard/employer/jobs"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  Manage Jobs
                </Link>
                <Link
                  href="/dashboard/employer/applications"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Users className="h-4 w-4 text-gray-400" />
                  View Applications
                </Link>
                <Link
                  href="/freelance"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Star className="h-4 w-4 text-gray-400" />
                  Browse Gigs
                </Link>
                <Link
                  href="/company/settings"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Company Settings
                </Link>
                <WalletCard userId={user?.id} compact={true} />
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                💡 Pro Tip
              </h3>
              <p className="text-sm text-green-700">
                Jobs with featured status get 3x more applications. Freelance
                gigs with clear requirements attract better freelancers.
                <Link href="/pricing" className="font-medium underline ml-1">
                  Learn more
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
