"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

        // Fetch all jobs
        const response = await jobsService.findAll({
          page: 1,
          limit: 50, // Fetch enough to get featured jobs
        });

        // Filter only featured jobs from the response
        const featured = response.items.filter((job) => job.featured === true);

        // Only show featured jobs, don't fallback to regular jobs
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
      <section className="bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 py-14 max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Jobs
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Fresh opportunities from companies hiring right now.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
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
      <section className="bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 py-14 max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Jobs
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Fresh opportunities from companies hiring right now.
              </p>
            </div>
          </div>
          <div className="text-center py-8 text-gray-600">
            <p>Unable to load featured jobs</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-green-600 hover:underline"
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
      <section className="bg-white border-y border-gray-200">
        <div className="container mx-auto px-4 py-14 max-w-7xl">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Featured Jobs
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Fresh opportunities from companies hiring right now.
              </p>
            </div>
            <Link
              href="/jobs"
              className="hidden sm:inline-block text-sm font-semibold text-green-600 hover:underline shrink-0"
            >
              View all jobs →
            </Link>
          </div>
          <div className="text-center py-12 text-gray-600">
            <p>No featured jobs available at the moment.</p>
            <Link
              href="/jobs"
              className="text-green-600 hover:underline mt-2 inline-block"
            >
              Browse all jobs →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border-y border-gray-200">
      <div className="container mx-auto px-4 py-14 max-w-7xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Jobs</h2>
            <p className="text-gray-600 text-sm mt-1">
              Fresh opportunities from companies hiring right now.
            </p>
          </div>
          <Link
            href="/jobs"
            className="hidden sm:inline-block text-sm font-semibold text-green-600 hover:underline shrink-0"
          >
            View all jobs →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {featuredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </div>
    </section>
  );
}
