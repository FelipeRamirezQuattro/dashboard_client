import React from "react";
import {
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from "@odessa-separator/ui";
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Info,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../hooks/useNotifications";
import { useNotificationSSE } from "../hooks/useNotificationSSE";
import {
  INotification,
  NotificationSeverity,
} from "../types/notification.types";

const severityConfig: Record<
  NotificationSeverity,
  { icon: LucideIcon; className: string }
> = {
  info: { icon: Info, className: "bg-info-bg text-info-text" },
  success: { icon: CheckCircle2, className: "bg-success-bg text-success-text" },
  warning: { icon: AlertTriangle, className: "bg-warning-bg text-warning-text" },
  error: { icon: XCircle, className: "bg-danger-bg text-danger-text" },
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

  const { data: notifications = [] } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notification: INotification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification._id);
    }
  };

  const handleMarkAll = () => {
    markAllAsRead.mutate();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell size={20} aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="accent"
              aria-hidden="true"
              className="absolute -top-1 -right-1 min-w-4 justify-center px-1"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        aria-label="Notifications"
        className="flex max-h-[480px] w-80 flex-col p-0 sm:w-96"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2">
          <h2 className="text-sm font-bold">Notifications</h2>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={markAllAsRead.isPending}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              <BellOff size={32} aria-hidden="true" className="text-text-muted" />
              <p className="text-sm text-text-muted">No notifications yet</p>
            </div>
          ) : (
            <ul>
              {notifications.map((notification) => {
                const config = severityConfig[notification.severity];
                const Icon = config.icon;
                return (
                  <li key={notification._id}>
                    <Button
                      variant="ghost"
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "h-auto w-full items-start justify-start gap-3 px-4 py-3 text-left font-normal whitespace-normal",
                        !notification.isRead && "bg-surface-muted",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-control",
                          config.className,
                        )}
                      >
                        <Icon size={16} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm leading-snug",
                              notification.isRead ? "text-text-muted" : "font-semibold",
                            )}
                          >
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <>
                              <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 bg-accent" />
                              <span className="sr-only">Unread</span>
                            </>
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-text-muted">
                          {notification.message}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <Badge variant="neutral">{typeLabels[notification.type]}</Badge>
                          <span className="text-xs text-text-muted">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </span>
                      </span>
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="shrink-0 border-t border-border px-4 py-2.5">
            <p className="text-center text-xs text-text-muted">
              {unreadCount > 0
                ? `${unreadCount} unread · ${notifications.length} total`
                : `All caught up · ${notifications.length} notifications`}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
