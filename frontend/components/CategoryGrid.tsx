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

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await jobsService.getCategories();

        console.log("Categories:", data);

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
        <p className="text-center text-gray-500">Loading categories...</p>
      </section>
    );
  }

  return (
    <section className="container-page py-14">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="text-sectionH2">Browse Jobs by Category</h2>
          <p className="text-muted text-sm mt-1">
            Explore opportunities across growing industries and find jobs that
            match your skills.
          </p>
        </div>

        <Link
          href="/jobs"
          className="hidden sm:inline-block text-sm font-semibold text-brandGreen hover:underline shrink-0"
        >
          View all categories →
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No categories available.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon || ""] ?? MoreHorizontal;

            return (
              <Link
                key={cat.id}
                href={`/jobs?category=${cat.id}`}
                className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white px-3 py-5 text-center transition-all hover:border-brandGreen hover:shadow-card"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brandGreen/10 text-brandGreen">
                  <Icon className="h-5 w-5" />
                </div>

                <span className="text-sm font-semibold text-ink">
                  {cat.label}
                </span>

                <span className="text-xs text-muted">
                  {cat.count ?? 0} Jobs
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
