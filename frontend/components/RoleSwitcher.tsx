// components/RoleSwitcher.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Briefcase,
  Users,
  Star,
  Shield,
  ChevronDown,
  Check,
} from "lucide-react";

const ROLE_CONFIG = {
  JOB_SEEKER: {
    label: "Job Seeker",
    icon: Users,
    description: "Find jobs and apply",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  FREELANCER: {
    label: "Freelancer",
    icon: Star,
    description: "Find gigs and earn",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  EMPLOYER: {
    label: "Employer",
    icon: Briefcase,
    description: "Post jobs and hire",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  ADMIN: {
    label: "Admin",
    icon: Shield,
    description: "Manage platform",
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
};

export default function RoleSwitcher() {
  const router = useRouter();
  const { user, switchRole, availableRoles } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const currentRole = user.role || "JOB_SEEKER";
  const CurrentIcon = ROLE_CONFIG[currentRole]?.icon || Users;
  const currentLabel = ROLE_CONFIG[currentRole]?.label || currentRole;

  const handleSwitchRole = async (role: string) => {
    if (role === currentRole) {
      setShowDropdown(false);
      return;
    }

    setSwitching(true);
    setError(null);

    try {
      await switchRole(role as any);
      setShowDropdown(false);
    } catch (err: any) {
      setError(err.message || "Failed to switch role");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
        disabled={switching}
      >
        <CurrentIcon className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {currentLabel}
        </span>
        {switching ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-500">Switch Role</p>
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>

            {Object.entries(ROLE_CONFIG).map(([roleKey, config]) => {
              const RoleIcon = config.icon;
              const isActive = currentRole === roleKey;
              const isAvailable = availableRoles.includes(roleKey as any);

              return (
                <button
                  key={roleKey}
                  onClick={() => handleSwitchRole(roleKey)}
                  disabled={!isAvailable || switching}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? `${config.bgColor} ${config.color}`
                      : isAvailable
                        ? "text-gray-700 hover:bg-gray-50"
                        : "text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <RoleIcon className="h-5 w-5" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{config.label}</div>
                    <div className="text-xs opacity-75">
                      {config.description}
                    </div>
                  </div>
                  {isActive && <Check className="h-4 w-4" />}
                  {!isAvailable && (
                    <span className="text-xs text-gray-400">Setup</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
