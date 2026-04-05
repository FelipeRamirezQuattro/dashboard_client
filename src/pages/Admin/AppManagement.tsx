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

const AppManagement: React.FC = () => {
  const { data: apps, isLoading, error } = useAllApps();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();

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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteApp.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete app:", error);
      }
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-osi-dark">
          App Management
        </h2>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="btn-primary touch-manipulation active:scale-95 w-full sm:w-auto"
        >
          + Add Application
        </button>
      </div>

      {/* Apps Table */}
      {isLoading ? (
        <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
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
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load applications</p>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
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
                {apps?.map((app) => (
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
                        {typeof app.businessUnitId === "object" &&
                        app.businessUnitId !== null
                          ? app.businessUnitId.name
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {typeof app.departmentId === "object" &&
                        app.departmentId !== null
                          ? app.departmentId.name
                          : "—"}
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
                        onClick={() => handleDelete(app._id, app.name)}
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
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-transparent rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-osi-dark mb-6">
                Add New Application
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Business Unit *
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
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={formData.departmentId}
                    onChange={(e) =>
                      setFormData({ ...formData, departmentId: e.target.value })
                    }
                    className="input-field"
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
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    App Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    className="input-field"
                    placeholder="https://app.example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Chatbot API Base URL (Optional)
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
                    className="input-field"
                    placeholder="https://api.osidesigner.com/api-chemtracker"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    Used by dashboard chatbot routing. If empty, app URL is
                    used.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    SSO Endpoint (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.ssoEndpoint}
                    onChange={(e) =>
                      setFormData({ ...formData, ssoEndpoint: e.target.value })
                    }
                    className="input-field"
                    placeholder="api://app-id/.default"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Icon URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formData.iconUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, iconUrl: e.target.value })
                    }
                    className="input-field"
                    placeholder="https://example.com/icon.png"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Category *
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
                      className="input-field"
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
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Required Role *
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
                      className="input-field"
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createApp.isPending}
                  >
                    {createApp.isPending ? "Creating..." : "Create Application"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppManagement;
