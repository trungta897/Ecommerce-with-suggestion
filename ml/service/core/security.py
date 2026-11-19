import secrets

from fastapi import Security, HTTPException, status
from fastapi.security.api_key import APIKeyHeader
from .config import settings

API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    # So sánh hằng thời gian để tránh tấn công timing
    if api_key_header and secrets.compare_digest(
        api_key_header.encode("utf-8"), settings.API_KEY.encode("utf-8")
    ):
        return api_key_header
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN, detail="Could not validate credentials"
    )
