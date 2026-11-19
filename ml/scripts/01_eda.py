# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "pandas",
#     "matplotlib",
#     "seaborn",
#     "scikit-learn",
# ]
# ///
"""
01_eda.py
---------
Exploratory Data Analysis for Amazon Electronics Reviews 2023.

Analyzes:
  1. Rating distribution
  2. Reviews per user / per item
  3. Sparsity of user-item matrix
  4. Filtering (user >= 5 reviews, item >= 5 reviews)
  5. Train/Test split (80/20 per-user random split)
     Each user's ratings are split individually so that every user
     appears in BOTH train and test sets — required for SVD/CF evaluation.

Usage:
    uv run ml/scripts/01_eda.py
"""

import json
import pandas as pd
import matplotlib
matplotlib.use("Agg")  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.model_selection import train_test_split

# ============================================================
# CONFIG
# ============================================================
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUTPUT_DIR = DATA_DIR / "eda_output"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

REVIEWS_FILE = DATA_DIR / "reviews_electronics_500k.jsonl"
META_FILE = DATA_DIR / "meta_electronics.jsonl"

sns.set_theme(style="whitegrid", palette="viridis")
plt.rcParams["figure.figsize"] = (10, 6)
plt.rcParams["figure.dpi"] = 120

# ============================================================
# 1. LOAD REVIEWS
# ============================================================
print("=" * 60)
print("1. LOADING REVIEWS")
print("=" * 60)

reviews = []
with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
    for line in f:
        row = json.loads(line)
        reviews.append({
            "user_id": row.get("user_id", ""),
            "parent_asin": row.get("parent_asin", row.get("asin", "")),
            "rating": row.get("rating", 0),
            "title": row.get("title", ""),
            "text": row.get("text", ""),
            "timestamp": row.get("timestamp", 0),
            "helpful_vote": row.get("helpful_vote", 0),
            "verified_purchase": row.get("verified_purchase", False),
        })

df = pd.DataFrame(reviews)
print(f"Total reviews: {len(df):,}")
print(f"Columns: {list(df.columns)}")
print(f"\nFirst 3 rows:")
print(df.head(3).to_string())

# ============================================================
# 2. BASIC STATISTICS
# ============================================================
print("\n" + "=" * 60)
print("2. BASIC STATISTICS")
print("=" * 60)

print(f"\nUnique users:    {df['user_id'].nunique():,}")
print(f"Unique products: {df['parent_asin'].nunique():,}")
print(f"Rating range:    {df['rating'].min()} - {df['rating'].max()}")
print(f"Mean rating:     {df['rating'].mean():.2f}")
print(f"Median rating:   {df['rating'].median():.1f}")

# Sparsity
n_users = df['user_id'].nunique()
n_items = df['parent_asin'].nunique()
n_interactions = len(df)
sparsity = 1 - (n_interactions / (n_users * n_items))
print(f"\nUser-Item Matrix:")
print(f"  Size:     {n_users:,} × {n_items:,} = {n_users * n_items:,.0f} cells")
print(f"  Filled:   {n_interactions:,}")
print(f"  Sparsity: {sparsity:.6f} ({sparsity*100:.4f}%)")

# ============================================================
# 3. RATING DISTRIBUTION
# ============================================================
print("\n" + "=" * 60)
print("3. RATING DISTRIBUTION")
print("=" * 60)

rating_dist = df['rating'].value_counts().sort_index()
print(rating_dist)

fig, ax = plt.subplots()
bars = ax.bar(rating_dist.index.astype(str), rating_dist.values, color=sns.color_palette("viridis", 5))
ax.set_xlabel("Rating (Stars)")
ax.set_ylabel("Number of Reviews")
ax.set_title("Rating Distribution — Amazon Electronics 2023 (500K subset)")
for bar, val in zip(bars, rating_dist.values):
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1000,
            f"{val:,}", ha="center", va="bottom", fontsize=9)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "rating_distribution.png")
plt.close()
print(f"  → Saved: {OUTPUT_DIR / 'rating_distribution.png'}")

# ============================================================
# 4. REVIEWS PER USER
# ============================================================
print("\n" + "=" * 60)
print("4. REVIEWS PER USER")
print("=" * 60)

user_counts = df['user_id'].value_counts()
print(f"Reviews per user:")
print(f"  Mean:   {user_counts.mean():.2f}")
print(f"  Median: {user_counts.median():.1f}")
print(f"  Min:    {user_counts.min()}")
print(f"  Max:    {user_counts.max()}")
print(f"  Std:    {user_counts.std():.2f}")

print(f"\nDistribution:")
for threshold in [1, 2, 3, 5, 10, 20, 50]:
    count = (user_counts >= threshold).sum()
    pct = count / len(user_counts) * 100
    print(f"  Users with ≥{threshold:>3} reviews: {count:>8,} ({pct:.1f}%)")

fig, axes = plt.subplots(1, 2, figsize=(14, 5))
# Histogram (capped at 50)
capped = user_counts.clip(upper=50)
axes[0].hist(capped, bins=50, color=sns.color_palette("viridis")[0], edgecolor="white")
axes[0].set_xlabel("Reviews per User (capped at 50)")
axes[0].set_ylabel("Number of Users")
axes[0].set_title("Reviews per User Distribution")

# Box plot
axes[1].boxplot(user_counts.clip(upper=100), vert=True)
axes[1].set_ylabel("Reviews per User (capped at 100)")
axes[1].set_title("Reviews per User — Box Plot")

plt.tight_layout()
plt.savefig(OUTPUT_DIR / "reviews_per_user.png")
plt.close()
print(f"  → Saved: {OUTPUT_DIR / 'reviews_per_user.png'}")

# ============================================================
# 5. REVIEWS PER ITEM
# ============================================================
print("\n" + "=" * 60)
print("5. REVIEWS PER ITEM")
print("=" * 60)

item_counts = df['parent_asin'].value_counts()
print(f"Reviews per item:")
print(f"  Mean:   {item_counts.mean():.2f}")
print(f"  Median: {item_counts.median():.1f}")
print(f"  Min:    {item_counts.min()}")
print(f"  Max:    {item_counts.max()}")

print(f"\nDistribution:")
for threshold in [1, 2, 3, 5, 10, 20, 50, 100]:
    count = (item_counts >= threshold).sum()
    pct = count / len(item_counts) * 100
    print(f"  Items with ≥{threshold:>3} reviews: {count:>8,} ({pct:.1f}%)")

# Top 10 most reviewed items
print(f"\nTop 10 most reviewed products:")
for asin, cnt in item_counts.head(10).items():
    print(f"  {asin}: {cnt:,} reviews")

fig, ax = plt.subplots()
capped_items = item_counts.clip(upper=50)
ax.hist(capped_items, bins=50, color=sns.color_palette("viridis")[2], edgecolor="white")
ax.set_xlabel("Reviews per Item (capped at 50)")
ax.set_ylabel("Number of Items")
ax.set_title("Reviews per Item Distribution")
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "reviews_per_item.png")
plt.close()
print(f"  → Saved: {OUTPUT_DIR / 'reviews_per_item.png'}")

# ============================================================
# 6. FILTERING — user ≥ 5, item ≥ 5 (5-core)
# ============================================================
print("\n" + "=" * 60)
print("6. FILTERING — 5-Core (user ≥ 5, item ≥ 5 reviews)")
print("=" * 60)

df_filtered = df.copy()
prev_len = 0

# Iterative filtering until stable
iteration = 0
while len(df_filtered) != prev_len:
    prev_len = len(df_filtered)
    iteration += 1

    user_counts_f = df_filtered['user_id'].value_counts()
    item_counts_f = df_filtered['parent_asin'].value_counts()

    valid_users = user_counts_f[user_counts_f >= 5].index
    valid_items = item_counts_f[item_counts_f >= 5].index

    df_filtered = df_filtered[
        (df_filtered['user_id'].isin(valid_users)) &
        (df_filtered['parent_asin'].isin(valid_items))
    ]
    print(f"  Iteration {iteration}: {len(df_filtered):,} reviews, "
          f"{df_filtered['user_id'].nunique():,} users, "
          f"{df_filtered['parent_asin'].nunique():,} items")

print(f"\nAfter 5-core filtering:")
print(f"  Reviews:  {len(df):,} → {len(df_filtered):,} ({len(df_filtered)/len(df)*100:.1f}%)")
print(f"  Users:    {df['user_id'].nunique():,} → {df_filtered['user_id'].nunique():,}")
print(f"  Items:    {df['parent_asin'].nunique():,} → {df_filtered['parent_asin'].nunique():,}")

n_u = df_filtered['user_id'].nunique()
n_i = df_filtered['parent_asin'].nunique()
sparsity_f = 1 - (len(df_filtered) / (n_u * n_i))
print(f"  Sparsity: {sparsity_f:.6f} ({sparsity_f*100:.4f}%)")

# ============================================================
# 7. TRAIN/TEST SPLIT — 80/20 per-user random split
# ============================================================
print("\n" + "=" * 60)
print("7. TRAIN/TEST SPLIT (80/20 per-user split)")
print("=" * 60)

# Per-user split: for each user, randomly assign 80% of their ratings
# to train and 20% to test. This ensures EVERY user appears in both
# sets — critical for collaborative filtering (SVD) evaluation.
# GroupShuffleSplit would put entire users into train OR test,
# causing cold-start for ~20% of users and invalid CF metrics.

train_indices = []
test_indices = []

for user_id, group in df_filtered.groupby('user_id'):
    user_indices = group.index.tolist()
    n_ratings = len(user_indices)

    if n_ratings < 2:
        # User has only 1 rating after 5-core filtering (shouldn't
        # happen with ≥5 filter, but handle gracefully) → all to train
        train_indices.extend(user_indices)
        continue

    # Number of ratings to put in test (at least 1, at most n-1)
    n_test = max(1, int(n_ratings * 0.2))
    n_test = min(n_test, n_ratings - 1)  # keep at least 1 in train

    # Shuffle and split
    i_train, i_test = train_test_split(
        user_indices, test_size=n_test, random_state=42
    )
    train_indices.extend(i_train)
    test_indices.extend(i_test)

train_df = df_filtered.loc[train_indices].reset_index(drop=True)
test_df = df_filtered.loc[test_indices].reset_index(drop=True)

# Verify: no index overlap
assert len(set(train_indices) & set(test_indices)) == 0, \
    "Data leakage detected — overlapping indices!"

# Verify: every test user exists in train (critical for CF)
test_users = set(test_df['user_id'].unique())
train_users = set(train_df['user_id'].unique())
cold_start_users = test_users - train_users
assert len(cold_start_users) == 0, \
    f"Cold-start leak: {len(cold_start_users)} test users not in train!"
print(f"✅ All {len(test_users):,} test users appear in train set (no cold-start leak)")

print(f"Train set: {len(train_df):,} reviews ({len(train_df)/len(df_filtered)*100:.1f}%)")
print(f"  Users:  {train_df['user_id'].nunique():,}")
print(f"  Items:  {train_df['parent_asin'].nunique():,}")
print(f"  Mean rating: {train_df['rating'].mean():.3f}")

print(f"\nTest set:  {len(test_df):,} reviews ({len(test_df)/len(df_filtered)*100:.1f}%)")
print(f"  Users:  {test_df['user_id'].nunique():,}")
print(f"  Items:  {test_df['parent_asin'].nunique():,}")
print(f"  Mean rating: {test_df['rating'].mean():.3f}")

# Save
train_df.to_csv(DATA_DIR / "train.csv", index=False)
test_df.to_csv(DATA_DIR / "test.csv", index=False)
print(f"\n  → Saved: {DATA_DIR / 'train.csv'}")
print(f"  → Saved: {DATA_DIR / 'test.csv'}")

# Rating distribution comparison
fig, axes = plt.subplots(1, 2, figsize=(14, 5))
for ax, (name, data) in zip(axes, [("Train", train_df), ("Test", test_df)]):
    rd = data['rating'].value_counts().sort_index()
    bars = ax.bar(rd.index.astype(str), rd.values, color=sns.color_palette("viridis", 5))
    ax.set_xlabel("Rating")
    ax.set_ylabel("Count")
    ax.set_title(f"{name} Set — Rating Distribution")
    for bar, val in zip(bars, rd.values):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height(),
                f"{val:,}", ha="center", va="bottom", fontsize=8)
plt.tight_layout()
plt.savefig(OUTPUT_DIR / "train_test_rating_dist.png")
plt.close()
print(f"  → Saved: {OUTPUT_DIR / 'train_test_rating_dist.png'}")

# ============================================================
# 8. SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("📊 EDA SUMMARY")
print("=" * 60)

summary = {
    "Raw reviews": f"{len(df):,}",
    "Raw users": f"{df['user_id'].nunique():,}",
    "Raw items": f"{df['parent_asin'].nunique():,}",
    "After 5-core reviews": f"{len(df_filtered):,}",
    "After 5-core users": f"{df_filtered['user_id'].nunique():,}",
    "After 5-core items": f"{df_filtered['parent_asin'].nunique():,}",
    "Train size": f"{len(train_df):,}",
    "Test size": f"{len(test_df):,}",
    "Mean rating (all)": f"{df['rating'].mean():.2f}",
    "Sparsity (5-core)": f"{sparsity_f*100:.4f}%",
}

for key, val in summary.items():
    print(f"  {key:.<35} {val}")

print("\n✅ EDA complete! Output saved to ml/data/eda_output/")
print("   Next step: 02_preprocess.py")
