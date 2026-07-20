import { apiFetch } from "@/lib/config";

export interface Company {
  id?: string;
  name: string;
  description: string;
  logoUrl: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  linkedinUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  coverImageUrl: string;
  benefits: string[];
  foundedYear: number;
}

export async function createCompany(accessToken: string, company: Company) {
  return apiFetch("/users/company", {
    method: "POST",

    body: JSON.stringify(company),
  });
}

export async function getCompany() {
  return apiFetch("/users/company", {
    method: "GET",
  });
}

export async function updateCompany(
  accessToken: string,
  company: Partial<Company>,
) {
  return apiFetch("/users/company", {
    method: "PATCH",

    body: JSON.stringify(company),
  });
}

export async function deleteCompany() {
  return apiFetch("/users/company", {
    method: "DELETE",
  });
}
