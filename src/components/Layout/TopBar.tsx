import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Logo,
  Navbar,
  SearchInput,
  cn,
} from "@odessa-separator/ui";
import {
  AppWindow,
  Building2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { getApps, launchApp } from "../../services/apps.service";
import { businessUnitService } from "../../services/businessUnit.service";
import { departmentService } from "../../services/department.service";
import { IExternalApp } from "../../types/app.types";
import { BusinessUnit } from "../../types/businessUnit.types";
import { Department } from "../../types/department.types";
import MobileNav from "./MobileNav";
import NotificationBell from "../NotificationBell";

interface SearchResult {
  id: string;
  name: string;
  type: "app" | "businessUnit" | "department";
  description?: string;
  businessUnitId?: string;
  businessUnitName?: string;
}

interface TopBarProps {
  sidebarCollapsed?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ sidebarCollapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const fullName = user ? `${user.firstName} ${user.lastName}` : "User";

  const { data: apps = [] } = useQuery({ queryKey: ["apps"], queryFn: getApps });
  const { data: businessUnits = [] } = useQuery({ queryKey: ["businessUnits"], queryFn: () => businessUnitService.getActiveBusinessUnits() });
  const { data: departments = [] } = useQuery({ queryKey: ["departments"], queryFn: () => departmentService.getActiveDepartments() });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!searchRef.current?.contains(target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];

    businessUnits.forEach((bu: BusinessUnit) => {
      if (bu.name.toLowerCase().includes(query) || bu.description.toLowerCase().includes(query)) {
        results.push({ id: bu._id, name: bu.name, type: "businessUnit", description: bu.description });
      }
    });

    departments.forEach((dept: Department) => {
      if (dept.name.toLowerCase().includes(query) || dept.description.toLowerCase().includes(query)) {
        const buId = typeof dept.businessUnitId === "object" ? dept.businessUnitId._id : dept.businessUnitId;
        const buName = typeof dept.businessUnitId === "object" ? dept.businessUnitId.name : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name || "";
        results.push({ id: dept._id, name: dept.name, type: "department", description: dept.description, businessUnitId: buId, businessUnitName: buName });
      }
    });

    apps.forEach((app: IExternalApp) => {
      if (app.name.toLowerCase().includes(query) || app.description.toLowerCase().includes(query)) {
        const buId = typeof app.businessUnitId === "object" ? app.businessUnitId._id : app.businessUnitId;
        const buName = typeof app.businessUnitId === "object" ? app.businessUnitId.name : businessUnits.find((bu: BusinessUnit) => bu._id === buId)?.name || "";
        results.push({ id: app._id, name: app.name, type: "app", description: app.description, businessUnitId: buId, businessUnitName: buName });
      }
    });

    return results.slice(0, 10);
  }, [searchQuery, apps, businessUnits, departments]);

  const handleResultClick = async (result: SearchResult) => {
    setSearchQuery("");
    setIsSearchFocused(false);
    if (result.type === "businessUnit") {
      navigate(`/business-unit/${result.id}`);
    } else if (result.type === "department" && result.businessUnitId) {
      navigate(`/business-unit/${result.businessUnitId}`);
    } else if (result.type === "app") {
      try {
        const response = await launchApp(result.id);
        if (response.launchUrl) window.open(response.launchUrl, "_blank", "noopener,noreferrer");
      } catch (error) {
        console.error("Failed to launch app:", error);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setIsSearchFocused(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length === 1) {
      handleResultClick(searchResults[0]);
    }
  };

  const resultIcons: Record<SearchResult["type"], LucideIcon> = {
    businessUnit: Building2,
    department: FolderTree,
    app: AppWindow,
  };

  const getResultTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "businessUnit": return "Business Unit";
      case "department": return "Department";
      case "app": return "Application";
      default: return "";
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  return (
    <Navbar
      className={cn(
        "fixed top-0 right-0 left-0 z-30 gap-2 px-3 transition-[left] motion-reduce:transition-none lg:gap-4 lg:px-6",
        sidebarCollapsed ? "lg:left-16" : "lg:left-64",
      )}
    >
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onOpenChange={setIsMobileNavOpen}
      />

      <Link to="/dashboard" className="flex shrink-0 items-center lg:hidden" aria-label="Dashboard">
        <Logo className="h-7 w-auto" decorative />
      </Link>

      <form onSubmit={handleSearch} className="min-w-0 max-w-2xl flex-1" role="search">
        <div className="relative" ref={searchRef}>
          <SearchInput
            aria-label="Search applications, business units, departments"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            className="pr-10"
          />
          {searchQuery && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              onClick={() => setSearchQuery("")}
              className="absolute top-1/2 right-1 size-8 -translate-y-1/2"
            >
              <X size={16} aria-hidden="true" />
            </Button>
          )}

          {isSearchFocused && searchQuery.trim() && (
            <div className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-card border border-border bg-surface py-2 text-text lg:absolute lg:inset-x-0 lg:top-full lg:mt-2 lg:max-h-96">
              {searchResults.length > 0 ? (
                searchResults.map((result) => {
                  const Icon = resultIcons[result.type];
                  return (
                    <Button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      variant="ghost"
                      onClick={() => handleResultClick(result)}
                      className="h-auto w-full justify-start gap-3 px-4 py-2.5 text-left font-normal whitespace-normal"
                    >
                      <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0 self-start" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{result.name}</span>
                        <span className="block truncate text-xs text-text-muted">
                          {getResultTypeLabel(result.type)}
                          {result.businessUnitName && result.type !== "businessUnit"
                            ? ` · ${result.businessUnitName}`
                            : ""}
                          {result.type === "app" ? " · Click to launch" : ""}
                        </span>
                        {result.description && (
                          <span className="block truncate text-xs text-text-muted">
                            {result.description}
                          </span>
                        )}
                      </span>
                    </Button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-text-muted">
                  <Search size={28} aria-hidden="true" />
                  <p>No results for "{searchQuery}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-1 lg:gap-3">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" aria-label={`User menu: ${fullName}`} className="h-auto gap-2 p-1">
              <span className="hidden text-right xl:block">
                <span className="block text-sm font-semibold">{fullName}</span>
                <span className="block text-xs font-normal text-text-muted capitalize">
                  {user?.role === "superadmin" ? "System Administrator" : user?.role}
                </span>
              </span>
              <Avatar name={fullName} decorative />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link to="/dashboard">
                <LayoutDashboard size={16} aria-hidden="true" />
                Dashboard
              </Link>
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link to="/admin">
                  <ShieldCheck size={16} aria-hidden="true" />
                  Admin Panel
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem destructive onSelect={handleLogout}>
              <LogOut size={16} aria-hidden="true" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Navbar>
  );
};

export default TopBar;
