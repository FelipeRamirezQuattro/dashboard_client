import React, { useState, useRef, useEffect } from "react";
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "../hooks/useNotifications";
import { useNotificationSSE } from "../hooks/useNotificationSSE";
import { INotification, NotificationSeverity } from "../types/notification.types";

const severityConfig: Record<
  NotificationSeverity,
  { icon: string; color: string; bg: string }
> = {
  info: {
    icon: "info",
    color: "text-blue-500",
    bg: "rgba(59,130,246,0.1)",
  },
  success: {
    icon: "check_circle",
    color: "text-emerald-500",
    bg: "rgba(16,185,129,0.1)",
  },
  warning: {
    icon: "warning",
    color: "text-amber-500",
    bg: "rgba(245,158,11,0.1)",
  },
  error: {
    icon: "error",
    color: "text-red-500",
    bg: "rgba(239,68,68,0.1)",
  },
};

const typeLabels: Record<INotification["type"], string> = {
  app_released: "App Released",
  app_stopped: "App Stopped",
  app_updated: "App Updated",
  maintenance: "Maintenance",
  announcement: "Announcement",
  custom: "Notice",
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const NotificationBell: React.FC = () => {
  // Establish SSE connection for real-time updates
  useNotificationSSE();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: notifications = [] } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification._id);
    }
  };

  const handleMarkAll = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-1.5 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <span
          className="material-symbols-outlined text-xl text-gray-600"
          aria-hidden="true"
        >
          notifications
        </span>
        {unreadCount > 0 && (
          <span
            className="absolute top-0.5 right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold text-black px-1"
            style={{ background: "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)" }}
            aria-hidden="true"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 shadow-2xl z-50 overflow-hidden flex flex-col"
          style={{ background: "white", maxHeight: "480px" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid #e5e7eb" }}
          >
            <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                disabled={markAllAsRead.isPending}
                className="text-xs text-gray-400 hover:text-gray-700 transition-colors touch-manipulation"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <span
                  className="material-symbols-outlined text-4xl text-gray-300 mb-2"
                  aria-hidden="true"
                >
                  notifications_none
                </span>
                <p className="text-sm text-gray-400">No notifications yet</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => {
                  const config = severityConfig[notification.severity];
                  return (
                    <button
                      key={notification._id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 touch-manipulation flex items-start gap-3"
                      style={
                        !notification.isRead
                          ? { background: "rgba(251,173,55,0.04)" }
                          : undefined
                      }
                    >
                      {/* Severity icon */}
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: config.bg }}
                      >
                        <span
                          className={`material-symbols-outlined text-base ${config.color}`}
                          aria-hidden="true"
                        >
                          {config.icon}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              notification.isRead
                                ? "text-gray-600 font-normal"
                                : "text-gray-900 font-semibold"
                            }`}
                          >
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 rounded-full bg-osi-primary flex-shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-gray-500"
                            style={{ background: "#f3f4f6" }}
                          >
                            {typeLabels[notification.type]}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className="px-4 py-2.5 flex-shrink-0"
              style={{ borderTop: "1px solid #e5e7eb" }}
            >
              <p className="text-xs text-gray-400 text-center">
                {unreadCount > 0
                  ? `${unreadCount} unread · ${notifications.length} total`
                  : `All caught up · ${notifications.length} notifications`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
