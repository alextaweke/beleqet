// components/DeleteJobButton.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X, AlertTriangle, Loader2 } from "lucide-react";
import { jobsService } from "@/lib/jobs";

interface DeleteJobButtonProps {
  jobId: string;
  jobTitle: string;
  variant?: "button" | "text" | "icon";
  onDelete?: () => void;
}

export default function DeleteJobButton({
  jobId,
  jobTitle,
  variant = "button",
  onDelete,
}: DeleteJobButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      await jobsService.delete(jobId);

      if (onDelete) {
        onDelete();
      } else {
        router.push("/dashboard/employer");
      }
      router.refresh();
    } catch (err: any) {
      console.error("Error deleting job:", err);
      setError(err.message || "Failed to delete job");
    } finally {
      setLoading(false);
    }
  };

  const getButtonClasses = () => {
    switch (variant) {
      case "text":
        return "inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 transition-colors";
      case "icon":
        return "p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors";
      default:
        return "inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium";
    }
  };

  const getButtonContent = () => {
    switch (variant) {
      case "text":
        return (
          <>
            <Trash2 className="h-4 w-4" />
            Delete
          </>
        );
      case "icon":
        return <Trash2 className="h-4 w-4" />;
      default:
        return (
          <>
            <Trash2 className="h-4 w-4" />
            Delete Job
          </>
        );
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className={getButtonClasses()}>
        {getButtonContent()}
      </button>

      {/* Delete Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete Job
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to delete "
                  <span className="font-medium">{jobTitle}</span>"? This action
                  cannot be undone.
                </p>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Job"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
