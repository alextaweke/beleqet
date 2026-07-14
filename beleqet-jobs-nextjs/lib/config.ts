const API_URL = "http://localhost:4000/api/v1";

interface ApiOptions extends RequestInit {}

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { headers, ...rest } = options;

  // Automatically get the token
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(accessToken && {
        Authorization: `Bearer ${accessToken}`,
      }),
      ...headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}
