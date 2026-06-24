import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { chatService } from "../services/apiClient";

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

ipcMain.handle(
  "chat:send",
  async (_event, message: string, attachments: any[] = []) => {
    return await chatService.sendMessage(message, attachments);
  }
);

ipcMain.handle("health:check", async () => {
  return await chatService.checkHealth();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
