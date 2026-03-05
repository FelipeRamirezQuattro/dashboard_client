export type AppCategory =
  | "gas"
  | "chemical"
  | "sand"
  | "pumps"
  | "admin"
  | "other";
export type RequiredRole = "viewer" | "editor" | "admin" | "superadmin";

export interface IExternalApp {
  _id: string;
  name: string;
  description: string;
  url: string;
  ssoEndpoint?: string;
  iconUrl?: string;
  category: AppCategory;
  requiredRole: RequiredRole;
  businessUnitId:
    | string
    | {
        _id: string;
        name: string;
      };
  departmentId:
    | string
    | {
        _id: string;
        name: string;
      };
  isActive: boolean;
  comingSoon?: boolean;
  createdBy:
    | string
    | {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
  createdAt: string;
  updatedAt: string;
}

export interface LaunchAppResponse {
  launchUrl: string;
  app: {
    name: string;
    description: string;
  };
}

export interface CreateAppData {
  name: string;
  description: string;
  url: string;
  ssoEndpoint?: string;
  iconUrl?: string;
  category: AppCategory;
  requiredRole: RequiredRole;
  businessUnitId: string;
  departmentId: string;
  isActive?: boolean;
  comingSoon?: boolean;
}

export interface UpdateAppData extends Partial<CreateAppData> {
  _id: string;
}

export const categoryColors: Record<AppCategory, string> = {
  gas: "bg-blue-50 text-blue-700 border border-blue-200",
  chemical: "bg-purple-50 text-purple-700 border border-purple-200",
  sand: "bg-orange-50 text-orange-700 border border-orange-200",
  pumps: "bg-amber-50 text-amber-700 border border-amber-200",
  admin: "bg-slate-50 text-slate-700 border border-slate-200",
  other: "bg-gray-50 text-gray-700 border border-gray-200",
};

export const categoryLabels: Record<AppCategory, string> = {
  gas: "Gas Separation",
  chemical: "Chemical Treatment",
  sand: "Sand Control",
  pumps: "Pumps Tracker",
  admin: "Admin Tools",
  other: "Other",
};
