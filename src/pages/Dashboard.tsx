import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBusinessUnits } from "../hooks/useBusinessUnits";
import { BusinessUnitCardSkeleton } from "../components/SkeletonLoader";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: businessUnits, isLoading, error } = useBusinessUnits();
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-br from-osi-primary to-amber-600 rounded-xl p-6 sm:p-8 text-white shadow-lg">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-white/90 text-base sm:text-lg">
                Monitor and manage your industrial separator operations
              </p>
            </div>

            {/* System Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Units
                  </span>
                  <span
                    className="material-symbols-outlined text-blue-500 text-xl sm:text-2xl"
                    aria-hidden="true"
                  >
                    factory
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {businessUnits?.length || 0}
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    Active Units
                  </span>
                  <span
                    className="material-symbols-outlined text-emerald-500 text-xl sm:text-2xl"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {businessUnits?.length || 0}
                </div>
                <div className="text-[10px] sm:text-xs text-slate-600 mt-1">
                  All Systems Operational
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 sm:p-5 shadow-sm border border-gray-100 col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    System Health
                  </span>
                  <span
                    className="material-symbols-outlined text-emerald-500 text-xl sm:text-2xl"
                    aria-hidden="true"
                  >
                    health_and_safety
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600">
                  98.5%
                </div>
                <div className="text-[10px] sm:text-xs text-emerald-600 mt-1">
                  +2.3% from last week
                </div>
              </div>
            </div>

            {/* Business Units Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Business Units
                </h2>
              </div>

              <div className="p-4 sm:p-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {[...Array(4)].map((_, i) => (
                      <BusinessUnitCardSkeleton key={i} />
                    ))}
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center">
                    <p className="text-red-600 text-sm sm:text-base">
                      Failed to load business units. Please try again.
                    </p>
                  </div>
                ) : !businessUnits || businessUnits.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm sm:text-base">
                      No business units available
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {Array.isArray(businessUnits) &&
                      businessUnits.map((bu) => (
                        <div
                          key={bu._id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:border-osi-primary transition-colors"
                        >
                          {/* Image Section */}
                          <div className="h-28 sm:h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                            <img
                              src={
                                bu.logoUrl ||
                                "https://via.placeholder.com/400x200/e2e8f0/64748b?text=Business+Unit"
                              }
                              alt={`${bu.name} logo`}
                              width="400"
                              height="200"
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/400x200/e2e8f0/64748b?text=Business+Unit";
                              }}
                            />
                          </div>

                          {/* Content Section - Dark Background */}
                          <div className="bg-osi-dark p-3 sm:p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-base sm:text-lg text-white line-clamp-2">
                                {bu.name}
                              </h3>
                              <span className="px-2 sm:px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs rounded-full font-medium flex-shrink-0 ml-2">
                                Active
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-white mb-3 sm:mb-4 line-clamp-2">
                              {bu.description}
                            </p>

                            <button
                              onClick={() =>
                                navigate(`/business-unit/${bu._id}`)
                              }
                              className="w-full bg-osi-primary hover:bg-osi-primary-dark text-white font-medium py-2 sm:py-2.5 rounded-lg transition-colors touch-manipulation"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Performance Overview
              </h3>
              <div className="h-64 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                <div className="text-center">
                  <span className="material-symbols-outlined text-slate-300 text-6xl mb-2">
                    show_chart
                  </span>
                  <p className="text-slate-500 text-sm">
                    Performance metrics visualization
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Critical Alerts */}
            <div className="bg-osi-dark rounded-lg shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-400">
                    warning
                  </span>
                  Critical Alerts
                </h3>
              </div>
              <div className="p-5">
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-slate-600 text-5xl mb-3">
                    notifications_off
                  </span>
                  <p className="text-slate-400 text-sm">No critical alerts</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-osi-dark rounded-lg shadow-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">
                    history
                  </span>
                  Recent Activity
                </h3>
              </div>
              <div className="p-5">
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-slate-600 text-5xl mb-3">
                    history_toggle_off
                  </span>
                  <p className="text-slate-400 text-sm">No recent activity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
