import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Avatar,
  Badge,
  Logo,
  Sidebar as OdessaSidebar,
  SidebarHeader,
  SidebarItemLabel,
  SidebarNav,
  SidebarSectionLabel,
  SidebarToggle,
  cn,
  sidebarItemVariants,
} from "@odessa-separator/ui";
import {
  Brain,
  FileText,
  Home,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { businessUnitService } from "../../services/businessUnit.service";
import { getApps } from "../../services/apps.service";
import { BusinessUnit } from "../../types/businessUnit.types";
import { IExternalApp } from "../../types/app.types";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  active?: boolean;
}> = ({ to, icon, label, badge, active }) => (
  <li>
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={sidebarItemVariants({ active })}
    >
      <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center">
        {icon}
      </span>
      <SidebarItemLabel className="flex-1 truncate text-sm">{label}</SidebarItemLabel>
      {badge != null && badge > 0 && (
        <Badge variant="accent" className="group-data-[collapsed=true]/sidebar:hidden">
          {badge}
        </Badge>
      )}
    </Link>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => businessUnitService.getActiveBusinessUnits(),
  });

  const { data: apps = [] } = useQuery({
    queryKey: ["apps"],
    queryFn: getApps,
  });

  const appCountByBU = useMemo(() => {
    const counts: Record<string, number> = {};
    (apps as IExternalApp[]).forEach((app) => {
      if (!app.isActive) return;
      const buId = typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id;
      counts[buId] = (counts[buId] || 0) + 1;
    });
    return counts;
  }, [apps]);

  const isDashboardActive = location.pathname === "/dashboard";
  const isWorkflowBrainActive = location.pathname.startsWith("/workflow-brain");
  const isFileBankActive = location.pathname.startsWith("/file-bank");
  const isAdminActive = location.pathname.startsWith("/admin");

  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";

  return (
    <OdessaSidebar
      collapsed={collapsed}
      className="fixed inset-y-0 left-0 z-40 hidden overflow-hidden lg:flex"
    >
      <SidebarHeader className="flex items-center gap-3 border-b border-on-nav/20">
        <Logo className="h-8 w-auto shrink-0" decorative />
        <span className="group-data-[collapsed=true]/sidebar:sr-only">Odessa Separator</span>
      </SidebarHeader>

      <SidebarNav aria-label="Main" className="flex-1 overflow-y-auto overflow-x-hidden">
        <SidebarSectionLabel>Main</SidebarSectionLabel>
        <NavItem
          to="/dashboard"
          active={isDashboardActive}
          label="Dashboard"
          icon={<LayoutDashboard size={18} />}
        />
        <NavItem
          to="/workflow-brain"
          active={isWorkflowBrainActive}
          label="Workflow Brain"
          icon={<Brain size={18} />}
        />
        {isAdmin && (
          <NavItem
            to="/file-bank"
            active={isFileBankActive}
            label="File Bank"
            icon={<FileText size={18} />}
          />
        )}

        <SidebarSectionLabel>Business Units</SidebarSectionLabel>
        {(businessUnits as BusinessUnit[]).map((bu) => (
          <NavItem
            key={bu._id}
            to={`/business-unit/${bu._id}`}
            active={location.pathname === `/business-unit/${bu._id}`}
            label={bu.name}
            badge={appCountByBU[bu._id]}
            icon={<Home size={18} />}
          />
        ))}

        {isAdmin && (
          <>
            <SidebarSectionLabel>Admin</SidebarSectionLabel>
            <NavItem
              to="/admin/users"
              active={isAdminActive}
              label="Admin Console"
              icon={<ShieldCheck size={18} />}
            />
          </>
        )}
      </SidebarNav>

      <div className="flex flex-col gap-1 border-t border-on-nav/20 pt-2">
        <div className="flex items-center gap-3 px-2 py-1">
          <Avatar name={fullName} size="sm" decorative />
          <div className={cn("min-w-0 flex-1", collapsed && "sr-only")}>
            <p className="truncate text-sm font-semibold">{fullName}</p>
            <p className="text-xs capitalize opacity-80">
              {user?.role === "superadmin" ? "System Admin" : user?.role}
            </p>
          </div>
        </div>
        <SidebarToggle
          collapsed={collapsed}
          onClick={onToggle}
          aria-label="Collapse sidebar"
          className="self-end"
        />
      </div>
    </OdessaSidebar>
  );
};

export default Sidebar;
