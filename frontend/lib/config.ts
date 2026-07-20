// lib/config.ts
const API_URL = "http://localhost:4000/api/v1";

interface ApiOptions extends RequestInit {}

export async function apiFetch(endpoint: string, options: ApiOptions = {}) {
  const { headers, ...rest } = options;

  // Automatically get the token
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  try {
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

    // Try to parse response as JSON
    let data;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, get text
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text || "Request failed" };
      }
    }

    if (!response.ok) {
      // Use error message from response or default
      const errorMessage =
        data.message ||
        data.error ||
        `HTTP ${response.status}: ${response.statusText}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).data = data;
      throw error;
    }

    return data;
  } catch (error: any) {
    // If it's already an Error with status, rethrow
    if (error.status) {
      throw error;
    }
    // Network errors or other issues
    console.error("API fetch error:", error);
    throw new Error(
      error.message || "Network error. Please check your connection.",
    );
  }
}
