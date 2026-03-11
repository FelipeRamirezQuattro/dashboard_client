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

  // Fetch data for search
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

  // Close search results when clicking outside
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

  // Filter and combine search results
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search in business units
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

    // Search in departments
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

    // Search in applications
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

    return results.slice(0, 10); // Limit to 10 results
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
    // If a result is selected, handle it
    if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
      handleResultClick(searchResults[selectedResultIndex]);
    }
  };

  // Reset selected index when search query changes
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
      {/* Mobile Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      {/* Mobile Search */}
      <MobileSearch
        isOpen={isMobileSearchOpen}
        onClose={() => setIsMobileSearchOpen(false)}
      />

      <header className="flex items-center justify-between border-b border-osi-primary/10 bg-white px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 shadow-sm">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileNavOpen(true)}
          className="lg:hidden p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
          aria-label="Open navigation menu"
        >
          <span
            className="material-symbols-outlined text-2xl text-gray-700"
            aria-hidden="true"
          >
            menu
          </span>
        </button>

        {/* Logo - Responsive */}
        <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-osi-primary text-white flex-shrink-0">
            <span
              className="material-symbols-outlined text-xl sm:text-2xl"
              aria-hidden="true"
            >
              factory
            </span>
          </div>
          <h1 className="text-base sm:text-xl font-bold tracking-tight text-slate-900 hidden md:block">
            Odessa Separator Inc. (OSI)
          </h1>
          <h1 className="text-base font-bold tracking-tight text-slate-900 md:hidden">
            OSI
          </h1>
        </Link>

        {/* Desktop Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden lg:flex flex-1 max-w-2xl mx-8"
        >
          <div className="relative w-full" ref={searchRef}>
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:border-gray-300 focus-within:border-osi-primary focus-within:bg-white transition-all">
              <span
                className="material-symbols-outlined text-gray-400 text-xl"
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
                className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-700 placeholder:text-gray-400"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded touch-manipulation"
                  aria-label="Clear search"
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    aria-hidden="true"
                  >
                    close
                  </span>
                </button>
              )}
            </div>

            {/* Search Results Dropdown - Desktop */}
            {isSearchFocused && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, index) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result)}
                        className={`w-full px-4 py-3 transition-colors text-left flex items-start gap-3 ${
                          index === selectedResultIndex
                            ? "bg-osi-primary/10"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-xl mt-0.5 ${
                            result.type === "businessUnit"
                              ? "text-osi-primary"
                              : result.type === "department"
                                ? "text-blue-600"
                                : "text-green-600"
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
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                              {getResultTypeLabel(result.type)}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                              {result.description}
                            </p>
                          )}
                          {result.businessUnitName &&
                            result.type !== "businessUnit" && (
                              <p className="text-xs text-gray-400 mt-1">
                                {result.businessUnitName}
                                {result.type === "app" && " • Click to launch"}
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
                    <p className="text-sm text-gray-500">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Mobile Search Button */}
        <button
          onClick={() => setIsMobileSearchOpen(true)}
          className="lg:hidden p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
          aria-label="Open search"
        >
          <span
            className="material-symbols-outlined text-2xl text-gray-700"
            aria-hidden="true"
          >
            search
          </span>
        </button>

        {/* User Dropdown */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 sm:gap-4 touch-manipulation p-1 sm:p-0 hover:bg-gray-100 sm:hover:bg-transparent rounded-lg transition-colors"
              aria-label="User menu"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-none">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-osi-secondary mt-1 capitalize">
                  {user?.role === "superadmin"
                    ? "System Administrator"
                    : user?.role}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-slate-200 border-2 border-osi-primary overflow-hidden flex items-center justify-center text-osi-dark font-semibold text-sm flex-shrink-0">
                {getInitials()}
              </div>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsDropdownOpen(false)}
                  aria-hidden="true"
                ></div>
                <div className="absolute right-0 mt-2 w-56 sm:w-48 bg-white rounded-lg shadow-lg py-1 z-20 border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 sm:hidden">
                    <p className="text-sm font-medium text-osi-dark">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize mt-1">
                      {user?.role === "superadmin"
                        ? "System Administrator"
                        : user?.role}
                    </p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="block px-4 py-2.5 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-lg"
                        aria-hidden="true"
                      >
                        dashboard
                      </span>
                      Dashboard
                    </span>
                  </Link>
                  {(user?.role === "admin" || user?.role === "superadmin") && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2.5 sm:py-2 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="material-symbols-outlined text-lg"
                          aria-hidden="true"
                        >
                          admin_panel_settings
                        </span>
                        Admin Panel
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2.5 sm:py-2 text-sm text-red-600 hover:bg-gray-100 active:bg-gray-200 touch-manipulation"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-lg"
                        aria-hidden="true"
                      >
                        logout
                      </span>
                      Logout
                    </span>
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
