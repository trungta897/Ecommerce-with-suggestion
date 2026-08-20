from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "DATN ML Service"
    API_V1_STR: str = "/api/v1"
    
    # Security
    API_KEY: str # Must be provided via environment variable
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Caching TTL (seconds)
    CACHE_TTL: int = 3600 # 1 hour for normal cache
    FALLBACK_CACHE_TTL: int = 120 # 2 mins for fallback cache
    
    class Config:
        env_file = ".env"

settings = Settings()
