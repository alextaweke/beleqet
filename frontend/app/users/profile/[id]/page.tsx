"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
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
  User,
  Star,
  Clock,
  AlertCircle,
  FolderOpen,
  Award,
  MessageSquare,
  Video,
  Loader2,
} from "lucide-react";
import { getPublicProfile, PublicUserProfile } from "@/lib/userApi";
import { portfolioService, FullPortfolio } from "@/lib/portfolio";
import { useAuth } from "@/app/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [portfolio, setPortfolio] = useState<FullPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "projects" | "work" | "certifications" | "testimonials"
  >("projects");
  const isOwnProfile = user?.id === params.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userId = params.id as string;

        // Fetch both profile and portfolio in parallel
        const [profileData, portfolioData] = await Promise.all([
          getPublicProfile(userId),
          portfolioService.getFullPortfolio(userId),
        ]);

        setProfile(profileData);
        setPortfolio(portfolioData);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">
              {error || "Profile not found"}
            </p>
            <Link
              href="/freelance"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Gigs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Portfolio tabs
  const tabs = [
    {
      id: "projects" as const,
      label: "Projects",
      count: portfolio?.totalProjects || 0,
      icon: FolderOpen,
    },
    {
      id: "work" as const,
      label: "Work History",
      count: portfolio?.totalWorkHistory || 0,
      icon: Briefcase,
    },
    {
      id: "certifications" as const,
      label: "Certifications",
      count: portfolio?.totalCertifications || 0,
      icon: Award,
    },
    {
      id: "testimonials" as const,
      label: "Testimonials",
      count: portfolio?.totalTestimonials || 0,
      icon: MessageSquare,
    },
  ];

  const hasPortfolio =
    portfolio &&
    (portfolio.totalProjects > 0 ||
      portfolio.totalWorkHistory > 0 ||
      portfolio.totalCertifications > 0 ||
      portfolio.totalTestimonials > 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Link
          href="/freelance"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gigs
        </Link>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-4xl font-bold shrink-0">
              {profile.firstName?.charAt(0) || profile.email?.charAt(0) || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                {profile.role === "EMPLOYER" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    <Building2 className="h-3 w-3" />
                    Employer
                  </span>
                )}
                {profile.role === "FREELANCER" && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    <Briefcase className="h-3 w-3" />
                    Freelancer
                  </span>
                )}
                {isOwnProfile && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                    You
                  </span>
                )}
              </div>
              {profile.headline && (
                <p className="text-gray-600 text-sm mt-1">{profile.headline}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4 shrink-0" /> {profile.email}
                </span>
                {profile.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4 shrink-0" /> {profile.phone}
                  </span>
                )}
                {profile.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0" /> {profile.location}
                  </span>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        {profile.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {profile.stats.totalJobs || 0}
              </p>
              <p className="text-xs text-gray-500">Total Jobs</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                ${profile.stats.totalEarned || 0}
              </p>
              <p className="text-xs text-gray-500">Total Earned</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {profile.stats.rating || 0}⭐
              </p>
              <p className="text-xs text-gray-500">Rating</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">
                {profile.stats.completedProjects || 0}
              </p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            {profile.bio && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  About
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  Skills
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(profile.portfolioUrl ||
              profile.githubUrl ||
              profile.linkedinUrl ||
              profile.defaultResumeUrl) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-900 mb-3">
                  Links & Resources
                </h2>
                <div className="space-y-2">
                  {profile.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio
                    </a>
                  )}
                  {profile.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                    </a>
                  )}
                  {profile.defaultResumeUrl && (
                    <a
                      href={profile.defaultResumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      Download Resume
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Company Info */}
            {profile.company && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Company
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">
                    {profile.company.name}
                  </p>
                  {profile.company.description && (
                    <p className="text-sm text-gray-600">
                      {profile.company.description}
                    </p>
                  )}
                  {profile.company.industry && (
                    <p className="text-sm text-gray-500">
                      Industry: {profile.company.industry}
                    </p>
                  )}
                  {profile.company.website && (
                    <a
                      href={profile.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 hover:underline"
                    >
                      Visit Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Quick Info
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Role
                  </p>
                  <p className="font-medium text-gray-900 capitalize mt-0.5">
                    {profile.role?.toLowerCase().replace("_", " ")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Member Since
                  </p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {new Date(profile.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {profile.telegramId && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">
                      Telegram
                    </p>
                    <p className="font-medium text-gray-900 mt-0.5">
                      @{profile.telegramId}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() =>
                    (window.location.href = `mailto:${profile.email}`)
                  }
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-green-50 transition-colors text-sm text-gray-700 hover:text-green-600 w-full"
                >
                  <Mail className="h-4 w-4" />
                  Send Message
                </button>
                <Link
                  href="/freelance"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-green-50 transition-colors text-sm text-gray-700 hover:text-green-600 w-full"
                >
                  <Briefcase className="h-4 w-4" />
                  Browse Gigs
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Portfolio */}
          <div className="lg:col-span-2">
            {hasPortfolio ? (
              <>
                {/* Portfolio Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                            activeTab === tab.id
                              ? "bg-green-100 text-green-700"
                              : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Portfolio Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  {/* Projects */}
                  {activeTab === "projects" && (
                    <div>
                      {portfolio.projects && portfolio.projects.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {portfolio.projects.map((project) => (
                            <div
                              key={project.id}
                              className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all"
                            >
                              <div className="relative h-32 bg-gradient-to-br from-green-50 to-green-100 rounded-lg mb-3 flex items-center justify-center">
                                {project.imageUrl ? (
                                  <img
                                    src={project.imageUrl}
                                    alt={project.title}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <FolderOpen className="h-8 w-8 text-green-600/30" />
                                )}
                                {project.featured && (
                                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                    ⭐ Featured
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-gray-900">
                                {project.title}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {project.category}
                              </p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {project.description}
                              </p>
                              {project.technologies &&
                                project.technologies.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {project.technologies
                                      .slice(0, 3)
                                      .map((tech) => (
                                        <span
                                          key={tech}
                                          className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                        >
                                          {tech}
                                        </span>
                                      ))}
                                  </div>
                                )}
                              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                                {project.demoUrl && (
                                  <a
                                    href={project.demoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Globe className="h-4 w-4" />
                                  </a>
                                )}
                                {project.githubUrl && (
                                  <a
                                    href={project.githubUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-600 hover:text-gray-700"
                                  >
                                    <Github className="h-4 w-4" />
                                  </a>
                                )}
                                {project.videoUrl && (
                                  <a
                                    href={project.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Video className="h-4 w-4" />
                                  </a>
                                )}
                                <span className="ml-auto text-xs text-gray-400">
                                  {project.completedAt
                                    ? format(
                                        new Date(project.completedAt),
                                        "MMM yyyy",
                                      )
                                    : "In Progress"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No projects yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Work History */}
                  {activeTab === "work" && (
                    <div>
                      {portfolio.workHistory &&
                      portfolio.workHistory.length > 0 ? (
                        <div className="space-y-4">
                          {portfolio.workHistory.map((work) => (
                            <div
                              key={work.id}
                              className="border border-gray-100 rounded-xl p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {work.title}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {work.company}
                                  </p>
                                  {work.location && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />{" "}
                                      {work.location}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right text-sm">
                                  <span className="text-gray-700">
                                    {format(
                                      new Date(work.startDate),
                                      "MMM yyyy",
                                    )}{" "}
                                    -{" "}
                                    {work.current
                                      ? "Present"
                                      : work.endDate
                                        ? format(
                                            new Date(work.endDate),
                                            "MMM yyyy",
                                          )
                                        : "Present"}
                                  </span>
                                  {work.current && (
                                    <span className="block text-xs text-green-600 font-medium">
                                      Current
                                    </span>
                                  )}
                                </div>
                              </div>
                              {work.description && (
                                <p className="text-sm text-gray-600 mt-2">
                                  {work.description}
                                </p>
                              )}
                              {work.achievements &&
                                work.achievements.length > 0 && (
                                  <ul className="mt-2 space-y-1">
                                    {work.achievements.map(
                                      (achievement, index) => (
                                        <li
                                          key={index}
                                          className="text-sm text-gray-600 flex items-start gap-2"
                                        >
                                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                          {achievement}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Briefcase className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No work history yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Certifications */}
                  {activeTab === "certifications" && (
                    <div>
                      {portfolio.certifications &&
                      portfolio.certifications.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {portfolio.certifications.map((cert) => (
                            <div
                              key={cert.id}
                              className="border border-gray-100 rounded-xl p-4 flex items-start gap-3"
                            >
                              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                {cert.iconUrl ? (
                                  <img
                                    src={cert.iconUrl}
                                    alt={cert.name}
                                    className="w-6 h-6 object-contain"
                                  />
                                ) : (
                                  <Award className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 text-sm">
                                  {cert.name}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {cert.issuingOrg}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                                  <span>
                                    Issued:{" "}
                                    {format(
                                      new Date(cert.issueDate),
                                      "MMM yyyy",
                                    )}
                                  </span>
                                  {cert.expiryDate && (
                                    <span>
                                      • Expires:{" "}
                                      {format(
                                        new Date(cert.expiryDate),
                                        "MMM yyyy",
                                      )}
                                    </span>
                                  )}
                                  {cert.isVerified && (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />{" "}
                                      Verified
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Award className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No certifications yet</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Testimonials */}
                  {activeTab === "testimonials" && (
                    <div>
                      {portfolio.testimonials &&
                      portfolio.testimonials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {portfolio.testimonials.map((testimonial) => (
                            <div
                              key={testimonial.id}
                              className="border border-gray-100 rounded-xl p-4"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold shrink-0">
                                  {testimonial.authorAvatarUrl ? (
                                    <img
                                      src={testimonial.authorAvatarUrl}
                                      alt={testimonial.authorName}
                                      className="w-10 h-10 rounded-full"
                                    />
                                  ) : (
                                    testimonial.authorName.charAt(0)
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm">
                                    {testimonial.authorName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {testimonial.authorRole}
                                    {testimonial.authorRole &&
                                      testimonial.authorCompany &&
                                      " • "}
                                    {testimonial.authorCompany}
                                  </p>
                                  {testimonial.rating && (
                                    <div className="flex items-center gap-0.5 mt-1">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-3.5 w-3.5 ${i < testimonial.rating! ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-2 italic">
                                "{testimonial.content}"
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatDistanceToNow(
                                  new Date(testimonial.createdAt),
                                  { addSuffix: true },
                                )}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                          <p>No testimonials yet</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              // No Portfolio
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  No Portfolio Items
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  This user hasn't added any portfolio items yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
