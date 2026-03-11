import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "businessUnit":
        return "corporate_fare";
      case "department":
        return "domain";
      case "app":
        return "apps";
      default:
        return "search";
    }
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
    <div className="fixed inset-0 bg-white z-50 flex flex-col lg:hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="p-2 -ml-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
            aria-label="Close search"
          >
            <span
              className="material-symbols-outlined text-2xl text-gray-600"
              aria-hidden="true"
            >
              arrow_back
            </span>
          </button>
          <div className="flex-1 relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-xl"
              aria-hidden="true"
            >
              search
            </span>
            <input
              ref={inputRef}
              type="search"
              placeholder="Search apps, business units, departments…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary focus:border-transparent text-base"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-200 active:bg-gray-300 rounded-full transition-colors touch-manipulation"
                aria-label="Clear search"
              >
                <span
                  className="material-symbols-outlined text-lg text-gray-500"
                  aria-hidden="true"
                >
                  close
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {!searchQuery.trim() ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <span
              className="material-symbols-outlined text-6xl text-gray-300 mb-4"
              aria-hidden="true"
            >
              search
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Search OSI Dashboard
            </h3>
            <p className="text-sm text-gray-500">
              Find applications, business units, and departments
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <span
              className="material-symbols-outlined text-6xl text-gray-300 mb-4"
              aria-hidden="true"
            >
              search_off
            </span>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-sm text-gray-500">
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <div className="py-2">
            {searchResults.map((result, index) => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => handleResultClick(result)}
                className={`w-full px-4 py-4 transition-colors text-left flex items-start gap-3 touch-manipulation active:bg-gray-100 ${
                  index === selectedIndex
                    ? "bg-osi-primary/10"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`material-symbols-outlined text-2xl mt-0.5 flex-shrink-0 ${
                    result.type === "businessUnit"
                      ? "text-osi-primary"
                      : result.type === "department"
                        ? "text-blue-600"
                        : "text-green-600"
                  }`}
                  aria-hidden="true"
                >
                  {getResultIcon(result.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-base font-semibold text-gray-900 truncate">
                      {result.name}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 flex-shrink-0">
                      {getResultTypeLabel(result.type)}
                    </span>
                  </div>
                  {result.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {result.description}
                    </p>
                  )}
                  {result.businessUnitName && (
                    <p className="text-xs text-gray-400 mt-1">
                      {result.businessUnitName}
                    </p>
                  )}
                </div>
                <span
                  className="material-symbols-outlined text-gray-400 flex-shrink-0"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileSearch;
