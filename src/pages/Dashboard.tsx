import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useBusinessUnits } from "../hooks/useBusinessUnits";
import { BusinessUnitCardSkeleton } from "../components/SkeletonLoader";
import { useCountUp } from "../hooks/useCountUp";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: businessUnits, isLoading, error } = useBusinessUnits();
  const navigate = useNavigate();

  const totalCount = useCountUp(businessUnits?.length ?? 0);
  const activeCount = useCountUp(businessUnits?.length ?? 0);

  return (
    <div className="min-h-full" style={{ background: "#f8fafc" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Welcome Banner */}
            <div
              className="rounded-xl p-6 sm:p-8 relative overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(251,173,55,0.18) 0%, rgba(251,173,55,0.06) 100%)",
                border: "1px solid rgba(251,173,55,0.25)",
              }}
            >
              <div
                className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle, rgba(251,173,55,0.12) 0%, transparent 70%)",
                  transform: "translate(30%, -30%)",
                }}
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 relative z-10">
                Welcome back,{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(90deg, #fbad37 0%, #ffd280 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {user?.firstName}
                </span>
                !
              </h1>
              <p className="text-gray-500 text-base sm:text-lg relative z-10">
                Monitor and manage your industrial separator operations
              </p>
            </div>

            {/* System Status Cards */}
            {/* <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div
                className="rounded-lg p-4 sm:p-5"
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">
                    Total Units
                  </span>
                  <span
                    className="material-symbols-outlined text-blue-400 text-xl sm:text-2xl"
                    aria-hidden="true"
                  >
                    factory
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {totalCount}
                </div>
              </div>

              <div
                className="rounded-lg p-4 sm:p-5"
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">
                    Active Units
                  </span>
                  <span
                    className="material-symbols-outlined text-emerald-400 text-xl sm:text-2xl"
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {activeCount}
                </div>
                <div className="text-[10px] sm:text-xs text-emerald-400 mt-1">
                  All Systems Operational
                </div>
              </div>

              <div
                className="rounded-lg p-4 sm:p-5 col-span-2 sm:col-span-1"
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-400">
                    System Health
                  </span>
                  <span
                    className="material-symbols-outlined text-emerald-400 text-xl sm:text-2xl"
                    aria-hidden="true"
                  >
                    health_and_safety
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-400">
                  98.5%
                </div>
                <div className="text-[10px] sm:text-xs text-emerald-400 mt-1">
                  +2.3% from last week
                </div>
              </div>
            </div> */}

            {/* Business Units Section */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid #e5e7eb" }}
              >
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
                  <div
                    className="rounded-lg p-4 sm:p-6 text-center"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <p className="text-red-300 text-sm sm:text-base">
                      Failed to load business units. Please try again.
                    </p>
                  </div>
                ) : !businessUnits || businessUnits.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
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
                          className="rounded-lg overflow-hidden transition-all duration-200 hover:scale-[1.02] cursor-pointer group"
                          style={{
                            background: "#f9fafb",
                            border: "1px solid #e5e7eb",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLDivElement).style.border =
                              "1px solid rgba(251,173,55,0.3)";
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.boxShadow =
                              "0 0 20px rgba(251,173,55,0.08)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLDivElement).style.border =
                              "1px solid #e5e7eb";
                            (
                              e.currentTarget as HTMLDivElement
                            ).style.boxShadow = "none";
                          }}
                        >
                          {/* Image Section */}
                          <div
                            className="h-28 sm:h-32 flex items-center justify-center overflow-hidden relative"
                            style={{
                              background: "#f9fafb",
                            }}
                          >
                            <img
                              src={
                                bu.logoUrl ||
                                "https://via.placeholder.com/400x200/0d0d1a/444?text=Business+Unit"
                              }
                              alt={`${bu.name} logo`}
                              width="400"
                              height="200"
                              loading="lazy"
                              className="w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src =
                                  "https://via.placeholder.com/400x200/0d0d1a/444?text=Business+Unit";
                              }}
                            />
                          </div>

                          {/* Content Section */}
                          <div className="p-3 sm:p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-bold text-base sm:text-lg text-gray-900 line-clamp-2">
                                {bu.name}
                              </h3>
                              <span
                                className="px-2 py-0.5 text-[10px] sm:text-xs rounded-full font-medium flex-shrink-0 ml-2 text-emerald-400"
                                style={{ background: "rgba(52,211,153,0.12)" }}
                              >
                                Active
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-gray-400 mb-3 line-clamp-2">
                              {bu.description}
                            </p>

                            <button
                              onClick={() =>
                                navigate(`/business-unit/${bu._id}`)
                              }
                              className="w-full font-medium py-2 rounded-lg transition-all touch-manipulation text-black text-sm font-bold"
                              style={{
                                background:
                                  "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                              }}
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
            <div
              className="rounded-lg p-6"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Performance Overview
              </h3>
              <div
                className="h-64 flex items-center justify-center rounded-lg"
                style={{ background: "#f9fafb" }}
              >
                <div className="text-center">
                  <span
                    className="material-symbols-outlined text-gray-300 text-6xl mb-2"
                    aria-hidden="true"
                  >
                    show_chart
                  </span>
                  <p className="text-gray-400 text-sm">
                    Performance metrics visualization
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Critical Alerts */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                className="px-5 py-4 flex items-center gap-2"
                style={{ borderBottom: "1px solid #e5e7eb" }}
              >
                <span
                  className="material-symbols-outlined text-red-400 text-lg"
                  aria-hidden="true"
                >
                  warning
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  Critical Alerts
                </h3>
              </div>
              <div className="p-5">
                <div className="text-center py-8">
                  <span
                    className="material-symbols-outlined text-gray-300 text-5xl mb-3"
                    aria-hidden="true"
                  >
                    notifications_off
                  </span>
                  <p className="text-gray-400 text-sm">No critical alerts</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
              }}
            >
              <div
                className="px-5 py-4 flex items-center gap-2"
                style={{ borderBottom: "1px solid #e5e7eb" }}
              >
                <span
                  className="material-symbols-outlined text-blue-400 text-lg"
                  aria-hidden="true"
                >
                  history
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  Recent Activity
                </h3>
              </div>
              <div className="p-5">
                <div className="text-center py-8">
                  <span
                    className="material-symbols-outlined text-gray-300 text-5xl mb-3"
                    aria-hidden="true"
                  >
                    history_toggle_off
                  </span>
                  <p className="text-gray-400 text-sm">No recent activity</p>
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
