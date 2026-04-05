import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBusinessUnit } from "../hooks/useBusinessUnits";
import { departmentService } from "../services/department.service";
import { getApps } from "../services/apps.service";
import LoadingSpinner from "../components/LoadingSpinner";
import { IExternalApp } from "../types/app.types";
import { AppCardSkeleton } from "../components/SkeletonLoader";

const BusinessUnitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch Business Unit
  const {
    data: businessUnit,
    isLoading: isLoadingBU,
    error: errorBU,
  } = useBusinessUnit(id!);

  // Fetch Departments for this BU
  const { data: departments, error: errorDepts } = useQuery({
    queryKey: ["departments", id],
    queryFn: () => departmentService.getDepartmentsByBusinessUnit(id!),
    enabled: !!id,
  });

  // Fetch Apps (we'll filter by BU on frontend)
  const {
    data: allApps,
    isLoading: isLoadingApps,
    error: errorApps,
  } = useQuery({
    queryKey: ["apps"],
    queryFn: getApps,
  });

  // Get placeholder image URL based on category
  const getPlaceholderImage = (category?: string) => {
    const fallbackImage =
      "https://via.placeholder.com/800x400/6366f1/ffffff?text=Application";

    if (!category) return fallbackImage;

    const categoryLower = category.toLowerCase();

    if (categoryLower.includes("analytics") || categoryLower.includes("data")) {
      return "https://via.placeholder.com/800x400/3b82f6/ffffff?text=Analytics";
    }
    if (
      categoryLower.includes("communication") ||
      categoryLower.includes("collaboration")
    ) {
      return "https://via.placeholder.com/800x400/8b5cf6/ffffff?text=Communication";
    }
    if (
      categoryLower.includes("productivity") ||
      categoryLower.includes("workflow")
    ) {
      return "https://via.placeholder.com/800x400/10b981/ffffff?text=Productivity";
    }
    if (categoryLower.includes("hr") || categoryLower.includes("human")) {
      return "https://via.placeholder.com/800x400/f59e0b/ffffff?text=HR";
    }
    if (
      categoryLower.includes("finance") ||
      categoryLower.includes("accounting")
    ) {
      return "https://via.placeholder.com/800x400/ef4444/ffffff?text=Finance";
    }

    return fallbackImage;
  };

  // Filter apps by business unit, department, and search query
  const filteredApps = useMemo(() => {
    if (!allApps || !Array.isArray(allApps)) return [];

    let filtered = allApps.filter((app: IExternalApp) => {
      if (!app.businessUnitId) return false;
      const buId =
        typeof app.businessUnitId === "string"
          ? app.businessUnitId
          : app.businessUnitId._id;
      return buId === id && app.isActive;
    });

    // Filter by selected department
    if (selectedDepartment) {
      filtered = filtered.filter((app: IExternalApp) => {
        if (!app.departmentId) return false;
        const deptId =
          typeof app.departmentId === "string"
            ? app.departmentId
            : app.departmentId._id;
        return deptId === selectedDepartment;
      });
    }

    return filtered;
  }, [allApps, id, selectedDepartment]);

  // Group apps by department for counting
  const appsByDepartment = useMemo(() => {
    if (!allApps || !Array.isArray(allApps)) return {};

    const grouped: Record<string, number> = {};
    allApps.forEach((app: IExternalApp) => {
      if (!app.businessUnitId) return;
      const buId =
        typeof app.businessUnitId === "string"
          ? app.businessUnitId
          : app.businessUnitId._id;
      if (buId !== id || !app.isActive) return;

      if (!app.departmentId) return;
      const deptId =
        typeof app.departmentId === "string"
          ? app.departmentId
          : app.departmentId._id;
      grouped[deptId] = (grouped[deptId] || 0) + 1;
    });
    return grouped;
  }, [allApps, id]);

  const error = errorBU || errorDepts || errorApps;

  if (isLoadingBU) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#f8fafc" }}
      >
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !businessUnit) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#f8fafc" }}
      >
        <div
          className="rounded-lg p-6 text-center max-w-md"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.25)",
          }}
        >
          <p className="text-red-300">Failed to load business unit details.</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 text-osi-primary underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-12 lg:h-[calc(100vh-3rem)] inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-[220px] flex flex-col transform transition-transform duration-300 ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "white",
          backdropFilter: "blur(12px)",
          borderRight: "1px solid #e5e7eb",
        }}
      >
        {/* Logo Section */}
        <div
          className="p-4 sm:p-5 flex-shrink-0"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg touch-manipulation text-gray-600 hover:text-gray-900"
              style={{ background: "#f3f4f6" }}
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
            <img
              src={
                businessUnit.logoUrl ||
                "https://via.placeholder.com/200x200/fbad37/0a0a12?text=OSI"
              }
              alt={`${businessUnit.name} logo`}
              className="w-9 h-9 rounded-lg object-cover"
              width="36"
              height="36"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://via.placeholder.com/200x200/fbad37/0a0a12?text=OSI";
              }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-bold text-gray-800 truncate">
                Odessa Separator
              </h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide truncate">
                {businessUnit.name}
              </p>
            </div>
          </div>
        </div>

        {/* Departments Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {departments &&
            Array.isArray(departments) &&
            departments
              .filter((dept) => dept != null)
              .map((dept) => {
                const appCount = appsByDepartment[dept._id] || 0;
                const isSelected = selectedDepartment === dept._id;

                return (
                  <button
                    key={dept._id}
                    onClick={() => {
                      setSelectedDepartment(dept._id);
                      setIsMobileSidebarOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 sm:px-5 py-3 transition-all touch-manipulation border-l-2 ${
                      isSelected
                        ? "border-osi-primary text-gray-900 font-medium"
                        : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                    style={
                      isSelected
                        ? { background: "rgba(251,173,55,0.1)" }
                        : { background: "transparent" }
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`material-symbols-outlined text-lg ${isSelected ? "text-osi-primary" : "text-gray-400"}`}
                        aria-hidden="true"
                      >
                        {dept.name.toLowerCase().includes("technical")
                          ? "engineering"
                          : dept.name.toLowerCase().includes("sales")
                            ? "trending_up"
                            : dept.name.toLowerCase().includes("manufacturing")
                              ? "factory"
                              : dept.name.toLowerCase().includes("operations")
                                ? "settings"
                                : dept.name.toLowerCase().includes("quality")
                                  ? "verified"
                                  : dept.name.toLowerCase().includes("hse")
                                    ? "health_and_safety"
                                    : "domain"}
                      </span>
                      <span className="text-sm">{dept.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{appCount}</span>
                  </button>
                );
              })}
        </nav>

        {/* Back to Dashboard */}
        <div
          className="p-3 flex-shrink-0"
          style={{ borderTop: "1px solid #e5e7eb" }}
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg transition-colors text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 touch-manipulation"
          >
            <span
              className="material-symbols-outlined text-lg"
              aria-hidden="true"
            >
              arrow_back
            </span>
            <span>Back to Dashboard</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <div
          className="lg:hidden sticky top-0 z-30 px-4 py-3 flex items-center gap-3 flex-shrink-0"
          style={{
            background: "white",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-lg touch-manipulation text-gray-600 hover:text-gray-900"
            style={{ background: "#f3f4f6" }}
            aria-label="Open departments menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-lg touch-manipulation text-gray-600 hover:text-gray-900"
            style={{ background: "#f3f4f6" }}
            aria-label="Back to dashboard"
          >
            <span className="material-symbols-outlined text-xl">
              arrow_back
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 text-sm truncate">
              {businessUnit.name}
            </h1>
            {selectedDepartment && (
              <p className="text-xs text-gray-400 truncate">
                {
                  departments
                    ?.filter((d) => d != null)
                    .find((d) => d._id === selectedDepartment)?.name
                }
              </p>
            )}
          </div>
        </div>

        {/* Header with Title and Description */}
        <div
          className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 flex-shrink-0"
          style={{ borderBottom: "1px solid #e5e7eb" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2">
                {selectedDepartment
                  ? `${departments?.filter((d) => d != null).find((d) => d._id === selectedDepartment)?.name} Division Apps`
                  : `${businessUnit.name} Applications`}
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                {selectedDepartment
                  ? `Specialized engineering and monitoring tools for ${departments
                      ?.filter((d) => d != null)
                      .find((d) => d._id === selectedDepartment)
                      ?.name.toLowerCase()} operations.`
                  : businessUnit.description}
              </p>
            </div>
            <button
              onClick={() => setSelectedDepartment(null)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all text-sm font-medium touch-manipulation shrink-0 text-gray-600 hover:text-gray-900"
              style={{
                background: "#f3f4f6",
                border: "1px solid #e5e7eb",
              }}
            >
              <span
                className="material-symbols-outlined text-lg"
                aria-hidden="true"
              >
                apps
              </span>
              <span className="hidden sm:inline">All Apps</span>
              <span className="sm:hidden">All</span>
            </button>
          </div>
        </div>

        {/* Apps Grid */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Apps Column */}
            <div className="flex-1">
              {isLoadingApps ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {[...Array(4)].map((_, i) => (
                    <AppCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredApps.length === 0 ? (
                <div
                  className="rounded-lg p-8 sm:p-12 text-center"
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <span
                    className="material-symbols-outlined text-gray-400 text-5xl sm:text-6xl mb-4"
                    aria-hidden="true"
                  >
                    apps
                  </span>
                  <p className="text-gray-400 text-base sm:text-lg">
                    No applications found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {filteredApps.map((app) => (
                    <div
                      key={app._id}
                      className="rounded-xl overflow-hidden transition-all duration-200 hover:scale-[1.015]"
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.border =
                          "1px solid rgba(251,173,55,0.3)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "0 0 24px rgba(251,173,55,0.08)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.border =
                          "1px solid #e5e7eb";
                        (e.currentTarget as HTMLDivElement).style.boxShadow =
                          "none";
                      }}
                    >
                      {/* Image Banner */}
                      <div className="h-40 sm:h-48 overflow-hidden relative">
                        <img
                          src={app.iconUrl || getPlaceholderImage(app.category)}
                          alt={app.name}
                          className="w-full h-full object-cover opacity-70"
                          width="800"
                          height="400"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getPlaceholderImage(app.category);
                          }}
                        />
                        {/* Version Badge */}
                        <div
                          className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-1 rounded-md text-xs font-semibold text-gray-700"
                          style={{ background: "rgba(255,255,255,0.9)" }}
                        >
                          v4.2.0
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 sm:p-5">
                        {/* Category and Status */}
                        <div className="flex items-center gap-2 mb-3">
                          {app.category && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold text-blue-600"
                              style={{ background: "rgba(59,130,246,0.1)" }}
                            >
                              {app.category.toUpperCase()}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                            <span className="text-xs font-semibold text-emerald-400 uppercase">
                              Online
                            </span>
                          </div>
                        </div>

                        <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-2">
                          {app.name}
                        </h3>

                        <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                          {app.description}
                        </p>

                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full font-semibold py-3 rounded-lg transition-all touch-manipulation text-black active:scale-95"
                          style={{
                            background:
                              "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                            boxShadow: "0 0 16px rgba(251,173,55,0.25)",
                          }}
                        >
                          <span
                            className="material-symbols-outlined text-lg"
                            aria-hidden="true"
                          >
                            rocket_launch
                          </span>
                          Launch App
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="text-center py-6 text-xs text-gray-400">
                <p>
                  © 2026 Odessa Separator Inc. Technical Division. All rights
                  reserved.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2">
                  <a
                    href="#"
                    className="hover:text-gray-400 transition-colors touch-manipulation"
                  >
                    INTERNAL POLICIES
                  </a>
                  <a
                    href="#"
                    className="hover:text-gray-400 transition-colors touch-manipulation"
                  >
                    IT SUPPORT
                  </a>
                  <a
                    href="#"
                    className="hover:text-gray-400 transition-colors touch-manipulation"
                  >
                    SYSTEM ARCHITECTURE
                  </a>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Service Health */}
            <div className="w-full lg:w-72">
              <div
                className="rounded-xl p-5 sm:p-6 lg:sticky lg:top-6"
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">
                  Service Health
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 font-medium">
                        Global API
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        99.9%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "#f3f4f6" }}
                    >
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: "99.9%" }}
                        role="progressbar"
                        aria-valuenow={99.9}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 font-medium">
                        License Server
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        100%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "#f3f4f6" }}
                    >
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: "100%" }}
                        role="progressbar"
                        aria-valuenow={100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-5 pt-5"
                  style={{ borderTop: "1px solid #e5e7eb" }}
                >
                  <p className="text-xs text-gray-400">
                    Last sync: 12 minutes ago
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Update: UX Division, 1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BusinessUnitView;
