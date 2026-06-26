// Shared types used by both Electron main process and Vue renderer.
// Mirrors the declarations in src/env.d.ts but without vite directives.

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SessionMeta {
  id: string;
  title: string;
  modelId: string;
  created_at: string;
  updated_at: string;
  current_branch: string;
}
