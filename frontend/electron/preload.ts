import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  sendMessage: (message: string, attachments: any[] = []) =>
    ipcRenderer.invoke("chat:send", message, attachments),
});
