import api from "./api";
import {
  UserPermission,
  CreateUserPermissionDTO,
  ResolvedPermissions,
} from "../types/permission.types";

export const permissionsService = {
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    const response = await api.get(`/permissions/user/${userId}`);
    return response.data;
  },

  async resolveUserPermissions(
    userId: string,
    role: string,
  ): Promise<ResolvedPermissions> {
    const response = await api.get(`/permissions/user/${userId}/resolve`, {
      params: { role },
    });
    return response.data;
  },

  async createUserPermission(
    data: CreateUserPermissionDTO,
  ): Promise<UserPermission> {
    const response = await api.post("/permissions", data);
    return response.data;
  },

  async bulkUpdateUserPermissions(
    userId: string,
    permissions: Omit<CreateUserPermissionDTO, "userId">[],
  ): Promise<UserPermission[]> {
    const response = await api.put(`/permissions/user/${userId}/bulk`, {
      permissions,
    });
    return response.data;
  },

  async deleteUserPermission(id: string): Promise<void> {
    await api.delete(`/permissions/${id}`);
  },
};
