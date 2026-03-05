import React from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/admin/users", label: "User Management" },
    { path: "/admin/business-units", label: "Business Units" },
    { path: "/admin/departments", label: "Departments" },
    { path: "/admin/apps", label: "App Management" },
    { path: "/admin/audit", label: "Audit Logs" },
  ];

  const handleCreateUser = () => {
    // TODO: Implement create user modal
    console.log("Create user clicked");
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Admin Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Console
            </h1>
            <p className="text-gray-600">
              Configure enterprise settings and manage user workspace
              permissions.
            </p>
          </div>
          {location.pathname === "/admin/users" && (
            <button
              onClick={handleCreateUser}
              className="bg-osi-primary hover:bg-osi-primary-dark text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                person_add
              </span>
              + Create User
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-t-lg shadow-sm border-b-0">
          <nav className="flex">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative px-6 py-4 font-medium transition-colors ${
                    isActive
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-osi-primary"></div>
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
