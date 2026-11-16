import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  Field,
  Fieldset,
  FormDialog,
  Input,
  Radio,
  Select,
  Textarea,
  useDataTable,
  type ActiveFilter,
  type DataTableColumn,
} from "@odessa-separator/ui";
import { Bell, BellOff, BellPlus, Download } from "lucide-react";
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
import ConfirmationModal from "../../components/ConfirmationModal";
import { exportRowsToCsv } from "../../utils/csvExport";

type SeverityFilter = "all" | NotificationSeverity;
type ScopeFilter = "all" | NotificationScope;
type StatusFilter = "all" | "active" | "inactive";

// Stable defaults: a new array per render would change the query data identity every render.
const NO_NOTIFICATIONS: INotification[] = [];
const NO_BUSINESS_UNITS: BusinessUnit[] = [];
const NO_DEPARTMENTS: Department[] = [];

const typeOptions: { value: NotificationType; label: string }[] = [
  { value: "app_released", label: "App Released" },
  { value: "app_stopped", label: "App Stopped" },
  { value: "app_updated", label: "App Updated" },
  { value: "maintenance", label: "Maintenance" },
  { value: "announcement", label: "Announcement" },
  { value: "custom", label: "Custom" },
];

const severityOptions: { value: NotificationSeverity; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
];

// Severity badge tone (was blue / emerald / amber / red).
const severityBadge: Record<
  NotificationSeverity,
  "info" | "success" | "warning" | "danger"
> = {
  info: "info",
  success: "success",
  warning: "warning",
  error: "danger",
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

const getTypeLabel = (n: INotification) =>
  typeOptions.find((t) => t.value === n.type)?.label ?? n.type;

const getCreatedByName = (n: INotification) => {
  if (!n.createdBy) return "—";
  if (typeof n.createdBy === "object") {
    return `${n.createdBy.firstName} ${n.createdBy.lastName}`;
  }
  return "—";
};

const getDepartmentBusinessUnitId = (dept: Department) =>
  typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
    ? dept.businessUnitId._id
    : dept.businessUnitId;

const NotificationManagement: React.FC = () => {
  const { data: notifications = NO_NOTIFICATIONS, isLoading, error } =
    useAdminNotifications();
  const createNotification = useCreateNotification();
  const deleteNotification = useDeleteNotification();

  const { data: businessUnits = NO_BUSINESS_UNITS } = useQuery({
    queryKey: ["businessUnits", "active"],
    queryFn: businessUnitService.getActiveBusinessUnits,
  });

  const { data: allDepartments = NO_DEPARTMENTS } = useQuery({
    queryKey: ["departments", "active"],
    queryFn: departmentService.getActiveDepartments,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Kept after the dialog closes so the message never reads "undefined" while it animates out.
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [formData, setFormData] =
    useState<CreateNotificationPayload>(defaultForm);
  // Business unit used only to narrow the department list (department scope). It is not sent.
  const [departmentFilterBuId, setDepartmentFilterBuId] = useState("");
  // As before, a cancelled draft is kept for the next open; after a successful send the form is
  // cleared when the dialog next opens, so the fields do not empty while it animates closed.
  const [resetOnOpen, setResetOnOpen] = useState(false);

  const filteredDepartments = allDepartments.filter((dept: Department) => {
    if (!departmentFilterBuId) return false;
    return getDepartmentBusinessUnitId(dept) === departmentFilterBuId;
  });

  const handleScopeChange = (scope: NotificationScope) => {
    setFormData((prev) => ({ ...prev, targetScope: scope, targetId: "" }));
    setDepartmentFilterBuId("");
  };

  const openModal = () => {
    if (resetOnOpen) {
      setFormData(defaultForm);
      setDepartmentFilterBuId("");
      setResetOnOpen(false);
    }
    setIsModalOpen(true);
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
      setResetOnOpen(true);
    } catch (err) {
      console.error("Failed to create notification:", err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteNotification.mutateAsync(deleteTarget.id);
      setDeleteOpen(false);
    } catch (err) {
      console.error("Failed to deactivate notification:", err);
    }
  };

  // One predicate for the table and the CSV export: search (title, message, type label) +
  // severity, scope and status filters.
  const matches = (notification: INotification) => {
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      notification.title.toLowerCase().includes(query) ||
      notification.message.toLowerCase().includes(query) ||
      (typeOptions.find((t) => t.value === notification.type)?.label ?? "")
        .toLowerCase()
        .includes(query);
    const matchesSeverity =
      severityFilter === "all" || notification.severity === severityFilter;
    const matchesScope =
      scopeFilter === "all" || notification.targetScope === scopeFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && notification.isActive) ||
      (statusFilter === "inactive" && !notification.isActive);
    return matchesSearch && matchesSeverity && matchesScope && matchesStatus;
  };

  // The initial sort key has no sorter: the API order is kept until a column header is clicked.
  const table = useDataTable<INotification>(notifications, {
    filter: matches,
    sorters: {
      title: (a, b) => a.title.localeCompare(b.title),
      type: (a, b) => getTypeLabel(a).localeCompare(getTypeLabel(b)),
      severity: (a, b) => a.severity.localeCompare(b.severity),
      scope: (a, b) =>
        scopeLabels[a.targetScope].localeCompare(scopeLabels[b.targetScope]),
      status: (a, b) => Number(b.isActive) - Number(a.isActive),
      createdBy: (a, b) =>
        getCreatedByName(a).localeCompare(getCreatedByName(b)),
      date: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    initialSort: { key: "default", direction: "ascending" },
    pageSize: 10,
  });

  const changeSearch = (value: string) => {
    setSearchTerm(value);
    table.resetPage();
  };
  const changeSeverityFilter = (value: SeverityFilter) => {
    setSeverityFilter(value);
    table.resetPage();
  };
  const changeScopeFilter = (value: ScopeFilter) => {
    setScopeFilter(value);
    table.resetPage();
  };
  const changeStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    table.resetPage();
  };
  const clearFilters = () => {
    setSeverityFilter("all");
    setScopeFilter("all");
    setStatusFilter("all");
    table.resetPage();
  };

  const activeFilters: ActiveFilter[] = [];
  if (severityFilter !== "all") {
    activeFilters.push({
      key: "severity",
      label: `Severity: ${severityOptions.find((s) => s.value === severityFilter)?.label ?? severityFilter}`,
      onClear: () => changeSeverityFilter("all"),
    });
  }
  if (scopeFilter !== "all") {
    activeFilters.push({
      key: "scope",
      label: `Scope: ${scopeLabels[scopeFilter]}`,
      onClear: () => changeScopeFilter("all"),
    });
  }
  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
      onClear: () => changeStatusFilter("all"),
    });
  }

  const filteredNotifications = notifications.filter(matches);

  const handleExport = () => {
    exportRowsToCsv(
      "notifications.csv",
      ["Title", "Message", "Type", "Severity", "Scope", "Status", "Created By", "Date"],
      filteredNotifications.map((notification) => [
        notification.title,
        notification.message,
        typeOptions.find((t) => t.value === notification.type)?.label ??
          notification.type,
        notification.severity,
        scopeLabels[notification.targetScope],
        notification.isActive ? "Active" : "Inactive",
        getCreatedByName(notification),
        new Date(notification.createdAt).toLocaleDateString(),
      ]),
    );
  };

  const columns: DataTableColumn<INotification>[] = [
    {
      key: "title",
      header: "Title",
      sortable: true,
      className: "max-w-xs",
      cell: (n) => (
        <span className="flex max-w-xs flex-col">
          <span className="truncate font-semibold text-text">{n.title}</span>
          <span className="truncate text-xs text-text-muted">{n.message}</span>
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      cell: (n) => (
        <span className="whitespace-nowrap text-text-muted">
          {getTypeLabel(n)}
        </span>
      ),
    },
    {
      key: "severity",
      header: "Severity",
      sortable: true,
      cell: (n) => <Badge variant={severityBadge[n.severity]}>{n.severity}</Badge>,
    },
    {
      key: "scope",
      header: "Scope",
      sortable: true,
      cell: (n) => (
        <span className="whitespace-nowrap text-text-muted">
          {scopeLabels[n.targetScope]}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (n) => (
        <Badge variant={n.isActive ? "success" : "neutral"}>
          {n.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      sortable: true,
      cell: (n) => (
        <span className="whitespace-nowrap text-text-muted">
          {getCreatedByName(n)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      cell: (n) => (
        <span className="whitespace-nowrap text-text-muted">
          {new Date(n.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (n) =>
        n.isActive ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Deactivate ${n.title}`}
            disabled={deleteNotification.isPending}
            onClick={() => {
              setDeleteTarget({ id: n._id, title: n.title });
              setDeleteOpen(true);
            }}
          >
            Deactivate
          </Button>
        ) : null,
    },
  ];

  const hasNotifications = notifications.length > 0;

  return (
    <section
      aria-labelledby="notifications-heading"
      className="flex flex-col gap-4 py-6"
    >
      <h2
        id="notifications-heading"
        className="flex items-center gap-2 text-xl font-semibold text-text"
      >
        <Bell className="size-6 text-text-muted" aria-hidden="true" />
        Notification Management
      </h2>

      <DataTableToolbar
        searchLabel="Search notifications"
        searchPlaceholder="Search notifications..."
        search={searchTerm}
        onSearchChange={changeSearch}
        resultCount={table.total}
        filters={
          <div className="flex flex-col gap-4">
            <Field label="Severity">
              {(control) => (
                <Select
                  {...control}
                  value={severityFilter}
                  onChange={(event) =>
                    changeSeverityFilter(event.target.value as SeverityFilter)
                  }
                >
                  <option value="all">All Severities</option>
                  {severityOptions.map((severity) => (
                    <option key={severity.value} value={severity.value}>
                      {severity.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Scope">
              {(control) => (
                <Select
                  {...control}
                  value={scopeFilter}
                  onChange={(event) =>
                    changeScopeFilter(event.target.value as ScopeFilter)
                  }
                >
                  <option value="all">All Scopes</option>
                  {Object.entries(scopeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Status">
              {(control) => (
                <Select
                  {...control}
                  value={statusFilter}
                  onChange={(event) =>
                    changeStatusFilter(event.target.value as StatusFilter)
                  }
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              )}
            </Field>
          </div>
        }
        activeFilters={activeFilters}
        onClearFilters={clearFilters}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button onClick={openModal}>
              <BellPlus className="size-4" aria-hidden="true" />
              Create Notification
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="danger">Failed to load notifications</Alert>
      ) : (
        <DataTable
          caption="Notifications"
          columns={columns}
          rows={table.rows}
          getRowKey={(n) => n._id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          page={table.page}
          pageCount={table.pageCount}
          onPageChange={table.setPage}
          loading={isLoading}
          loadingLabel="Loading notifications"
          empty={{
            title: hasNotifications
              ? "No notifications match your search or filters"
              : "No notifications created yet",
            icon: <BellOff className="size-10" aria-hidden="true" />,
          }}
        />
      )}

      <FormDialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsModalOpen(false);
        }}
        title="Create Notification"
        description="Send a notification to all users, a business unit or a department."
        submitLabel={createNotification.isPending ? "Sending…" : "Send Notification"}
        busy={createNotification.isPending}
        onSubmit={handleSubmit}
      >
        <Field label="Title" required>
          {(control) => (
            <Input
              {...control}
              type="text"
              required
              maxLength={200}
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="e.g. ChemTracker v2.4 is now live"
            />
          )}
        </Field>

        <Field label="Message" required>
          {(control) => (
            <Textarea
              {...control}
              required
              maxLength={1000}
              rows={3}
              className="resize-none"
              value={formData.message}
              onChange={(e) =>
                setFormData((p) => ({ ...p, message: e.target.value }))
              }
              placeholder="Describe the notification detail…"
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Type">
            {(control) => (
              <Select
                {...control}
                value={formData.type}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    type: e.target.value as NotificationType,
                  }))
                }
              >
                {typeOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Severity">
            {(control) => (
              <Select
                {...control}
                value={formData.severity}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    severity: e.target.value as NotificationSeverity,
                  }))
                }
              >
                {severityOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <Fieldset legend="Target Audience">
          <div className="flex flex-wrap gap-4">
            {(["all", "businessUnit", "department"] as NotificationScope[]).map(
              (scope) => (
                <Radio
                  key={scope}
                  name="notification-target-scope"
                  value={scope}
                  label={scopeLabels[scope]}
                  checked={formData.targetScope === scope}
                  onChange={() => handleScopeChange(scope)}
                />
              ),
            )}
          </div>
        </Fieldset>

        {formData.targetScope === "businessUnit" && (
          <Field label="Business Unit" required>
            {(control) => (
              <Select
                {...control}
                required
                value={formData.targetId}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, targetId: e.target.value }))
                }
              >
                <option value="">Select business unit…</option>
                {businessUnits.map((bu: BusinessUnit) => (
                  <option key={bu._id} value={bu._id}>
                    {bu.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}

        {formData.targetScope === "department" && (
          <>
            <Field label="Filter by Business Unit">
              {(control) => (
                <Select
                  {...control}
                  value={departmentFilterBuId}
                  onChange={(e) => {
                    setDepartmentFilterBuId(e.target.value);
                    setFormData((p) => ({ ...p, targetId: "" }));
                  }}
                >
                  <option value="">Select business unit to filter…</option>
                  {businessUnits.map((bu: BusinessUnit) => (
                    <option key={bu._id} value={bu._id}>
                      {bu.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            {departmentFilterBuId && filteredDepartments.length > 0 && (
              <Field label="Department" required>
                {(control) => (
                  <Select
                    {...control}
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
                  >
                    <option value="">Select department…</option>
                    {filteredDepartments.map((dept: Department) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            )}
          </>
        )}

        <Field label="Expires At (optional)">
          {(control) => (
            <Input
              {...control}
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) =>
                setFormData((p) => ({ ...p, expiresAt: e.target.value }))
              }
            />
          )}
        </Field>
      </FormDialog>

      <ConfirmationModal
        isOpen={deleteOpen}
        title="Deactivate Notification"
        message={`Deactivate "${deleteTarget?.title ?? ""}"? It will no longer appear as an active notification.`}
        confirmLabel="Deactivate"
        isPending={deleteNotification.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};

export default NotificationManagement;
