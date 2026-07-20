// components/ApplyButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
import type { JobResponse } from "@/lib/jobs";
import { applicationsService } from "@/lib/applications";

interface ApplyButtonProps {
  job: JobResponse;
}

export default function ApplyButton({ job }: ApplyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: "",
    resumeUrl: "",
    portfolioUrl: "",
    expectedSalary: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const loggedIn = !!token;
    setIsLoggedIn(loggedIn);

    if (loggedIn && job.id) {
      applicationsService
        .hasApplied(job.id)
        .then((applied) => setHasApplied(applied))
        .catch(() => setHasApplied(false));
    }
  }, [job.id]);

  const isDisabled =
    job.filled === true ||
    (job.deadline && new Date(job.deadline) < new Date()) ||
    hasApplied;

  const handleApply = () => {
    if (!isLoggedIn) {
      router.push(`/auth/login?redirect=/jobs/${job.id}`);
      return;
    }

    // Always show internal application modal
    setShowModal(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // POST /api/v1/applications
      await applicationsService.submit({
        jobId: job.id,
        coverLetter: formData.coverLetter,
        resumeUrl: formData.resumeUrl,
        portfolioUrl: formData.portfolioUrl || undefined,
        expectedSalary: formData.expectedSalary
          ? Number(formData.expectedSalary)
          : undefined,
      });

      setSuccess(true);
      setHasApplied(true);
      setTimeout(() => {
        setShowModal(false);
        router.push("/dashboard/seeker?tab=applications");
      }, 2000);
    } catch (err: any) {
      console.error("Error applying:", err);
      setError(
        err.message || "Failed to submit application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (hasApplied) return "Already Applied";
    if (isDisabled && job.filled) return "Position Filled";
    if (isDisabled && job.deadline && new Date(job.deadline) < new Date())
      return "Application Closed";
    return "Apply Now";
  };

  return (
    <>
      <button
        onClick={handleApply}
        disabled={isDisabled}
        className={`w-full rounded-full text-white text-sm font-semibold py-3 transition-colors ${
          isDisabled
            ? "bg-gray-400 cursor-not-allowed"
            : hasApplied
              ? "bg-green-600 cursor-default"
              : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {getButtonText()}
      </button>

      {/* Internal Application Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Apply for Position
                </h2>
                <p className="text-sm text-gray-600">{job.title}</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {success ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Application Submitted!
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Your application has been submitted successfully. The employer
                  will review your application and get back to you soon.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Redirecting to your applications...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Resume URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="resumeUrl"
                    value={formData.resumeUrl}
                    onChange={handleChange}
                    placeholder="https://your-resume.com/your-resume.pdf"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your resume to a cloud storage and paste the link
                    here
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cover Letter <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="coverLetter"
                    value={formData.coverLetter}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us why you're the perfect candidate for this role..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Portfolio URL{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    name="portfolioUrl"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                    placeholder="https://your-portfolio.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Expected Salary{" "}
                    <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="expectedSalary"
                    value={formData.expectedSalary}
                    onChange={handleChange}
                    placeholder="e.g., 80000"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your expected annual salary in {job.currency || "USD"}
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
