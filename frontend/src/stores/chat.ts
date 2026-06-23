import { ref } from "vue";
import { defineStore } from "pinia";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export const useChatStore = defineStore("chat", () => {
  const messages = ref<Message[]>([]);
  const isLoading = ref(false);
  const taskId = ref<string | null>(null);

  /** 未来轮询进度时使用，目前空实现占位 */
  function updateProgress(_step: string) {
    // TODO: 接入长任务轮询时实现
  }

  async function sendMessage(content: string) {
    isLoading.value = true;
    messages.value.push({ role: "user", content });

    try {
      const result = await window.api.sendMessage(content);
      messages.value.push({ role: "assistant", content: result.answer });
      taskId.value = result.thread_id;
      updateProgress("done");
    } catch (err: any) {
      const errorText = err?.message || String(err);
      messages.value.push({
        role: "assistant",
        content: `**Error:** ${errorText}`,
      });
      updateProgress("error");
    } finally {
      isLoading.value = false;
    }
  }

  return { messages, isLoading, taskId, sendMessage, updateProgress };
});
