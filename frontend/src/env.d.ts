/// <reference types="vite/client" />

declare global {
  interface Window {
    api: {
      sendMessage(message: string, attachments?: any[]): Promise<{
        answer: string;
        thread_id: string;
      }>;
      checkHealth(): Promise<{
        status: string;
        model: string;
      }>;
    };
  }
}

export {};
