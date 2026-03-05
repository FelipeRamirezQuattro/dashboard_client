import api from "./api";
import { LoginCredentials, LoginResponse, IUser } from "../types/user.types";

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", credentials);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const refreshToken = async (): Promise<{ accessToken: string }> => {
  const response = await api.post<{ accessToken: string }>("/auth/refresh");
  return response.data;
};

export const getCurrentUser = async (): Promise<IUser> => {
  const response = await api.get<{ user: IUser }>("/auth/me");
  return response.data.user;
};

export const handleSSOCallback = (token: string): void => {
  localStorage.setItem("accessToken", token);
};

export default {
  login,
  logout,
  refreshToken,
  getCurrentUser,
  handleSSOCallback,
};
