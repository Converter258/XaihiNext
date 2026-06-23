import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 30000,
});

export const chatService = {
  async sendMessage(message: string, attachments: any[] = []) {
    const response = await apiClient.post("/v1/chat", {
      message,
      attachments,
    });
    return response.data;
  },
};
