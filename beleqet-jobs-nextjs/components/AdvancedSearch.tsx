// components/AdvancedSearch.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Briefcase,
  DollarSign,
  MapPin,
  Clock,
  Star,
  Bookmark,
  BookmarkCheck,
  Filter,
  Plus,
  Trash2,
  Save,
  FolderOpen,
} from "lucide-react";
// simple debounce implementation to avoid depending on lodash
function debounce<F extends (...args: any[]) => any>(func: F, wait = 300) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return function (this: any, ...args: Parameters<F>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  } as (...args: Parameters<F>) => void;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

interface SearchFilters {
  query: string;
  type: "all" | "jobs" | "freelance";
  category: string;
  location: string;
  minBudget: number;
  maxBudget: number;
  minSalary: number;
  maxSalary: number;
  experienceLevel: string;
  remote: boolean;
  featured: boolean;
  urgent: boolean;
  skills: string[];
  sortBy: "recent" | "budget_high" | "budget_low" | "popular";
}

interface AdvancedSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onSaveSearch?: (name: string, filters: SearchFilters) => void;
  savedSearches?: SavedSearch[];
  initialFilters?: Partial<SearchFilters>;
  className?: string;
}

const defaultFilters: SearchFilters = {
  query: "",
  type: "all",
  category: "",
  location: "",
  minBudget: 0,
  maxBudget: 100000,
  minSalary: 0,
  maxSalary: 500000,
  experienceLevel: "",
  remote: false,
  featured: false,
  urgent: false,
  skills: [],
  sortBy: "recent",
};

const experienceLevels = [
  { value: "", label: "Any Level" },
  { value: "entry", label: "Entry Level" },
  { value: "intermediate", label: "Intermediate" },
  { value: "senior", label: "Senior" },
  { value: "expert", label: "Expert" },
];

const sortOptions = [
  { value: "recent", label: "Most Recent" },
  { value: "budget_high", label: "Budget: High to Low" },
  { value: "budget_low", label: "Budget: Low to High" },
  { value: "popular", label: "Most Popular" },
];

const popularSkills = [
  "React",
  "Node.js",
  "Python",
  "JavaScript",
  "TypeScript",
  "Next.js",
  "Tailwind CSS",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "GraphQL",
  "REST API",
  "Git",
  "UI/UX Design",
  "Figma",
  "Adobe XD",
  "Photoshop",
  "Illustrator",
];

export default function AdvancedSearch({
  onSearch,
  onSaveSearch,
  savedSearches = [],
  initialFilters = {},
  className = "",
}: AdvancedSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSavedSearches, setShowSavedSearches] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Load filters from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const loadedFilters: Partial<SearchFilters> = {};

    if (params.get("q")) loadedFilters.query = params.get("q") || "";
    if (params.get("type")) loadedFilters.type = params.get("type") as any;
    if (params.get("category"))
      loadedFilters.category = params.get("category") || "";
    if (params.get("location"))
      loadedFilters.location = params.get("location") || "";
    if (params.get("minBudget"))
      loadedFilters.minBudget = parseInt(params.get("minBudget") || "0");
    if (params.get("maxBudget"))
      loadedFilters.maxBudget = parseInt(params.get("maxBudget") || "100000");
    if (params.get("sortBy"))
      loadedFilters.sortBy = params.get("sortBy") as any;

    if (Object.keys(loadedFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...loadedFilters }));
    }
  }, [searchParams]);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce((f: SearchFilters) => {
      onSearch(f);
      updateUrl(f);
    }, 300),
    [],
  );

  // Update URL with filters
  const updateUrl = (f: SearchFilters) => {
    const params = new URLSearchParams();
    if (f.query) params.set("q", f.query);
    if (f.type !== "all") params.set("type", f.type);
    if (f.category) params.set("category", f.category);
    if (f.location) params.set("location", f.location);
    if (f.minBudget > 0) params.set("minBudget", String(f.minBudget));
    if (f.maxBudget < 100000) params.set("maxBudget", String(f.maxBudget));
    if (f.sortBy !== "recent") params.set("sortBy", f.sortBy);

    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    debouncedSearch(newFilters);
  };

  // Handle add/remove skill
  const handleAddSkill = () => {
    if (skillInput.trim() && !filters.skills.includes(skillInput.trim())) {
      const newSkills = [...filters.skills, skillInput.trim()];
      handleFilterChange("skills", newSkills);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    const newSkills = filters.skills.filter((s) => s !== skill);
    handleFilterChange("skills", newSkills);
  };

  // Handle save search
  const handleSaveSearch = () => {
    if (!saveName.trim()) return;
    if (onSaveSearch) {
      onSaveSearch(saveName, filters);
      setSaveModalOpen(false);
      setSaveName("");
    }
  };

  // Apply saved search
  const applySavedSearch = (saved: SavedSearch) => {
    setFilters(saved.filters);
    onSearch(saved.filters);
    updateUrl(saved.filters);
    setShowSavedSearches(false);
  };

  // Clear all filters
  const clearFilters = () => {
    const cleared = { ...defaultFilters };
    setFilters(cleared);
    onSearch(cleared);
    router.push("?", { scroll: false });
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.type !== "all") count++;
    if (filters.category) count++;
    if (filters.location) count++;
    if (filters.minBudget > 0 || filters.maxBudget < 100000) count++;
    if (filters.experienceLevel) count++;
    if (filters.remote) count++;
    if (filters.featured) count++;
    if (filters.urgent) count++;
    if (filters.skills.length > 0) count++;
    return count;
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}
    >
      {/* ── Main Search Bar ── */}
      <div className="p-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all">
            <Search className="h-5 w-5 text-gray-400 shrink-0" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              placeholder="Search for jobs, freelance projects, or keywords..."
              className="w-full text-sm bg-transparent outline-none placeholder:text-gray-400"
            />
            {filters.query && (
              <button
                onClick={() => handleFilterChange("query", "")}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={() => onSearch(filters)}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            Search
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced
            {getActiveFilterCount() > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                {getActiveFilterCount()}
              </span>
            )}
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Type Quick Filters */}
          <div className="flex gap-1">
            {(["all", "jobs", "freelance"] as const).map((type) => (
              <button
                key={type}
                onClick={() => handleFilterChange("type", type)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filters.type === type
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {type === "all"
                  ? "All"
                  : type === "jobs"
                    ? "💼 Jobs"
                    : "💻 Freelance"}
              </button>
            ))}
          </div>

          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowSavedSearches(!showSavedSearches)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bookmark className="h-4 w-4" />
                Saved
                <ChevronDown className="h-3 w-3" />
              </button>

              {showSavedSearches && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
                  <div className="p-3 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-900">
                      Saved Searches
                    </h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {savedSearches.map((saved) => (
                      <button
                        key={saved.id}
                        onClick={() => applySavedSearch(saved)}
                        className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {saved.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {saved.query || "No query"}
                          </p>
                        </div>
                        <FolderOpen className="h-4 w-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Save Search Button */}
          {onSaveSearch && (
            <button
              onClick={() => setSaveModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              Save Search
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {getActiveFilterCount() > 0 && (
            <>
              <span className="text-xs text-gray-500">Active filters:</span>
              {filters.type !== "all" && (
                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                  {filters.type === "jobs" ? "Jobs" : "Freelance"}
                  <button
                    onClick={() => handleFilterChange("type", "all")}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.category && (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs px-2.5 py-1 rounded-full">
                  {filters.category}
                  <button
                    onClick={() => handleFilterChange("category", "")}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.location && (
                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs px-2.5 py-1 rounded-full">
                  📍 {filters.location}
                  <button
                    onClick={() => handleFilterChange("location", "")}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {(filters.minBudget > 0 || filters.maxBudget < 100000) && (
                <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs px-2.5 py-1 rounded-full">
                  💰 ETB {filters.minBudget} - {filters.maxBudget}
                  <button
                    onClick={() => {
                      handleFilterChange("minBudget", 0);
                      handleFilterChange("maxBudget", 100000);
                    }}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.experienceLevel && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full">
                  {filters.experienceLevel}
                  <button
                    onClick={() => handleFilterChange("experienceLevel", "")}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.remote && (
                <span className="inline-flex items-center gap-1 bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-full">
                  🌍 Remote
                  <button
                    onClick={() => handleFilterChange("remote", false)}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filters.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full"
                >
                  #{skill}
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-red-500 transition-colors"
              >
                Clear all
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Advanced Filters ── */}
      {showAdvanced && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Category
              </label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                placeholder="e.g., Web Development"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                placeholder="e.g., Addis Ababa"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Experience Level
              </label>
              <select
                value={filters.experienceLevel}
                onChange={(e) =>
                  handleFilterChange("experienceLevel", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white"
              >
                {experienceLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Budget Range (ETB)
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  Min
                </span>
                <input
                  type="number"
                  value={filters.minBudget}
                  onChange={(e) =>
                    handleFilterChange(
                      "minBudget",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                  min={0}
                />
              </div>
              <span className="text-gray-400">—</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                  Max
                </span>
                <input
                  type="number"
                  value={filters.maxBudget}
                  onChange={(e) =>
                    handleFilterChange(
                      "maxBudget",
                      parseInt(e.target.value) || 100000,
                    )
                  }
                  className="w-full pl-12 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                  min={0}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Skills
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), handleAddSkill())
                  }
                  placeholder="Add skill..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                />
                <button
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Popular Skills */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {popularSkills.slice(0, 10).map((skill) => (
                <button
                  key={skill}
                  onClick={() => {
                    if (!filters.skills.includes(skill)) {
                      const newSkills = [...filters.skills, skill];
                      handleFilterChange("skills", newSkills);
                    }
                  }}
                  className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                    filters.skills.includes(skill)
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>

            {/* Selected Skills */}
            {filters.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {filters.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full"
                  >
                    {skill}
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.remote}
                onChange={(e) => handleFilterChange("remote", e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">🌍 Remote Only</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.featured}
                onChange={(e) =>
                  handleFilterChange("featured", e.target.checked)
                }
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">⭐ Featured</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.urgent}
                onChange={(e) => handleFilterChange("urgent", e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">🔥 Urgent</span>
            </label>
          </div>

          {/* Sort By */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sort By
            </label>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    handleFilterChange("sortBy", option.value as any)
                  }
                  className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                    filters.sortBy === option.value
                      ? "bg-green-100 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Save Search Modal ── */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Save Search
            </h3>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Enter search name..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={handleSaveSearch}
                disabled={!saveName.trim()}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setSaveModalOpen(false);
                  setSaveName("");
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
