// app/chat/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Chat from "@/components/Chat";
import { chatService } from "@/lib/chat";
import { useAuth } from "@/app/contexts/AuthContext";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const roomId = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
      return;
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    const verifyRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("Please login to chat");
          setLoading(false);
          return;
        }

        // Try to get room info
        const room = await chatService.getRoom(roomId);
        console.log("Room verified:", room);

        // Check if user is a participant
        const isParticipant = room.participants?.some(
          (p) => p.userId === user?.id,
        );
        if (!isParticipant) {
          setError("You are not a participant of this chat room");
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Error verifying room:", err);
        setError(err.message || "Room not found or you don't have access");
        setLoading(false);
      }
    };

    if (roomId && user?.id) {
      verifyRoom();
    }
  }, [roomId, user?.id]);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading chat...</p>
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
            <h3 className="text-lg font-semibold text-gray-900">
              Chat Not Available
            </h3>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Link
              href="/chat"
              className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Back to Messages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Messages
        </Link>

        <div className="h-[600px]">
          <Chat roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
