"use client";
// app/jobs/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Clock,
  Building2,
  ArrowLeft,
  Briefcase,
  DollarSign,
  Users,
  Globe,
  Mail,
  Phone,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { jobsService } from "@/lib/jobs";
import { jobTypeLabels, jobTypeColors } from "@/types/jobs";
import { formatDistanceToNow } from "date-fns";
import ApplyButton from "@/components/ApplyButton";
import DeleteJobButton from "@/components/DeleteJobButton";

// Use dynamic rendering instead of static generation
export const dynamic = "force-dynamic";

// ============================================
// Client-side Job Actions Component
// ============================================

import { useState, useEffect } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

function JobActions({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const [canEditDelete, setCanEditDelete] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (
      isAuthenticated &&
      (user?.role === "ADMIN" || user?.role === "EMPLOYER")
    ) {
      setCanEditDelete(true);
    }
  }, [isAuthenticated, user]);

  if (!canEditDelete) return null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/vacancy/${jobId}/edit`}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
      >
        <Pencil className="h-4 w-4" />
        Edit Job
      </Link>
      <DeleteJobButton jobId={jobId} jobTitle={jobTitle} />
    </div>
  );
}

// ============================================
// Server Component - Job Detail Page
// ============================================
export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Make sure params.id exists
  if (!params?.id) {
    console.error("No job ID provided");
    notFound();
  }

  let job;
  try {
    job = await jobsService.findOne(params.id);
  } catch (error) {
    console.error("Error fetching job:", error);
    notFound();
  }

  if (!job) {
    console.error("Job not found for ID:", params.id);
    notFound();
  }

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

  const typeLabel = jobTypeLabels[job.type] || job.type || "Unknown";
  const typeColor = jobTypeColors[job.type] || "bg-gray-100 text-gray-700";

  const isExpired = job.deadline && new Date(job.deadline) < new Date();
  const isDeadlineSoon =
    job.deadline &&
    new Date(job.deadline) > new Date() &&
    new Date(job.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isFilled = job.filled === true;
  const isAvailable = !isExpired && !isFilled;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Back button */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          href="/vacancy"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-green-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all vacancy
        </Link>

        {/* Client-side Edit/Delete buttons */}
        <JobActions jobId={job.id} jobTitle={job.title} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 text-gray-500 shrink-0">
                <Building2 className="h-6 w-6" />
              </span>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug">
                  {job.title}
                </h1>
                <p className="text-gray-600 mt-1">
                  {job.company?.name || job.companyName || "Company"}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {job.location || "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> {postedAgo}
                  </span>
                  <span
                    className={`rounded-full font-semibold px-2.5 py-1 ${typeColor}`}
                  >
                    {typeLabel}
                  </span>
                  {job.featured && (
                    <span className="rounded-full bg-yellow-100 text-yellow-800 font-semibold px-2.5 py-1">
                      ⭐ Featured
                    </span>
                  )}
                  {job.urgent && (
                    <span className="rounded-full bg-red-100 text-red-800 font-semibold px-2.5 py-1">
                      🔥 Urgent
                    </span>
                  )}
                  {isFilled && (
                    <span className="rounded-full bg-gray-100 text-gray-700 font-semibold px-2.5 py-1">
                      Filled
                    </span>
                  )}
                  {isExpired && !isFilled && (
                    <span className="rounded-full bg-red-100 text-red-700 font-semibold px-2.5 py-1">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!isAvailable && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start gap-2 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    {isFilled
                      ? "This position has been filled"
                      : "Application deadline has passed"}
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Please check our other available positions.
                  </p>
                </div>
              </div>
            )}

            {job.salaryMin && job.salaryMax && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-2 border border-green-200">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-gray-900">
                  {job.currency || "$"} {job.salaryMin.toLocaleString()} -{" "}
                  {job.salaryMax.toLocaleString()}
                  {job.salaryType && ` (${job.salaryType})`}
                </span>
              </div>
            )}

            <div className="mt-7 pt-7 border-t border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Job Description
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {job.description || "No description provided."}
              </div>
            </div>

            {job.requirements && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Requirements
                </h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {job.requirements}
                </div>
              </div>
            )}

            {job.tags && job.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-2 gap-4">
              {job.vacancies && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>
                    {job.vacancies}{" "}
                    {job.vacancies === 1 ? "vacancy" : "vacancies"}
                  </span>
                </div>
              )}
              {job.experienceLevel && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="h-4 w-4" />
                  <span>{job.experienceLevel}</span>
                </div>
              )}
              {job.yearsOfExperience && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{job.yearsOfExperience} years experience</span>
                </div>
              )}
              {job.gender && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>👤 {job.gender}</span>
                </div>
              )}
              {job.qualification && (
                <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
                  <span>🎓 {job.qualification}</span>
                </div>
              )}
              {job.jobSite && (
                <div className="col-span-2 flex items-center gap-2 text-sm text-gray-600">
                  <Globe className="h-4 w-4" />
                  <span>{job.jobSite}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sticky top-8">
            {/* Status Messages */}
            {isFilled ? (
              <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm text-gray-700 text-center font-semibold">
                ❌ This position has been filled
              </div>
            ) : isExpired ? (
              <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-800 text-center">
                ❌ Application deadline passed
              </div>
            ) : job.deadline && isDeadlineSoon ? (
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                ⚠️ Apply by{" "}
                {new Date(job.deadline).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                <br />
                <span className="text-xs">Application closes soon!</span>
              </div>
            ) : job.deadline ? (
              <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                📅 Apply by{" "}
                {new Date(job.deadline).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            ) : null}

            {/* Apply Button */}
            <ApplyButton job={job} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Company Information
            </h3>
            <p className="font-semibold text-gray-900">
              {job.company?.name || job.companyName || "Company"}
            </p>
            {job.company?.location && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.company.location}
              </p>
            )}
            {job.contactPhone && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> {job.contactPhone}
              </p>
            )}
            {job.applyEmail && isAvailable && (
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {job.applyEmail}
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
