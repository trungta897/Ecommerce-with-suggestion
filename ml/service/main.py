from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(
    title="DATN ML Service",
    description="API cho hệ thống gợi ý sản phẩm (Recommendation System) sử dụng LightFM",
    version="1.0.0"
)

@app.get("/")
def read_root():
    return {"message": "Welcome to DATN ML Service"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
