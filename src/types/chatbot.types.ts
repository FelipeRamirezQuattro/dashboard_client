export interface ChatMessage {
  id: string;
  message: string;
  sender: "user" | "bot";
  timestamp: Date;
  isSpoken?: boolean; // Track if message was delivered via voice
}

export interface ChatResponse {
  reply: string;
  timestamp: string;
  confidence?: number;
}

export interface VoiceSettings {
  enabled: boolean;
  autoSpeak: boolean; // Auto-speak bot responses
  language: string;
  voiceIndex: number | null; // Index of selected voice
  rate: number; // Speech rate (0.1 to 10)
  pitch: number; // Speech pitch (0 to 2)
  volume: number; // Speech volume (0 to 1)
}
