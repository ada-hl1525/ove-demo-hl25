import aiosqlite

from app.core.logger import logger


def configure_db():
    if aiosqlite is not None:
        logger.info("Configured DB")