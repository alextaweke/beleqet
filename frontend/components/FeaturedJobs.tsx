"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import JobCard from "./JobCard";
import { jobsService } from "@/lib/jobs";
import type { JobResponse } from "@/lib/jobs";

export default function FeaturedJobs() {
  const [featuredJobs, setFeaturedJobs] = useState<JobResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await jobsService.findAll({
          page: 1,
          limit: 50,
        });

        const featured = response.items.filter((job) => job.featured === true);
        setFeaturedJobs(featured);
      } catch (error) {
        console.error("Failed to fetch featured jobs:", error);
        setError("Failed to load featured jobs");
        setFeaturedJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedJobs();
  }, []);

  if (loading) {
    return (
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-14 max-w-7xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Featured Jobs
                </h2>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Fresh opportunities from companies hiring right now.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-xl border border-gray-200 bg-white p-5 h-64">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-14 max-w-7xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Featured Jobs
                </h2>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Fresh opportunities from companies hiring right now.
              </p>
            </div>
          </div>
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600">Unable to load featured jobs</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-green-600 hover:underline font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (featuredJobs.length === 0) {
    return (
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="container mx-auto px-4 py-14 max-w-7xl">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Featured Jobs
                </h2>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                Fresh opportunities from companies hiring right now.
              </p>
            </div>
            <Link
              href="/jobs"
              className="group hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
            >
              View all jobs
              <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-gray-600">
              No featured jobs available at the moment.
            </p>
            <Link
              href="/jobs"
              className="inline-block mt-3 text-green-600 hover:text-green-700 font-medium"
            >
              Browse all jobs →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 border-y border-gray-200">
      <div className="container mx-auto px-4 py-14 max-w-7xl">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Featured Jobs
              </h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Fresh opportunities from companies hiring right now.
            </p>
          </div>
          <Link
            href="/jobs"
            className="group hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
          >
            View all jobs
            <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Featured Jobs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {featuredJobs.map((job) => (
            <div
              key={job.id}
              className="hover:-translate-y-1 transition-transform duration-300"
            >
              <JobCard job={job} />
            </div>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="sm:hidden text-center mt-6">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
          >
            View all jobs
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
