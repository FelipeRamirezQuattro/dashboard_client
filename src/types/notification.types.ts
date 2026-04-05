export type NotificationType =
  | "app_released"
  | "app_stopped"
  | "app_updated"
  | "maintenance"
  | "announcement"
  | "custom";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type NotificationScope = "all" | "businessUnit" | "department";

export interface INotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  targetScope: NotificationScope;
  targetId?: string;
  relatedAppId?: { _id: string; name: string; iconUrl?: string } | string;
  createdBy?: { _id: string; firstName: string; lastName: string } | string;
  isActive: boolean;
  expiresAt?: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  targetScope: NotificationScope;
  targetId?: string;
  relatedAppId?: string;
  expiresAt?: string;
}
