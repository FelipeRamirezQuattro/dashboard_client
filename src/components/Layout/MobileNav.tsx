import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { AppCategory } from "../../types/app.types";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory?: AppCategory | "all";
  onCategoryChange?: (category: AppCategory | "all") => void;
  showCategories?: boolean;
}

const categories: {
  value: AppCategory | "all";
  label: string;
  icon: string;
}[] = [
  { value: "all", label: "All Apps", icon: "grid_view" },
  { value: "gas", label: "Gas Separation", icon: "air" },
  { value: "chemical", label: "Chemical Treatment", icon: "science" },
  { value: "sand", label: "Sand Control", icon: "grain" },
  { value: "pumps", label: "Pumps Tracker", icon: "water_pump" },
  { value: "admin", label: "Admin Tools", icon: "admin_panel_settings" },
  { value: "other", label: "Other", icon: "more_horiz" },
];

const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onCategoryChange,
  showCategories = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/login");
  };

  const handleCategorySelect = (category: AppCategory | "all") => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    onClose();
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Menu */}
      <nav
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] z-50 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "white",
          borderRight: "1px solid #e5e7eb",
        }}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(251,173,55,0.15) 0%, rgba(251,173,55,0.05) 100%)",
            borderBottom: "1px solid rgba(251,173,55,0.2)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="h-9 w-9 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(251,173,55,0.15)" }}
              >
                <span
                  className="material-symbols-outlined text-xl text-osi-primary"
                  aria-hidden="true"
                >
                  factory
                </span>
              </div>
              <h2
                className="font-bold text-base text-gray-900"
                style={{
                  background:
                    "linear-gradient(90deg, #fbad37 0%, #ffd280 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                OSI Dashboard
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-colors touch-manipulation text-gray-600 hover:text-gray-900"
              style={{ background: "#f3f4f6" }}
              aria-label="Close navigation menu"
            >
              <span
                className="material-symbols-outlined text-xl"
                aria-hidden="true"
              >
                close
              </span>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div
              className="flex items-center gap-3 p-3 rounded-lg"
              style={{ background: "#f8fafc" }}
            >
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-black font-bold text-sm"
                style={{
                  background:
                    "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                }}
              >
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Main Navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">
              Navigation
            </h3>
            <nav className="space-y-1">
              <Link
                to="/dashboard"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all touch-manipulation ${
                  location.pathname === "/dashboard"
                    ? "text-osi-primary font-semibold border-l-2 border-osi-primary pl-[10px]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={
                  location.pathname === "/dashboard"
                    ? { background: "rgba(251,173,55,0.1)" }
                    : { background: "transparent" }
                }
              >
                <span
                  className="material-symbols-outlined text-xl"
                  aria-hidden="true"
                >
                  dashboard
                </span>
                <span className="text-sm">Dashboard</span>
              </Link>

              <Link
                to="/workflow-brain"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all touch-manipulation ${
                  location.pathname.startsWith("/workflow-brain")
                    ? "text-osi-primary font-semibold border-l-2 border-osi-primary pl-[10px]"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={
                  location.pathname.startsWith("/workflow-brain")
                    ? { background: "rgba(251,173,55,0.1)" }
                    : { background: "transparent" }
                }
              >
                <span
                  className="material-symbols-outlined text-xl"
                  aria-hidden="true"
                >
                  account_tree
                </span>
                <span className="text-sm">Workflow Brain</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/file-bank"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all touch-manipulation ${
                    location.pathname.startsWith("/file-bank")
                      ? "text-osi-primary font-semibold border-l-2 border-osi-primary pl-[10px]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={
                    location.pathname.startsWith("/file-bank")
                      ? { background: "rgba(251,173,55,0.1)" }
                      : { background: "transparent" }
                  }
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    aria-hidden="true"
                  >
                    folder_open
                  </span>
                  <span className="text-sm">File Bank</span>
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin/users"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all touch-manipulation ${
                    location.pathname.startsWith("/admin")
                      ? "text-osi-primary font-semibold border-l-2 border-osi-primary pl-[10px]"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={
                    location.pathname.startsWith("/admin")
                      ? { background: "rgba(251,173,55,0.1)" }
                      : { background: "transparent" }
                  }
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    aria-hidden="true"
                  >
                    admin_panel_settings
                  </span>
                  <span className="text-sm">Admin Panel</span>
                </Link>
              )}
            </nav>
          </div>

          {/* Categories (if shown) */}
          {showCategories && selectedCategory !== undefined && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">
                Categories
              </h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleCategorySelect(category.value)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all touch-manipulation ${
                      selectedCategory === category.value
                        ? "text-osi-primary font-semibold border-l-2 border-osi-primary pl-[10px]"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                    style={
                      selectedCategory === category.value
                        ? { background: "rgba(251,173,55,0.1)" }
                        : { background: "transparent" }
                    }
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      aria-hidden="true"
                    >
                      {category.icon}
                    </span>
                    <span className="text-sm">{category.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* System Status */}
          <div
            className="p-4 rounded-xl"
            style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
          >
            <p className="text-xs text-gray-400 font-medium mb-2">
              Server Status
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-semibold text-emerald-400">
                Operational
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex-shrink-0 p-4"
          style={{ borderTop: "1px solid #e5e7eb" }}
        >
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors font-medium touch-manipulation text-red-400 hover:text-red-300"
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <span
              className="material-symbols-outlined text-xl"
              aria-hidden="true"
            >
              logout
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;
