"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Search, MapPin, SlidersHorizontal } from "lucide-react";
import JobCard from "@/components/JobCard";
import { jobsService } from "@/lib/jobs";
import { JobType, jobTypeLabels } from "@/types/jobs";
import type { JobResponse, Category } from "@/lib/jobs";

export default function JobsListing() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [location, setLocation] = useState(searchParams.get("loc") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [type, setType] = useState<string>("");
  const [jobs, setJobs] = useState<JobResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await jobsService.getCategories();
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
      setLoading(true);
      setError(null);
      try {
        const params: any = {};
        if (query) params.q = query;
        if (location) params.location = location;
        if (category) params.category = category;
        if (type) params.type = type;

        const response = await jobsService.findAll(params);
        setJobs(response?.items || []);
        setTotalJobs(response?.total || 0);
      } catch (error: any) {
        console.error("Failed to fetch jobs:", error);
        setError(error.message || "Failed to load jobs");
        setJobs([]);
        setTotalJobs(0);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timeoutId);
  }, [query, location, category, type]);

  if (loading && jobs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading jobs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600 font-semibold">Error loading jobs</p>
          <p className="text-sm text-red-500 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Search verified jobs from trusted employers.
        </h1>
        <p className="text-gray-600 text-sm mt-2">{totalJobs} jobs found</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-2 flex flex-col sm:flex-row gap-2 mb-8">
        <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-xl">
          <Search className="h-4 w-4 text-gray-500 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, keyword or company"
            className="w-full text-sm text-gray-900 placeholder:text-gray-500 outline-none bg-transparent"
          />
        </div>
        <div className="hidden sm:block w-px bg-gray-200 my-1" />
        <div className="flex items-center flex-1 gap-2 px-3 py-2.5 rounded-xl">
          <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="w-full text-sm text-gray-900 placeholder:text-gray-500 outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
        <aside className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Category
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setCategory("")}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  category === ""
                    ? "bg-green-50 text-green-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.slug)}
                  className={`flex w-full items-center justify-between text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    category === cat.slug
                      ? "bg-green-50 text-green-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className="text-xs">{cat.count || 0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Job Type
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setType("")}
                className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  type === ""
                    ? "bg-green-50 text-green-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                All Types
              </button>
              {Object.entries(jobTypeLabels).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    type === value
                      ? "bg-green-50 text-green-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div>
          {jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
              <p className="text-gray-900 font-semibold">
                No jobs match your filters
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Try adjusting your search or clearing filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
