export type PermissionLevel = "businessUnit" | "department" | "application";

export interface UserPermission {
  _id: string;
  userId: string;
  permissionLevel: PermissionLevel;
  businessUnitId?:
    | {
        _id: string;
        name: string;
      }
    | string;
  departmentId?:
    | {
        _id: string;
        name: string;
      }
    | string;
  applicationId?:
    | {
        _id: string;
        name: string;
      }
    | string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPermissionDTO {
  userId: string;
  permissionLevel: PermissionLevel;
  businessUnitId?: string;
  departmentId?: string;
  applicationId?: string;
}

export interface ResolvedPermissions {
  businessUnits: string[];
  departments: string[];
  applications: string[];
}
