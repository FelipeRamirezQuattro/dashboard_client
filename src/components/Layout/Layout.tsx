import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import ChatbotWidget from "../../features/chatbot/ChatbotWidget";

const STORAGE_KEY = "osi_sidebar_collapsed";

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{ background: "#f4f5f7" }}>
      {/* Sidebar always visible on desktop */}
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />

      {/* Main content area offset by sidebar */}
      <div
        className="transition-all duration-[250ms] ease-in-out"
        style={{ marginLeft: collapsed ? 64 : 240 }}
      >
        <TopBar sidebarCollapsed={collapsed} sidebarWidth={collapsed ? 64 : 240} />
        <main className="pt-[60px]">
          <Outlet />
        </main>
      </div>

      <ChatbotWidget />
    </div>
  );
};

export default Layout;
