"""Kiểm thử đơn vị cho RecommenderSystem và xác thực khóa API (không cần Redis hay tệp mô hình)."""
import asyncio
import os

os.environ.setdefault("API_KEY", "unit-test-key")

import numpy as np
import pytest
from fastapi import HTTPException

from service.core.security import get_api_key
from service.models.recommender import RecommenderSystem


def run(coro):
    return asyncio.run(coro)


def make_system(popular=None, with_cf=False):
    """Tạo RecommenderSystem mà không nạp tệp mô hình thật."""
    rs = RecommenderSystem.__new__(RecommenderSystem)
    rs.popular_model = popular or []
    rs.hybrid_bundle = {}
    rs.cf_to_content_idx = None
    rs.pop_prior_vec = None
    rs.is_loaded = False
    if with_cf:
        items = ["A", "B", "C", "D"]
        factors = np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0], [0.1, 0.9]])
        rs.hybrid_bundle = {
            "cf": {
                "user2idx": {"known": 0},
                "item2idx": {it: i for i, it in enumerate(items)},
                "idx2item": {i: it for i, it in enumerate(items)},
                "user_factors": np.array([[1.0, 0.0]]),
                "item_factors": factors,
            },
            "popular": [{"parent_asin": "A", "score": 4.5}, {"parent_asin": "C", "score": 4.0}],
        }
        rs._prepare_hybrid_indices()
        rs.is_loaded = True
    return rs


def test_min_max_normalize_range_and_constant():
    out = RecommenderSystem._min_max_normalize(np.array([2.0, 4.0, 6.0]))
    assert out.min() == 0.0 and out.max() == 1.0
    assert not RecommenderSystem._min_max_normalize(np.array([3.0, 3.0])).any()


def test_get_popular_without_model_returns_placeholder_items():
    items = run(make_system().get_popular(limit=3))
    assert len(items) == 3
    assert all(it["product_id"].startswith("pop_prod_") for it in items)


def test_get_popular_with_model_scores_are_calibrated():
    rs = make_system(popular=[{"parent_asin": "X", "score": 4.8}, {"parent_asin": "Y", "score": 4.2}])
    items = run(rs.get_popular(limit=2))
    assert [i["product_id"] for i in items] == ["X", "Y"]
    assert all(0.75 <= i["score"] <= 0.95 for i in items)


def test_hybrid_without_signal_falls_back_to_popular():
    rs = make_system(popular=[{"parent_asin": "X", "score": 4.8}], with_cf=True)
    items = run(rs.predict_hybrid("stranger", limit=2))
    assert items and items[0]["product_id"] == "X"


def test_hybrid_known_user_returns_scored_items():
    rs = make_system(with_cf=True)
    items = run(rs.predict_hybrid("known", limit=3))
    assert len(items) <= 3
    assert all(0.75 <= i["score"] <= 0.99 for i in items)
    # người dùng thiên về chiều thứ nhất nên A/B phải xếp trước C/D
    assert items[0]["product_id"] in {"A", "B"}


def test_hybrid_folding_in_excludes_primary_seed():
    rs = make_system(with_cf=True)
    items = run(rs.predict_hybrid("new-user", limit=4, item_ids=["A"], weights=[6.0]))
    ids = [i["product_id"] for i in items]
    assert "A" not in ids and ids[0] == "B"


def test_api_key_check_accepts_valid_and_rejects_invalid():
    assert run(get_api_key("unit-test-key")) == "unit-test-key"
    for bad in (None, "", "wrong-key"):
        with pytest.raises(HTTPException) as exc:
            run(get_api_key(bad))
        assert exc.value.status_code == 403
