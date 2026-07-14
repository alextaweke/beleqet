// app/dashboard/employer/applications/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Users,
  Eye,
  Clock,
  Search,
  FileText,
  TrendingUp,
  AlertCircle,
  Star,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { jobsService } from "@/lib/jobs";
import {
  applicationsService,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationResponse,
  type ApplicationStatus,
} from "@/lib/applications";
import { freelanceService } from "@/lib/freelance";
import type { JobResponse } from "@/lib/jobs";
import type { Bid, FreelanceJob } from "@/types/freelance";
import { formatDistanceToNow, format } from "date-fns";

// Combined type for both applications and bids
interface CombinedApplication {
  id: string;
  type: "job" | "freelance";
  title: string;
  applicantName: string;
  applicantEmail: string;
  applicantFirstName?: string;
  applicantLastName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  score?: number | null;
  coverLetter?: string;
  resumeUrl?: string | null;
  portfolioUrl?: string | null;
  expectedSalary?: number | null;
  interviewSlot?: string | null;
  notes?: string | null;
  amount?: number;
  timelineDays?: number;
  jobTitle?: string;
  companyName?: string;
  currency?: string;
  originalData: ApplicationResponse | Bid;
}

export default function EmployerApplicationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [allApplications, setAllApplications] = useState<CombinedApplication[]>(
    [],
  );
  const [filteredApplications, setFilteredApplications] = useState<
    CombinedApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] =
    useState<CombinedApplication | null>(null);
  const [showApplicationDetail, setShowApplicationDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("=== Fetching Data ===");
        console.log("User ID:", user?.id);

        // Get employer's regular jobs
        const jobsResponse = await jobsService.getMyJobs();
        const jobsList = jobsResponse?.jobs || [];
        console.log("Regular jobs found:", jobsList.length);
        setJobs(jobsList);

        // Combine both types
        const combined: CombinedApplication[] = [];

        // 1. Get regular job applications
        console.log("Fetching job applications...");
        for (const job of jobsList) {
          try {
            const jobApps = await applicationsService.getJobApplications(
              job.id,
            );
            if (jobApps && jobApps.items && jobApps.items.length > 0) {
              console.log(
                `Job "${job.title}" has ${jobApps.items.length} applications`,
              );
              for (const app of jobApps.items) {
                // Safe access with fallbacks
                const jobData = app.job || {};
                const userData = app.user || {};

                combined.push({
                  id: app.id || "",
                  type: "job",
                  title: jobData.title || "Unknown Job",
                  applicantName:
                    `${userData.firstName || ""} ${userData.lastName || ""}`.trim() ||
                    userData.email ||
                    "Candidate",
                  applicantEmail: userData.email || "",
                  applicantFirstName: userData.firstName,
                  applicantLastName: userData.lastName,
                  status: app.status || "SUBMITTED",
                  createdAt: app.createdAt || new Date().toISOString(),
                  updatedAt:
                    app.updatedAt || app.createdAt || new Date().toISOString(),
                  score: app.score?.overallScore || null,
                  coverLetter: app.coverLetter || undefined,
                  resumeUrl: app.resumeUrl,
                  portfolioUrl: app.portfolioUrl,
                  expectedSalary: app.expectedSalary,
                  interviewSlot: app.interviewSlot,
                  notes: app.notes,
                  jobTitle: jobData.title || "Unknown Job",
                  companyName: jobData.company?.name || "Unknown Company",
                  currency: jobData.currency || "$",
                  originalData: app,
                });
              }
            }
          } catch (err) {
            console.error(
              `Error fetching applications for job ${job.id}:`,
              err,
            );
          }
        }

        // 2. Get freelance bids
        console.log("Fetching freelance bids...");
        try {
          const allFreelanceJobs = await freelanceService.getJobs({
            limit: 100,
          });
          console.log(
            "All freelance jobs found:",
            allFreelanceJobs?.items?.length || 0,
          );

          const myFreelanceJobs =
            allFreelanceJobs?.items?.filter(
              (job) => job.client?.id === user?.id,
            ) || [];
          console.log("My freelance jobs:", myFreelanceJobs.length);

          for (const job of myFreelanceJobs) {
            try {
              console.log(
                `Fetching bids for freelance job: "${job.title}" (${job.id})`,
              );
              const jobDetail = await freelanceService.getJobById(job.id);
              console.log(
                `Job "${job.title}" has ${jobDetail.bids?.length || 0} bids`,
              );

              if (jobDetail.bids && jobDetail.bids.length > 0) {
                for (const bid of jobDetail.bids) {
                  const freelancerData = bid.freelancer || {};

                  combined.push({
                    id: bid.id || "",
                    type: "freelance",
                    title: "Freelance Bid",
                    applicantName:
                      `${freelancerData.firstName || ""} ${freelancerData.lastName || ""}`.trim() ||
                      freelancerData.email ||
                      "Freelancer",
                    applicantEmail: freelancerData.email || "",
                    applicantFirstName: freelancerData.firstName,
                    applicantLastName: freelancerData.lastName,
                    status: bid.status || "PENDING",
                    createdAt: bid.createdAt || new Date().toISOString(),
                    updatedAt:
                      bid.updatedAt ||
                      bid.createdAt ||
                      new Date().toISOString(),
                    score: bid.qualityScore || null,
                    coverLetter: bid.coverLetter || undefined,
                    amount: bid.amount,
                    timelineDays: bid.timelineDays,
                    jobTitle: job.title || "Unknown Gig",
                    companyName: "Freelance Gig",
                    currency: job.currency || "ETB",
                    originalData: bid,
                  });
                }
              }
            } catch (err) {
              console.error(
                `Error fetching bids for freelance job ${job.id}:`,
                err,
              );
            }
          }
        } catch (err) {
          console.error("Error fetching freelance data:", err);
        }

        // Sort by newest first
        combined.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        console.log("Total combined items:", combined.length);
        console.log("=== End Fetching Data ===");
        setAllApplications(combined);
        setFilteredApplications(combined);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && user?.role === "EMPLOYER") {
      fetchData();
    }
  }, [isAuthenticated, user]);

  // Filter applications
  useEffect(() => {
    let filtered = allApplications;

    if (selectedJob) {
      filtered = filtered.filter(
        (app) =>
          app.jobTitle?.includes(selectedJob) || app.title === selectedJob,
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.applicantName?.toLowerCase().includes(query) ||
          false ||
          app.applicantEmail?.toLowerCase().includes(query) ||
          false ||
          app.jobTitle?.toLowerCase().includes(query) ||
          false ||
          app.coverLetter?.toLowerCase().includes(query) ||
          false,
      );
    }

    setFilteredApplications(filtered);
  }, [allApplications, selectedJob, statusFilter, searchQuery]);

  const getStatusBadge = (type: string, status: string) => {
    if (type === "job") {
      const label =
        APPLICATION_STATUS_LABELS[
          status as keyof typeof APPLICATION_STATUS_LABELS
        ] || status;
      const className =
        APPLICATION_STATUS_COLORS[
          status as keyof typeof APPLICATION_STATUS_COLORS
        ] || "bg-gray-100 text-gray-700";
      return { label, className };
    }

    const map: Record<string, { label: string; className: string }> = {
      PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700" },
      ACCEPTED: { label: "Accepted", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700" },
      WITHDRAWN: { label: "Withdrawn", className: "bg-gray-100 text-gray-700" },
    };
    const result = map[status] || {
      label: status,
      className: "bg-gray-100 text-gray-700",
    };
    return result;
  };

  const handleStatusChange = async (
    applicationId: string,
    newStatus: string,
  ) => {
    if (
      !confirm(`Are you sure you want to change this status to "${newStatus}"?`)
    ) {
      return;
    }

    setUpdatingStatus(true);
    try {
      await applicationsService.updateStatus(
        applicationId,
        newStatus as ApplicationStatus,
      );

      setAllApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId && app.type === "job"
            ? { ...app, status: newStatus }
            : app,
        ),
      );

      setFilteredApplications((prev) =>
        prev.map((app) =>
          app.id === applicationId && app.type === "job"
            ? { ...app, status: newStatus }
            : app,
        ),
      );

      if (selectedApplication?.id === applicationId) {
        setSelectedApplication({ ...selectedApplication, status: newStatus });
      }
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleViewApplication = (application: CombinedApplication) => {
    setSelectedApplication(application);
    setShowApplicationDetail(true);
  };

  const statusOptions: ApplicationStatus[] = [
    "SUBMITTED",
    "SCREENING",
    "SHORTLISTED",
    "INTERVIEW_SCHEDULED",
    "OFFERED",
    "REJECTED",
    "WITHDRAWN",
  ];

  const getTypeIcon = (type: string) => {
    if (type === "job") {
      return <Briefcase className="h-4 w-4 text-blue-500" />;
    }
    return <Star className="h-4 w-4 text-purple-500" />;
  };

  const getTypeLabel = (type: string) => {
    return type === "job" ? "Job Application" : "Freelance Bid";
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const jobOptions = Array.from(
    new Set(allApplications.map((app) => app.jobTitle).filter(Boolean)),
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              Applications & Bids
            </h1>
            <p className="text-gray-600 mt-1">
              Manage all applications and bids for your postings
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {allApplications.length} total applications/bids
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        {allApplications.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {allApplications.filter((a) => a.type === "job").length}
              </p>
              <p className="text-xs text-gray-500">Job Applications</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {allApplications.filter((a) => a.type === "freelance").length}
              </p>
              <p className="text-xs text-gray-500">Freelance Bids</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {
                  allApplications.filter(
                    (a) => a.status === "PENDING" || a.status === "SUBMITTED",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {
                  allApplications.filter(
                    (a) => a.status === "ACCEPTED" || a.status === "OFFERED",
                  ).length
                }
              </p>
              <p className="text-xs text-gray-500">Accepted/Offered</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or job..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white min-w-[180px]"
            >
              <option value="">All Jobs/Gigs</option>
              {jobOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white min-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="SCREENING">Screening</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="OFFERED">Offered</option>
              <option value="REJECTED">Rejected</option>
              <option value="WITHDRAWN">Withdrawn</option>
              <option value="PENDING">Pending (Freelance)</option>
              <option value="ACCEPTED">Accepted (Freelance)</option>
            </select>
            {(selectedJob || statusFilter || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedJob("");
                  setStatusFilter("");
                  setSearchQuery("");
                }}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              {allApplications.length === 0
                ? "No applications or bids yet"
                : "No matching items"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {allApplications.length === 0
                ? "Applications and bids will appear here when candidates apply."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job/Gig
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((application) => {
                    const status = getStatusBadge(
                      application.type,
                      application.status,
                    );
                    return (
                      <tr
                        key={application.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(application.type)}
                            <span className="text-xs font-medium text-gray-500">
                              {getTypeLabel(application.type)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                              {application.applicantFirstName?.charAt(0) || "C"}
                              {application.applicantLastName?.charAt(0) || ""}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {application.applicantName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {application.applicantEmail}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900">
                            {application.jobTitle || "N/A"}
                          </p>
                          {application.type === "freelance" &&
                            application.amount && (
                              <p className="text-xs text-gray-500">
                                ${application.amount} •{" "}
                                {application.timelineDays} days
                              </p>
                            )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {formatDistanceToNow(
                              new Date(application.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {application.score ? (
                            <div className="flex items-center gap-1">
                              <TrendingUp className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-gray-900">
                                {Math.round(application.score)}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewApplication(application)}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {application.type === "job" && (
                              <select
                                value={application.status}
                                onChange={(e) =>
                                  handleStatusChange(
                                    application.id,
                                    e.target.value,
                                  )
                                }
                                disabled={updatingStatus}
                                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
                              >
                                {statusOptions.map((statusOption) => (
                                  <option
                                    key={statusOption}
                                    value={statusOption}
                                  >
                                    {APPLICATION_STATUS_LABELS[statusOption]}
                                  </option>
                                ))}
                              </select>
                            )}
                            {application.type === "freelance" && (
                              <span className="text-xs text-gray-400">
                                {application.status}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {showApplicationDetail && selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setShowApplicationDetail(false)}
        />
      )}
    </div>
  );
}

// ============================================
// Application Detail Modal Component
// ============================================

function ApplicationDetailModal({
  application,
  onClose,
}: {
  application: CombinedApplication;
  onClose: () => void;
}) {
  const isFreelance = application.type === "freelance";

  const statusColor = isFreelance
    ? application.status === "PENDING"
      ? "bg-yellow-100 text-yellow-700"
      : application.status === "ACCEPTED"
        ? "bg-green-100 text-green-700"
        : application.status === "REJECTED"
          ? "bg-red-100 text-red-700"
          : "bg-gray-100 text-gray-700"
    : APPLICATION_STATUS_COLORS[
        application.status as keyof typeof APPLICATION_STATUS_COLORS
      ] || "bg-gray-100 text-gray-700";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <div className="flex items-center gap-2">
              {isFreelance ? (
                <Star className="h-5 w-5 text-purple-600" />
              ) : (
                <Briefcase className="h-5 w-5 text-blue-600" />
              )}
              <h2 className="text-xl font-bold text-gray-900">
                {isFreelance ? "Freelance Bid Details" : "Application Details"}
              </h2>
            </div>
            <p className="text-sm text-gray-600">
              {application.jobTitle || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="h-5 w-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Applicant Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              {isFreelance ? "Freelancer Information" : "Applicant Information"}
            </h3>
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl font-bold">
                {application.applicantFirstName?.charAt(0) || "C"}
                {application.applicantLastName?.charAt(0) || ""}
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">
                    {application.applicantName}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">
                    {application.applicantEmail}
                  </p>
                </div>
                {isFreelance && application.amount && (
                  <div>
                    <p className="text-gray-500">Bid Amount</p>
                    <p className="font-medium text-gray-900">
                      ${application.amount}
                    </p>
                  </div>
                )}
                {isFreelance && application.timelineDays && (
                  <div>
                    <p className="text-gray-500">Timeline</p>
                    <p className="font-medium text-gray-900">
                      {application.timelineDays} days
                    </p>
                  </div>
                )}
                {!isFreelance && application.expectedSalary && (
                  <div>
                    <p className="text-gray-500">Expected Salary</p>
                    <p className="font-medium text-gray-900">
                      {application.currency || "$"}{" "}
                      {application.expectedSalary.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Status</h3>
            <span
              className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}
            >
              {application.status}
            </span>
          </div>

          {/* Cover Letter */}
          {application.coverLetter && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Cover Letter
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {application.coverLetter}
              </div>
            </div>
          )}

          {/* Links */}
          {(application.resumeUrl || application.portfolioUrl) && (
            <div className="flex flex-wrap gap-4">
              {application.resumeUrl && (
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                >
                  <FileText className="h-4 w-4" />
                  View Resume
                </a>
              )}
              {application.portfolioUrl && (
                <a
                  href={application.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                >
                  <Star className="h-4 w-4" />
                  View Portfolio
                </a>
              )}
            </div>
          )}

          {/* Interview Slot */}
          {application.interviewSlot && (
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-200">
              <h3 className="text-sm font-semibold text-indigo-700">
                Interview Scheduled
              </h3>
              <p className="text-sm text-indigo-600">
                {format(
                  new Date(application.interviewSlot),
                  "EEEE, MMMM d, yyyy 'at' h:mm a",
                )}
              </p>
            </div>
          )}

          {/* AI Score */}
          {application.score && (
            <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-3">
                AI Screening Score
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(application.score)}%
                  </p>
                  <p className="text-xs text-green-600">Overall</p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  {isFreelance ? "Bid Placed" : "Applied"}
                </span>
                <span className="text-gray-900">
                  {format(
                    new Date(application.createdAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-gray-900">
                  {format(
                    new Date(application.updatedAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
