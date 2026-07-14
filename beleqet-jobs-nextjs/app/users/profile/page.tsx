// app/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getUserProfile, UserProfile } from "@/lib/userApi";
import {
  Briefcase,
  Mail,
  Phone,
  MapPin,
  Globe,
  Github,
  Linkedin,
  FileText,
  Calendar,
  Building2,
  Tag,
  CheckCircle,
  Edit,
  User,
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setError("No access token found.");
          setLoading(false);
          return;
        }

        const data = await getUserProfile(token);
        console.log("Profile data:", data);
        setUser(data);
      } catch (err: any) {
        console.error("Profile fetch error:", err);
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Error Loading Profile
          </h3>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            No Profile Found
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Please complete your profile.
          </p>
        </div>
      </div>
    );
  }

  // Helper to render company info properly
  const renderCompany = () => {
    if (!user.company) return null;

    if (typeof user.company === "string") {
      return <p className="text-gray-900">{user.company}</p>;
    }

    if (typeof user.company === "object") {
      const company = user.company as {
        name?: string;
        verified?: boolean;
        description?: string;
        industry?: string;
        size?: string;
        location?: string;
        website?: string;
        benefits?: string[];
      };

      return (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{company.name}</p>
            {company.verified && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>
          {company.description && (
            <p className="text-sm text-gray-600 mt-1">{company.description}</p>
          )}
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600">
            {company.industry && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {company.industry}
              </span>
            )}
            {company.size && (
              <span className="flex items-center gap-1">
                <UsersIcon className="h-3 w-3" /> {company.size}
              </span>
            )}
            {company.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {company.location}
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline flex items-center gap-1"
              >
                <Globe className="h-3 w-3" /> Website
              </a>
            )}
          </div>
          {company.benefits && company.benefits.length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">Benefits:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {company.benefits.map((benefit: string, index: number) => (
                  <span
                    key={index}
                    className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full"
                  >
                    {benefit}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return <p className="text-gray-600">N/A</p>;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 mt-4 md:mt-10">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="h-24 w-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-4xl font-bold shrink-0">
            {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              {user.role === "EMPLOYER" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  <Building2 className="h-3 w-3" />
                  Employer
                </span>
              )}
              {user.role === "ADMIN" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  Admin
                </span>
              )}
              {user.role === "JOB_SEEKER" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  Job Seeker
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {user.role?.toLowerCase().replace("_", " ")}
            </p>
            {user.headline && (
              <p className="text-gray-600 text-sm mt-1">{user.headline}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4 shrink-0" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4 shrink-0" /> {user.phone}
                </span>
              )}
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 shrink-0" /> {user.location}
                </span>
              )}
            </div>
          </div>
          <Link
            href="/users/edit"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap w-full md:w-auto justify-center"
          >
            <Edit className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Profile Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Personal Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          {user.bio && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                About
              </h2>
              <p className="text-gray-600 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Skills */}
          {user.skills && user.skills.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="h-5 w-5 text-gray-500" />
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-green-50 text-green-700 text-sm font-medium px-3 py-1.5 rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company Info */}
          {user.company && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                Company
              </h2>
              {renderCompany()}
            </div>
          )}

          {/* Links */}
          {(user.portfolioUrl ||
            user.githubUrl ||
            user.linkedinUrl ||
            user.defaultResumeUrl) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Links & Resources
              </h2>
              <div className="space-y-2">
                {user.portfolioUrl && (
                  <a
                    href={user.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    Portfolio
                  </a>
                )}
                {user.githubUrl && (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {user.linkedinUrl && (
                  <a
                    href={user.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {user.defaultResumeUrl && (
                  <a
                    href={user.defaultResumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:underline"
                  >
                    <FileText className="h-4 w-4" />
                    Download Resume
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Quick Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Quick Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Role
                </p>
                <p className="text-sm font-medium text-gray-900 capitalize mt-0.5">
                  {user.role?.toLowerCase().replace("_", " ")}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5 break-all">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">
                  Member Since
                </p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              {user.telegramId && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Telegram
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    @{user.telegramId}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              {user.role === "EMPLOYER" && (
                <Link
                  href="/users/company"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-green-50 transition-colors text-sm text-gray-700 hover:text-green-600"
                >
                  <Building2 className="h-4 w-4" />
                  View Company
                </Link>
              )}
              {user.role === "JOB_SEEKER" && (
                <Link
                  href="/jobs"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-green-50 transition-colors text-sm text-gray-700 hover:text-green-600"
                >
                  <Briefcase className="h-4 w-4" />
                  Find Jobs
                </Link>
              )}
              <Link
                href="/users/edit"
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-green-50 transition-colors text-sm text-gray-700 hover:text-green-600"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Users icon component for the company section
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
