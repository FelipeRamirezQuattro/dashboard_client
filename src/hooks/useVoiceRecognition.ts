import { useState, useEffect, useCallback, useRef } from "react";

export type RecognitionState = "idle" | "listening" | "processing" | "error";

export interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export interface UseVoiceRecognitionReturn {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
  isSupported: boolean;
  state: RecognitionState;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// Check if browser supports Web Speech API
const isSpeechRecognitionSupported = (): boolean => {
  return !!(
    typeof window !== "undefined" &&
    (window.SpeechRecognition || (window as any).webkitSpeechRecognition)
  );
};

export const useVoiceRecognition = (
  options: UseVoiceRecognitionOptions = {},
): UseVoiceRecognitionReturn => {
  const {
    language = "en-US",
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    onTranscript,
    onError,
  } = options;

  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [state, setState] = useState<RecognitionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(isSpeechRecognitionSupported());

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef("");

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser");
      setState("error");
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.maxAlternatives = maxAlternatives;
      recognition.lang = language;

      // Handle results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interimText = "";
        let finalText = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcriptText = result[0].transcript;

          if (result.isFinal) {
            finalText += transcriptText + " ";
          } else {
            interimText += transcriptText;
          }
        }

        if (finalText) {
          finalTranscriptRef.current += finalText;
          setTranscript(finalTranscriptRef.current.trim());
          setInterimTranscript("");
          onTranscript?.(finalTranscriptRef.current.trim(), true);
        }

        if (interimText) {
          setInterimTranscript(interimText);
          onTranscript?.(interimText, false);
        }
      };

      // Handle errors
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        let errorMessage = "An error occurred with speech recognition";

        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech detected. Please try again.";
            break;
          case "audio-capture":
            errorMessage = "No microphone detected. Please check your device.";
            break;
          case "not-allowed":
            errorMessage =
              "Microphone permission denied. Please enable microphone access.";
            break;
          case "network":
            errorMessage = "Network error. Please check your connection.";
            break;
          case "aborted":
            // User stopped manually, not an error
            return;
        }

        setError(errorMessage);
        setState("error");
        setIsListening(false);
        onError?.(errorMessage);
      };

      // Handle end
      recognition.onend = () => {
        setIsListening(false);
        if (state === "listening") {
          setState("idle");
        }
      };

      // Handle start
      recognition.onstart = () => {
        setIsListening(true);
        setState("listening");
        setError(null);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [
    isSupported,
    language,
    continuous,
    interimResults,
    maxAlternatives,
    onTranscript,
    onError,
    state,
  ]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser");
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        finalTranscriptRef.current = "";
        setTranscript("");
        setInterimTranscript("");
        setError(null);
        setState("listening");
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting recognition:", err);
        setError("Failed to start speech recognition");
        setState("error");
      }
    }
  }, [isSupported, isListening]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setState("processing");
    }
  }, [isListening]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
    if (state !== "listening") {
      setState("idle");
    }
  }, [state]);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    state,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useVoiceRecognition;
