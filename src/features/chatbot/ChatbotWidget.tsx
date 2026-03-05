import React, { useState } from "react";
import ChatbotWindow from "./ChatbotWindow";

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chatbot Window */}
      {isOpen && <ChatbotWindow onClose={() => setIsOpen(false)} />}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 h-16 w-16 bg-gradient-to-br from-[#FFC149] to-osi-primary text-white rounded-full shadow-2xl hover:scale-110 transition-transform duration-200 z-50 flex items-center justify-center group"
        aria-label="Open chatbot"
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-3xl text-white">
            close
          </span>
        ) : (
          <>
            <span className="material-symbols-outlined text-3xl text-white">
              chat_bubble
            </span>
            {/* Pulse animation */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-osi-primary opacity-0 group-hover:opacity-75 group-hover:animate-ping"></span>
          </>
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;
