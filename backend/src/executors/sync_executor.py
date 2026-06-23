import asyncio
from typing import Any

from backend.src.agent.graph import graph
from backend.src.executors.base import BaseAgentExecutor


class SyncExecutor(BaseAgentExecutor):
    """同步执行器：内部调用 graph.ainvoke，线程安全，单线程内复用事件循环。"""

    def run(self, initial_state: dict[str, Any]) -> dict[str, Any]:
        return asyncio.run(graph.ainvoke(initial_state))

    async def arun(self, initial_state: dict[str, Any]) -> dict[str, Any]:
        return await graph.ainvoke(initial_state)
