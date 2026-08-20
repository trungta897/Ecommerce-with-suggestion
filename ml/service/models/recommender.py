import logging
from typing import List, Dict

logger = logging.getLogger(__name__)

class RecommenderSystem:
    def __init__(self):
        self.popular_model_loaded = False
        self.hybrid_model_loaded = False
        self._load_models()

    def _load_models(self):
        # In the future, this will load .pkl files
        # e.g., self.hybrid_model = joblib.load('models/hybrid_model.pkl')
        try:
            # Simulate loading models
            logger.info("Initializing models...")
            # If files are not found, we just stay with loaded=False
            pass
        except Exception as e:
            logger.error(f"Error loading models: {e}")

    async def get_popular(self, limit: int = 10) -> List[Dict[str, float]]:
        """
        Fallback/baseline model returning top popular items.
        """
        # Mock logic for now
        # When DB is integrated, this could query the DB or a pre-computed popular list
        mock_data = [
            {"product_id": f"pop_prod_{i}", "score": 100.0 - i} 
            for i in range(1, limit + 1)
        ]
        return mock_data

    async def predict_hybrid(self, user_id: str, limit: int = 10) -> List[Dict[str, float]]:
        """
        Predict top items for a user using the Hybrid model.
        """
        # Mock logic until the model is trained
        mock_data = [
            {"product_id": f"rec_prod_{user_id}_{i}", "score": 0.95 - (i * 0.01)} 
            for i in range(1, limit + 1)
        ]
        return mock_data

recommender_system = RecommenderSystem()
