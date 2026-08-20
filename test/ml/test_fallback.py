import pytest
import asyncio
from fastapi.testclient import TestClient
from ml.service.main import app
from ml.service.models.recommender import recommender_system

# Ensure we use an API KEY for tests
import os
os.environ["API_KEY"] = "test_key_123"
# The config is already imported in modules, so setting it here might be too late.
# We will just patch the dependency or config directly for testing.
from ml.service.core.config import settings
settings.API_KEY = "test_key_123"

headers = {"X-API-Key": "test_key_123"}

def test_missing_api_key_returns_403():
    with TestClient(app) as client:
        # Request without headers
        response = client.get("/recommend/popular")
        assert response.status_code == 403
        assert response.json()["detail"] == "Could not validate credentials"

def test_popular_fallback_on_redis_down():
    # Since Redis is likely down on the local machine (or we can assume it for the test if it is),
    # this will hit the fallback mechanism. If Redis is UP, it will just hit the normal flow.
    # To truly simulate Redis down, we can patch the REDIS_URL to a bogus port.
    settings.REDIS_URL = "redis://localhost:9999/0"
    
    # We must trigger the startup event to initialize the bogus redis client
    with TestClient(app) as client:
        # 1. Test hybrid endpoint with Redis down
        response = client.get("/recommend/hybrid/test_user", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert data["algorithm"] == "popular_fallback"
        assert data["cached"] == False
        
        # 2. Test popular endpoint with Redis down
        response_pop = client.get("/recommend/popular", headers=headers)
        assert response_pop.status_code == 200
        data_pop = response_pop.json()
        assert data_pop["algorithm"] == "popular"
        assert data_pop["cached"] == False

def test_model_error_triggers_fallback(monkeypatch):
    # Mock predict_hybrid to raise an exception
    async def mock_predict(*args, **kwargs):
        raise ValueError("Simulated Model Error")
    
    # Mock Redis to simulate a working cache so we can test the fallback caching
    mock_redis_store = {}
    async def mock_get_cache(key):
        return mock_redis_store.get(key)
    async def mock_set_cache(key, value, ttl):
        mock_redis_store[key] = value
        return True
    
    from ml.service.core.redis_client import redis_client
    monkeypatch.setattr(recommender_system, "predict_hybrid", mock_predict)
    monkeypatch.setattr(redis_client, "get_cache", mock_get_cache)
    monkeypatch.setattr(redis_client, "set_cache", mock_set_cache)
    
    with TestClient(app) as client:
        # First call triggers the fallback and saves to cache
        response1 = client.get("/recommend/hybrid/error_user", headers=headers)
        assert response1.status_code == 200
        data1 = response1.json()
        assert data1["algorithm"] == "popular_fallback"
        assert data1["cached"] == False
        
        # Second call should hit the fallback cache
        response2 = client.get("/recommend/hybrid/error_user", headers=headers)
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["algorithm"] == "popular_fallback"
        assert data2["cached"] == True

def test_double_failure(monkeypatch):
    settings.REDIS_URL = "redis://localhost:9999/0" # Redis down
    
    # Mock get_popular to also fail
    async def mock_popular_fail(*args, **kwargs):
        raise RuntimeError("Simulated DB/Logic Error")
    
    monkeypatch.setattr(recommender_system, "get_popular", mock_popular_fail)
    
    with TestClient(app) as client:
        response = client.get("/recommend/hybrid/double_fail_user", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["algorithm"] == "unavailable"
        assert data["cached"] == False
        
        response_pop = client.get("/recommend/popular", headers=headers)
        assert response_pop.status_code == 200
        data_pop = response_pop.json()
        assert data_pop["items"] == []
        assert data_pop["algorithm"] == "unavailable"

if __name__ == "__main__":
    print("Testing ML Service Fallback Resilience...")
    pytest.main(["-v", __file__])
