# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pandas",
#     "numpy",
#     "scikit-learn",
#     "scipy",
#     "joblib",
# ]
# ///
"""
02_train_models.py
-------------------
Huấn luyện các mô hình Recommendation System trên tập dữ liệu Amazon Electronics:
1. Popular Baseline Model: Tính điểm phổ biến dựa trên số lượng đánh giá và điểm trung bình (Bayesian Weighted Average).
2. Collaborative Filtering (TruncatedSVD): Phân rã ma trận User-Item tương tác.
3. Content-Based Filtering: TF-IDF vectorization trên mô tả/tiêu đề sản phẩm.
4. Hybrid Model: Kết hợp điểm Collaborative Filtering + Content-Based + Popular fallback.

Lưu các mô hình vào thư mục `ml/models/`.

Usage:
    uv run ml/scripts/02_train_models.py
"""

import sys
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from scipy.sparse import csr_matrix

# ============================================================
# CONFIG & PATHS
# ============================================================
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_FILE = DATA_DIR / "train.csv"
TEST_FILE = DATA_DIR / "test.csv"
META_FILE = DATA_DIR / "meta_electronics.jsonl"

POPULAR_MODEL_PATH = MODELS_DIR / "popular_model.pkl"
HYBRID_MODEL_PATH = MODELS_DIR / "hybrid_model.pkl"


def load_data():
    print("=" * 60)
    print("1. LOADING TRAIN DATA")
    print("=" * 60)
    if not TRAIN_FILE.exists():
        print(f"Error: {TRAIN_FILE} does not exist. Please run EDA/prepare data first.")
        sys.exit(1)

    df_train = pd.read_csv(TRAIN_FILE)
    print(f"Loaded {len(df_train):,} training interactions.")
    print(f"Unique users: {df_train['user_id'].nunique():,}")
    print(f"Unique items: {df_train['parent_asin'].nunique():,}")
    return df_train


def train_popular_model(df_train):
    print("\n" + "=" * 60)
    print("2. TRAINING POPULAR BASELINE MODEL")
    print("=" * 60)

    # Bayesian weighted rating (IMDB formula style)
    # W = (R * v + C * m) / (v + m)
    # v: number of reviews for item
    # m: minimum reviews required to be considered
    # R: average rating of item
    # C: mean rating across all items
    item_stats = df_train.groupby("parent_asin").agg(
        vote_count=("rating", "count"),
        mean_rating=("rating", "mean")
    ).reset_index()

    C = df_train["rating"].mean()
    m = 5
    item_stats["score"] = (
        (item_stats["mean_rating"] * item_stats["vote_count"] + C * m)
        / (item_stats["vote_count"] + m)
    )

    popular_items = (
        item_stats.sort_values(by=["score", "vote_count"], ascending=False)
        .head(100)
        .to_dict(orient="records")
    )

    joblib.dump(popular_items, POPULAR_MODEL_PATH)
    print(f"Saved popular model ({len(popular_items)} items) to: {POPULAR_MODEL_PATH}")
    return popular_items


def train_collaborative_filtering(df_train):
    print("\n" + "=" * 60)
    print("3. TRAINING COLLABORATIVE FILTERING (TruncatedSVD)")
    print("=" * 60)

    users = df_train["user_id"].unique()
    items = df_train["parent_asin"].unique()

    user2idx = {u: i for i, u in enumerate(users)}
    idx2user = {i: u for i, u in enumerate(users)}
    item2idx = {it: i for i, it in enumerate(items)}
    idx2item = {i: it for i, it in enumerate(items)}

    row_indices = df_train["user_id"].map(user2idx).values
    col_indices = df_train["parent_asin"].map(item2idx).values
    ratings = df_train["rating"].values

    n_users = len(users)
    n_items = len(items)

    rating_matrix = csr_matrix((ratings, (row_indices, col_indices)), shape=(n_users, n_items))
    print(f"User-Item sparse matrix shape: {rating_matrix.shape}")

    n_components = min(50, n_items - 1, n_users - 1)
    print(f"Fitting TruncatedSVD with n_components={n_components}...")
    svd = TruncatedSVD(n_components=n_components, random_state=42)
    user_factors = svd.fit_transform(rating_matrix)
    item_factors = svd.components_.T  # Shape: (n_items, n_components)

    explained_variance = svd.explained_variance_ratio_.sum()
    print(f"TruncatedSVD finished. Cumulative explained variance: {explained_variance:.4f}")

    return {
        "user_factors": user_factors,
        "item_factors": item_factors,
        "user2idx": user2idx,
        "idx2user": idx2user,
        "item2idx": item2idx,
        "idx2item": idx2item,
        "global_mean": float(df_train["rating"].mean()),
    }


def train_content_based(df_train):
    print("\n" + "=" * 60)
    print("4. TRAINING CONTENT-BASED (TF-IDF)")
    print("=" * 60)

    # Group texts by item
    item_texts = df_train.groupby("parent_asin").agg({
        "title": lambda x: " ".join([str(v) for v in x if pd.notna(v)])[:2000],
        "text": lambda x: " ".join([str(v) for v in x if pd.notna(v)])[:3000]
    }).reset_index()

    item_texts["combined_text"] = item_texts["title"] + " " + item_texts["text"]

    tfidf = TfidfVectorizer(max_features=5000, stop_words="english")
    tfidf_matrix = tfidf.fit_transform(item_texts["combined_text"])
    print(f"TF-IDF matrix shape: {tfidf_matrix.shape}")

    content_item2idx = {it: i for i, it in enumerate(item_texts["parent_asin"])}

    return {
        "tfidf_matrix": tfidf_matrix,
        "content_item2idx": content_item2idx,
    }


def save_hybrid_model(cf_model, content_model, popular_items):
    print("\n" + "=" * 60)
    print("5. PACKAGING & SAVING HYBRID MODEL")
    print("=" * 60)

    hybrid_bundle = {
        "cf": cf_model,
        "content": content_model,
        "popular": popular_items,
        "algorithm_version": "1.0.0-svd-tfidf",
    }

    joblib.dump(hybrid_bundle, HYBRID_MODEL_PATH)
    print(f"Successfully saved Hybrid Model package to: {HYBRID_MODEL_PATH}")


def main():
    df_train = load_data()
    popular_items = train_popular_model(df_train)
    cf_model = train_collaborative_filtering(df_train)
    content_model = train_content_based(df_train)
    save_hybrid_model(cf_model, content_model, popular_items)
    print("\n✅ Training complete! Models are ready for inference.")


if __name__ == "__main__":
    main()
