import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Avatar,
  Badge,
  Button,
  Logo,
  Separator,
  SidebarDrawer,
  SidebarDrawerContent,
  SidebarDrawerTrigger,
  SidebarHeader,
  SidebarItem,
  SidebarItemLabel,
  SidebarNav,
  SidebarSectionLabel,
  sidebarItemVariants,
} from "@odessa-separator/ui";
import {
  Brain,
  Droplets,
  FileText,
  FlaskConical,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  MoreHorizontal,
  ShieldCheck,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { AppCategory } from "../../types/app.types";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChange: (open: boolean) => void;
  selectedCategory?: AppCategory | "all";
  onCategoryChange?: (category: AppCategory | "all") => void;
  showCategories?: boolean;
}

const categories: {
  value: AppCategory | "all";
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "all", label: "All Apps", icon: LayoutGrid },
  { value: "gas", label: "Gas Separation", icon: Wind },
  { value: "chemical", label: "Chemical Treatment", icon: FlaskConical },
  { value: "sand", label: "Sand Control", icon: Layers },
  { value: "pumps", label: "Pumps Tracker", icon: Droplets },
  { value: "admin", label: "Admin Tools", icon: ShieldCheck },
  { value: "other", label: "Other", icon: MoreHorizontal },
];

const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  onOpenChange,
  selectedCategory,
  onCategoryChange,
  showCategories = false,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    onClose();
    navigate("/login");
  };

  const handleCategorySelect = (category: AppCategory | "all") => {
    if (onCategoryChange) {
      onCategoryChange(category);
    }
    onClose();
  };

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";
  const path = location.pathname;
  const fullName = user ? `${user.firstName} ${user.lastName}` : "";

  const links: { to: string; label: string; icon: LucideIcon; active: boolean; show: boolean }[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, active: path === "/dashboard", show: true },
    { to: "/workflow-brain", label: "Workflow Brain", icon: Brain, active: path.startsWith("/workflow-brain"), show: true },
    { to: "/file-bank", label: "File Bank", icon: FileText, active: path.startsWith("/file-bank"), show: isAdmin },
    { to: "/admin/users", label: "Admin Panel", icon: ShieldCheck, active: path.startsWith("/admin"), show: isAdmin },
  ];

  return (
    <SidebarDrawer open={isOpen} onOpenChange={onOpenChange}>
      <SidebarDrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          className="shrink-0 lg:hidden"
        >
          <Menu size={20} aria-hidden="true" />
        </Button>
      </SidebarDrawerTrigger>

      <SidebarDrawerContent title="Main navigation" closeLabel="Close navigation menu">
        <SidebarHeader className="flex items-center gap-3">
          <Logo className="h-8 w-auto" decorative />
          <span>OSI Dashboard</span>
        </SidebarHeader>

        {user && (
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={fullName} decorative />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{fullName}</p>
              <p className="truncate text-xs opacity-80">{user.email}</p>
            </div>
          </div>
        )}

        <Separator className="bg-on-nav/20" />

        <SidebarNav aria-label="Main" className="flex-1">
          <SidebarSectionLabel>Navigation</SidebarSectionLabel>
          {links
            .filter((l) => l.show)
            .map(({ to, label, icon: Icon, active }) => (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={sidebarItemVariants({ active })}
                >
                  <Icon size={20} aria-hidden="true" />
                  <SidebarItemLabel className="text-sm">{label}</SidebarItemLabel>
                </Link>
              </li>
            ))}

          {showCategories && selectedCategory !== undefined && (
            <>
              <SidebarSectionLabel>Categories</SidebarSectionLabel>
              {categories.map(({ value, label, icon: Icon }) => (
                <SidebarItem
                  key={value}
                  href="#"
                  role="button"
                  aria-pressed={selectedCategory === value}
                  active={selectedCategory === value}
                  onClick={(e) => {
                    e.preventDefault();
                    handleCategorySelect(value);
                  }}
                >
                  <Icon size={20} aria-hidden="true" />
                  <SidebarItemLabel className="text-sm">{label}</SidebarItemLabel>
                </SidebarItem>
              ))}
            </>
          )}
        </SidebarNav>

        <div className="flex items-center gap-2 px-3 py-2">
          <span className="text-xs font-medium">Server Status</span>
          <Badge variant="success">Operational</Badge>
        </div>

        <Button
          variant="outline"
          onClick={handleLogout}
          className="border-on-nav/40 bg-transparent text-on-nav hover:bg-on-nav/10"
        >
          <LogOut size={18} aria-hidden="true" />
          Sign Out
        </Button>
      </SidebarDrawerContent>
    </SidebarDrawer>
  );
};

export default MobileNav;
