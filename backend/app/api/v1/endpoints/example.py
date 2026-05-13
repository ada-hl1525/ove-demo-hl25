from pathlib import Path

from fastapi import APIRouter, Request, Depends

from app.core.auth import cookie_scheme
from app.core.cache import cached
from app.core.config import get_settings
from app.core.rate_limiter import limiter

router = APIRouter()
settings = get_settings()


@router.get("/example", response_model=list[str])
@limiter.limit("100/second")
@cached
async def get_example(request: Request, _auth=Depends(cookie_scheme)) -> list[str]:
    return []
