import redis.asyncio as redis
import json
import logging
from typing import Optional, Any
from .config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    _instance = None
    _redis = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RedisClient, cls).__new__(cls)
        return cls._instance

    async def connect(self):
        if not self._redis:
            # timeout is set to 0.5s for fast failure/fallback
            self._redis = redis.from_url(
                settings.REDIS_URL, 
                socket_timeout=0.5, 
                socket_connect_timeout=0.5,
                decode_responses=True
            )
            logger.info("Connected to Redis")

    async def close(self):
        if self._redis:
            await self._redis.close()
            logger.info("Disconnected from Redis")

    async def get_cache(self, key: str) -> Optional[Any]:
        if not self._redis:
            return None
        # Let errors propagate up to trigger fallback
        val = await self._redis.get(key)
        if val:
            return json.loads(val)
        return None

    async def set_cache(self, key: str, value: Any, ttl: int = settings.CACHE_TTL) -> bool:
        if not self._redis:
            return False
        # Let errors propagate up to trigger fallback
        await self._redis.setex(key, ttl, json.dumps(value))
        return True

redis_client = RedisClient()
