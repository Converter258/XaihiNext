import axios from "axios";

const API_BASE = "http://127.0.0.1:8000";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
});

export const chatService = {
  async sendMessage(messages: Array<{ role: string; content: string }>) {
    const response = await apiClient.post("/v1/chat", {
      messages,
    });
    return response.data;
  },

  async checkHealth() {
    const response = await apiClient.get("/v1/health");
    return response.data;
  },
};

// ── Streaming ──
export interface StreamCallbacks {
  onToken: (content: string) => void;
  onToolStart?: (name: string) => void;
  onToolEnd?: (name: string) => void;
  onDone: (threadId: string) => void;
  onError: (error: string) => void;
}

export async function streamChat(
  messages: Array<{ role: string; content: string }>,
  callbacks: StreamCallbacks
): Promise<void> {
  const startRes = await fetch(`${API_BASE}/v1/chat/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!startRes.ok) {
    callbacks.onError(`Start failed: ${startRes.status}`);
    return;
  }

  const { thread_id } = await startRes.json();

  const streamRes = await fetch(`${API_BASE}/v1/chat/stream/${thread_id}`);

  if (!streamRes.ok) {
    callbacks.onError(`Stream failed: ${streamRes.status}`);
    return;
  }

  const reader = streamRes.body!.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;

        try {
          const data = JSON.parse(line.slice(6));
          switch (data.type) {
            case "token":
              callbacks.onToken(data.content);
              break;
            case "tool_start":
              callbacks.onToolStart?.(data.name);
              break;
            case "tool_end":
              callbacks.onToolEnd?.(data.name);
              break;
            case "done":
              callbacks.onDone(thread_id);
              return;
            case "error":
              callbacks.onError(data.message);
              return;
          }
        } catch {
          // skip malformed JSON
        }
      }
    }
  } catch (err: any) {
    callbacks.onError(err.message || "Stream connection lost");
  } finally {
    reader.releaseLock();
  }
}
