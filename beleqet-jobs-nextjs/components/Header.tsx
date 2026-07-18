"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
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
  User,
  FileText,
  MessageCircle,
  Bell,
  Star,
  Wallet,
  Users,
  Shield,
  Scale,
  PlusCircle,
  FolderOpen,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart,
} from "lucide-react";

// ── Public Navigation ──────────────────────────────────────────────────
const publicNavItems = [
  { label: "Jobs", href: "/vacancy" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "CV Maker", href: "/cv-maker" },
];

// ── Role-Based Navigation ─────────────────────────────────────────────
const roleNavItems = {
  JOB_SEEKER: [
    { label: "Dashboard", href: "/dashboard/seeker" },
    { label: "My Applications", href: "/dashboard/seeker/applications" },
    { label: "Wallet", href: "/freelance/wallet" },
    { label: "Profile", href: "/users/profile" },
    { label: "Analytics", href: "/dashboard/seeker/analytics" },
  ],
  FREELANCER: [
    { label: "Dashboard", href: "/dashboard/freelancer" },
    { label: "My Contracts", href: "/contracts" },
    { label: "Wallet", href: "/freelance/wallet" },
    { label: "Profile", href: "/users/profile" },
    { label: "Portfolio", href: "/portfolio" },
  ],
  EMPLOYER: [
    { label: "Dashboard", href: "/dashboard/employer" },
    { label: "Post a Job", href: "/post-job" },
    { label: "Post a Gig", href: "/freelance/post" },
    { label: "Applications", href: "/dashboard/employer/applications" },
    { label: "Contracts", href: "/contracts" },
    { label: "Profile", href: "/users/profile" },
    { label: "Analytics", href: "/dashboard/employer/analytics" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard/admin" },
    { label: "Users", href: "/admin/users" },
    { label: "Post a Job", href: "/post-job" },
    { label: "Disputes", href: "/admin/disputes" },
    { label: "Contracts", href: "/contracts" },
    { label: "Profile", href: "/users/profile" },
    { label: "Analytics", href: "/dashboard/admin/analytics" },
  ],
};

// ── Protected Nav Items (Common for all logged-in users) ─────────────
const protectedNavItems = [
  { label: "Contracts", href: "/contracts" },
  { label: "Messages", href: "/chat" },
];

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hoveredDropdown, setHoveredDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const userRole = (user?.role as keyof typeof roleNavItems) || "JOB_SEEKER";
  const canPostJob = user?.role === "ADMIN" || user?.role === "EMPLOYER";

  // ── Close dropdowns on click outside ────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Get dashboard URL ────────────────────────────────────────────────
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

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(isAuthenticated ? getDashboardUrl() : "/");
  };

  // ── Get role-specific nav items ─────────────────────────────────────
  const getRoleNavItems = () => {
    if (!isAuthenticated || !user) return [];
    return roleNavItems[userRole] || [];
  };

  // ── Get display name ─────────────────────────────────────────────────
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.firstName || user?.email || "User";
  };

  // ── Get user initials ────────────────────────────────────────────────
  const getInitials = () => {
    const name = getDisplayName();
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name[0]?.toUpperCase() || "U";
  };

  // ── Get role badge ──────────────────────────────────────────────────
  const getRoleBadge = () => {
    if (!user?.role) return "";
    return user.role.toLowerCase().replace("_", " ");
  };

  // ── Notifications (Mock data) ──────────────────────────────────────
  const notifications = [
    {
      id: 1,
      title: "New application received",
      time: "5 min ago",
      read: false,
      icon: Users,
    },
    {
      id: 2,
      title: "Your job post is live",
      time: "1 hour ago",
      read: false,
      icon: CheckCircle,
    },
    {
      id: 3,
      title: "New message from client",
      time: "2 hours ago",
      read: true,
      icon: MessageCircle,
    },
    {
      id: 4,
      title: "Contract milestone approved",
      time: "1 day ago",
      read: true,
      icon: Award,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* ── Logo ── */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 font-extrabold text-xl text-gray-900 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white text-sm font-bold">
              B
            </span>
            <span className="hidden sm:inline">
              BELEQET <span className="text-green-600">JOB</span>
            </span>
          </button>

          {/* ── Navigation (Desktop) ── */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-gray-700">
            {/* Public Nav Items with Hover Dropdown */}
            {publicNavItems.map((item) => (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => setHoveredDropdown(item.label)}
                onMouseLeave={() => setHoveredDropdown(null)}
              >
                <Link
                  href={item.href}
                  className="px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors flex items-center gap-1"
                >
                  {item.label}
                  {item.label === "Jobs" && <ChevronDown className="h-3 w-3" />}
                </Link>
                {/* Dropdown for Jobs */}
                {item.label === "Jobs" && hoveredDropdown === "Jobs" && (
                  <div className="absolute top-full left-0  w-56 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                    <Link
                      href="/vacancy"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      Browse Jobs
                    </Link>
                    {/* <Link
                      href="/jobs/saved"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                    >
                      <Star className="h-4 w-4 text-gray-400" />
                      Saved Jobs
                    </Link> */}
                    {canPostJob && (
                      <Link
                        href="/post-job"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors border-t border-gray-100"
                      >
                        <PlusCircle className="h-4 w-4 text-gray-400" />
                        Post a Job
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Protected Nav Items */}
            {isAuthenticated &&
              protectedNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors"
                >
                  {item.label}
                </Link>
              ))}

            {/* Role-based Nav Items in Dropdown */}
            {isAuthenticated && user && (
              <div className="relative ml-2">
                <button
                  onMouseEnter={() => setHoveredDropdown("role")}
                  onMouseLeave={() => setHoveredDropdown(null)}
                  className="px-3 py-2 rounded-lg hover:bg-gray-50 hover:text-green-600 transition-colors flex items-center gap-1 text-green-600"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                  <ChevronDown className="h-3 w-3" />
                </button>

                {/* Role Dropdown */}
                {hoveredDropdown === "role" && (
                  <div
                    className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50"
                    onMouseEnter={() => setHoveredDropdown("role")}
                    onMouseLeave={() => setHoveredDropdown(null)}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {getRoleBadge()}
                      </p>
                    </div>

                    {getRoleNavItems().map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        {item.label === "Dashboard" && (
                          <LayoutDashboard className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "My Applications" && (
                          <FileText className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Wallet" && (
                          <Wallet className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Profile" && (
                          <User className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Post a Job" && (
                          <PlusCircle className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Post a Gig" && (
                          <Briefcase className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Applications" && (
                          <FileText className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Contracts" && (
                          <FileText className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Portfolio" && (
                          <FolderOpen className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Users" && (
                          <Users className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Disputes" && (
                          <Scale className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label === "Analytics" && (
                          <BarChart className="h-4 w-4 text-gray-400" />
                        )}
                        {item.label}
                      </Link>
                    ))}

                    <div className="border-t border-gray-100">
                      <Link
                        href="/settings"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>

          {/* ── Right Side ── */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            {isAuthenticated && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900">
                        Notifications
                      </h3>
                      <button className="text-xs text-green-600 hover:text-green-700">
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.map((notif) => {
                        const Icon = notif.icon;
                        return (
                          <div
                            key={notif.id}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                              !notif.read ? "bg-green-50" : ""
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg ${!notif.read ? "bg-green-100" : "bg-gray-100"}`}
                            >
                              <Icon
                                className={`h-4 w-4 ${!notif.read ? "text-green-600" : "text-gray-400"}`}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                              >
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-400">
                                {notif.time}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <Link
                      href="/notifications"
                      className="block text-center text-sm text-green-600 hover:text-green-700 font-medium py-3 border-t border-gray-100"
                    >
                      View all notifications
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* User Avatar / Login */}
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 text-green-700 flex items-center justify-center font-semibold text-sm">
                    {getInitials()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:block">
                    {user?.firstName || "User"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500 hidden sm:block" />
                </button>

                {/* User Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {getDisplayName()}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {getRoleBadge()}
                      </p>
                    </div>

                    {/* Role-based quick links */}
                    {getRoleNavItems()
                      .slice(0, 4)
                      .map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                        >
                          {item.label === "Dashboard" && (
                            <LayoutDashboard className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label === "My Applications" && (
                            <FileText className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label === "Wallet" && (
                            <Wallet className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label === "Profile" && (
                            <User className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label === "Post a Job" && (
                            <PlusCircle className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label === "Post a Gig" && (
                            <Briefcase className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label === "Applications" && (
                            <FileText className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label === "Contracts" && (
                            <FileText className="h-4 w-4 text-gray-400" />
                          )}
                          {item.label}
                        </Link>
                      ))}

                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <Link
                        href="/settings"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600 transition-colors"
                      >
                        <Settings className="h-4 w-4 text-gray-400" />
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Non-logged in user
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium text-gray-700 hover:text-green-600 transition-colors px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* ── Mobile Menu Button ── */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700" />
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile Menu ── */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <nav className="flex flex-col space-y-1">
              {/* Public Nav Items */}
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors px-3 py-2.5 rounded-lg"
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-100 my-2 pt-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">
                      Your Account
                    </p>
                    {getRoleNavItems().map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors px-3 py-2.5 rounded-lg"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 my-2 pt-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-1">
                      Communication
                    </p>
                    {protectedNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 transition-colors px-3 py-2.5 rounded-lg"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-gray-100 my-2 pt-2">
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors px-3 py-2.5 rounded-lg w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="border-t border-gray-100 my-2 pt-2 space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-sm font-medium text-center text-gray-700 hover:text-green-600 transition-colors px-3 py-2.5 rounded-lg bg-gray-50"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-sm font-medium text-center bg-green-600 text-white px-3 py-2.5 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
