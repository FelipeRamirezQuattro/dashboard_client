import React, { useState } from "react";
import { businessUnitService } from "../../services/businessUnit.service";
import {
  BusinessUnit,
  CreateBusinessUnitDTO,
} from "../../types/businessUnit.types";
import { Building2, CheckCircle2, XCircle, Trash2, Edit2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TableRowSkeleton } from "../../components/SkeletonLoader";

const BusinessUnitManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-osi-dark">
            Business Units
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            Manage organizational business units
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary touch-manipulation active:scale-95 w-full sm:w-auto shrink-0"
        >
          <Building2 className="w-4 h-4 mr-2" aria-hidden="true" />
          Add Business Unit
        </button>
      </div>

      {/* Business Units Table */}
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
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Failed to load business units</p>
        </div>
      ) : (
        <div className="rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
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
                {businessUnits?.map((bu) => (
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
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-transparent rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-osi-dark mb-6">
              {editingBU ? "Edit Business Unit" : "Create New Business Unit"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osi-primary focus:border-transparent"
                  placeholder="OSI Rod Pump Division"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osi-primary focus:border-transparent"
                  placeholder="Description of this business unit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logoUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, logoUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-osi-primary focus:border-transparent"
                  placeholder="https://example.com/logo.png"
                />
                <p className="mt-1 text-sm text-gray-400">
                  URL to the business unit's logo image
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 text-osi-primary focus:ring-osi-primary border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingBU ? "Update" : "Create"} Business Unit
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary flex-1"
                >
                  Cancel
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
