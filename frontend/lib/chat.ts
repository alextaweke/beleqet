// lib/chat.ts
import { io, Socket } from "socket.io-client";
import { apiFetch } from "@/lib/config";

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    role: string;
  } | null;
}

export interface ChatRoom {
  id: string;
  contractId: string | null;
  jobId?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipant[];
  messages?: Message[];
  contract?: {
    id: string;
    freelanceJob: {
      id: string;
      title: string;
    };
  };
  otherParticipant?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  lastMessage?: Message | null;
}

export interface ChatParticipant {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  lastReadAt: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

class ChatService {
  private socket: Socket | null = null;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;
  private pendingRoomId: string | null = null;
  private isAuthenticated = false;
  private authCheckInterval: NodeJS.Timeout | null = null;
  private joinCallbacks: Map<string, () => void> = new Map();

  connect(token: string): Socket {
    // Clean the token
    const cleanToken = token.replace("Bearer ", "").trim();
    console.log(
      "🔑 Connecting with token:",
      cleanToken.substring(0, 20) + "...",
    );

    // If socket exists and is connected, return it
    if (this.socket?.connected) {
      console.log("Socket already connected");
      if (!this.isAuthenticated) {
        console.log(
          "Socket connected but not authenticated, waiting for auth...",
        );
        this.waitForAuthentication();
      }
      return this.socket;
    }

    // If socket exists but is disconnected, reconnect
    if (this.socket) {
      console.log("Socket disconnected, reconnecting...");
      this.isAuthenticated = false;
      this.socket.connect();
      return this.socket;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      console.log("Connection already in progress...");
      return this.socket!;
    }

    this.isConnecting = true;
    this.isAuthenticated = false;
    console.log("Creating new socket connection...");

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4000";
    console.log("WebSocket URL:", wsUrl);

    this.socket = io(`${wsUrl}/chat`, {
      auth: { token: cleanToken }, // Use clean token
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupListeners();

    // Reset connecting flag after connection attempt
    setTimeout(() => {
      this.isConnecting = false;
    }, 5000);

    // Start waiting for authentication
    this.waitForAuthentication();

    return this.socket;
  }

  private waitForAuthentication() {
    // Clear any existing interval
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
    }

    // Check for authentication every 500ms
    this.authCheckInterval = setInterval(() => {
      if (this.isAuthenticated) {
        console.log("✅ Authentication confirmed");
        if (this.authCheckInterval) {
          clearInterval(this.authCheckInterval);
          this.authCheckInterval = null;
        }
        // Execute any pending join callbacks
        this.joinCallbacks.forEach((callback) => callback());
        this.joinCallbacks.clear();
      }
    }, 500);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (this.authCheckInterval) {
        clearInterval(this.authCheckInterval);
        this.authCheckInterval = null;
        if (!this.isAuthenticated) {
          console.error("❌ Authentication timeout");
          this.emitEvent("error", { message: "Authentication timeout" });
        }
      }
    }, 10000);
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("✅ Connected to chat server");
      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.emitEvent("connect", {});
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from chat server:", reason);
      this.isAuthenticated = false;
      this.emitEvent("disconnect", { reason });
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      this.reconnectAttempts++;
      this.isConnecting = false;
      this.isAuthenticated = false;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emitEvent("error", {
          message:
            "Failed to connect after multiple attempts. Please refresh the page.",
        });
      } else {
        this.emitEvent("error", {
          message: "Connection error: " + error.message,
        });
      }
    });

    this.socket.on("new_message", (data) => {
      console.log("📩 New message received:", data);
      this.emitEvent("new_message", data);
    });

    this.socket.on("room_history", (data) => {
      console.log(
        "📜 Room history received:",
        data.messages?.length || 0,
        "messages",
      );
      this.emitEvent("room_history", data);
    });

    this.socket.on("room_joined", (data) => {
      console.log("✅ Room joined:", data);
      this.isAuthenticated = true;
      this.pendingRoomId = null;
      this.emitEvent("room_joined", data);
    });

    this.socket.on("user_typing", (data) => {
      this.emitEvent("user_typing", data);
    });

    this.socket.on("user_joined", (data) => {
      console.log("👤 User joined:", data);
      this.emitEvent("user_joined", data);
    });

    this.socket.on("connected", (data) => {
      console.log("✅ Connected response:", data);
      // IMPORTANT: Set authenticated to true immediately
      this.isAuthenticated = true;
      this.emitEvent("connected", data);

      // If there's a pending room, join it
      if (this.pendingRoomId) {
        console.log("Joining pending room:", this.pendingRoomId);
        this.joinRoom(this.pendingRoomId);
      }
    });

    this.socket.on("error", (data) => {
      console.error("❌ Chat error:", data);
      this.isAuthenticated = false;
      this.emitEvent("error", data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.pendingRoomId = null;
    this.joinCallbacks.clear();
    if (this.authCheckInterval) {
      clearInterval(this.authCheckInterval);
      this.authCheckInterval = null;
    }
  }

  joinRoom(roomId: string) {
    // Store the room ID in case we need to retry
    this.pendingRoomId = roomId;

    if (!this.socket) {
      console.error("❌ Socket not initialized");
      this.emitEvent("error", { message: "Socket not initialized" });
      return;
    }

    if (!this.socket.connected) {
      console.error("❌ Socket not connected");
      this.emitEvent("error", { message: "Socket not connected" });
      return;
    }

    // If already authenticated, join immediately
    if (this.isAuthenticated) {
      console.log("✅ Already authenticated, joining room:", roomId);
      this.socket.emit("join_room", { roomId });
      return;
    }

    // Otherwise, wait for authentication
    console.log("⏳ Waiting for authentication before joining room...");

    // Create a callback that will be executed when authenticated
    const joinCallback = () => {
      console.log("✅ Authentication received, joining room:", roomId);
      if (this.socket && this.socket.connected) {
        this.socket.emit("join_room", { roomId });
      }
    };

    // Store the callback
    const callbackId = `join_${roomId}_${Date.now()}`;
    this.joinCallbacks.set(callbackId, joinCallback);

    // Also try to join after 2 seconds as a fallback
    setTimeout(() => {
      this.joinCallbacks.delete(callbackId);
      if (!this.isAuthenticated) {
        console.log(
          "⏰ Fallback: Trying to join room without explicit auth:",
          roomId,
        );
        if (this.socket && this.socket.connected) {
          this.socket.emit("join_room", { roomId });
        }
      }
    }, 2000);
  }

  sendMessage(roomId: string, content: string) {
    if (!this.socket?.connected) {
      console.error("❌ Socket not connected");
      this.emitEvent("error", { message: "Socket not connected" });
      return;
    }
    if (!content || content.trim().length === 0) {
      console.error("❌ Empty message");
      return;
    }
    if (!this.isAuthenticated) {
      console.error("❌ Not authenticated");
      this.emitEvent("error", { message: "Not authenticated" });
      return;
    }
    console.log(`📤 Sending message to room ${roomId}: "${content.trim()}"`);
    this.socket.emit("send_message", { roomId, content: content.trim() });
  }

  sendTyping(roomId: string, isTyping: boolean) {
    if (!this.socket?.connected || !this.isAuthenticated) return;
    this.socket.emit("typing", { roomId, isTyping });
  }

  markRead(roomId: string) {
    if (!this.socket?.connected || !this.isAuthenticated) return;
    this.socket.emit("mark_read", { roomId });
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)!;
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emitEvent(event: string, data: any) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach((cb) => cb(data));
    }
  }

  // API calls
  async getRooms(): Promise<ChatRoom[]> {
    return apiFetch("/chat/rooms", {
      method: "GET",
    });
  }

  async getRoom(roomId: string): Promise<ChatRoom> {
    return apiFetch(`/chat/rooms/${roomId}`, {
      method: "GET",
    });
  }

  async getMessages(roomId: string, limit = 100): Promise<Message[]> {
    return apiFetch(`/chat/rooms/${roomId}/messages?limit=${limit}`, {
      method: "GET",
    });
  }

  async createRoom(contractId: string, userId: string): Promise<ChatRoom> {
    return apiFetch("/chat/rooms", {
      method: "POST",
      body: JSON.stringify({ contractId, userId }),
    });
  }

  async sendMessageHttp(roomId: string, content: string): Promise<Message> {
    return apiFetch(`/chat/rooms/${roomId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    return apiFetch("/chat/unread", {
      method: "GET",
    });
  }

  async markAsRead(roomId: string): Promise<void> {
    return apiFetch(`/chat/rooms/${roomId}/read`, {
      method: "POST",
    });
  }
}

export const chatService = new ChatService();
