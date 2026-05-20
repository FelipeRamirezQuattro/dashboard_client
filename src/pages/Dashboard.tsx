import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBusinessUnits } from "../hooks/useBusinessUnits";
import { useQuery } from "@tanstack/react-query";
import { getApps } from "../services/apps.service";
import { IExternalApp } from "../types/app.types";
import { BusinessUnit } from "../types/businessUnit.types";
import { BusinessUnitCardSkeleton } from "../components/SkeletonLoader";

const PRIMARY = "#586379";
const PRIMARY_DARK = "#3f4d60";
const ACCENT = "#fea920";
const BG = "#f4f5f7";
const SURFACE = "#ffffff";
const BORDER = "#e5e8ed";
const TEXT = "#1a2332";
const TEXT_MUTED = "#8a94a6";
const SUCCESS = "#16a34a";
const SUCCESS_BG = "#dcfce7";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: businessUnits, isLoading, error } = useBusinessUnits();

  const { data: apps = [] } = useQuery({ queryKey: ["apps"], queryFn: getApps });

  const appCountByBU = React.useMemo(() => {
    const counts: Record<string, number> = {};
    (apps as IExternalApp[]).forEach((app) => {
      if (!app.isActive) return;
      const buId = typeof app.businessUnitId === "string" ? app.businessUnitId : app.businessUnitId._id;
      counts[buId] = (counts[buId] || 0) + 1;
    });
    return counts;
  }, [apps]);

  // Generate initials-based placeholder color for BU cards
  const getBUColor = (name: string) => {
    const colors = [
      ["#586379", "#3f4d60"],
      ["#4a6080", "#2e4060"],
      ["#2563eb", "#1e40af"],
      ["#7c3aed", "#5b21b6"],
      ["#c0392b", "#922b21"],
      ["#16a34a", "#15803d"],
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w[0]).join("").slice(0, 4).toUpperCase();

  return (
    <div style={{ minHeight: "100%", background: BG }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 28px" }}>

        {/* Welcome Banner */}
        <div
          style={{
            background: `linear-gradient(120deg, ${PRIMARY} 0%, ${PRIMARY_DARK} 100%)`,
            borderRadius: 10,
            padding: "28px 32px",
            color: "#fff",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -20,
              top: -20,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "rgba(254,169,32,.15)",
              pointerEvents: "none",
            }}
          />
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, position: "relative", zIndex: 1 }}>
            Welcome back, <span style={{ color: ACCENT }}>{user?.firstName}</span>!
          </h1>
          <p style={{ fontSize: 14.5, color: "rgba(255,255,255,.7)", marginTop: 6, position: "relative", zIndex: 1 }}>
            Monitor and manage your industrial separator operations
          </p>
        </div>

        {/* Content Layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, alignItems: "start" }}>

          {/* Left: Business Units */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 15.5, fontWeight: 700, color: TEXT, display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="18" height="18">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                </svg>
                Business Units
              </h2>
            </div>

            {isLoading ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {[...Array(3)].map((_, i) => <BusinessUnitCardSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, padding: "20px 24px", textAlign: "center" }}>
                <p style={{ color: "#dc2626", fontSize: 14 }}>Failed to load business units. Please try again.</p>
              </div>
            ) : !businessUnits || businessUnits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: TEXT_MUTED }}>
                <p>No business units available</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {(businessUnits as BusinessUnit[]).map((bu) => {
                  const [c1, c2] = getBUColor(bu.name);
                  const count = appCountByBU[bu._id] || 0;
                  return (
                    <Link
                      key={bu._id}
                      to={`/business-unit/${bu._id}`}
                      style={{
                        background: SURFACE,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 10,
                        overflow: "hidden",
                        boxShadow: "0 1px 3px rgba(0,0,0,.08)",
                        cursor: "pointer",
                        transition: "box-shadow .2s, transform .2s",
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        flexDirection: "column",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 4px 12px rgba(0,0,0,.10)";
                        (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 1px 3px rgba(0,0,0,.08)";
                        (e.currentTarget as HTMLAnchorElement).style.transform = "none";
                      }}
                    >
                      {/* Card image area */}
                      <div
                        style={{
                          height: 130,
                          background: bu.logoUrl ? "#f4f5f7" : `linear-gradient(135deg, ${c1}, ${c2})`,
                          display: "grid",
                          placeItems: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        {bu.logoUrl ? (
                          <img
                            src={bu.logoUrl}
                            alt={bu.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }}
                            onError={(e) => {
                              const t = e.target as HTMLImageElement;
                              t.style.display = "none";
                              if (t.parentElement) {
                                t.parentElement.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
                              }
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: 42, fontWeight: 900, color: "rgba(255,255,255,.15)", letterSpacing: -2 }}>
                            {getInitials(bu.name)}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div style={{ padding: 16, flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{bu.name}</div>
                        <div style={{ fontSize: 12.5, color: TEXT_MUTED, lineHeight: 1.5 }}>{bu.description}</div>
                      </div>

                      {/* Footer */}
                      <div
                        style={{
                          padding: "12px 16px",
                          borderTop: `1px solid ${BORDER}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ fontSize: 12, color: TEXT_MUTED }}>{count} application{count !== 1 ? "s" : ""}</span>
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
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
