import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { chatService, streamChat } from "../services/apiClient";
import {
  listSessions,
  loadMessages,
  saveMessages,
  createSession,
  deleteSession,
  renameSession,
} from "./sessionStore";

const isDev = process.env.NODE_ENV === "development";

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  }
}

// --- Chat ---
ipcMain.handle(
  "chat:send",
  async (_event, messages: Array<{ role: string; content: string }>) => {
    return await chatService.sendMessage(messages);
  }
);

// --- Streaming Chat ---
ipcMain.on(
  "chat:stream:start",
  (event, channel: string, messages: Array<{ role: string; content: string }>) => {
    streamChat(messages, {
      onToken: (content: string) => {
        event.sender.send(`${channel}:token`, content);
      },
      onToolStart: (name: string) => {
        event.sender.send(`${channel}:tool_start`, name);
      },
      onToolEnd: (name: string) => {
        event.sender.send(`${channel}:tool_end`, name);
      },
      onDone: (threadId: string) => {
        event.sender.send(`${channel}:done`, threadId);
      },
      onError: (error: string) => {
        event.sender.send(`${channel}:error`, error);
      },
    });
  }
);

// --- Health ---
ipcMain.handle("health:check", async () => {
  return await chatService.checkHealth();
});

// --- Sessions ---
ipcMain.handle("session:list", async () => {
  return await listSessions();
});

ipcMain.handle("session:load", async (_event, sessionId: string) => {
  return await loadMessages(sessionId);
});

ipcMain.handle(
  "session:save",
  async (_event, sessionId: string, messages: any[]) => {
    await saveMessages(sessionId, messages);
  }
);

ipcMain.handle("session:create", async (_event, title: string) => {
  return await createSession(title);
});

ipcMain.handle("session:delete", async (_event, sessionId: string) => {
  await deleteSession(sessionId);
});

ipcMain.handle(
  "session:rename",
  async (_event, sessionId: string, newTitle: string) => {
    await renameSession(sessionId, newTitle);
  }
);

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
