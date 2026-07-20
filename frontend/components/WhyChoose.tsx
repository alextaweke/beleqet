"use client";

import {
  ShieldCheck,
  Zap,
  BellRing,
  Send,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    icon: ShieldCheck,
    title: "Trusted Platform",
    desc: "All jobs are verified for your security.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Zap,
    title: "Fast & Easy",
    desc: "Search and apply in just a few clicks.",
    color: "bg-yellow-50 text-yellow-600",
  },
  {
    icon: BellRing,
    title: "Real-time Updates",
    desc: "Get instant alerts every step.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Send,
    title: "Telegram Alerts",
    desc: "Get instant job alerts on Telegram.",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: TrendingUp,
    title: "Career Growth",
    desc: "Find opportunities that match your career path.",
    color: "bg-green-50 text-green-600",
  },
];

export default function WhyChoose() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="container-page py-14">
      <div className="flex flex-col items-center text-center mb-10">
        <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Why Beleqet?
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Why Choose Beleqet?
        </h2>
        <p className="text-gray-500 text-sm mt-2 max-w-2xl">
          We connect you with the best opportunities and provide tools to grow
          your career.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {features.map((f, index) => {
          const isHovered = hoveredIndex === index;
          const Icon = f.icon;

          return (
            <div
              key={f.title}
              className="group relative rounded-xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-green-300 hover:shadow-lg hover:-translate-y-1"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Icon */}
              <span
                className={`inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 ${
                  isHovered ? "scale-110" : ""
                } ${f.color}`}
              >
                <Icon className="h-5 w-5" />
              </span>

              {/* Content */}
              <h3 className="text-sm font-semibold text-gray-900 mt-3 group-hover:text-green-600 transition-colors">
                {f.title}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{f.desc}</p>

              {/* Hover Indicator */}
              {isHovered && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600 rounded-t-xl" />
              )}
            </div>
          );
        })}

        {/* App Download Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-600 to-green-700 text-white p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 mb-3">
              <Smartphone className="h-5 w-5" />
            </span>
            <h3 className="text-sm font-semibold">Search on the go!</h3>
            <p className="text-xs text-white/70 mt-1">
              Access thousands of jobs anytime, anywhere.
            </p>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <button className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-medium transition-colors text-center">
              📱 Google Play
            </button>
            <button className="rounded-lg bg-white/10 hover:bg-white/20 px-4 py-2 text-xs font-medium transition-colors text-center">
              📱 App Store
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
