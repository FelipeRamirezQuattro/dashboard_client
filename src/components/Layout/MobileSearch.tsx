import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, SearchInput, cn } from "@odessa-separator/ui";
import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  Building2,
  FolderTree,
  Search,
  SearchX,
  X,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getApps, launchApp } from "../../services/apps.service";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { IExternalApp } from "../../types/app.types";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";

interface SearchResult {
  id: string;
  name: string;
  type: "app" | "businessUnit" | "department";
  description?: string;
  businessUnitId?: string;
  businessUnitName?: string;
}

interface MobileSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSearch: React.FC<MobileSearchProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch data for search
  const { data: apps = [] } = useQuery({
    queryKey: ["apps"],
    queryFn: getApps,
  });

  const { data: businessUnits = [] } = useQuery({
    queryKey: ["businessUnits"],
    queryFn: () => businessUnitService.getActiveBusinessUnits(),
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments"],
    queryFn: () => departmentService.getActiveDepartments(),
  });

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setSearchQuery("");
    setSelectedIndex(-1);
    onClose();
  };

  // Filter and combine search results
  const searchResults = React.useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    // Search in business units
    businessUnits.forEach((bu: BusinessUnit) => {
      if (
        bu.name.toLowerCase().includes(query) ||
        bu.description.toLowerCase().includes(query)
      ) {
        results.push({
          id: bu._id,
          name: bu.name,
          type: "businessUnit",
          description: bu.description,
        });
      }
    });

    // Search in departments
    departments.forEach((dept: Department) => {
      if (
        dept.name.toLowerCase().includes(query) ||
        dept.description.toLowerCase().includes(query)
      ) {
        const buId =
          typeof dept.businessUnitId === "object"
            ? dept.businessUnitId._id
            : dept.businessUnitId;
        const buName =
          typeof dept.businessUnitId === "object"
            ? dept.businessUnitId.name
            : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name ||
              "";

        results.push({
          id: dept._id,
          name: dept.name,
          type: "department",
          description: dept.description,
          businessUnitId: buId,
          businessUnitName: buName,
        });
      }
    });

    // Search in applications
    apps.forEach((app: IExternalApp) => {
      if (
        app.name.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query)
      ) {
        const buId =
          typeof app.businessUnitId === "object"
            ? app.businessUnitId._id
            : app.businessUnitId;
        const buName =
          typeof app.businessUnitId === "object"
            ? app.businessUnitId.name
            : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name ||
              "";

        results.push({
          id: app._id,
          name: app.name,
          type: "app",
          description: app.description,
          businessUnitId: buId,
          businessUnitName: buName,
        });
      }
    });

    return results.slice(0, 20);
  }, [searchQuery, apps, businessUnits, departments]);

  const handleResultClick = async (result: SearchResult) => {
    handleClose();

    if (result.type === "businessUnit") {
      navigate(`/business-unit/${result.id}`);
    } else if (result.type === "department" && result.businessUnitId) {
      navigate(`/business-unit/${result.businessUnitId}`);
    } else if (result.type === "app") {
      try {
        const response = await launchApp(result.id);
        if (response.launchUrl) {
          window.open(response.launchUrl, "_blank", "noopener,noreferrer");
        }
      } catch (error) {
        console.error("Failed to launch app:", error);
      }
    }
  };

  const resultIcons: Record<SearchResult["type"], LucideIcon> = {
    businessUnit: Building2,
    department: FolderTree,
    app: AppWindow,
  };

  const getResultTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "businessUnit":
        return "Business Unit";
      case "department":
        return "Department";
      case "app":
        return "Application";
      default:
        return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      className="fixed inset-0 z-50 flex flex-col bg-bg text-text lg:hidden"
    >
      <div className="sticky top-0 flex shrink-0 items-center gap-3 border-b border-border bg-surface px-4 py-3">
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close search">
          <ArrowLeft size={20} aria-hidden="true" />
        </Button>
        <div className="relative flex-1">
          <SearchInput
            ref={inputRef}
            aria-label="Search apps, business units, departments"
            placeholder="Search apps, business units, departments…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
            >
              <X size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!searchQuery.trim() ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <Search size={40} aria-hidden="true" className="text-text-muted" />
            <h2 className="text-base font-semibold">Search OSI Dashboard</h2>
            <p className="text-sm text-text-muted">
              Find applications, business units, and departments
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
            <SearchX size={40} aria-hidden="true" className="text-text-muted" />
            <h2 className="text-base font-semibold">No results found</h2>
            <p className="text-sm text-text-muted">Try searching with different keywords</p>
          </div>
        ) : (
          <div className="py-2">
            {searchResults.map((result, index) => {
              const Icon = resultIcons[result.type];
              return (
                <Button
                  key={`${result.type}-${result.id}`}
                  variant="ghost"
                  onClick={() => handleResultClick(result)}
                  className={cn(
                    "h-auto w-full justify-start gap-3 border-b border-border px-4 py-4 text-left font-normal whitespace-normal",
                    index === selectedIndex && "bg-surface-muted",
                  )}
                >
                  <Icon size={20} aria-hidden="true" className="mt-0.5 shrink-0 self-start" />
                  <span className="min-w-0 flex-1">
                    <span className="mb-1 flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{result.name}</span>
                      <Badge variant="neutral">{getResultTypeLabel(result.type)}</Badge>
                    </span>
                    {result.description && (
                      <span className="line-clamp-2 block text-xs text-text-muted">
                        {result.description}
                      </span>
                    )}
                    {result.businessUnitName && (
                      <span className="mt-1 block text-xs text-text-muted">
                        {result.businessUnitName}
                      </span>
                    )}
                  </span>
                  <ArrowRight size={18} aria-hidden="true" className="shrink-0 self-center" />
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearch;
