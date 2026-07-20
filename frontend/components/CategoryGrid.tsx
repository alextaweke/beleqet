"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Laptop,
  Megaphone,
  Landmark,
  HeartPulse,
  GraduationCap,
  Cog,
  MoreHorizontal,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import { jobsService, type Category } from "@/lib/jobs";

const iconMap: Record<string, LucideIcon> = {
  laptop: Laptop,
  megaphone: Megaphone,
  landmark: Landmark,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  cog: Cog,
  "more-horizontal": MoreHorizontal,
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await jobsService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="container-page py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Browse Jobs by Category
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Explore opportunities across growing industries
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-xl border border-gray-200 bg-white p-5 h-32 flex flex-col items-center justify-center">
                <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container-page py-14">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Browse Jobs by Category
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Explore opportunities across growing industries and find jobs that
            match your skills.
          </p>
        </div>

        <Link
          href="/jobs"
          className="group hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors"
        >
          View all categories
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Categories Grid */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
          <p>No categories available.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon || ""] ?? MoreHorizontal;
            const isHovered = hoveredId === cat.id;

            return (
              <Link
                key={cat.id}
                href={`/jobs?category=${cat.id}`}
                className="group relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-5 text-center transition-all duration-300 hover:border-green-400 hover:shadow-lg hover:-translate-y-1"
                onMouseEnter={() => setHoveredId(cat.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Icon */}
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                    isHovered
                      ? "bg-green-600 text-white shadow-lg shadow-green-200"
                      : "bg-green-50 text-green-600"
                  }`}
                >
                  <Icon
                    className={`h-6 w-6 transition-transform duration-300 ${isHovered ? "scale-110" : ""}`}
                  />
                </div>

                {/* Label */}
                <span className="text-sm font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {cat.label}
                </span>

                {/* Job Count */}
                <span className="text-xs text-gray-400">
                  {cat.count ?? 0} Jobs
                </span>

                {/* Hover Indicator */}
                {isHovered && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Mobile View All */}
      <div className="sm:hidden text-center mt-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1 text-sm font-semibold text-green-600 hover:text-green-700"
        >
          View all categories
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
