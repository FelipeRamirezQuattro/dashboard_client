import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { Building2, FolderTree, ChevronRight, ChevronDown } from "lucide-react";
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

  return (
    <aside className="w-80 border-r border-osi-primary/10 bg-white hidden lg:flex flex-col p-4 gap-4 min-h-[calc(100vh-73px)] overflow-y-auto">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-osi-secondary mb-4 px-3">
          Applications
        </h2>

        <nav className="space-y-1">
          {hierarchy?.map(({ businessUnit, departments }) => (
            <div key={businessUnit._id} className="mb-2">
              {/* Business Unit */}
              <button
                onClick={() => toggleBU(businessUnit._id)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-slate-50 text-osi-dark font-semibold"
              >
                {expandedBUs.has(businessUnit._id) ? (
                  <ChevronDown className="w-4 h-4 text-osi-primary" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                <Building2 className="w-5 h-5 text-osi-primary" />
                <span className="text-sm flex-1">{businessUnit.name}</span>
              </button>

              {/* Departments */}
              {expandedBUs.has(businessUnit._id) && (
                <div className="ml-6 mt-1 space-y-1">
                  {departments.map(({ department, apps: deptApps }) => (
                    <div key={department._id}>
                      <button
                        onClick={() => toggleDept(department._id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-slate-50 text-osi-secondary"
                      >
                        {expandedDepts.has(department._id) ? (
                          <ChevronDown className="w-4 h-4 text-osi-secondary" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <FolderTree className="w-4 h-4 text-osi-secondary" />
                        <span className="text-sm flex-1">
                          {department.name}
                        </span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {deptApps.length}
                        </span>
                      </button>

                      {/* Applications */}
                      {expandedDepts.has(department._id) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {deptApps.map((app) => (
                            <button
                              key={app._id}
                              onClick={() => onAppClick(app)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:bg-osi-primary/10 text-slate-700 hover:text-osi-primary"
                            >
                              {app.iconUrl ? (
                                <img
                                  src={app.iconUrl}
                                  alt=""
                                  className="w-4 h-4 rounded"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-base">
                                  apps
                                </span>
                              )}
                              <span className="text-sm truncate">
                                {app.name}
                              </span>
                              {app.comingSoon && (
                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  Soon
                                </span>
                              )}
                            </button>
                          ))}
                          {deptApps.length === 0 && (
                            <div className="px-3 py-2 text-xs text-gray-400 italic">
                              No applications
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {departments.length === 0 && (
                    <div className="px-3 py-2 text-xs text-gray-400 italic">
                      No departments
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4 bg-slate-50 rounded-xl">
        <p className="text-xs text-osi-secondary font-medium">Server Status</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-semibold">Operational</span>
        </div>
      </div>
    </aside>
  );
};

export default HierarchicalSidebar;
