"""临时测试：异步调用 graph.ainvoke，验证图谱能跑通。"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.src.agent.graph import graph


async def main():
    initial_state = {
        "messages": [{"role": "user", "content": "你好"}],
        "current_step": "idle",
        "step_count": 0,
    }

    result = await graph.ainvoke(initial_state)
    last_msg = result["messages"][-1]
    print("[OK] graph.ainvoke succeeded")
    print(f"     step_count: {result['step_count']}")
    print(f"     current_step: {result['current_step']}")
    print(f"     reply: {last_msg.content[:200]}")


if __name__ == "__main__":
    asyncio.run(main())
