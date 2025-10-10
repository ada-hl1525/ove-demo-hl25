import json
from typing import Any, Callable, Optional, TypeVar, Union

from fastapi_cache import FastAPICache
from fastapi_cache.decorator import cache
from fastapi_cache.coder import Coder
from fastapi_cache.backends.redis import RedisBackend
from fastapi.encoders import jsonable_encoder
from redis import asyncio as aioredis

from app.core.config import get_settings
from app.core.logger import logger

settings = get_settings()


class CustomJsonCoder(Coder):
    @classmethod
    def encode(cls, value: Any) -> bytes:
        return json.dumps(jsonable_encoder(value)).encode("utf-8")

    @classmethod
    def decode(cls, value: bytes) -> Any:
        return json.loads(value.decode("utf-8"))


async def configure_cache():
    redis = await aioredis.Redis(
        host=settings.cache_host,
        port=settings.cache_port,
        password=settings.cache_password,
        ssl=settings.secure_cache,
        ssl_certfile=settings.cache_certfile,
        ssl_keyfile=settings.cache_keyfile,
        ssl_cert_reqs="required",
        ssl_ca_certs=settings.ca_bundle_path
    )
    await redis.ping()
    FastAPICache.init(RedisBackend(redis), prefix=settings.cache_prefix)
    logger.info("Cache configured")


_F = TypeVar("_F", bound=Callable[..., object])


def cached(
        _func: Optional[_F] = None,
        *,
        expire: Optional[int] = None,
        key_builder: Optional[Callable[[Any, Any, Any], str]] = None,
) -> Union[_F, Callable[[_F], _F]]:
    """
    A decorator for FastAPI endpoints that:
      - uses CustomJsonCoder
      - defaults to settings.cache_expiration
      - is disabled when settings.cache_enabled is False
    Usage:
      @cached
      async def route1(...): ...

      @cached(expire=30)
      async def route2(...): ...
    """

    def _decorate(func: _F) -> _F:
        # If caching is globally disabled, just return the original function
        if not settings.cache_enabled:
            return func

        # Otherwise wrap with fastapi_cache2.cache
        return cache(
            expire=expire or settings.cache_expiration,
            coder=CustomJsonCoder,
            key_builder=key_builder,
        )(func)  # type: ignore

    # support both @cached and @cached(...)
    if _func is None:
        return _decorate
    else:
        return _decorate(_func)