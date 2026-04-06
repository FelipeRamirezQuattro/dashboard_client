import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "../services/notification.service";
import { CreateNotificationPayload } from "../types/notification.types";

export const NOTIFICATIONS_KEY = ["notifications"] as const;
export const ADMIN_NOTIFICATIONS_KEY = ["admin", "notifications"] as const;

export const useNotifications = () =>
  useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: notificationService.getNotifications,
    staleTime: 30_000,
  });

export const useAdminNotifications = () =>
  useQuery({
    queryKey: ADMIN_NOTIFICATIONS_KEY,
    queryFn: notificationService.getAllNotificationsAdmin,
  });

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    },
  });
};

export const useCreateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNotificationPayload) =>
      notificationService.createNotification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_KEY });
    },
  });
};

export const useUpdateNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateNotificationPayload>;
    }) => notificationService.updateNotification(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_KEY });
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_NOTIFICATIONS_KEY });
    },
  });
};
