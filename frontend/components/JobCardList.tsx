// components/JobCardList.tsx - For list view like Upwork
"use client";

import Link from "next/link";
import {
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { JobType, jobTypeLabels, jobTypeColors } from "@/types/jobs";
import type { JobResponse } from "@/lib/jobs";
import { formatDistanceToNow } from "date-fns";

export default function JobCardList({ job }: { job: JobResponse }) {
  if (!job) return null;

  const postedAgo = job.createdAt
    ? formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })
    : "Recently";

  const typeLabel = jobTypeLabels[job.type as JobType] || job.type || "Unknown";
  const typeColor =
    jobTypeColors[job.type as JobType] || "bg-gray-100 text-gray-700";
  const companyName = job.company?.name || job.companyName || "Company";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white hover:border-green-400 hover:shadow-lg transition-all duration-200"
    >
      {/* Logo */}
      <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <Building2 className="h-7 w-7 text-gray-500 group-hover:text-green-600 transition-colors" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
            {job.title}
          </h3>
          {job.featured && (
            <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              ⭐ Featured
            </span>
          )}
          {job.urgent && (
            <span className="text-xs font-medium bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              🔥 Urgent
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{companyName}</span>
          <span className="text-gray-300">•</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {job.location || "Remote"}
          </span>
          <span className="text-gray-300">•</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor}`}
          >
            {typeLabel}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
          {job.salaryMin && job.salaryMax && (
            <span className="flex items-center gap-1 font-medium text-gray-700">
              <DollarSign className="h-4 w-4 text-green-600" />
              {job.currency || "$"} {job.salaryMin.toLocaleString()} -{" "}
              {job.salaryMax.toLocaleString()}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {postedAgo}
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" />
            {job._count?.applications || 0} applications
          </span>
        </div>

        {job.tags && job.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {job.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-green-500 group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}
