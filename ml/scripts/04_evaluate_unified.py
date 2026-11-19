# /// script
# requires-python = ">=3.11"
# dependencies = ["pandas", "numpy", "scikit-learn", "scipy"]
# ///
"""
04_evaluate_unified.py
----------------------
Kịch bản đánh giá THỐNG NHẤT cho các phương pháp gợi ý (cùng tập kiểm thử, cùng giao thức,
cố định random seed), thay thế các kết quả rời rạc của 03_evaluate_metrics.py.

Phương pháp được đánh giá:
  1. Popularity (Bayesian)        2. Content-Based (TF-IDF cosine)
  3. SVD (TruncatedSVD, k=50)     4. Hybrid 0,50/0,35/0,15 (cấu hình triển khai thực tế)
  + thực nghiệm loại bỏ thành phần (ablation), độ nhạy trọng số, độ nhạy số chiều k.

Giao thức xếp hạng (K = 10):
  A. "Xếp hạng toàn bộ danh mục" (full ranking): xếp hạng mọi sản phẩm trong danh mục huấn luyện,
     LOẠI TRỪ các sản phẩm người dùng đã tương tác trong tập huấn luyện.
  B. "Lấy mẫu ứng viên" (sampled candidates): ứng viên = các sản phẩm phù hợp trong tập kiểm thử
     + 100 sản phẩm âm lấy mẫu ngẫu nhiên đồng đều (không thuộc lịch sử huấn luyện/kiểm thử).
  Sản phẩm phù hợp (ground truth) = rating >= 4,0 trong tập kiểm thử và có trong danh mục huấn luyện.

Mẫu người dùng: TOÀN BỘ người dùng đủ điều kiện (có >= 1 sản phẩm phù hợp). Khoảng tin cậy 95%
bằng bootstrap (2.000 lần). Thêm 5 lần chạy với mẫu ngẫu nhiên 1.000 người dùng (seed 1..5).

Đầu ra: ml/evaluation_report_unified.json

Usage:
    python ml/scripts/04_evaluate_unified.py
"""

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer

SEED = 42
K = 10
N_NEG = 100
SEED_CAP = 20
BOOT = 2000

BASE = Path(__file__).resolve().parent.parent
TRAIN = BASE / "data" / "train.csv"
TEST = BASE / "data" / "test.csv"
OUT = BASE / "evaluation_report_unified.json"

K_LIST = [10, 25, 50, 100]
WEIGHT_GRID = {
    "0,50/0,35/0,15 (triển khai)": (0.50, 0.35, 0.15),
    "0,40/0,40/0,20": (0.40, 0.40, 0.20),
    "0,60/0,30/0,10": (0.60, 0.30, 0.10),
    "0,70/0,20/0,10": (0.70, 0.20, 0.10),
    "0,30/0,50/0,20": (0.30, 0.50, 0.20),
    "0,34/0,33/0,33": (1 / 3, 1 / 3, 1 / 3),
}


def minmax(a):
    lo, hi = float(a.min()), float(a.max())
    return (a - lo) / (hi - lo) if hi - lo > 1e-9 else np.zeros_like(a, dtype=float)


def metrics_from_hits(hits, n_rel):
    """hits: mảng 0/1 độ dài K theo thứ tự xếp hạng."""
    p = hits.sum() / K
    r = hits.sum() / n_rel
    disc = 1.0 / np.log2(np.arange(2, K + 2))
    dcg = float((hits * disc).sum())
    idcg = float(disc[: min(n_rel, K)].sum())
    return p, r, (dcg / idcg if idcg > 0 else 0.0)


def top_k(scores, banned):
    s = scores.copy()
    s[banned] = -np.inf
    idx = np.argpartition(-s, K)[:K]
    return idx[np.argsort(-s[idx])]


def boot_ci(x, rng):
    x = np.asarray(x)
    n = len(x)
    means = np.array([x[rng.integers(0, n, n)].mean() for _ in range(BOOT)])
    return float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))


def paired_boot_ci(a, b, rng):
    d = np.asarray(a) - np.asarray(b)
    n = len(d)
    means = np.array([d[rng.integers(0, n, n)].mean() for _ in range(BOOT)])
    return float(d.mean()), float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))


def main():
    t0 = time.time()
    rng = np.random.default_rng(SEED)
    tr = pd.read_csv(TRAIN)
    te = pd.read_csv(TEST)

    items = tr["parent_asin"].unique()
    users = tr["user_id"].unique()
    item2idx = {it: i for i, it in enumerate(items)}
    user2idx = {u: i for i, u in enumerate(users)}
    n_items, n_users = len(items), len(users)

    tr["u"] = tr["user_id"].map(user2idx)
    tr["i"] = tr["parent_asin"].map(item2idx)
    mu = float(tr["rating"].mean())
    R = csr_matrix((tr["rating"].values, (tr["u"].values, tr["i"].values)), shape=(n_users, n_items))

    # ---- Popularity (Bayesian, m = 5) ----
    st = tr.groupby("i").agg(v=("rating", "count"), r=("rating", "mean"))
    pop_full = np.zeros(n_items)
    pop_full[st.index.values] = (st["r"].values * st["v"].values + mu * 5) / (st["v"].values + 5)
    pop_n_full = minmax(pop_full)
    # Cấu hình triển khai: vector tiên nghiệm chỉ khác 0 với 100 sản phẩm hàng đầu (xem recommender.py)
    top100 = np.argsort(-pop_full)[:100]
    pop_dep = np.zeros(n_items)
    pop_dep[top100] = pop_full[top100]
    pop_n_dep = minmax(pop_dep)

    # ---- Content-Based (TF-IDF trên văn bản nhận xét, như 02_train_models.py) ----
    txt = tr.groupby("parent_asin").agg(
        title=("title", lambda x: " ".join(str(v) for v in x if pd.notna(v))[:2000]),
        text=("text", lambda x: " ".join(str(v) for v in x if pd.notna(v))[:3000]),
    )
    txt["c"] = txt["title"] + " " + txt["text"]
    txt = txt.reindex(items)
    X = TfidfVectorizer(max_features=5000, stop_words="english").fit_transform(txt["c"].fillna(""))

    # ---- SVD theo từng k ----
    U, V = {}, {}
    for k in K_LIST:
        svd = TruncatedSVD(n_components=k, random_state=42)
        U[k] = svd.fit_transform(R)
        V[k] = svd.components_.T

    # ---- RMSE ----
    R_c = R.copy().astype(float)
    R_c.data = R_c.data - mu
    svd_c = TruncatedSVD(n_components=50, random_state=42)
    Uc = svd_c.fit_transform(R_c)
    Vc = svd_c.components_.T

    # ---- Dữ liệu người dùng ----
    hist = {u: g.sort_values("timestamp", ascending=False) for u, g in tr.groupby("u")}
    train_items = {u: set(g["i"].values) for u, g in hist.items()}
    te = te[te["user_id"].isin(user2idx)].copy()
    te["u"] = te["user_id"].map(user2idx)
    te["i"] = te["parent_asin"].map(item2idx)
    te_known = te.dropna(subset=["i"]).copy()
    te_known["i"] = te_known["i"].astype(int)
    rel = {}
    for u, g in te_known[te_known["rating"] >= 4.0].groupby("u"):
        r = set(g["i"].values) - train_items.get(u, set())
        if r:
            rel[u] = r
    elig = sorted(rel)
    all_test_items = te_known.groupby("u")["i"].apply(set).to_dict()

    # ---- RMSE ----
    y = te["rating"].values
    cov = te["i"].notna().values
    pred_dep = np.full(len(te), mu)
    pred_cen = np.full(len(te), mu)
    pred_dep_cov = pred_dep.copy()
    ui = te["u"].values.astype(int)
    ii = te["i"].fillna(-1).values.astype(int)
    for n in np.where(cov)[0]:
        pred_dep[n] = np.clip(mu + U[50][ui[n]] @ V[50][ii[n]], 1, 5)
        pred_cen[n] = np.clip(mu + Uc[ui[n]] @ Vc[ii[n]], 1, 5)
    rmse = lambda p, m=slice(None): float(np.sqrt(np.mean((y[m] - p[m]) ** 2)))
    rmse_block = {
        "pairs": int(len(te)),
        "pairs_covered_by_catalog": int(cov.sum()),
        "global_mean": rmse(np.full(len(te), mu)),
        "svd_as_trained_mu_plus_pq": rmse(pred_dep),
        "svd_mean_centered_mu_plus_pq": rmse(pred_cen),
        "global_mean_on_covered": rmse(np.full(len(te), mu), cov),
        "svd_as_trained_on_covered": rmse(pred_dep, cov),
        "svd_mean_centered_on_covered": rmse(pred_cen, cov),
    }

    # ---- Cấu hình chấm điểm ----
    configs = {}
    configs["Popularity (Bayesian)"] = ("pop_full", None)
    configs["Content-Based (TF-IDF)"] = ("cb", None)
    for k in K_LIST:
        configs[f"SVD k={k}"] = ("svd", k)
    for name, w in WEIGHT_GRID.items():
        configs[f"Hybrid {name}"] = ("hyb", (50, w, "dep"))
    for k in (10, 25, 100):
        configs[f"Hybrid 0,50/0,35/0,15 k={k}"] = ("hyb", (k, (0.5, 0.35, 0.15), "dep"))
    configs["Ablation: SVD + CB (0,59/0,41)"] = ("hyb", (50, (0.50, 0.35, 0.0), "dep"))
    configs["Ablation: SVD + Pop (0,77/0,23)"] = ("hyb", (50, (0.50, 0.0, 0.15), "dep"))
    configs["Ablation: CB + Pop (0,70/0,30)"] = ("hyb", (50, (0.0, 0.35, 0.15), "dep"))
    configs["Hybrid 0,50/0,35/0,15 + Pop đầy đủ (không cắt top-100)"] = ("hyb", (50, (0.5, 0.35, 0.15), "full"))

    def score(cfg, comp):
        kind, par = cfg
        if kind == "pop_full":
            return pop_full
        if kind == "cb":
            return comp["cb"]
        if kind == "svd":
            return comp[("cf", par)]
        k, (a, b, c), pk = par
        pop_n = pop_n_dep if pk == "dep" else pop_n_full
        return a * comp[("cfn", k)] + b * comp["cbn"] + c * pop_n

    res = {A: {n: {"P": [], "R": [], "N": []} for n in configs} for A in ("A", "B")}
    for n_done, u in enumerate(elig):
        h = hist[u]
        seeds = h[h["rating"] >= 4.0].head(SEED_CAP)
        if len(seeds) == 0:
            seeds = h.head(SEED_CAP)
        w = seeds["rating"].values.astype(float)
        w = w / w.sum()
        v = csr_matrix((w, (np.zeros(len(w), dtype=int), seeds["i"].values)), shape=(1, n_items)) @ X
        cb_raw = np.asarray(X.dot(v.T).todense()).ravel()
        comp = {"cb": cb_raw, "cbn": minmax(cb_raw)}
        for k in K_LIST:
            raw = U[k][u] @ V[k].T
            comp[("cf", k)] = raw
            comp[("cfn", k)] = minmax(raw)
        banned = np.fromiter(train_items[u], dtype=int)
        relu = rel[u]
        n_rel = len(relu)
        relmask = np.zeros(n_items, bool)
        relmask[list(relu)] = True
        # Giao thức B: ứng viên
        exclude = np.zeros(n_items, bool)
        exclude[banned] = True
        exclude[list(all_test_items.get(u, set()))] = True
        pool = np.where(~exclude)[0]
        neg = rng.choice(pool, size=min(N_NEG, len(pool)), replace=False)
        cand = np.concatenate([np.array(sorted(relu)), neg])
        for name, cfg in configs.items():
            s = score(cfg, comp)
            top = top_k(s, banned)
            p, r, nd = metrics_from_hits(relmask[top].astype(float), n_rel)
            res["A"][name]["P"].append(p); res["A"][name]["R"].append(r); res["A"][name]["N"].append(nd)
            order = cand[np.argsort(-s[cand])][:K]
            p, r, nd = metrics_from_hits(relmask[order].astype(float), n_rel)
            res["B"][name]["P"].append(p); res["B"][name]["R"].append(r); res["B"][name]["N"].append(nd)
        if n_done % 1000 == 0:
            print(f"  ... {n_done}/{len(elig)} users", flush=True)

    # ---- Khởi đầu lạnh (cold-start): người dùng mới chỉ có n = 1..4 tương tác ----
    # Mô phỏng người dùng chưa có trong ma trận huấn luyện: vector CF được nội suy bằng Folding-in
    # từ n sản phẩm gần nhất (trọng số = điểm đánh giá). Giao thức A (loại trừ lịch sử huấn luyện).
    cold = {}
    for n_seed in (1, 2, 3, 4):
        rows = {"Popularity (Bayesian)": [], "Content-Based (TF-IDF)": [], "CF Folding-in (SVD k=50)": [],
                "Hybrid 0,50/0,35/0,15 (triển khai)": []}
        for u in elig:
            h = hist[u]
            if len(h) < n_seed:
                continue
            seeds = h.head(n_seed)
            w = seeds["rating"].values.astype(float)
            w = w / w.sum()
            si = seeds["i"].values
            folded = (w[:, None] * V[50][si]).sum(axis=0)
            cf_raw = V[50] @ folded
            v = csr_matrix((w, (np.zeros(len(w), dtype=int), si)), shape=(1, n_items)) @ X
            cb_raw = np.asarray(X.dot(v.T).todense()).ravel()
            banned = np.fromiter(train_items[u], dtype=int)
            relmask = np.zeros(n_items, bool)
            relmask[list(rel[u])] = True
            scores = {
                "Popularity (Bayesian)": pop_full,
                "Content-Based (TF-IDF)": cb_raw,
                "CF Folding-in (SVD k=50)": cf_raw,
                "Hybrid 0,50/0,35/0,15 (triển khai)": 0.50 * minmax(cf_raw) + 0.35 * minmax(cb_raw) + 0.15 * pop_n_dep,
            }
            for name, s in scores.items():
                top = top_k(s, banned)
                rows[name].append(metrics_from_hits(relmask[top].astype(float), len(rel[u])))
        cold[str(n_seed)] = {}
        for name, lst in rows.items():
            arr = np.array(lst)
            cold[str(n_seed)][name] = {
                "users": int(len(arr)),
                "Precision@10": float(arr[:, 0].mean()),
                "Recall@10": float(arr[:, 1].mean()),
                "NDCG@10": float(arr[:, 2].mean()),
                "NDCG@10_ci95": list(boot_ci(arr[:, 2], np.random.default_rng(SEED))),
            }

    # ---- Tổng hợp ----
    brng = np.random.default_rng(SEED)
    report = {
        "seed": SEED, "K": K, "negatives_per_user_protocol_B": N_NEG, "seed_items_cap": SEED_CAP,
        "dataset": {
            "train_interactions": int(len(tr)), "test_interactions": int(len(te)),
            "users": int(n_users), "items": int(n_items),
            "sparsity_train": float(1 - len(tr) / (n_users * n_items)),
            "global_mean_rating": mu,
            "eligible_users": len(elig),
            "avg_relevant_per_eligible_user": float(np.mean([len(rel[u]) for u in elig])),
            "test_relevant_items_total": int(sum(len(rel[u]) for u in elig)),
        },
        "rmse": rmse_block, "cold_start_folding_in": cold, "protocols": {},
    }
    for A in ("A", "B"):
        table = {}
        for name in configs:
            row = {}
            for key, label in (("P", "Precision@10"), ("R", "Recall@10"), ("N", "NDCG@10")):
                x = np.array(res[A][name][key])
                lo, hi = boot_ci(x, brng)
                row[label] = {"mean": float(x.mean()), "ci95": [lo, hi]}
            table[name] = row
        # Chênh lệch ghép cặp Hybrid vs SVD, Hybrid vs Popularity
        hyb = np.array(res[A]["Hybrid 0,50/0,35/0,15 (triển khai)"]["N"])
        paired = {}
        for other in ("SVD k=50", "Popularity (Bayesian)", "Content-Based (TF-IDF)"):
            m, lo, hi = paired_boot_ci(hyb, np.array(res[A][other]["N"]), brng)
            paired[f"Hybrid - {other} (NDCG@10)"] = {"mean_diff": m, "ci95": [lo, hi]}
        # 5 lần chạy mẫu 1.000 người dùng
        sub = {}
        for name in ("Popularity (Bayesian)", "Content-Based (TF-IDF)", "SVD k=50", "Hybrid 0,50/0,35/0,15 (triển khai)"):
            ps = []
            for sd in range(1, 6):
                idx = np.random.default_rng(sd).choice(len(elig), size=min(1000, len(elig)), replace=False)
                ps.append(float(np.array(res[A][name]["P"])[idx].mean()))
            sub[name] = {"Precision@10_mean": float(np.mean(ps)), "Precision@10_std": float(np.std(ps, ddof=1)), "runs": ps}
        report["protocols"][A] = {"results": table, "paired_differences": paired, "five_runs_1000_user_samples": sub}

    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Done in {time.time() - t0:.0f}s -> {OUT}")


if __name__ == "__main__":
    main()
