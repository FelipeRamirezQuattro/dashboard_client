import React, { useState } from "react";
import {
  useAllApps,
  useCreateApp,
  useUpdateApp,
  useDeleteApp,
} from "../../hooks/useApps";
import {
  CreateAppData,
  AppCategory,
  categoryLabels,
} from "../../types/app.types";
import { Shield, CheckCircle2, XCircle, Trash2, Lock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import { TableRowSkeleton } from "../../components/SkeletonLoader";
import ConfirmationModal from "../../components/ConfirmationModal";
import { exportRowsToCsv } from "../../utils/csvExport";

const AppManagement: React.FC = () => {
  const { data: apps, isLoading, error } = useAllApps();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | AppCategory>(
    "all",
  );
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: businessUnits } = useQuery({
    queryKey: ["businessUnits", "active"],
    queryFn: businessUnitService.getActiveBusinessUnits,
  });

  const { data: allDepartments } = useQuery({
    queryKey: ["departments", "active"],
    queryFn: departmentService.getActiveDepartments,
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState<CreateAppData>({
    name: "",
    description: "",
    url: "",
    chatbotApiUrl: "",
    ssoEndpoint: "",
    iconUrl: "",
    category: "other",
    requiredRole: "viewer",
    businessUnitId: "",
    departmentId: "",
    isActive: true,
    comingSoon: false,
  });

  // Filter departments based on selected business unit in the form
  const availableDepartments =
    allDepartments?.filter((dept: Department) =>
      typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
        ? dept.businessUnitId._id === formData.businessUnitId
        : dept.businessUnitId === formData.businessUnitId,
    ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createApp.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        description: "",
        url: "",
        chatbotApiUrl: "",
        ssoEndpoint: "",
        iconUrl: "",
        category: "other",
        requiredRole: "viewer",
        businessUnitId: "",
        departmentId: "",
        isActive: true,
        comingSoon: false,
      });
    } catch (error) {
      console.error("Failed to create app:", error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApp.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete app:", error);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateApp.mutateAsync({
        id,
        data: { isActive: !currentStatus },
      });
    } catch (error) {
      console.error("Failed to update app status:", error);
    }
  };

  const getBusinessUnitName = (app: NonNullable<typeof apps>[number]) =>
    typeof app.businessUnitId === "object" && app.businessUnitId !== null
      ? app.businessUnitId.name
      : "—";

  const getDepartmentName = (app: NonNullable<typeof apps>[number]) =>
    typeof app.departmentId === "object" && app.departmentId !== null
      ? app.departmentId.name
      : "—";

  const filteredApps =
    apps?.filter((app) => {
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        getBusinessUnitName(app).toLowerCase().includes(query) ||
        getDepartmentName(app).toLowerCase().includes(query);
      const matchesCategory =
        categoryFilter === "all" || app.category === categoryFilter;
      const matchesRole = roleFilter === "all" || app.requiredRole === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && app.isActive) ||
        (statusFilter === "inactive" && !app.isActive);
      return matchesSearch && matchesCategory && matchesRole && matchesStatus;
    }) || [];

  const handleExport = () => {
    exportRowsToCsv(
      "applications.csv",
      [
        "Name",
        "Description",
        "Business Unit",
        "Department",
        "Category",
        "Required Role",
        "SSO",
        "Status",
        "Coming Soon",
      ],
      filteredApps.map((app) => [
        app.name,
        app.description,
        getBusinessUnitName(app),
        getDepartmentName(app),
        categoryLabels[app.category],
        app.requiredRole,
        app.ssoEndpoint ? "Enabled" : "Disabled",
        app.isActive ? "Active" : "Inactive",
        app.comingSoon ? "Yes" : "No",
      ]),
    );
  };

  return (
    <div className="rounded-b-lg bg-gray-50 border border-gray-200">
      {/* App Management Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-amber-500 text-xl sm:text-2xl"
            aria-hidden="true"
          >
            apps
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            App Management
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <button
            onClick={() => setShowFilters((value) => !value)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 touch-manipulation whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              tune
            </span>
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 touch-manipulation whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              download
            </span>
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-osi-primary text-gray-900 rounded-lg hover:bg-osi-primary-dark transition-colors text-sm font-medium touch-manipulation active:scale-95 whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              add
            </span>
            <span className="hidden sm:inline">Add Application</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 py-4 border-b border-gray-200">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input-field"
            placeholder="Search applications..."
          />
          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value as "all" | AppCategory)
            }
            className="input-field"
          >
            <option value="all">All Categories</option>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="input-field"
          >
            <option value="all">All Roles</option>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "all" | "active" | "inactive")
            }
            className="input-field"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      )}

      {/* Apps Table */}
      {isLoading ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Business Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Required Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    SSO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/[0.08]">
                {[...Array(6)].map((_, i) => (
                  <TableRowSkeleton key={i} columns={8} />
                ))}
              </tbody>
            </table>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-6">
          <p className="text-red-600">Failed to load applications</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Business Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Required Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    SSO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/[0.08]">
                {filteredApps.map((app) => (
                  <tr key={app._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {app.name}
                      </div>
                      <div className="text-sm text-gray-400 truncate max-w-md">
                        {app.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getBusinessUnitName(app)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getDepartmentName(app)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm capitalize">
                        {categoryLabels[app.category]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-600 capitalize">
                          {app.requiredRole}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {app.ssoEndpoint ? (
                        <div className="flex items-center gap-1.5 text-amber-600">
                          <Lock className="w-4 h-4" />
                          <span className="text-sm font-medium">Enabled</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(app._id, app.isActive)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            app.isActive
                              ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                              : "text-gray-500 bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          {app.isActive ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                        {app.comingSoon && (
                          <span className="px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 rounded-md">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() =>
                          setDeleteTarget({ id: app._id, name: app.name })
                        }
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setIsCreateModalOpen(false)}
          />

          {/* Dialog */}
          <div
            className="relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "white" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <h3 className="text-lg font-bold text-gray-900">
                Add New Application
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-lg text-gray-500">
                  close
                </span>
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Business Unit <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.businessUnitId}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        businessUnitId: e.target.value,
                        departmentId: "", // Reset department when BU changes
                      });
                    }}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                  >
                    <option value="">Select a business unit</option>
                    {businessUnits?.map((bu: BusinessUnit) => (
                      <option key={bu._id} value={bu._id}>
                        {bu.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Department <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white disabled:bg-gray-50 disabled:text-gray-400"
                    disabled={!formData.businessUnitId}
                  >
                    <option value="">
                      {formData.businessUnitId
                        ? "Select a department"
                        : "Select a business unit first"}
                    </option>
                    {availableDepartments.map((dept: Department) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    App Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    URL <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                    placeholder="https://app.example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Chatbot API Base URL{" "}
                    <span className="text-gray-400 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.chatbotApiUrl || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        chatbotApiUrl: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                    placeholder="https://api.osidesigner.com/api-chemtracker"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Used by dashboard chatbot routing. If empty, app URL is
                    used.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    SSO Endpoint{" "}
                    <span className="text-gray-400 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.ssoEndpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, ssoEndpoint: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                    placeholder="api://app-id/.default"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Icon URL{" "}
                    <span className="text-gray-400 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={formData.iconUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, iconUrl: e.target.value })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Category <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          category: e.target.value as AppCategory,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                    >
                      <option value="gas">Gas Separation</option>
                      <option value="chemical">Chemical Treatment</option>
                      <option value="sand">Sand Control</option>
                      <option value="pumps">Pumps Tracker</option>
                      <option value="admin">Admin Tools</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Required Role <span className="text-red-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.requiredRole}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredRole: e.target.value as any,
                        })
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded border-gray-300 text-osi-primary focus:ring-osi-primary"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-600">
                    Active
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="comingSoon"
                    checked={formData.comingSoon}
                    onChange={(e) =>
                      setFormData({ ...formData, comingSoon: e.target.checked })
                    }
                    className="rounded border-gray-300 text-osi-primary focus:ring-osi-primary"
                  />
                  <label htmlFor="comingSoon" className="text-sm text-gray-600">
                    Coming Soon (Disables Launch Button)
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black transition-all active:scale-95 touch-manipulation disabled:opacity-60"
                    style={{
                      background:
                        "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                    }}
                    disabled={createApp.isPending}
                  >
                    {createApp.isPending ? "Creating..." : "Create Application"}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Application"
        message={`Delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isPending={deleteApp.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AppManagement;
