from typing import List

from pydantic import BaseModel, Field

from langchain_core.tools import BaseTool

from backend.src.tools.registry import registry


class SkillMetadata(BaseModel):
    """每个 Skill 的元数据，input_types 为必填字段，用于多模态路由。"""

    name: str
    description: str = ""
    input_types: List[str]  # e.g. ["text"] or ["image", "text"]


def register_skill(tool: BaseTool, metadata: SkillMetadata) -> BaseTool:
    """将工具注册为 skill，同时写入工具注册表和 skill 元数据索引。"""
    if not metadata.input_types:
        raise ValueError(
            f"Skill '{metadata.name}' must declare at least one input_types value"
        )
    registry._tools[tool.name] = tool
    _skill_meta[tool.name] = metadata
    return tool


_skill_meta: dict[str, SkillMetadata] = {}


def get_skill_metadata(tool_name: str) -> SkillMetadata | None:
    return _skill_meta.get(tool_name)
