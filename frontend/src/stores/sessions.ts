import { ref } from "vue";
import { defineStore } from "pinia";

function stripReactive<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const useSessionsStore = defineStore("sessions", () => {
  const sessions = ref<SessionMeta[]>([]);
  const currentSessionId = ref<string | null>(null);
  const currentMessages = ref<Message[]>([]);

  async function init() {
    sessions.value = await window.api.session.list();
    if (sessions.value.length === 0) {
      const id = await window.api.session.create("新对话");
      sessions.value = await window.api.session.list();
    }
    currentSessionId.value = sessions.value[0].id;
    currentMessages.value = await window.api.session.load(currentSessionId.value!);
  }

  async function switchTo(sessionId: string) {
    if (currentSessionId.value === sessionId) return;
    if (currentSessionId.value && currentMessages.value.length > 0) {
      try {
        await window.api.session.save(
          currentSessionId.value,
          stripReactive(currentMessages.value)
        );
      } catch {
        // best-effort save before switching
      }
    }
    currentSessionId.value = sessionId;
    currentMessages.value = await window.api.session.load(sessionId);
  }

  async function sendAndSave(userContent: string, aiContent: string) {
    currentMessages.value.push({ role: "user", content: userContent });
    currentMessages.value.push({ role: "assistant", content: aiContent });
    if (currentSessionId.value) {
      try {
        await window.api.session.save(
          currentSessionId.value,
          stripReactive(currentMessages.value)
        );
      } catch {
        // save failed but messages remain in UI
      }
      sessions.value = await window.api.session.list();
    }
  }

  async function createSession(title: string): Promise<string> {
    const id = await window.api.session.create(title);
    sessions.value = await window.api.session.list();
    await switchTo(id);
    return id;
  }

  async function deleteSession(sessionId: string) {
    await window.api.session.delete(sessionId);
    sessions.value = await window.api.session.list();
    if (currentSessionId.value === sessionId) {
      if (sessions.value.length > 0) {
        await switchTo(sessions.value[0].id);
      } else {
        const newId = await window.api.session.create("新对话");
        sessions.value = await window.api.session.list();
        await switchTo(newId);
      }
    }
  }

  async function renameSession(sessionId: string, newTitle: string) {
    await window.api.session.rename(sessionId, newTitle);
    sessions.value = await window.api.session.list();
  }

  async function refreshSessionsList() {
    sessions.value = await window.api.session.list();
  }

  return {
    sessions,
    currentSessionId,
    currentMessages,
    init,
    switchTo,
    sendAndSave,
    createSession,
    deleteSession,
    renameSession,
    refreshSessionsList,
  };
});
