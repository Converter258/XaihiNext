// Directly test the IPC handler (bypassing the Electron GUI)
const { chatService } = require("./dist/services/apiClient");

(async () => {
  try {
    const result = await chatService.sendMessage("test");
    console.log("[OK] apiClient.sendMessage succeeded");
    console.log("     answer:", result.answer);
    console.log("     thread_id:", result.thread_id);
  } catch (err) {
    console.error("[FAIL]", err.message);
  }
})();
