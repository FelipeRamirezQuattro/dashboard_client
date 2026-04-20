import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { businessUnitService } from "../../services/businessUnit.service";
import { getApps } from "../../services/apps.service";
import { BusinessUnit } from "../../types/businessUnit.types";
import { IExternalApp } from "../../types/app.types";

const BG = "#586379";
const ACCENT = "#fea920";

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
  collapsed?: boolean;
}> = ({ to, icon, label, badge, active, collapsed }) => (
  <Link
    to={to}
    title={collapsed ? label : undefined}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 10px",
      borderRadius: 6,
      color: active ? "#fff" : "rgba(255,255,255,.7)",
      textDecoration: "none",
      fontSize: 13.5,
      fontWeight: 500,
      background: active ? "rgba(254,169,32,.2)" : "transparent",
      whiteSpace: "nowrap",
      transition: "background .15s, color .15s",
    }}
    onMouseEnter={(e) => {
      if (!active) (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,.1)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLAnchorElement).style.background = active ? "rgba(254,169,32,.2)" : "transparent";
    }}
  >
    <span style={{ width: 20, height: 20, flexShrink: 0, display: "grid", placeItems: "center", color: active ? ACCENT : "currentColor" }}>
      {icon}
    </span>
    {!collapsed && (
      <>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        {badge != null && badge > 0 && (
          <span style={{ background: ACCENT, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 10, padding: "1px 6px", flexShrink: 0 }}>
            {badge}
          </span>
        )}
      </>
    )}
  </Link>
);

const SectionLabel: React.FC<{ label: string; collapsed?: boolean }> = ({ label, collapsed }) =>
  collapsed ? null : (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,.4)", padding: "12px 10px 4px" }}>
      {label}
    </div>
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

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const isDashboardActive = location.pathname === "/dashboard";
  const isAdminActive = location.pathname.startsWith("/admin");

  return (
    <aside
      className="hidden lg:flex"
      style={{
        width: collapsed ? 64 : 240,
        background: BG,
        flexDirection: "column",
        flexShrink: 0,
        transition: "width .25s ease",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 60,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "0 16px",
          borderBottom: "1px solid rgba(255,255,255,.1)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: ACCENT,
            borderRadius: 6,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            fontSize: 13,
            color: "#fff",
            flexShrink: 0,
            letterSpacing: "-0.5px",
          }}
        >
          OSI
        </div>
        {!collapsed && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap" }}>
            Odessa Separator
          </span>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
        <SectionLabel label="Main" collapsed={collapsed} />
        <NavItem
          to="/dashboard"
          active={isDashboardActive}
          collapsed={collapsed}
          label="Dashboard"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          }
        />

        <SectionLabel label="Business Units" collapsed={collapsed} />
        {(businessUnits as BusinessUnit[]).map((bu) => (
          <NavItem
            key={bu._id}
            to={`/business-unit/${bu._id}`}
            active={location.pathname === `/business-unit/${bu._id}`}
            collapsed={collapsed}
            label={bu.name}
            badge={appCountByBU[bu._id]}
            icon={
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            }
          />
        ))}

        {isAdmin && (
          <>
            <SectionLabel label="Admin" collapsed={collapsed} />
            <NavItem
              to="/admin/users"
              active={isAdminActive}
              collapsed={collapsed}
              label="Admin Console"
              icon={
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                  <path d="M12 2a4 4 0 100 8 4 4 0 000-8zM4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              }
            />
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: ACCENT,
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {getInitials()}
          </div>
          {!collapsed && (
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", textTransform: "capitalize" }}>
                {user?.role === "superadmin" ? "System Admin" : user?.role}
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 6,
            background: "none",
            border: "none",
            color: "rgba(255,255,255,.5)",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              transition: "transform .25s",
              transform: collapsed ? "rotate(180deg)" : "none",
            }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
