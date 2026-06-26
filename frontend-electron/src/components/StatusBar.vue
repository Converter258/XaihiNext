<template>
  <div class="status-bar">
    <div class="status-item">
      <span class="status-dot" :class="backendOnline ? 'online' : 'offline'"></span>
      <span>{{ backendOnline ? '后端在线' : '连接断开' }}</span>
    </div>
    <div class="status-item">
      <span>模型: {{ chatStore.modelId }}</span>
    </div>
    <div class="status-item">
      <span>{{ stepLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useChatStore } from "../stores/chat";

const chatStore = useChatStore();
const backendOnline = ref(false);

const stepLabels: Record<string, string> = {
  idle: "空闲",
  thinking: "思考中...",
  acting: "执行工具...",
};

const stepLabel = computed(() => stepLabels[chatStore.currentStep] || "空闲");

let healthTimer: ReturnType<typeof setInterval> | null = null;

async function checkHealth() {
  try {
    const result = await window.api.checkHealth();
    backendOnline.value = result.status === "ok";
    if (result.model) {
      chatStore.modelId = result.model;
    }
  } catch {
    backendOnline.value = false;
  }
}

onMounted(() => {
  checkHealth();
  healthTimer = setInterval(checkHealth, 5000);
});

onUnmounted(() => {
  if (healthTimer) {
    clearInterval(healthTimer);
  }
});
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 4px 16px;
  background: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #555;
  user-select: none;
  flex-shrink: 0;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.online {
  background: #4caf50;
}

.status-dot.offline {
  background: #f44336;
}
</style>
