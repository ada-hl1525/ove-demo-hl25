from fastapi import Request
from slowapi import Limiter
from fastapi.responses import JSONResponse
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.app import app
from app.core.logger import logger
from app.core.config import get_settings

settings = get_settings()
limiter = Limiter(key_func=get_remote_address)


def configure_limiter():
    # noinspection PyUnresolvedReferences
    app.state.limiter = limiter
    # noinspection PyTypeChecker
    app.add_middleware(SlowAPIMiddleware)
    logger.info("Rate limiting configured")


# noinspection PyUnusedLocal
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )