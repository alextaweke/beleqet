// app/contracts/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Clock,
  Calendar,
  User,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileText,
  Building2,
  MapPin,
  Tag,
  Users,
  MessageCircle,
  FileCheck,
  Star,
  Plus,
  X,
  Upload,
  Paperclip,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { apiFetch } from "@/lib/config";
import { formatDistanceToNow, format } from "date-fns";

interface Contract {
  id: string;
  freelanceJobId: string;
  clientId: string;
  freelancerId: string;
  agreedAmount: number;
  currency: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  chatRoomId?: string;
  freelanceJob: {
    id: string;
    title: string;
    description: string;
    categoryId: string;
    clientId: string;
    budgetMin: number;
    budgetMax: number;
    currency: string;
    pricingType: string;
    deadlineDays: number;
    skills: string[];
    status: string;
    featured: boolean;
    createdAt: string;
    updatedAt: string;
    attachments: string[];
    experienceLevel: string;
    locationPreference: string;
    category: {
      id: string;
      slug: string;
      label: string;
      icon: string;
    };
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  freelancer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  milestones: Milestone[];
  dispute: Dispute | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  status: string;
  deadline: string;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deliverables: Deliverable[];
}

interface Deliverable {
  id: string;
  fileUrl: string | null;
  notes: string | null;
  submittedAt: string;
}

interface Dispute {
  id: string;
  reason: string;
  evidenceUrls: string[];
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Milestone creation state
  const [showCreateMilestone, setShowCreateMilestone] = useState(false);
  const [creatingMilestone, setCreatingMilestone] = useState(false);
  const [milestoneError, setMilestoneError] = useState<string | null>(null);
  const [milestoneSuccess, setMilestoneSuccess] = useState(false);
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    amount: "",
    deadline: "",
  });

  // Deliverable submission state
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(
    null,
  );
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);
  const [deliverableError, setDeliverableError] = useState<string | null>(null);
  const [deliverableSuccess, setDeliverableSuccess] = useState(false);
  const [deliverableForm, setDeliverableForm] = useState({
    fileUrl: "",
    notes: "",
  });

  // Approving milestone
  const [approvingMilestone, setApprovingMilestone] = useState<string | null>(
    null,
  );

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login to view this contract");
          setLoading(false);
          return;
        }

        const data = await apiFetch(`/freelance/contracts/${params.id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setContract(data);
      } catch (err: any) {
        console.error("Error fetching contract:", err);
        setError(err.message || "Contract not found");
      } finally {
        setLoading(false);
      }
    };

    if (params.id && isAuthenticated) {
      fetchContract();
    }
  }, [params.id, isAuthenticated]);

  const isClient = user?.id === contract?.clientId;
  const isFreelancer = user?.id === contract?.freelancerId;
  const isParticipant = isClient || isFreelancer;
  const isActive = contract?.status === "ACTIVE";
  const canAddMilestone = isClient && isActive;
  const canSubmitDeliverable = isFreelancer && isActive;

  // ============================================
  // Milestone Creation
  // ============================================

  const handleMilestoneChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setMilestoneForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    setMilestoneError(null);
    setMilestoneSuccess(false);

    if (!milestoneForm.title.trim()) {
      setMilestoneError("Please enter a milestone title");
      return;
    }
    if (!milestoneForm.amount || Number(milestoneForm.amount) <= 0) {
      setMilestoneError("Please enter a valid amount");
      return;
    }
    if (!milestoneForm.deadline) {
      setMilestoneError("Please select a deadline");
      return;
    }

    if (Number(milestoneForm.amount) > (contract?.agreedAmount || 0)) {
      setMilestoneError(
        `Amount cannot exceed ${contract?.currency} ${contract?.agreedAmount?.toLocaleString()}`,
      );
      return;
    }

    setCreatingMilestone(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setMilestoneError("Please login first");
        setCreatingMilestone(false);
        return;
      }

      await apiFetch("/freelance/milestones", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          contractId: contract?.id,
          title: milestoneForm.title,
          description: milestoneForm.description || "",
          amount: Number(milestoneForm.amount),
          deadline: new Date(milestoneForm.deadline).toISOString(),
        }),
      });

      setMilestoneSuccess(true);

      setTimeout(async () => {
        const updatedContract = await apiFetch(
          `/freelance/contracts/${params.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setContract(updatedContract);
        setMilestoneForm({
          title: "",
          description: "",
          amount: "",
          deadline: "",
        });
        setShowCreateMilestone(false);
        setMilestoneSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error creating milestone:", err);
      setMilestoneError(err.message || "Failed to create milestone");
    } finally {
      setCreatingMilestone(false);
    }
  };

  // ============================================
  // Milestone Approval
  // ============================================

  const handleApproveMilestone = async (milestoneId: string) => {
    if (!confirm("Are you sure you want to approve this milestone?")) return;

    setApprovingMilestone(milestoneId);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("Please login first");
        setApprovingMilestone(null);
        return;
      }

      await apiFetch(`/freelance/milestones/${milestoneId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedContract = await apiFetch(
        `/freelance/contracts/${params.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      setContract(updatedContract);
    } catch (err: any) {
      console.error("Error approving milestone:", err);
      alert(err.message || "Failed to approve milestone");
    } finally {
      setApprovingMilestone(null);
    }
  };

  // ============================================
  // Deliverable Submission
  // ============================================

  const handleDeliverableChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setDeliverableForm((prev) => ({ ...prev, [name]: value }));
  };

  const openDeliverableModal = (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setDeliverableForm({ fileUrl: "", notes: "" });
    setDeliverableError(null);
    setDeliverableSuccess(false);
    setShowDeliverableModal(true);
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeliverableError(null);
    setDeliverableSuccess(false);

    if (!deliverableForm.fileUrl.trim()) {
      setDeliverableError("Please enter a file URL");
      return;
    }

    setSubmittingDeliverable(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setDeliverableError("Please login first");
        setSubmittingDeliverable(false);
        return;
      }

      await apiFetch(
        `/freelance/milestones/${selectedMilestoneId}/deliverables`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileUrl: deliverableForm.fileUrl,
            notes: deliverableForm.notes || "",
          }),
        },
      );

      setDeliverableSuccess(true);

      setTimeout(async () => {
        const updatedContract = await apiFetch(
          `/freelance/contracts/${params.id}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        setContract(updatedContract);
        setDeliverableForm({ fileUrl: "", notes: "" });
        setShowDeliverableModal(false);
        setSelectedMilestoneId(null);
        setDeliverableSuccess(false);
      }, 1500);
    } catch (err: any) {
      console.error("Error submitting deliverable:", err);
      setDeliverableError(err.message || "Failed to submit deliverable");
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  // ============================================
  // Helper Functions
  // ============================================

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      DISPUTED: "bg-red-100 text-red-700",
      CANCELLED: "bg-gray-100 text-gray-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getMilestoneStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      APPROVED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      SUBMITTED: "bg-purple-100 text-purple-700",
      REVISION_REQUESTED: "bg-orange-100 text-orange-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const getMilestoneStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      APPROVED: "Approved",
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      SUBMITTED: "Submitted for Review",
      REVISION_REQUESTED: "Revision Requested",
    };
    return labels[status] || status;
  };

  // ============================================
  // Render
  // ============================================

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">
              {error || "Contract not found"}
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Back Button */}
        <Link
          href={isClient ? "/dashboard/employer" : "/dashboard/freelancer"}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {contract.freelanceJob.title}
                </h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}
                >
                  {contract.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {contract.freelanceJob.category?.label || "Uncategorized"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Started{" "}
                  {formatDistanceToNow(new Date(contract.startedAt), {
                    addSuffix: true,
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {contract.currency} {contract.agreedAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Job Description
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {contract.freelanceJob.description}
              </p>
            </div>

            {/* Skills */}
            {contract.freelanceJob.skills &&
              contract.freelanceJob.skills.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5 text-gray-500" />
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {contract.freelanceJob.skills.map((skill, index) => (
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

            {/* Milestones */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-gray-500" />
                  Milestones ({contract.milestones?.length || 0})
                </h2>
                {canAddMilestone && (
                  <button
                    onClick={() => setShowCreateMilestone(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Milestone
                  </button>
                )}
              </div>

              {contract.milestones && contract.milestones.length > 0 ? (
                <div className="space-y-4">
                  {contract.milestones.map((milestone, index) => {
                    const isPending =
                      milestone.status === "PENDING" ||
                      milestone.status === "IN_PROGRESS";
                    const isSubmitted = milestone.status === "SUBMITTED";
                    const isApproved = milestone.status === "APPROVED";

                    return (
                      <div
                        key={milestone.id}
                        className={`border rounded-xl p-4 transition-colors ${
                          isApproved
                            ? "border-green-200 bg-green-50/50"
                            : isSubmitted
                              ? "border-purple-200 bg-purple-50/50"
                              : "border-gray-200 hover:border-green-200"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-sm font-medium text-gray-400">
                                #{index + 1}
                              </span>
                              <h3 className="font-semibold text-gray-900">
                                {milestone.title}
                              </h3>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMilestoneStatusColor(
                                  milestone.status,
                                )}`}
                              >
                                {getMilestoneStatusLabel(milestone.status)}
                              </span>
                            </div>
                            {milestone.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {milestone.description}
                              </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3.5 w-3.5" />
                                {contract.currency}{" "}
                                {milestone.amount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Due:{" "}
                                {format(
                                  new Date(milestone.deadline),
                                  "MMM d, yyyy",
                                )}
                              </span>
                              {milestone.approvedAt && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Approved{" "}
                                  {formatDistanceToNow(
                                    new Date(milestone.approvedAt),
                                    { addSuffix: true },
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Deliverables */}
                            {milestone.deliverables &&
                              milestone.deliverables.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <p className="text-xs font-medium text-gray-500 mb-2">
                                    Deliverables:
                                  </p>
                                  {milestone.deliverables.map((deliverable) => (
                                    <div
                                      key={deliverable.id}
                                      className="flex items-center gap-2 text-sm text-gray-600 py-1"
                                    >
                                      {deliverable.fileUrl ? (
                                        <a
                                          href={deliverable.fileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-green-600 hover:underline flex items-center gap-1"
                                        >
                                          <Paperclip className="h-3.5 w-3.5" />
                                          View File
                                        </a>
                                      ) : (
                                        <span className="text-gray-400">
                                          No file uploaded
                                        </span>
                                      )}
                                      {deliverable.notes && (
                                        <span className="text-gray-500">
                                          - {deliverable.notes}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400">
                                        {formatDistanceToNow(
                                          new Date(deliverable.submittedAt),
                                          { addSuffix: true },
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {/* Submit Deliverable - Freelancer only */}
                            {canSubmitDeliverable && isPending && (
                              <button
                                onClick={() =>
                                  openDeliverableModal(milestone.id)
                                }
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-1"
                              >
                                <Upload className="h-4 w-4" />
                                Submit Work
                              </button>
                            )}

                            {/* Approve Milestone - Client only */}
                            {isClient && isSubmitted && (
                              <button
                                onClick={() =>
                                  handleApproveMilestone(milestone.id)
                                }
                                disabled={approvingMilestone === milestone.id}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {approvingMilestone === milestone.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Approving...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4" />
                                    Approve
                                  </>
                                )}
                              </button>
                            )}

                            {/* Status indicator for approved milestones */}
                            {isApproved && (
                              <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium flex items-center gap-1">
                                <CheckCircle className="h-4 w-4" />
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No milestones created yet</p>
                  {canAddMilestone && (
                    <button
                      onClick={() => setShowCreateMilestone(true)}
                      className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Create first milestone →
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Dispute */}
            {contract.dispute && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Dispute Raised
                </h3>
                <p className="text-sm text-red-700">
                  {contract.dispute.reason}
                </p>
                {contract.dispute.evidenceUrls &&
                  contract.dispute.evidenceUrls.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600 font-medium">
                        Evidence:
                      </p>
                      {contract.dispute.evidenceUrls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-red-600 hover:underline block"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  )}
                {contract.dispute.resolution && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Resolution:
                    </p>
                    <p className="text-sm text-green-700">
                      {contract.dispute.resolution}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                Participants
              </h3>

              <div className="mb-4">
                <p className="text-xs text-gray-500">Client</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold">
                    {contract.client.firstName?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {contract.client.firstName} {contract.client.lastName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contract.client.email}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500">Freelancer</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-semibold">
                    {contract.freelancer.firstName?.charAt(0) || "F"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {contract.freelancer.firstName}{" "}
                      {contract.freelancer.lastName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {contract.freelancer.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                {isParticipant &&
                  contract.status === "ACTIVE" &&
                  contract.chatRoomId && (
                    <Link
                      href={`/chat/${contract.chatRoomId}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      <MessageCircle className="h-4 w-4 text-gray-400" />
                      Open Chat
                    </Link>
                  )}
                {canAddMilestone && (
                  <button
                    onClick={() => setShowCreateMilestone(true)}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-700 w-full text-left"
                  >
                    <FileCheck className="h-4 w-4 text-gray-400" />
                    Add Milestone
                  </button>
                )}
                {isParticipant && contract.status === "ACTIVE" && (
                  <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-red-50 transition-colors text-sm text-red-600 w-full text-left">
                    <AlertCircle className="h-4 w-4" />
                    Raise Dispute
                  </button>
                )}
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Job Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Pricing Type</span>
                  <span className="text-gray-900 font-medium">
                    {contract.freelanceJob.pricingType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Experience Level</span>
                  <span className="text-gray-900 font-medium">
                    {contract.freelanceJob.experienceLevel || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="text-gray-900 font-medium">
                    {contract.freelanceJob.locationPreference || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Deadline</span>
                  <span className="text-gray-900 font-medium">
                    {contract.freelanceJob.deadlineDays} days
                  </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-2">
                📊 Summary
              </h3>
              <div className="space-y-1 text-sm text-green-700">
                <div className="flex justify-between">
                  <span>Total Milestones</span>
                  <span className="font-medium">
                    {contract.milestones?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span className="font-medium">
                    {contract.milestones?.filter((m) => m.status === "APPROVED")
                      .length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress</span>
                  <span className="font-medium">
                    {contract.milestones?.filter(
                      (m) =>
                        m.status === "PENDING" || m.status === "IN_PROGRESS",
                    ).length || 0}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-green-200">
                  <span>Total Value</span>
                  <span className="font-medium">
                    {contract.currency} {contract.agreedAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Milestone Modal */}
      {showCreateMilestone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                Create Milestone
              </h2>
              <button
                onClick={() => {
                  setShowCreateMilestone(false);
                  setMilestoneError(null);
                  setMilestoneSuccess(false);
                  setMilestoneForm({
                    title: "",
                    description: "",
                    amount: "",
                    deadline: "",
                  });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {milestoneSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Milestone Created!
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your milestone has been created successfully.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleCreateMilestone} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={milestoneForm.title}
                      onChange={handleMilestoneChange}
                      placeholder="Enter milestone title"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={milestoneForm.description}
                      onChange={handleMilestoneChange}
                      rows={3}
                      placeholder="Describe what needs to be delivered..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Amount ({contract.currency}){" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={milestoneForm.amount}
                      onChange={handleMilestoneChange}
                      placeholder="Enter amount"
                      min="1"
                      max={contract.agreedAmount}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Max: {contract.currency}{" "}
                      {contract.agreedAmount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Deadline <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={milestoneForm.deadline}
                      onChange={handleMilestoneChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    />
                  </div>

                  {milestoneError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-700">{milestoneError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateMilestone(false);
                        setMilestoneError(null);
                        setMilestoneForm({
                          title: "",
                          description: "",
                          amount: "",
                          deadline: "",
                        });
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creatingMilestone}
                      className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {creatingMilestone ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Milestone"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Deliverable Modal */}
      {showDeliverableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                Submit Deliverable
              </h2>
              <button
                onClick={() => {
                  setShowDeliverableModal(false);
                  setDeliverableError(null);
                  setDeliverableSuccess(false);
                  setDeliverableForm({ fileUrl: "", notes: "" });
                  setSelectedMilestoneId(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {deliverableSuccess ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Deliverable Submitted!
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Your work has been submitted for review.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      File URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      name="fileUrl"
                      value={deliverableForm.fileUrl}
                      onChange={handleDeliverableChange}
                      placeholder="https://example.com/file.pdf"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload your file to Google Drive, Dropbox, or any cloud
                      storage and paste the shareable link here.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={deliverableForm.notes}
                      onChange={handleDeliverableChange}
                      rows={3}
                      placeholder="Add any notes about your submission..."
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                    />
                  </div>

                  {deliverableError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-700">{deliverableError}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeliverableModal(false);
                        setDeliverableError(null);
                        setDeliverableForm({ fileUrl: "", notes: "" });
                        setSelectedMilestoneId(null);
                      }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingDeliverable}
                      className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submittingDeliverable ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Submit Deliverable
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
