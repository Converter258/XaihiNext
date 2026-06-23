"""内置工具：导入即自动注册到全局 registry。"""
from langchain_core.tools import tool

from backend.src.tools.registry import registry


@registry.register()
@tool
def calculator(expression: str) -> str:
    """Evaluate a mathematical expression. Input a valid Python expression like '2+2' or '100/3'."""
    try:
        return str(eval(expression))
    except Exception as e:
        return f"计算错误: {e}"
