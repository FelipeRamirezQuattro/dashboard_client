import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBusinessUnit } from "../hooks/useBusinessUnits";
import { departmentService } from "../services/department.service";
import { getApps } from "../services/apps.service";
import LoadingSpinner from "../components/LoadingSpinner";
import { IExternalApp } from "../types/app.types";
import { useAuth } from "../hooks/useAuth";
import { AppCardSkeleton } from "../components/SkeletonLoader";

const BusinessUnitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      <div className="flex items-center justify-center min-h-screen bg-osi-dark">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !businessUnit) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-osi-dark">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center max-w-md">
          <p className="text-red-400">Failed to load business unit details.</p>
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
    <div className="flex min-h-screen bg-white">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-56 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ${
          isMobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo Section */}
        <div className="p-4 sm:p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-gray-600">
                close
              </span>
            </button>
            <img
              src={
                businessUnit.logoUrl ||
                "https://via.placeholder.com/200x200/fbad37/ffffff?text=OSI"
              }
              alt={`${businessUnit.name} logo`}
              className="w-10 h-10 rounded-lg object-cover"
              width="40"
              height="40"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src =
                  "https://via.placeholder.com/200x200/fbad37/ffffff?text=OSI";
              }}
            />
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">
                Odessa Separator
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-wide">
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
                    className={`w-full flex items-center justify-between px-4 sm:px-5 py-3 transition-colors border-l-4 touch-manipulation ${
                      isSelected
                        ? "bg-osi-primary/10 border-osi-primary text-gray-900"
                        : "border-transparent text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-lg"
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
                      <span className="font-medium text-sm sm:text-base">
                        {dept.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{appCount}</span>
                  </button>
                );
              })}
        </nav>

        {/* User Profile at Bottom */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              navigate("/dashboard");
              setIsMobileSidebarOpen(false);
            }}
            className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
          >
            <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.firstName?.charAt(0)}
              {user?.lastName?.charAt(0)}
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName?.charAt(0)}. {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Mobile Header */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
            aria-label="Open departments menu"
          >
            <span className="material-symbols-outlined text-gray-700">
              menu
            </span>
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg touch-manipulation"
            aria-label="Back to dashboard"
          >
            <span className="material-symbols-outlined text-gray-700">
              arrow_back
            </span>
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-base truncate">
              {businessUnit.name}
            </h1>
            {selectedDepartment && (
              <p className="text-xs text-gray-600 truncate">
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
        <div className="px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4 sm:pb-6 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                {selectedDepartment
                  ? `${departments?.filter((d) => d != null).find((d) => d._id === selectedDepartment)?.name} Division Apps`
                  : `${businessUnit.name} Applications`}
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
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
              className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium touch-manipulation shrink-0"
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
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50">
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
                <div className="bg-white border border-gray-200 rounded-lg p-8 sm:p-12 text-center">
                  <span
                    className="material-symbols-outlined text-gray-400 text-5xl sm:text-6xl mb-4"
                    aria-hidden="true"
                  >
                    apps
                  </span>
                  <p className="text-gray-600 text-base sm:text-lg">
                    No applications found
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {filteredApps.map((app) => (
                    <div
                      key={app._id}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                    >
                      {/* Image Banner */}
                      <div className="h-40 sm:h-48 bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden relative">
                        <img
                          src={app.iconUrl || getPlaceholderImage(app.category)}
                          alt={app.name}
                          className="w-full h-full object-cover"
                          width="800"
                          height="400"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getPlaceholderImage(app.category);
                          }}
                        />
                        {/* Version Badge */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-md text-xs font-semibold text-gray-700">
                          v4.2.0
                        </div>
                      </div>

                      {/* Content Section */}
                      <div className="p-4 sm:p-5">
                        {/* Category and Status */}
                        <div className="flex items-center gap-2 mb-3">
                          {app.category && (
                            <span className="inline-flex items-center px-2 sm:px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                              {app.category.toUpperCase()}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 ml-auto">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-xs font-semibold text-emerald-600 uppercase">
                              Online
                            </span>
                          </div>
                        </div>

                        <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-2">
                          {app.name}
                        </h3>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {app.description}
                        </p>

                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full bg-osi-primary hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors touch-manipulation active:scale-95"
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

              {/* Division Update Banner */}
              {filteredApps.length > 0 && (
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 sm:p-8 mb-6 relative overflow-hidden">
                  {/* Gear decorations */}
                  <div className="absolute right-0 top-0 opacity-10 hidden sm:block">
                    <span
                      className="material-symbols-outlined text-9xl text-white"
                      aria-hidden="true"
                    >
                      settings
                    </span>
                  </div>
                  <div className="relative z-10">
                    <div className="text-osi-primary text-xs font-bold uppercase tracking-wider mb-3">
                      {selectedDepartment
                        ? `${departments?.filter((d) => d != null).find((d) => d._id === selectedDepartment)?.name} Division Update`
                        : "Division Update"}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                      Centralized Pump Registry is moving to a new cloud-native
                      infrastructure.
                    </h3>
                    <p className="text-gray-300 text-sm mb-6 max-w-2xl">
                      Starting Q3, all rod pump serialization and manufacturing
                      logs will be automatically synchronized with the global
                      OSI Technical Database. Please ensure all technicians have
                      completed their SSO migration.
                    </p>
                    <button className="bg-white hover:bg-gray-100 text-gray-900 font-semibold px-6 py-3 rounded-lg transition-colors text-sm touch-manipulation active:scale-95">
                      Read Documentation
                    </button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center py-6 text-xs text-gray-500">
                <p>
                  © 2026 Odessa Separator Inc. Technical Division. All rights
                  reserved.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-2">
                  <a
                    href="#"
                    className="hover:text-gray-700 transition-colors touch-manipulation"
                  >
                    INTERNAL POLICIES
                  </a>
                  <a
                    href="#"
                    className="hover:text-gray-700 transition-colors touch-manipulation"
                  >
                    IT SUPPORT
                  </a>
                  <a
                    href="#"
                    className="hover:text-gray-700 transition-colors touch-manipulation"
                  >
                    SYSTEM ARCHITECTURE
                  </a>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Service Health */}
            <div className="w-full lg:w-72">
              <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 lg:sticky lg:top-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
                  Service Health
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 font-medium">
                        Global API
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        99.9%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
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
                      <span className="text-sm text-gray-700 font-medium">
                        License Server
                      </span>
                      <span className="text-sm font-bold text-emerald-600">
                        100%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: "100%" }}
                        role="progressbar"
                        aria-valuenow={100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Last sync: 12 minutes ago
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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
