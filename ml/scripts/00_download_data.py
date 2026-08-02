# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "huggingface-hub",
#     "tqdm",
# ]
# ///
"""
00_download_data.py
-------------------
Download Amazon Electronics Reviews 2023 (subset: 500K reviews)
+ Product Metadata from Hugging Face.

Strategy: Stream the large .jsonl file and only keep the first N lines.
This avoids downloading the full 22.6 GB file.

Usage:
    uv run ml/scripts/00_download_data.py
"""

import json
import gzip
import io
from pathlib import Path
from huggingface_hub import hf_hub_url, get_paths_info
from tqdm import tqdm
import urllib.request

# ============================================================
# CONFIG
# ============================================================
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

REPO_ID = "McAuley-Lab/Amazon-Reviews-2023"
REVIEWS_HF_PATH = "raw/review_categories/Electronics.jsonl"
META_HF_PATH = "raw/meta_categories/Electronics.jsonl"

REVIEWS_FILE = DATA_DIR / "reviews_electronics_500k.jsonl"
META_FILE = DATA_DIR / "meta_electronics.jsonl"

MAX_REVIEWS = 500_000  # Only take first 500K reviews


def download_hf_file_stream(repo_id: str, filename: str, output_path: Path, max_lines: int = 0):
    """
    Stream download a file from HuggingFace Hub.
    If max_lines > 0, only save the first max_lines lines (for .jsonl).
    """
    url = hf_hub_url(repo_id=repo_id, filename=filename, repo_type="dataset")
    print(f"  URL: {url}")

    req = urllib.request.Request(url)
    req.add_header("User-Agent", "Mozilla/5.0")

    with urllib.request.urlopen(req) as response:
        total_size = int(response.headers.get("Content-Length", 0))
        print(f"  Remote file size: {total_size / (1024**3):.2f} GB")

        with open(output_path, "w", encoding="utf-8") as out_f:
            line_count = 0
            buffer = b""
            pbar = tqdm(
                total=max_lines if max_lines > 0 else None,
                desc="  Lines",
                unit=" lines",
            )

            while True:
                chunk = response.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break

                buffer += chunk
                lines = buffer.split(b"\n")
                buffer = lines[-1]  # Keep incomplete line in buffer

                for line in lines[:-1]:
                    line_str = line.decode("utf-8", errors="replace").strip()
                    if line_str:
                        out_f.write(line_str + "\n")
                        line_count += 1
                        pbar.update(1)

                        if max_lines > 0 and line_count >= max_lines:
                            pbar.close()
                            return line_count

            # Process remaining buffer
            if buffer:
                line_str = buffer.decode("utf-8", errors="replace").strip()
                if line_str:
                    out_f.write(line_str + "\n")
                    line_count += 1
                    pbar.update(1)

            pbar.close()
            return line_count


# ============================================================
# DOWNLOAD REVIEWS (500K subset)
# ============================================================
print("=" * 60)
print("DOWNLOADING Amazon Electronics Reviews 2023")
print(f"  Subset: first {MAX_REVIEWS:,} reviews")
print("=" * 60)

if REVIEWS_FILE.exists():
    # Count existing lines
    with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
        existing = sum(1 for _ in f)
    print(f"[SKIP] Reviews already downloaded: {REVIEWS_FILE} ({existing:,} lines)")
else:
    print(f"\n[1/2] Streaming reviews from Hugging Face...")
    count = download_hf_file_stream(
        REPO_ID, REVIEWS_HF_PATH, REVIEWS_FILE, max_lines=MAX_REVIEWS
    )
    print(f"  → Saved {count:,} reviews to {REVIEWS_FILE}")

# ============================================================
# DOWNLOAD PRODUCT METADATA (full — much smaller)
# ============================================================
print()
if META_FILE.exists():
    with open(META_FILE, "r", encoding="utf-8") as f:
        existing = sum(1 for _ in f)
    print(f"[SKIP] Metadata already downloaded: {META_FILE} ({existing:,} lines)")
else:
    print(f"[2/2] Streaming product metadata from Hugging Face...")
    count = download_hf_file_stream(
        REPO_ID, META_HF_PATH, META_FILE, max_lines=0  # Download all metadata
    )
    print(f"  → Saved {count:,} products to {META_FILE}")

# ============================================================
# QUICK PREVIEW
# ============================================================
print()
print("=" * 60)
print("QUICK PREVIEW")
print("=" * 60)

# Show first review
with open(REVIEWS_FILE, "r", encoding="utf-8") as f:
    first_review = json.loads(f.readline())
print("\nFirst review sample:")
for key, val in first_review.items():
    val_str = str(val)
    if len(val_str) > 120:
        val_str = val_str[:120] + "..."
    print(f"  {key}: {val_str}")

# Show first product
if META_FILE.exists():
    with open(META_FILE, "r", encoding="utf-8") as f:
        first_meta = json.loads(f.readline())
    print("\nFirst product sample:")
    for key, val in first_meta.items():
        val_str = str(val)
        if len(val_str) > 120:
            val_str = val_str[:120] + "..."
        print(f"  {key}: {val_str}")

# File sizes
reviews_size = REVIEWS_FILE.stat().st_size / (1024 * 1024)
print(f"\nFile sizes:")
print(f"  Reviews: {reviews_size:.1f} MB")
if META_FILE.exists():
    meta_size = META_FILE.stat().st_size / (1024 * 1024)
    print(f"  Metadata: {meta_size:.1f} MB")

print("\n✅ Download complete! Ready for EDA (01_eda.py)")
