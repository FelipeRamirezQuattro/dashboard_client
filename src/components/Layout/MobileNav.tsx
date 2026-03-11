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
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Menu */}
      <nav
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Mobile navigation"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-osi-primary to-osi-primary/90 text-white px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <span
                  className="material-symbols-outlined text-2xl"
                  aria-hidden="true"
                >
                  factory
                </span>
              </div>
              <div>
                <h2 className="font-bold text-lg">OSI Dashboard</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors touch-manipulation"
              aria-label="Close navigation menu"
            >
              <span
                className="material-symbols-outlined text-2xl"
                aria-hidden="true"
              >
                close
              </span>
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold">
                  {user.firstName.charAt(0)}
                  {user.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-white/80 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="overflow-y-auto h-[calc(100%-180px)] px-4 py-4">
          {/* Main Navigation */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-osi-secondary mb-3 px-3">
              Navigation
            </h3>
            <nav className="space-y-1">
              <Link
                to="/dashboard"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors touch-manipulation ${
                  location.pathname === "/dashboard"
                    ? "bg-osi-primary/10 text-osi-primary font-semibold"
                    : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                }`}
              >
                <span
                  className="material-symbols-outlined text-xl"
                  aria-hidden="true"
                >
                  dashboard
                </span>
                <span className="text-sm">Dashboard</span>
              </Link>

              {isAdmin && (
                <Link
                  to="/admin/users"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors touch-manipulation ${
                    location.pathname.startsWith("/admin")
                      ? "bg-osi-primary/10 text-osi-primary font-semibold"
                      : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                  }`}
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
              <h3 className="text-xs font-bold uppercase tracking-wider text-osi-secondary mb-3 px-3">
                Categories
              </h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleCategorySelect(category.value)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors touch-manipulation ${
                      selectedCategory === category.value
                        ? "bg-osi-primary/10 text-osi-primary font-semibold"
                        : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
                    }`}
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
          <div className="p-4 bg-slate-50 rounded-xl">
            <p className="text-xs text-osi-secondary font-medium mb-2">
              Server Status
            </p>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-semibold">Operational</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors font-medium touch-manipulation"
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
