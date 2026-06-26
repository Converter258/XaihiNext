<template>
  <div id="app-root">
    <Sidebar />
    <div class="main-area">
      <ChatView />
      <StatusBar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import Sidebar from "./components/Sidebar.vue";
import ChatView from "./components/ChatView.vue";
import StatusBar from "./components/StatusBar.vue";
import { useSessionsStore } from "./stores/sessions";

const sessionsStore = useSessionsStore();

onMounted(() => {
  sessionsStore.init();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
#app-root {
  height: 100vh;
  display: flex;
  flex-direction: row;
}
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
