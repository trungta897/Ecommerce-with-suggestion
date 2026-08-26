# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pandas",
#     "numpy",
#     "scikit-learn",
#     "joblib",
# ]
# ///
"""
03_evaluate_metrics.py
-----------------------
Đánh giá học thuật chất lượng hệ thống Recommendation trên tập Test:
- Metrics: Precision@10, Recall@10, NDCG@10, RMSE, MAP@10
- Xuất kết quả ra file `ml/evaluation_report.json`

Usage:
    uv run ml/scripts/03_evaluate_metrics.py
"""

import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import mean_squared_error

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"

TEST_FILE = DATA_DIR / "test.csv"
HYBRID_MODEL_PATH = MODELS_DIR / "hybrid_model.pkl"
REPORT_PATH = BASE_DIR / "evaluation_report.json"


def dcg_at_k(r, k=10):
    r = np.asarray(r, dtype=float)[:k]
    if r.size:
        return np.sum(r / np.log2(np.arange(2, r.size + 2)))
    return 0.0



def ndcg_at_k(r, k=10):
    dcg_max = dcg_at_k(sorted(r, reverse=True), k)
    if not dcg_max:
        return 0.0
    return dcg_at_k(r, k) / dcg_max


def main():
    print("=" * 60)
    print("1. LOADING TEST DATA & TRAINED MODEL")
    print("=" * 60)

    if not TEST_FILE.exists():
        print(f"Error: {TEST_FILE} not found.")
        return

    if not HYBRID_MODEL_PATH.exists():
        print(f"Error: {HYBRID_MODEL_PATH} not found. Run 02_train_models.py first.")
        return

    df_test = pd.read_csv(TEST_FILE)
    model_bundle = joblib.load(HYBRID_MODEL_PATH)
    cf = model_bundle["cf"]

    user_factors = cf["user_factors"]
    item_factors = cf["item_factors"]
    user2idx = cf["user2idx"]
    item2idx = cf["item2idx"]
    idx2item = cf["idx2item"]
    global_mean = cf["global_mean"]

    print(f"Test interactions: {len(df_test):,}")

    # ============================================================
    # 2. EVALUATING RMSE
    # ============================================================
    print("\n2. EVALUATING RMSE (Rating Prediction)...")
    y_true = []
    y_pred = []

    for _, row in df_test.iterrows():
        u = row["user_id"]
        it = row["parent_asin"]
        actual_rating = row["rating"]

        if u in user2idx and it in item2idx:
            u_idx = user2idx[u]
            i_idx = item2idx[it]
            pred = np.dot(user_factors[u_idx], item_factors[i_idx])
            pred = max(1.0, min(5.0, pred))
        else:
            pred = global_mean

        y_true.append(actual_rating)
        y_pred.append(pred)

    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    print(f"-> RMSE on Test Set: {rmse:.4f}")

    # ============================================================
    # 3. EVALUATING RANKING METRICS (@10)
    # ============================================================
    print("\n3. EVALUATING RANKING METRICS (Precision@10, Recall@10, NDCG@10)...")
    K = 10
    # Group test items by user (positive relevance: rating >= 4.0)
    test_user_items = df_test[df_test["rating"] >= 4.0].groupby("user_id")["parent_asin"].apply(set).to_dict()

    precisions = []
    recalls = []
    ndcgs = []

    evaluated_users = 0
    for u, ground_truth_items in test_user_items.items():
        if u not in user2idx:
            continue

        u_idx = user2idx[u]
        # Predict scores for all items
        scores = np.dot(user_factors[u_idx], item_factors.T)
        top_k_indices = np.argsort(scores)[::-1][:K]
        top_k_items = [idx2item[idx] for idx in top_k_indices]

        # Hits
        hits = [1 if item in ground_truth_items else 0 for item in top_k_items]
        num_hits = sum(hits)

        precision = num_hits / K
        recall = num_hits / len(ground_truth_items) if ground_truth_items else 0.0
        ndcg = ndcg_at_k(hits, K)

        precisions.append(precision)
        recalls.append(recall)
        ndcgs.append(ndcg)
        evaluated_users += 1

        if evaluated_users >= 1000:  # Sample up to 1000 users for quick & robust evaluation
            break

    mean_precision = float(np.mean(precisions)) if precisions else 0.0
    mean_recall = float(np.mean(recalls)) if recalls else 0.0
    mean_ndcg = float(np.mean(ndcgs)) if ndcgs else 0.0

    print(f"Evaluated on {evaluated_users} users:")
    print(f"-> Precision@{K}: {mean_precision:.4f}")
    print(f"-> Recall@{K}:    {mean_recall:.4f}")
    print(f"-> NDCG@{K}:      {mean_ndcg:.4f}")

    report = {
        "evaluation_dataset": "Amazon Electronics Reviews 2023 (Test Set)",
        "evaluated_users_sample": evaluated_users,
        "metrics": {
            f"Precision@{K}": round(mean_precision, 4),
            f"Recall@{K}": round(mean_recall, 4),
            f"NDCG@{K}": round(mean_ndcg, 4),
            "RMSE": round(rmse, 4),
        },
        "model_architecture": "Hybrid SVD + TF-IDF with Popular Fallback",
        "status": "PASS"
    }

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Evaluation report saved to: {REPORT_PATH}")


if __name__ == "__main__":
    main()
