import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { initiateMicrosoftSSO } from "../utils/sso.utils";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for SSO error in URL
    const ssoError = searchParams.get("error");
    const errorDetails = searchParams.get("details");

    if (ssoError) {
      console.log("[Login] SSO Error detected:", ssoError, errorDetails);

      let errorMessage = "Sign-in failed. Please try again.";

      switch (ssoError) {
        case "sso_failed":
          errorMessage =
            "Microsoft sign-in failed. Please try again or use email/password.";
          break;
        case "sso_init_failed":
          errorMessage =
            "Unable to initiate Microsoft sign-in. Please check your connection.";
          break;
        case "sso_auth_failed":
          errorMessage = "Microsoft authentication failed. Please try again.";
          break;
        case "sso_no_user":
          errorMessage = "Unable to authenticate user. Please contact support.";
          break;
        case "sso_callback_failed":
          errorMessage =
            "Authentication callback failed. Please try signing in again.";
          break;
        case "sso_callback_error":
          errorMessage = errorDetails
            ? `Authentication error: ${errorDetails}`
            : "An error occurred during sign-in. Please try again.";
          break;
        case "no_token":
          errorMessage = "Invalid authentication response. Please try again.";
          break;
        default:
          errorMessage = "An unexpected error occurred. Please try again.";
      }

      setError(errorMessage);

      // Clear the error from URL
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSSO = () => {
    initiateMicrosoftSSO();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#f8fafc" }}
    >
      {/* Ambient glow orbs */}
      <div
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(251,173,55,0.07) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(251,173,55,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: "rgba(251,173,55,0.12)",
              border: "1px solid rgba(251,173,55,0.25)",
              boxShadow: "0 0 32px rgba(251,173,55,0.15)",
            }}
          >
            <span
              className="material-symbols-outlined text-osi-primary text-3xl"
              aria-hidden="true"
            >
              factory
            </span>
          </div>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{
              background: "linear-gradient(90deg, #fbad37 0%, #ffd280 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Odessa Separator Inc.
          </h1>
          <p className="text-gray-400 text-sm">
            Industrial Operations Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
            <p className="text-gray-400 text-sm mt-1">
              Access your separator monitoring dashboard
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-red-300 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-600 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl"
                  aria-hidden="true"
                >
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-osi-primary/60 transition-all"
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                  }}
                  placeholder="name@company.com"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-600"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-osi-primary/80 hover:text-osi-primary font-medium transition-colors touch-manipulation"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl"
                  aria-hidden="true"
                >
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-osi-primary/60 transition-all"
                  style={{
                    background: "#f3f4f6",
                    border: "1px solid #d1d5db",
                  }}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 bg-gray-100 text-osi-primary focus:ring-osi-primary/50 touch-manipulation"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-500">
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation text-black"
              style={{
                background: isLoading
                  ? "rgba(251,173,55,0.5)"
                  : "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                boxShadow: isLoading
                  ? "none"
                  : "0 0 20px rgba(251,173,55,0.35)",
              }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-osi-bg/30 border-t-osi-bg rounded-full animate-spin" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <span
                    className="material-symbols-outlined text-lg"
                    aria-hidden="true"
                  >
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div
                className="w-full"
                style={{ borderTop: "1px solid #e5e7eb" }}
              ></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span
                className="px-3 text-gray-400 font-medium uppercase tracking-wider"
                style={{ background: "#f0f0f0" }}
              >
                or continue with
              </span>
            </div>
          </div>

          {/* Microsoft SSO Button */}
          <button
            type="button"
            onClick={handleMicrosoftSSO}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation text-gray-700 hover:text-gray-900"
            style={{
              background: "#f3f4f6",
              border: "1px solid #d1d5db",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#ebebed";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "#f3f4f6";
            }}
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 23 23"
              aria-hidden="true"
            >
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <span className="font-medium text-sm sm:text-base">
              Sign in with Microsoft
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            © 2026 Odessa Separator Inc. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-3 mt-2 text-xs flex-wrap">
            <a
              href="#"
              className="text-gray-400 hover:text-osi-primary transition-colors touch-manipulation"
            >
              Security Policy
            </a>
            <span className="text-gray-400">|</span>
            <a
              href="#"
              className="text-gray-400 hover:text-osi-primary transition-colors"
            >
              Help Desk
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
