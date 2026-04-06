import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useAdminNotifications,
  useCreateNotification,
  useDeleteNotification,
} from "../../hooks/useNotifications";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import {
  CreateNotificationPayload,
  INotification,
  NotificationScope,
  NotificationSeverity,
  NotificationType,
} from "../../types/notification.types";

const typeOptions: { value: NotificationType; label: string }[] = [
  { value: "app_released", label: "App Released" },
  { value: "app_stopped", label: "App Stopped" },
  { value: "app_updated", label: "App Updated" },
  { value: "maintenance", label: "Maintenance" },
  { value: "announcement", label: "Announcement" },
  { value: "custom", label: "Custom" },
];

const severityOptions: {
  value: NotificationSeverity;
  label: string;
  color: string;
}[] = [
  { value: "info", label: "Info", color: "text-blue-600" },
  { value: "success", label: "Success", color: "text-emerald-600" },
  { value: "warning", label: "Warning", color: "text-amber-600" },
  { value: "error", label: "Error", color: "text-red-600" },
];

const severityBadge: Record<NotificationSeverity, string> = {
  info: "bg-blue-50 text-blue-600",
  success: "bg-emerald-50 text-emerald-600",
  warning: "bg-amber-50 text-amber-600",
  error: "bg-red-50 text-red-600",
};

const scopeLabels: Record<NotificationScope, string> = {
  all: "All Users",
  businessUnit: "Business Unit",
  department: "Department",
};

const defaultForm: CreateNotificationPayload = {
  type: "announcement",
  title: "",
  message: "",
  severity: "info",
  targetScope: "all",
  targetId: "",
  relatedAppId: "",
  expiresAt: "",
};

const NotificationManagement: React.FC = () => {
  const {
    data: notifications = [],
    isLoading,
    error,
  } = useAdminNotifications();
  const createNotification = useCreateNotification();
  const deleteNotification = useDeleteNotification();

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits", "active"],
    queryFn: businessUnitService.getActiveBusinessUnits,
  });

  const { data: allDepartments = [] } = useQuery({
    queryKey: ["departments", "active"],
    queryFn: departmentService.getActiveDepartments,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] =
    useState<CreateNotificationPayload>(defaultForm);

  const filteredDepartments = allDepartments.filter((dept: Department) => {
    if (!formData.targetId) return false;
    const buId =
      typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
        ? dept.businessUnitId._id
        : dept.businessUnitId;
    return buId === formData.targetId;
  });

  const handleScopeChange = (scope: NotificationScope) => {
    setFormData((prev) => ({ ...prev, targetScope: scope, targetId: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: CreateNotificationPayload = {
        ...formData,
        targetId:
          formData.targetScope !== "all" ? formData.targetId : undefined,
        relatedAppId: formData.relatedAppId || undefined,
        expiresAt: formData.expiresAt || undefined,
      };
      await createNotification.mutateAsync(payload);
      setIsModalOpen(false);
      setFormData(defaultForm);
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Deactivate notification "${title}"?`)) {
      try {
        await deleteNotification.mutateAsync(id);
      } catch (err) {
        console.error("Failed to deactivate notification:", err);
      }
    }
  };

  const getCreatedByName = (n: INotification) => {
    if (!n.createdBy) return "—";
    if (typeof n.createdBy === "object") {
      return `${n.createdBy.firstName} ${n.createdBy.lastName}`;
    }
    return "—";
  };

  return (
    <div className="space-y-6 mt-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Notification Management
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="font-medium px-5 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 w-full sm:w-auto text-black touch-manipulation"
          style={{
            background: "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
            boxShadow: "0 0 16px rgba(251,173,55,0.25)",
          }}
        >
          <span
            className="material-symbols-outlined text-xl"
            aria-hidden="true"
          >
            add_alert
          </span>
          Create Notification
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-8 text-center">
          <div
            className="w-8 h-8 rounded-full animate-spin mx-auto"
            style={{
              border: "2px solid rgba(251,173,55,0.2)",
              borderTopColor: "#fbad37",
            }}
          />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load notifications</p>
        </div>
      ) : notifications.length === 0 ? (
        <div
          className="rounded-lg p-12 text-center"
          style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
        >
          <span
            className="material-symbols-outlined text-5xl text-gray-300 mb-3"
            aria-hidden="true"
          >
            notifications_none
          </span>
          <p className="text-gray-400">No notifications created yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead
                style={{
                  background: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <tr>
                  {[
                    "Title",
                    "Type",
                    "Severity",
                    "Scope",
                    "Status",
                    "Created By",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {notifications.map((n) => (
                  <tr
                    key={n._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-4 max-w-xs">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {n.message}
                      </p>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {typeOptions.find((t) => t.value === n.type)?.label ??
                          n.type}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${severityBadge[n.severity]}`}
                      >
                        {n.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {scopeLabels[n.targetScope]}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {n.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400">
                          <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getCreatedByName(n)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {n.isActive && (
                        <button
                          onClick={() => handleDelete(n._id, n.title)}
                          disabled={deleteNotification.isPending}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium touch-manipulation"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setIsModalOpen(false)}
          />

          {/* Dialog */}
          <div
            className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            style={{ background: "white" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <h3 className="text-lg font-bold text-gray-900">
                Create Notification
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. ChemTracker v2.4 is now live"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  maxLength={1000}
                  rows={3}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, message: e.target.value }))
                  }
                  placeholder="Describe the notification detail…"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors resize-none"
                />
              </div>

              {/* Type + Severity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        type: e.target.value as NotificationType,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                  >
                    {typeOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        severity: e.target.value as NotificationSeverity,
                      }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                  >
                    {severityOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Scope */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Target Audience
                </label>
                <div className="flex gap-2">
                  {(
                    ["all", "businessUnit", "department"] as NotificationScope[]
                  ).map((scope) => (
                    <button
                      key={scope}
                      type="button"
                      onClick={() => handleScopeChange(scope)}
                      className="flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all touch-manipulation"
                      style={
                        formData.targetScope === scope
                          ? {
                              background: "rgba(251,173,55,0.12)",
                              borderColor: "#fbad37",
                              color: "#92650a",
                            }
                          : {
                              background: "white",
                              borderColor: "#e5e7eb",
                              color: "#6b7280",
                            }
                      }
                    >
                      {scopeLabels[scope]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Business Unit selector */}
              {formData.targetScope === "businessUnit" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Business Unit <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.targetId}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, targetId: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                  >
                    <option value="">Select business unit…</option>
                    {businessUnits.map((bu: BusinessUnit) => (
                      <option key={bu._id} value={bu._id}>
                        {bu.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department selector */}
              {formData.targetScope === "department" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Filter by Business Unit
                    </label>
                    <select
                      value={formData.targetId ? "" : ""}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, targetId: e.target.value }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                    >
                      <option value="">Select business unit to filter…</option>
                      {businessUnits.map((bu: BusinessUnit) => (
                        <option key={bu._id} value={bu._id}>
                          {bu.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {formData.targetId && filteredDepartments.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Department <span className="text-red-400">*</span>
                      </label>
                      <select
                        required
                        value={
                          filteredDepartments.some(
                            (d: Department) => d._id === formData.targetId,
                          )
                            ? formData.targetId
                            : ""
                        }
                        onChange={(e) =>
                          setFormData((p) => ({
                            ...p,
                            targetId: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                      >
                        <option value="">Select department…</option>
                        {filteredDepartments.map((dept: Department) => (
                          <option key={dept._id} value={dept._id}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              {/* Expires At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Expires At{" "}
                  <span className="text-gray-400 font-normal normal-case">
                    (optional)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, expiresAt: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createNotification.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black transition-all active:scale-95 touch-manipulation disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                  }}
                >
                  {createNotification.isPending
                    ? "Sending…"
                    : "Send Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationManagement;
