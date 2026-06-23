# backend/src/agent/state.py
from typing import Annotated, List, Literal
from typing import TypedDict

# 注意：LangGraph 1.0+ 统一从 langgraph.graph.message 导入
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """
    Agent 的状态管理
    - messages: 使用 add_messages reducer，自动追加新消息，避免手动 extend
    - current_step: 跟踪当前步骤（闲置/思考/执行/完成），为前端展示进度埋点
    """
    messages: Annotated[List[dict], add_messages]
    current_step: Literal["idle", "thinking", "acting", "done"]  # 未来可对应前端进度条
    
    # （可选）为了未来长任务检查点，预留一个 step_count
    step_count: int  # 记录当前循环次数，防止死循环