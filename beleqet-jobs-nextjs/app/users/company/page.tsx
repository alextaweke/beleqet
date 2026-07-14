// app/company/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Calendar,
  CheckCircle,
  Award,
  Briefcase,
  DollarSign,
  Clock,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Facebook,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/lib/config";
import { formatDistanceToNow } from "date-fns";

interface Company {
  id: string;
  name: string;
  description: string;
  logoUrl: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  verified: boolean;
  location: string | null;
  foundedYear: number | null;
  coverImageUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  benefits: string[];
  jobs: Job[];
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  location: string;
  type: string;
  salaryMin: number;
  salaryMax: number;
  currency: string;
  deadline: string;
  status: string;
  featured: boolean;
  urgent: boolean;
  filled: boolean;
  tags: string[];
  vacancies: number;
  experienceLevel: string;
  yearsOfExperience: string;
  createdAt: string;
  applyUrl?: string;
  applyEmail?: string;
}

export default function CompanyProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setError("Please login to view company profile");
          setLoading(false);
          return;
        }

        // Fetch company data
        const data = await apiFetch("/users/company", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Company data:", data);
        setCompany(data);
      } catch (err: any) {
        console.error("Error fetching company:", err);
        setError(err.message || "Failed to load company profile");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchCompany();
    } else {
      setError("Please login to view your company profile");
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading company profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No Company Found
          </h3>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
          <Link
            href="/company/create"
            className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Company Profile
          </Link>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No Company Profile
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            You haven't created a company profile yet.
          </p>
          <Link
            href="/company/create"
            className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Company Profile
          </Link>
        </div>
      </div>
    );
  }

  const activeJobs =
    company.jobs?.filter((job) => job.status === "PUBLISHED" && !job.filled) ||
    [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Cover Image */}
        <div className="relative rounded-2xl overflow-hidden h-48 md:h-64 bg-gradient-to-r from-green-500 to-green-700 mb-6">
          {company.coverImageUrl ? (
            <img
              src={company.coverImageUrl}
              alt={company.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-20 w-20 text-white/30" />
            </div>
          )}
          <div className="absolute bottom-4 right-4">
            {company.verified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                <CheckCircle className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
        </div>

        {/* Company Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap items-start gap-6">
            {/* Logo */}
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="h-12 w-12 text-gray-400" />
              )}
            </div>

            {/* Company Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {company.name}
                </h1>
                {company.verified && (
                  <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" />
                    {company.industry}
                  </span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {company.size}
                  </span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {company.location}
                  </span>
                )}
                {company.foundedYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Founded {company.foundedYear}
                  </span>
                )}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-3 mt-3">
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                )}
                {company.linkedinUrl && (
                  <a
                    href={company.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {company.twitterUrl && (
                  <a
                    href={company.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-500 hover:underline"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {company.facebookUrl && (
                  <a
                    href={company.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800 hover:underline"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </a>
                )}
              </div>
            </div>

            <Link
              href="/company/edit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
            >
              Edit Company
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                About
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {company.description || "No description provided."}
              </p>
            </div>

            {/* Benefits */}
            {company.benefits && company.benefits.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-gray-500" />
                  Benefits & Perks
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {company.benefits.map((benefit, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-green-50 rounded-lg"
                    >
                      <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Open Positions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Open Positions ({activeJobs.length})
                </h2>
                <Link
                  href="/jobs"
                  className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
                >
                  View all jobs <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              {activeJobs.length > 0 ? (
                <div className="space-y-4">
                  {activeJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/jobs/${job.id}`}
                      className="block p-4 border border-gray-100 rounded-xl hover:border-green-200 hover:bg-green-50/50 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />{" "}
                              {job.type?.replace("_", " ")}
                            </span>
                            {job.salaryMin && job.salaryMax && (
                              <span className="flex items-center gap-1 font-medium text-gray-700">
                                <DollarSign className="h-3 w-3" />
                                {job.currency || "$"}
                                {job.salaryMin.toLocaleString()} -{" "}
                                {job.currency || "$"}
                                {job.salaryMax.toLocaleString()}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(job.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {job.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                              {job.tags.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{job.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {job.urgent && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                              🔥 Urgent
                            </span>
                          )}
                          {job.featured && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                              ⭐ Featured
                            </span>
                          )}
                          {job.vacancies && (
                            <span className="text-xs text-gray-500">
                              {job.vacancies}{" "}
                              {job.vacancies === 1 ? "opening" : "openings"}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">
                    No open positions at the moment
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Company Information
              </h3>
              <div className="space-y-3">
                {company.industry && (
                  <div>
                    <p className="text-xs text-gray-500">Industry</p>
                    <p className="text-sm font-medium text-gray-900">
                      {company.industry}
                    </p>
                  </div>
                )}
                {company.size && (
                  <div>
                    <p className="text-xs text-gray-500">Company Size</p>
                    <p className="text-sm font-medium text-gray-900">
                      {company.size}
                    </p>
                  </div>
                )}
                {company.location && (
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {company.location}
                    </p>
                  </div>
                )}
                {company.foundedYear && (
                  <div>
                    <p className="text-xs text-gray-500">Founded</p>
                    <p className="text-sm font-medium text-gray-900">
                      {company.foundedYear}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Member Since</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(company.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Company Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-2xl font-bold text-blue-600">
                    {company.jobs?.length || 0}
                  </p>
                  <p className="text-xs text-gray-600">Total Jobs</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-2xl font-bold text-green-600">
                    {activeJobs.length}
                  </p>
                  <p className="text-xs text-gray-600">Active Jobs</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Link
                  href="/post-job"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-green-50 transition-colors text-sm text-gray-700 hover:text-green-600"
                >
                  <Briefcase className="h-4 w-4" />
                  Post a New Job
                </Link>
                <Link
                  href="/company/edit"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-green-50 transition-colors text-sm text-gray-700 hover:text-green-600"
                >
                  <Building2 className="h-4 w-4" />
                  Edit Company Profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
