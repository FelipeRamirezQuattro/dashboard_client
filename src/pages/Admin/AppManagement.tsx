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
  IExternalApp,
  RequiredRole,
  categoryLabels,
} from "../../types/app.types";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  DataTable,
  DataTableToolbar,
  Field,
  FormDialog,
  Input,
  Select,
  Textarea,
  useDataTable,
  type ActiveFilter,
  type DataTableColumn,
} from "@odessa-separator/ui";
import {
  CheckCircle2,
  Download,
  LayoutGrid,
  Lock,
  Plus,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import ConfirmationModal from "../../components/ConfirmationModal";
import { exportRowsToCsv } from "../../utils/csvExport";

type CategoryFilter = "all" | AppCategory;
type RoleFilter = "all" | RequiredRole;
type StatusFilter = "all" | "active" | "inactive";

const NO_APPS: IExternalApp[] = [];

const emptyForm: CreateAppData = {
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
};

const roleLabels: Record<RequiredRole, string> = {
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
  superadmin: "Superadmin",
};

const getBusinessUnitName = (app: IExternalApp) =>
  typeof app.businessUnitId === "object" && app.businessUnitId !== null
    ? app.businessUnitId.name
    : "—";

const getDepartmentName = (app: IExternalApp) =>
  typeof app.departmentId === "object" && app.departmentId !== null
    ? app.departmentId.name
    : "—";

const AppManagement: React.FC = () => {
  const { data: apps, isLoading, error } = useAllApps();
  const createApp = useCreateApp();
  const updateApp = useUpdateApp();
  const deleteApp = useDeleteApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Kept after the dialog closes so the message never reads "undefined" while it animates out.
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
  const [formData, setFormData] = useState<CreateAppData>(emptyForm);
  // As before, a cancelled draft is kept for the next open; after a successful create the form is
  // cleared when the dialog next opens, so the fields do not empty while it animates closed.
  const [resetOnOpen, setResetOnOpen] = useState(false);

  // Filter departments based on selected business unit in the form
  const availableDepartments =
    allDepartments?.filter((dept: Department) =>
      typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
        ? dept.businessUnitId._id === formData.businessUnitId
        : dept.businessUnitId === formData.businessUnitId,
    ) || [];

  const openCreateModal = () => {
    if (resetOnOpen) {
      setFormData(emptyForm);
      setResetOnOpen(false);
    }
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createApp.mutateAsync(formData);
      setIsCreateModalOpen(false);
      setResetOnOpen(true);
    } catch (error) {
      console.error("Failed to create app:", error);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteApp.mutateAsync(deleteTarget.id);
      setDeleteOpen(false);
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

  // One predicate for the table and the CSV export: search (name, description, business unit,
  // department) + category, role and status filters.
  const matches = (app: IExternalApp) => {
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
  };

  // The initial sort key has no sorter: the API order is kept until a column header is clicked.
  const table = useDataTable<IExternalApp>(apps ?? NO_APPS, {
    filter: matches,
    sorters: {
      name: (a, b) => a.name.localeCompare(b.name),
      businessUnit: (a, b) =>
        getBusinessUnitName(a).localeCompare(getBusinessUnitName(b)),
      department: (a, b) =>
        getDepartmentName(a).localeCompare(getDepartmentName(b)),
      category: (a, b) =>
        categoryLabels[a.category].localeCompare(categoryLabels[b.category]),
      role: (a, b) => a.requiredRole.localeCompare(b.requiredRole),
      sso: (a, b) => Number(Boolean(b.ssoEndpoint)) - Number(Boolean(a.ssoEndpoint)),
      status: (a, b) => Number(b.isActive) - Number(a.isActive),
    },
    initialSort: { key: "default", direction: "ascending" },
    pageSize: 10,
  });

  const changeSearch = (value: string) => {
    setSearchTerm(value);
    table.resetPage();
  };
  const changeCategoryFilter = (value: CategoryFilter) => {
    setCategoryFilter(value);
    table.resetPage();
  };
  const changeRoleFilter = (value: RoleFilter) => {
    setRoleFilter(value);
    table.resetPage();
  };
  const changeStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    table.resetPage();
  };
  const clearFilters = () => {
    setCategoryFilter("all");
    setRoleFilter("all");
    setStatusFilter("all");
    table.resetPage();
  };

  const activeFilters: ActiveFilter[] = [];
  if (categoryFilter !== "all") {
    activeFilters.push({
      key: "category",
      label: `Category: ${categoryLabels[categoryFilter]}`,
      onClear: () => changeCategoryFilter("all"),
    });
  }
  if (roleFilter !== "all") {
    activeFilters.push({
      key: "role",
      label: `Role: ${roleLabels[roleFilter]}`,
      onClear: () => changeRoleFilter("all"),
    });
  }
  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
      onClear: () => changeStatusFilter("all"),
    });
  }

  const filteredApps = (apps ?? NO_APPS).filter(matches);

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

  const columns: DataTableColumn<IExternalApp>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (app) => (
        <span className="flex flex-col">
          <span className="font-semibold text-text">{app.name}</span>
          <span className="max-w-md truncate text-sm text-text-muted">
            {app.description}
          </span>
        </span>
      ),
    },
    {
      key: "businessUnit",
      header: "Business Unit",
      sortable: true,
      cell: (app) => (
        <span className="whitespace-nowrap text-text">
          {getBusinessUnitName(app)}
        </span>
      ),
    },
    {
      key: "department",
      header: "Department",
      sortable: true,
      cell: (app) => (
        <span className="whitespace-nowrap text-text">
          {getDepartmentName(app)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      cell: (app) => (
        <span className="whitespace-nowrap text-text">
          {categoryLabels[app.category]}
        </span>
      ),
    },
    {
      key: "role",
      header: "Required Role",
      sortable: true,
      cell: (app) => (
        <span className="flex items-center gap-2 whitespace-nowrap font-medium capitalize text-text-muted">
          <Shield className="size-4" aria-hidden="true" />
          {app.requiredRole}
        </span>
      ),
    },
    {
      key: "sso",
      header: "SSO",
      sortable: true,
      cell: (app) =>
        app.ssoEndpoint ? (
          <Badge variant="warning">
            <Lock className="size-3" aria-hidden="true" />
            Enabled
          </Badge>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (app) => (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <Button
            variant="ghost"
            size="sm"
            aria-label={`${app.isActive ? "Active" : "Inactive"}, toggle status of ${app.name}`}
            onClick={() => toggleActive(app._id, app.isActive)}
          >
            <Badge variant={app.isActive ? "success" : "neutral"}>
              {app.isActive ? (
                <CheckCircle2 className="size-3" aria-hidden="true" />
              ) : (
                <XCircle className="size-3" aria-hidden="true" />
              )}
              {app.isActive ? "Active" : "Inactive"}
            </Badge>
          </Button>
          {app.comingSoon && <Badge variant="warning">Coming Soon</Badge>}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (app) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Delete ${app.name}`}
          onClick={() => {
            setDeleteTarget({ id: app._id, name: app.name });
            setDeleteOpen(true);
          }}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Delete
        </Button>
      ),
    },
  ];

  return (
    <section aria-labelledby="apps-heading" className="flex flex-col gap-4 py-6">
      <h2
        id="apps-heading"
        className="flex items-center gap-2 text-xl font-semibold text-text"
      >
        <LayoutGrid className="size-6 text-text-muted" aria-hidden="true" />
        App Management
      </h2>

      <DataTableToolbar
        searchLabel="Search applications"
        searchPlaceholder="Search applications..."
        search={searchTerm}
        onSearchChange={changeSearch}
        resultCount={table.total}
        filters={
          <div className="flex flex-col gap-4">
            <Field label="Category">
              {(control) => (
                <Select
                  {...control}
                  value={categoryFilter}
                  onChange={(event) =>
                    changeCategoryFilter(event.target.value as CategoryFilter)
                  }
                >
                  <option value="all">All Categories</option>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Required Role">
              {(control) => (
                <Select
                  {...control}
                  value={roleFilter}
                  onChange={(event) =>
                    changeRoleFilter(event.target.value as RoleFilter)
                  }
                >
                  <option value="all">All Roles</option>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
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
            <Button onClick={openCreateModal}>
              <Plus className="size-4" aria-hidden="true" />
              Add Application
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="danger">Failed to load applications</Alert>
      ) : (
        <DataTable
          caption="Applications"
          columns={columns}
          rows={table.rows}
          getRowKey={(app) => app._id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          page={table.page}
          pageCount={table.pageCount}
          onPageChange={table.setPage}
          loading={isLoading}
          loadingLabel="Loading applications"
          empty={{ title: "No applications found" }}
        />
      )}

      <FormDialog
        open={isCreateModalOpen}
        onOpenChange={(open) => {
          if (!open) setIsCreateModalOpen(false);
        }}
        title="Add New Application"
        description="Applications are launched from the dashboard by users of the selected department."
        submitLabel={createApp.isPending ? "Creating..." : "Create Application"}
        busy={createApp.isPending}
        onSubmit={handleSubmit}
      >
        <Field label="Business Unit" required>
          {(control) => (
            <Select
              {...control}
              required
              value={formData.businessUnitId}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  businessUnitId: e.target.value,
                  departmentId: "", // Reset department when BU changes
                });
              }}
            >
              <option value="">Select a business unit</option>
              {businessUnits?.map((bu: BusinessUnit) => (
                <option key={bu._id} value={bu._id}>
                  {bu.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Department" required>
          {(control) => (
            <Select
              {...control}
              required
              value={formData.departmentId}
              onChange={(e) =>
                setFormData({ ...formData, departmentId: e.target.value })
              }
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
            </Select>
          )}
        </Field>

        <Field label="App Name" required>
          {(control) => (
            <Input
              {...control}
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          )}
        </Field>

        <Field label="Description" required>
          {(control) => (
            <Textarea
              {...control}
              required
              rows={3}
              className="resize-none"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          )}
        </Field>

        <Field label="URL" required>
          {(control) => (
            <Input
              {...control}
              type="url"
              required
              value={formData.url}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              placeholder="https://app.example.com"
            />
          )}
        </Field>

        <Field
          label="Chatbot API Base URL (optional)"
          hint="Used by dashboard chatbot routing. If empty, app URL is used."
        >
          {(control) => (
            <Input
              {...control}
              type="url"
              value={formData.chatbotApiUrl || ""}
              onChange={(e) =>
                setFormData({ ...formData, chatbotApiUrl: e.target.value })
              }
              placeholder="https://api.osidesigner.com/api-chemtracker"
            />
          )}
        </Field>

        <Field label="SSO Endpoint (optional)">
          {(control) => (
            <Input
              {...control}
              type="text"
              value={formData.ssoEndpoint}
              onChange={(e) =>
                setFormData({ ...formData, ssoEndpoint: e.target.value })
              }
              placeholder="api://app-id/.default"
            />
          )}
        </Field>

        <Field label="Icon URL (optional)">
          {(control) => (
            <Input
              {...control}
              type="url"
              value={formData.iconUrl}
              onChange={(e) =>
                setFormData({ ...formData, iconUrl: e.target.value })
              }
              placeholder="https://example.com/icon.png"
            />
          )}
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category" required>
            {(control) => (
              <Select
                {...control}
                required
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as AppCategory,
                  })
                }
              >
                <option value="gas">Gas Separation</option>
                <option value="chemical">Chemical Treatment</option>
                <option value="sand">Sand Control</option>
                <option value="pumps">Pumps Tracker</option>
                <option value="admin">Admin Tools</option>
                <option value="other">Other</option>
              </Select>
            )}
          </Field>

          <Field label="Required Role" required>
            {(control) => (
              <Select
                {...control}
                required
                value={formData.requiredRole}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    requiredRole: e.target.value as RequiredRole,
                  })
                }
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </Select>
            )}
          </Field>
        </div>

        <Checkbox
          label="Active"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
        />

        <Checkbox
          label="Coming Soon (Disables Launch Button)"
          checked={formData.comingSoon}
          onChange={(e) =>
            setFormData({ ...formData, comingSoon: e.target.checked })
          }
        />
      </FormDialog>

      <ConfirmationModal
        isOpen={deleteOpen}
        title="Delete Application"
        message={`Delete "${deleteTarget?.name ?? ""}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isPending={deleteApp.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};

export default AppManagement;
