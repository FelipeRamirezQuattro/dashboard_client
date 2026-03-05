import React from "react";
import { AppCategory } from "../../types/app.types";

interface SidebarProps {
  selectedCategory: AppCategory | "all";
  onCategoryChange: (category: AppCategory | "all") => void;
}

const categories: {
  value: AppCategory | "all";
  label: string;
  icon: string;
}[] = [
  { value: "all", label: "All Apps", icon: "grid_view" },
  { value: "gas", label: "Gas Separation", icon: "air" },
  { value: "chemical", label: "Chemical Treatment", icon: "science" },
  { value: "sand", label: "Sand Control", icon: "grain" },
  { value: "pumps", label: "Pumps Tracker", icon: "water_pump" },
  { value: "admin", label: "Admin Tools", icon: "admin_panel_settings" },
  { value: "other", label: "Other", icon: "more_horiz" },
];

const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <aside className="w-64 border-r border-osi-primary/10 bg-white hidden lg:flex flex-col p-4 gap-6 min-h-[calc(100vh-73px)]">
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-osi-secondary mb-4 px-3">
          Categories
        </h2>
        <nav className="space-y-1">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => onCategoryChange(category.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                selectedCategory === category.value
                  ? "bg-osi-primary/10 text-osi-primary font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {category.icon}
              </span>
              <span className="text-sm">{category.label}</span>
            </button>
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

export default Sidebar;
