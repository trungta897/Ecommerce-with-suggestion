# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "huggingface-hub",
#     "tqdm",
# ]
# ///
"""
00b_download_meta.py
--------------------
Download product metadata for items that appear in the 500K reviews.
Streams the large meta file and only keeps entries matching our review ASINs.

Usage:
    uv run ml/scripts/00b_download_meta.py
"""

import json
from pathlib import Path
from tqdm import tqdm
import urllib.request

# ============================================================
# CONFIG
# ============================================================
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
REPO_ID = "McAuley-Lab/Amazon-Reviews-2023"
META_HF_PATH = "raw/meta_categories/meta_Electronics.jsonl"  # Fixed path with meta_ prefix
REVIEWS_FILE = DATA_DIR / "reviews_electronics_500k.jsonl"
META_FILE = DATA_DIR / "meta_electronics.jsonl"


# ============================================================
# STEP 1: Collect unique ASINs from reviews
# ============================================================
print("=" * 60)
print("STEP 1: Collecting unique product IDs from reviews")
print("=" * 60)

asins = set()
with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
    for line in tqdm(f, desc="  Reading reviews", unit=" lines"):
        try:
            row = json.loads(line)
            asin = row.get("parent_asin") or row.get("asin")
            if asin:
                asins.add(asin)
        except json.JSONDecodeError:
            continue

print(f"  → Found {len(asins):,} unique product IDs in reviews")

# ============================================================
# STEP 2: Stream metadata, keep only matching ASINs
# ============================================================
print()
print("=" * 60)
print("STEP 2: Downloading & filtering product metadata")
print("=" * 60)

if META_FILE.exists():
    with open(META_FILE, "r", encoding="utf-8") as f:
        existing = sum(1 for _ in f)
    print(f"[SKIP] Metadata already downloaded: {META_FILE} ({existing:,} lines)")
else:
    from huggingface_hub import hf_hub_url

    url = hf_hub_url(repo_id=REPO_ID, filename=META_HF_PATH, repo_type="dataset")
    print(f"  URL: {url}")

    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")

    with urllib.request.urlopen(req) as response:
        total_size = int(response.headers.get("Content-Length", 0))
        print(f"  Remote file size: {total_size / (1024**3):.2f} GB")
        print(f"  Filtering for {len(asins):,} ASINs...")

        matched = 0
        scanned = 0
        buffer = b""

        with open(META_FILE, "w", encoding="utf-8") as out_f:
            pbar = tqdm(desc="  Scanning meta", unit=" products")

            while True:
                chunk = response.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break

                buffer += chunk
                lines = buffer.split(b"\n")
                buffer = lines[-1]

                for line in lines[:-1]:
                    line_str = line.decode("utf-8", errors="replace").strip()
                    if not line_str:
                        continue
                    scanned += 1
                    pbar.update(1)

                    try:
                        row = json.loads(line_str)
                        asin = row.get("parent_asin") or row.get("asin")
                        if asin and asin in asins:
                            out_f.write(line_str + "\n")
                            matched += 1
                    except json.JSONDecodeError:
                        continue

            # Process remaining buffer
            if buffer:
                line_str = buffer.decode("utf-8", errors="replace").strip()
                if line_str:
                    scanned += 1
                    pbar.update(1)
                    try:
                        row = json.loads(line_str)
                        asin = row.get("parent_asin") or row.get("asin")
                        if asin and asin in asins:
                            out_f.write(line_str + "\n")
                            matched += 1
                    except json.JSONDecodeError:
                        pass

            pbar.close()

    print(f"  → Scanned {scanned:,} products total")
    print(f"  → Matched {matched:,} products (from our {len(asins):,} ASINs)")

# ============================================================
# QUICK PREVIEW
# ============================================================
print()
print("=" * 60)
print("QUICK PREVIEW")
print("=" * 60)

with open(META_FILE, "r", encoding="utf-8") as f:
    first_meta = json.loads(f.readline())

print("\nFirst product sample:")
for key, val in first_meta.items():
    val_str = str(val)
    if len(val_str) > 120:
        val_str = val_str[:120] + "..."
    print(f"  {key}: {val_str}")

meta_size = META_FILE.stat().st_size / (1024 * 1024)
reviews_size = REVIEWS_FILE.stat().st_size / (1024 * 1024)
print(f"\nFile sizes:")
print(f"  Reviews: {reviews_size:.1f} MB")
print(f"  Metadata: {meta_size:.1f} MB")

print("\n✅ Metadata download complete! Ready for EDA (01_eda.py)")
