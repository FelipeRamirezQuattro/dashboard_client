// client/src/components/Layout/Sidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const navItems = [
    { path: "/dashboard", icon: "home", label: "Dashboard" },
    ...(isAdmin
      ? [{ path: "/admin/users", icon: "admin_panel_settings", label: "Admin" }]
      : []),
  ];

  return (
    <aside
      className={`hidden lg:flex fixed top-12 left-0 bottom-0 z-30 flex-col transition-all duration-200 ease-in-out border-r border-gray-200 ${
        collapsed ? "w-[60px]" : "w-[220px]"
      }`}
      style={{ background: "white" }}
    >
      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.path === "/admin/users"
              ? location.pathname.startsWith("/admin")
              : location.pathname === item.path ||
                (item.path === "/dashboard" &&
                  location.pathname.startsWith("/business-unit"));

          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 border-l-2 ${
                isActive
                  ? "bg-amber-50 border-osi-primary text-osi-primary"
                  : "border-transparent text-gray-400 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span
                className="material-symbols-outlined text-xl flex-shrink-0"
                aria-hidden="true"
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium truncate">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile + Collapse toggle */}
      <div className="border-t border-gray-100">
        {/* User profile */}
        <div
          className={`flex items-center px-3 py-3 gap-3 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
            }}
            title={
              collapsed ? `${user?.firstName} ${user?.lastName}` : undefined
            }
          >
            {user?.firstName?.charAt(0)}
            {user?.lastName?.charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-800 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-gray-400 capitalize truncate">
                {user?.role === "superadmin" ? "System Admin" : user?.role}
              </p>
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <div className="p-2 pt-0">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-xs"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <span
              className="material-symbols-outlined text-base"
              aria-hidden="true"
            >
              {collapsed ? "chevron_right" : "chevron_left"}
            </span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
