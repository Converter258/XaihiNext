# backend/config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # 核心开关（未来改为 True 即切换异步）
    USE_ASYNC_EXECUTOR: bool = False
    
    # 预留给 Celery 的 Redis 地址（先留空，不装 Redis 也不影响运行）
    REDIS_URL: str = ""
    
    # LLM 基础配置
    OPENAI_API_KEY: str = ""
    MODEL_NAME: str = "gpt-4o-mini"  # 先用 mini 省钱，未来换大模型
    BASE_URL: str = ""  # DeepSeek / OpenAI 兼容 API 地址
    
    class Config:
        env_file = ".env"  # 从项目根目录运行，.env 就在当前目录
        env_file_encoding = "utf-8"

settings = Settings()