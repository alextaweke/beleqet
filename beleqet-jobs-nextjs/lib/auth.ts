// lib/auth.ts
import { apiFetch } from "@/lib/config";

export async function login(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function register(user: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
}) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

// Helper to get current user data from localStorage
export function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const userData = localStorage.getItem("userData");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to get auth token
export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

// Helper to check if user has specific role
export function hasRole(role: string | string[]) {
  const user = getCurrentUser();
  if (!user) return false;

  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}
