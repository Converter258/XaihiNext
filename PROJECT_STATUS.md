# XN Agent — 项目状态文档

> 最后更新：2026-06-26

## 项目简介

XN 是一个基于 **LangGraph + Electron + Vue 3** 的桌面 AI Agent 应用。
后端使用 FastAPI + LangGraph 构建可扩展的 Agent 图，前端使用 Electron + Vue 3 + Pinia 提供桌面交互界面。
通过 OpenAI 兼容 API（默认 DeepSeek）驱动 LLM，支持工具调用、流式输出、多会话管理。

---

## 目录结构

```
XN/
├── backend/                          # Python 后端
│   ├── config/
│   │   └── settings.py               # Pydantic 配置（MODEL_NAME, API_KEY, BASE_URL）
│   └── src/
│       ├── agent/
│       │   ├── state.py              # AgentState TypedDict（messages, current_step, step_count）
│       │   ├── conditional.py        # should_continue 路由判断
│       │   ├── nodes.py              # call_model（LLM 调用 + 流式）+ call_tool（工具执行）
│       │   └── graph.py              # StateGraph 编排（START → model → tool loop → END）
│       ├── api/
│       │   ├── app.py                # FastAPI 工厂（CORS + 注册路由）
│       │   ├── dependencies.py       # executor 单例注入
│       │   └── routes/
│       │       ├── agent.py          # POST /v1/chat, POST /v1/chat/start, GET /v1/chat/stream/{id}
│       │       └── health.py         # GET /v1/health
│       ├── executors/
│       │   ├── base.py               # BaseAgentExecutor 抽象基类（run, arun, astream）
│       │   └── sync_executor.py      # SyncExecutor（graph.ainvoke + graph.astream_events）
│       ├── tools/
│       │   ├── registry.py           # ToolRegistry（装饰器注册 + 查询）
│       │   └── builtins.py           # calculator 工具
│       └── skills/
│           └── loader.py             # SkillMetadata 扩展层（预留）
│   └── tests/
│       └── test_executor.py          # executor 单元测试
├── frontend/                         # Electron + Vue 3 前端
│   ├── electron/
│   │   ├── main.ts                   # 主进程（chat:send, chat:stream:start, health, session CRUD）
│   │   ├── preload.ts                # 预加载桥（sendMessage, streamChat, checkHealth, session.*）
│   │   ├── sessionStore.ts           # 文件系统会话持久化（XN-Sessions/）
│   │   └── shared.d.ts              # 主进程共享类型（Message, SessionMeta）
│   ├── services/
│   │   └── apiClient.ts              # Axios + fetch SSE（streamChat with ReadableStream）
│   └── src/
│       ├── App.vue                   # 根布局（Sidebar + ChatView + StatusBar）
│       ├── main.ts                   # Vue 入口（createPinia）
│       ├── env.d.ts                  # 全局类型（Message, SessionMeta, StreamCallbacks, Window.api）
│       ├── components/
│       │   ├── ChatView.vue          # 聊天界面（流式渲染、Markdown、打字机效果）
│       │   ├── Sidebar.vue           # 会话侧边栏（时间分组、右键菜单、新建会话）
│       │   └── StatusBar.vue         # 底部状态栏（健康检查 5s 轮询、模型名、步骤状态）
│       └── stores/
│           ├── chat.ts               # 聊天 Store（流式 sendMessage + isStreaming）
│           └── sessions.ts           # 会话 Store（init, switchTo, sendAndSave, CRUD）
├── .env                              # 环境变量（实际运行，不提交）
├── .env.example                      # 环境变量模板
├── requirements.txt                  # Python 依赖（pydantic-settings, langgraph）
├── start.bat                         # Windows 启动脚本
├── start.sh                          # Unix 启动脚本
└── check.sh                          # CI 健康检查脚本
```

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | FastAPI | - |
| Agent 框架 | LangGraph 1.0+ | - |
| LLM 客户端 | LangChain (ChatOpenAI) | - |
| 配置管理 | Pydantic Settings | - |
| 桌面框架 | Electron | 39.2.7 |
| UI 框架 | Vue 3 | 3.5+ |
| 状态管理 | Pinia | 3.0+ |
| 构建工具 | Vite | 6.3+ |
| Markdown 渲染 | Marked | 17.0+ |
| HTTP 客户端 | Axios + fetch | - |
| 类型系统 | TypeScript | 5.9+ |

---

## 架构层级（单向依赖）

```
┌──────────────────────────────────────────────┐
│ 前端 (Vue 3 + Pinia)                         │
│   Sidebar.vue → sessions Store               │
│   ChatView.vue → chat Store                  │
│   StatusBar.vue ← chat Store                 │
└──────────────┬───────────────────────────────┘
               │ IPC (contextBridge)
┌──────────────▼───────────────────────────────┐
│ Electron 主进程                               │
│   main.ts → apiClient.ts → HTTP              │
│   sessionStore.ts → 文件系统                  │
└──────────────┬───────────────────────────────┘
               │ HTTP (localhost:8000)
┌──────────────▼───────────────────────────────┐
│ FastAPI 路由层                                │
│   routes/agent.py（chat + SSE streaming）     │
│   routes/health.py（健康检查）                │
│   dependencies.py（executor 注入）            │
└──────────────┬───────────────────────────────┘
               │ 方法调用
┌──────────────▼───────────────────────────────┐
│ 执行器层                                      │
│   base.py（抽象基类）                         │
│   sync_executor.py（graph.ainvoke/astream）   │
└──────────────┬───────────────────────────────┘
               │ LangGraph API
┌──────────────▼───────────────────────────────┐
│ Agent 图层                                    │
│   graph.py（StateGraph 编排）                 │
│   nodes.py（call_model + call_tool）          │
│   state.py（AgentState）                      │
│   conditional.py（路由判断）                  │
└──────────────┬───────────────────────────────┘
               │
┌──────────────▼───────────────────────────────┐
│ 工具层                                        │
│   registry.py（ToolRegistry 单例）            │
│   builtins.py（calculator）                   │
└──────────────────────────────────────────────┘
```

核心规则：**路由 → 执行器 → Graph，绝不反向导入**。

---

## 已实现功能

### 后端
- [x] 纯净 LangGraph 图（call_model → conditional → call_tool 循环）
- [x] 同步 / 异步 / 流式执行器（SyncExecutor: run, arun, astream）
- [x] FastAPI 路由（阻塞 + SSE 流式双模式）
- [x] 流式输出 SSE（POST /v1/chat/start → GET /v1/chat/stream/{id}）
- [x] 健康检查端点（GET /v1/health）
- [x] 工具注册表（含 input_types 元数据）
- [x] CORS 中间件
- [x] Pydantic Settings 配置管理

### 前端
- [x] Electron IPC 桥（sendMessage, streamChat, checkHealth, session.* 共 9 个通道）
- [x] Vue 3 + Pinia 聊天界面
- [x] 流式输出（打字机效果，SSE → ReadableStream → IPC 事件推送）
- [x] 会话管理系统（基于文件系统的 XN-Sessions/）
- [x] 侧边栏（时间分组：今天 / 昨天 / 更早，右键重命名 / 删除）
- [x] 底部状态栏（后端在线状态 5s 轮询、当前模型、步骤状态）
- [x] Markdown 渲染（含代码块样式）
- [x] 自动滚动（新消息 + 流式内容变化双触发）

### 会话存储目录结构
```
%APPDATA%/XN/XN-Sessions/
└── {uuid}/
    ├── config.json          # { title, modelId, created_at, updated_at, current_branch }
    ├── main/
    │   └── messages.jsonl   # 每行一条 JSON（流式完成后覆写）
    └── branches/            # 预留分支目录（当前为空）
```

---

## API 端点一览

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/v1/health` | 健康检查，返回 `{status, model}` |
| `POST` | `/v1/chat` | 阻塞式聊天，返回 `{answer, thread_id}` |
| `POST` | `/v1/chat/start` | 流式聊天初始化，返回 `{thread_id}` |
| `GET` | `/v1/chat/stream/{id}` | SSE 流式输出（`text/event-stream`），逐 token 推送 |

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `OPENAI_API_KEY` | LLM API 密钥 | （必填） |
| `MODEL_NAME` | 模型标识符 | `gpt-4o-mini` |
| `BASE_URL` | API 端点地址 | （空） |
| `USE_ASYNC_EXECUTOR` | 异步执行器开关 | `false` |
| `REDIS_URL` | Celery Redis 地址（预留） | （空） |

---

## 启动方式

```bash
# Windows（一键启动）
start.bat

# 手动启动
cd backend
python -m uvicorn backend.src.api.app:app --host 127.0.0.1 --port 8000

cd frontend
npm run build    # tsc && vite build
npx electron .   # 启动桌面窗口
```

---

## 开发命令

```bash
# 后端测试
python backend/test_graph.py
python -m pytest backend/tests/

# 前端 TypeScript 检查
cd frontend && npx tsc --noEmit

# 前端热重载开发
cd frontend && npx vite

# 后端导入验证
python -c "from backend.src.api.routes.agent import router; print('OK')"

# 测试 SSE 流
curl -X POST http://127.0.0.1:8000/v1/chat/start \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
curl -N http://127.0.0.1:8000/v1/chat/stream/{thread_id}

# 测试阻塞接口
curl -X POST http://127.0.0.1:8000/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
```
