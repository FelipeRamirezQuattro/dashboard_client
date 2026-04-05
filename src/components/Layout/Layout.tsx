// client/src/components/Layout/Layout.tsx
import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
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

  const location = useLocation();
  const isBUPage = location.pathname.startsWith("/business-unit");

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      {!isBUPage && <Sidebar collapsed={collapsed} onToggle={handleToggle} />}
      <main
        className={`transition-all duration-200 ease-in-out pt-12 ${
          !isBUPage ? (collapsed ? "lg:ml-[60px]" : "lg:ml-[220px]") : ""
        }`}
      >
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  );
};

export default Layout;
