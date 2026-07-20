import Link from "next/link";
import { MapPin, Bookmark, Building2 } from "lucide-react";
import { JobType, jobTypeLabels, jobTypeColors } from "@/types/jobs";
import type { JobResponse } from "@/lib/jobs";
import { formatDistanceToNow } from "date-fns";

export default function JobCard({ job }: { job: JobResponse }) {
  // Safety check - if job is undefined, return null
  if (!job) {
    return null;
  }

  // Safely handle date formatting
  let postedAgo = "Recently";
  try {
    if (job.createdAt) {
      postedAgo = formatDistanceToNow(new Date(job.createdAt), {
        addSuffix: true,
      });
    }
  } catch (error) {
    postedAgo = "Recently";
  }

  const typeLabel = jobTypeLabels[job.type as JobType] || job.type || "Unknown";
  const typeColor =
    jobTypeColors[job.type as JobType] || "bg-gray-100 text-gray-700";

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-5 hover:border-green-500 hover:shadow-lg transition-all duration-200 h-full"
    >
      <div className="flex items-start justify-between">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
          <Building2 className="h-5 w-5" />
        </span>
        <Bookmark className="h-4 w-4 text-gray-400 group-hover:text-green-500 transition-colors cursor-pointer" />
      </div>

      <h3 className="text-lg font-semibold mt-3 text-gray-900 leading-snug line-clamp-2">
        {job.title}
      </h3>
      <p className="text-sm text-gray-600 mt-1">
        {job.company?.name || job.companyName || "Company"}
      </p>

      <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
        <MapPin className="h-3.5 w-3.5" />
        {job.location || "Location not specified"}
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${typeColor}`}
        >
          {typeLabel}
        </span>
        <span className="text-[11px] text-gray-500">{postedAgo}</span>
      </div>

      {job.salaryMin && job.salaryMax && (
        <div className="mt-2 text-xs text-gray-600 font-medium">
          {job.currency || "$"} {job.salaryMin.toLocaleString()} -{" "}
          {job.salaryMax.toLocaleString()}
        </div>
      )}

      {/* Show featured/urgent badges */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {job.featured && (
          <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
            ⭐ Featured
          </span>
        )}
        {job.urgent && (
          <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
            🔥 Urgent
          </span>
        )}
      </div>
    </Link>
  );
}
