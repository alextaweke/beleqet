// app/admin/disputes/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  User,
  Mail,
  RefreshCw,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { adminService } from "@/lib/admin";
import type { Dispute } from "@/lib/admin";
import { formatDistanceToNow, format } from "date-fns";

export default function AdminDisputesPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

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

  const fetchDisputes = async () => {
    try {
      setError(null);
      const data = await adminService.getDisputes();
      setDisputes(data || []);
      setFilteredDisputes(data || []);
    } catch (err: any) {
      console.error("Error fetching disputes:", err);
      setError(err.message || "Failed to load disputes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      fetchDisputes();
    }
  }, [isAuthenticated, user]);

  // Filter disputes
  useEffect(() => {
    let filtered = disputes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.contract?.freelanceJob?.title?.toLowerCase().includes(query) ||
          d.contract?.client?.firstName?.toLowerCase().includes(query) ||
          d.contract?.client?.lastName?.toLowerCase().includes(query) ||
          d.contract?.freelancer?.firstName?.toLowerCase().includes(query) ||
          d.contract?.freelancer?.lastName?.toLowerCase().includes(query),
      );
    }

    if (statusFilter === "resolved") {
      filtered = filtered.filter((d) => d.resolution);
    } else if (statusFilter === "pending") {
      filtered = filtered.filter((d) => !d.resolution);
    }

    setFilteredDisputes(filtered);
  }, [disputes, searchQuery, statusFilter]);

  const handleResolve = async () => {
    if (!selectedDispute) return;
    if (!resolutionText.trim() || resolutionText.length < 10) {
      setResolveError("Resolution must be at least 10 characters");
      return;
    }

    if (!confirm("Are you sure you want to resolve this dispute?")) return;

    setResolving(true);
    setResolveError(null);

    try {
      await adminService.resolveDispute(selectedDispute.id, {
        resolution: resolutionText,
      });
      await fetchDisputes();
      setShowResolveModal(false);
      setSelectedDispute(null);
      setResolutionText("");
    } catch (err: any) {
      setResolveError(err.message || "Failed to resolve dispute");
    } finally {
      setResolving(false);
    }
  };

  const getStatusBadge = (dispute: Dispute) => {
    if (dispute.resolution) {
      return { label: "Resolved", className: "bg-green-100 text-green-700" };
    }
    return { label: "Pending", className: "bg-yellow-100 text-yellow-700" };
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading disputes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/admin"
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  Dispute Management
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and resolve platform disputes
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {disputes.length} total disputes •{" "}
                  {disputes.filter((d) => d.resolution).length} resolved •{" "}
                  {disputes.filter((d) => !d.resolution).length} pending
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setRefreshing(true);
              fetchDisputes();
            }}
            disabled={refreshing}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`h-5 w-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

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
                  placeholder="Search by job, client, or freelancer..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white min-w-[140px]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
            </select>
            {(searchQuery || statusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                }}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
          </div>
        )}

        {/* Disputes List */}
        {filteredDisputes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              {disputes.length === 0
                ? "No disputes found"
                : "No matching disputes"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {disputes.length === 0
                ? "All disputes have been resolved."
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
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDisputes.map((dispute) => {
                    const status = getStatusBadge(dispute);
                    return (
                      <tr
                        key={dispute.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {dispute.contract?.freelanceJob?.title ||
                              "Unknown Job"}
                          </p>
                          <p className="text-xs text-gray-500 truncate max-w-xs">
                            {dispute.reason}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">
                                {dispute.contract?.client?.firstName}{" "}
                                {dispute.contract?.client?.lastName}
                              </span>
                              <span className="text-xs text-gray-400">
                                (Client)
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-gray-600">
                                {dispute.contract?.freelancer?.firstName}{" "}
                                {dispute.contract?.freelancer?.lastName}
                              </span>
                              <span className="text-xs text-gray-400">
                                (Freelancer)
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {dispute.contract?.agreedAmount || 0}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {formatDistanceToNow(new Date(dispute.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedDispute(dispute);
                                setShowResolveModal(true);
                                setResolutionText("");
                                setResolveError(null);
                              }}
                              disabled={!!dispute.resolution}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                                dispute.resolution
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              }`}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Resolve
                            </button>
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

      {/* Resolve Dispute Modal */}
      {showResolveModal && selectedDispute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                Resolve Dispute
              </h2>
              <button
                onClick={() => {
                  setShowResolveModal(false);
                  setSelectedDispute(null);
                  setResolutionText("");
                  setResolveError(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Dispute Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700">
                  Dispute Details
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedDispute.contract?.freelanceJob?.title}
                </p>
                <div className="flex flex-wrap gap-4 mt-2 text-sm">
                  <span>
                    <span className="text-gray-500">Client:</span>{" "}
                    {selectedDispute.contract?.client?.firstName}{" "}
                    {selectedDispute.contract?.client?.lastName}
                  </span>
                  <span>
                    <span className="text-gray-500">Freelancer:</span>{" "}
                    {selectedDispute.contract?.freelancer?.firstName}{" "}
                    {selectedDispute.contract?.freelancer?.lastName}
                  </span>
                  <span>
                    <span className="text-gray-500">Amount:</span> $
                    {selectedDispute.contract?.agreedAmount}
                  </span>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-700">Reason</p>
                  <p className="text-sm text-gray-600">
                    {selectedDispute.reason}
                  </p>
                </div>
                {selectedDispute.evidenceUrls &&
                  selectedDispute.evidenceUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-700">
                        Evidence
                      </p>
                      {selectedDispute.evidenceUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline block"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  )}
              </div>

              {/* Resolution Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Resolution <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={4}
                  placeholder="Enter your resolution for this dispute..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 10 characters
                </p>
              </div>

              {resolveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{resolveError}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedDispute(null);
                    setResolutionText("");
                    setResolveError(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={resolving}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {resolving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resolving...
                    </>
                  ) : (
                    "Resolve Dispute"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// X icon component
function X(props: React.SVGProps<SVGSVGElement>) {
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
