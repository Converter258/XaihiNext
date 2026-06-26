import asyncio
from typing import Any, AsyncIterator

from backend.src.agent.graph import graph
from backend.src.executors.base import BaseAgentExecutor


class SyncExecutor(BaseAgentExecutor):
    """同步执行器：内部调用 graph.ainvoke，线程安全，单线程内复用事件循环。"""

    def run(self, initial_state: dict[str, Any]) -> dict[str, Any]:
        return asyncio.run(graph.ainvoke(initial_state))

    async def arun(self, initial_state: dict[str, Any]) -> dict[str, Any]:
        return await graph.ainvoke(initial_state)

    async def astream(self, initial_state: dict[str, Any]) -> AsyncIterator[dict]:
        async for event in graph.astream_events(initial_state, version="v2"):
            kind = event["event"]

            if kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                content = chunk.content
                if content:
                    if isinstance(content, str):
                        yield {"type": "token", "content": content}
                    elif isinstance(content, list):
                        for item in content:
                            if isinstance(item, dict) and "text" in item:
                                yield {"type": "token", "content": item["text"]}

            elif kind == "on_tool_start":
                yield {"type": "tool_start", "name": event["name"]}

            elif kind == "on_tool_end":
                yield {"type": "tool_end", "name": event["name"]}
