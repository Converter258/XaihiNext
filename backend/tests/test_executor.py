"""验证 executor.run / executor.arun 都能返回正确结果。"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from backend.src.api.dependencies import executor


INITIAL_STATE = {
    "messages": [{"role": "user", "content": "你好"}],
    "current_step": "idle",
    "step_count": 0,
}


def test_sync_run():
    result = executor.run(INITIAL_STATE)
    last_msg = result["messages"][-1]
    assert result["step_count"] >= 1
    assert result["current_step"] == "done"
    assert len(last_msg.content) > 0
    print(f"[OK] test_sync_run passed — reply: {last_msg.content[:80]}")


async def _async_test():
    result = await executor.arun(INITIAL_STATE)
    last_msg = result["messages"][-1]
    assert result["step_count"] >= 1
    assert result["current_step"] == "done"
    assert len(last_msg.content) > 0
    print(f"[OK] test_arun passed — reply: {last_msg.content[:80]}")


def test_arun():
    asyncio.run(_async_test())


if __name__ == "__main__":
    test_sync_run()
    test_arun()
    print("[OK] All executor tests passed")
