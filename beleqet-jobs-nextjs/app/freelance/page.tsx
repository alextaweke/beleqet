// app/freelance/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Briefcase,
  Filter,
  ChevronDown,
  ChevronUp,
  X,
  DollarSign,
  Clock,
  User,
  Star,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { freelanceService } from "@/lib/freelance";
import { formatDistanceToNow } from "date-fns";

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

interface Category {
  id: string;
  label: string;
  slug: string;
  icon: string | null;
}

export default function FreelancePage() {
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<FreelanceJob[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const CATEGORIES_TO_SHOW = 5;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await freelanceService.getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const params: any = {};
        if (query) params.q = query;
        if (category) params.category = category;
        params.page = 1;
        params.limit = 20;

        const response = await freelanceService.getJobs(params);
        setJobs(response?.items || []);
        setTotalJobs(response?.total || 0);
      } catch (err: any) {
        console.error("Error fetching freelance jobs:", err);
        setError(err.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timeoutId);
  }, [query, category]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const clearAllFilters = () => {
    setQuery("");
    setCategory("");
  };

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, CATEGORIES_TO_SHOW);

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
    };
    return (
      statusMap[status] || {
        label: status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 max-w-7xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading freelance jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 max-w-7xl">
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Freelance Gigs
              </h1>
              <p className="text-gray-600 mt-1">
                Find freelance opportunities and projects
              </p>
            </div>
            {isAuthenticated && user?.role === "EMPLOYER" && (
              <Link
                href="/freelance/post"
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <Briefcase className="h-5 w-5" />
                Post a Gig
              </Link>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {totalJobs.toLocaleString()} gigs found
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-1.5 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for freelance gigs..."
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="md:ml-1 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Active Filters */}
        {(category || query) && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs text-gray-500 font-medium mr-1">
              Active filters:
            </span>
            {query && (
              <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                {query}
                <button
                  onClick={() => setQuery("")}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                {categories.find((c) => c.slug === category)?.label || category}
                <button
                  onClick={() => setCategory("")}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-gray-500 hover:text-red-500 transition-colors ml-1"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter Toggle - Mobile */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 mb-4 hover:bg-gray-50 transition-colors w-full justify-center"
        >
          <Filter className="h-4 w-4" />
          Filters
          {category && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              1 active
            </span>
          )}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${showFilters ? "block" : "hidden"} lg:block space-y-6`}
          >
            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                <Briefcase className="h-4 w-4 text-gray-500" />
                Categories
                <span className="ml-auto text-xs text-gray-400">
                  {categories.length}
                </span>
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setCategory("")}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    category === ""
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Categories
                </button>
                {visibleCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.slug)}
                    className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      category === cat.slug
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              {categories.length > CATEGORIES_TO_SHOW && (
                <button
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="flex items-center gap-1 mt-3 text-sm text-green-600 hover:text-green-700 font-medium transition-colors w-full justify-center"
                >
                  {showAllCategories ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show {categories.length - CATEGORIES_TO_SHOW} more
                    </>
                  )}
                </button>
              )}
            </div>
          </aside>

          {/* Job Listings */}
          <div>
            {jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No gigs found
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Try adjusting your search or clearing your filters.
                </p>
                {(query || category) && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-4 text-sm text-green-600 hover:text-green-700 font-medium"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <p className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-medium text-gray-900">
                      {jobs.length}
                    </span>{" "}
                    gigs
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jobs.map((job) => {
                    const status = getStatusBadge(job.status);
                    return (
                      <Link
                        key={job.id}
                        href={`/freelance/${job.id}`}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-200 transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">
                                {job.title}
                              </h3>
                              {job.featured && (
                                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full whitespace-nowrap">
                                  ⭐ Featured
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {job.client?.firstName} {job.client?.lastName}
                            </p>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5" />
                            {job.currency} {job.budgetMin} - {job.budgetMax}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {job.deadlineDays} days
                          </span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {job._count.bids} bids
                          </span>
                        </div>

                        <p className="text-xs text-gray-500 mt-3 line-clamp-2">
                          {job.description}
                        </p>

                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <span
                                key={index}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{job.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(job.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                          <span className="text-xs font-medium text-green-600 group-hover:text-green-700">
                            View Details →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {jobs.length >= 20 && (
                  <div className="text-center mt-8">
                    <button className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Load More Gigs
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
