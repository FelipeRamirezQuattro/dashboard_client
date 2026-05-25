import React from "react";
import { Outlet, NavLink } from "react-router-dom";

const AdminLayout: React.FC = () => {
  const navItems = [
    { path: "/admin/users", label: "User Management" },
    { path: "/admin/business-units", label: "Business Units" },
    { path: "/admin/departments", label: "Departments" },
    { path: "/admin/apps", label: "App Management" },
    { path: "/admin/notifications", label: "Notifications" },
    { path: "/admin/audit", label: "Audit Logs" },
  ];

  return (
    <div className="min-h-[calc(100vh-48px)]" style={{ background: "#f8fafc" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Admin Console
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Configure enterprise settings and manage user workspace
              permissions.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className="rounded-t-lg -mx-4 sm:mx-0 overflow-x-auto"
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <nav className="flex scrollbar-hide">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative px-4 sm:px-6 py-3 sm:py-4 font-medium transition-colors whitespace-nowrap touch-manipulation ${
                    isActive
                      ? "text-gray-900"
                      : "text-gray-400 hover:text-gray-700"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="text-sm sm:text-base">{item.label}</span>
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{
                          background:
                            "linear-gradient(90deg, #fbad37 0%, #ffd280 100%)",
                        }}
                      ></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
