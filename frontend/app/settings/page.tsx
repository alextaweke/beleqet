// app/settings/page.tsx
"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import TelegramConnect from "@/components/TelegramConnect";
import { Bell, Shield, User as UserIcon, Key, Palette } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Notifications
            </h2>
          </div>

          {/* Telegram Integration */}
          <TelegramConnect />

          {/* Other notification settings */}
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">Email notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">
                In-app notifications
              </span>
            </label>
          </div>
        </div>

        {/* Other settings sections */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Security</h2>
          </div>
          {/* Security settings */}
        </div>
      </div>
    </div>
  );
}
