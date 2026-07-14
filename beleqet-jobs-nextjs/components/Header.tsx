"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  LogOut,
  Briefcase,
  Settings,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";

const navItems = [
  { label: "Job List", href: "/jobs" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "CV Maker", href: "/cv-maker" },
  { label: "Contracts", href: "/contracts" },
  { label: "Messages", href: "/chat" },
  { label: "Freelance Jobs", href: "/freelance" },
];

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Check if user can post jobs (Admin or Employer)
  const canPostJob = user?.role === "ADMIN" || user?.role === "EMPLOYER";

  // Get the dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!isAuthenticated || !user) return "/";

    switch (user?.role) {
      case "ADMIN":
        return "/dashboard/admin";
      case "EMPLOYER":
        return "/dashboard/employer";
      case "JOB_SEEKER":
        return "/dashboard/seeker";
      case "FREELANCER":
        return "/dashboard/freelancer";
      default:
        return "/dashboard";
    }
  };

  // Handle logo click - redirect to appropriate dashboard
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isAuthenticated) {
      router.push(getDashboardUrl());
    } else {
      router.push("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 font-extrabold text-xl text-gray-900 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white text-sm font-bold">
              B
            </span>
            <span>
              BELEQET <span className="text-green-600">JOB</span>
            </span>
          </button>

          {/* Navigation - Center (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-700">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-green-600 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side - Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              // Logged in user
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
                    {user?.firstName?.charAt(0).toUpperCase() ||
                      user?.name?.charAt(0).toUpperCase() ||
                      "U"}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.firstName || user?.name || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user?.role?.toLowerCase().replace("_", " ")}
                        </p>
                      </div>

                      {/* Dashboard - Shows user's role-based dashboard */}
                      <Link
                        href={getDashboardUrl()}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>

                      {/* Post a Job - ONLY for Admin/Employer */}
                      {canPostJob && (
                        <Link
                          href="/post-job"
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          <Briefcase className="h-4 w-4" />
                          Post a Job
                        </Link>
                      )}

                      <Link
                        href="/users/profile"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        Profile Settings
                      </Link>

                      <button
                        onClick={() => {
                          logout();
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // Non-logged in user
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="hidden sm:inline-block text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="hidden sm:inline-block text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Post a Job button - ONLY visible to Admin or Employer */}
            {canPostJob && (
              <Link
                href="/post-job"
                className="inline-flex items-center rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Post a Job
              </Link>
            )}
            {canPostJob && (
              <Link
                href="/freelance/post"
                className="inline-flex items-center rounded-full bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
              >
                Post a Freelance Job
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors px-2 py-1"
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link
                    href={getDashboardUrl()}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors px-2 py-1"
                  >
                    Dashboard
                  </Link>
                  {canPostJob && (
                    <Link
                      href="/post-job"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors px-2 py-1"
                    >
                      Post a Job
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors px-2 py-1 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors px-2 py-1"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors px-2 py-1"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
