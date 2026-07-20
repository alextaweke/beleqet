// components/TelegramBanner.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, ChevronRight } from "lucide-react";

export default function TelegramBanner() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if user has connected Telegram
    const checkConnection = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) return;
        const response = await fetch("/api/v1/telegram/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setIsConnected(data.connected);
      } catch (error) {
        console.error("Error checking Telegram status:", error);
      }
    };
    checkConnection();
  }, []);

  if (isConnected) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Send className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              Get notifications on Telegram
            </p>
            <p className="text-xs text-gray-600">
              Never miss an update about your jobs and gigs
            </p>
          </div>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Connect Now
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
