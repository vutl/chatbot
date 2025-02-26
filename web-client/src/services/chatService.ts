import axios from 'axios';
import { ChatRequestDto, ChatResponseDto, ChatMessage, SystemPromptRequest } from '../types/chat';
import { envConfig } from '../config/env.config';

const API_URL = envConfig.apiUrl;
const OPENAI_API = `${API_URL}/openai`;

export const chatService = {
  /**
   * Tạo phiên chat mới
   */
  async createSession(): Promise<string> {
    const response = await axios.post(`${OPENAI_API}/sessions`);
    return response.data;
  },

  /**
   * Cập nhật system prompt cho phiên chat
   */
  async updateSystemPrompt(sessionId: string, prompt: string): Promise<void> {
    await axios.put(`${OPENAI_API}/sessions/${sessionId}/system-prompt`, {
      prompt,
    } as SystemPromptRequest);
  },

  /**
   * Gửi tin nhắn đến chatbot và nhận phản hồi
   */
  async sendMessage(request: { sessionId?: string; message: string }): Promise<ChatResponseDto> {
    try {
      const chatRequest: ChatRequestDto = {
        sessionId: request.sessionId,
        messages: [
          {
            role: 'user',
            content: request.message
          }
        ]
      };
      
      const response = await axios.post(`${OPENAI_API}/chat`, chatRequest);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi tin nhắn');
      }
      throw error;
    }
  },

  /**
   * Lấy lịch sử chat của một phiên
   */
  async getChatHistory(sessionId: string): Promise<ChatMessage[]> {
    const response = await axios.get(`${OPENAI_API}/sessions/${sessionId}/history`);
    return response.data;
  },

  /**
   * Xóa một phiên chat
   */
  async deleteSession(sessionId: string): Promise<void> {
    await axios.delete(`${OPENAI_API}/sessions/${sessionId}`);
  }
}; 