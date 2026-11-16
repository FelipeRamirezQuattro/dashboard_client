import React, { useState } from "react";
import { businessUnitService } from "../../services/businessUnit.service";
import {
  BusinessUnit,
  CreateBusinessUnitDTO,
} from "../../types/businessUnit.types";
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
  type DataTableColumn,
} from "@odessa-separator/ui";
import {
  Building2,
  CheckCircle2,
  Download,
  Edit2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { exportRowsToCsv } from "../../utils/csvExport";

type StatusFilter = "all" | "active" | "inactive";

const emptyForm: CreateBusinessUnitDTO = {
  name: "",
  description: "",
  logoUrl: "",
  isActive: true,
};

const getCreatedBy = (bu: BusinessUnit) =>
  typeof bu.createdBy === "object" && bu.createdBy !== null
    ? `${bu.createdBy.firstName} ${bu.createdBy.lastName}`
    : "Unknown";

const BusinessUnitManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Kept after the dialog closes so the message never reads "undefined" while it animates out.
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingBU, setEditingBU] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] = useState<CreateBusinessUnitDTO>(emptyForm);

  const {
    data: businessUnits,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: businessUnitService.getAllBusinessUnits,
  });

  const createMutation = useMutation({
    mutationFn: businessUnitService.createBusinessUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessUnits"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      businessUnitService.updateBusinessUnit(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessUnits"] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: businessUnitService.deleteBusinessUnit,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["businessUnits"] });

      const previousBusinessUnits =
        queryClient.getQueryData<BusinessUnit[]>(["businessUnits"]);
      const previousActiveBusinessUnits =
        queryClient.getQueryData<BusinessUnit[]>(["businessUnits", "active"]);

      queryClient.setQueryData<BusinessUnit[]>(["businessUnits"], (current) =>
        current?.map((bu) =>
          bu._id === id ? { ...bu, isActive: false } : bu,
        ),
      );
      queryClient.setQueryData<BusinessUnit[]>(
        ["businessUnits", "active"],
        (current) => current?.filter((bu) => bu._id !== id),
      );

      return { previousBusinessUnits, previousActiveBusinessUnits };
    },
    onError: (_error, _id, context) => {
      if (context?.previousBusinessUnits) {
        queryClient.setQueryData(
          ["businessUnits"],
          context.previousBusinessUnits,
        );
      }
      if (context?.previousActiveBusinessUnits) {
        queryClient.setQueryData(
          ["businessUnits", "active"],
          context.previousActiveBusinessUnits,
        );
      }
    },
    onSuccess: () => {
      setDeleteOpen(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["businessUnits"] });
      queryClient.invalidateQueries({ queryKey: ["businessUnits", "active"] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBU) {
      await updateMutation.mutateAsync({ id: editingBU._id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const handleAdd = () => {
    setEditingBU(null);
    setFormData(emptyForm);
    setIsModalOpen(true);
  };

  const handleEdit = (bu: BusinessUnit) => {
    setEditingBU(bu);
    setFormData({
      name: bu.name,
      description: bu.description,
      logoUrl: bu.logoUrl || "",
      isActive: bu.isActive,
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

  // One predicate for the table and the CSV export: trimmed search over the joined text + status.
  const matches = (bu: BusinessUnit) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = `${bu.name} ${bu.description}`.toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && bu.isActive) ||
      (statusFilter === "inactive" && !bu.isActive);
    return matchesSearch && matchesStatus;
  };

  // The search lives in `searchTerm`, so `searchText` is not passed and the hook's own search is unused.
  const table = useDataTable<BusinessUnit>(businessUnits ?? [], {
    filter: matches,
    sorters: {
      name: (a, b) => a.name.localeCompare(b.name),
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

  const filteredBusinessUnits = (businessUnits ?? []).filter(matches);

  const handleExport = () => {
    exportRowsToCsv(
      "business-units.csv",
      ["Name", "Description", "Status", "Created By"],
      filteredBusinessUnits.map((bu) => [
        bu.name,
        bu.description,
        bu.isActive ? "Active" : "Inactive",
        getCreatedBy(bu),
      ]),
    );
  };

  const columns: DataTableColumn<BusinessUnit>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (bu) => (
        <span className="flex items-center gap-2 whitespace-nowrap font-semibold text-text">
          <Building2 className="size-5 text-text-muted" aria-hidden="true" />
          {bu.name}
        </span>
      ),
    },
    {
      key: "description",
      header: "Description",
      cell: (bu) => <span className="text-text-muted">{bu.description}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (bu) => (
        <Button
          variant="ghost"
          size="sm"
          aria-label={`${bu.isActive ? "Active" : "Inactive"}, toggle status of ${bu.name}`}
          onClick={() => toggleActive(bu._id, bu.isActive)}
        >
          <Badge variant={bu.isActive ? "success" : "danger"}>
            {bu.isActive ? (
              <CheckCircle2 className="size-3" aria-hidden="true" />
            ) : (
              <XCircle className="size-3" aria-hidden="true" />
            )}
            {bu.isActive ? "Active" : "Inactive"}
          </Badge>
        </Button>
      ),
    },
    {
      key: "createdBy",
      header: "Created By",
      sortable: true,
      cell: (bu) => (
        <span className="whitespace-nowrap text-text-muted">
          {getCreatedBy(bu)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (bu) => (
        <span className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${bu.name}`}
            onClick={() => handleEdit(bu)}
          >
            <Edit2 className="size-4" aria-hidden="true" />
          </Button>
          {isSuperAdmin && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Deactivate ${bu.name}`}
              title="Deactivate business unit"
              onClick={() => {
                setDeleteTarget({ id: bu._id, name: bu.name });
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
      aria-labelledby="business-units-heading"
      className="flex flex-col gap-4 py-6"
    >
      <h2
        id="business-units-heading"
        className="flex items-center gap-2 text-xl font-semibold text-text"
      >
        <Building2 className="size-6 text-text-muted" aria-hidden="true" />
        Business Units
      </h2>

      <DataTableToolbar
        searchLabel="Search business units"
        searchPlaceholder="Search business units..."
        search={searchTerm}
        onSearchChange={changeSearch}
        resultCount={table.total}
        filters={
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
        }
        activeFilters={
          statusFilter === "all"
            ? []
            : [
                {
                  key: "status",
                  label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`,
                  onClear: () => changeStatusFilter("all"),
                },
              ]
        }
        onClearFilters={() => changeStatusFilter("all")}
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="size-4" aria-hidden="true" />
              Add Business Unit
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="danger">Failed to load business units</Alert>
      ) : (
        <DataTable
          caption="Business units"
          columns={columns}
          rows={table.rows}
          getRowKey={(bu) => bu._id}
          sort={table.sort}
          onSortChange={table.toggleSort}
          page={table.page}
          pageCount={table.pageCount}
          onPageChange={table.setPage}
          loading={isLoading}
          loadingLabel="Loading business units"
          empty={{ title: "No business units found" }}
        />
      )}

      <FormDialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
        title={editingBU ? "Edit Business Unit" : "Create New Business Unit"}
        description="Business units group departments and the apps users can launch."
        submitLabel={`${editingBU ? "Update" : "Create"} Business Unit`}
        busy={createMutation.isPending || updateMutation.isPending}
        onSubmit={handleSubmit}
      >
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
              placeholder="OSI Rod Pump Division"
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
              placeholder="Description of this business unit"
            />
          )}
        </Field>

        <Field label="Logo URL" hint="URL to the business unit's logo image">
          {(control) => (
            <Input
              {...control}
              type="url"
              value={formData.logoUrl}
              onChange={(e) =>
                setFormData({ ...formData, logoUrl: e.target.value })
              }
              placeholder="https://example.com/logo.png"
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
        title="Deactivate Business Unit"
        message={`Deactivate "${deleteTarget?.name ?? ""}"? Users will no longer see it as active.`}
        confirmLabel="Deactivate"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </section>
  );
};

export default BusinessUnitManagement;
