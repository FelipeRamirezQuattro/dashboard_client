import React from "react";
import {
  Button,
  Checkbox,
  Field,
  Fieldset,
  FormDialog,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Select,
} from "@odessa-separator/ui";
import { Eye, EyeOff } from "lucide-react";
import { UserRole } from "../../types/user.types";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import UserAccessFields from "./UserAccessFields";

export interface UserFormData {
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

interface PasswordInputProps {
  control: React.ComponentProps<typeof InputGroupInput>;
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggleVisible: () => void;
  /** Constant accessible name of the reveal toggle; its state is carried by aria-pressed. */
  toggleLabel: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  control,
  value,
  onChange,
  placeholder,
  visible,
  onToggleVisible,
  toggleLabel,
}) => (
  <InputGroup>
    <InputGroupInput
      {...control}
      type={visible ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
    <InputGroupAddon className="px-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={toggleLabel}
        aria-pressed={visible}
        onClick={onToggleVisible}
      >
        {visible ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </Button>
    </InputGroupAddon>
  </InputGroup>
);

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Edit mode (kept while the dialog animates closed, so the title does not flip). */
  isEdit: boolean;
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  errors: Record<string, string>;
  busy: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  showConfirmPassword: boolean;
  setShowConfirmPassword: React.Dispatch<React.SetStateAction<boolean>>;
  businessUnits: BusinessUnit[];
  allDepartments: Department[];
  selectedBusinessUnitForDepts: string;
  setSelectedBusinessUnitForDepts: (value: string) => void;
}

const UserFormDialog: React.FC<UserFormDialogProps> = ({
  open,
  onClose,
  isEdit,
  formData,
  setFormData,
  errors,
  busy,
  onSubmit,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  businessUnits,
  allDepartments,
  selectedBusinessUnitForDepts,
  setSelectedBusinessUnitForDepts,
}) => (
  <FormDialog
    open={open}
    onOpenChange={(next) => {
      if (!next) onClose();
    }}
    title={isEdit ? "Edit User" : "Create New User"}
    description="Basic information, role and the business units and departments the user can access."
    submitLabel={isEdit ? "Update User" : "Create User"}
    busy={busy}
    onSubmit={onSubmit}
  >
    <Fieldset legend="Basic Information">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="First Name" required error={errors.firstName}>
          {(control) => (
            <Input
              {...control}
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Enter first name"
            />
          )}
        </Field>

        <Field label="Last Name" required error={errors.lastName}>
          {(control) => (
            <Input
              {...control}
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Enter last name"
            />
          )}
        </Field>

        <Field label="Email" required error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="user@example.com"
            />
          )}
        </Field>

        <Field
          label="Password"
          required={!isEdit}
          hint={isEdit ? "(leave blank to keep current)" : undefined}
          error={errors.password}
        >
          {(control) => (
            <PasswordInput
              control={control}
              value={formData.password}
              onChange={(value) =>
                setFormData({ ...formData, password: value })
              }
              placeholder={isEdit ? "••••••••" : "Enter password"}
              visible={showPassword}
              onToggleVisible={() => setShowPassword((value) => !value)}
              toggleLabel="Show password"
            />
          )}
        </Field>

        {!isEdit && (
          <Field
            label="Confirm Password"
            required
            error={errors.confirmPassword}
          >
            {(control) => (
              <PasswordInput
                control={control}
                value={formData.confirmPassword}
                onChange={(value) =>
                  setFormData({ ...formData, confirmPassword: value })
                }
                placeholder="Confirm password"
                visible={showConfirmPassword}
                onToggleVisible={() =>
                  setShowConfirmPassword((value) => !value)
                }
                toggleLabel="Show confirm password"
              />
            )}
          </Field>
        )}

        <Field label="Role" required>
          {(control) => (
            <Select
              {...control}
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as UserRole,
                })
              }
            >
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </Select>
          )}
        </Field>

        <Fieldset legend="Status">
          <Checkbox
            label="Active"
            checked={formData.isActive}
            onChange={(e) =>
              setFormData({
                ...formData,
                isActive: e.target.checked,
              })
            }
          />
        </Fieldset>
      </div>
    </Fieldset>

    <UserAccessFields
      formData={formData}
      setFormData={setFormData}
      businessUnits={businessUnits}
      allDepartments={allDepartments}
      selectedBusinessUnitForDepts={selectedBusinessUnitForDepts}
      setSelectedBusinessUnitForDepts={setSelectedBusinessUnitForDepts}
    />
  </FormDialog>
);

export default UserFormDialog;
