"use client";

import { Send, ChevronRight, Sparkles } from "lucide-react";
import { useState } from "react";

export default function CTABanner() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="container-page pb-14">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-10 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* Content */}
        <div className="flex items-center gap-4 relative z-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shrink-0 animate-pulse">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <h3 className="text-lg font-bold">Never Miss an Opportunity</h3>
            </div>
            <p className="text-sm text-white/80 mt-0.5">
              Join the Beleqet Telegram channel and get instant job alerts
              delivered directly to your phone.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <a
          href="https://t.me"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative z-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-green-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          Join Telegram Channel
          <ChevronRight
            className={`h-4 w-4 transition-transform duration-300 ${
              isHovered ? "translate-x-1" : ""
            }`}
          />
        </a>
      </div>
    </section>
  );
}
