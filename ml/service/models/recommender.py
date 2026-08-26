import logging
import joblib
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
POPULAR_MODEL_PATH = MODELS_DIR / "popular_model.pkl"
HYBRID_MODEL_PATH = MODELS_DIR / "hybrid_model.pkl"


class RecommenderSystem:
    def __init__(self):
        self.popular_model: List[Dict[str, Any]] = []
        self.hybrid_bundle: Dict[str, Any] = {}
        self.is_loaded = False
        self._load_models()

    def _load_models(self):
        try:
            if POPULAR_MODEL_PATH.exists():
                self.popular_model = joblib.load(POPULAR_MODEL_PATH)
                logger.info(f"Loaded popular model ({len(self.popular_model)} items).")

            if HYBRID_MODEL_PATH.exists():
                self.hybrid_bundle = joblib.load(HYBRID_MODEL_PATH)
                logger.info("Loaded hybrid model package successfully.")
                self.is_loaded = True
            else:
                logger.warning(f"Hybrid model not found at {HYBRID_MODEL_PATH}. Running in fallback mode.")
        except Exception as e:
            logger.error(f"Error loading models: {e}", exc_info=True)

    async def get_popular(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Baseline model returning top popular items.
        """
        if self.popular_model:
            results = []
            for item in self.popular_model[:limit]:
                prod_id = item.get("parent_asin", item.get("product_id", ""))
                score = float(item.get("score", 0.0))
                results.append({"product_id": prod_id, "score": score})
            return results

        # If model file is not yet generated
        return [
            {"product_id": f"pop_prod_{i}", "score": round(100.0 - i, 2)}
            for i in range(1, limit + 1)
        ]

    async def predict_hybrid(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Predict top items for a user using the Hybrid model.
        """
        if not self.is_loaded and HYBRID_MODEL_PATH.exists():
            self._load_models()

        if self.is_loaded and "cf" in self.hybrid_bundle:
            cf = self.hybrid_bundle["cf"]
            user2idx = cf["user2idx"]
            idx2item = cf["idx2item"]
            user_factors = cf["user_factors"]
            item_factors = cf["item_factors"]

            if user_id in user2idx:
                u_idx = user2idx[user_id]
                user_vec = user_factors[u_idx]
                scores = np.dot(user_vec, item_factors.T)
                top_k_indices = np.argsort(scores)[::-1][:limit]

                return [
                    {
                        "product_id": idx2item[idx],
                        "score": round(float(scores[idx]), 4),
                    }
                    for idx in top_k_indices
                ]
            else:
                # Cold start: return popular items
                logger.info(f"User {user_id} not in training set. Falling back to popular items.")
                return await self.get_popular(limit=limit)

        # Mock fallback if models are not generated yet
        return [
            {"product_id": f"rec_prod_{user_id}_{i}", "score": round(0.95 - (i * 0.01), 4)}
            for i in range(1, limit + 1)
        ]


recommender_system = RecommenderSystem()
