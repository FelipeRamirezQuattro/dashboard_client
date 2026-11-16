import React, { useState } from "react";
import { departmentService } from "../../services/department.service";
import { businessUnitService } from "../../services/businessUnit.service";
import { Department, CreateDepartmentDTO } from "../../types/department.types";
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
  Edit2,
  FolderTree,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { exportRowsToCsv } from "../../utils/csvExport";

type StatusFilter = "all" | "active" | "inactive";

const emptyForm: CreateDepartmentDTO = {
  name: "",
  description: "",
  businessUnitId: "",
  isActive: true,
};

const getBusinessUnitName = (dept: Department) =>
  typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
    ? dept.businessUnitId.name
    : "Unknown";

const getBusinessUnitId = (dept: Department) =>
  typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
    ? dept.businessUnitId._id
    : dept.businessUnitId;

const getCreatedBy = (dept: Department) =>
  typeof dept.createdBy === "object" && dept.createdBy !== null
    ? `${dept.createdBy.firstName} ${dept.createdBy.lastName}`
    : "Unknown";

const DepartmentManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Kept after the dialog closes so the message never reads "undefined" while it animates out.
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentDTO>(emptyForm);

  const {
    data: departments,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["departments"],
    queryFn: departmentService.getAllDepartments,
  });

  const { data: businessUnits } = useQuery({
    queryKey: ["businessUnits", "active"],
    queryFn: businessUnitService.getActiveBusinessUnits,
  });

  const createMutation = useMutation({
    mutationFn: departmentService.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      departmentService.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentService.deleteDepartment,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["departments"] });

      const previousDepartments =
        queryClient.getQueryData<Department[]>(["departments"]);
      const previousActiveDepartments =
        queryClient.getQueryData<Department[]>(["departments", "active"]);

      queryClient.setQueryData<Department[]>(["departments"], (current) =>
        current?.map((dept) =>
          dept._id === id ? { ...dept, isActive: false } : dept,
        ),
      );
      queryClient.setQueryData<Department[]>(
        ["departments", "active"],
        (current) => current?.filter((dept) => dept._id !== id),
      );

      return { previousDepartments, previousActiveDepartments };
    },
    onError: (_error, _id, context) => {
      if (context?.previousDepartments) {
        queryClient.setQueryData(["departments"], context.previousDepartments);
      }
      if (context?.previousActiveDepartments) {
        queryClient.setQueryData(
          ["departments", "active"],
          context.previousActiveDepartments,
        );
      }
    },
    onSuccess: () => {
      setDeleteOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      queryClient.invalidateQueries({ queryKey: ["departments", "active"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDept) {
      await updateMutation.mutateAsync({ id: editingDept._id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleAdd = () => {
    setEditingDept(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description,
      businessUnitId: getBusinessUnitId(dept),
      isActive: dept.isActive,
    });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateMutation.mutateAsync({
      id,
      data: { isActive: !currentStatus },
    });
  };

  // Form values are reset when the dialog is opened (handleAdd/handleEdit), so the title and
  // fields do not change while the dialog animates closed.
  const closeModal = () => {
    setIsModalOpen(false);
  };

  const searchText = (dept: Department) =>
    `${dept.name} ${dept.description} ${getBusinessUnitName(dept)}`;

  // One predicate for the table and the CSV export: trimmed search + business unit + status.
  const matches = (dept: Department) => {
    const matchesSearch = searchText(dept)
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());
    const matchesBusinessUnit =
      !businessUnitFilter || getBusinessUnitId(dept) === businessUnitFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && dept.isActive) ||
      (statusFilter === "inactive" && !dept.isActive);
    return matchesSearch && matchesBusinessUnit && matchesStatus;
  };

  // The search lives in `searchTerm`, so `searchText` is not passed to the hook.
  const table = useDataTable<Department>(departments ?? [], {
    filter: matches,
    sorters: {
      name: (a, b) => a.name.localeCompare(b.name),
      businessUnit: (a, b) =>
        getBusinessUnitName(a).localeCompare(getBusinessUnitName(b)),
      status: (a, b) => Number(b.isActive) - Number(a.isActive),
      createdBy: (a, b) => getCreatedBy(a).localeCompare(getCreatedBy(b)),
    },
    initialSort: { key: "name", direction: "ascending" },
    pageSize: 10,
  });

  const changeSearch = (value: string) => {
    setSearchTerm(value);
    table.resetPage();
  };

  const changeStatusFilter = (value: StatusFilter) => {
    setStatusFilter(value);
    table.resetPage();
  };

  const changeBusinessUnitFilter = (value: string) => {
    setBusinessUnitFilter(value);
    table.resetPage();
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setBusinessUnitFilter("");
    table.resetPage();
  };

  const activeFilters: ActiveFilter[] = [];
  if (businessUnitFilter) {
    const bu = businessUnits?.find((item) => item._id === businessUnitFilter);
    activeFilters.push({
      key: "businessUnit",
      label: `Business Unit: ${bu?.name ?? "Selected"}`,
      onClear: () => changeBusinessUnitFilter(""),
    });
  }
  if (statusFilter !== "all") {
    activeFilters.push({
      key: "status",
      label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
      onClear: () => changeStatusFilter("all"),
    });
  }

  const filteredDepartments = (departments ?? []).filter(matches);

  const handleExport = () => {
    exportRowsToCsv(
      "departments.csv",
      ["Name", "Description", "Business Unit", "Status", "Created By"],
      filteredDepartments.map((dept) => [
        dept.name,
        dept.description,
        getBusinessUnitName(dept),
        dept.isActive ? "Active" : "Inactive",
        getCreatedBy(dept),
      ]),
    );
  };

  const columns: DataTableColumn<Department>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (dept) => (
        <span className="flex items-center gap-2 whitespace-nowrap font-semibold text-text">
          <FolderTree className="size-5 text-text-muted" aria-hidden="true" />
          {dept.name}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (dept) => (
        <span className="text-text-muted">{dept.description}</span>
      ),
    },
    {
      key: "businessUnit",
      header: "Business Unit",
      sortable: true,
      cell: (dept) => (
        <span className="whitespace-nowrap text-text">
          {getBusinessUnitName(dept)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (dept) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${dept.isActive ? "Active" : "Inactive"}, toggle status of ${dept.name}`}
          onClick={() => toggleActive(dept._id, dept.isActive)}
        >
          <Badge variant={dept.isActive ? "success" : "danger"}>
            {dept.isActive ? (
              <CheckCircle2 className="size-3" aria-hidden="true" />
            ) : (
              <XCircle className="size-3" aria-hidden="true" />
            )}
            {dept.isActive ? "Active" : "Inactive"}
          </Badge>
        </Button>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      sortable: true,
      cell: (dept) => (
        <span className="whitespace-nowrap text-text-muted">
          {getCreatedBy(dept)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (dept) => (
        <span className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${dept.name}`}
            onClick={() => handleEdit(dept)}
          >
            <Edit2 className="size-4" aria-hidden="true" />
          </Button>
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Deactivate ${dept.name}`}
              title="Deactivate department"
              onClick={() => {
                setDeleteTarget({ id: dept._id, name: dept.name });
                setDeleteOpen(true);
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          )}
        </span>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="departments-heading"
      className="flex flex-col gap-4 py-6"
    >
      <h2
        id="departments-heading"
        className="flex items-center gap-2 text-xl font-semibold text-text"
      >
        <FolderTree className="size-6 text-text-muted" aria-hidden="true" />
        Departments
      </h2>

      <DataTableToolbar
        searchLabel="Search departments"
        searchPlaceholder="Search departments..."
        search={searchTerm}
        onSearchChange={changeSearch}
        resultCount={table.total}
        filters={
          <div className="flex flex-col gap-4">
            <Field label="Business Unit">
              {(control) => (
                <Select
                  {...control}
                  value={businessUnitFilter}
                  onChange={(event) =>
                    changeBusinessUnitFilter(event.target.value)
                  }
                >
                  <option value="">All Business Units</option>
                  {businessUnits?.map((bu) => (
                    <option key={bu._id} value={bu._id}>
                      {bu.name}
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
            <Button onClick={handleAdd}>
              <Plus className="size-4" aria-hidden="true" />
              Add Department
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="danger">Failed to load departments</Alert>
      ) : (
        <DataTable
          caption="Departments"
          columns={columns}
          rows={table.rows}
          getRowKey={(dept) => dept._id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          page={table.page}
          pageCount={table.pageCount}
          onPageChange={table.setPage}
          loading={isLoading}
          loadingLabel="Loading departments"
          empty={{ title: "No departments found" }}
        />
      )}

      <FormDialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={editingDept ? "Edit Department" : "Create New Department"}
        description="Departments belong to a business unit."
        submitLabel={`${editingDept ? "Update" : "Create"} Department`}
        busy={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      >
        <Field label="Business Unit" required>
          {(control) => (
            <Select
              {...control}
              required
              value={formData.businessUnitId}
              onChange={(e) =>
                setFormData({ ...formData, businessUnitId: e.target.value })
              }
            >
              <option value="">Select a business unit</option>
              {businessUnits?.map((bu) => (
                <option key={bu._id} value={bu._id}>
                  {bu.name}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Name" required>
          {(control) => (
            <Input
              {...control}
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Sales, Engineering, Manufacturing, etc."
            />
          )}
        </Field>

        <Field label="Description" required>
          {(control) => (
            <Textarea
              {...control}
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="resize-none"
              placeholder="Description of this department"
            />
          )}
        </Field>

        <Checkbox
          label="Active"
          checked={formData.isActive}
          onChange={(e) =>
            setFormData({ ...formData, isActive: e.target.checked })
          }
        />
      </FormDialog>

      <ConfirmationModal
        isOpen={deleteOpen}
        title="Deactivate Department"
        message={`Deactivate "${deleteTarget?.name ?? ""}"? Users will no longer see it as active.`}
        confirmLabel="Deactivate"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};

export default DepartmentManagement;
