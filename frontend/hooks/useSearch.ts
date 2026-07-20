// lib/hooks/useSearch.ts
import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/config";
import { debounce } from "lodash";

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  aggregations: {
    categories: { key: string; doc_count: number }[];
    locations?: { key: string; doc_count: number }[];
    types?: { key: string; doc_count: number }[];
    skills?: { key: string; doc_count: number }[];
    statuses?: { key: string; doc_count: number }[];
    salaryRanges?: {
      key: string;
      doc_count: number;
      from?: number;
      to?: number;
    }[];
  };
}

interface SearchFilters {
  location?: string;
  type?: string;
  category?: string;
  minSalary?: number;
  maxSalary?: number;
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
  status?: string;
  page?: number;
  limit?: number;
}

export function useSearch<T>(
  endpoint: "jobs" | "freelance",
  initialQuery: string = "",
  initialFilters: SearchFilters = {},
) {
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState(initialFilters);
  const [results, setResults] = useState<SearchResult<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (searchQuery: string, searchFilters: SearchFilters) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);

        Object.entries(searchFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              params.append(key, value.join(","));
            } else {
              params.append(key, String(value));
            }
          }
        });

        const url = `/search/${endpoint}?${params.toString()}`;
        const data = await apiFetch(url, { method: "GET" });
        setResults(data);
      } catch (err: any) {
        setError(err.message || "Search failed");
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    },
    [endpoint],
  );

  const debouncedSearch = useCallback(
    debounce((q: string, f: SearchFilters) => search(q, f), 300),
    [search],
  );

  useEffect(() => {
    debouncedSearch(query, filters);
    return () => debouncedSearch.cancel();
  }, [query, filters, debouncedSearch]);

  const updateQuery = (newQuery: string) => setQuery(newQuery);
  const updateFilters = (newFilters: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };
  const resetFilters = () => setFilters({});
  const goToPage = (page: number) => setFilters((prev) => ({ ...prev, page }));

  return {
    query,
    filters,
    results,
    loading,
    error,
    updateQuery,
    updateFilters,
    resetFilters,
    goToPage,
    search,
  };
}
