import React, { useState } from "react";
import { businessUnitService } from "../../services/businessUnit.service";
import {
  BusinessUnit,
  CreateBusinessUnitDTO,
} from "../../types/businessUnit.types";
import { Building2, CheckCircle2, XCircle, Trash2, Edit2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TableRowSkeleton } from "../../components/SkeletonLoader";
import { exportRowsToCsv } from "../../utils/csvExport";

const BusinessUnitManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [editingBU, setEditingBU] = useState<BusinessUnit | null>(null);
  const [formData, setFormData] = useState<CreateBusinessUnitDTO>({
    name: "",
    description: "",
    logoUrl: "",
    isActive: true,
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessUnits"] });
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

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to deactivate "${name}"?`)) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await updateMutation.mutateAsync({
      id,
      data: { isActive: !currentStatus },
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBU(null);
    setFormData({
      name: "",
      description: "",
      logoUrl: "",
      isActive: true,
    });
  };

  const filteredBusinessUnits =
    businessUnits?.filter((bu) => {
      const matchesSearch =
        bu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bu.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && bu.isActive) ||
        (statusFilter === "inactive" && !bu.isActive);
      return matchesSearch && matchesStatus;
    }) || [];

  const handleExport = () => {
    exportRowsToCsv(
      "business-units.csv",
      ["Name", "Description", "Status", "Created By"],
      filteredBusinessUnits.map((bu) => [
        bu.name,
        bu.description,
        bu.isActive ? "Active" : "Inactive",
        typeof bu.createdBy === "object" && bu.createdBy !== null
          ? `${bu.createdBy.firstName} ${bu.createdBy.lastName}`
          : "Unknown",
      ]),
    );
  };

  return (
    <div className="rounded-b-lg bg-gray-50 border border-gray-200">
      {/* Business Units Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-amber-500 text-xl sm:text-2xl"
            aria-hidden="true"
          >
            corporate_fare
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Business Units
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
              add_business
            </span>
            <span className="hidden sm:inline">Add Business Unit</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-6 py-4 border-b border-gray-200">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input-field"
            placeholder="Search business units..."
          />
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

      {/* Business Units Table */}
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/[0.08]">
                {[...Array(5)].map((_, i) => (
                  <TableRowSkeleton key={i} columns={4} />
                ))}
              </tbody>
            </table>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-6">
          <p className="text-red-600">Failed to load business units</p>
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
                {filteredBusinessUnits.map((bu) => (
                  <tr key={bu._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-osi-primary mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {bu.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {bu.description}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleActive(bu._id, bu.isActive)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          bu.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bu.isActive ? (
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
                        {typeof bu.createdBy === "object" &&
                        bu.createdBy !== null
                          ? `${bu.createdBy.firstName} ${bu.createdBy.lastName}`
                          : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(bu)}
                        className="text-osi-primary hover:text-osi-dark mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bu._id, bu.name)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
                {editingBU ? "Edit Business Unit" : "Create New Business Unit"}
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
                  placeholder="OSI Rod Pump Division"
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
                  placeholder="Description of this business unit"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, logoUrl: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:border-osi-primary transition-colors"
                  placeholder="https://example.com/logo.png"
                />
                <p className="mt-1 text-xs text-gray-400">
                  URL to the business unit's logo image
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="business-unit-active"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded border-gray-300 text-osi-primary focus:ring-osi-primary"
                />
                <label
                  htmlFor="business-unit-active"
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
                  {editingBU ? "Update" : "Create"} Business Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessUnitManagement;
