import React from "react";
import { ChatMessage as ChatMessageType } from "../../types/chatbot.types";
import {
  downloadFileBankDocument,
  getFileBankApiPath,
} from "../../utils/fileBankDownload";

interface ChatMessageProps {
  message: ChatMessageType;
  onSpeak?: (messageId: string, text: string) => void;
  onSaveToBrain?: (messageId: string, text: string) => void;
  isSpeaking?: boolean;
  isTTSSupported?: boolean;
  canSaveToBrain?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSpeak,
  onSaveToBrain,
  isSpeaking = false,
  isTTSSupported = false,
  canSaveToBrain = false,
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
        const fileBankPath = getFileBankApiPath(url);
        const filename = match[1].replace(/^(Open|Download)\s+/i, "");
        parts.push(
          <a
            key={match.index}
            href={url}
            target={fileBankPath ? undefined : "_blank"}
            rel="noopener noreferrer"
            onClick={
              fileBankPath
                ? (event) => {
                    event.preventDefault();
                    downloadFileBankDocument(url, filename);
                  }
                : undefined
            }
            className={`underline font-semibold ${
              isBot
                ? "text-osi-primary hover:text-osi-primary/80"
                : "text-white hover:text-white/90"
            }`}
          >
            {match[1]}
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
        className={`flex gap-2 max-w-[92%] ${isBot ? "flex-row" : "flex-row-reverse"}`}
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
            {isBot && canSaveToBrain && onSaveToBrain && (
              <div className="group relative flex-shrink-0">
                <button
                  onClick={() => onSaveToBrain(message.id, message.message)}
                  className="p-1.5 rounded-lg transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  aria-label="Save response to Workflow Brain memory"
                  title="Save this response to the selected Workflow Brain category memory"
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    aria-hidden="true"
                  >
                    bookmark_add
                  </span>
                </button>
                <div className="pointer-events-none absolute right-0 top-9 z-20 w-64 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs leading-snug text-gray-700 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  Save this assistant response into the selected Workflow Brain
                  memory. It becomes source context for future Brain answers.
                </div>
              </div>
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
