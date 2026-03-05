export interface ChatMessage {
  id: string;
  message: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export interface ChatResponse {
  reply: string;
  timestamp: string;
  confidence?: number;
}
