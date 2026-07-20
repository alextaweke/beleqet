// app/marketplace/page.tsx - Update with AdvancedSearch
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  Clock,
  User,
  Star,
  MapPin,
  Building2,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { jobsService } from "@/lib/jobs";
import { freelanceService } from "@/lib/freelance";
import { formatDistanceToNow } from "date-fns";
import AdvancedSearch from "@/components/AdvancedSearch";
import { useSavedSearches } from "@/hooks/useSavedSearches";

// Types
interface JobItem {
  id: string;
  title: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  type: "job" | "freelance";
  status: string;
  featured: boolean;
  createdAt: string;
  location?: string;
  skills: string[];
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
    bids?: number;
    applications?: number;
  };
  deadlineDays?: number;
  pricingType?: string;
}

interface SearchFilters {
  query: string;
  type: "all" | "jobs" | "freelance";
  category: string;
  location: string;
  minBudget: number;
  maxBudget: number;
  minSalary: number;
  maxSalary: number;
  experienceLevel: string;
  remote: boolean;
  featured: boolean;
  urgent: boolean;
  skills: string[];
  sortBy: "recent" | "budget_high" | "budget_low" | "popular";
}

export default function MarketplacePage() {
  const { user, isAuthenticated } = useAuth();
  const { savedSearches, saveSearch } = useSavedSearches();
  const [items, setItems] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    type: "all",
    category: "",
    location: "",
    minBudget: 0,
    maxBudget: 100000,
    minSalary: 0,
    maxSalary: 500000,
    experienceLevel: "",
    remote: false,
    featured: false,
    urgent: false,
    skills: [],
    sortBy: "recent",
  });

  // Fetch items based on filters
  const fetchItems = async (searchFilters: SearchFilters) => {
    try {
      setLoading(true);
      let allItems: JobItem[] = [];
      let total = 0;

      const params: any = {};
      if (searchFilters.query) params.q = searchFilters.query;
      if (searchFilters.category) params.category = searchFilters.category;
      if (searchFilters.location) params.location = searchFilters.location;
      if (searchFilters.type === "jobs") params.type = "FULL_TIME";
      params.page = 1;
      params.limit = 20;

      if (searchFilters.type === "all" || searchFilters.type === "jobs") {
        try {
          const jobResponse = await jobsService.findAll(params);
          const jobs = (jobResponse?.items || []).map((job: any) => ({
            ...job,
            type: "job" as const,
            _count: { applications: job._count?.applications || 0 },
          }));
          allItems = [...allItems, ...jobs];
          total += jobResponse?.total || 0;
        } catch (err) {
          console.error("Error fetching jobs:", err);
        }
      }

      if (searchFilters.type === "all" || searchFilters.type === "freelance") {
        try {
          const freelanceResponse = await freelanceService.getJobs(params);
          const freelance = (freelanceResponse?.items || []).map(
            (gig: any) => ({
              ...gig,
              type: "freelance" as const,
              _count: { bids: gig._count?.bids || 0 },
            }),
          );
          allItems = [...allItems, ...freelance];
          total += freelanceResponse?.total || 0;
        } catch (err) {
          console.error("Error fetching freelance gigs:", err);
        }
      }

      // Sort
      switch (searchFilters.sortBy) {
        case "budget_high":
          allItems.sort((a, b) => (b.budgetMax || 0) - (a.budgetMax || 0));
          break;
        case "budget_low":
          allItems.sort((a, b) => (a.budgetMax || 0) - (b.budgetMax || 0));
          break;
        case "popular":
          allItems.sort(
            (a, b) =>
              (b._count.applications || 0) - (a._count.applications || 0),
          );
          break;
        default:
          allItems.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
      }

      setItems(allItems);
      setTotalItems(total);
      setFilters(searchFilters);
    } catch (err: any) {
      console.error("Error fetching items:", err);
      setError(err.message || "Failed to load opportunities");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchItems(filters);
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      OPEN: { label: "Open", className: "bg-green-100 text-green-700" },
      FUNDED: { label: "Funded", className: "bg-blue-100 text-blue-700" },
      IN_PROGRESS: {
        label: "In Progress",
        className: "bg-purple-100 text-purple-700",
      },
      COMPLETED: { label: "Completed", className: "bg-gray-100 text-gray-700" },
      CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
      PUBLISHED: {
        label: "Published",
        className: "bg-green-100 text-green-700",
      },
      CLOSED: { label: "Closed", className: "bg-gray-100 text-gray-700" },
    };
    return (
      statusMap[status] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  };

  const getTypeBadge = (type: string) => {
    return type === "job"
      ? { label: "Full-Time", className: "bg-blue-100 text-blue-700" }
      : { label: "Freelance", className: "bg-purple-100 text-purple-700" };
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading opportunities...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <p className="text-red-600 font-semibold">Error: {error}</p>
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
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-8 md:p-12 mb-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Find Your Next Opportunity
            </h1>
            <p className="text-green-100 text-lg mb-6">
              Discover full-time jobs and freelance projects from trusted
              employers
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span className="font-semibold">{totalItems}</span>
                <span className="text-green-100">Opportunities</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <span className="font-semibold">
                  {items.filter((i) => i.featured).length}
                </span>
                <span className="text-green-100">Featured</span>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Search Component */}
        <AdvancedSearch
          onSearch={fetchItems}
          onSaveSearch={saveSearch}
          savedSearches={savedSearches}
          initialFilters={filters}
          className="mb-8"
        />

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Showing{" "}
            <span className="font-medium text-gray-900">{items.length}</span>{" "}
            {filters.type === "all"
              ? "opportunities"
              : filters.type === "jobs"
                ? "jobs"
                : "gigs"}
          </p>
        </div>

        {/* Results Grid */}
        {items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No opportunities found
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Try adjusting your search or clearing your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => {
              const status = getStatusBadge(item.status);
              const typeBadge = getTypeBadge(item.type);
              const initials = getInitials(
                item.client?.firstName,
                item.client?.lastName,
              );
              const isJob = item.type === "job";

              return (
                <Link
                  key={item.id}
                  href={isJob ? `/jobs/${item.id}` : `/freelance/${item.id}`}
                  className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center font-semibold text-sm">
                        {initials || "U"}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {item.title}
                            </h3>
                            {item.featured && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                ⭐ Featured
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-sm text-gray-500">
                              {item.client?.firstName} {item.client?.lastName}
                            </span>
                            <span className="text-xs text-gray-300">•</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeBadge.className}`}
                            >
                              {typeBadge.label}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                        {item.budgetMin || item.salaryMin ? (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {item.currency}{" "}
                            {isJob
                              ? `${item.salaryMin} - ${item.salaryMax}`
                              : `${item.budgetMin} - ${item.budgetMax}`}
                            <span className="text-xs text-gray-400 ml-1">
                              {isJob ? "/year" : item.pricingType}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="h-4 w-4" />
                            Not specified
                          </span>
                        )}
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {item.location}
                          </span>
                        )}
                        {item.deadlineDays && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {item.deadlineDays} days
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          {isJob
                            ? `${item._count.applications || 0} applicants`
                            : `${item._count.bids || 0} proposals`}
                        </span>
                      </div>

                      {/* Description Preview */}
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {item.description}
                      </p>

                      {/* Skills */}
                      {item.skills && item.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.skills.slice(0, 4).map((skill, index) => (
                            <span
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {item.skills.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{item.skills.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          Posted{" "}
                          {formatDistanceToNow(new Date(item.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span className="text-sm font-medium text-green-600 group-hover:text-green-700 flex items-center gap-1">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Load More */}
        {items.length >= 20 && (
          <div className="text-center mt-8">
            <button className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
