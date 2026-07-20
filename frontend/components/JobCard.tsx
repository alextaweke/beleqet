"use client";

import Link from "next/link";
import {
  MapPin,
  Bookmark,
  Building2,
  Sparkles,
  ChevronRight,
  Clock,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { JobType, jobTypeLabels, jobTypeColors } from "@/types/jobs";
import type { JobResponse } from "@/lib/jobs";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface JobCardProps {
  job: JobResponse;
  featured?: boolean;
  compact?: boolean;
  className?: string;
}

export default function JobCard({
  job,
  featured = false,
  compact = false,
  className = "",
}: JobCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Safety check
  if (!job) return null;

  // Format date
  let postedAgo = "Recently";
  try {
    if (job.createdAt) {
      postedAgo = formatDistanceToNow(new Date(job.createdAt), {
        addSuffix: true,
      });
    }
  } catch {
    postedAgo = "Recently";
  }

  const typeLabel = jobTypeLabels[job.type as JobType] || job.type || "Unknown";
  const typeColor =
    jobTypeColors[job.type as JobType] || "bg-gray-100 text-gray-700";

  // Get company name
  const companyName = job.company?.name || job.companyName || "Company";

  // Get location
  const location = job.location || "Remote";

  // Handle bookmark toggle
  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  // Compact mode for sidebars
  if (compact) {
    return (
      <Link
        href={`/jobs/${job.id}`}
        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
          <Building2 className="h-5 w-5 text-gray-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 group-hover:text-green-600 transition-colors truncate">
            {job.title}
          </h4>
          <p className="text-xs text-gray-500 truncate">{companyName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColor}`}
            >
              {typeLabel}
            </span>
            <span className="text-[10px] text-gray-400">{postedAgo}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-green-500 transition-colors" />
      </Link>
    );
  }

  return (
    <Link
      href={`/jobs/${job.id}`}
      className={`group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-green-400 hover:shadow-xl hover:-translate-y-1 h-full ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Featured Badge */}
      {(featured || job.featured) && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-[10px] font-medium rounded-full shadow-sm">
            <Sparkles className="h-3 w-3" />
            Featured
          </span>
        </div>
      )}

      {/* Top Section: Logo + Bookmark */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
            <Building2 className="h-6 w-6 text-gray-500 group-hover:text-green-600 transition-colors" />
          </div>
          {/* Company Name */}
          <div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-green-600 transition-colors line-clamp-1">
              {companyName}
            </p>
            {job.verified && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`p-1.5 rounded-lg transition-all duration-300 ${
            isBookmarked
              ? "bg-green-50 text-green-600"
              : "text-gray-400 hover:bg-gray-100 hover:text-green-500"
          }`}
        >
          <Bookmark
            className={`h-4 w-4 ${isBookmarked ? "fill-green-600" : ""}`}
          />
        </button>
      </div>

      {/* Job Title */}
      <h3 className="text-lg font-semibold mt-3 text-gray-900 leading-snug line-clamp-2 group-hover:text-green-600 transition-colors">
        {job.title}
      </h3>

      {/* Description (optional) */}
      {job.description && (
        <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
          {job.description.replace(/<[^>]*>/g, "").substring(0, 120)}...
        </p>
      )}

      {/* Location */}
      <div className="flex items-center gap-1 text-sm text-gray-500 mt-3">
        <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <span>{location}</span>
        {job.type && (
          <>
            <span className="text-gray-300 mx-1">•</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}
            >
              {typeLabel}
            </span>
          </>
        )}
      </div>

      {/* Salary Range */}
      {job.salaryMin && job.salaryMax && (
        <div className="flex items-center gap-1 mt-2 text-sm font-medium text-gray-700">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span>
            {job.currency || "$"} {job.salaryMin.toLocaleString()} -{" "}
            {job.salaryMax.toLocaleString()}
          </span>
          <span className="text-xs font-normal text-gray-400 ml-1">
            / {job.salaryType || "year"}
          </span>
        </div>
      )}

      {/* Tags / Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {job.urgent && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-600 px-2 py-0.5 rounded-full">
            🔥 Urgent
          </span>
        )}
        {job.featured && !featured && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
            ⭐ Featured
          </span>
        )}
        {job.tags?.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
        {job.tags && job.tags.length > 2 && (
          <span className="text-[10px] text-gray-400">
            +{job.tags.length - 2}
          </span>
        )}
      </div>

      {/* Footer: Posted time + Applications */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          <span>{postedAgo}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Briefcase className="h-3.5 w-3.5" />
          <span>{job._count?.applications || 0} applications</span>
        </div>
      </div>

      {/* Hover Effect: View Details */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </Link>
  );
}

// Helper component for Verified badge
function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  );
}
