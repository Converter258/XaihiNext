<template>
  <div id="app-root">
    <ChatView />
  </div>
</template>

<script setup lang="ts">
import ChatView from "./components/ChatView.vue";
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
