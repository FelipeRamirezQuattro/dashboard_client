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
import NotificationManagement from "./pages/Admin/NotificationManagement";
import FileBankManager from "./pages/Admin/FileBankManager";
import ApplicationDetails from "./pages/ApplicationDetails";
import NotFound from "./pages/NotFound";
import WorkflowBrainPage from "./pages/WorkflowBrainPage";

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
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    // Prevent multiple executions
    if (hasProcessed.current) {
      return;
    }

    const token = searchParams.get("token");
    console.log("[SSOCallback] Processing callback, token present:", !!token);

    if (token) {
      hasProcessed.current = true;
      console.log("[SSOCallback] Attempting login with token");
      // Login with the token from SSO callback
      loginWithToken(token)
        .then(() => {
          console.log(
            "[SSOCallback] Login successful, redirecting to dashboard",
          );
          navigate("/dashboard", { replace: true });
        })
        .catch((error) => {
          console.error("[SSOCallback] SSO login failed:", error);
          const errorMsg =
            error?.response?.data?.error ||
            error?.message ||
            "sso_callback_failed";
          navigate(
            `/login?error=sso_callback_failed&details=${encodeURIComponent(errorMsg)}`,
            { replace: true },
          );
        });
    } else {
      hasProcessed.current = true;
      console.error("[SSOCallback] No token in URL parameters");
      navigate("/login?error=no_token", { replace: true });
    }
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "#f8fafc" }}
    >
      <div className="text-center">
        <div
          className="w-12 h-12 rounded-full animate-spin mx-auto mb-4"
          style={{
            border: "3px solid rgba(251,173,55,0.2)",
            borderTopColor: "#fbad37",
          }}
        ></div>
        <p className="text-gray-400 text-sm">Completing sign in...</p>
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
              <Route path="workflow-brain" element={<WorkflowBrainPage />} />
              <Route
                path="file-bank"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <FileBankManager />
                  </ProtectedRoute>
                }
              />
              <Route path="business-unit/:id" element={<BusinessUnitView />} />
              <Route path="app/:id" element={<ApplicationDetails />} />

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
                <Route
                  path="notifications"
                  element={<NotificationManagement />}
                />
                <Route path="file-bank" element={<Navigate to="/file-bank" replace />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Optional: Accessibility Testing Panel (Development Only) */}
          {/* Uncomment to enable the floating accessibility testing panel */}
          {/* import AccessibilityPanel from "./components/AccessibilityPanel"; */}
          {/* {import.meta.env.DEV && <AccessibilityPanel />} */}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
