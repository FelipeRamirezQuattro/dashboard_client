import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { initiateMicrosoftSSO } from "../utils/sso.utils";
import LoadingSpinner from "../components/LoadingSpinner";

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
    if (ssoError) {
      if (ssoError === "sso_failed") {
        setError("Microsoft sign-in failed. Please try again.");
      } else if (ssoError === "sso_callback_failed") {
        setError("Authentication failed. Please try signing in again.");
      } else if (ssoError === "no_token") {
        setError("Invalid authentication response. Please try again.");
      }
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
    <div className="min-h-screen bg-osi-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-osi-primary text-6xl">
              dashboard
            </span>
          </div>
          <h1 className="text-3xl font-bold text-osi-dark mb-1">
            Odessa Separator Inc.
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-osi-dark">Sign In</h2>
            <p className="text-osi-secondary text-sm mt-1">
              Access your separator monitoring dashboard
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-osi-dark mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-osi-secondary text-xl">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osi-primary focus:border-transparent transition-all"
                  placeholder="name@company.com"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-osi-dark"
                >
                  Password
                </label>
                <a
                  href="#"
                  className="text-xs text-osi-primary hover:underline font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-osi-secondary text-xl">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osi-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 text-osi-primary border-gray-300 rounded focus:ring-osi-primary"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-osi-dark">
                Remember this device
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-osi-primary hover:bg-osi-primary-dark text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-lg">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-osi-secondary font-medium">
                OR CONTINUE WITH
              </span>
            </div>
          </div>

          {/* Microsoft SSO Button */}
          <button
            type="button"
            onClick={handleMicrosoftSSO}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            <span className="font-medium text-osi-dark text-sm">
              Sign in with Microsoft
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-osi-secondary">
            © 2026 Odessa Separator Inc. All rights reserved.
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs">
            <a
              href="#"
              className="text-osi-secondary hover:text-osi-primary transition-colors"
            >
              Security Policy
            </a>
            <span className="text-gray-300">|</span>
            <a
              href="#"
              className="text-osi-secondary hover:text-osi-primary transition-colors"
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
