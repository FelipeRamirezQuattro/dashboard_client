import api from "./api";
import {
  ChatHistoryResponse,
  ChatRequest,
  ChatResponse,
} from "../types/chatbot.types";

export const chatbotService = {
  async sendMessage(payload: ChatRequest): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>("/chatbot/message", payload);
    return response.data;
  },

  async getHistory(sessionId: string): Promise<ChatHistoryResponse> {
    const response = await api.get<ChatHistoryResponse>(
      `/chatbot/history?sessionId=${encodeURIComponent(sessionId)}`,
    );
    return response.data;
  },
};
