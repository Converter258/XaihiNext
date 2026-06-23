from langgraph.graph import StateGraph, START, END

from backend.src.agent.state import AgentState
from backend.src.agent.nodes import call_model, call_tool
from backend.src.agent.conditional import should_continue


def build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("call_model", call_model)
    workflow.add_node("call_tool", call_tool)

    workflow.add_edge(START, "call_model")
    workflow.add_conditional_edges(
        "call_model",
        should_continue,
        {"call_tool": "call_tool", "__end__": END},
    )
    workflow.add_edge("call_tool", "call_model")

    return workflow.compile(checkpointer=None)


graph = build_graph()
