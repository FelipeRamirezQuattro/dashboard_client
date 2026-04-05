import api from "./api";
import {
  INotification,
  CreateNotificationPayload,
} from "../types/notification.types";

const BASE = "/notifications";

export const getNotifications = async (): Promise<INotification[]> => {
  const { data } = await api.get<{ notifications: INotification[] }>(BASE);
  return data.notifications;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await api.get<{ count: number }>(`${BASE}/unread-count`);
  return data.count;
};

export const requestSseToken = async (): Promise<string> => {
  const { data } = await api.post<{ token: string }>(`${BASE}/sse-token`);
  return data.token;
};

export const markAsRead = async (id: string): Promise<void> => {
  await api.patch(`${BASE}/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch(`${BASE}/read-all`);
};

export const getAllNotificationsAdmin = async (): Promise<INotification[]> => {
  const { data } = await api.get<{ notifications: INotification[] }>(
    `${BASE}/admin/all`,
  );
  return data.notifications;
};

export const createNotification = async (
  payload: CreateNotificationPayload,
): Promise<INotification> => {
  const { data } = await api.post<{ notification: INotification }>(
    BASE,
    payload,
  );
  return data.notification;
};

export const updateNotification = async (
  id: string,
  payload: Partial<CreateNotificationPayload>,
): Promise<INotification> => {
  const { data } = await api.put<{ notification: INotification }>(
    `${BASE}/${id}`,
    payload,
  );
  return data.notification;
};

export const deleteNotification = async (id: string): Promise<void> => {
  await api.delete(`${BASE}/${id}`);
};
