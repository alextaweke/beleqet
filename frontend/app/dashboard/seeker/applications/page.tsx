// app/dashboard/seeker/applications/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Eye,
  FileText,
  TrendingUp,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  applicationsService,
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  type ApplicationResponse,
  type ApplicationStatus,
} from "@/lib/applications";
import { formatDistanceToNow } from "date-fns";

export default function MyApplicationsPage() {
  const { user, isAuthenticated } = useAuth();
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<ApplicationStatus, number>;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "">("");
  const [searchQuery, setSearchQuery] = useState("");

  // app/dashboard/seeker/applications/page.tsx - Update the fetchApplications function

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login to view your applications");
          setLoading(false);
          return;
        }

        // GET /api/v1/applications/my
        const data = await applicationsService.getMyApplications({
          page: 1,
          limit: 50,
          status: statusFilter || undefined,
        });

        setApplications(data.items || []);
        setTotal(data.total || 0);

        // GET stats
        const statsData = await applicationsService.getMyStats();
        setStats({
          total: statsData.total,
          byStatus: statsData.byStatus,
        });
      } catch (err: any) {
        console.error("Error fetching applications:", err);
        setError(err.message || "Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated, statusFilter]);

  // Filter applications by search query
  const filteredApplications = applications.filter((app) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      app.job.title.toLowerCase().includes(query) ||
      app.job.company.name.toLowerCase().includes(query) ||
      app.job.location.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: ApplicationStatus) => {
    const label = APPLICATION_STATUS_LABELS[status] || status;
    const className =
      APPLICATION_STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
    return { label, className };
  };

  if (loading) {
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
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-gray-500" />
            My Applications
          </h1>
          <p className="text-gray-600 mt-1">
            {total} application{total !== 1 ? "s" : ""} submitted
          </p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {stats.byStatus.SUBMITTED || 0}
              </p>
              <p className="text-xs text-gray-500">Submitted</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">
                {(stats.byStatus.SCREENING || 0) +
                  (stats.byStatus.SHORTLISTED || 0)}
              </p>
              <p className="text-xs text-gray-500">In Review</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {stats.byStatus.OFFERED || 0}
              </p>
              <p className="text-xs text-gray-500">Offers</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search applications..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ApplicationStatus | "")
            }
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
          >
            <option value="">All Status</option>
            {Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              {applications.length === 0
                ? "No applications yet"
                : "No matching applications"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {applications.length === 0
                ? "Start applying to jobs and they'll appear here."
                : "Try adjusting your search or filters."}
            </p>
            {applications.length === 0 && (
              <Link
                href="/jobs"
                className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Browse Jobs
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => {
              const status = getStatusBadge(application.status);
              return (
                <div
                  key={application.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/jobs/${application.job.id}`}
                        className="text-lg font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {application.job.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-4 w-4" />
                          {application.job.company.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {application.job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-4 w-4" />
                          Applied{" "}
                          {formatDistanceToNow(
                            new Date(application.createdAt),
                            {
                              addSuffix: true,
                            },
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                      >
                        {status.label}
                      </span>
                      {application.score && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <TrendingUp className="h-3 w-3" />
                          Score: {Math.round(application.score.overallScore)}%
                        </span>
                      )}
                      <Link
                        href={`/dashboard/seeker/applications/${application.id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4 text-gray-500" />
                      </Link>
                    </div>
                  </div>

                  {/* Application Status Progress */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" />
                        {formatDistanceToNow(new Date(application.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {application.status === "REJECTED" && (
                        <span className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          Not selected
                        </span>
                      )}
                      {application.status === "OFFERED" && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Offer received!
                        </span>
                      )}
                      {application.status === "INTERVIEW_SCHEDULED" &&
                        application.interviewSlot && (
                          <span className="flex items-center gap-1 text-indigo-600">
                            <ClockIcon className="h-3 w-3" />
                            Interview:{" "}
                            {new Date(
                              application.interviewSlot,
                            ).toLocaleDateString()}
                          </span>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
