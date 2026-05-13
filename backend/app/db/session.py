from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url)
session_factory = async_sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    session = session_factory()
    try:
        yield session
    finally:
        await session.close()