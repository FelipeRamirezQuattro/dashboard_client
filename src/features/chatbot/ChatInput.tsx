import React, { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-3 sm:p-4 bg-white flex-shrink-0 rounded-b-2xl sm:rounded-b-2xl">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message…"
          disabled={disabled}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          className="flex-1 px-3 sm:px-4 py-2.5 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allow ed text-sm sm:text-base"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="bg-osi-primary text-white p-2.5 sm:p-2.5 rounded-lg hover:bg-osi-primary/90 active:bg-osi-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation flex-shrink-0"
          aria-label="Send message"
        >
          <span
            className="material-symbols-outlined text-xl sm:text-xl"
            aria-hidden="true"
          >
            send
          </span>
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
