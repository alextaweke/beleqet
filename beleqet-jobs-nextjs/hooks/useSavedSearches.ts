// lib/hooks/useSavedSearches.ts
import { useState, useEffect } from "react";

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  createdAt: string;
}

export function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // Load saved searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedSearches");
      if (saved) {
        setSavedSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error("Error loading saved searches:", error);
    }
  }, []);

  // Save search
  const saveSearch = (name: string, filters: any) => {
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query: filters.query || "",
      filters,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem("savedSearches", JSON.stringify(updated));
    return newSearch;
  };

  // Delete saved search
  const deleteSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    localStorage.setItem("savedSearches", JSON.stringify(updated));
  };

  // Update saved search
  const updateSearch = (id: string, name: string) => {
    const updated = savedSearches.map((s) =>
      s.id === id ? { ...s, name } : s,
    );
    setSavedSearches(updated);
    localStorage.setItem("savedSearches", JSON.stringify(updated));
  };

  return {
    savedSearches,
    saveSearch,
    deleteSearch,
    updateSearch,
  };
}
