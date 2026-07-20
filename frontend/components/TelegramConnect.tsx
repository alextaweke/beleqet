// components/TelegramConnect.tsx
"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/config";
import { Send, CheckCircle, XCircle, Loader2, Shield } from "lucide-react";

interface TelegramStatus {
  connected: boolean;
  telegramId: string | null;
  botRunning: boolean;
  botUsername: string | null;
}

export default function TelegramConnect() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [telegramId, setTelegramId] = useState("");
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      const data = await apiFetch("/telegram/status", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(data);
    } catch (error) {
      console.error("Error fetching Telegram status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!telegramId.trim()) {
      setError("Please enter your Telegram ID");
      return;
    }

    setConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      await apiFetch("/telegram/connect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ telegramId: telegramId.trim() }),
      });

      setSuccess("Telegram connected successfully!");
      setTelegramId("");
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || "Failed to connect Telegram");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect Telegram?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Not authenticated");

      await apiFetch("/telegram/disconnect", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Telegram disconnected successfully");
      await fetchStatus();
    } catch (err: any) {
      setError(err.message || "Failed to disconnect Telegram");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Send className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Telegram Integration</h3>
          <p className="text-sm text-gray-500">
            Get instant notifications on Telegram
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}

      {status?.connected ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Connected
              </span>
            </div>
            <span className="text-xs text-green-600">
              ID: {status.telegramId}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Shield className="h-4 w-4 text-gray-400" />
            <span>You will receive notifications for:</span>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                Jobs
              </span>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                Bids
              </span>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                Contracts
              </span>
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                Messages
              </span>
            </div>
          </div>

          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
          >
            Disconnect Telegram
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>Not connected</strong>
              {status?.botRunning && (
                <span className="text-green-600 ml-2">
                  • Bot is running: @{status.botUsername}
                </span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Your Telegram ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Enter your Telegram ID (from /start)"
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <button
                onClick={handleConnect}
                disabled={connecting || !telegramId.trim()}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Connect
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Send /start to @{status?.botUsername || "BeleqetBot"} to get
              your ID
            </p>
          </div>

          <div className="text-sm text-gray-500">
            <p className="font-medium mb-1">How to find your Telegram ID:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>
                Open Telegram and search for @
                {status?.botUsername || "BeleqetBot"}
              </li>
              <li>
                Send the message:{" "}
                <code className="bg-gray-100 px-2 py-0.5 rounded">/start</code>
              </li>
              <li>Copy the Telegram ID shown in the response</li>
              <li>Paste it above and click Connect</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
