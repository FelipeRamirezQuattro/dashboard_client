import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { getApps, launchApp } from "../../services/apps.service";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { IExternalApp } from "../../types/app.types";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import MobileNav from "./MobileNav";
import NotificationBell from "../NotificationBell";

interface SearchResult {
  id: string;
  name: string;
  type: "app" | "businessUnit" | "department";
  description?: string;
  businessUnitId?: string;
  businessUnitName?: string;
}

interface TopBarProps {
  sidebarCollapsed?: boolean;
  sidebarWidth?: number;
}

const TopBar: React.FC<TopBarProps> = ({ sidebarWidth = 240 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const { data: apps = [] } = useQuery({ queryKey: ["apps"], queryFn: getApps });
  const { data: businessUnits = [] } = useQuery({ queryKey: ["businessUnits"], queryFn: () => businessUnitService.getActiveBusinessUnits() });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: () => departmentService.getActiveDepartments() });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !desktopSearchRef.current?.contains(target) &&
        !mobileSearchRef.current?.contains(target)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    businessUnits.forEach((bu: BusinessUnit) => {
      if (bu.name.toLowerCase().includes(query) || bu.description.toLowerCase().includes(query)) {
        results.push({ id: bu._id, name: bu.name, type: "businessUnit", description: bu.description });
      }
    });

    departments.forEach((dept: Department) => {
      if (dept.name.toLowerCase().includes(query) || dept.description.toLowerCase().includes(query)) {
        const buId = typeof dept.businessUnitId === "object" ? dept.businessUnitId._id : dept.businessUnitId;
        const buName = typeof dept.businessUnitId === "object" ? dept.businessUnitId.name : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name || "";
        results.push({ id: dept._id, name: dept.name, type: "department", description: dept.description, businessUnitId: buId, businessUnitName: buName });
      }
    });

    apps.forEach((app: IExternalApp) => {
      if (app.name.toLowerCase().includes(query) || app.description.toLowerCase().includes(query)) {
        const buId = typeof app.businessUnitId === "object" ? app.businessUnitId._id : app.businessUnitId;
        const buName = typeof app.businessUnitId === "object" ? app.businessUnitId.name : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name || "";
        results.push({ id: app._id, name: app.name, type: "app", description: app.description, businessUnitId: buId, businessUnitName: buName });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, apps, businessUnits, departments]);

  const handleResultClick = async (result: SearchResult) => {
    setSearchQuery("");
    setIsSearchFocused(false);
    setSelectedResultIndex(-1);
    if (result.type === "businessUnit") {
      navigate(`/business-unit/${result.id}`);
    } else if (result.type === "department" && result.businessUnitId) {
      navigate(`/business-unit/${result.businessUnitId}`);
    } else if (result.type === "app") {
      try {
        const response = await launchApp(result.id);
        if (response.launchUrl) window.open(response.launchUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("Failed to launch app:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedResultIndex((prev) => prev < searchResults.length - 1 ? prev + 1 : prev);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedResultIndex((prev) => prev > 0 ? prev - 1 : -1);
    } else if (e.key === "Enter" && selectedResultIndex >= 0) {
      e.preventDefault();
      handleResultClick(searchResults[selectedResultIndex]);
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
      setSelectedResultIndex(-1);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
      handleResultClick(searchResults[selectedResultIndex]);
    } else if (searchResults.length === 1) {
      handleResultClick(searchResults[0]);
    }
  };

  useEffect(() => { setSelectedResultIndex(-1); }, [searchQuery]);

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "businessUnit": return "corporate_fare";
      case "department": return "domain";
      case "app": return "apps";
      default: return "search";
    }
  };

  const getResultTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "businessUnit": return "Business Unit";
      case "department": return "Department";
      case "app": return "Application";
      default: return "";
    }
  };

  return (
    <>
      <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      <header
        style={{
          height: 60,
          background: "#ffffff",
          borderBottom: "1px solid #e5e8ed",
          alignItems: "center",
          gap: 16,
          padding: "0 24px",
          position: "fixed",
          top: 0,
          left: sidebarWidth,
          right: 0,
          zIndex: 50,
          transition: "left .25s ease",
        }}
        className="lg:flex hidden"
      >
        {/* Search */}
        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 680 }}>
          <div style={{ position: "relative" }} ref={desktopSearchRef}>
            <svg
              fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#8a94a6", width: 16, height: 16 }}
            >
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search applications, business units, departments…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                border: `1px solid ${isSearchFocused ? "#6e7f96" : "#e5e8ed"}`,
                borderRadius: 20,
                background: "#f4f5f7",
                fontSize: 13.5,
                color: "#1a2332",
                outline: "none",
                boxShadow: isSearchFocused ? "0 0 0 3px rgba(88,99,121,.1)" : "none",
                transition: "border-color .15s, box-shadow .15s",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#8a94a6", padding: 2 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              </button>
            )}

            {/* Search results dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1px solid #e5e8ed",
                  borderRadius: 10,
                  boxShadow: "0 4px 12px rgba(0,0,0,.10)",
                  maxHeight: 384,
                  overflowY: "auto",
                  zIndex: 50,
                }}
              >
                {searchResults.length > 0 ? (
                  <div style={{ padding: "8px 0" }}>
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        style={{
                          width: "100%",
                          padding: "10px 16px",
                          background: index === selectedResultIndex ? "#fff8ed" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 12,
                          transition: "background .1s",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fafbfc"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = index === selectedResultIndex ? "#fff8ed" : "transparent"; }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{
                            fontSize: 20,
                            marginTop: 2,
                            color: result.type === "businessUnit" ? "#586379" : result.type === "department" ? "#60a5fa" : "#34d399",
                          }}
                        >
                          {getResultIcon(result.type)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13.5, fontWeight: 600, color: "#1a2332" }}>{result.name}</span>
                            <span style={{ fontSize: 11, background: "#f4f5f7", color: "#8a94a6", borderRadius: 4, padding: "1px 6px", fontWeight: 500 }}>
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.description && (
                            <p style={{ fontSize: 12, color: "#8a94a6", margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {result.description}
                            </p>
                          )}
                          {result.businessUnitName && result.type !== "businessUnit" && (
                            <p style={{ fontSize: 12, color: "#8a94a6", marginTop: 1 }}>
                              {result.businessUnitName}{result.type === "app" && " · Click to launch"}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "32px 16px", textAlign: "center" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#b0b8c4", display: "block", marginBottom: 8 }}>search_off</span>
                    <p style={{ fontSize: 13.5, color: "#8a94a6" }}>No results for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Right side */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <NotificationBell />

          {/* User dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: 4, background: "none", border: "none", cursor: "pointer", borderRadius: 8 }}
              aria-label="User menu"
            >
              <div style={{ textAlign: "right" }}>
                <p className="hidden xl:block" style={{ fontSize: 13, fontWeight: 600, color: "#1a2332", margin: 0 }}>{user?.firstName} {user?.lastName}</p>
                <p className="hidden xl:block" style={{ fontSize: 11, color: "#8a94a6", margin: 0, textTransform: "capitalize" }}>
                  {user?.role === "superadmin" ? "System Administrator" : user?.role}
                </p>
              </div>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "#fea920",
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
            </button>

            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} aria-hidden="true" />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 8px)",
                    width: 210,
                    background: "#fff",
                    border: "1px solid #e5e8ed",
                    borderRadius: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,.10)",
                    zIndex: 20,
                    overflow: "hidden",
                    padding: "4px 0",
                  }}
                >
                  <Link
                    to="/dashboard"
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13.5, color: "#1a2332", textDecoration: "none" }}
                    onClick={() => setIsDropdownOpen(false)}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f4f5f7"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>dashboard</span>
                    Dashboard
                  </Link>
                  {(user?.role === "admin" || user?.role === "superadmin") && (
                    <Link
                      to="/admin"
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13.5, color: "#1a2332", textDecoration: "none" }}
                      onClick={() => setIsDropdownOpen(false)}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f4f5f7"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>admin_panel_settings</span>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", fontSize: 13.5, color: "#dc2626", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>logout</span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile TopBar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-2 px-3"
        style={{ height: 60, background: "#ffffff", borderBottom: "1px solid #e5e8ed" }}
      >
        <Link to="/dashboard" className="flex items-center shrink-0" aria-label="Dashboard">
          <div
            style={{ width: 28, height: 28, background: "#fea920", borderRadius: 6, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12, color: "#fff" }}
          >
            OSI
          </div>
        </Link>

        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation shrink-0"
          aria-label="Open navigation menu"
        >
          <span className="material-symbols-outlined text-xl text-gray-600">menu</span>
        </button>

        <form onSubmit={handleSearch} className="min-w-0 flex-1">
          <div className="relative" ref={mobileSearchRef}>
            <span
              className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg text-gray-400"
              aria-hidden="true"
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="h-10 w-full rounded-full border border-gray-200 bg-gray-50 pl-9 pr-8 text-sm text-gray-900 outline-none transition focus:border-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200"
            />

            {isSearchFocused && searchQuery.trim() && (
              <div className="fixed left-3 right-3 top-[68px] max-h-[70vh] overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-xl">
                {searchResults.length > 0 ? (
                  searchResults.map((result, index) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => handleResultClick(result)}
                      className="flex w-full items-start gap-3 px-4 py-3 text-left"
                      style={{
                        background: index === selectedResultIndex ? "#fff8ed" : "transparent",
                      }}
                    >
                      <span className="material-symbols-outlined mt-0.5 text-xl text-gray-500" aria-hidden="true">
                        {getResultIcon(result.type)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-900">
                          {result.name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-gray-500">
                          {getResultTypeLabel(result.type)}
                          {result.businessUnitName ? ` · ${result.businessUnitName}` : ""}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No results for "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        <div className="flex items-center gap-1 shrink-0">
          <NotificationBell />
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="hidden touch-manipulation sm:block"
            aria-label="User menu"
          >
            <div
              style={{ width: 32, height: 32, borderRadius: "50%", background: "#fea920", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}
            >
              {getInitials()}
            </div>
          </button>
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} aria-hidden="true" />
              <div className="absolute right-4 top-[60px] w-48 bg-white rounded-xl border border-gray-200 py-1 z-20 shadow-xl overflow-hidden">
                <Link to="/dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                  <span className="material-symbols-outlined text-lg">dashboard</span>Dashboard
                </Link>
                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <Link to="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>Admin Panel
                  </Link>
                )}
                <button onClick={handleLogout} className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 transition-colors">
                  <span className="material-symbols-outlined text-lg">logout</span>Logout
                </button>
              </div>
            </>
          )}
        </div>
      </header>
    </>
  );
};

export default TopBar;
