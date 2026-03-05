import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import {
  AuthState,
  AuthContextType,
  IUser,
  LoginCredentials,
} from "../types/user.types";
import * as authService from "../services/auth.service";

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: IUser; accessToken: string } }
  | { type: "LOGIN_FAILURE" }
  | { type: "LOGOUT" }
  | { type: "SET_USER"; payload: IUser | null }
  | { type: "SET_TOKEN"; payload: string | null }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: AuthState = {
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  isAuthenticated: false,
  isLoading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, isLoading: true };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGIN_FAILURE":
      return {
        ...state,
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };
    case "SET_TOKEN":
      return {
        ...state,
        accessToken: action.payload,
      };
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: { user, accessToken: token },
          });
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            await refreshToken();
          } catch (refreshError) {
            // Refresh failed, clear auth state
            localStorage.removeItem("accessToken");
            dispatch({ type: "LOGIN_FAILURE" });
          }
        }
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await authService.login(credentials);
      localStorage.setItem("accessToken", response.accessToken);
      dispatch({ type: "LOGIN_SUCCESS", payload: response });
    } catch (error) {
      dispatch({ type: "LOGIN_FAILURE" });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      dispatch({ type: "LOGOUT" });
    }
  };

  const refreshToken = async (): Promise<void> => {
    try {
      const response = await authService.refreshToken();
      localStorage.setItem("accessToken", response.accessToken);
      dispatch({ type: "SET_TOKEN", payload: response.accessToken });

      // Fetch current user
      const user = await authService.getCurrentUser();
      dispatch({ type: "SET_USER", payload: user });
    } catch (error) {
      localStorage.removeItem("accessToken");
      dispatch({ type: "LOGIN_FAILURE" });
      throw error;
    }
  };

  const setUser = (user: IUser | null): void => {
    dispatch({ type: "SET_USER", payload: user });
  };

  const setAccessToken = (token: string | null): void => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
    dispatch({ type: "SET_TOKEN", payload: token });
  };

  const loginWithToken = async (token: string): Promise<void> => {
    dispatch({ type: "LOGIN_START" });
    try {
      localStorage.setItem("accessToken", token);
      const user = await authService.getCurrentUser();
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user, accessToken: token },
      });
    } catch (error) {
      localStorage.removeItem("accessToken");
      dispatch({ type: "LOGIN_FAILURE" });
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    loginWithToken,
    logout,
    refreshToken,
    setUser,
    setAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};

export default AuthContext;
