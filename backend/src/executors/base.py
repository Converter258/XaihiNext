from abc import ABC, abstractmethod
from typing import Any, AsyncIterator


class BaseAgentExecutor(ABC):
    """执行器抽象基类——API 层只依赖此类，不感知底层实现。"""

    @abstractmethod
    def run(self, initial_state: dict[str, Any]) -> dict[str, Any]:
        """同步执行 graph，内部自行管理事件循环。"""
        ...

    @abstractmethod
    async def arun(self, initial_state: dict[str, Any]) -> dict[str, Any]:
        """异步执行 graph，适用于 FastAPI async 路由。"""
        ...

    @abstractmethod
    async def astream(self, initial_state: dict[str, Any]) -> AsyncIterator[dict]:
        """流式执行 graph，逐事件产出 token 与工具调用。"""
        ...
