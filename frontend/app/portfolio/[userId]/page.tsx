"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  FolderOpen,
  Github,
  Globe,
  MessageSquare,
  Star,
  Video,
  Award,
  MapPin,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { portfolioService, FullPortfolio } from "@/lib/portfolio";
import { formatDistanceToNow, format } from "date-fns";

export default function PortfolioPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const [portfolio, setPortfolio] = useState<FullPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "projects" | "work" | "certifications" | "testimonials"
  >("projects");

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!userId) {
          setError("User ID is required");
          setLoading(false);
          return;
        }

        const data = await portfolioService.getFullPortfolio(userId);

        // ✅ Ensure we have valid data
        if (data && typeof data === "object") {
          setPortfolio({
            projects: data.projects || [],
            workHistory: data.workHistory || [],
            certifications: data.certifications || [],
            testimonials: data.testimonials || [],
            totalProjects: data.totalProjects || 0,
            totalWorkHistory: data.totalWorkHistory || 0,
            totalCertifications: data.totalCertifications || 0,
            totalTestimonials: data.totalTestimonials || 0,
          });
        } else {
          setPortfolio({
            projects: [],
            workHistory: [],
            certifications: [],
            testimonials: [],
            totalProjects: 0,
            totalWorkHistory: 0,
            totalCertifications: 0,
            totalTestimonials: 0,
          });
        }
      } catch (err: any) {
        console.error("Error fetching portfolio:", err);
        setError(err.message || "Failed to load portfolio");
        setPortfolio({
          projects: [],
          workHistory: [],
          certifications: [],
          testimonials: [],
          totalProjects: 0,
          totalWorkHistory: 0,
          totalCertifications: 0,
          totalTestimonials: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [userId]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">{error}</p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If no portfolio data
  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
            <p className="text-yellow-600 font-semibold">
              No portfolio data found
            </p>
            <Link
              href="/"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Define tabs
  const tabs = [
    {
      id: "projects" as const,
      label: "Projects",
      count: portfolio.totalProjects || 0,
      icon: FolderOpen,
    },
    {
      id: "work" as const,
      label: "Work History",
      count: portfolio.totalWorkHistory || 0,
      icon: Briefcase,
    },
    {
      id: "certifications" as const,
      label: "Certifications",
      count: portfolio.totalCertifications || 0,
      icon: Award,
    },
    {
      id: "testimonials" as const,
      label: "Testimonials",
      count: portfolio.totalTestimonials || 0,
      icon: MessageSquare,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-gray-600 mt-1">
            {portfolio.totalProjects || 0} projects •{" "}
            {portfolio.totalWorkHistory || 0} work experiences •{" "}
            {portfolio.totalCertifications || 0} certifications •{" "}
            {portfolio.totalTestimonials || 0} testimonials
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "border-green-600 text-green-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
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

        {/* Content */}
        <div>
          {/* Projects */}
          {activeTab === "projects" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolio.projects && portfolio.projects.length > 0 ? (
                portfolio.projects.map((project) => (
                  <div
                    key={project.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all"
                  >
                    <div className="relative h-40 bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                      {project.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FolderOpen className="h-12 w-12 text-green-600/30" />
                      )}
                      {project.featured && (
                        <span className="absolute top-2 right-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">
                        {project.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {project.category}
                      </p>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {project.description}
                      </p>
                      {project.technologies &&
                        project.technologies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {project.technologies.slice(0, 3).map((tech) => (
                              <span
                                key={tech}
                                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                              >
                                {tech}
                              </span>
                            ))}
                            {project.technologies.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{project.technologies.length - 3}
                              </span>
                            )}
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
                            ? format(new Date(project.completedAt), "MMM yyyy")
                            : "In Progress"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No projects yet
                </div>
              )}
            </div>
          )}

          {/* Work History */}
          {activeTab === "work" && (
            <div className="space-y-4">
              {portfolio.workHistory && portfolio.workHistory.length > 0 ? (
                portfolio.workHistory.map((work) => (
                  <div
                    key={work.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {work.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {work.company}
                          {work.companyUrl && (
                            <a
                              href={work.companyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:underline ml-1"
                            >
                              (Website)
                            </a>
                          )}
                        </p>
                        {work.location && (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {work.location}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-700">
                          {format(new Date(work.startDate), "MMM yyyy")} -{" "}
                          {work.current
                            ? "Present"
                            : work.endDate
                              ? format(new Date(work.endDate), "MMM yyyy")
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
                    {work.achievements && work.achievements.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {work.achievements.map((achievement, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-600 flex items-start gap-2"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            {achievement}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No work history yet
                </div>
              )}
            </div>
          )}

          {/* Certifications */}
          {activeTab === "certifications" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.certifications &&
              portfolio.certifications.length > 0 ? (
                portfolio.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xl shrink-0">
                        {cert.iconUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cert.iconUrl}
                            alt={cert.name}
                            className="w-8 h-8 object-contain"
                          />
                        ) : (
                          <Award className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {cert.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {cert.issuingOrg}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
                          <span>
                            Issued:{" "}
                            {format(new Date(cert.issueDate), "MMM yyyy")}
                          </span>
                          {cert.expiryDate && (
                            <span>
                              • Expires:{" "}
                              {format(new Date(cert.expiryDate), "MMM yyyy")}
                            </span>
                          )}
                          {cert.isVerified && (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" /> Verified
                            </span>
                          )}
                        </div>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline mt-1 inline-block"
                          >
                            View Credential →
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No certifications yet
                </div>
              )}
            </div>
          )}

          {/* Testimonials */}
          {activeTab === "testimonials" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.testimonials && portfolio.testimonials.length > 0 ? (
                portfolio.testimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-semibold shrink-0">
                        {testimonial.authorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
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
                        <p className="font-medium text-gray-900">
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
                    <p className="text-sm text-gray-600 mt-3 italic">
                      "{testimonial.content}"
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDistanceToNow(new Date(testimonial.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500">
                  No testimonials yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
