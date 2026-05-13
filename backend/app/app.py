from fastapi import FastAPI
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.cache import configure_cache

settings = get_settings()


@asynccontextmanager
async def lifespan(_application: FastAPI):
    if settings.cache_enabled:
        await configure_cache()
    yield

app = FastAPI(
    lifespan=lifespan,
    root_path=settings.base_path,
    title="ove-demo-hl25 Observatory Demo",
    description="Demo for Imperial College London's Data Observatory showcasing the ove-demo-hl25 project."
)