// components/NotificationDropdown.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  X,
  AlertCircle,
  Briefcase,
  Users,
  MessageCircle,
  DollarSign,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import {
  notificationsService,
  Notification,
  NOTIFICATION_ICONS,
  NOTIFICATION_COLORS,
} from "@/lib/notifications";
import { formatDistanceToNow } from "date-fns";

interface NotificationDropdownProps {
  onClose?: () => void;
}

export default function NotificationDropdown({
  onClose,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsService.getNotifications({ limit: 10 });
      setNotifications(data.items || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await notificationsService.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error("Error fetching unread count:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsService.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.deleteNotification(id);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type: string) => {
    return NOTIFICATION_ICONS[type] || "📢";
  };

  const getColor = (type: string) => {
    return NOTIFICATION_COLORS[type] || "gray";
  };

  if (loading) {
    return (
      <div className="w-80 p-4 text-center text-gray-500">
        Loading notifications...
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className="w-80 max-h-[500px] flex flex-col bg-white rounded-xl shadow-lg border border-gray-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">No notifications</p>
            <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => {
            const icon = getIcon(notification.type);
            const color = getColor(notification.type);
            const colorClasses: Record<string, string> = {
              blue: "bg-blue-50 text-blue-600",
              green: "bg-green-50 text-green-600",
              purple: "bg-purple-50 text-purple-600",
              orange: "bg-orange-50 text-orange-600",
              red: "bg-red-50 text-red-600",
              yellow: "bg-yellow-50 text-yellow-600",
              indigo: "bg-indigo-50 text-indigo-600",
              teal: "bg-teal-50 text-teal-600",
              gray: "bg-gray-50 text-gray-600",
            };

            return (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notification.read ? "bg-green-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${colorClasses[color] || colorClasses.gray}`}
                  >
                    <span className="text-lg">{icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={notification.metadata?.link || "#"}
                      onClick={() => {
                        if (!notification.read)
                          handleMarkAsRead(notification.id);
                      }}
                    >
                      <p
                        className={`text-sm ${!notification.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDelete(notification.id)}
                    className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {!notification.read && (
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="mt-1 text-xs text-green-600 hover:text-green-700 font-medium"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-100 text-center">
          <Link
            href="/notifications"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
            onClick={onClose}
          >
            View all notifications →
          </Link>
        </div>
      )}
    </div>
  );
}
