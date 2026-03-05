export type UserRole = "viewer" | "editor" | "admin" | "superadmin";

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  microsoftId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: IUser;
  accessToken: string;
}

export interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: IUser | null) => void;
  setAccessToken: (token: string | null) => void;
}
