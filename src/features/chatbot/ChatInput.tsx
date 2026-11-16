import React, { useState, KeyboardEvent, useEffect } from "react";
import {
  Alert,
  Button,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  cn,
} from "@odessa-separator/ui";
import { Mic, SendHorizontal } from "lucide-react";
import useVoiceRecognition from "../../hooks/useVoiceRecognition";

interface ChatInputProps {
  onSendMessage: (message: string, isVoice?: boolean) => void;
  disabled?: boolean;
  voiceEnabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  voiceEnabled = true,
}) => {
  const [input, setInput] = useState("");
  const [showVoiceUnsupported, setShowVoiceUnsupported] = useState(false);

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported: isVoiceSupported,
    state: voiceState,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    language: "en-US",
    continuous: false,
    interimResults: true,
  });

  // Update input with interim transcript while listening
  useEffect(() => {
    if (isListening && interimTranscript) {
      setInput(interimTranscript);
    }
  }, [interimTranscript, isListening]);

  // Auto-submit when final transcript is ready
  useEffect(() => {
    if (transcript && !isListening && voiceState === "idle") {
      setInput(transcript);
      // Auto-submit after a short delay
      setTimeout(() => {
        if (transcript.trim()) {
          onSendMessage(transcript.trim(), true);
          setInput("");
          resetTranscript();
        }
      }, 500);
    }
  }, [transcript, isListening, voiceState, onSendMessage, resetTranscript]);

  // Handle voice errors
  useEffect(() => {
    if (voiceError) {
      console.error("Voice error:", voiceError);
      setShowVoiceUnsupported(true);
      setTimeout(() => setShowVoiceUnsupported(false), 5000);
    }
  }, [voiceError]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim(), false);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Ctrl+Space to start/stop voice
    if (e.ctrlKey && e.key === " ") {
      e.preventDefault();
      handleVoiceToggle();
    }
  };

  const handleVoiceToggle = () => {
    if (!isVoiceSupported) {
      setShowVoiceUnsupported(true);
      setTimeout(() => setShowVoiceUnsupported(false), 5000);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="shrink-0 border-t border-border bg-surface p-3 sm:p-4">
      {/* Voice unsupported warning */}
      {showVoiceUnsupported && !isVoiceSupported && (
        <Alert variant="warning" className="mb-2 text-xs">
          Voice input is not supported in your browser. Please use Chrome, Edge,
          or Safari.
        </Alert>
      )}

      {/* Voice error warning */}
      {showVoiceUnsupported && voiceError && isVoiceSupported && (
        <Alert variant="danger" className="mb-2 text-xs">
          {voiceError}
        </Alert>
      )}

      <div className="flex items-center gap-2">
        {/* Voice button */}
        {voiceEnabled && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={isListening ? "danger" : "outline"}
                  size="icon"
                  onClick={handleVoiceToggle}
                  disabled={disabled || voiceState === "processing"}
                  aria-pressed={isListening}
                  aria-label="Voice input"
                  aria-keyshortcuts="Control+Space"
                  className={cn(
                    "shrink-0 touch-manipulation",
                    isListening && "motion-safe:animate-pulse",
                    !isVoiceSupported && "text-text-muted",
                  )}
                >
                  <Mic className="size-5" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isListening
                  ? "Click to stop recording"
                  : isVoiceSupported
                    ? "Click to start voice input (Ctrl+Space)"
                    : "Voice input not supported in this browser"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Text input */}
        <Textarea
          id="chatbot-message-input"
          name="chatbot-message"
          aria-label="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isListening ? "Listening..." : "Type your message or use voice…"
          }
          disabled={disabled || isListening}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="sentences"
          rows={2}
          className="max-h-28 min-h-11 flex-1 resize-none text-sm sm:text-base"
        />

        {/* Send button */}
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || disabled || isListening}
          aria-label="Send message"
          className="shrink-0 touch-manipulation"
        >
          <SendHorizontal className="size-5" aria-hidden="true" />
        </Button>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="mt-2 flex items-center gap-1 text-xs text-text-muted" role="status">
          <span
            className="inline-block size-2 bg-danger-solid motion-safe:animate-pulse"
            aria-hidden="true"
          />
          <span>Listening... Speak now</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
