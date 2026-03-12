/**
 * Voice utilities for Web Speech API
 * Provides helper functions for voice recognition and synthesis
 */

/**
 * Check if Web Speech API (Speech Recognition) is supported
 */
export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(
    window.SpeechRecognition || (window as any).webkitSpeechRecognition
  );
};

/**
 * Check if Web Speech Synthesis API (Text-to-Speech) is supported
 */
export const isTextToSpeechSupported = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
};

/**
 * Get browser name for Speech API
 */
export const getBrowserName = (): string => {
  if (typeof window === "undefined") return "unknown";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("chrome") && !userAgent.includes("edg"))
    return "Chrome";
  if (userAgent.includes("safari") && !userAgent.includes("chrome"))
    return "Safari";
  if (userAgent.includes("firefox")) return "Firefox";
  if (userAgent.includes("edg")) return "Edge";
  if (userAgent.includes("opera") || userAgent.includes("opr")) return "Opera";

  return "Unknown";
};

/**
 * Get recommended browser message for Speech API support
 */
export const getRecommendedBrowserMessage = (): string => {
  const browser = getBrowserName();

  if (browser === "Firefox") {
    return "Voice features are not fully supported in Firefox. Please use Chrome, Edge, or Safari for the best experience.";
  }

  if (!isSpeechRecognitionSupported() && !isTextToSpeechSupported()) {
    return "Voice features are not supported in your browser. Please use Chrome, Edge, or Safari.";
  }

  if (!isSpeechRecognitionSupported()) {
    return "Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.";
  }

  if (!isTextToSpeechSupported()) {
    return "Voice output is not supported in your browser. Please use Chrome, Edge, or Safari.";
  }

  return "";
};

/**
 * Get available voices for a specific language
 * @param lang Language code (e.g., 'en-US', 'es-ES')
 * @returns Array of voices for the specified language
 */
export const getVoicesForLanguage = (lang: string): SpeechSynthesisVoice[] => {
  if (!isTextToSpeechSupported()) return [];

  const voices = window.speechSynthesis.getVoices();
  return voices.filter(
    (voice) => voice.lang === lang || voice.lang.startsWith(lang.split("-")[0]),
  );
};

/**
 * Get the default/best voice for a language
 * @param lang Language code (e.g., 'en-US')
 * @returns Best available voice or null
 */
export const getDefaultVoiceForLanguage = (
  lang: string,
): SpeechSynthesisVoice | null => {
  const voices = getVoicesForLanguage(lang);

  if (voices.length === 0) return null;

  // Prefer local voices over network voices
  const localVoice = voices.find((v) => v.localService);
  if (localVoice) return localVoice;

  // Prefer default voice
  const defaultVoice = voices.find((v) => v.default);
  if (defaultVoice) return defaultVoice;

  // Return first available
  return voices[0];
};

/**
 * Request microphone permission
 * @returns Promise<boolean> True if permission granted
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stop all tracks to release the microphone
    stream.getTracks().forEach((track) => track.stop());

    return true;
  } catch (error) {
    console.error("Microphone permission denied:", error);
    return false;
  }
};

/**
 * Check if microphone is available
 * @returns Promise<boolean> True if microphone is available
 */
export const isMicrophoneAvailable = async (): Promise<boolean> => {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return false;
    }

    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasAudioInput = devices.some(
      (device) => device.kind === "audioinput",
    );

    return hasAudioInput;
  } catch (error) {
    console.error("Error checking microphone availability:", error);
    return false;
  }
};

/**
 * Supported languages for Web Speech API
 * Note: Actual support may vary by browser
 */
export const SUPPORTED_LANGUAGES = [
  { code: "en-US", name: "English (United States)" },
  { code: "en-GB", name: "English (United Kingdom)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "es-MX", name: "Spanish (Mexico)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "de-DE", name: "German (Germany)" },
  { code: "it-IT", name: "Italian (Italy)" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "ja-JP", name: "Japanese" },
  { code: "ko-KR", name: "Korean" },
  { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
  { code: "hi-IN", name: "Hindi (India)" },
  { code: "ru-RU", name: "Russian" },
];

/**
 * Get language name from code
 */
export const getLanguageName = (code: string): string => {
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
  return lang ? lang.name : code;
};

/**
 * Format time for voice playback duration
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "1:23")
 */
export const formatSpeechDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Estimate speech duration based on text length
 * Average English speech rate: ~150 words per minute
 * @param text Text to estimate
 * @param wordsPerMinute Average speaking rate
 * @returns Estimated duration in seconds
 */
export const estimateSpeechDuration = (
  text: string,
  wordsPerMinute: number = 150,
): number => {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil((words / wordsPerMinute) * 60);
};
