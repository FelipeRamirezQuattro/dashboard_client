import React from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import ChatbotWidget from "../../features/chatbot/ChatbotWidget";

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-osi-bg">
      <TopBar />
      <main>
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  );
};

export default Layout;
