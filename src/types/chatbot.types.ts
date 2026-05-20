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
  sessionId?: string;
  source?:
    | "static"
    | "file_bank"
    | "onedrive"
    | "app"
    | "ai"
    | "workflow_brain"
    | "n8n"
    | "error";
  routedTo?: string;
  documents?: ChatDocumentResult[];
}

export interface ChatDocumentResult {
  id: string;
  name: string;
  url: string;
  source: "local" | "onedrive";
  description?: string;
  tags?: string[];
}

export interface ChatContextTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    history?: ChatContextTurn[];
    target?: ChatTarget;
  };
}

export interface ChatTarget {
  type: "auto" | "workflow_brain" | "external_app" | "file_bank";
  workflowBrainCategoryId?: string;
  appName?: string;
  documentSource?: "all" | "local" | "onedrive";
}

export interface ChatHistoryResponse {
  sessionId: string;
  history: ChatContextTurn[];
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
