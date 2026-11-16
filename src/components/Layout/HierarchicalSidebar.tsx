import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import {
  Badge,
  Sidebar,
  SidebarItem,
  SidebarItemLabel,
  SidebarNav,
  SidebarSectionLabel,
} from "@odessa-separator/ui";
import {
  AppWindow,
  Building2,
  FolderTree,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { IExternalApp } from "../../types/app.types";

interface HierarchicalSidebarProps {
  apps: IExternalApp[];
  onAppClick: (app: IExternalApp) => void;
}

const HierarchicalSidebar: React.FC<HierarchicalSidebarProps> = ({
  apps,
  onAppClick,
}) => {
  const [expandedBUs, setExpandedBUs] = useState<Set<string>>(new Set());
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const { data: businessUnits } = useQuery({
    queryKey: ["businessUnits", "active"],
    queryFn: businessUnitService.getActiveBusinessUnits,
  });

  const { data: departments } = useQuery({
    queryKey: ["departments", "active"],
    queryFn: departmentService.getActiveDepartments,
  });

  const toggleBU = (buId: string) => {
    const newExpanded = new Set(expandedBUs);
    if (newExpanded.has(buId)) {
      newExpanded.delete(buId);
    } else {
      newExpanded.add(buId);
    }
    setExpandedBUs(newExpanded);
  };

  const toggleDept = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  // Group apps by business unit and department
  const hierarchy = businessUnits?.map((bu) => {
    const buDepartments = departments?.filter((dept) => {
      const deptBuId =
        typeof dept.businessUnitId === "object"
          ? dept.businessUnitId._id
          : dept.businessUnitId;
      return deptBuId === bu._id;
    });

    return {
      businessUnit: bu,
      departments:
        buDepartments?.map((dept) => {
          const deptApps = apps.filter((app) => {
            const appDeptId =
              typeof app.departmentId === "object"
                ? app.departmentId._id
                : app.departmentId;
            return appDeptId === dept._id;
          });

          return {
            department: dept,
            apps: deptApps,
          };
        }) || [],
    };
  });

  // The library has no tree item: each row is a flat SidebarItem, indented by level, that
  // toggles its children (see docs/superpowers/library-gaps.md).
  const toggleProps = (expanded: boolean, onToggle: () => void) => ({
    href: "#",
    role: "button" as const,
    "aria-expanded": expanded,
    onClick: (e: React.MouseEvent) => {
      e.preventDefault();
      onToggle();
    },
  });

  return (
    <Sidebar className="hidden min-h-[calc(100vh-56px)] w-80 overflow-y-auto lg:flex">
      <SidebarNav aria-label="Applications by business unit" className="flex-1">
        <SidebarSectionLabel>Applications</SidebarSectionLabel>
        {hierarchy?.map(({ businessUnit, departments }) => {
          const buOpen = expandedBUs.has(businessUnit._id);
          return (
            <React.Fragment key={businessUnit._id}>
              <SidebarItem
                {...toggleProps(buOpen, () => toggleBU(businessUnit._id))}
                className="font-semibold"
              >
                {buOpen ? (
                  <ChevronDown size={16} aria-hidden="true" />
                ) : (
                  <ChevronRight size={16} aria-hidden="true" />
                )}
                <Building2 size={18} aria-hidden="true" />
                <SidebarItemLabel className="flex-1 text-sm">
                  {businessUnit.name}
                </SidebarItemLabel>
              </SidebarItem>

              {buOpen &&
                departments.map(({ department, apps: deptApps }) => {
                  const deptOpen = expandedDepts.has(department._id);
                  return (
                    <React.Fragment key={department._id}>
                      <SidebarItem
                        {...toggleProps(deptOpen, () => toggleDept(department._id))}
                        className="ml-6"
                      >
                        {deptOpen ? (
                          <ChevronDown size={16} aria-hidden="true" />
                        ) : (
                          <ChevronRight size={16} aria-hidden="true" />
                        )}
                        <FolderTree size={16} aria-hidden="true" />
                        <SidebarItemLabel className="flex-1 text-sm">
                          {department.name}
                        </SidebarItemLabel>
                        <Badge variant="neutral">{deptApps.length}</Badge>
                      </SidebarItem>

                      {deptOpen && (
                        <>
                          {deptApps.map((app) => (
                            <SidebarItem
                              key={app._id}
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                onAppClick(app);
                              }}
                              className="ml-12"
                            >
                              {app.iconUrl ? (
                                <img src={app.iconUrl} alt="" className="size-4" />
                              ) : (
                                <AppWindow size={16} aria-hidden="true" />
                              )}
                              <SidebarItemLabel className="flex-1 truncate text-sm">
                                {app.name}
                              </SidebarItemLabel>
                              {app.comingSoon && <Badge variant="warning">Soon</Badge>}
                            </SidebarItem>
                          ))}
                          {deptApps.length === 0 && (
                            <li className="ml-12 px-3 py-2 text-xs italic opacity-70">
                              No applications
                            </li>
                          )}
                        </>
                      )}
                    </React.Fragment>
                  );
                })}
              {buOpen && departments.length === 0 && (
                <li className="ml-6 px-3 py-2 text-xs italic opacity-70">No departments</li>
              )}
            </React.Fragment>
          );
        })}
      </SidebarNav>

      <div className="mt-auto flex items-center gap-2 border-t border-on-nav/20 px-3 pt-3">
        <span className="text-xs font-medium">Server Status</span>
        <Badge variant="success">Operational</Badge>
      </div>
    </Sidebar>
  );
};

export default HierarchicalSidebar;
