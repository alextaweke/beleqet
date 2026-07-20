// app/dashboard/seeker/applications/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  User,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  applicationsService,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationResponse,
} from "@/lib/applications";
import { format } from "date-fns";

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [application, setApplication] = useState<ApplicationResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // app/dashboard/seeker/applications/[id]/page.tsx - The getApplication method already handles this

  // app/dashboard/seeker/applications/[id]/page.tsx (only the fetch part)

  // app/dashboard/seeker/applications/[id]/page.tsx (only the fetch part)

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login to view this application");
          setLoading(false);
          return;
        }

        // GET /api/v1/applications/{id}
        const data = await applicationsService.getApplication(
          params.id as string,
        );
        setApplication(data);
      } catch (err: any) {
        console.error("Error fetching application:", err);
        setError(err.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    };

    if (params.id && isAuthenticated) {
      fetchApplication();
    }
  }, [params.id, isAuthenticated]);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">
              {error || "Application not found"}
            </p>
            <Link
              href="/dashboard/seeker/applications"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Applications
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const status = getStatusBadge(application.status);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/dashboard/seeker/applications"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {application.job.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {application.job.company.name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {application.job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Applied{" "}
                  {format(new Date(application.createdAt), "MMM d, yyyy")}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 ${status.className}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Application Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Application Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Cover Letter
                  </p>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">
                    {application.coverLetter}
                  </p>
                </div>
                {application.resumeUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Resume</p>
                    <a
                      href={application.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline flex items-center gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      View Resume
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {application.portfolioUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Portfolio
                    </p>
                    <a
                      href={application.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline flex items-center gap-1"
                    >
                      View Portfolio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {application.expectedSalary && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Expected Salary
                    </p>
                    <p className="text-sm text-gray-600">
                      {application.job.currency || "$"}{" "}
                      {application.expectedSalary.toLocaleString()}
                    </p>
                  </div>
                )}
                {application.interviewSlot && (
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                    <p className="text-sm font-medium text-indigo-700">
                      Interview Scheduled
                    </p>
                    <p className="text-sm text-indigo-600">
                      {format(
                        new Date(application.interviewSlot),
                        "EEEE, MMMM d, yyyy 'at' h:mm a",
                      )}
                    </p>
                  </div>
                )}
                {application.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {application.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            {application.score && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-gray-500" />
                  Application Score
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-green-50 rounded-xl">
                    <p className="text-2xl font-bold text-green-600">
                      {Math.round(application.score.overallScore)}%
                    </p>
                    <p className="text-xs text-gray-600">Overall</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-xl">
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(application.score.skillScore)}%
                    </p>
                    <p className="text-xs text-gray-600">Skills</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-xl">
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round(application.score.experienceScore)}%
                    </p>
                    <p className="text-xs text-gray-600">Experience</p>
                  </div>
                  {application.score.cultureFitScore && (
                    <div className="text-center p-3 bg-yellow-50 rounded-xl">
                      <p className="text-2xl font-bold text-yellow-600">
                        {Math.round(application.score.cultureFitScore)}%
                      </p>
                      <p className="text-xs text-gray-600">Culture Fit</p>
                    </div>
                  )}
                </div>
                {application.score.reasoning && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      {application.score.reasoning}
                    </p>
                  </div>
                )}
                {application.score.modelUsed && (
                  <p className="text-xs text-gray-400 mt-2">
                    Evaluated using {application.score.modelUsed} on{" "}
                    {format(
                      new Date(application.score.scoredAt),
                      "MMM d, yyyy",
                    )}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Job Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-900 font-medium">
                    {application.job.type}
                  </span>
                </div>
                {application.job.salaryMin && application.job.salaryMax && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Salary</span>
                    <span className="text-gray-900 font-medium">
                      {application.job.currency || "$"}
                      {application.job.salaryMin.toLocaleString()} -{" "}
                      {application.job.salaryMax.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-900 font-medium">
                    {application.job.location}
                  </span>
                </div>
              </div>
              <Link
                href={`/jobs/${application.job.id}`}
                className="mt-3 block text-sm text-green-600 hover:text-green-700 font-medium"
              >
                View Job →
              </Link>
            </div>

            {/* Application Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Timeline
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Applied</p>
                  <p className="text-gray-900 font-medium">
                    {format(
                      new Date(application.createdAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Updated</p>
                  <p className="text-gray-900 font-medium">
                    {format(
                      new Date(application.updatedAt),
                      "MMM d, yyyy 'at' h:mm a",
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Status</p>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                  >
                    {status.label}
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
                  href={`/jobs/${application.job.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  View Job
                </Link>
                <Link
                  href={`/company/${application.job.company.id}`}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                >
                  <Building2 className="h-4 w-4 text-gray-400" />
                  View Company
                </Link>
                {application.status !== "WITHDRAWN" &&
                  application.status !== "REJECTED" &&
                  application.status !== "OFFERED" && (
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            "Are you sure you want to withdraw this application?",
                          )
                        ) {
                          applicationsService
                            .withdraw(application.id)
                            .then(() => {
                              window.location.reload();
                            })
                            .catch((err) => {
                              alert(
                                "Failed to withdraw application: " +
                                  err.message,
                              );
                            });
                        }
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 transition-colors text-sm text-red-600 w-full text-left"
                    >
                      <XCircle className="h-4 w-4" />
                      Withdraw Application
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
