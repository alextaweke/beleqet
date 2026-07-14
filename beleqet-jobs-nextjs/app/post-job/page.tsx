"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { jobsService } from "@/lib/jobs";
import { JobType, JobStatus } from "@/types/jobs";
import type { CreateJobDto, Category } from "@/lib/jobs";

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [formData, setFormData] = useState<Partial<CreateJobDto>>({
    title: "",
    description: "",
    requirements: "",
    location: "",
    type: JobType.FULL_TIME,
    categoryId: "",
    salaryMin: undefined,
    salaryMax: undefined,
    deadline: "",
    featured: false,
    tags: [],
    filled: false,
    urgent: false,
    jobSite: "",
    gender: "",
    salaryType: "",
    vacancies: 1,
    experienceLevel: "",
    yearsOfExperience: "",
    qualification: "",
    expiryDate: "",
    applyType: "",
    applyUrl: "",
    applyEmail: "",
    contactPhone: "",
    companyName: "",
    companyLogo: "",
    status: JobStatus.PUBLISHED,
    currency: "ETB",
  });

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await jobsService.getCategories();
        setCategories(data || []);
        if (data && data.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: data[0].id }));
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? value
              ? Number(value)
              : undefined
            : value,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate required fields
      if (!formData.title?.trim()) {
        throw new Error("Job title is required");
      }
      if (!formData.description?.trim()) {
        throw new Error("Job description is required");
      }
      if (!formData.location?.trim()) {
        throw new Error("Location is required");
      }
      if (!formData.categoryId) {
        throw new Error("Category is required");
      }

      const data = formData as CreateJobDto;
      await jobsService.create(data);
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/jobs");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategories) {
    return (
      <div className="container-page py-16 max-w-2xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brandGreen border-r-transparent"></div>
            <p className="mt-4 text-muted">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-16 max-w-4xl">
      <h1 className="text-pageH1">Post a Job</h1>
      <p className="text-muted mt-4 leading-relaxed">
        Reach thousands of verified job seekers across Ethiopia. Fill out the
        form below to publish your listing.
      </p>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          ✅ Job posted successfully! Redirecting to jobs list...
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-8 rounded-2xl border border-border bg-white p-7 space-y-6"
      >
        {/* Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Basic Information
          </h2>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Job Title *
            </label>
            <input
              name="title"
              value={formData.title || ""}
              onChange={handleChange}
              required
              placeholder="e.g., Senior Software Engineer"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              rows={5}
              required
              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements || ""}
              onChange={handleChange}
              rows={3}
              placeholder="List the skills, qualifications, and experience required..."
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        {/* Job Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Job Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink block">
                Location *
              </label>
              <input
                name="location"
                value={formData.location || ""}
                onChange={handleChange}
                required
                placeholder="e.g., Addis Ababa, Ethiopia"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block">
                Job Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              >
                {Object.values(JobType).map((type) => (
                  <option key={type} value={type}>
                    {type.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Category *
            </label>
            <select
              name="categoryId"
              value={formData.categoryId || ""}
              onChange={handleChange}
              required
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Compensation */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Compensation
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink block">
                Salary Min
              </label>
              <input
                name="salaryMin"
                type="number"
                value={formData.salaryMin || ""}
                onChange={handleChange}
                placeholder="e.g., 15000"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink block">
                Salary Max
              </label>
              <input
                name="salaryMax"
                type="number"
                value={formData.salaryMax || ""}
                onChange={handleChange}
                placeholder="e.g., 25000"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink block">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency || "ETB"}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              >
                <option value="ETB">ETB</option>
                <option value="$">USD</option>
                <option value="€">EUR</option>
                <option value="£">GBP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Salary Type
            </label>
            <select
              name="salaryType"
              value={formData.salaryType || ""}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            >
              <option value="">Select salary type</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="project">Project Based</option>
            </select>
          </div>
        </div>

        {/* Requirements & Experience */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Requirements & Experience
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink block">
                Experience Level
              </label>
              <select
                name="experienceLevel"
                value={formData.experienceLevel || ""}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              >
                <option value="">Select experience level</option>
                <option value="entry">Entry Level</option>
                <option value="junior">Junior</option>
                <option value="mid">Mid-Level</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
                <option value="manager">Manager</option>
                <option value="executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block">
                Years of Experience
              </label>
              <input
                name="yearsOfExperience"
                value={formData.yearsOfExperience || ""}
                onChange={handleChange}
                placeholder="e.g., 3-5 years"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Qualification
            </label>
            <input
              name="qualification"
              value={formData.qualification || ""}
              onChange={handleChange}
              placeholder="e.g., Bachelor's Degree in Computer Science"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Gender Preference
            </label>
            <select
              name="gender"
              value={formData.gender || ""}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            >
              <option value="">No preference</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Additional Information
          </h2>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Tags (comma separated)
            </label>
            <input
              name="tags"
              value={formData.tags?.join(", ") || ""}
              onChange={handleTagsChange}
              placeholder="e.g., React, Node.js, TypeScript, MongoDB"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink block">
                Vacancies
              </label>
              <input
                name="vacancies"
                type="number"
                value={formData.vacancies || ""}
                onChange={handleChange}
                min="1"
                placeholder="Number of positions"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block">
                Job Site
              </label>
              <input
                name="jobSite"
                value={formData.jobSite || ""}
                onChange={handleChange}
                placeholder="e.g., On-site, Remote, Hybrid"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
          </div>
        </div>

        {/* Application Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Application Information
          </h2>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Apply Type
            </label>
            <select
              name="applyType"
              value={formData.applyType || ""}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            >
              <option value="">Select apply method</option>
              <option value="email">Email</option>
              <option value="url">External URL</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink block">
                Apply Email
              </label>
              <input
                name="applyEmail"
                type="email"
                value={formData.applyEmail || ""}
                onChange={handleChange}
                placeholder="hr@company.com"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block">
                Apply URL
              </label>
              <input
                name="applyUrl"
                value={formData.applyUrl || ""}
                onChange={handleChange}
                placeholder="https://company.com/careers"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Contact Phone
            </label>
            <input
              name="contactPhone"
              value={formData.contactPhone || ""}
              onChange={handleChange}
              placeholder="+251 911 234 567"
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Dates & Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink block">
                Deadline
              </label>
              <input
                name="deadline"
                type="date"
                value={formData.deadline || ""}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block">
                Expiry Date
              </label>
              <input
                name="expiryDate"
                type="date"
                value={formData.expiryDate || ""}
                onChange={handleChange}
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink block">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
            >
              <option value={JobStatus.PUBLISHED}>Published (Live)</option>
              <option value={JobStatus.DRAFT}>Draft</option>
            </select>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Options
          </h2>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                name="featured"
                type="checkbox"
                checked={formData.featured || false}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-brandGreen focus:ring-brandGreen"
              />
              Featured Job
            </label>

            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                name="urgent"
                type="checkbox"
                checked={formData.urgent || false}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-brandGreen focus:ring-brandGreen"
              />
              Urgent Hiring
            </label>

            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                name="filled"
                type="checkbox"
                checked={formData.filled || false}
                onChange={handleChange}
                className="h-4 w-4 rounded border-border text-brandGreen focus:ring-brandGreen"
              />
              Position Filled
            </label>
          </div>
        </div>

        {/* Company Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink border-b border-border pb-2">
            Company Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-ink block">
                Company Name
              </label>
              <input
                name="companyName"
                value={formData.companyName || ""}
                onChange={handleChange}
                placeholder="Your company name"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-ink block">
                Company Logo URL
              </label>
              <input
                name="companyLogo"
                value={formData.companyLogo || ""}
                onChange={handleChange}
                placeholder="https://company.com/logo.png"
                className="mt-1.5 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-brandGreen"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-full bg-brandGreen text-white text-sm font-semibold py-3 hover:bg-darkGreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Posting..." : "Publish Listing"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 rounded-full border border-border text-ink text-sm font-semibold py-3 hover:bg-pageBg transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
