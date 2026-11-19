---
description: "Best practices for Python and FastAPI development in the ML Service"
globs: "ml/**/*.py"
---

# Python & FastAPI Best Practices — ML Service

This document outlines coding standards for the ML Service component of the project, which uses FastAPI for inference serving and Python scripts for offline training.

## Project Structure

```
ml/
├── scripts/                    # Offline training & data processing
│   ├── 00_download_data.py     # Download Amazon Electronics dataset
│   ├── 00b_download_meta.py    # Download product metadata
│   ├── 01_eda.py               # Exploratory Data Analysis
│   ├── 02_preprocess.py        # Data preprocessing & train/test split
│   ├── 03_content_based.py     # Content-Based model (TF-IDF + Cosine)
│   ├── 04_collaborative.py     # Collaborative Filtering (SVD — Surprise)
│   ├── 05_hybrid.py            # Hybrid model (Weighted)
│   ├── 06_evaluate.py          # Offline evaluation (Precision@K, RMSE, etc.)
│   └── 07_translate_products.py # Translate items to Vietnamese
├── service/
│   ├── main.py                 # FastAPI app — inference only
│   ├── models/                 # Load pre-trained .pkl models
│   └── routers/                # API route handlers
├── tests/                      # pytest
├── data/                       # Dataset (gitignored)
├── models/                     # Trained .pkl files (gitignored)
└── requirements.txt
```

## Python Coding Standards

- Use Python 3.10+ features (type hints, match statements where appropriate).
- Use type hints for all function signatures.
- Follow PEP 8 naming conventions: `snake_case` for functions/variables, `PascalCase` for classes.
- Use docstrings (Google style) for all public functions and classes.
- Keep functions focused — single responsibility principle.
- Use `pathlib.Path` instead of `os.path` for file operations.
- Use `logging` module instead of `print()` for production code.

## FastAPI Best Practices

- **Inference Only:** The FastAPI service only serves predictions from pre-trained models. Training runs offline via scripts.
- **Startup Events:** Load models (.pkl files) on startup using `@app.on_event("startup")` or lifespan.
- **Pydantic Models:** Define request/response schemas with Pydantic v2 BaseModel.
- **Error Handling:** Use HTTPException with appropriate status codes. Never expose internal errors to clients.
- **Health Check:** Include a `/health` endpoint for Docker/deployment readiness checks.
- **CORS:** Configure CORS to allow requests only from the frontend and backend services.

### API Endpoints

```python
# Standard endpoint structure:
@router.get("/recommend/popular", response_model=RecommendationResponse)
async def get_popular_items(limit: int = 10):
    """Return top-K popular items (baseline/cold-start)."""
    ...

@router.get("/recommend/hybrid/{user_id}", response_model=RecommendationResponse)
async def get_hybrid_recommendations(user_id: str, limit: int = 10):
    """Return hybrid recommendations for a specific user."""
    ...
```

## Data Processing Scripts

- Scripts are numbered sequentially (00_, 01_, 02_, ...) to indicate execution order.
- Each script should be runnable independently: `python ml/scripts/01_eda.py`.
- Save intermediate results to `ml/data/` (gitignored).
- Save trained models to `ml/models/` as `.pkl` files (gitignored).
- Use `pandas` for data manipulation, `matplotlib`/`seaborn` for visualization.
- Document assumptions and parameters at the top of each script.

## ML-Specific Guidelines

- **Reproducibility:** Set random seeds (`random_state=42`) for all splits and model training.
- **No Data Leakage:** Never use test data during training. Validate train/test split integrity.
- **Metrics:** Use standard metrics — Precision@K, Recall@K, NDCG@K for ranking; RMSE, MAE for rating prediction.
- **Threshold:** Document why threshold ≥ 4.0 (or other) was chosen for "relevant" items.
- **Cold-Start:** Handle users with < 3 ratings by falling back to Popular Items.

## Dependencies

- Use `requirements.txt` for dependency management.
- Pin exact versions for reproducibility.
- Key libraries: `fastapi`, `uvicorn`, `surprise`, `scikit-learn`, `pandas`, `numpy`, `pydantic`.

## Testing

- Use `pytest` for unit and integration tests.
- Test model loading and inference endpoints.
- Test edge cases: unknown user_id, empty recommendations, cold-start users.
- Mock model files in tests to avoid loading large .pkl files.
