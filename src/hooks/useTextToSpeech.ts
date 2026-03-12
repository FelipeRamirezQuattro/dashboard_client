import { useState, useEffect, useCallback, useRef } from "react";

export interface TextToSpeechOptions {
  lang?: string;
  voice?: SpeechSynthesisVoice | null;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface UseTextToSpeechReturn {
  speak: (text: string, options?: TextToSpeechOptions) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  error: string | null;
}

// Check if browser supports Web Speech Synthesis API
const isTextToSpeechSupported = (): boolean => {
  return !!(
    typeof window !== "undefined" &&
    window.speechSynthesis &&
    window.SpeechSynthesisUtterance
  );
};

export const useTextToSpeech = (
  defaultOptions: TextToSpeechOptions = {},
): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported] = useState(isTextToSpeechSupported());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    if (!isSupported) {
      setError("Text-to-speech is not supported in this browser");
      return;
    }

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices immediately
    loadVoices();

    // Chrome loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [isSupported]);

  // Monitor speaking status
  useEffect(() => {
    if (!isSupported) return;

    const checkStatus = setInterval(() => {
      if (window.speechSynthesis.speaking !== isSpeaking) {
        setIsSpeaking(window.speechSynthesis.speaking);
      }
      if (window.speechSynthesis.paused !== isPaused) {
        setIsPaused(window.speechSynthesis.paused);
      }
    }, 100);

    return () => clearInterval(checkStatus);
  }, [isSupported, isSpeaking, isPaused]);

  // Speak text
  const speak = useCallback(
    (text: string, options: TextToSpeechOptions = {}) => {
      if (!isSupported) {
        setError("Text-to-speech is not supported in this browser");
        return;
      }

      if (!text.trim()) {
        return;
      }

      // Stop any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Apply options (use provided options or defaults)
      utterance.lang = options.lang || defaultOptions.lang || "en-US";
      utterance.rate = options.rate ?? defaultOptions.rate ?? 1.0;
      utterance.pitch = options.pitch ?? defaultOptions.pitch ?? 1.0;
      utterance.volume = options.volume ?? defaultOptions.volume ?? 1.0;

      // Set voice if specified
      const selectedVoice = options.voice || defaultOptions.voice;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      } else if (voices.length > 0) {
        // Try to find an English voice by default
        const englishVoice = voices.find(
          (v) => v.lang.startsWith("en-") || v.lang === "en",
        );
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }

      // Event handlers
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event);
        let errorMessage = "An error occurred with text-to-speech";

        switch (event.error) {
          case "canceled":
            // User stopped manually, not an error
            break;
          case "interrupted":
            errorMessage = "Speech was interrupted";
            break;
          case "audio-busy":
            errorMessage = "Audio system is busy";
            break;
          case "not-allowed":
            errorMessage = "Speech synthesis not allowed";
            break;
          case "network":
            errorMessage = "Network error occurred";
            break;
          default:
            errorMessage = `Speech error: ${event.error}`;
        }

        if (event.error !== "canceled") {
          setError(errorMessage);
        }
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, defaultOptions, voices],
  );

  // Stop speaking
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      utteranceRef.current = null;
    }
  }, [isSupported]);

  // Pause speaking
  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking, isPaused]);

  // Resume speaking
  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    error,
  };
};

export default useTextToSpeech;
