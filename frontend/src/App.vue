<template>
  <div id="app-root">
    <ChatView />
    <StatusBar />
  </div>
</template>

<script setup lang="ts">
import ChatView from "./components/ChatView.vue";
import StatusBar from "./components/StatusBar.vue";
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
  flex-direction: column;
}
</style>
