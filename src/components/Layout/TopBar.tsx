// client/src/components/Layout/TopBar.tsx
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
import MobileSearch from "./MobileSearch";
import NotificationBell from "../NotificationBell";

interface SearchResult {
  id: string;
  name: string;
  type: "app" | "businessUnit" | "department";
  description?: string;
  businessUnitId?: string;
  businessUnitName?: string;
}

const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const { data: apps = [] } = useQuery({
    queryKey: ["apps"],
    queryFn: getApps,
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => businessUnitService.getActiveBusinessUnits(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentService.getActiveDepartments(),
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
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
      if (
        bu.name.toLowerCase().includes(query) ||
        bu.description.toLowerCase().includes(query)
      ) {
        results.push({
          id: bu._id,
          name: bu.name,
          type: "businessUnit",
          description: bu.description,
        });
      }
    });

    departments.forEach((dept: Department) => {
      if (
        dept.name.toLowerCase().includes(query) ||
        dept.description.toLowerCase().includes(query)
      ) {
        const buId =
          typeof dept.businessUnitId === "object"
            ? dept.businessUnitId._id
            : dept.businessUnitId;
        const buName =
          typeof dept.businessUnitId === "object"
            ? dept.businessUnitId.name
            : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name ||
              "";
        results.push({
          id: dept._id,
          name: dept.name,
          type: "department",
          description: dept.description,
          businessUnitId: buId,
          businessUnitName: buName,
        });
      }
    });

    apps.forEach((app: IExternalApp) => {
      if (
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      ) {
        const buId =
          typeof app.businessUnitId === "object"
            ? app.businessUnitId._id
            : app.businessUnitId;
        const buName =
          typeof app.businessUnitId === "object"
            ? app.businessUnitId.name
            : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name ||
              "";
        results.push({
          id: app._id,
          name: app.name,
          type: "app",
          description: app.description,
          businessUnitId: buId,
          businessUnitName: buName,
        });
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
        if (response.launchUrl) {
          window.open(response.launchUrl, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        console.error("Failed to launch app:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchResults.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedResultIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedResultIndex((prev) => (prev > 0 ? prev - 1 : -1));
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
    }
  };

  useEffect(() => {
    setSelectedResultIndex(-1);
  }, [searchQuery]);

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "businessUnit":
        return "corporate_fare";
      case "department":
        return "domain";
      case "app":
        return "apps";
      default:
        return "search";
    }
  };

  const getResultTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "businessUnit":
        return "Business Unit";
      case "department":
        return "Department";
      case "app":
        return "Application";
      default:
        return "";
    }
  };

  return (
    <>
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <MobileSearch
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      <header
        className="h-12 flex items-center justify-between px-4 sm:px-6 fixed top-0 left-0 right-0 z-40 border-b border-gray-200"
        style={{ background: "white" }}
      >
        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="lg:hidden p-1.5 -ml-1 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
          aria-label="Open navigation menu"
        >
          <span
            className="material-symbols-outlined text-xl text-gray-600"
            aria-hidden="true"
          >
            menu
          </span>
        </button>

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-osi-primary to-osi-primary-dark flex-shrink-0 glow-amber-sm">
            <span
              className="material-symbols-outlined text-base text-black"
              aria-hidden="true"
            >
              factory
            </span>
          </div>
          <h1 className="text-sm font-bold tracking-tight text-gray-900 hidden md:block">
            Odessa Separator Inc.
          </h1>
          <h1 className="text-sm font-bold tracking-tight text-gray-900 md:hidden">
            OSI
          </h1>
        </Link>

        {/* Desktop Search */}
        <form
          onSubmit={handleSearch}
          className="hidden lg:flex flex-1 max-w-xl mx-8"
        >
          <div className="relative w-full" ref={searchRef}>
            <div
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all"
              style={{
                background: isSearchFocused ? "#f3f4f6" : "#f9fafb",
                borderColor: isSearchFocused
                  ? "rgba(251,173,55,0.6)"
                  : "#e5e7eb",
              }}
            >
              <span
                className="material-symbols-outlined text-gray-400 text-lg"
                aria-hidden="true"
              >
                search
              </span>
              <input
                type="text"
                placeholder="Search applications, business units, departments…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder:text-gray-400"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors touch-manipulation"
                  aria-label="Clear search"
                >
                  <span
                    className="material-symbols-outlined text-base"
                    aria-hidden="true"
                  >
                    close
                  </span>
                </button>
              )}
            </div>

            {/* Search results dropdown */}
            {isSearchFocused && searchQuery.trim() && (
              <div
                className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-gray-200 max-h-96 overflow-y-auto z-50 shadow-2xl"
                style={{ background: "white" }}
              >
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 transition-colors text-left flex items-start gap-3 ${
                          index === selectedResultIndex
                            ? "bg-amber-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl mt-0.5 ${
                            result.type === "businessUnit"
                              ? "text-osi-primary"
                              : result.type === "department"
                                ? "text-blue-400"
                                : "text-emerald-400"
                          }`}
                          aria-hidden="true"
                        >
                          {getResultIcon(result.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900">
                              {result.name}
                            </p>
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                              {result.description}
                            </p>
                          )}
                          {result.businessUnitName &&
                            result.type !== "businessUnit" && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {result.businessUnitName}
                                {result.type === "app" && " · Click to launch"}
                              </p>
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center">
                    <span
                      className="material-symbols-outlined text-gray-300 text-4xl mb-2"
                      aria-hidden="true"
                    >
                      search_off
                    </span>
                    <p className="text-sm text-gray-400">
                      No results for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            aria-label="Open search"
          >
            <span
              className="material-symbols-outlined text-xl text-gray-600"
              aria-hidden="true"
            >
              search
            </span>
          </button>

          {/* Notifications */}
          <NotificationBell />

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 touch-manipulation p-1 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="User menu"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-gray-900 leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 capitalize">
                  {user?.role === "superadmin"
                    ? "System Administrator"
                    : user?.role}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-osi-primary to-osi-primary-dark border border-osi-primary/30 flex items-center justify-center text-black font-bold text-xs flex-shrink-0 glow-amber-sm">
                {getInitials()}
              </div>
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-gray-200 py-1 z-20 shadow-2xl overflow-hidden"
                  style={{ background: "white" }}
                >
                  <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">
                      {user?.role === "superadmin"
                        ? "System Administrator"
                        : user?.role}
                    </p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors touch-manipulation"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      aria-hidden="true"
                    >
                      dashboard
                    </span>
                    Dashboard
                  </Link>
                  {(user?.role === "admin" || user?.role === "superadmin") && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors touch-manipulation"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        aria-hidden="true"
                      >
                        admin_panel_settings
                      </span>
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 transition-colors touch-manipulation"
                  >
                    <span
                      className="material-symbols-outlined text-lg"
                      aria-hidden="true"
                    >
                      logout
                    </span>
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
};

export default TopBar;
