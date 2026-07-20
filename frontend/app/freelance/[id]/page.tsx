// app/freelance/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Clock,
  MapPin,
  Users,
  Calendar,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  Star,
  Tag,
  Pencil,
  Trash2,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/lib/config";
import { formatDistanceToNow } from "date-fns";

interface FreelanceJob {
  id: string;
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  pricingType: string;
  deadlineDays: number;
  skills: string[];
  locationPreference: string;
  experienceLevel: string;
  status: string;
  featured: boolean;
  createdAt: string;
  category: {
    id: string;
    label: string;
    slug: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  bids: Bid[];
  contract?: {
    id: string;
    status: string;
    agreedAmount?: number;
  };
  _count: {
    bids: number;
  };
  escrowTx?: {
    id: string;
    status: string;
    grossAmount: number;
  };
}

interface Bid {
  id: string;
  amount: number;
  timelineDays: number;
  coverLetter: string;
  status: string;
  createdAt: string;
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
    headline?: string;
    location?: string;
    skills?: string[];
  };
}

export default function FreelanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [job, setJob] = useState<FreelanceJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [bidData, setBidData] = useState({
    amount: "",
    timelineDays: "",
    coverLetter: "",
  });
  const [acceptingBid, setAcceptingBid] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isClient = user?.id === job?.client?.id;
  const isFreelancer =
    user?.role === "FREELANCER" || user?.role === "JOB_SEEKER";
  const canBid = isFreelancer && job?.status === "OPEN";
  const canEditDelete = isClient && job?.status === "OPEN";
  const hasBid = job?.bids?.some((b) => b.freelancer?.id === user?.id);

  // Check if escrow can be funded (client has accepted a bid and has contract)
  const canFundEscrow =
    isClient &&
    job?.contract &&
    job?.status !== "FUNDED" &&
    (job?.status === "OPEN" || job?.status === "IN_PROGRESS") &&
    !job?.escrowTx;
  const hasActiveContract = job?.contract && job?.contract.status === "ACTIVE";

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await apiFetch(`/freelance/jobs/${params.id}`, {
          method: "GET",
        });
        setJob(data);
      } catch (err: any) {
        console.error("Error fetching job:", err);
        setError(err.message || "Failed to load gig");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  const handleBidChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setBidData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (!bidData.amount || Number(bidData.amount) <= 0) {
      setError("Please enter a valid bid amount");
      return;
    }
    if (!bidData.timelineDays || Number(bidData.timelineDays) <= 0) {
      setError("Please enter a valid timeline");
      return;
    }
    if (!bidData.coverLetter.trim()) {
      setError("Please write a cover letter");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      await apiFetch(`/freelance/jobs/${params.id}/bids`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: Number(bidData.amount),
          timelineDays: Number(bidData.timelineDays),
          coverLetter: bidData.coverLetter,
        }),
      });

      const updatedJob = await apiFetch(`/freelance/jobs/${params.id}`, {
        method: "GET",
      });
      setJob(updatedJob);
      setShowBidForm(false);
      setBidData({ amount: "", timelineDays: "", coverLetter: "" });
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to submit bid");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!confirm("Are you sure you want to accept this bid?")) return;

    setAcceptingBid(bidId);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await apiFetch(`/freelance/bids/${bidId}/accept`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response && response.id) {
        router.push(`/contracts/${response.id}`);
      } else {
        const updatedJob = await apiFetch(`/freelance/jobs/${params.id}`, {
          method: "GET",
        });
        setJob(updatedJob);
        if (updatedJob.contract && updatedJob.contract.id) {
          router.push(`/contracts/${updatedJob.contract.id}`);
        } else {
          router.push("/dashboard/employer");
        }
      }
    } catch (err: any) {
      console.error("Error accepting bid:", err);
      setError(err.message || "Failed to accept bid");
      const updatedJob = await apiFetch(`/freelance/jobs/${params.id}`, {
        method: "GET",
      });
      setJob(updatedJob);
    } finally {
      setAcceptingBid(null);
    }
  };

  const handleWithdrawBid = async (bidId: string) => {
    if (!confirm("Are you sure you want to withdraw your bid?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      await apiFetch(`/freelance/bids/${bidId}/withdraw`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedJob = await apiFetch(`/freelance/jobs/${params.id}`, {
        method: "GET",
      });
      setJob(updatedJob);
    } catch (err: any) {
      setError(err.message || "Failed to withdraw bid");
    }
  };

  const handleDeleteJob = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this gig? This action cannot be undone.",
      )
    )
      return;

    setDeleting(true);

    try {
      const token = localStorage.getItem("accessToken");
      await apiFetch(`/freelance/jobs/${params.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      router.push("/freelance");
    } catch (err: any) {
      setError(err.message || "Failed to delete gig");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">
              {error || "Gig not found"}
            </p>
            <Link
              href="/vacancy"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Gigs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Link
          href="/vacancy"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Gigs
        </Link>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {job.client?.firstName} {job.client?.lastName}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(job.createdAt), {
                    addSuffix: true,
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {job.deadlineDays} days
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.featured && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                  ⭐ Featured
                </span>
              )}
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full ${
                  job.status === "OPEN"
                    ? "bg-green-100 text-green-700"
                    : job.status === "FUNDED"
                      ? "bg-blue-100 text-blue-700"
                      : job.status === "IN_PROGRESS"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                }`}
              >
                {job.status.replace("_", " ")}
              </span>
              {canEditDelete && (
                <div className="flex gap-2">
                  <Link
                    href={`/freelance/${job.id}/edit`}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium flex items-center gap-1"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDeleteJob}
                    disabled={deleting}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Budget */}
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-sm text-gray-600">Budget Range</p>
                <p className="text-xl font-bold text-gray-900">
                  ${job.budgetMin} - ${job.budgetMax}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Pricing Type</p>
                <p className="font-medium text-gray-900">{job.pricingType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Bids</p>
                <p className="font-medium text-gray-900">{job._count.bids}</p>
              </div>
              {job.contract && (
                <div>
                  <p className="text-sm text-gray-600">Contract Amount</p>
                  <p className="font-medium text-gray-900">
                    ${job.contract.agreedAmount || job.budgetMax}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Escrow Status - Show if exists */}
          {job.escrowTx && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Escrow Status
                  </p>
                  <p className="text-sm text-blue-600">
                    ${job.escrowTx.grossAmount} held in escrow
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    job.escrowTx.status === "FUNDED"
                      ? "bg-green-100 text-green-700"
                      : job.escrowTx.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {job.escrowTx.status}
                </span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Description
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Skills Required
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {job.locationPreference && (
              <div>
                <p className="text-sm text-gray-500">Location Preference</p>
                <p className="font-medium text-gray-900">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {job.locationPreference}
                </p>
              </div>
            )}
            {job.experienceLevel && (
              <div>
                <p className="text-sm text-gray-500">Experience Level</p>
                <p className="font-medium text-gray-900">
                  <Star className="h-4 w-4 inline mr-1" />
                  {job.experienceLevel}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium text-gray-900">{job.category?.label}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
            {/* View/Show Bids button */}
            {isClient && job.status === "OPEN" && (
              <button
                onClick={() => setShowBidForm(!showBidForm)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                {showBidForm ? "Hide Bids" : "View Bids"}
              </button>
            )}

            {/* ✅ NEW: Pay / Fund Escrow Button for Client */}
            {canFundEscrow && (
              <Link
                href={`/freelance/pay?gig=${job.id}`}
                className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Fund Escrow
              </Link>
            )}

            {/* Show payment status if escrow exists */}
            {job.escrowTx && job.escrowTx.status === "FUNDED" && (
              <div className="px-6 py-2.5 bg-green-100 text-green-700 rounded-xl font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Escrow Funded ✓
              </div>
            )}

            {canBid && !hasBid && (
              <button
                onClick={() => setShowBidForm(!showBidForm)}
                className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Place a Bid
              </button>
            )}

            {!isAuthenticated && (
              <Link
                href={`/auth/login?redirect=/freelance/${job.id}`}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
              >
                Login to Bid
              </Link>
            )}

            {hasBid && (
              <div className="flex items-center gap-3">
                <span className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium">
                  You have already bid on this gig
                </span>
                {job.bids?.some(
                  (b) =>
                    b.freelancer?.id === user?.id && b.status === "PENDING",
                ) && (
                  <button
                    onClick={() => {
                      const bid = job.bids.find(
                        (b) => b.freelancer?.id === user?.id,
                      );
                      if (bid) handleWithdrawBid(bid.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Withdraw Bid
                  </button>
                )}
              </div>
            )}

            {job.status === "IN_PROGRESS" && job.contract && (
              <Link
                href={`/contracts/${job.contract.id}`}
                className="px-6 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                View Contract
              </Link>
            )}
          </div>
        </div>

        {/* Bid Form */}
        {showBidForm && canBid && !hasBid && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Place Your Bid
              </h2>
              <span className="text-sm text-gray-500">
                {user?.role === "JOB_SEEKER"
                  ? "Bidding as Job Seeker"
                  : "Bidding as Freelancer"}
              </span>
            </div>
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Bid Amount ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={bidData.amount}
                    onChange={handleBidChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Timeline (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="timelineDays"
                    value={bidData.timelineDays}
                    onChange={handleBidChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    placeholder="7"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cover Letter <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="coverLetter"
                  value={bidData.coverLetter}
                  onChange={handleBidChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                  placeholder="Explain why you're the best fit for this project..."
                  required
                />
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Bid"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBidForm(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Bids List (Client View) */}
        {showBidForm && isClient && job.bids && job.bids.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Bids ({job.bids.length})
            </h2>
            <div className="space-y-4">
              {job.bids.map((bid) => (
                <div
                  key={bid.id}
                  className="border border-gray-100 rounded-xl p-4 hover:border-green-200 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1">
                      {/* Freelancer Info - Clickable */}
                      <Link
                        href={`/users/profile/${bid.freelancer.id}`}
                        className="flex items-center gap-2 hover:underline group"
                      >
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                          {bid.freelancer.firstName?.charAt(0) || "F"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                            {bid.freelancer.firstName} {bid.freelancer.lastName}
                          </p>
                          {bid.freelancer.headline && (
                            <p className="text-xs text-gray-500">
                              {bid.freelancer.headline}
                            </p>
                          )}
                        </div>
                      </Link>

                      {/* Bid Details */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />${bid.amount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {bid.timelineDays} days
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(bid.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            bid.status === "ACCEPTED"
                              ? "bg-green-100 text-green-700"
                              : bid.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {bid.status}
                        </span>
                      </div>

                      {/* Cover Letter */}
                      <p className="text-sm text-gray-600 mt-2">
                        {bid.coverLetter}
                      </p>

                      {/* Freelancer Skills */}
                      {bid.freelancer.skills &&
                        bid.freelancer.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {bid.freelancer.skills
                              .slice(0, 3)
                              .map((skill, index) => (
                                <span
                                  key={index}
                                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            {bid.freelancer.skills.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{bid.freelancer.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

                      {/* View Profile Link */}
                      <Link
                        href={`/users/profile/${bid.freelancer.id}`}
                        className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium mt-2 hover:underline"
                      >
                        <User className="h-3.5 w-3.5" />
                        View Full Profile
                      </Link>
                    </div>

                    {/* Accept Button */}
                    {bid.status === "PENDING" && job.status === "OPEN" && (
                      <button
                        onClick={() => handleAcceptBid(bid.id)}
                        disabled={acceptingBid === bid.id}
                        className={`px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap flex items-center gap-2 ${
                          acceptingBid === bid.id
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {acceptingBid === bid.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Accepting...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Accept Bid
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
