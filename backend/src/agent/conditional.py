from backend.src.agent.state import AgentState


def should_continue(state: AgentState) -> str:
    """判断是否继续调用工具，还是直接结束。"""
    messages = state.get("messages", [])
    if not messages:
        return "__end__"

    last_msg = messages[-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "call_tool"
    return "__end__"
