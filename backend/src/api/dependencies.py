from backend.src.executors.sync_executor import SyncExecutor

# 全局唯一执行器实例。未来切 Celery 只需改这一行：
# from backend.src.executors.celery_executor import CeleryExecutor
# executor = CeleryExecutor()
executor = SyncExecutor()
