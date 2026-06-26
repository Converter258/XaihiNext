<template>
  <div class="chat-container">
    <div class="messages" ref="messagesEl">
      <div
        v-for="(msg, idx) in store.messages"
        :key="idx"
        :class="['message', msg.role]"
      >
        <div class="avatar">{{ msg.role === "user" ? "👤" : "🤖" }}</div>
        <div
          v-if="msg.role === 'assistant' && msg.content === '' && store.isStreaming"
          class="bubble loading"
        >
          <span class="dot-pulse"></span>
        </div>
        <div v-else class="bubble" v-html="renderMarkdown(msg.content)"></div>
      </div>
    </div>

    <div id="progress-area" v-if="store.taskId"></div>

    <div class="input-area">
      <textarea
        ref="inputEl"
        v-model="input"
        class="input-box"
        rows="1"
        placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
        @keydown.enter.exact.prevent="handleSend"
        @input="autoResize"
      ></textarea>
      <button
        class="send-btn"
        :disabled="store.isLoading || store.isStreaming || !input.trim()"
        @click="handleSend"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { marked } from "marked";
import { useChatStore } from "../stores/chat";

const store = useChatStore();

const input = ref("");
const inputEl = ref<HTMLTextAreaElement | null>(null);
const messagesEl = ref<HTMLElement | null>(null);

function renderMarkdown(text: string): string {
  return marked.parse(text) as string;
}

function autoResize() {
  const el = inputEl.value;
  if (!el) return;
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

async function handleSend() {
  const text = input.value.trim();
  if (!text || store.isLoading || store.isStreaming) return;
  input.value = "";
  if (inputEl.value) {
    inputEl.value.style.height = "auto";
  }
  await store.sendMessage(text);
  await nextTick();
  scrollToBottom();
}

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
}

watch(
  () => store.messages.length,
  () => nextTick().then(scrollToBottom)
);

watch(
  () => store.messages.map((m) => m.content),
  () => nextTick().then(scrollToBottom)
);
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message {
  display: flex;
  gap: 0.5rem;
  max-width: 85%;
}

.message.user {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.message.assistant {
  align-self: flex-start;
}

.avatar {
  font-size: 1.4rem;
  flex-shrink: 0;
  line-height: 1;
}

.bubble {
  padding: 0.6rem 1rem;
  border-radius: 12px;
  line-height: 1.55;
}

.message.user .bubble {
  background: #2563eb;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message.assistant .bubble {
  background: #f3f4f6;
  color: #111827;
  border-bottom-left-radius: 4px;
}

.bubble.loading {
  display: flex;
  align-items: center;
  min-height: 2.2rem;
  padding: 0.8rem 1.2rem;
}

.dot-pulse::after {
  content: "Thinking";
  animation: dots 1.5s steps(4, end) infinite;
}

@keyframes dots {
  0% { content: "Thinking"; }
  25% { content: "Thinking."; }
  50% { content: "Thinking.."; }
  75% { content: "Thinking..."; }
}

/* Markdown styles inside assistant bubbles */
.message.assistant .bubble :deep(p) {
  margin: 0.25rem 0;
}
.message.assistant .bubble :deep(pre) {
  background: #1e293b;
  color: #e2e8f0;
  padding: 0.75rem;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5rem 0;
}
.message.assistant .bubble :deep(code) {
  font-family: "Fira Code", monospace;
  font-size: 0.85em;
}
.message.assistant .bubble :deep(ul),
.message.assistant .bubble :deep(ol) {
  margin: 0.25rem 0;
  padding-left: 1.25rem;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem 1rem 1rem;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}

.input-box {
  flex: 1;
  resize: none;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
  font-family: inherit;
  line-height: 1.5;
  outline: none;
  max-height: 160px;
}

.input-box:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

.send-btn {
  padding: 0.5rem 1.25rem;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  cursor: pointer;
  white-space: nowrap;
}

.send-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
