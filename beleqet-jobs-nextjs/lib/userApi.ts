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
export async function getUserProfile(
  accessToken: string,
): Promise<UserProfile> {
  return apiFetch("/users/profile", {
    method: "GET",
  });
}
export async function updateUserProfile(
  accessToken: string,
  profile: UpdateProfileRequest,
) {
  return apiFetch("/users/profile", {
    method: "PATCH",

    body: JSON.stringify(profile),
  });
}
