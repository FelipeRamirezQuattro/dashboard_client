import React from "react";
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
  linkVariants,
} from "@odessa-separator/ui";
import { BookmarkPlus, Bot, Mic, User, Volume2 } from "lucide-react";
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
  const sentAt = new Date(message.timestamp);
  const isValidTime = !Number.isNaN(sentAt.getTime());
  const time = sentAt.toLocaleTimeString("en-US", {
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
            className={cn(
              "font-semibold",
              isBot
                ? linkVariants()
                : "rounded-tag text-on-action underline hover:no-underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-focus",
            )}
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
    <div className={cn("mb-4 flex", isBot ? "justify-start" : "justify-end")}>
      <div
        className={cn("flex max-w-[92%] gap-2", isBot ? "flex-row" : "flex-row-reverse")}
      >
        {/* Avatar */}
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-control",
            isBot ? "bg-action text-on-action" : "bg-accent text-on-accent",
          )}
          aria-hidden="true"
        >
          {isBot ? <Bot className="size-4" /> : <User className="size-4" />}
        </span>

        {/* Message Content */}
        <div className="flex min-w-0 flex-col">
          <div className="flex items-start gap-2">
            <div
              className={cn(
                "min-w-0 px-4 py-2.5",
                isBot
                  ? "border border-border bg-surface text-text"
                  : "bg-action text-on-action",
              )}
            >
              <span className="sr-only">
                {isBot ? "OSI Assistant said:" : "You said:"}
              </span>
              <div className="text-sm leading-relaxed break-words whitespace-pre-line">
                {renderMessage(message.message)}
              </div>
            </div>
            {/* Speaker button for bot messages */}
            {isBot && onSpeak && isTTSSupported && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isSpeaking ? "primary" : "outline"}
                      size="icon"
                      onClick={() => onSpeak(message.id, message.message)}
                      aria-pressed={isSpeaking}
                      aria-label="Speak message"
                      className="size-8 shrink-0"
                    >
                      <Volume2
                        className={cn("size-4", isSpeaking && "motion-safe:animate-pulse")}
                        aria-hidden="true"
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isSpeaking ? "Stop speaking" : "Speak this message"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {isBot && canSaveToBrain && onSaveToBrain && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => onSaveToBrain(message.id, message.message)}
                      aria-label="Save response to Workflow Brain memory"
                      className="size-8 shrink-0"
                    >
                      <BookmarkPlus className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-64">
                    Save this assistant response into the selected Workflow Brain
                    memory. It becomes source context for future Brain answers.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div
            className={cn(
              "mt-1 flex items-center gap-2 px-2 text-xs text-text-muted",
              !isBot && "justify-end",
            )}
          >
            <time dateTime={isValidTime ? sentAt.toISOString() : undefined}>
              {time}
            </time>
            {message.isSpoken && (
              <span title="Sent via voice">
                <Mic className="size-3" aria-hidden="true" />
                <span className="sr-only">Sent via voice</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
