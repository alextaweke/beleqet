import { apiFetch } from "@/lib/config";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
  telegramId: string | null;
  createdAt: string;
  company: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  defaultResumeUrl: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
}

export interface PublicUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl: string | null;
  phone: string | null;
  telegramId: string | null;
  createdAt: string;
  company: {
    name: string;
    verified?: boolean;
    description?: string;
    industry?: string;
    size?: string;
    location?: string;
    website?: string;
  } | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  defaultResumeUrl: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  skills: string[];
  stats?: {
    totalJobs: number;
    totalEarned: number;
    rating: number;
    completedProjects: number;
  };
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  headline?: string;
  bio?: string;
  location?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  defaultResumeUrl?: string;
  avatarUrl?: string;
  skills?: string[];
}

/**
 * Get the current user's profile (requires authentication)
 */
export async function getUserProfile(
  accessToken: string,
): Promise<UserProfile> {
  return apiFetch("/users/profile", {
    method: "GET",
  });
}

/**
 * Get a public user profile by ID (no authentication required)
 */
export async function getPublicProfile(
  userId: string,
): Promise<PublicUserProfile> {
  return apiFetch(`/users/profile/${userId}`, {
    method: "GET",
  });
}

/**
 * Update the current user's profile (requires authentication)
 */
export async function updateUserProfile(
  accessToken: string,
  profile: UpdateProfileRequest,
) {
  return apiFetch("/users/profile", {
    method: "PATCH",
    body: JSON.stringify(profile),
  });
}
