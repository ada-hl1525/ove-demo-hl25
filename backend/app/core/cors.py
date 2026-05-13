from fastapi.middleware.cors import CORSMiddleware

from app.app import app
from app.core.logger import logger
from app.core.config import get_settings

settings = get_settings()

origins = [
    settings.frontend_origin,
    settings.websocket_origin,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def configure_cors():
    logger.info("CORS configured")