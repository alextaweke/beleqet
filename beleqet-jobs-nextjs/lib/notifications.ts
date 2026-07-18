// lib/notifications.ts
import { apiFetch } from "@/lib/config";

export interface Notification {
  id: string;
  userId: string;
  channel: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  metadata: any;
  createdAt: string;
}

export interface NotificationResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
  hasMore: boolean;
}

class NotificationsService {
  private getToken(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken") || undefined;
    }
    return undefined;
  }

  async getNotifications(params?: {
    limit?: number;
    offset?: number;
    read?: boolean;
    type?: string;
  }): Promise<NotificationResponse> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");

    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", String(params.limit));
    if (params?.offset) queryParams.append("offset", String(params.offset));
    if (params?.read !== undefined)
      queryParams.append("read", String(params.read));
    if (params?.type) queryParams.append("type", params.type);

    const url = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;
    return apiFetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");

    return apiFetch("/notifications/unread/count", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async markAsRead(notificationId: string): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");

    return apiFetch(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async markAllAsRead(): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");

    return apiFetch("/notifications/read-all", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async deleteNotification(notificationId: string): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");

    return apiFetch(`/notifications/${notificationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ── Send Notification (Admin/System only) ──────────────────────────

  async sendNotification(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
    metadata?: any;
    channels?: ("IN_APP" | "TELEGRAM" | "EMAIL")[];
  }): Promise<any> {
    const token = this.getToken();
    if (!token) throw new Error("Authentication required");

    return apiFetch("/notifications/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
  }
}

export const notificationsService = new NotificationsService();

// ── Notification Types ──────────────────────────────────────────────

export const NOTIFICATION_TYPES = {
  JOB_APPLIED: "job.applied",
  APPLICATION_STATUS_CHANGED: "application.status_changed",
  BID_PLACED: "bid.placed",
  BID_ACCEPTED: "bid.accepted",
  BID_REJECTED: "bid.rejected",
  CONTRACT_CREATED: "contract.created",
  CONTRACT_COMPLETED: "contract.completed",
  MILESTONE_APPROVED: "milestone.approved",
  ESCROW_FUNDED: "escrow.funded",
  ESCROW_RELEASED: "escrow.released",
  NEW_MESSAGE: "new.message",
  DISPUTE_RAISED: "dispute.raised",
  DISPUTE_RESOLVED: "dispute.resolved",
  JOB_EXPIRING: "job.expiring",
  PAYMENT_RECEIVED: "payment.received",
};

export const NOTIFICATION_ICONS: Record<string, string> = {
  [NOTIFICATION_TYPES.JOB_APPLIED]: "📝",
  [NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGED]: "🔄",
  [NOTIFICATION_TYPES.BID_PLACED]: "📊",
  [NOTIFICATION_TYPES.BID_ACCEPTED]: "✅",
  [NOTIFICATION_TYPES.BID_REJECTED]: "❌",
  [NOTIFICATION_TYPES.CONTRACT_CREATED]: "📄",
  [NOTIFICATION_TYPES.CONTRACT_COMPLETED]: "🎉",
  [NOTIFICATION_TYPES.MILESTONE_APPROVED]: "⭐",
  [NOTIFICATION_TYPES.ESCROW_FUNDED]: "💰",
  [NOTIFICATION_TYPES.ESCROW_RELEASED]: "💸",
  [NOTIFICATION_TYPES.NEW_MESSAGE]: "💬",
  [NOTIFICATION_TYPES.DISPUTE_RAISED]: "⚠️",
  [NOTIFICATION_TYPES.DISPUTE_RESOLVED]: "✅",
  [NOTIFICATION_TYPES.JOB_EXPIRING]: "⏰",
  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: "💳",
};

export const NOTIFICATION_COLORS: Record<string, string> = {
  [NOTIFICATION_TYPES.JOB_APPLIED]: "blue",
  [NOTIFICATION_TYPES.APPLICATION_STATUS_CHANGED]: "purple",
  [NOTIFICATION_TYPES.BID_PLACED]: "orange",
  [NOTIFICATION_TYPES.BID_ACCEPTED]: "green",
  [NOTIFICATION_TYPES.BID_REJECTED]: "red",
  [NOTIFICATION_TYPES.CONTRACT_CREATED]: "blue",
  [NOTIFICATION_TYPES.CONTRACT_COMPLETED]: "green",
  [NOTIFICATION_TYPES.MILESTONE_APPROVED]: "yellow",
  [NOTIFICATION_TYPES.ESCROW_FUNDED]: "green",
  [NOTIFICATION_TYPES.ESCROW_RELEASED]: "purple",
  [NOTIFICATION_TYPES.NEW_MESSAGE]: "indigo",
  [NOTIFICATION_TYPES.DISPUTE_RAISED]: "red",
  [NOTIFICATION_TYPES.DISPUTE_RESOLVED]: "green",
  [NOTIFICATION_TYPES.JOB_EXPIRING]: "orange",
  [NOTIFICATION_TYPES.PAYMENT_RECEIVED]: "teal",
};
