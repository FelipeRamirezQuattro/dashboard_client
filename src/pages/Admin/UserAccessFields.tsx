import React from "react";
import { Button, Checkbox, Fieldset, Select } from "@odessa-separator/ui";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import type { UserFormData } from "./UserFormDialog";

interface UserAccessFieldsProps {
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
  businessUnits: BusinessUnit[];
  allDepartments: Department[];
  /** Business unit the department list is narrowed to ("" = all departments). */
  selectedBusinessUnitForDepts: string;
  setSelectedBusinessUnitForDepts: (value: string) => void;
}

const listClasses =
  "flex max-h-48 flex-col gap-2 overflow-y-auto rounded-control border border-border p-4";

/**
 * Business unit and department access of a user, as checkbox lists (the library has no
 * multi-select; see docs/superpowers/library-gaps.md).
 */
const UserAccessFields: React.FC<UserAccessFieldsProps> = ({
  formData,
  setFormData,
  businessUnits,
  allDepartments,
  selectedBusinessUnitForDepts,
  setSelectedBusinessUnitForDepts,
}) => {
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

  const filteredDepartments = getFilteredDepartments();

  const handleFilteredDepartmentsToggle = () => {
    const filteredDepartmentIds = filteredDepartments.map((dept) => dept._id);
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

  const allBusinessUnitsSelected = businessUnits.every((bu) =>
    formData.businessUnitIds.includes(bu._id),
  );
  const allFilteredDepartmentsSelected = filteredDepartments.every((dept) =>
    formData.departmentIds.includes(dept._id),
  );

  return (
    <>
      <Fieldset legend="Business Units">
        {businessUnits.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAllBusinessUnitsToggle}
              aria-label={`${allBusinessUnitsSelected ? "Clear all" : "Select all"} business units`}
            >
              {allBusinessUnitsSelected ? "Clear all" : "Select all"}
            </Button>
          </div>
        )}
        <div className={listClasses}>
          {businessUnits.length === 0 ? (
            <p className="text-sm text-text-muted">
              No business units available
            </p>
          ) : (
            businessUnits.map((bu: BusinessUnit) => (
              <Checkbox
                key={bu._id}
                label={bu.name}
                checked={formData.businessUnitIds.includes(bu._id)}
                onChange={() => handleBusinessUnitToggle(bu._id)}
              />
            ))
          )}
        </div>
      </Fieldset>

      <Fieldset legend="Departments">
        {allDepartments.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {filteredDepartments.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFilteredDepartmentsToggle}
                aria-label={`${allFilteredDepartmentsSelected ? "Clear all" : "Select all"} departments`}
              >
                {allFilteredDepartmentsSelected ? "Clear all" : "Select all"}
              </Button>
            )}
            <Select
              aria-label="Show departments of business unit"
              className="w-auto"
              value={selectedBusinessUnitForDepts}
              onChange={(e) => setSelectedBusinessUnitForDepts(e.target.value)}
            >
              <option value="">All Departments</option>
              {businessUnits.map((bu: BusinessUnit) => (
                <option key={bu._id} value={bu._id}>
                  {bu.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className={listClasses}>
          {filteredDepartments.length === 0 ? (
            <p className="text-sm text-text-muted">No departments available</p>
          ) : (
            filteredDepartments.map((dept: Department) => {
              const buName =
                typeof dept.businessUnitId === "object" &&
                dept.businessUnitId !== null
                  ? dept.businessUnitId.name
                  : businessUnits.find(
                      (bu: BusinessUnit) => bu._id === dept.businessUnitId,
                    )?.name || "";
              return (
                <Checkbox
                  key={dept._id}
                  label={dept.name}
                  hint={`(${buName})`}
                  checked={formData.departmentIds.includes(dept._id)}
                  onChange={() => handleDepartmentToggle(dept._id)}
                />
              );
            })
          )}
        </div>
      </Fieldset>
    </>
  );
};

export default UserAccessFields;
