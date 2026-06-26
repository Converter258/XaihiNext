import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { useSessionsStore } from "./sessions";

function stripReactive<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const useChatStore = defineStore("chat", () => {
  const sessions = useSessionsStore();

  const isLoading = ref(false);
  const isStreaming = ref(false);
  const taskId = ref<string | null>(null);
  const currentStep = ref<string>("idle");
  const modelId = ref<string>("default");

  const messages = computed(() => sessions.currentMessages);

  function updateProgress(step: string) {
    currentStep.value = step;
  }

  async function sendMessage(content: string) {
    if (!sessions.currentSessionId) return;

    const history = sessions.currentMessages;
    const fullMessages: Message[] = [
      ...history,
      { role: "user", content },
    ];
    const plainMessages: Message[] = stripReactive(fullMessages);

    sessions.currentMessages.push({ role: "user", content });
    sessions.currentMessages.push({ role: "assistant", content: "" });

    isLoading.value = true;
    isStreaming.value = true;
    currentStep.value = "thinking";

    window.api.streamChat(plainMessages, {
      onToken: (token: string) => {
        if (isLoading.value) isLoading.value = false;
        const msgs = sessions.currentMessages;
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant") {
          last.content += token;
        }
      },

      onDone: (threadId: string) => {
        isStreaming.value = false;
        isLoading.value = false;
        taskId.value = threadId;
        updateProgress("idle");

        if (sessions.currentSessionId) {
          window.api.session
            .save(
              sessions.currentSessionId,
              stripReactive(sessions.currentMessages)
            )
            .then(() => sessions.refreshSessionsList())
            .catch(() => {});
        }
      },

      onError: (error: string) => {
        isStreaming.value = false;
        isLoading.value = false;
        updateProgress("idle");

        const msgs = sessions.currentMessages;
        const last = msgs[msgs.length - 1];
        if (last && last.role === "assistant") {
          last.content = `**Error:** ${error}`;
        }
      },
    });
  }

  return {
    messages,
    isLoading,
    isStreaming,
    taskId,
    currentStep,
    modelId,
    sendMessage,
    updateProgress,
  };
});
