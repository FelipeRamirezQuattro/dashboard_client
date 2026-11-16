import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  DataTable,
  DataTableToolbar,
  Field,
  Select,
  useDataTable,
  type ActiveFilter,
  type DataTableColumn,
} from "@odessa-separator/ui";
import {
  CheckCircle2,
  Download,
  Edit2,
  Link2,
  Trash2,
  Unlink,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import api from "../../services/api";
import { IUser, UserRole } from "../../types/user.types";
import { UserPermission } from "../../types/permission.types";
import { permissionsService } from "../../services/permissions.service";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import ConfirmationModal from "../../components/ConfirmationModal";
import { useAuth } from "../../hooks/useAuth";
import { exportRowsToCsv } from "../../utils/csvExport";
import UserFormDialog, { type UserFormData } from "./UserFormDialog";

type RoleFilter = "all" | UserRole;
type StatusFilter = "all" | "active" | "inactive";
type SsoFilter = "all" | "linked" | "not-linked";

const ITEMS_PER_PAGE = 4;

const emptyForm: UserFormData = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "viewer",
  isActive: true,
  businessUnitIds: [],
  departmentIds: [],
};

const roleLabels: Record<UserRole, string> = {
  viewer: "Viewer",
  editor: "Editor",
  admin: "Admin",
  superadmin: "Super Admin",
};

// Stable default so the query result keeps the same reference while loading (effect dependency).
const NO_PERMISSIONS: UserPermission[] = [];

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
    } else if (perm.businessUnitId && typeof perm.businessUnitId === "string") {
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

const getFullName = (user: IUser) => `${user.firstName} ${user.lastName}`;

// Role badge tone (was amber for superadmin, blue for admin, gray otherwise).
const getRoleBadgeVariant = (role: string) => {
  switch (role.toUpperCase()) {
    case "SUPERADMIN":
      return "warning" as const;
    case "ADMIN":
      return "info" as const;
    default:
      return "neutral" as const;
  }
};

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  // Kept while the dialog animates closed so the title and password fields do not flip.
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [ssoFilter, setSsoFilter] = useState<SsoFilter>("all");
  const [deleteOpen, setDeleteOpen] = useState(false);
  // Kept after the dialog closes so the message never reads "undefined" while it animates out.
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
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
  const { data: userPermissions = NO_PERMISSIONS } = useQuery({
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

  // Form handlers. Form values are reset when the dialog is opened, so the title and fields do
  // not change while the dialog animates closed.
  const resetDialogState = () => {
    setErrors({});
    setSelectedBusinessUnitForDepts("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setFormData(emptyForm);
    resetDialogState();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (target: IUser) => {
    // The effect above reloads the form when this user's permissions arrive; seed it now (with
    // any cached permissions) so the previous form never shows while they load.
    const cachedPermissions =
      queryClient.getQueryData<UserPermission[]>([
        "userPermissions",
        target._id,
      ]) ?? [];
    setFormData({
      firstName: target.firstName,
      lastName: target.lastName,
      email: target.email,
      password: "",
      confirmPassword: "",
      role: target.role,
      isActive: target.isActive,
      businessUnitIds: extractBusinessUnitIds(cachedPermissions),
      departmentIds: extractDepartmentIds(cachedPermissions),
    });
    resetDialogState();
    setSelectedUser(target);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
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

  const confirmDeleteUser = () => {
    if (!deleteTarget) return;
    deleteUserMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteOpen(false),
    });
  };

  // One predicate for the table and the CSV export: search (name or email) + role, status, SSO.
  const matches = (item: IUser) => {
    const query = searchTerm.toLowerCase();
    const fullName = getFullName(item).toLowerCase();
    const matchesSearch =
      fullName.includes(query) || item.email.toLowerCase().includes(query);
    const matchesRole = roleFilter === "all" || item.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && item.isActive) ||
      (statusFilter === "inactive" && !item.isActive);
    const matchesSso =
      ssoFilter === "all" ||
      (ssoFilter === "linked" && Boolean(item.microsoftId)) ||
      (ssoFilter === "not-linked" && !item.microsoftId);
    return matchesSearch && matchesRole && matchesStatus && matchesSso;
  };

  // The search lives in `searchTerm` (old matching rules), so `searchText` is not passed and the
  // hook's own search is unused. The initial sort key has no sorter: the API order is kept until
  // a column header is clicked.
  const table = useDataTable<IUser>(users ?? [], {
    filter: matches,
    sorters: {
      name: (a, b) => getFullName(a).localeCompare(getFullName(b)),
      email: (a, b) => a.email.localeCompare(b.email),
      role: (a, b) => a.role.localeCompare(b.role),
      sso: (a, b) => Number(Boolean(b.microsoftId)) - Number(Boolean(a.microsoftId)),
      status: (a, b) => Number(b.isActive) - Number(a.isActive),
    },
    initialSort: { key: "default", direction: "ascending" },
    pageSize: ITEMS_PER_PAGE,
  });

  const changeSearch = (value: string) => {
    setSearchTerm(value);
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
  const changeSsoFilter = (value: SsoFilter) => {
    setSsoFilter(value);
    table.resetPage();
  };
  const clearFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setSsoFilter("all");
    table.resetPage();
  };

  const activeFilters: ActiveFilter[] = [];
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
  if (ssoFilter !== "all") {
    activeFilters.push({
      key: "sso",
      label: `SSO: ${ssoFilter === "linked" ? "Linked" : "Not Linked"}`,
      onClear: () => changeSsoFilter("all"),
    });
  }

  const filteredUsers = (users ?? []).filter(matches);

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

  // "Showing X-Y of N users" line under the table (as before).
  const totalUsers = table.total;
  const startIndex = (table.page - 1) * ITEMS_PER_PAGE;
  const showingStart = totalUsers === 0 ? 0 : startIndex + 1;
  const showingEnd = Math.min(startIndex + ITEMS_PER_PAGE, totalUsers);

  const columns: DataTableColumn<IUser>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      cell: (item) => (
        <span className="flex items-center gap-3 whitespace-nowrap font-semibold text-text">
          <Avatar name={getFullName(item)} decorative />
          {item.firstName} {item.lastName}
        </span>
      ),
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      cell: (item) => (
        <span className="whitespace-nowrap text-text-muted">{item.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      cell: (item) => (
        <Badge variant={getRoleBadgeVariant(item.role)}>
          {item.role.toUpperCase()}
        </Badge>
      ),
    },
    {
      key: "sso",
      header: "SSO Status",
      sortable: true,
      cell: (item) =>
        item.microsoftId ? (
          <Badge variant="success">
            <Link2 className="size-3" aria-hidden="true" />
            Linked
          </Badge>
        ) : (
          <Badge variant="neutral">
            <Unlink className="size-3" aria-hidden="true" />
            Not Linked
          </Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      cell: (item) => (
        <Badge variant={item.isActive ? "success" : "neutral"}>
          {item.isActive ? (
            <CheckCircle2 className="size-3" aria-hidden="true" />
          ) : (
            <XCircle className="size-3" aria-hidden="true" />
          )}
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (item) => (
        <span className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Edit ${getFullName(item)}`}
            title="Edit user"
            onClick={() => handleOpenEditModal(item)}
          >
            <Edit2 className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete ${getFullName(item)}`}
            title="Delete user"
            onClick={() => {
              setDeleteTarget({ id: item._id, name: getFullName(item) });
              setDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </span>
      ),
    },
  ];

  return (
    <section
      aria-labelledby="users-heading"
      className="flex flex-col gap-4 py-6"
    >
      <h2
        id="users-heading"
        className="flex items-center gap-2 text-xl font-semibold text-text"
      >
        <Users className="size-6 text-text-muted" aria-hidden="true" />
        User Directory
      </h2>

      <DataTableToolbar
        searchLabel="Search users"
        searchPlaceholder="Search users..."
        search={searchTerm}
        onSearchChange={changeSearch}
        resultCount={table.total}
        filters={
          <div className="flex flex-col gap-4">
            <Field label="Role">
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
                  <option value="superadmin">Super Admin</option>
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
            <Field label="SSO">
              {(control) => (
                <Select
                  {...control}
                  value={ssoFilter}
                  onChange={(event) =>
                    changeSsoFilter(event.target.value as SsoFilter)
                  }
                >
                  <option value="all">All SSO States</option>
                  <option value="linked">Linked</option>
                  <option value="not-linked">Not Linked</option>
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
            <Button onClick={handleOpenCreateModal}>
              <UserPlus className="size-4" aria-hidden="true" />
              Add User
            </Button>
          </>
        }
      />

      {error ? (
        <Alert variant="danger">Failed to load users</Alert>
      ) : (
        <>
          <DataTable
            caption="Users"
            columns={columns}
            rows={table.rows}
            getRowKey={(item) => item._id}
            sort={table.sort}
            onSortChange={table.toggleSort}
            page={table.page}
            pageCount={table.pageCount}
            onPageChange={table.setPage}
            loading={isLoading}
            loadingLabel="Loading users"
            empty={{ title: "No users found" }}
          />
          {!isLoading && (
            <p className="text-sm font-medium uppercase text-text-muted">
              Showing {showingStart}-{showingEnd} of {totalUsers} users
            </p>
          )}
        </>
      )}

      <UserFormDialog
        open={isModalOpen}
        onClose={handleCloseModal}
        isEdit={isEditMode}
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        busy={createUserMutation.isPending || updateUserMutation.isPending}
        onSubmit={handleSubmit}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        businessUnits={businessUnits}
        allDepartments={allDepartments}
        selectedBusinessUnitForDepts={selectedBusinessUnitForDepts}
        setSelectedBusinessUnitForDepts={setSelectedBusinessUnitForDepts}
      />

      <ConfirmationModal
        isOpen={deleteOpen}
        title="Delete User"
        message={`Delete ${deleteTarget?.name ?? ""}? This action cannot be undone.`}
        confirmLabel="Delete"
        isPending={deleteUserMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDeleteUser}
      />
    </section>
  );
};

export default UserManagement;
