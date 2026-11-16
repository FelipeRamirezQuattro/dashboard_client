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
  chatbotApiUrl?: string;
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
  chatbotApiUrl?: string;
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

export const categoryLabels: Record<AppCategory, string> = {
  gas: "Gas Separation",
  chemical: "Chemical Treatment",
  sand: "Sand Control",
  pumps: "Pumps Tracker",
  admin: "Admin Tools",
  other: "Other",
};
