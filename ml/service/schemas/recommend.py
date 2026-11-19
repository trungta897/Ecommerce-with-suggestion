from pydantic import BaseModel
from typing import List

class RecommendationItem(BaseModel):
    product_id: str
    score: float

class RecommendationResponse(BaseModel):
    items: List[RecommendationItem]
    algorithm: str
    cached: bool
