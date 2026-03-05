import api from "./api";
import { ChatResponse } from "../types/chatbot.types";

export const chatbotService = {
  async sendMessage(message: string): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>("/chatbot/message", {
      message,
    });
    return response.data;
  },
};
