from langchain_openai import ChatOpenAI
from langchain_core.messages import AIMessage, ToolMessage, SystemMessage

from backend.config.settings import settings
from backend.src.agent.state import AgentState
from backend.src.tools.registry import registry
import backend.src.tools  # noqa: F401 — 导入即注册内置工具

# ── LLM ────────────────────────────────────────────────
llm = ChatOpenAI(
    model=settings.MODEL_NAME,
    openai_api_key=settings.OPENAI_API_KEY,
    base_url=settings.BASE_URL,
    temperature=0,
    streaming=True,
)
llm_with_tools = llm.bind_tools(registry.get_all())

SYSTEM_PROMPT = "你是一个乐于助人的 AI 助手。当用户询问计算类问题时，使用 calculator 工具。"


# ── Nodes ──────────────────────────────────────────────
async def call_model(state: AgentState) -> dict:
    messages = list(state.get("messages", []))
    step_count = state.get("step_count", 0)

    full_messages = [SystemMessage(content=SYSTEM_PROMPT)] + messages
    response: AIMessage = await llm_with_tools.ainvoke(full_messages)

    return {
        "messages": [response],
        "current_step": "thinking",
        "step_count": step_count + 1,
    }


async def call_tool(state: AgentState) -> dict:
    messages = list(state.get("messages", []))
    last_msg = messages[-1]

    tool_messages = []
    for tc in last_msg.tool_calls:
        tool_name = tc["name"]
        tool_args = tc["args"]
        t = registry.get_tool(tool_name)
        if t is not None:
            result = t.invoke(tool_args)
            tool_messages.append(
                ToolMessage(content=str(result), tool_call_id=tc["id"])
            )
        else:
            tool_messages.append(
                ToolMessage(
                    content=f"未知工具: {tool_name}", tool_call_id=tc["id"]
                )
            )

    return {
        "messages": tool_messages,
        "current_step": "acting",
    }
