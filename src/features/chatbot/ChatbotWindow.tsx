import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import {
  ChatMessage as ChatMessageType,
  ChatContextTurn,
  ChatTarget,
} from "../../types/chatbot.types";
import { chatbotService } from "../../services/chatbot.service";
import { workflowBrainService } from "../../services/workflowBrain.service";
import { getApps } from "../../services/apps.service";
import { useAuthContext } from "../../context/AuthContext";
import useTextToSpeech from "../../hooks/useTextToSpeech";

const WELCOME_MESSAGE: ChatMessageType = {
  id: "welcome",
  message:
    "Hello! I'm the OSI Assistant. I can help you learn about Odessa Separator Inc., our business units, departments, services, and more. How can I assist you today?",
  sender: "bot",
  timestamp: new Date(),
};

const SESSION_STORAGE_KEY = "osi-chatbot-session-id";

const createSessionId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `session-${Date.now()}`;

type AssistantMode = "auto" | "workflow_brain" | "external_app" | "file_bank";

interface ChatbotWindowProps {
  onClose: () => void;
}

interface PendingBrainSave {
  messageId: string;
  text: string;
}

const ChatbotWindow: React.FC<ChatbotWindowProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<ChatMessageType[]>([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("auto");
  const [workflowCategoryId, setWorkflowCategoryId] = useState("");
  const [selectedAppName, setSelectedAppName] = useState("");
  const [documentSource, setDocumentSource] = useState<"all" | "local" | "onedrive">("all");
  const [savedMessageId, setSavedMessageId] = useState<string | null>(null);
  const [pendingBrainSave, setPendingBrainSave] =
    useState<PendingBrainSave | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(
    null,
  );
  const { user } = useAuthContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestBotMessageRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string>(
    localStorage.getItem(SESSION_STORAGE_KEY) || createSessionId(),
  );

  const {
    speak,
    stop,
    isSpeaking,
    isSupported: isTTSSupported,
  } = useTextToSpeech({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  });

  const categoriesQuery = useQuery({
    queryKey: ["workflowBrainCategories", "chatbot"],
    queryFn: workflowBrainService.getCategories,
  });

  const appsQuery = useQuery({
    queryKey: ["apps", "chatbot"],
    queryFn: getApps,
  });

  const canSaveToBrain =
    assistantMode === "workflow_brain" &&
    Boolean(workflowCategoryId) &&
    Boolean(user && ["editor", "admin", "superadmin"].includes(user.role));

  const selectedCategory = categoriesQuery.data?.find(
    (category) => category._id === workflowCategoryId,
  );

  const buildTarget = (): ChatTarget => {
    if (assistantMode === "workflow_brain") {
      return {
        type: "workflow_brain",
        workflowBrainCategoryId: workflowCategoryId || undefined,
      };
    }

    if (assistantMode === "external_app") {
      return {
        type: "external_app",
        appName: selectedAppName || undefined,
      };
    }

    if (assistantMode === "file_bank") {
      return {
        type: "file_bank",
        documentSource,
      };
    }

    return { type: "auto" };
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    localStorage.setItem(SESSION_STORAGE_KEY, sessionIdRef.current);

    chatbotService
      .getHistory(sessionIdRef.current)
      .then((historyResponse) => {
        if (!historyResponse.history.length) return;

        const hydratedMessages: ChatMessageType[] =
          historyResponse.history.map((turn, index) => ({
            id: `history-${index}`,
            message: turn.content,
            sender: turn.role === "assistant" ? "bot" : "user",
            timestamp: new Date(),
          }));

        setMessages(hydratedMessages);
      })
      .catch(() => {
        // History is a progressive enhancement; keep the welcome message.
      });
  }, []);

  // Mutation for sending messages
  const sendMessageMutation = useMutation({
    mutationFn: chatbotService.sendMessage,
    onSuccess: (data) => {
      if (data.sessionId && data.sessionId !== sessionIdRef.current) {
        sessionIdRef.current = data.sessionId;
        localStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
      }

      // Add bot response
      const botMessage: ChatMessageType = {
        id: `bot-${Date.now()}`,
        message: data.reply,
        sender: "bot",
        timestamp: new Date(data.timestamp),
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, botMessage]);
      latestBotMessageRef.current = botMessage.id;

      // Auto-speak if enabled
      if (autoSpeak && isTTSSupported) {
        setTimeout(() => {
          handleSpeakMessage(botMessage.id, botMessage.message);
        }, 300);
      }
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

  const saveToBrainMutation = useMutation({
    mutationFn: ({ text }: { text: string }) =>
      workflowBrainService.addMemory(workflowCategoryId, text),
  });

  const handleSendMessage = (message: string, isVoice?: boolean) => {
    // Stop any ongoing speech when user sends a new message
    if (isSpeaking) {
      stop();
      setCurrentlySpeakingId(null);
    }

    // Add user message
    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      message,
      sender: "user",
      timestamp: new Date(),
      isSpoken: isVoice,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Keep recent history to provide context similar to modern chatbots.
    const recentHistory: ChatContextTurn[] = messages
      .filter((m) => m.sender === "user" || m.sender === "bot")
      .slice(-8)
      .map((m) => ({
        role: m.sender === "bot" ? "assistant" : "user",
        content: m.message,
      }));

    const contextHistory: ChatContextTurn[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    // Show typing indicator
    setIsTyping(true);

    // Send to backend
    sendMessageMutation.mutate({
      message,
      sessionId: sessionIdRef.current,
      context: {
        history: contextHistory,
        target: buildTarget(),
      },
    });
  };

  const handleSaveToBrain = (messageId: string, text: string) => {
    if (!workflowCategoryId || saveToBrainMutation.isPending) return;
    setPendingBrainSave({ messageId, text });
  };

  const confirmSaveToBrain = () => {
    if (!pendingBrainSave || !workflowCategoryId || saveToBrainMutation.isPending) {
      return;
    }

    const { messageId, text } = pendingBrainSave;
    saveToBrainMutation.mutate(
      {
        text: `User-approved OSI Assistant response:\n\n${text}`,
      },
      {
        onSuccess: () => {
          setSavedMessageId(messageId);
          setPendingBrainSave(null);
        },
      },
    );
  };

  const handleSpeakMessage = (messageId: string, text: string) => {
    if (!isTTSSupported) return;

    if (currentlySpeakingId === messageId && isSpeaking) {
      // Stop if already speaking this message
      stop();
      setCurrentlySpeakingId(null);
    } else {
      // Speak the message
      setCurrentlySpeakingId(messageId);
      speak(text);

      // Clear speaking state when done (estimated duration)
      const words = text.split(/\s+/).length;
      const estimatedDuration = (words / 150) * 60 * 1000; // 150 words per minute
      setTimeout(() => {
        setCurrentlySpeakingId(null);
      }, estimatedDuration + 500);
    }
  };

  const toggleAutoSpeak = () => {
    setAutoSpeak(!autoSpeak);
  };

  const modeButtonClass = (mode: AssistantMode) =>
    `px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
      assistantMode === mode
        ? "bg-osi-primary text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <aside className="fixed inset-y-0 right-0 w-full sm:w-[560px] bg-white shadow-2xl flex flex-col z-50 border-l border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-osi-primary to-osi-primary/90 text-white px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
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
              Drawer mode for long workflow and document answers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Auto-speak toggle */}
          {isTTSSupported && (
            <button
              onClick={toggleAutoSpeak}
              className={`text-white hover:bg-white/20 active:bg-white/30 rounded-lg p-2 transition-colors touch-manipulation ${
                autoSpeak ? "bg-white/20" : ""
              }`}
              aria-label={
                autoSpeak ? "Disable auto-speak" : "Enable auto-speak"
              }
              title={autoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
            >
              <span
                className="material-symbols-outlined text-lg sm:text-xl"
                aria-hidden="true"
              >
                {autoSpeak ? "volume_up" : "volume_off"}
              </span>
            </button>
          )}
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
      </div>

      {/* Source Selector */}
      <div className="border-b border-gray-200 bg-white px-4 sm:px-6 py-3 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => setAssistantMode("auto")}
            className={modeButtonClass("auto")}
          >
            Auto
          </button>
          <button
            type="button"
            onClick={() => setAssistantMode("workflow_brain")}
            className={modeButtonClass("workflow_brain")}
          >
            Brain
          </button>
          <button
            type="button"
            onClick={() => setAssistantMode("external_app")}
            className={modeButtonClass("external_app")}
          >
            App
          </button>
          <button
            type="button"
            onClick={() => setAssistantMode("file_bank")}
            className={modeButtonClass("file_bank")}
          >
            Files
          </button>
        </div>

        {assistantMode === "workflow_brain" && (
          <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-center">
            <select
              value={workflowCategoryId}
              onChange={(event) => setWorkflowCategoryId(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-osi-primary"
            >
              <option value="">Select Workflow Brain category</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-gray-500">
              {selectedCategory ? selectedCategory.domain.replace(/_/g, " ") : "Category memory"}
            </span>
          </div>
        )}

        {assistantMode === "external_app" && (
          <select
            value={selectedAppName}
            onChange={(event) => setSelectedAppName(event.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-osi-primary"
          >
            <option value="">Select external application</option>
            {appsQuery.data
              ?.filter((app) => app.chatbotApiUrl)
              .map((app) => (
              <option key={app._id} value={app.name}>
                {app.name}
              </option>
            ))}
          </select>
        )}

        {assistantMode === "file_bank" && (
          <div className="flex gap-2">
            {(["all", "local", "onedrive"] as const).map((source) => (
              <button
                key={source}
                type="button"
                onClick={() => setDocumentSource(source)}
                className={`px-3 py-2 rounded-md text-xs font-semibold capitalize ${
                  documentSource === source
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {source === "onedrive" ? "OneDrive" : source}
              </button>
            ))}
          </div>
        )}

        {assistantMode === "auto" && (
          <p className="text-xs text-gray-500">
            Auto uses the router only when no source is selected. Choosing a source is faster.
          </p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gray-50">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onSpeak={message.sender === "bot" ? handleSpeakMessage : undefined}
            onSaveToBrain={handleSaveToBrain}
            isSpeaking={currentlySpeakingId === message.id}
            isTTSSupported={isTTSSupported}
            canSaveToBrain={
              canSaveToBrain &&
              message.sender === "bot" &&
              message.id !== "welcome" &&
              savedMessageId !== message.id
            }
          />
        ))}

        {saveToBrainMutation.isSuccess && savedMessageId && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Saved response to Workflow Brain memory.
          </div>
        )}

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

      {pendingBrainSave && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-gray-950/35 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-brain-memory-title"
            className="w-full max-w-md rounded-lg border border-amber-200 bg-white shadow-2xl"
          >
            <div className="border-b border-gray-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <span className="material-symbols-outlined text-xl" aria-hidden="true">
                    bookmark_add
                  </span>
                </div>
                <div>
                  <h4
                    id="save-brain-memory-title"
                    className="text-base font-semibold text-gray-900"
                  >
                    Save to Workflow Brain memory?
                  </h4>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    This will become source context for future Brain answers.
                    Save only verified, useful information.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 px-5 py-4">
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Category
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {selectedCategory?.name || "Selected Workflow Brain category"}
                </p>
              </div>
              <div className="max-h-36 overflow-y-auto rounded-md border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Memory preview
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                  {pendingBrainSave.text}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
              <button
                type="button"
                onClick={() => setPendingBrainSave(null)}
                disabled={saveToBrainMutation.isPending}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmSaveToBrain}
                disabled={saveToBrainMutation.isPending}
                className="rounded-md bg-osi-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-osi-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveToBrainMutation.isPending ? "Saving..." : "Save Memory"}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ChatbotWindow;
