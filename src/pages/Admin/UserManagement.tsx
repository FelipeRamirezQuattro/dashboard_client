import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import { IUser, UserRole } from "../../types/user.types";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import { UserPermission } from "../../types/permission.types";
import LoadingSpinner from "../../components/LoadingSpinner";
import { permissionsService } from "../../services/permissions.service";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { TableRowSkeleton } from "../../components/SkeletonLoader";

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  businessUnitIds: string[];
  departmentIds: string[];
}

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "viewer",
    isActive: true,
    businessUnitIds: [],
    departmentIds: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBusinessUnitForDepts, setSelectedBusinessUnitForDepts] =
    useState<string>("");

  // Fetch users
  const {
    data: users,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const response = await api.get<{ users: IUser[] }>("/users");
      return response.data.users;
    },
  });

  // Fetch business units
  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => businessUnitService.getActiveBusinessUnits(),
  });

  // Fetch all departments
  const { data: allDepartments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentService.getActiveDepartments(),
  });

  // Fetch user permissions when editing
  const { data: userPermissions = [] } = useQuery({
    queryKey: ["userPermissions", selectedUser?._id],
    queryFn: () => permissionsService.getUserPermissions(selectedUser!._id),
    enabled: !!selectedUser,
  });

  // Load user data when editing
  useEffect(() => {
    if (selectedUser && userPermissions.length >= 0) {
      setFormData({
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        password: "",
        role: selectedUser.role,
        isActive: selectedUser.isActive,
        businessUnitIds: extractBusinessUnitIds(userPermissions),
        departmentIds: extractDepartmentIds(userPermissions),
      });
    }
  }, [selectedUser, userPermissions]);

  // Helper functions to extract IDs from permissions
  const extractBusinessUnitIds = (permissions: UserPermission[]): string[] => {
    const buIds = new Set<string>();
    permissions.forEach((perm) => {
      if (
        perm.permissionLevel === "businessUnit" &&
        perm.businessUnitId &&
        typeof perm.businessUnitId === "object"
      ) {
        buIds.add(perm.businessUnitId._id);
      } else if (
        perm.businessUnitId &&
        typeof perm.businessUnitId === "string"
      ) {
        buIds.add(perm.businessUnitId);
      }
    });
    return Array.from(buIds);
  };

  const extractDepartmentIds = (permissions: UserPermission[]): string[] => {
    const deptIds = new Set<string>();
    permissions.forEach((perm) => {
      if (
        perm.permissionLevel === "department" &&
        perm.departmentId &&
        typeof perm.departmentId === "object"
      ) {
        deptIds.add(perm.departmentId._id);
      } else if (perm.departmentId && typeof perm.departmentId === "string") {
        deptIds.add(perm.departmentId);
      }
    });
    return Array.from(deptIds);
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserFormData>) => {
      const response = await api.post("/users", userData);
      return response.data;
    },
    onSuccess: async (data) => {
      // Create permissions for the new user
      const userId = data.user._id;
      const permissions = [];

      // Add business unit permissions
      for (const buId of formData.businessUnitIds) {
        permissions.push({
          permissionLevel: "businessUnit" as const,
          businessUnitId: buId,
        });
      }

      // Add department permissions
      for (const deptId of formData.departmentIds) {
        const dept = allDepartments.find((d) => d._id === deptId);
        if (dept) {
          const buId =
            typeof dept.businessUnitId === "object" &&
            dept.businessUnitId !== null
              ? dept.businessUnitId._id
              : dept.businessUnitId;
          permissions.push({
            permissionLevel: "department" as const,
            businessUnitId: buId,
            departmentId: deptId,
          });
        }
      }

      if (permissions.length > 0) {
        await permissionsService.bulkUpdateUserPermissions(userId, permissions);
      }

      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      handleCloseModal();
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<UserFormData>;
    }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: async (_data, variables) => {
      // Update permissions
      const permissions = [];

      // Add business unit permissions
      for (const buId of formData.businessUnitIds) {
        permissions.push({
          permissionLevel: "businessUnit" as const,
          businessUnitId: buId,
        });
      }

      // Add department permissions
      for (const deptId of formData.departmentIds) {
        const dept = allDepartments.find((d) => d._id === deptId);
        if (dept) {
          const buId =
            typeof dept.businessUnitId === "object" &&
            dept.businessUnitId !== null
              ? dept.businessUnitId._id
              : dept.businessUnitId;
          permissions.push({
            permissionLevel: "department" as const,
            businessUnitId: buId,
            departmentId: deptId,
          });
        }
      }

      await permissionsService.bulkUpdateUserPermissions(
        variables.id,
        permissions,
      );

      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({
        queryKey: ["userPermissions", variables.id],
      });
      handleCloseModal();
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });

  // Form handlers
  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "viewer",
      isActive: true,
      businessUnitIds: [],
      departmentIds: [],
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: IUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "viewer",
      isActive: true,
      businessUnitIds: [],
      departmentIds: [],
    });
    setErrors({});
    setSelectedBusinessUnitForDepts("");
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!selectedUser && !formData.password) {
      newErrors.password = "Password is required for new users";
    }
    if (!selectedUser && formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: Partial<UserFormData> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role,
      isActive: formData.isActive,
    };

    if (formData.password) {
      submitData.password = formData.password;
    }

    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser._id, data: submitData });
    } else {
      createUserMutation.mutate(submitData);
    }
  };

  const handleBusinessUnitToggle = (buId: string) => {
    setFormData((prev) => {
      const newIds = prev.businessUnitIds.includes(buId)
        ? prev.businessUnitIds.filter((id) => id !== buId)
        : [...prev.businessUnitIds, buId];
      return { ...prev, businessUnitIds: newIds };
    });
  };

  const handleDepartmentToggle = (deptId: string) => {
    setFormData((prev) => {
      const newIds = prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId];
      return { ...prev, departmentIds: newIds };
    });
  };

  const getFilteredDepartments = (): Department[] => {
    if (!selectedBusinessUnitForDepts) {
      return allDepartments;
    }
    return allDepartments.filter((dept) => {
      const buId =
        typeof dept.businessUnitId === "object" && dept.businessUnitId !== null
          ? dept.businessUnitId._id
          : dept.businessUnitId;
      return buId === selectedBusinessUnitForDepts;
    });
  };

  const handleDeleteUser = (user: IUser) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
      )
    ) {
      deleteUserMutation.mutate(user._id);
    }
  };

  // Helper function to get user initials
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Helper function to get avatar background color
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-100 text-blue-700",
      "bg-green-100 text-green-700",
      "bg-purple-100 text-purple-700",
      "bg-pink-100 text-pink-700",
      "bg-indigo-100 text-indigo-700",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Helper function to get role badge style
  const getRoleBadgeStyle = (role: string) => {
    const roleUpper = role.toUpperCase();
    switch (roleUpper) {
      case "SUPERADMIN":
        return "bg-amber-100 text-amber-800 font-semibold";
      case "ADMIN":
        return "bg-gray-900 text-white font-semibold";
      case "EDITOR":
        return "bg-gray-200 text-gray-700 font-medium";
      case "VIEWER":
        return "bg-gray-200 text-gray-700 font-medium";
      default:
        return "bg-gray-200 text-gray-700 font-medium";
    }
  };

  // Calculate pagination
  const totalUsers = users?.length || 0;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users?.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-b-lg shadow-sm">
      {/* User Directory Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-amber-500 text-xl sm:text-2xl"
            aria-hidden="true"
          >
            group
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            User Directory
          </h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 touch-manipulation whitespace-nowrap shrink-0">
            <span
              className="material-symbols-outlined text-lg"
              aria-hidden="true"
            >
              tune
            </span>
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 touch-manipulation whitespace-nowrap shrink-0">
            <span
              className="material-symbols-outlined text-lg"
              aria-hidden="true"
            >
              download
            </span>
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-osi-primary text-white rounded-lg hover:bg-osi-primary-dark transition-colors text-sm font-medium touch-manipulation active:scale-95 whitespace-nowrap shrink-0"
          >
            <span
              className="material-symbols-outlined text-lg"
              aria-hidden="true"
            >
              person_add
            </span>
            <span className="hidden sm:inline">Add User</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[...Array(5)].map((_, i) => (
                <TableRowSkeleton key={i} columns={5} />
              ))}
            </tbody>
          </table>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-6">
          <p className="text-red-600">Failed to load users</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    SSO Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers?.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${getAvatarColor(user.firstName)}`}
                        >
                          {getInitials(user.firstName, user.lastName)}
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded text-xs ${getRoleBadgeStyle(user.role)}`}
                      >
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.microsoftId ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <span className="material-symbols-outlined text-lg">
                            link
                          </span>
                          <span className="text-sm font-medium">Linked</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <span className="material-symbols-outlined text-lg">
                            link_off
                          </span>
                          <span className="text-sm font-medium">
                            Not Linked
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            user.isActive ? "bg-emerald-500" : "bg-gray-400"
                          }`}
                        ></div>
                        <span
                          className={`text-sm font-medium ${
                            user.isActive ? "text-emerald-600" : "text-gray-500"
                          }`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleOpenEditModal(user)}
                          className="text-gray-600 hover:text-gray-900"
                          title="Edit user"
                        >
                          <span className="material-symbols-outlined text-xl">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-gray-600 hover:text-red-600"
                          title="Delete user"
                        >
                          <span className="material-symbols-outlined text-xl">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 font-medium">
              SHOWING {startIndex + 1}-{Math.min(endIndex, totalUsers)} OF{" "}
              {totalUsers} USERS
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-xl">
                  chevron_left
                </span>
              </button>
              {Array.from(
                { length: Math.min(3, totalPages) },
                (_, i) => i + 1,
              ).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === page
                      ? "bg-osi-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-xl">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedUser ? "Edit User" : "Create New User"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-2xl">
                  close
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
              {/* Basic Information Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-osi-primary">
                    person
                  </span>
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary ${
                        errors.firstName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary ${
                        errors.lastName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="user@example.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password{" "}
                      {!selectedUser && <span className="text-red-500">*</span>}
                      {selectedUser && (
                        <span className="text-gray-500 text-xs">
                          (leave blank to keep current)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary ${
                        errors.password ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={selectedUser ? "••••••••" : "Enter password"}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as UserRole,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex items-center gap-3 h-10">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-osi-primary border-gray-300 rounded focus:ring-osi-primary"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Active
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Units Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-osi-primary">
                    corporate_fare
                  </span>
                  Business Units
                </h4>
                <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {businessUnits.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No business units available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {businessUnits.map((bu: BusinessUnit) => (
                        <label
                          key={bu._id}
                          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.businessUnitIds.includes(bu._id)}
                            onChange={() => handleBusinessUnitToggle(bu._id)}
                            className="w-4 h-4 text-osi-primary border-gray-300 rounded focus:ring-osi-primary"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {bu.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Departments Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-osi-primary">
                      domain
                    </span>
                    Departments
                  </h4>
                  {allDepartments.length > 0 && (
                    <select
                      value={selectedBusinessUnitForDepts}
                      onChange={(e) =>
                        setSelectedBusinessUnitForDepts(e.target.value)
                      }
                      className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-osi-primary"
                    >
                      <option value="">All Departments</option>
                      {businessUnits.map((bu: BusinessUnit) => (
                        <option key={bu._id} value={bu._id}>
                          {bu.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {getFilteredDepartments().length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      No departments available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getFilteredDepartments().map((dept: Department) => {
                        const buName =
                          typeof dept.businessUnitId === "object" &&
                          dept.businessUnitId !== null
                            ? dept.businessUnitId.name
                            : businessUnits.find(
                                (bu: BusinessUnit) =>
                                  bu._id === dept.businessUnitId,
                              )?.name || "";
                        return (
                          <label
                            key={dept._id}
                            className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={formData.departmentIds.includes(
                                dept._id,
                              )}
                              onChange={() => handleDepartmentToggle(dept._id)}
                              className="w-4 h-4 text-osi-primary border-gray-300 rounded focus:ring-osi-primary"
                            />
                            <div className="ml-2 flex-1">
                              <span className="text-sm text-gray-700">
                                {dept.name}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({buName})
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createUserMutation.isPending || updateUserMutation.isPending
                  }
                  className="px-4 py-2 bg-osi-primary text-white rounded-lg hover:bg-osi-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {(createUserMutation.isPending ||
                    updateUserMutation.isPending) && (
                    <LoadingSpinner size="sm" />
                  )}
                  {selectedUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
