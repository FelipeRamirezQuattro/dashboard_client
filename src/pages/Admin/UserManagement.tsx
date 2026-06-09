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
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { exportRowsToCsv } from "../../utils/csvExport";

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  role: UserRole;
  isActive: boolean;
  businessUnitIds: string[];
  departmentIds: string[];
}

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">(
    "all",
  );
  const [ssoFilter, setSsoFilter] = useState<"all" | "linked" | "not-linked">(
    "all",
  );
  const [deleteTarget, setDeleteTarget] = useState<IUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "viewer",
    isActive: true,
    businessUnitIds: [],
    departmentIds: [],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
        confirmPassword: "",
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
      if (user?._id === variables.id) {
        setUser({
          ...user,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
        });
      }
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
      confirmPassword: "",
      role: "viewer",
      isActive: true,
      businessUnitIds: [],
      departmentIds: [],
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      confirmPassword: "",
      role: "viewer",
      isActive: true,
      businessUnitIds: [],
      departmentIds: [],
    });
    setErrors({});
    setSelectedBusinessUnitForDepts("");
    setShowPassword(false);
    setShowConfirmPassword(false);
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
    if (!selectedUser && !formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    }
    if (
      !selectedUser &&
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Passwords do not match";
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

  const handleAllBusinessUnitsToggle = () => {
    const allBusinessUnitIds = businessUnits.map((bu) => bu._id);
    const allSelected =
      allBusinessUnitIds.length > 0 &&
      allBusinessUnitIds.every((id) => formData.businessUnitIds.includes(id));

    setFormData((prev) => ({
      ...prev,
      businessUnitIds: allSelected ? [] : allBusinessUnitIds,
    }));
  };

  const handleDepartmentToggle = (deptId: string) => {
    setFormData((prev) => {
      const newIds = prev.departmentIds.includes(deptId)
        ? prev.departmentIds.filter((id) => id !== deptId)
        : [...prev.departmentIds, deptId];
      return { ...prev, departmentIds: newIds };
    });
  };

  const handleFilteredDepartmentsToggle = () => {
    const filteredDepartmentIds = getFilteredDepartments().map(
      (dept) => dept._id,
    );
    const allSelected =
      filteredDepartmentIds.length > 0 &&
      filteredDepartmentIds.every((id) => formData.departmentIds.includes(id));

    setFormData((prev) => ({
      ...prev,
      departmentIds: allSelected
        ? prev.departmentIds.filter((id) => !filteredDepartmentIds.includes(id))
        : Array.from(new Set([...prev.departmentIds, ...filteredDepartmentIds])),
    }));
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

  const confirmDeleteUser = () => {
    if (!deleteTarget) return;
    deleteUserMutation.mutate(deleteTarget._id, {
      onSuccess: () => setDeleteTarget(null),
    });
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
        return "bg-blue-100 text-blue-800 font-semibold";
      case "EDITOR":
        return "bg-gray-100 text-gray-600 font-medium";
      case "VIEWER":
        return "bg-gray-100 text-gray-600 font-medium";
      default:
        return "bg-gray-100 text-gray-600 font-medium";
    }
  };

  const filteredUsers =
    users?.filter((user) => {
      const query = searchTerm.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const matchesSearch =
        fullName.includes(query) || user.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "inactive" && !user.isActive);
      const matchesSso =
        ssoFilter === "all" ||
        (ssoFilter === "linked" && Boolean(user.microsoftId)) ||
        (ssoFilter === "not-linked" && !user.microsoftId);
      return matchesSearch && matchesRole && matchesStatus && matchesSso;
    }) || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, ssoFilter]);

  const handleExport = () => {
    exportRowsToCsv(
      "users.csv",
      ["Name", "Email", "Role", "SSO Status", "Status", "Last Login", "Created At"],
      filteredUsers.map((user) => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.role,
        user.microsoftId ? "Linked" : "Not Linked",
        user.isActive ? "Active" : "Inactive",
        user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "",
        new Date(user.createdAt).toLocaleString(),
      ]),
    );
  };

  // Calculate pagination
  const totalUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalUsers / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);
  const showingStart = totalUsers === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(endIndex, totalUsers);

  return (
    <div className="rounded-b-lg bg-gray-50 border border-gray-200">
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
          <button
            onClick={() => setShowFilters((value) => !value)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 touch-manipulation whitespace-nowrap shrink-0"
          >
            <span
              className="material-symbols-outlined text-lg"
              aria-hidden="true"
            >
              tune
            </span>
            <span className="hidden sm:inline">Filter</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600 touch-manipulation whitespace-nowrap shrink-0"
          >
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
            className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-osi-primary text-gray-900 rounded-lg hover:bg-osi-primary-dark transition-colors text-sm font-medium touch-manipulation active:scale-95 whitespace-nowrap shrink-0"
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

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-6 py-4 border-b border-gray-200">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="input-field"
            placeholder="Search users..."
          />
          <select
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value as "all" | UserRole)
            }
            className="input-field"
          >
            <option value="all">All Roles</option>
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Super Admin</option>
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
          <select
            value={ssoFilter}
            onChange={(event) =>
              setSsoFilter(event.target.value as "all" | "linked" | "not-linked")
            }
            className="input-field"
          >
            <option value="all">All SSO States</option>
            <option value="linked">Linked</option>
            <option value="not-linked">Not Linked</option>
          </select>
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Role
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
          <p className="text-red-600">Failed to load users</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    SSO Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/[0.08]">
                {currentUsers.map((user) => (
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
                      <div className="text-sm text-gray-500">{user.email}</div>
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
                            user.isActive ? "text-emerald-600" : "text-gray-400"
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
                          className="text-gray-500 hover:text-gray-900"
                          title="Edit user"
                        >
                          <span className="material-symbols-outlined text-xl">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="text-gray-500 hover:text-red-600"
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
            <div className="text-sm text-gray-500 font-medium">
              SHOWING {showingStart}-{showingEnd} OF {totalUsers} USERS
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      ? "bg-osi-primary text-gray-900"
                      : "text-gray-600 hover:bg-gray-100"
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
                className="px-3 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="rounded-xl bg-white border border-gray-200 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0">
              <h3 className="text-xl font-bold text-gray-900">
                {selectedUser ? "Edit User" : "Create New User"}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="material-symbols-outlined text-2xl">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col">
              {/* Modal Body */}
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {/* Basic Information Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg text-osi-primary">
                    person
                  </span>
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
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
                    <label className="block text-sm font-medium text-gray-600 mb-1">
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
                    <label className="block text-sm font-medium text-gray-600 mb-1">
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
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Password{" "}
                      {!selectedUser && <span className="text-red-500">*</span>}
                      {selectedUser && (
                        <span className="text-gray-400 text-xs">
                          (leave blank to keep current)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        className={`w-full px-3 py-2 pr-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={
                          selectedUser ? "••••••••" : "Enter password"
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-gray-400 transition-colors hover:text-gray-700"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        <span
                          className="material-symbols-outlined text-lg"
                          aria-hidden="true"
                        >
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {!selectedUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Confirm Password{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              confirmPassword: e.target.value,
                            })
                          }
                          className={`w-full px-3 py-2 pr-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary ${
                            errors.confirmPassword
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((value) => !value)
                          }
                          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-gray-400 transition-colors hover:text-gray-700"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                        >
                          <span
                            className="material-symbols-outlined text-lg"
                            aria-hidden="true"
                          >
                            {showConfirmPassword
                              ? "visibility_off"
                              : "visibility"}
                          </span>
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
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
                      className="w-full px-3 py-2 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary"
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
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
                        <span className="ml-2 text-sm text-gray-600">
                          Active
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Units Section */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-osi-primary">
                      corporate_fare
                    </span>
                    Business Units
                  </h4>
                  {businessUnits.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAllBusinessUnitsToggle}
                      className="text-xs font-semibold text-osi-primary hover:text-osi-dark"
                    >
                      {businessUnits.every((bu) =>
                        formData.businessUnitIds.includes(bu._id),
                      )
                        ? "Clear all"
                        : "Select all"}
                    </button>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {businessUnits.length === 0 ? (
                    <p className="text-gray-400 text-sm">
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
                          <span className="ml-2 text-sm text-gray-600">
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
                  <h4 className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-osi-primary">
                      domain
                    </span>
                    Departments
                  </h4>
                  {allDepartments.length > 0 && (
                    <div className="flex items-center gap-2">
                      {getFilteredDepartments().length > 0 && (
                        <button
                          type="button"
                          onClick={handleFilteredDepartmentsToggle}
                          className="text-xs font-semibold text-osi-primary hover:text-osi-dark"
                        >
                          {getFilteredDepartments().every((dept) =>
                            formData.departmentIds.includes(dept._id),
                          )
                            ? "Clear all"
                            : "Select all"}
                        </button>
                      )}
                      <select
                        value={selectedBusinessUnitForDepts}
                        onChange={(e) =>
                          setSelectedBusinessUnitForDepts(e.target.value)
                        }
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-900 placeholder-gray-400 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-osi-primary"
                      >
                        <option value="">All Departments</option>
                        {businessUnits.map((bu: BusinessUnit) => (
                          <option key={bu._id} value={bu._id}>
                            {bu.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {getFilteredDepartments().length === 0 ? (
                    <p className="text-gray-400 text-sm">
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
                              <span className="text-sm text-gray-600">
                                {dept.name}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
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

              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 border-t border-gray-200 bg-white px-6 py-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    createUserMutation.isPending || updateUserMutation.isPending
                  }
                  className="px-4 py-2 bg-osi-primary text-gray-900 rounded-lg hover:bg-osi-primary-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete User"
        message={`Delete ${deleteTarget?.firstName} ${deleteTarget?.lastName}? This action cannot be undone.`}
        confirmLabel="Delete"
        isPending={deleteUserMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteUser}
      />
    </div>
  );
};

export default UserManagement;
