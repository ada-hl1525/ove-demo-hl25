import asyncio
from logging.config import fileConfig

from sqlalchemy.ext.asyncio import create_async_engine, AsyncConnection
from alembic import context

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Update the database configuration from env variables
# noinspection PyUnresolvedReferences
from app.core.config import Settings
settings = Settings()
config.set_main_option("sqlalchemy.url", settings.database_url)

# add your model's MetaData object here
# for 'autogenerate' support
# noinspection PyUnresolvedReferences
from app.db.models import Base
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def include_object(obj, name, type_, reflected, compare_to):
    # if you ever wanted to _exclude_ some tables from the autogen diff:
    # if type_ == "table" and name in ("some_automapped_table",):
    #     return False
    return not (type_ == "table" and reflected and compare_to is None)


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    """Run migrations in 'online' (async) mode."""
    # create_async_engine will look for an async driver in your URL
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        pool_pre_ping=True,
        future=True,
    )

    # use an AsyncConnection to run the migrations
    async with connectable.connect() as connection:  # type: AsyncConnection
        # Alembic’s context.configure is sync, but we can
        # “run_sync” it on the async connection
        await connection.run_sync(_do_run_migrations)

    await connectable.dispose()


def _do_run_migrations(connection):
    """
    This function is called synchronously by
    connection.run_sync(). Inside here, context.run_migrations()
    is fully sync.
    """
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object,
        # if you use version_table_schema or other opts, pass them here
    )

    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    # asyncio.run is fine here since env.py is launched as a script
    asyncio.run(run_migrations_online())