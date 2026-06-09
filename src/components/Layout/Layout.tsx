import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import ChatbotWidget from "../../features/chatbot/ChatbotWidget";

const STORAGE_KEY = "osi_sidebar_collapsed";

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [desktopViewport, setDesktopViewport] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth >= 1024 : true;
  });
  const [userCollapsedBeforeChat, setUserCollapsedBeforeChat] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const handleResize = () => setDesktopViewport(window.innerWidth >= 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      if (!chatOpen) {
        setUserCollapsedBeforeChat(null);
      }
      return next;
    });
  };

  const handleChatOpenChange = (open: boolean) => {
    setChatOpen(open);

    if (open && desktopViewport) {
      setUserCollapsedBeforeChat(collapsed);
      if (!collapsed) {
        setCollapsed(true);
      }
      return;
    }

    if (!open && userCollapsedBeforeChat !== null) {
      setCollapsed(userCollapsedBeforeChat);
      localStorage.setItem(STORAGE_KEY, String(userCollapsedBeforeChat));
      setUserCollapsedBeforeChat(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "#f4f5f7" }}>
      {/* Sidebar always visible on desktop */}
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />

      {/* Main content area offset by sidebar */}
      <div
        className="transition-all duration-[250ms] ease-in-out"
        style={{
          marginLeft: desktopViewport ? (collapsed ? 64 : 240) : 0,
          marginRight: chatOpen && desktopViewport ? 560 : 0,
        }}
      >
        <TopBar sidebarCollapsed={collapsed} sidebarWidth={collapsed ? 64 : 240} />
        <main className="pt-[60px] pb-28 sm:pb-32">
          <Outlet />
        </main>
      </div>

      <ChatbotWidget isOpen={chatOpen} onOpenChange={handleChatOpenChange} />
    </div>
  );
};

export default Layout;
