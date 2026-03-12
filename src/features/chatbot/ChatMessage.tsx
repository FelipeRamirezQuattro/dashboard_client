import React from "react";
import { ChatMessage as ChatMessageType } from "../../types/chatbot.types";

interface ChatMessageProps {
  message: ChatMessageType;
  onSpeak?: (messageId: string, text: string) => void;
  isSpeaking?: boolean;
  isTTSSupported?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  isSpeaking = false,
  isTTSSupported = false,
}) => {
  const isBot = message.sender === "bot";
  const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  // Function to parse and render message with markdown-like formatting
  const renderMessage = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Combined regex to match links [text](url) and bold **text**
    const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      if (match[1] && match[2]) {
        // It's a link [text](url)
        const url = match[2];
        parts.push(
          <a
            key={match.index}
            href={url}
            className={`underline font-semibold cursor-pointer ${
              isBot
                ? "text-osi-primary hover:text-osi-primary/80"
                : "text-white hover:text-white/90"
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Create a temporary anchor element to trigger download
              const link = document.createElement("a");
              link.href = url;
              link.download = url.split("/").pop() || "download";
              link.target = "_blank";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            {match[1]} 📥
          </a>,
        );
      } else if (match[3]) {
        // It's bold **text**
        parts.push(
          <strong key={match.index} className="font-semibold">
            {match[3]}
          </strong>,
        );
      }

      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

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
          <div className="flex items-start gap-2">
            <div
              className={`rounded-2xl px-4 py-2.5 ${
                isBot
                  ? "bg-gray-100 text-gray-800"
                  : "bg-osi-primary text-white"
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-line">
                {renderMessage(message.message)}
              </div>
            </div>
            {/* Speaker button for bot messages */}
            {isBot && onSpeak && isTTSSupported && (
              <button
                onClick={() => onSpeak(message.id, message.message)}
                className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                  isSpeaking
                    ? "bg-osi-primary text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
                aria-label={isSpeaking ? "Stop speaking" : "Speak message"}
                title={isSpeaking ? "Stop speaking" : "Speak this message"}
              >
                <span
                  className={`material-symbols-outlined text-sm ${
                    isSpeaking ? "animate-pulse" : ""
                  }`}
                  aria-hidden="true"
                >
                  {isSpeaking ? "volume_up" : "volume_up"}
                </span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs text-gray-400 mt-1 px-2 ${
                isBot ? "text-left" : "text-right"
              }`}
            >
              {time}
            </span>
            {message.isSpoken && (
              <span
                className="text-xs text-gray-400 mt-1"
                title="Sent via voice"
              >
                <span className="material-symbols-outlined text-xs">mic</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
