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
  const currentStep = ref<string>("idle");
  const modelId = ref<string>("default");

  function updateProgress(step: string) {
    currentStep.value = step;
  }

  async function sendMessage(content: string) {
    isLoading.value = true;
    currentStep.value = "thinking";
    messages.value.push({ role: "user", content });

    try {
      const result = await window.api.sendMessage(content);
      messages.value.push({ role: "assistant", content: result.answer });
      taskId.value = result.thread_id;
      updateProgress("idle");
    } catch (err: any) {
      const errorText = err?.message || String(err);
      messages.value.push({
        role: "assistant",
        content: `**Error:** ${errorText}`,
      });
      updateProgress("idle");
    } finally {
      isLoading.value = false;
    }
  }

  return { messages, isLoading, taskId, currentStep, modelId, sendMessage, updateProgress };
});
