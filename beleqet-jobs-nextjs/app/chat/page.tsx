// app/chat/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Search,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { chatService, ChatRoom } from "@/lib/chat";
import { formatDistanceToNow } from "date-fns";

export default function ChatListPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Please login to view chats");
        setLoading(false);
        return;
      }

      // Connect to socket
      chatService.connect(token);

      const data = await chatService.getRooms();
      console.log("Chat rooms:", data);
      setRooms(data || []);
    } catch (err: any) {
      console.error("Error fetching chat rooms:", err);
      setError(err.message || "Failed to load chats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRooms();
    }
  }, [isAuthenticated]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRooms();
  };

  const filteredRooms = rooms.filter((room) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const otherUser = room.otherParticipant;
    const jobTitle = room.contract?.freelanceJob?.title || "";
    return (
      otherUser?.firstName?.toLowerCase().includes(query) ||
      otherUser?.lastName?.toLowerCase().includes(query) ||
      jobTitle.toLowerCase().includes(query)
    );
  });

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-red-600 font-semibold">{error}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-green-600" />
                Messages
              </h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-5 w-5 text-gray-500 ${refreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>
            <p className="text-gray-600 mt-1">{rooms.length} conversations</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
            />
          </div>
        </div>

        {/* Chat List */}
        {filteredRooms.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">
              {rooms.length === 0
                ? "No conversations yet"
                : "No matching conversations"}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {rooms.length === 0
                ? "Start chatting with your clients or freelancers"
                : "Try adjusting your search"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRooms.map((room) => {
              const otherUser = room.otherParticipant;
              const lastMessage = room.lastMessage;
              const jobTitle =
                room.contract?.freelanceJob?.title || "Unknown Job";

              return (
                <Link
                  key={room.id}
                  href={`/chat/${room.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-green-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-lg shrink-0">
                      {otherUser?.firstName?.charAt(0) || "U"}
                      {otherUser?.lastName?.charAt(0) || ""}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-900 truncate">
                          {otherUser?.firstName} {otherUser?.lastName || "User"}
                        </p>
                        {lastMessage && (
                          <span className="text-xs text-gray-400">
                            {formatDistanceToNow(
                              new Date(lastMessage.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {jobTitle}
                      </p>
                      {lastMessage && (
                        <p className="text-sm text-gray-600 truncate">
                          {lastMessage.sender?.firstName}: {lastMessage.content}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
