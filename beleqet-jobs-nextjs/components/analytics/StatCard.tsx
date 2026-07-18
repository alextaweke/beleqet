// components/analytics/StatCard.tsx
"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
  green: { bg: "bg-green-50", text: "text-green-600", iconBg: "bg-green-100" },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  yellow: {
    bg: "bg-yellow-50",
    text: "text-yellow-600",
    iconBg: "bg-yellow-100",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-600",
    iconBg: "bg-orange-100",
  },
  red: { bg: "bg-red-50", text: "text-red-600", iconBg: "bg-red-100" },
  teal: { bg: "bg-teal-50", text: "text-teal-600", iconBg: "bg-teal-100" },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    iconBg: "bg-indigo-100",
  },
  pink: { bg: "bg-pink-50", text: "text-pink-600", iconBg: "bg-pink-100" },
  gray: { bg: "bg-gray-50", text: "text-gray-600", iconBg: "bg-gray-100" },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  color,
  subtitle,
}: StatCardProps) {
  const colors = colorMap[color] || colorMap.gray;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 ${colors.iconBg} rounded-xl`}>
          <Icon className={`h-5 w-5 ${colors.text}`} />
        </div>
      </div>
    </div>
  );
}
