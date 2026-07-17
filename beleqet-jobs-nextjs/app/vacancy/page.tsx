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
  MapPin,
  SlidersHorizontal,
  Shield,
  Sparkles,
  TrendingUp,
  Code,
  PenTool,
  Megaphone,
  Building2,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { jobsService } from "@/lib/jobs";
import { freelanceService } from "@/lib/freelance";
import { formatDistanceToNow } from "date-fns";

// Unified Category Type
interface UnifiedCategory {
  id: string;
  label: string;
  slug: string;
  icon: string | null;
}

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

// Category icons mapping
const categoryIcons: Record<string, any> = {
  "web-development": Code,
  "writing-translation": PenTool,
  marketing: Megaphone,
  design: PenTool,
  programming: Code,
  sales: Megaphone,
  business: Building2,
  default: Briefcase,
};

export default function MarketplacePage() {
  const { user, isAuthenticated } = useAuth();
  const [items, setItems] = useState<JobItem[]>([]);
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<"all" | "job" | "freelance">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "jobs" | "freelance">(
    "all",
  );
  const CATEGORIES_TO_SHOW = 6;

  // Fetch categories from both services
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const [jobCats, freelanceCats] = await Promise.all([
          jobsService.getCategories(),
          freelanceService.getCategories(),
        ]);

        // Convert to unified type and merge
        const jobCategories: UnifiedCategory[] = (
          Array.isArray(jobCats) ? jobCats : []
        ).map((cat: any) => ({
          id: cat.id,
          label: cat.label,
          slug: cat.slug,
          icon: cat.icon || null,
        }));

        const freelanceCategories: UnifiedCategory[] = (
          Array.isArray(freelanceCats) ? freelanceCats : []
        ).map((cat: any) => ({
          id: cat.id,
          label: cat.label,
          slug: cat.slug,
          icon: cat.icon || null,
        }));

        // Merge and deduplicate by slug
        const merged = [...jobCategories, ...freelanceCategories];
        const unique = merged.filter(
          (cat, index, self) =>
            index === self.findIndex((c) => c.slug === cat.slug),
        );

        setCategories(unique);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch items based on filters
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        let allItems: JobItem[] = [];
        let total = 0;

        const params: any = {};
        if (query) params.q = query;
        if (category) params.category = category;
        params.page = 1;
        params.limit = 20;

        // Fetch based on active tab
        if (activeTab === "all" || activeTab === "jobs") {
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

        if (activeTab === "all" || activeTab === "freelance") {
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

        // Sort by createdAt (newest first)
        allItems.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

        setItems(allItems);
        setTotalItems(total);
      } catch (err: any) {
        console.error("Error fetching items:", err);
        setError(err.message || "Failed to load opportunities");
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchItems, 300);
    return () => clearTimeout(timeoutId);
  }, [query, category, activeTab]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const clearAllFilters = () => {
    setQuery("");
    setCategory("");
    setActiveTab("all");
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

  const getCategoryIcon = (slug: string) => {
    return categoryIcons[slug] || categoryIcons.default;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 max-w-7xl">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading opportunities...</p>
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

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row">
            <div className="flex-1 flex items-center gap-3 px-4 py-2.5">
              <Search className="h-5 w-5 text-gray-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for jobs, freelance projects, or keywords..."
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
              />
            </div>
            <div className="hidden md:block w-px bg-gray-200" />
            <button
              type="submit"
              className="md:ml-1 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Active Filters */}
        {(category || query || activeTab !== "all") && (
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
            {activeTab !== "all" && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
                {activeTab === "jobs" ? "Full-Time Jobs" : "Freelance Gigs"}
                <button
                  onClick={() => setActiveTab("all")}
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
          <SlidersHorizontal className="h-4 w-4" />
          Filters & Categories
          {(category || activeTab !== "all") && (
            <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {[category, activeTab !== "all"].filter(Boolean).length} active
            </span>
          )}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`${showFilters ? "block" : "hidden"} lg:block space-y-6`}
          >
            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Opportunity Type
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "all"
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All Opportunities
                </button>
                <button
                  onClick={() => setActiveTab("jobs")}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "jobs"
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Full-Time Jobs
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("freelance")}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeTab === "freelance"
                      ? "bg-purple-50 text-purple-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Freelance Gigs
                  </span>
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
                <Filter className="h-4 w-4 text-gray-500" />
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
                {visibleCategories.map((cat) => {
                  const Icon = getCategoryIcon(cat.slug);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.slug)}
                      className={`flex w-full items-center gap-2 text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        category === cat.slug
                          ? "bg-green-50 text-green-700 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-4 w-4 text-gray-400" />
                      <span className="flex-1">{cat.label}</span>
                      <span className="text-xs text-gray-400">
                        {
                          items.filter((i) => i.category.slug === cat.slug)
                            .length
                        }
                      </span>
                    </button>
                  );
                })}
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

            {/* Post Button */}
            {isAuthenticated && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Post an Opportunity
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Find the perfect talent for your project or company
                </p>
                <div className="space-y-2">
                  {user?.role === "EMPLOYER" && (
                    <>
                      <Link
                        href="/post-job"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Building2 className="h-4 w-4" />
                        Post a Job
                      </Link>
                      <Link
                        href="/freelance/post"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors text-sm"
                      >
                        <Briefcase className="h-4 w-4" />
                        Post a Freelance Gig
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Listings */}
          <div>
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
                {(query || category || activeTab !== "all") && (
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
                      {items.length}
                    </span>{" "}
                    {activeTab === "all"
                      ? "opportunities"
                      : activeTab === "jobs"
                        ? "jobs"
                        : "gigs"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Sort by:</span>
                    <select className="text-sm border-0 bg-transparent font-medium text-gray-700 focus:ring-0">
                      <option>Most Recent</option>
                      <option>Budget (High to Low)</option>
                      <option>Most Popular</option>
                    </select>
                  </div>
                </div>

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
                        href={
                          isJob ? `/jobs/${item.id}` : `/freelance/${item.id}`
                        }
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
                                    {item.client?.firstName}{" "}
                                    {item.client?.lastName}
                                  </span>
                                  <span className="text-xs text-gray-300">
                                    •
                                  </span>
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

                {items.length >= 20 && (
                  <div className="text-center mt-8">
                    <button className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                      Load More
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
