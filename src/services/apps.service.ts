import api from "./api";
import {
  IExternalApp,
  LaunchAppResponse,
  CreateAppData,
} from "../types/app.types";

export const getApps = async (): Promise<IExternalApp[]> => {
  const response = await api.get<{ apps: IExternalApp[] }>("/apps");
  const apps = response.data.apps || response.data;
  return Array.isArray(apps) ? apps : [];
};

export const launchApp = async (appId: string): Promise<LaunchAppResponse> => {
  const response = await api.post<LaunchAppResponse>(`/apps/${appId}/launch`);
  return response.data;
};

// Admin endpoints
export const getAllApps = async (): Promise<IExternalApp[]> => {
  const response = await api.get<{ apps: IExternalApp[] }>("/admin/apps");
  const apps = response.data.apps || response.data;
  return Array.isArray(apps) ? apps : [];
};

export const createApp = async (data: CreateAppData): Promise<IExternalApp> => {
  const response = await api.post<{ app: IExternalApp }>("/admin/apps", data);
  return response.data.app;
};

export const updateApp = async (
  id: string,
  data: Partial<CreateAppData>,
): Promise<IExternalApp> => {
  const response = await api.put<{ app: IExternalApp }>(
    `/admin/apps/${id}`,
    data,
  );
  return response.data.app;
};

export const deleteApp = async (id: string): Promise<void> => {
  await api.delete(`/admin/apps/${id}`);
};

export default {
  getApps,
  launchApp,
  getAllApps,
  createApp,
  updateApp,
  deleteApp,
};
