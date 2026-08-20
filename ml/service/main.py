import logging
from fastapi import FastAPI
from .api import recommend
from .core.redis_client import redis_client
from .core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API cho hệ thống gợi ý sản phẩm (Recommendation System) sử dụng LightFM",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    logger.info("Starting up ML Service...")
    await redis_client.connect()

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down ML Service...")
    await redis_client.close()

app.include_router(recommend.router, prefix="/recommend")

@app.get("/")
def read_root():
    return {"message": "Welcome to DATN ML Service"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
