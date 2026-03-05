import React, { useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BusinessUnitView from "./pages/BusinessUnitView";
import AdminLayout from "./pages/Admin/AdminLayout";
import UserManagement from "./pages/Admin/UserManagement";
import AppManagement from "./pages/Admin/AppManagement";
import BusinessUnitManagement from "./pages/Admin/BusinessUnitManagement";
import DepartmentManagement from "./pages/Admin/DepartmentManagement";
import AuditLogs from "./pages/Admin/AuditLogs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// SSO Callback Handler Component
const SSOCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuthContext();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      // Login with the token from SSO callback
      loginWithToken(token)
        .then(() => {
          navigate("/dashboard", { replace: true });
        })
        .catch((error) => {
          console.error("SSO login failed:", error);
          navigate("/login?error=sso_callback_failed", { replace: true });
        });
    } else {
      navigate("/login?error=no_token", { replace: true });
    }
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-osi-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<SSOCallback />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="business-unit/:id" element={<BusinessUnitView />} />

              {/* Admin Routes */}
              <Route
                path="admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/users" replace />} />
                <Route path="users" element={<UserManagement />} />
                <Route
                  path="business-units"
                  element={<BusinessUnitManagement />}
                />
                <Route path="departments" element={<DepartmentManagement />} />
                <Route path="apps" element={<AppManagement />} />
                <Route path="audit" element={<AuditLogs />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
