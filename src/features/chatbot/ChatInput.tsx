import React, { useState, KeyboardEvent, useEffect } from "react";
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
    <div className="border-t border-gray-200 p-3 sm:p-4 bg-white flex-shrink-0 rounded-b-2xl sm:rounded-b-2xl">
      {/* Voice unsupported warning */}
      {showVoiceUnsupported && !isVoiceSupported && (
        <div className="mb-2 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
          Voice input is not supported in your browser. Please use Chrome, Edge,
          or Safari.
        </div>
      )}

      {/* Voice error warning */}
      {showVoiceUnsupported && voiceError && isVoiceSupported && (
        <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
          {voiceError}
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* Voice button */}
        {voiceEnabled && (
          <button
            type="button"
            onClick={handleVoiceToggle}
            disabled={disabled || voiceState === "processing"}
            className={`${
              isListening
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : isVoiceSupported
                  ? "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
            } p-2.5 sm:p-2.5 rounded-lg transition-all touch-manipulation flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={
              isListening
                ? "Stop voice input"
                : isVoiceSupported
                  ? "Start voice input (Ctrl+Space)"
                  : "Voice input not supported"
            }
            title={
              isListening
                ? "Click to stop recording"
                : isVoiceSupported
                  ? "Click to start voice input (Ctrl+Space)"
                  : "Voice input not supported in this browser"
            }
          >
            <span
              className={`material-symbols-outlined text-xl sm:text-xl ${
                isListening ? "text-white" : ""
              }`}
              aria-hidden="true"
            >
              {isListening ? "mic" : "mic_none"}
            </span>
          </button>
        )}

        {/* Text input */}
        <textarea
          id="chatbot-message-input"
          name="chatbot-message"
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
          className="flex-1 min-h-[44px] max-h-28 px-3 sm:px-4 py-2.5 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-osi-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base resize-none"
        />

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || disabled || isListening}
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

      {/* Listening indicator */}
      {isListening && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span>Listening... Speak now</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
