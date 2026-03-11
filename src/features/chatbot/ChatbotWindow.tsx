import React, { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import { ChatMessage as ChatMessageType } from "../../types/chatbot.types";
import { chatbotService } from "../../services/chatbot.service";

interface ChatbotWindowProps {
  onClose: () => void;
}

const ChatbotWindow: React.FC<ChatbotWindowProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Welcome message on mount
  useEffect(() => {
    const welcomeMessage: ChatMessageType = {
      id: "welcome",
      message:
        "Hello! I'm the OSI Assistant. I can help you learn about Odessa Separator Inc., our business units, departments, services, and more. How can I assist you today?",
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: chatbotService.sendMessage,
    onSuccess: (data) => {
      // Add bot response
      const botMessage: ChatMessageType = {
        id: `bot-${Date.now()}`,
        message: data.reply,
        sender: "bot",
        timestamp: new Date(data.timestamp),
      };

      // Simulate realistic thinking/typing delay (1.5-2.5 seconds with random variance)
      const baseDelay = 1500;
      const randomVariance = Math.random() * 1000; // 0-1000ms random
      const thinkingDelay = baseDelay + randomVariance;

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, botMessage]);
      }, thinkingDelay);
    },
    onError: () => {
      setIsTyping(false);
      const errorMessage: ChatMessageType = {
        id: `error-${Date.now()}`,
        message:
          "I'm sorry, I'm having trouble responding right now. Please try again later.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = (message: string) => {
    // Add user message
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      message,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Show typing indicator
    setIsTyping(true);

    // Send to backend
    sendMessageMutation.mutate(message);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 sm:bottom-auto sm:bottom-24 sm:right-6 sm:left-auto sm:w-96 h-[85vh] sm:h-[600px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-osi-primary to-osi-primary/90 text-white px-4 sm:px-6 py-4 sm:py-4 rounded-t-2xl flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 sm:h-10 sm:w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <span
              className="material-symbols-outlined text-xl sm:text-2xl"
              aria-hidden="true"
            >
              smart_toy
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-base sm:text-lg truncate">
              OSI Assistant
            </h3>
            <p className="text-xs text-white/80 truncate">
              Helping you navigate OSI solutions
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 active:bg-white/30 rounded-lg p-2 transition-colors touch-manipulation flex-shrink-0"
          aria-label="Close chatbot"
        >
          <span
            className="material-symbols-outlined text-xl sm:text-2xl"
            aria-hidden="true"
          >
            close
          </span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 bg-gray-50">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start mb-4">
            <div className="flex gap-2 max-w-[80%] sm:max-w-[85%]">
              <div className="flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-osi-primary text-white flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-sm sm:text-base"
                  aria-hidden="true"
                >
                  smart_toy
                </span>
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={isTyping || sendMessageMutation.isPending}
      />
    </div>
  );
};

export default ChatbotWindow;
