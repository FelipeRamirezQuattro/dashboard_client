import React from "react";
import { Outlet, NavLink } from "react-router-dom";
import { SectionHeader, navItemVariants } from "@odessa-separator/ui";

const navItems = [
  { path: "/admin/users", label: "User Management" },
  { path: "/admin/business-units", label: "Business Units" },
  { path: "/admin/departments", label: "Departments" },
  { path: "/admin/apps", label: "App Management" },
  { path: "/admin/notifications", label: "Notifications" },
  { path: "/admin/audit", label: "Audit Logs" },
];

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-[calc(100vh-48px)] bg-bg">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <SectionHeader
          as="h1"
          title="Admin Console"
          description="Configure enterprise settings and manage user workspace permissions."
          className="mb-6 sm:mb-8"
        />

        <nav
          aria-label="Admin sections"
          className="flex overflow-x-auto border-b border-border"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                navItemVariants({ active: isActive })
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
