// app/contracts/page.tsx
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
  Calendar,
  DollarSign,
  User,
  Mail,
  CheckCircle,
  XCircle,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/lib/config";
import { formatDistanceToNow, format } from "date-fns";

interface Contract {
  id: string;
  freelanceJobId: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: number;
  currency: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  freelanceJob: {
    id: string;
    title: string;
    description: string;
    category: {
      id: string;
      label: string;
      slug: string;
    };
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  milestones: Milestone[];
  dispute: Dispute | null;
  _count?: {
    milestones: number;
  };
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  deadline: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Dispute {
  id: string;
  reason: string;
  resolution: string | null;
  resolvedAt: string | null;
}

export default function ContractsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [role, setRole] = useState<"client" | "freelancer">("client");

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  // Determine role based on user type
  useEffect(() => {
    if (user) {
      if (user.role === "EMPLOYER") {
        setRole("client");
      } else if (user.role === "FREELANCER" || user.role === "JOB_SEEKER") {
        setRole("freelancer");
      }
    }
  }, [user]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please login to view contracts");
        setLoading(false);
        return;
      }

      // Fetch contracts based on role
      const response = await apiFetch(`/freelance/my-contracts?role=${role}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Contracts response:", response);
      setContracts(response || []);
      setFilteredContracts(response || []);
    } catch (err: any) {
      console.error("Error fetching contracts:", err);
      setError(err.message || "Failed to load contracts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContracts();
    }
  }, [isAuthenticated, role]);

  // Filter contracts
  useEffect(() => {
    let filtered = contracts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.freelanceJob?.title?.toLowerCase().includes(query) ||
          c.client?.firstName?.toLowerCase().includes(query) ||
          c.client?.lastName?.toLowerCase().includes(query) ||
          c.freelancer?.firstName?.toLowerCase().includes(query) ||
          c.freelancer?.lastName?.toLowerCase().includes(query),
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchQuery, statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchContracts();
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: { label: "Active", className: "bg-green-100 text-green-700" },
      COMPLETED: { label: "Completed", className: "bg-blue-100 text-blue-700" },
      DISPUTED: { label: "Disputed", className: "bg-red-100 text-red-700" },
      CANCELLED: { label: "Cancelled", className: "bg-gray-100 text-gray-700" },
    };
    return (
      statusMap[status] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  };

  const getRoleLabel = (contract: Contract) => {
    if (role === "client") {
      return {
        label: "Freelancer",
        name: `${contract.freelancer?.firstName || ""} ${contract.freelancer?.lastName || ""}`.trim(),
        email: contract.freelancer?.email,
      };
    }
    return {
      label: "Client",
      name: `${contract.client?.firstName || ""} ${contract.client?.lastName || ""}`.trim(),
      email: contract.client?.email,
    };
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
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
              onClick={handleRefresh}
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
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-green-600" />
                My Contracts
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
              {role === "client"
                ? "Contracts you've created"
                : "Contracts you're working on"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {contracts.length} total contracts
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setRole("client");
                setStatusFilter("");
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                role === "client"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              As Client
            </button>
            <button
              onClick={() => {
                setRole("freelancer");
                setStatusFilter("");
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                role === "freelancer"
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              As Freelancer
            </button>
          </div>
        </div>

        {/* Stats Summary */}
        {contracts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {contracts.filter((c) => c.status === "ACTIVE").length}
              </p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {contracts.filter((c) => c.status === "COMPLETED").length}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {contracts.filter((c) => c.status === "DISPUTED").length}
              </p>
              <p className="text-xs text-gray-500">Disputed</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {contracts.reduce((sum, c) => sum + c.agreedAmount, 0)}
              </p>
              <p className="text-xs text-gray-500">Total Value</p>
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
                  placeholder="Search by job or person..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white min-w-[160px]"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="DISPUTED">Disputed</option>
              <option value="CANCELLED">Cancelled</option>
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

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              {contracts.length === 0
                ? "No contracts yet"
                : "No matching contracts"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {contracts.length === 0
                ? "Contracts will appear here when you accept a bid."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContracts.map((contract) => {
              const status = getStatusBadge(contract.status);
              const otherParty = getRoleLabel(contract);
              const milestoneCount = contract.milestones?.length || 0;
              const completedMilestones =
                contract.milestones?.filter((m) => m.status === "APPROVED")
                  .length || 0;

              return (
                <Link
                  key={contract.id}
                  href={`/contracts/${contract.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-200 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {contract.freelanceJob?.title || "Untitled Job"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {contract.freelanceJob?.category?.label ||
                          "Uncategorized"}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {contract.currency}{" "}
                      {contract.agreedAmount.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDistanceToNow(new Date(contract.startedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCheck className="h-4 w-4" />
                      {completedMilestones}/{milestoneCount} milestones
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold">
                        {otherParty.name?.charAt(0) || "U"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {otherParty.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {otherParty.label} • {otherParty.email || "No email"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {contract.dispute && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-xs text-red-600">
                        Dispute in progress
                      </span>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Updated{" "}
                      {formatDistanceToNow(new Date(contract.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="text-sm font-medium text-green-600 group-hover:text-green-700 flex items-center gap-1">
                      View Details <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Icons
function FileCheck(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  );
}
