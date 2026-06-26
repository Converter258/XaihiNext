/// <reference types="vite/client" />

declare global {
  interface Message {
    role: "user" | "assistant";
    content: string;
  }

  interface SessionMeta {
    id: string;
    title: string;
    modelId: string;
    created_at: string;
    updated_at: string;
    current_branch: string;
  }

  interface StreamCallbacks {
    onToken: (content: string) => void;
    onDone: (threadId: string) => void;
    onError: (error: string) => void;
  }

  interface Window {
    api: {
      sendMessage(messages: Message[]): Promise<{
        answer: string;
        thread_id: string;
      }>;
      checkHealth(): Promise<{
        status: string;
        model: string;
      }>;
      streamChat(
        messages: Message[],
        callbacks: StreamCallbacks
      ): void;
      session: {
        list(): Promise<SessionMeta[]>;
        load(sessionId: string): Promise<Message[]>;
        save(sessionId: string, messages: Message[]): Promise<void>;
        create(title: string): Promise<string>;
        delete(sessionId: string): Promise<void>;
        rename(sessionId: string, newTitle: string): Promise<void>;
      };
    };
  }
}

export {};
