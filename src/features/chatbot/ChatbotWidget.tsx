import React, { useState } from "react";
import ChatbotWindow from "./ChatbotWindow";

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Chatbot Window */}
      {isOpen && <ChatbotWindow onClose={() => setIsOpen(false)} />}

      {/* Floating Button - Responsive positioning */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 sm:h-16 sm:w-16 bg-gradient-to-br from-[#FFC149] to-osi-primary text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-transform duration-200 z-40 flex items-center justify-center group touch-manipulation"
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? (
          <span
            className="material-symbols-outlined text-2xl sm:text-3xl text-white"
            aria-hidden="true"
          >
            close
          </span>
        ) : (
          <>
            <span
              className="material-symbols-outlined text-2xl sm:text-3xl text-white"
              aria-hidden="true"
            >
              chat_bubble
            </span>
            {/* Pulse animation */}
            <span
              className="absolute inline-flex h-full w-full rounded-full bg-osi-primary opacity-0 group-hover:opacity-75 group-hover:animate-ping"
              aria-hidden="true"
            ></span>
          </>
        )}
      </button>
    </>
  );
};

export default ChatbotWidget;
