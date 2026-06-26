import { app } from "electron";
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";

function getSessionsRoot(): string {
  return path.join(app.getPath("userData"), "XN-Sessions");
}

function sessionDir(sessionId: string): string {
  return path.join(getSessionsRoot(), sessionId);
}

function configPath(sessionId: string): string {
  return path.join(sessionDir(sessionId), "config.json");
}

function messagesPath(sessionId: string): string {
  return path.join(sessionDir(sessionId), "main", "messages.jsonl");
}

async function readConfig(sessionId: string): Promise<any> {
  const raw = await fs.readFile(configPath(sessionId), "utf-8");
  return JSON.parse(raw);
}

async function writeConfig(sessionId: string, data: any): Promise<void> {
  await fs.writeFile(configPath(sessionId), JSON.stringify(data, null, 2), "utf-8");
}

async function touchUpdatedAt(sessionId: string): Promise<void> {
  try {
    const cfg = await readConfig(sessionId);
    cfg.updated_at = new Date().toISOString();
    await writeConfig(sessionId, cfg);
  } catch {
    // config may not exist yet — silently ignore
  }
}

// --- Public API ---

export async function listSessions(): Promise<SessionMeta[]> {
  try {
    const root = getSessionsRoot();
    await fs.mkdir(root, { recursive: true });

    const entries = await fs.readdir(root, { withFileTypes: true });
    const sessions: SessionMeta[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      try {
        const cfg = await readConfig(entry.name);
        sessions.push({
          id: entry.name,
          title: cfg.title || "未命名",
          modelId: cfg.modelId || "default",
          created_at: cfg.created_at || new Date().toISOString(),
          updated_at: cfg.updated_at || new Date().toISOString(),
          current_branch: cfg.current_branch || "main",
        });
      } catch {
        // Skip directories without valid config.json
      }
    }

    sessions.sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return sessions;
  } catch (err: any) {
    throw new Error(`Failed to list sessions: ${err.message}`);
  }
}

export async function loadMessages(sessionId: string): Promise<Message[]> {
  try {
    const fp = messagesPath(sessionId);
    const raw = await fs.readFile(fp, "utf-8");
    return raw
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as Message);
  } catch (err: any) {
    if (err.code === "ENOENT") return [];
    throw new Error(`Failed to load messages for ${sessionId}: ${err.message}`);
  }
}

export async function saveMessages(
  sessionId: string,
  messages: Message[]
): Promise<void> {
  try {
    const fp = messagesPath(sessionId);
    await fs.mkdir(path.dirname(fp), { recursive: true });
    const content = messages.map((m) => JSON.stringify(m)).join("\n");
    await fs.writeFile(fp, content, "utf-8");
    await touchUpdatedAt(sessionId);
  } catch (err: any) {
    throw new Error(`Failed to save messages for ${sessionId}: ${err.message}`);
  }
}

export async function createSession(title: string): Promise<string> {
  try {
    const id = crypto.randomUUID();
    const dir = sessionDir(id);
    const now = new Date().toISOString();

    await fs.mkdir(path.join(dir, "main"), { recursive: true });
    await fs.mkdir(path.join(dir, "branches"), { recursive: true });

    await writeConfig(id, {
      title,
      modelId: "default",
      created_at: now,
      updated_at: now,
      current_branch: "main",
    });

    // Create empty messages file
    await fs.writeFile(messagesPath(id), "", "utf-8");

    return id;
  } catch (err: any) {
    throw new Error(`Failed to create session: ${err.message}`);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  try {
    await fs.rm(sessionDir(sessionId), { recursive: true, force: true });
  } catch (err: any) {
    throw new Error(`Failed to delete session ${sessionId}: ${err.message}`);
  }
}

export async function renameSession(
  sessionId: string,
  newTitle: string
): Promise<void> {
  try {
    const cfg = await readConfig(sessionId);
    cfg.title = newTitle;
    cfg.updated_at = new Date().toISOString();
    await writeConfig(sessionId, cfg);
  } catch (err: any) {
    throw new Error(`Failed to rename session ${sessionId}: ${err.message}`);
  }
}
