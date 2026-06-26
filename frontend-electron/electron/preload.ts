import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  sendMessage: (messages: Array<{ role: string; content: string }>) =>
    ipcRenderer.invoke("chat:send", messages),
  checkHealth: () => ipcRenderer.invoke("health:check"),
  streamChat: (
    messages: Array<{ role: string; content: string }>,
    callbacks: {
      onToken: (content: string) => void;
      onDone: (threadId: string) => void;
      onError: (error: string) => void;
    }
  ) => {
    const channel = `chat:stream:${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const cleanup = () => {
      ipcRenderer.removeAllListeners(`${channel}:token`);
      ipcRenderer.removeAllListeners(`${channel}:tool_start`);
      ipcRenderer.removeAllListeners(`${channel}:tool_end`);
      ipcRenderer.removeAllListeners(`${channel}:done`);
      ipcRenderer.removeAllListeners(`${channel}:error`);
    };

    ipcRenderer.on(`${channel}:token`, (_event, content: string) => {
      callbacks.onToken(content);
    });

    ipcRenderer.on(`${channel}:done`, (_event, threadId: string) => {
      cleanup();
      callbacks.onDone(threadId);
    });

    ipcRenderer.on(`${channel}:error`, (_event, error: string) => {
      cleanup();
      callbacks.onError(error);
    });

    ipcRenderer.send("chat:stream:start", channel, messages);
  },
  session: {
    list: () => ipcRenderer.invoke("session:list"),
    load: (sessionId: string) => ipcRenderer.invoke("session:load", sessionId),
    save: (sessionId: string, messages: any[]) =>
      ipcRenderer.invoke("session:save", sessionId, messages),
    create: (title: string) => ipcRenderer.invoke("session:create", title),
    delete: (sessionId: string) =>
      ipcRenderer.invoke("session:delete", sessionId),
    rename: (sessionId: string, newTitle: string) =>
      ipcRenderer.invoke("session:rename", sessionId, newTitle),
  },
});
