import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBusinessUnit } from "../hooks/useBusinessUnits";
import { departmentService } from "../services/department.service";
import { getApps } from "../services/apps.service";
import { useLaunchApp } from "../hooks/useApps";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";
import { IExternalApp } from "../types/app.types";
import { AppCardSkeleton } from "../components/SkeletonLoader";
import NoticeModal from "../components/NoticeModal";

const PRIMARY = "#586379";
const ACCENT = "#fea920";
const ACCENT_DARK = "#e5941a";
const BG = "#f4f5f7";
const SURFACE = "#ffffff";
const BORDER = "#e5e8ed";
const TEXT = "#1a2332";
const TEXT_MUTED = "#8a94a6";
const SUCCESS = "#16a34a";
const SUCCESS_BG = "#dcfce7";

const categoryColors: Record<string, [string, string]> = {
  gas: ["#2563eb", "#1e40af"],
  chemical: ["#7c3aed", "#5b21b6"],
  sand: ["#d97706", "#b45309"],
  pumps: ["#586379", "#3f4d60"],
  admin: ["#dc2626", "#b91c1c"],
  other: ["#6b7280", "#4b5563"],
};

interface AppListItemProps {
  app: IExternalApp;
}

const AppListItem: React.FC<AppListItemProps> = ({ app }) => {
  const { mutate: launchApp, isPending } = useLaunchApp();
  const { user } = useAuth();
  const [isSsoNoticeOpen, setIsSsoNoticeOpen] = useState(false);

  const handleLaunch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (app.comingSoon) return;
    if (app.ssoEndpoint && !user?.microsoftId) {
      setIsSsoNoticeOpen(true);
      return;
    }
    launchApp(app._id);
  };

  const [c1, c2] = categoryColors[app.category] || categoryColors.other;
  const initials = app.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();

  return (
    <>
    <div
      className="osi-app-list-item"
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 18,
        boxShadow: "0 1px 3px rgba(0,0,0,.08)",
        transition: "box-shadow .2s, border-color .2s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,.10)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "#6e7f96";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 3px rgba(0,0,0,.08)";
        (e.currentTarget as HTMLDivElement).style.borderColor = BORDER;
      }}
    >
      {/* App Thumb */}
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          background: app.iconUrl ? "#f4f5f7" : `linear-gradient(135deg, ${c1}, ${c2})`,
          display: "grid",
          placeItems: "center",
          fontWeight: 800,
          fontSize: 14,
          color: "#fff",
          flexShrink: 0,
          letterSpacing: -1,
          overflow: "hidden",
        }}
      >
        {app.iconUrl ? (
          <img src={app.iconUrl} alt={app.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : initials}
      </div>

      {/* App Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span
            style={{
              background: "rgba(88,99,121,.1)",
              color: PRIMARY,
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 20,
              letterSpacing: ".02em",
              textTransform: "uppercase",
            }}
          >
            {app.category}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: SUCCESS_BG,
              color: SUCCESS,
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 20,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "inline-block" }} />
            {app.comingSoon ? "Coming Soon" : "Online"}
          </span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{app.name}</div>
        <div className="osi-app-description" style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, maxWidth: 560, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {app.description}
        </div>
      </div>

      {/* Actions */}
      <div className="osi-app-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <Link
          to={`/app/${app._id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 12.5,
            fontWeight: 600,
            background: BG,
            color: TEXT,
            border: `1px solid ${BORDER}`,
            textDecoration: "none",
            cursor: "pointer",
            transition: "background .15s",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Details
        </Link>
        <button
          onClick={handleLaunch}
          disabled={isPending || app.comingSoon}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 12.5,
            fontWeight: 600,
            background: ACCENT,
            color: "#fff",
            border: "none",
            cursor: app.comingSoon ? "default" : "pointer",
            opacity: app.comingSoon ? 0.6 : 1,
            transition: "background .15s",
          }}
          onMouseEnter={(e) => { if (!app.comingSoon) (e.currentTarget as HTMLButtonElement).style.background = ACCENT_DARK; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ACCENT; }}
        >
          {isPending ? (
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Launching…
            </span>
          ) : (
            <>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="13" height="13">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {app.comingSoon ? "Coming Soon" : "Launch"}
            </>
          )}
        </button>
      </div>

      {/* Version badge */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 14,
          fontSize: 11,
          fontWeight: 600,
          color: TEXT_MUTED,
          background: BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          padding: "2px 8px",
        }}
      >
        v4.2.0
      </div>
    </div>
      <NoticeModal
        isOpen={isSsoNoticeOpen}
        title="Microsoft SSO Required"
        message="This application requires Microsoft SSO. Please sign in with Microsoft to access."
        onClose={() => setIsSsoNoticeOpen(false)}
      />
    </>
  );
};

const BusinessUnitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  const { data: businessUnit, isLoading: isLoadingBU, error: errorBU } = useBusinessUnit(id!);

  const { data: departments, error: errorDepts } = useQuery({
    queryKey: ["departments", id],
    queryFn: () => departmentService.getDepartmentsByBusinessUnit(id!),
    enabled: !!id,
  });

  const { data: allApps, isLoading: isLoadingApps, error: errorApps } = useQuery({
    queryKey: ["apps"],
    queryFn: getApps,
  });

  const filteredApps = useMemo(() => {
    if (!allApps || !Array.isArray(allApps)) return [];
    let filtered = allApps.filter((app: IExternalApp) => {
      if (!app.businessUnitId) return false;
      const buId = typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id;
      return buId === id && app.isActive;
    });
    if (selectedDepartment) {
      filtered = filtered.filter((app: IExternalApp) => {
        if (!app.departmentId) return false;
        const deptId = typeof app.departmentId === "string" ? app.departmentId : app.departmentId._id;
        return deptId === selectedDepartment;
      });
    }
    return filtered;
  }, [allApps, id, selectedDepartment]);

  const appsByDepartment = useMemo(() => {
    if (!allApps || !Array.isArray(allApps)) return {};
    const grouped: Record<string, number> = {};
    allApps.forEach((app: IExternalApp) => {
      if (!app.businessUnitId || !app.isActive) return;
      const buId = typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id;
      if (buId !== id) return;
      if (!app.departmentId) return;
      const deptId = typeof app.departmentId === "string" ? app.departmentId : app.departmentId._id;
      grouped[deptId] = (grouped[deptId] || 0) + 1;
    });
    return grouped;
  }, [allApps, id]);

  const error = errorBU || errorDepts || errorApps;

  if (isLoadingBU) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: BG }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !businessUnit) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: BG }}>
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: 24, textAlign: "center", maxWidth: 400 }}>
          <p style={{ color: "#dc2626" }}>Failed to load business unit details.</p>
          <button onClick={() => navigate("/dashboard")} style={{ marginTop: 16, color: PRIMARY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", background: BG }}>
      <div className="osi-page-shell" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: TEXT_MUTED, marginBottom: 12 }}>
          <Link to="/dashboard" style={{ color: PRIMARY, textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
          >
            Dashboard
          </Link>
          <span style={{ color: "#b0b8c4" }}>›</span>
          <span>{businessUnit.name}</span>
        </div>

        {/* Page Header */}
        <div className="osi-page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT, margin: 0 }}>{businessUnit.name}</h1>
            <p style={{ color: TEXT_MUTED, fontSize: 14, marginTop: 4 }}>{businessUnit.description}</p>
          </div>
          <button
            onClick={() => setSelectedDepartment(null)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 600,
              background: BG,
              color: TEXT,
              border: `1px solid ${BORDER}`,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="14" height="14">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
            All Apps
          </button>
        </div>

        {/* Department Filter Chips */}
        {departments && Array.isArray(departments) && departments.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            <button
              onClick={() => setSelectedDepartment(null)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: `1px solid ${selectedDepartment === null ? PRIMARY : BORDER}`,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: "pointer",
                background: selectedDepartment === null ? PRIMARY : SURFACE,
                color: selectedDepartment === null ? "#fff" : TEXT_MUTED,
                transition: "all .15s",
              }}
            >
              All
            </button>
            {departments.filter((d) => d != null).map((dept) => {
              const count = appsByDepartment[dept._id] || 0;
              const isActive = selectedDepartment === dept._id;
              return (
                <button
                  key={dept._id}
                  onClick={() => setSelectedDepartment(dept._id)}
                  style={{
                    padding: "5px 14px",
                    borderRadius: 20,
                    border: `1px solid ${isActive ? PRIMARY : BORDER}`,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    background: isActive ? PRIMARY : SURFACE,
                    color: isActive ? "#fff" : TEXT_MUTED,
                    transition: "all .15s",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  {dept.name}
                  <span
                    style={{
                      background: isActive ? "rgba(255,255,255,.2)" : BORDER,
                      borderRadius: 10,
                      padding: "1px 6px",
                      fontSize: 11,
                      color: isActive ? "#fff" : TEXT_MUTED,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content Layout */}
        <div className="osi-two-column-grid" style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 20, alignItems: "start" }}>

          {/* App List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {isLoadingApps ? (
              <>
                {[...Array(3)].map((_, i) => <AppCardSkeleton key={i} />)}
              </>
            ) : filteredApps.length === 0 ? (
              <div
                style={{
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#b0b8c4", display: "block", marginBottom: 12 }}>apps</span>
                <p style={{ color: TEXT_MUTED }}>No applications found</p>
              </div>
            ) : (
              filteredApps.map((app) => <AppListItem key={app._id} app={app} />)
            )}
          </div>

          {/* Side Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Summary */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", color: TEXT_MUTED, marginBottom: 14 }}>
                Summary
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Total Apps", value: filteredApps.length, color: TEXT },
                  { label: "Online", value: filteredApps.filter((a) => !a.comingSoon).length, color: SUCCESS },
                  { label: "Coming Soon", value: filteredApps.filter((a) => a.comingSoon).length, color: "#b0b8c4" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: TEXT_MUTED }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessUnitView;
