// app/dashboard/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/auth/login");
        return;
      }

      // Redirect based on role - but job seekers and freelancers go to unified dashboard
      const role = user?.role || "JOB_SEEKER";
      if (role === "ADMIN") {
        router.push("/dashboard/admin");
      } else if (role === "EMPLOYER") {
        router.push("/dashboard/employer");
      } else {
        // JOB_SEEKER, FREELANCER, or any other role
        router.push("/dashboard/seeker");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
