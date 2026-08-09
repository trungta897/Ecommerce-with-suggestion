import logging
from fastapi import APIRouter, Depends, Query
from ..schemas.recommend import RecommendationResponse
from ..core.security import get_api_key
from ..core.redis_client import redis_client
from ..core.config import settings
from ..models.recommender import recommender_system

logger = logging.getLogger(__name__)
router = APIRouter(tags=["recommend"], dependencies=[Depends(get_api_key)])

@router.get("/popular", response_model=RecommendationResponse)
async def get_popular(limit: int = Query(10, ge=1, le=50)):
    """
    Get popular items. Serves as both a direct endpoint and a fallback.
    """
    cache_key = f"rec:popular:{limit}"
    
    try:
        # Try to get from cache
        cached_data = await redis_client.get_cache(cache_key)
        if cached_data and isinstance(cached_data, dict) and "items" in cached_data:
            return RecommendationResponse(
                items=cached_data["items"], 
                algorithm=cached_data.get("algorithm", "popular"), 
                cached=True
            )
            
        # If cache miss, get from model (mock)
        popular_items = await recommender_system.get_popular(limit=limit)
        
        # Set cache
        cache_payload = {"items": popular_items, "algorithm": "popular"}
        await redis_client.set_cache(cache_key, cache_payload, settings.CACHE_TTL)
        
        return RecommendationResponse(
            items=popular_items, 
            algorithm="popular", 
            cached=False
        )
        
    except Exception as e:
        logger.error(f"Error in /popular endpoint: {str(e)}", exc_info=True)
        # Double-failure fallback
        try:
            popular_items = await recommender_system.get_popular(limit=limit)
            return RecommendationResponse(
                items=popular_items,
                algorithm="popular",
                cached=False
            )
        except Exception as inner_e:
            logger.error(f"Critical failure in get_popular fallback: {str(inner_e)}", exc_info=True)
            return RecommendationResponse(
                items=[],
                algorithm="unavailable",
                cached=False
            )


@router.get("/hybrid/{user_id}", response_model=RecommendationResponse)
async def get_hybrid_recommendation(user_id: str, limit: int = Query(10, ge=1, le=50)):
    """
    Get hybrid recommendations for a specific user.
    Falls back to popular items if any error occurs (Redis or Model).
    """
    cache_key = f"rec:hybrid:{user_id}:{limit}"
    
    try:
        # 1. Check Redis Cache
        cached_data = await redis_client.get_cache(cache_key)
        if cached_data and isinstance(cached_data, dict) and "items" in cached_data:
            return RecommendationResponse(
                items=cached_data["items"], 
                algorithm=cached_data.get("algorithm", "mock_hybrid"), 
                cached=True
            )
        
        # 2. Cache miss -> Predict
        recommendations = await recommender_system.predict_hybrid(user_id=user_id, limit=limit)
        
        # 3. Set Cache
        cache_payload = {"items": recommendations, "algorithm": "mock_hybrid"}
        await redis_client.set_cache(cache_key, cache_payload, settings.CACHE_TTL)
        
        return RecommendationResponse(
            items=recommendations, 
            algorithm="mock_hybrid", 
            cached=False
        )
        
    except Exception as e:
        # Fallback Triggered (Redis Error, Timeout, Model Error)
        logger.error(f"Fallback triggered for user {user_id}. Reason: {str(e)}", exc_info=True)
        
        try:
            # Try to get popular items as fallback
            popular_items = await recommender_system.get_popular(limit=limit)
            
            # Optionally cache the fallback result with a short TTL if Redis is alive
            try:
                cache_payload = {"items": popular_items, "algorithm": "popular_fallback"}
                await redis_client.set_cache(cache_key, cache_payload, settings.FALLBACK_CACHE_TTL)
            except Exception as redis_e:
                logger.warning(f"Could not cache fallback result: {str(redis_e)}")

            return RecommendationResponse(
                items=popular_items,
                algorithm="popular_fallback",
                cached=False
            )
            
        except Exception as inner_e:
            # Double-failure (Even popular fallback failed)
            logger.error(f"Critical failure in hybrid fallback: {str(inner_e)}", exc_info=True)
            return RecommendationResponse(
                items=[],
                algorithm="unavailable",
                cached=False
            )
