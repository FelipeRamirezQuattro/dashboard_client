import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as appsService from "../services/apps.service";
import { CreateAppData } from "../types/app.types";

export const useApps = () => {
  return useQuery({
    queryKey: ["apps"],
    queryFn: appsService.getApps,
  });
};

export const useAllApps = () => {
  return useQuery({
    queryKey: ["admin", "apps"],
    queryFn: appsService.getAllApps,
  });
};

export const useLaunchApp = () => {
  return useMutation({
    mutationFn: (appId: string) => appsService.launchApp(appId),
    onSuccess: (data) => {
      // Open the app in a new window
      window.open(data.launchUrl, "_blank");
    },
  });
};

export const useCreateApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAppData) => appsService.createApp(data),
    onSuccess: () => {
      // Invalidate and refetch apps
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
};

export const useUpdateApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAppData> }) =>
      appsService.updateApp(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
};

export const useDeleteApp = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appsService.deleteApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "apps"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });
};

export default useApps;
