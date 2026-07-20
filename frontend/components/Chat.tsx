// components/Chat.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Send,
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { chatService, Message, ChatRoom } from "@/lib/chat";
import { format } from "date-fns";

interface ChatProps {
  roomId: string;
  onBack?: () => void;
}

export default function Chat({ roomId, onBack }: ChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasJoined, setHasJoined] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const joinTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // components/Chat.tsx - Add this helper function at the top

  // Add this function to get a fresh token
  const getFreshToken = () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      console.error("No token found");
      return null;
    }
    console.log("Token found, length:", token.length);
    return token;
  };

  // Update the initializeChat function
  useEffect(() => {
    const initializeChat = async () => {
      if (initializedRef.current) {
        console.log("Already initialized, skipping...");
        return;
      }
      initializedRef.current = true;

      try {
        setLoading(true);
        setConnectionError(null);
        setHasJoined(false);

        const token = getFreshToken();
        if (!token) {
          setConnectionError("Please login to chat");
          setLoading(false);
          return;
        }

        console.log("📤 Fetching room info for:", roomId);
        const roomData = await chatService.getRoom(roomId);
        console.log("📥 Room data:", roomData);

        const isParticipant = roomData.participants?.some(
          (p) => p.userId === user?.id,
        );
        if (!isParticipant) {
          setConnectionError("You are not a participant of this chat room");
          setLoading(false);
          return;
        }

        setRoom(roomData);

        // Disconnect any existing socket
        chatService.disconnect();

        // Connect with fresh token
        const socket = chatService.connect(token);

        // Set up event listeners
        const handleConnect = () => {
          console.log("✅ Socket connected with ID:", socket.id);
          setIsConnected(true);
          setConnectionError(null);
          // Try to join room immediately after connection
          if (roomId && socket.connected) {
            console.log("Attempting to join room on connect:", roomId);
            chatService.joinRoom(roomId);
          }
        };
        const handleNewMessage = (data: Message) => {
          console.log("📩 New message received:", data);
          if (data.roomId === roomId) {
            setMessages((prev) => [...prev, data]);
          }
        };

        const handleRoomHistory = (data: {
          messages: Message[];
          roomId: string;
        }) => {
          console.log(
            "📜 Room history received:",
            data.messages?.length || 0,
            "messages",
          );
          if (data.roomId === roomId) {
            setMessages(data.messages || []);
            setIsJoining(false);
            setHasJoined(true);
            setConnectionError(null);
          }
        };

        const handleRoomJoined = (data: {
          roomId: string;
          success: boolean;
          alreadyJoined?: boolean;
        }) => {
          console.log("✅ Room joined:", data);
          if (data.success) {
            setIsConnected(true);
            setIsJoining(false);
            setHasJoined(true);
            setConnectionError(null);
          } else {
            setIsJoining(false);
            setConnectionError("Failed to join room");
          }
        };

        const handleTyping = (data: { userId: string; isTyping: boolean }) => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            return newSet;
          });
        };

        const handleError = (data: any) => {
          console.error("❌ Chat error:", data);
          setConnectionError(data.message || "Connection error");
          setIsJoining(false);
          setIsConnected(false);
          setHasJoined(false);
        };

        const handleDisconnect = () => {
          console.log("Disconnected from chat server");
          setIsConnected(false);
          setHasJoined(false);
        };

        // Register listeners
        chatService.on("connect", handleConnect);
        chatService.on("disconnect", handleDisconnect);
        chatService.on("new_message", handleNewMessage);
        chatService.on("room_history", handleRoomHistory);
        chatService.on("room_joined", handleRoomJoined);
        chatService.on("user_typing", handleTyping);
        chatService.on("error", handleError);

        // If socket is already connected, join room
        if (socket.connected) {
          console.log("Socket already connected, joining room...");
          setIsJoining(true);
          // Add small delay to ensure authentication
          setTimeout(() => {
            chatService.joinRoom(roomId);
          }, 500);
        }

        // Cleanup function
        return () => {
          chatService.off("connect", handleConnect);
          chatService.off("disconnect", handleDisconnect);
          chatService.off("new_message", handleNewMessage);
          chatService.off("room_history", handleRoomHistory);
          chatService.off("room_joined", handleRoomJoined);
          chatService.off("user_typing", handleTyping);
          chatService.off("error", handleError);
        };
      } catch (error: any) {
        console.error("❌ Error initializing chat:", error);
        setConnectionError(error.message || "Failed to load chat");
      } finally {
        setLoading(false);
      }
    };

    if (roomId && user?.id) {
      initializeChat();
    }

    return () => {
      initializedRef.current = false;
      chatService.disconnect();
    };
  }, [roomId, user?.id]);
  // Auto retry connection on error
  const handleRetry = () => {
    initializedRef.current = false;
    setHasJoined(false);
    setRetryCount((prev) => prev + 1);
    chatService.disconnect();
    window.location.reload();
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      console.log("❌ Empty message, not sending");
      return;
    }

    if (!roomId) {
      console.log("❌ No roomId, not sending");
      setConnectionError("No room selected");
      return;
    }

    if (!isConnected || !hasJoined) {
      console.log("❌ Not connected or not joined, not sending");
      setConnectionError("Not connected to chat server");
      return;
    }

    setSending(true);
    try {
      console.log(`📤 Sending message to room ${roomId}: "${input.trim()}"`);
      chatService.sendMessage(roomId, input.trim());
      setInput("");
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      setConnectionError(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleTypingStart = useCallback(() => {
    if (!isTyping && roomId && isConnected && hasJoined) {
      setIsTyping(true);
      chatService.sendTyping(roomId, true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      chatService.sendTyping(roomId, false);
    }, 1000);
  }, [isTyping, roomId, isConnected, hasJoined]);

  const formatTime = (date: string) => {
    return format(new Date(date), "h:mm a");
  };

  const formatDate = (date: string) => {
    const msgDate = new Date(date);
    const today = new Date();
    if (msgDate.toDateString() === today.toDateString()) {
      return "Today";
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return format(msgDate, "MMM d, yyyy");
  };

  // Group messages by date
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = formatDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, Message[]>,
  );

  // Get other participant
  const otherParticipant =
    room?.participants?.find((p) => p.userId !== user?.id)?.user ||
    room?.otherParticipant;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-2 text-gray-500">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Connection Error
          </h3>
          <p className="text-sm text-gray-600 mt-1">{connectionError}</p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Retry
            </button>
            <Link
              href="/chat"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-center"
            >
              Back to Messages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors md:hidden"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-semibold text-sm">
          {otherParticipant?.firstName?.charAt(0) || "U"}
          {otherParticipant?.lastName?.charAt(0) || ""}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">
            {otherParticipant?.firstName} {otherParticipant?.lastName || "User"}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-2">
            {room?.contract?.freelanceJob?.title || "Chat"}
            {isConnected && hasJoined && (
              <span className="text-green-600 text-xs">● Online</span>
            )}
            {isJoining && (
              <Loader2 className="h-3 w-3 animate-spin text-gray-400" />
            )}
            {isConnected && !hasJoined && (
              <span className="text-yellow-600 text-xs">● Connecting...</span>
            )}
          </p>
        </div>
        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <MoreVertical className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No messages yet. Say hello!</p>
          </div>
        )}
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            <div className="flex justify-center mb-4">
              <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            {msgs.map((message) => {
              const isOwn = message.senderId === user?.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                      isOwn
                        ? "bg-green-600 text-white rounded-br-none"
                        : "bg-gray-100 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    {!isOwn && (
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {message.sender?.firstName} {message.sender?.lastName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwn ? "text-green-100" : "text-gray-400"
                      }`}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-none">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (roomId && isConnected && hasJoined) {
              handleTypingStart();
            }
          }}
          placeholder={
            isConnected && hasJoined ? "Type a message..." : "Connecting..."
          }
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          disabled={!isConnected || !hasJoined || sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || !isConnected || !hasJoined || sending}
          className="p-2.5 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
