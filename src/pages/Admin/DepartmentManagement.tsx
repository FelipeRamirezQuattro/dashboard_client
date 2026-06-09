import React, { useState } from "react";
import { departmentService } from "../../services/department.service";
import { businessUnitService } from "../../services/businessUnit.service";
import { Department, CreateDepartmentDTO } from "../../types/department.types";
import { FolderTree, CheckCircle2, XCircle, Trash2, Edit2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TableRowSkeleton } from "../../components/SkeletonLoader";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { exportRowsToCsv } from "../../utils/csvExport";

const DepartmentManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "superadmin";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [businessUnitFilter, setBusinessUnitFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "active",
  );
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState<CreateDepartmentDTO>({
    name: "",
    description: "",
    businessUnitId: "",
    isActive: true,
  });

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
      setDeleteTarget(null);
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

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description,
      businessUnitId:
        typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
          ? dept.businessUnitId._id
          : dept.businessUnitId,
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

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    setFormData({
      name: "",
      description: "",
      businessUnitId: "",
      isActive: true,
    });
  };

  const getBusinessUnitName = (dept: Department) =>
    typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
      ? dept.businessUnitId.name
      : "Unknown";

  const getBusinessUnitId = (dept: Department) =>
    typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
      ? dept.businessUnitId._id
      : dept.businessUnitId;

  const filteredDepartments =
    departments?.filter((dept) => {
      const matchesSearch =
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getBusinessUnitName(dept)
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesBusinessUnit =
        !businessUnitFilter || getBusinessUnitId(dept) === businessUnitFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && dept.isActive) ||
        (statusFilter === "inactive" && !dept.isActive);
      return matchesSearch && matchesBusinessUnit && matchesStatus;
    }) || [];

  const handleExport = () => {
    exportRowsToCsv(
      "departments.csv",
      ["Name", "Description", "Business Unit", "Status", "Created By"],
      filteredDepartments.map((dept) => [
        dept.name,
        dept.description,
        getBusinessUnitName(dept),
        dept.isActive ? "Active" : "Inactive",
        typeof dept.createdBy === "object" && dept.createdBy !== null
          ? `${dept.createdBy.firstName} ${dept.createdBy.lastName}`
          : "Unknown",
      ]),
    );
  };

  return (
    <div className="rounded-b-lg bg-gray-50 border border-gray-200">
      {/* Departments Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-amber-500 text-xl sm:text-2xl"
            aria-hidden="true"
          >
            domain
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Departments
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
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-osi-primary text-gray-900 rounded-lg hover:bg-osi-primary-dark transition-colors text-sm font-medium touch-manipulation active:scale-95 whitespace-nowrap shrink-0"
          >
            <span className="material-symbols-outlined text-lg" aria-hidden="true">
              create_new_folder
            </span>
            <span className="hidden sm:inline">Add Department</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 sm:px-6 py-4 border-b border-gray-200">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input-field"
            placeholder="Search departments..."
          />
          <select
            value={businessUnitFilter}
            onChange={(event) => setBusinessUnitFilter(event.target.value)}
            className="input-field"
          >
            <option value="">All Business Units</option>
            {businessUnits?.map((bu) => (
              <option key={bu._id} value={bu._id}>
                {bu.name}
              </option>
            ))}
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

      {/* Departments Table */}
      {isLoading ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Business Unit
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
                {[...Array(5)].map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))}
              </tbody>
            </table>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-6">
          <p className="text-red-600">Failed to load departments</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-full divide-y divide-white/[0.08]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Business Unit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/[0.08]">
                {filteredDepartments.map((dept) => (
                  <tr key={dept._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FolderTree className="h-5 w-5 text-osi-secondary mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {dept.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {dept.description}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {getBusinessUnitName(dept)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(dept._id, dept.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          dept.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {dept.isActive ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {typeof dept.createdBy === "object" &&
                        dept.createdBy !== null
                          ? `${dept.createdBy.firstName} ${dept.createdBy.lastName}`
                          : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(dept)}
                        className="text-osi-primary hover:text-osi-dark mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() =>
                            setDeleteTarget({ id: dept._id, name: dept.name })
                          }
                          className="text-red-600 hover:text-red-900"
                          title="Deactivate department"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={closeModal}
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
                {editingDept ? "Edit Department" : "Create New Department"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
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
                  onChange={(e) =>
                    setFormData({ ...formData, businessUnitId: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors bg-white"
                >
                  <option value="">Select a business unit</option>
                  {businessUnits?.map((bu) => (
                    <option key={bu._id} value={bu._id}>
                      {bu.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                  placeholder="Sales, Engineering, Manufacturing, etc."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors resize-none"
                  placeholder="Description of this department"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="department-active"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 text-osi-primary focus:ring-osi-primary"
                />
                <label
                  htmlFor="department-active"
                  className="text-sm text-gray-600"
                >
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-black transition-all active:scale-95 touch-manipulation disabled:opacity-60"
                  style={{
                    background:
                      "linear-gradient(135deg, #fbad37 0%, #ffd280 100%)",
                  }}
                >
                  {editingDept ? "Update" : "Create"} Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Deactivate Department"
        message={`Deactivate "${deleteTarget?.name}"? Users will no longer see it as active.`}
        confirmLabel="Deactivate"
        isPending={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default DepartmentManagement;
