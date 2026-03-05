import React from "react";
import { ChatMessage as ChatMessageType } from "../../types/chatbot.types";

interface ChatMessageProps {
  message: ChatMessageType;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === "bot";
  const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isBot ? "justify-start" : "justify-end"} mb-4`}>
      <div
        className={`flex gap-2 max-w-[80%] ${isBot ? "flex-row" : "flex-row-reverse"}`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isBot ? "bg-osi-primary text-white" : "bg-osi-secondary text-white"
          }`}
        >
          <span className="material-symbols-outlined text-base">
            {isBot ? "smart_toy" : "person"}
          </span>
        </div>

        {/* Message Content */}
        <div className="flex flex-col">
          <div
            className={`rounded-2xl px-4 py-2.5 ${
              isBot ? "bg-gray-100 text-gray-800" : "bg-osi-primary text-white"
            }`}
          >
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {message.message}
            </p>
          </div>
          <span
            className={`text-xs text-gray-400 mt-1 px-2 ${
              isBot ? "text-left" : "text-right"
            }`}
          >
            {time}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
