<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2 class="sidebar-title">会话</h2>
      <button class="new-btn" @click="handleNewSession">+ 新对话</button>
    </div>

    <div class="session-list">
      <template v-for="group in groupedSessions" :key="group.label">
        <div class="group-label">{{ group.label }}</div>
        <div
          v-for="session in group.items"
          :key="session.id"
          :class="['session-item', { active: session.id === sessionsStore.currentSessionId }]"
          @click="sessionsStore.switchTo(session.id)"
          @contextmenu.prevent="openContextMenu($event, session)"
        >
          <span class="session-title">{{ session.title }}</span>
        </div>
      </template>
    </div>

    <!-- Context menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="context-item" @click="handleRename">重命名</div>
      <div class="context-item danger" @click="handleDelete">删除</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useSessionsStore } from "../stores/sessions";

const sessionsStore = useSessionsStore();

// --- Time grouping ---
interface SessionGroup {
  label: string;
  items: SessionMeta[];
}

const groupedSessions = computed<SessionGroup[]>(() => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, SessionMeta[]> = { "今天": [], "昨天": [], "更早": [] };

  for (const s of sessionsStore.sessions) {
    const d = new Date(s.updated_at);
    if (d.toDateString() === today.toDateString()) {
      groups["今天"].push(s);
    } else if (d.toDateString() === yesterday.toDateString()) {
      groups["昨天"].push(s);
    } else {
      groups["更早"].push(s);
    }
  }

  return Object.entries(groups)
    .filter(([_, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
});

// --- Context menu ---
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  sessionId: null as string | null,
  title: "",
});

function openContextMenu(event: MouseEvent, session: SessionMeta) {
  let x = event.clientX;
  let y = event.clientY;
  if (x + 120 > window.innerWidth) x = window.innerWidth - 130;
  if (y + 60 > window.innerHeight) y = window.innerHeight - 70;

  contextMenu.value = {
    visible: true,
    x,
    y,
    sessionId: session.id,
    title: session.title,
  };
}

function closeContextMenu() {
  contextMenu.value.visible = false;
}

function handleRename() {
  const newTitle = prompt("请输入新名称", contextMenu.value.title);
  if (newTitle && newTitle.trim()) {
    sessionsStore.renameSession(contextMenu.value.sessionId!, newTitle.trim());
  }
  closeContextMenu();
}

async function handleDelete() {
  if (confirm(`确定要删除会话 "${contextMenu.value.title}" 吗？`)) {
    await sessionsStore.deleteSession(contextMenu.value.sessionId!);
  }
  closeContextMenu();
}

async function handleNewSession() {
  await sessionsStore.createSession("新对话");
}

onMounted(() => document.addEventListener("click", closeContextMenu));
onUnmounted(() => document.removeEventListener("click", closeContextMenu));
</script>

<style scoped>
.sidebar {
  width: 280px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e5e7eb;
  background: #fafafa;
  user-select: none;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.new-btn {
  width: 100%;
  padding: 8px 0;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.new-btn:hover {
  background: #1d4ed8;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.group-label {
  padding: 6px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: none;
}

.session-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  transition: background 0.1s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-item:hover {
  background: #e5e7eb;
}

.session-item.active {
  background: #dbeafe;
  font-weight: 600;
  color: #1d4ed8;
}

.session-title {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Context menu */
.context-menu {
  position: fixed;
  z-index: 1000;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  min-width: 120px;
}

.context-item {
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  color: #374151;
  transition: background 0.1s;
}

.context-item:hover {
  background: #f3f4f6;
}

.context-item.danger {
  color: #ef4444;
}

.context-item.danger:hover {
  background: #fef2f2;
}
</style>
