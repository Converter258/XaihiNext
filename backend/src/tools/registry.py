from typing import Callable, Optional
from langchain_core.tools import BaseTool


class ToolRegistry:
    def __init__(self):
        self._tools: dict[str, BaseTool] = {}

    def register(
        self, name: Optional[str] = None
    ) -> Callable[[BaseTool], BaseTool]:
        def decorator(tool: BaseTool) -> BaseTool:
            key = name or tool.name
            self._tools[key] = tool
            return tool

        return decorator

    def get_tool(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def list_tools(self) -> list[str]:
        return list(self._tools.keys())

    def get_all(self) -> list[BaseTool]:
        return list(self._tools.values())


registry = ToolRegistry()
