# /// script
# requires-python = ">=3.11"
# dependencies = ["pandas", "numpy", "scikit-learn", "scipy"]
# ///
"""
05_tuning_and_quota.py
----------------------
Bổ sung cho 04_evaluate_unified.py:
  1. Chọn siêu tham số trên TẬP KIỂM ĐỊNH tách khỏi tập kiểm thử (hold-out 20% tương tác huấn luyện
     của từng người dùng), sau đó đánh giá cấu hình đã chọn và cấu hình triển khai trên tập kiểm thử.
  2. Độ nhạy theo ngưỡng m của Bayesian Popularity và theo cách đặt trọng số hạt giống.
  3. Đánh giá Category Quota Reranking (mô phỏng lại thuật toán ở Backend) về chất lượng xếp hạng
     và đa dạng danh mục, theo tỷ lệ trần cùng danh mục.

Giao thức xếp hạng: A (xếp hạng toàn bộ danh mục, loại trừ lịch sử huấn luyện), K = 10.
Kết quả: ml/evaluation_report_tuning.json

Usage: python ml/scripts/05_tuning_and_quota.py
"""
import json
import math
import time
from collections import Counter
from pathlib import Path

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer

SEED = 42
K = 10
SEED_CAP = 20
BASE = Path(__file__).resolve().parent.parent
TRAIN = BASE / "data" / "train.csv"
TEST = BASE / "data" / "test.csv"
META = BASE / "data" / "meta_electronics.jsonl"
CAT_CACHE = BASE / "data" / "item_categories.json"
OUT = BASE / "evaluation_report_tuning.json"

K_LIST = [10, 25, 50]
WEIGHTS = [(0.50, 0.35, 0.15), (0.60, 0.30, 0.10), (0.60, 0.40, 0.0), (0.70, 0.30, 0.0), (0.50, 0.50, 0.0)]
DISC = 1.0 / np.log2(np.arange(2, K + 2))


def minmax(a):
    lo, hi = float(a.min()), float(a.max())
    return (a - lo) / (hi - lo) if hi - lo > 1e-9 else np.zeros_like(a, dtype=float)


def top_idx(scores, banned, n=K):
    s = scores.copy()
    s[banned] = -np.inf
    idx = np.argpartition(-s, n)[:n]
    return idx[np.argsort(-s[idx])]


def metrics(hits, n_rel):
    hits = np.asarray(hits, dtype=float)
    p = hits.sum() / K
    r = hits.sum() / n_rel
    idcg = DISC[: min(n_rel, K)].sum()
    return p, r, float((hits * DISC[: len(hits)]).sum() / idcg)


def build_models(df, items, item2idx, m=5):
    """Huấn luyện các thành phần trên một tập tương tác (df có cột u, i)."""
    n_users, n_items = df["u"].max() + 1, len(items)
    R = csr_matrix((df["rating"].values, (df["u"].values, df["i"].values)), shape=(n_users, n_items))
    mu = float(df["rating"].mean())
    st = df.groupby("i").agg(v=("rating", "count"), r=("rating", "mean"))
    pop_full = np.zeros(n_items)
    pop_full[st.index.values] = (st["r"].values * st["v"].values + mu * m) / (st["v"].values + m)
    top100 = np.argsort(-pop_full)[:100]
    pop_dep = np.zeros(n_items)
    pop_dep[top100] = pop_full[top100]
    txt = df.groupby("i").agg(
        title=("title", lambda x: " ".join(str(v) for v in x if pd.notna(v))[:2000]),
        text=("text", lambda x: " ".join(str(v) for v in x if pd.notna(v))[:3000]),
    )
    c = (txt["title"] + " " + txt["text"]).reindex(range(n_items)).fillna("")
    X = TfidfVectorizer(max_features=5000, stop_words="english").fit_transform(c)
    U, V = {}, {}
    for k in K_LIST:
        svd = TruncatedSVD(n_components=k, random_state=42)
        U[k] = svd.fit_transform(R)
        V[k] = svd.components_.T
    return {"X": X, "U": U, "V": V, "pop_full": minmax(pop_full), "pop_dep": minmax(pop_dep), "n_items": n_items}


def seeds_for(h, scheme):
    s = h[h["rating"] >= 4.0].head(SEED_CAP)
    if len(s) == 0:
        s = h.head(SEED_CAP)
    r = s["rating"].values.astype(float)
    if scheme == "uniform":
        w = np.ones(len(s))
    elif scheme == "recency":
        w = r * (0.9 ** np.arange(len(s)))
    else:
        w = r
    return s["i"].values, w / w.sum()


def components(M, u, h, scheme="rating"):
    si, w = seeds_for(h, scheme)
    v = csr_matrix((w, (np.zeros(len(w), dtype=int), si)), shape=(1, M["n_items"])) @ M["X"]
    cb = np.asarray(M["X"].dot(v.T).todense()).ravel()
    comp = {"cbn": minmax(cb)}
    for k in K_LIST:
        comp[("cfn", k)] = minmax(M["U"][k][u] @ M["V"][k].T)
    return comp


def score(M, comp, k, w, pop):
    popv = {"dep": M["pop_dep"], "full": M["pop_full"], "none": np.zeros(M["n_items"])}[pop]
    return w[0] * comp[("cfn", k)] + w[1] * comp["cbn"] + w[2] * popv


def evaluate(M, hist, users, rel, configs, scheme="rating"):
    res = {name: [] for name in configs}
    for u in users:
        h = hist[u]
        comp = components(M, u, h, scheme)
        banned = np.fromiter(set(h["i"].values), dtype=int)
        relmask = np.zeros(M["n_items"], bool)
        relmask[list(rel[u])] = True
        for name, (k, w, pop) in configs.items():
            top = top_idx(score(M, comp, k, w, pop), banned)
            res[name].append(metrics(relmask[top], len(rel[u])))
    return {n: np.array(v) for n, v in res.items()}


def summarize(arr):
    return {"Precision@10": float(arr[:, 0].mean()), "Recall@10": float(arr[:, 1].mean()), "NDCG@10": float(arr[:, 2].mean())}


def load_categories(items):
    if CAT_CACHE.exists():
        return json.loads(CAT_CACHE.read_text(encoding="utf8"))
    want = set(items)
    cats = {}
    with open(META, encoding="utf8") as f:
        for line in f:
            if '"parent_asin"' not in line:
                continue
            d = json.loads(line)
            a = d.get("parent_asin")
            if a in want and a not in cats:
                c = d.get("categories") or []
                cats[a] = c[1] if len(c) > 1 else (c[0] if c else "unknown")
    CAT_CACHE.write_text(json.dumps(cats, ensure_ascii=False), encoding="utf8")
    return cats


def apply_quota(ranked, cat_of, primary, behavior, ratio, limit=K):
    """Mô phỏng buildQuotaBalancedRecommendations: tối đa round(limit*ratio) sản phẩm cùng danh mục chính."""
    if ratio is None or primary is None:
        return ranked[:limit]
    max_same = max(1, round(limit * ratio))
    out, used = [], set()
    for it in ranked:
        if len(out) >= max_same:
            break
        if cat_of[it] == primary:
            out.append(it); used.add(it)
    bq = max(0, limit - max_same)
    added = 0
    for it in ranked:
        if added >= bq or len(out) >= limit:
            break
        if it not in used and cat_of[it] != primary and cat_of[it] in behavior:
            out.append(it); used.add(it); added += 1
    for it in ranked:
        if len(out) >= limit:
            break
        if it not in used:
            out.append(it); used.add(it)
    return out


def main():
    t0 = time.time()
    rng = np.random.default_rng(SEED)
    tr = pd.read_csv(TRAIN)
    te = pd.read_csv(TEST)
    items = tr["parent_asin"].unique()
    users = tr["user_id"].unique()
    item2idx = {a: i for i, a in enumerate(items)}
    user2idx = {a: i for i, a in enumerate(users)}
    tr["u"] = tr["user_id"].map(user2idx)
    tr["i"] = tr["parent_asin"].map(item2idx)
    te = te[te["user_id"].isin(user2idx)].copy()
    te["u"] = te["user_id"].map(user2idx)
    te["i"] = te["parent_asin"].map(item2idx)
    te = te.dropna(subset=["i"])
    te["i"] = te["i"].astype(int)

    report = {"seed": SEED}

    # ---------- 1. Tập kiểm định ----------
    val_mask = np.zeros(len(tr), bool)
    for u, idx in tr.groupby("u").indices.items():
        if len(idx) >= 5:
            n_val = max(1, math.ceil(0.2 * len(idx)))
            val_mask[rng.choice(idx, size=n_val, replace=False)] = True
    tr_v, val = tr[~val_mask], tr[val_mask]
    print(f"train'={len(tr_v)} val={int(val_mask.sum())}", flush=True)
    M_v = build_models(tr_v, items, item2idx)
    hist_v = {u: g.sort_values("timestamp", ascending=False) for u, g in tr_v.groupby("u")}
    seen_v = {u: set(g["i"].values) for u, g in hist_v.items()}
    rel_v = {}
    for u, g in val[val["rating"] >= 4.0].groupby("u"):
        r = set(g["i"].values) - seen_v.get(u, set())
        if r and u in hist_v:
            rel_v[u] = r
    val_users = sorted(rel_v)
    val_sample = list(rng.choice(val_users, size=min(4000, len(val_users)), replace=False))
    configs = {}
    for k in K_LIST:
        for w in WEIGHTS:
            pops = ["none"] if w[2] == 0 else ["dep", "full"]
            for pop in pops:
                configs[f"k={k} w={w[0]:.2f}/{w[1]:.2f}/{w[2]:.2f} pop={pop}"] = (k, w, pop)
    print(f"validation users={len(val_sample)} configs={len(configs)}", flush=True)
    val_res = evaluate(M_v, hist_v, val_sample, rel_v, configs)
    val_table = {n: summarize(a) for n, a in val_res.items()}
    best_name = max(val_table, key=lambda n: val_table[n]["NDCG@10"])
    deployed = "k=50 w=0.50/0.35/0.15 pop=dep"
    report["validation"] = {
        "users": len(val_sample),
        "results": val_table,
        "selected_config": best_name,
        "deployed_config": deployed,
    }
    print("selected:", best_name, "deployed:", deployed, flush=True)

    # ---------- 2. Đánh giá trên tập kiểm thử ----------
    M = build_models(tr, items, item2idx)
    hist = {u: g.sort_values("timestamp", ascending=False) for u, g in tr.groupby("u")}
    seen = {u: set(g["i"].values) for u, g in hist.items()}
    rel = {}
    for u, g in te[te["rating"] >= 4.0].groupby("u"):
        r = set(g["i"].values) - seen.get(u, set())
        if r:
            rel[u] = r
    test_users = sorted(rel)
    test_cfg = {"selected": configs[best_name], "deployed": configs[deployed],
                "svd_cb_nopop_k10": (10, (0.6, 0.4, 0.0), "none")}
    test_res = evaluate(M, hist, test_users, rel, test_cfg)
    report["test"] = {"users": len(test_users), "configs": {n: {**summarize(a),
        "NDCG@10_ci95": list(np.percentile([a[rng.integers(0, len(a), len(a))][:, 2].mean() for _ in range(1000)], [2.5, 97.5]))}
        for n, a in test_res.items()}, "selected_config": best_name}
    print("test done", flush=True)

    # ---------- 3. Độ nhạy: m, cách đặt trọng số hạt giống ----------
    sub = list(rng.choice(test_users, size=3000, replace=False))
    sens = {"bayesian_m": {}, "seed_weighting": {}}
    base_cfg = {"c": (50, (0.60, 0.30, 0.10), "full")}
    for m in (1, 5, 20, 50):
        Mm = build_models(tr, items, item2idx, m=m)
        sens["bayesian_m"][str(m)] = summarize(evaluate(Mm, hist, sub, rel, base_cfg)["c"])
    for scheme in ("rating", "uniform", "recency"):
        sens["seed_weighting"][scheme] = summarize(evaluate(M, hist, sub, rel, base_cfg, scheme)["c"])
    report["sensitivity"] = {"users": len(sub), "config": "k=50 w=0.60/0.30/0.10 pop=full", **sens}
    print("sensitivity done", flush=True)

    # ---------- 4. Category Quota Reranking ----------
    cats = load_categories(list(items))
    cat_of = {i: cats.get(items[i], "unknown") for i in range(len(items))}
    ratios = {"khong_quota": None, "0.40": 0.40, "0.50": 0.50, "0.625": 0.625, "0.80": 0.80}
    quota_out = {}
    qusers = list(rng.choice(test_users, size=4000, replace=False))
    for cname in ("deployed", "selected"):
        k, w, pop = test_cfg[cname]
        acc = {r: [] for r in ratios}
        div = {r: [] for r in ratios}
        for u in qusers:
            h = hist[u]
            comp = components(M, u, h)
            banned = np.fromiter(seen[u], dtype=int)
            ranked = list(top_idx(score(M, comp, k, w, pop), banned, 50))
            primary = cat_of[int(h["i"].values[0])]
            beh = {cat_of[int(i)] for i in h["i"].values[1:6]} - {primary}
            relmask = np.zeros(M["n_items"], bool)
            relmask[list(rel[u])] = True
            for rn, ratio in ratios.items():
                lst = apply_quota(ranked, cat_of, primary, beh, ratio)
                acc[rn].append(metrics(relmask[lst], len(rel[u])))
                cs = [cat_of[i] for i in lst]
                div[rn].append((len(set(cs)), 1 - sum(1 for a in range(K) for b in range(a + 1, K) if cs[a] == cs[b]) / (K * (K - 1) / 2),
                                float(np.mean([c == primary for c in cs]))))
        quota_out[cname] = {rn: {**summarize(np.array(acc[rn])),
                                 "distinct_categories_top10": float(np.mean([d[0] for d in div[rn]])),
                                 "intra_list_diversity": float(np.mean([d[1] for d in div[rn]])),
                                 "share_same_category_as_last_item": float(np.mean([d[2] for d in div[rn]]))}
                            for rn in ratios}
    report["category_quota"] = {"users": len(qusers), "category_level": "categories[1] của metadata Amazon", "results": quota_out}
    OUT.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf8")
    print(f"Done in {time.time() - t0:.0f}s -> {OUT}")


if __name__ == "__main__":
    main()
