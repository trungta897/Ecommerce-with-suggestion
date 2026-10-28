import logging
import joblib
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
POPULAR_MODEL_PATH = MODELS_DIR / "popular_model.pkl"
HYBRID_MODEL_PATH = MODELS_DIR / "hybrid_model.pkl"


class RecommenderSystem:
    def __init__(self):
        self.popular_model: List[Dict[str, Any]] = []
        self.hybrid_bundle: Dict[str, Any] = {}
        self.cf_to_content_idx: Optional[np.ndarray] = None
        self.pop_prior_vec: Optional[np.ndarray] = None
        self.is_loaded = False
        self._load_models()

    @staticmethod
    def _min_max_normalize(arr: np.ndarray) -> np.ndarray:
        if arr.size == 0:
            return arr
        min_val = float(np.min(arr))
        max_val = float(np.max(arr))
        if max_val - min_val > 1e-9:
            return (arr - min_val) / (max_val - min_val)
        return np.zeros_like(arr, dtype=float)

    def _load_models(self):
        try:
            if POPULAR_MODEL_PATH.exists():
                self.popular_model = joblib.load(POPULAR_MODEL_PATH)
                logger.info(f"Loaded popular model ({len(self.popular_model)} items).")

            if HYBRID_MODEL_PATH.exists():
                self.hybrid_bundle = joblib.load(HYBRID_MODEL_PATH)
                self._prepare_hybrid_indices()
                logger.info("Loaded hybrid model package successfully.")
                self.is_loaded = True
            else:
                logger.warning(
                    f"Hybrid model not found at {HYBRID_MODEL_PATH}. Running in fallback mode."
                )
        except Exception as e:
            logger.error(f"Error loading models: {e}", exc_info=True)

    def _prepare_hybrid_indices(self):
        cf = self.hybrid_bundle.get("cf")
        if not cf:
            return
        idx2item: Dict[int, str] = cf["idx2item"]
        item2idx: Dict[str, int] = cf["item2idx"]
        n_items = len(idx2item)

        content = self.hybrid_bundle.get("content")
        if content and "content_item2idx" in content:
            c_map: Dict[str, int] = content["content_item2idx"]
            self.cf_to_content_idx = np.array(
                [c_map.get(idx2item[i], -1) for i in range(n_items)], dtype=int
            )

        pop_vec = np.zeros(n_items, dtype=float)
        popular_list = self.hybrid_bundle.get("popular") or self.popular_model
        for item in popular_list:
            asin = item.get("parent_asin") or item.get("product_id")
            if asin and asin in item2idx:
                pop_vec[item2idx[asin]] = float(item.get("score", 0.0))
        self.pop_prior_vec = self._min_max_normalize(pop_vec)

    async def get_popular(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Baseline model returning top popular items.
        """
        if self.popular_model:
            results = []
            subset = self.popular_model[:limit]
            scores = np.array([float(it.get("score", 0.0)) for it in subset], dtype=float)
            norm_scores = self._min_max_normalize(scores)
            for idx, item in enumerate(subset):
                prod_id = item.get("parent_asin", item.get("product_id", ""))
                calibrated_score = round(float(0.75 + 0.20 * norm_scores[idx]), 4)
                results.append({"product_id": prod_id, "score": calibrated_score})
            return results

        return [
            {"product_id": f"pop_prod_{i}", "score": round(0.95 - i * 0.01, 4)}
            for i in range(1, limit + 1)
        ]

    async def predict_hybrid(
        self,
        user_id: str,
        limit: int = 10,
        item_ids: Optional[List[str]] = None,
        weights: Optional[List[float]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Predict top items for a user using Real-time Folding-in Hybrid:
        Combines SVD Latent Factors (CF) + TF-IDF Cosine Similarity (Content) + Bayesian Popularity Prior.
        """
        if not self.is_loaded and HYBRID_MODEL_PATH.exists():
            self._load_models()

        if self.is_loaded and "cf" in self.hybrid_bundle:
            cf = self.hybrid_bundle["cf"]
            user2idx: Dict[str, int] = cf["user2idx"]
            item2idx: Dict[str, int] = cf["item2idx"]
            idx2item: Dict[int, str] = cf["idx2item"]
            user_factors: np.ndarray = cf["user_factors"]
            item_factors: np.ndarray = cf["item_factors"]
            n_items = len(idx2item)

            seed_items = [it.strip() for it in (item_ids or []) if it and it.strip()]
            if weights and len(weights) == len(seed_items):
                seed_weights = [max(float(w), 0.1) for w in weights]
            else:
                seed_weights = [max(1.0, 5.0 - idx * 0.5) for idx in range(len(seed_items))]

            # 1. Collaborative Filtering (User Vector or SVD Item Folding-in)
            cf_raw = np.zeros(n_items, dtype=float)
            has_cf_signal = False

            if user_id in user2idx:
                u_idx = user2idx[user_id]
                user_vec = user_factors[u_idx]
                cf_raw = np.dot(user_vec, item_factors.T)
                has_cf_signal = True
            else:
                valid_cf = [
                    (item2idx[it], w)
                    for it, w in zip(seed_items, seed_weights)
                    if it in item2idx
                ]
                if valid_cf:
                    total_w = sum(w for _, w in valid_cf)
                    folded_user_vec = (
                        sum(item_factors[i_idx] * w for i_idx, w in valid_cf) / total_w
                    )
                    cf_raw = np.dot(folded_user_vec, item_factors.T)
                    has_cf_signal = True

            cf_scores = self._min_max_normalize(cf_raw) if has_cf_signal else cf_raw

            # 2. Content-Based Filtering (TF-IDF Cosine Similarity)
            cb_raw = np.zeros(n_items, dtype=float)
            has_cb_signal = False
            content = self.hybrid_bundle.get("content")
            if content and seed_items and self.cf_to_content_idx is not None:
                tfidf_matrix = content["tfidf_matrix"]
                c_item2idx: Dict[str, int] = content["content_item2idx"]
                valid_cb = [
                    (c_item2idx[it], w)
                    for it, w in zip(seed_items, seed_weights)
                    if it in c_item2idx
                ]
                if valid_cb:
                    total_w = sum(w for _, w in valid_cb)
                    sim_all_content = np.zeros(tfidf_matrix.shape[0], dtype=float)
                    for c_idx, w in valid_cb:
                        sim_vec = tfidf_matrix[c_idx].dot(tfidf_matrix.T).toarray().ravel()
                        sim_all_content += sim_vec * (w / total_w)

                    valid_mask = self.cf_to_content_idx >= 0
                    cb_raw[valid_mask] = sim_all_content[self.cf_to_content_idx[valid_mask]]
                    has_cb_signal = True

            cb_scores = self._min_max_normalize(cb_raw) if has_cb_signal else cb_raw

            # 3. Popularity Prior
            pop_scores = (
                self.pop_prior_vec
                if self.pop_prior_vec is not None
                else np.zeros(n_items, dtype=float)
            )

            # 4. Hybrid Score Fusion
            if has_cf_signal and has_cb_signal:
                hybrid_scores = 0.50 * cf_scores + 0.35 * cb_scores + 0.15 * pop_scores
            elif has_cf_signal:
                hybrid_scores = 0.80 * cf_scores + 0.20 * pop_scores
            elif has_cb_signal:
                hybrid_scores = 0.80 * cb_scores + 0.20 * pop_scores
            else:
                logger.info(
                    f"User {user_id} has no training/seed signal. Falling back to popular items."
                )
                return await self.get_popular(limit=limit)

            # Normalize final hybrid scores into [0.75, 0.99]
            norm_hybrid = self._min_max_normalize(hybrid_scores)

            # Exclude primary seed item (currently viewed product) from top recommendations
            if seed_items and seed_items[0] in item2idx:
                norm_hybrid[item2idx[seed_items[0]]] = -1.0

            top_k_indices = np.argsort(norm_hybrid)[::-1][:limit]

            return [
                {
                    "product_id": idx2item[int(idx)],
                    "score": round(float(0.75 + 0.24 * max(0.0, float(norm_hybrid[idx]))), 4),
                }
                for idx in top_k_indices
                if norm_hybrid[idx] >= 0.0
            ]

        return [
            {"product_id": f"rec_prod_{user_id}_{i}", "score": round(0.95 - (i * 0.01), 4)}
            for i in range(1, limit + 1)
        ]


recommender_system = RecommenderSystem()
