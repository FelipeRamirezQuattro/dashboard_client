import React from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getApps, launchApp } from "../services/apps.service";
import { businessUnitService } from "../services/businessUnit.service";
import { departmentService } from "../services/department.service";
import { IExternalApp } from "../types/app.types";
import { BusinessUnit } from "../types/businessUnit.types";
import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../hooks/useAuth";

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

const ApplicationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: apps = [], isLoading } = useQuery({ queryKey: ["apps"], queryFn: getApps });
  const { data: businessUnits = [] } = useQuery({ queryKey: ["businessUnits"], queryFn: () => businessUnitService.getActiveBusinessUnits() });

  const app = (apps as IExternalApp[]).find((a) => a._id === id);
  const buId = app ? (typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id) : null;
  const bu = buId ? (businessUnits as BusinessUnit[]).find((b) => b._id === buId) : null;
  const buName = bu?.name || (app && typeof app.businessUnitId === "object" ? app.businessUnitId.name : "");

  const deptId = app ? (typeof app.departmentId === "string" ? app.departmentId : app.departmentId?._id) : null;

  const { data: departments = [] } = useQuery({
    queryKey: ["departments", buId],
    queryFn: () => departmentService.getDepartmentsByBusinessUnit(buId!),
    enabled: !!buId,
  });

  const deptName = deptId
    ? (departments as any[]).find((d) => d._id === deptId)?.name || (typeof app?.departmentId === "object" ? (app.departmentId as any).name : "")
    : "";

  const [isLaunching, setIsLaunching] = React.useState(false);
  const [launchError, setLaunchError] = React.useState<string | null>(null);

  const handleLaunch = async () => {
    if (!app) return;
    if (app.comingSoon) return;
    if (app.ssoEndpoint && !user?.microsoftId) {
      alert("This application requires Microsoft SSO. Please sign in with Microsoft to access.");
      return;
    }
    setIsLaunching(true);
    setLaunchError(null);
    try {
      const res = await launchApp(app._id);
      if (res.launchUrl) window.open(res.launchUrl, "_blank", "noopener,noreferrer");
    } catch {
      setLaunchError("Failed to launch application. Please try again.");
    } finally {
      setIsLaunching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: BG }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: BG }}>
        <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: 24, textAlign: "center", maxWidth: 400 }}>
          <p style={{ color: "#dc2626" }}>Application not found.</p>
          <button onClick={() => navigate("/dashboard")} style={{ marginTop: 16, color: PRIMARY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const [c1, c2] = categoryColors[app.category] || categoryColors.other;
  const initials = app.name.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();

  return (
    <div style={{ minHeight: "100%", background: BG }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px" }}>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: TEXT_MUTED, marginBottom: 12 }}>
          <Link to="/dashboard" style={{ color: PRIMARY, textDecoration: "none" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
          >
            Dashboard
          </Link>
          {buId && (
            <>
              <span style={{ color: "#b0b8c4" }}>›</span>
              <Link to={`/business-unit/${buId}`} style={{ color: PRIMARY, textDecoration: "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none"; }}
              >
                {buName}
              </Link>
            </>
          )}
          <span style={{ color: "#b0b8c4" }}>›</span>
          <span>{app.name}</span>
        </div>

        {/* Hero */}
        <div
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            boxShadow: "0 1px 3px rgba(0,0,0,.08)",
            padding: "28px 28px 24px",
            marginBottom: 20,
            display: "flex",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          {/* App Thumb */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: app.iconUrl ? "#f4f5f7" : `linear-gradient(135deg, ${c1}, ${c2})`,
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 18,
              color: "#fff",
              letterSpacing: -1,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : initials}
          </div>

          {/* Hero Body */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  background: "rgba(254,169,32,.15)",
                  color: ACCENT_DARK,
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 20,
                  textTransform: "uppercase",
                  letterSpacing: ".02em",
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
              <span style={{ fontSize: 12, color: TEXT_MUTED, padding: "2px 8px", background: BG, border: `1px solid ${BORDER}`, borderRadius: 20 }}>
                v4.2.0
              </span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>{app.name}</div>
            <div style={{ fontSize: 14, color: TEXT_MUTED, lineHeight: 1.65, maxWidth: 680 }}>{app.description}</div>

            {/* Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20 }}>
              <button
                onClick={handleLaunch}
                disabled={isLaunching || app.comingSoon}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "12px 24px",
                  borderRadius: 6,
                  fontSize: 15,
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
                {isLaunching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Launching…
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                    {app.comingSoon ? "Coming Soon" : "Launch Application"}
                  </>
                )}
              </button>
              {buId && (
                <Link
                  to={`/business-unit/${buId}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "12px 20px",
                    borderRadius: 6,
                    fontSize: 13.5,
                    fontWeight: 600,
                    background: BG,
                    color: TEXT,
                    border: `1px solid ${BORDER}`,
                    textDecoration: "none",
                    transition: "background .15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = BORDER; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = BG; }}
                >
                  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                  </svg>
                  Back to {buName}
                </Link>
              )}
            </div>
            {launchError && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{launchError}</p>}
          </div>
        </div>

        {/* Details Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

          {/* Left column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Application Info */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: `1px solid ${BORDER}`,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: TEXT,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <svg fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                  <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
                Application Info
              </div>
              <div style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    {
                      icon: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
                      key: "Application Name",
                      val: app.name,
                    },
                    {
                      icon: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
                      key: "Version",
                      val: "4.2.0",
                    },
                    {
                      icon: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
                      key: "Category",
                      val: app.category.charAt(0).toUpperCase() + app.category.slice(1),
                    },
                    {
                      icon: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
                      key: "Business Unit",
                      val: buName || "—",
                    },
                    ...(deptName ? [{
                      icon: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
                      key: "Department",
                      val: deptName,
                    }] : []),
                    {
                      icon: <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                      key: "Last Updated",
                      val: new Date(app.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                    },
                  ].map(({ icon, key, val }) => (
                    <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: BG,
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          color: PRIMARY,
                        }}
                      >
                        {icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, color: TEXT_MUTED, marginBottom: 2 }}>{key}</div>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Launch CTA */}
            <div
              style={{
                background: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_DARK} 100%)`,
                borderRadius: 10,
                padding: 20,
                textAlign: "center",
                color: "#fff",
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, margin: "0 0 4px" }}>Ready to go</h3>
              <p style={{ fontSize: 12, opacity: .85, marginBottom: 14, margin: "4px 0 14px" }}>All systems operational. Click to open the application.</p>
              <button
                onClick={handleLaunch}
                disabled={isLaunching || app.comingSoon}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  background: "#fff",
                  color: ACCENT_DARK,
                  border: "none",
                  cursor: app.comingSoon ? "default" : "pointer",
                  opacity: app.comingSoon ? 0.7 : 1,
                  transition: "background .15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fffbf0"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15" height="15">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                {app.comingSoon ? "Coming Soon" : "Launch App"}
              </button>
            </div>

            {/* Assigned Departments */}
            {deptName && (
              <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
                <div style={{ padding: "16px 20px", borderBottom: `1px solid ${BORDER}`, fontSize: 13.5, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 8 }}>
                  <svg fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24" width="16" height="16">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                  </svg>
                  Assigned Departments
                </div>
                <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: BG,
                      borderRadius: 6,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{deptName}</div>
                      <div style={{ fontSize: 11.5, color: TEXT_MUTED }}>{buName}</div>
                    </div>
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
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetails;
