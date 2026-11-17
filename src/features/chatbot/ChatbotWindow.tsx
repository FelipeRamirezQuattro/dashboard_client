import React, { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  Spinner,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@odessa-separator/ui";
import {
  ArrowLeft,
  BookmarkPlus,
  Bot,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import ChatMessage from "./ChatMessage";
import { normalizeCitations } from "./chatCitations.logic";
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
type DocumentSource = "all" | "local" | "onedrive";

const ASSISTANT_MODES: { value: AssistantMode; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "workflow_brain", label: "Brain" },
  { value: "external_app", label: "App" },
  { value: "file_bank", label: "Files" },
];

const DOCUMENT_SOURCES: { value: DocumentSource; label: string }[] = [
  { value: "all", label: "All" },
  { value: "local", label: "Local" },
  { value: "onedrive", label: "OneDrive" },
];

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
  const [documentSource, setDocumentSource] = useState<DocumentSource>("all");
  const [savedMessageId, setSavedMessageId] = useState<string | null>(null);
  const [pendingBrainSave, setPendingBrainSave] =
    useState<PendingBrainSave | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(
    null,
  );
  // Last request shown in the save dialog, kept so its content stays stable while it closes.
  const [shownBrainSave, setShownBrainSave] =
    useState<PendingBrainSave | null>(null);
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
      const citations = normalizeCitations(data.metadata?.citations);
      if (citations.length > 0) botMessage.citations = citations;

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

  const clearHistoryMutation = useMutation({
    mutationFn: () => chatbotService.clearHistory(sessionIdRef.current),
    onSuccess: () => {
      stop();
      setCurrentlySpeakingId(null);
      setSavedMessageId(null);
      setPendingBrainSave(null);
      sessionIdRef.current = createSessionId();
      localStorage.setItem(SESSION_STORAGE_KEY, sessionIdRef.current);
      setMessages([WELCOME_MESSAGE]);
    },
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

    const target = buildTarget();
    console.debug("[WorkflowBrainDebug][client:send]", {
      assistantMode,
      workflowCategoryId,
      selectedCategoryName: selectedCategory?.name,
      target,
      topLevelWorkflowBrainCategoryId:
        target.type === "workflow_brain"
          ? target.workflowBrainCategoryId
          : undefined,
      message,
    });

    // Send to backend
    sendMessageMutation.mutate({
      message,
      sessionId: sessionIdRef.current,
      target,
      workflowBrainCategoryId:
        target.type === "workflow_brain"
          ? target.workflowBrainCategoryId
          : undefined,
      context: {
        history: contextHistory,
        target,
      },
    });
  };

  const handleSaveToBrain = (messageId: string, text: string) => {
    if (!workflowCategoryId || saveToBrainMutation.isPending) return;
    setPendingBrainSave({ messageId, text });
    setShownBrainSave({ messageId, text });
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

  const handleModeChange = (value: string | null) => {
    // Single-choice group: pressing the active mode clears it; keep the current mode then.
    const mode = ASSISTANT_MODES.find((item) => item.value === value);
    if (mode) setAssistantMode(mode.value);
  };

  const handleDocumentSourceChange = (value: string | null) => {
    const source = DOCUMENT_SOURCES.find((item) => item.value === value);
    if (source) setDocumentSource(source.value);
  };

  const handleBrainDialogOpenChange = (open: boolean) => {
    if (!open && !saveToBrainMutation.isPending) {
      setPendingBrainSave(null);
    }
  };

  return (
    <TooltipProvider>
      {/* Header (the library close button sits in the top-right corner of the panel) */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface py-3 pr-14 pl-3 sm:py-4 sm:pl-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="shrink-0 sm:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Close
        </Button>
        <span
          className="hidden size-10 shrink-0 place-items-center rounded-control bg-action text-on-action sm:grid"
          aria-hidden="true"
        >
          <Bot className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <DialogTitle className="truncate text-base sm:text-lg">
            OSI Assistant
          </DialogTitle>
          <DialogDescription className="hidden truncate text-xs sm:block">
            Drawer mode for long workflow and document answers
          </DialogDescription>
        </div>
        {/* Auto-speak toggle */}
        {isTTSSupported && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={autoSpeak ? "primary" : "ghost"}
                size="icon"
                onClick={toggleAutoSpeak}
                aria-pressed={autoSpeak}
                aria-label="Auto-speak responses"
                className="shrink-0 touch-manipulation"
              >
                {autoSpeak ? (
                  <Volume2 className="size-5" aria-hidden="true" />
                ) : (
                  <VolumeX className="size-5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {autoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Source Selector */}
      <div className="shrink-0 space-y-3 border-b border-border bg-surface px-4 py-3 sm:px-6">
        <ToggleGroup
          type="single"
          aria-label="Answer source"
          value={assistantMode}
          onValueChange={handleModeChange}
          className="flex w-full"
        >
          {ASSISTANT_MODES.map((mode) => (
            <ToggleGroupItem key={mode.value} value={mode.value} className="flex-1">
              {mode.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {assistantMode === "workflow_brain" && (
          <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto]">
            <Select
              aria-label="Workflow Brain category"
              value={workflowCategoryId}
              onChange={(event) => setWorkflowCategoryId(event.target.value)}
            >
              <option value="">Select Workflow Brain category</option>
              {categoriesQuery.data?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </Select>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearHistoryMutation.mutate()}
                  disabled={clearHistoryMutation.isPending}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Clear History
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear chatbot history</TooltipContent>
            </Tooltip>
          </div>
        )}

        {assistantMode === "external_app" && (
          <Select
            aria-label="External application"
            value={selectedAppName}
            onChange={(event) => setSelectedAppName(event.target.value)}
          >
            <option value="">Select external application</option>
            {appsQuery.data
              ?.filter((app) => app.chatbotApiUrl)
              .map((app) => (
                <option key={app._id} value={app.name}>
                  {app.name}
                </option>
              ))}
          </Select>
        )}

        {assistantMode === "file_bank" && (
          <ToggleGroup
            type="single"
            aria-label="Document source"
            value={documentSource}
            onValueChange={handleDocumentSourceChange}
          >
            {DOCUMENT_SOURCES.map((source) => (
              <ToggleGroupItem key={source.value} value={source.value}>
                {source.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}

        {assistantMode === "auto" && (
          <p className="text-xs text-text-muted">
            Auto uses the router only when no source is selected. Choosing a source is faster.
          </p>
        )}
      </div>

      {/* Messages */}
      <div
        role="log"
        aria-label="Conversation"
        className="flex-1 overflow-y-auto bg-bg px-4 py-4 sm:px-6"
      >
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
          <Alert variant="success" className="mb-4 text-xs">
            Saved response to Workflow Brain memory.
          </Alert>
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="mb-4 flex justify-start">
            <div className="flex max-w-[80%] gap-2 sm:max-w-[85%]">
              <span
                className="grid size-7 shrink-0 place-items-center rounded-control bg-action text-on-action sm:size-8"
                aria-hidden="true"
              >
                <Bot className="size-4" />
              </span>
              <div className="flex items-center border border-border bg-surface px-4 py-2.5">
                <Spinner size="sm" label="OSI Assistant is typing" />
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

      {/* Save-to-memory confirmation (modal, on top of the chat panel) */}
      <Dialog
        open={pendingBrainSave !== null}
        onOpenChange={handleBrainDialogOpenChange}
      >
        <DialogContent
          closeLabel="Cancel saving to memory"
          // No DialogTrigger here, and the save button may be gone after saving: return focus
          // to the message box so it does not fall back to the page body.
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("chatbot-message-input")?.focus();
          }}
        >
          <DialogHeader>
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-control bg-warning-bg text-warning-text"
                aria-hidden="true"
              >
                <BookmarkPlus className="size-5" />
              </span>
              <div className="space-y-1.5">
                <DialogTitle className="text-base">
                  Save to Workflow Brain memory?
                </DialogTitle>
                <DialogDescription className="leading-relaxed">
                  This will become source context for future Brain answers.
                  Save only verified, useful information.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="border border-border bg-surface-muted px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                Category
              </p>
              <p className="mt-1 text-sm font-medium text-text">
                {selectedCategory?.name || "Selected Workflow Brain category"}
              </p>
            </div>
            <div className="max-h-36 overflow-y-auto border border-border bg-surface px-3 py-2">
              <p className="text-xs font-semibold tracking-wide text-text-muted uppercase">
                Memory preview
              </p>
              <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-text">
                {shownBrainSave?.text}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingBrainSave(null)}
              disabled={saveToBrainMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmSaveToBrain}
              disabled={saveToBrainMutation.isPending}
            >
              {saveToBrainMutation.isPending ? "Saving..." : "Save Memory"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default ChatbotWindow;
