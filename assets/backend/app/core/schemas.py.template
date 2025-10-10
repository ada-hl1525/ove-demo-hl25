from typing import Optional, Type, Container

from sqlalchemy import inspect
from sqlalchemy.orm import ColumnProperty
from pydantic import BaseModel, create_model, ConfigDict

from app.db import models
from app.core.logger import logger


class Status(BaseModel):
    status: str


class SocketJoinPayload(BaseModel):
    room: str


class TickPayload(BaseModel):
    timestamp: str


class OrmConfig(ConfigDict):
    from_attributes: bool


def sqlalchemy_to_pydantic(
    db_model: Type, *, config: Type = OrmConfig, exclude: Container[str] = None
) -> Type[BaseModel]:
    if exclude is None:
        exclude = []
    mapper = inspect(db_model)
    fields = {}
    for attr in mapper.attrs:
        if isinstance(attr, ColumnProperty):
            if attr.columns:
                name = attr.key
                if name in exclude:
                    continue
                column = attr.columns[0]
                python_type: Optional[type] = None
                if hasattr(column.type, "impl"):
                    if hasattr(column.type.impl, "python_type"):
                        python_type = column.type.impl.python_type
                elif hasattr(column.type, "python_type"):
                    python_type = column.type.python_type
                assert python_type, f"Could not infer python_type for {column}"
                default = None
                if column.default is None and not column.nullable:
                    default = ...
                fields[name] = (python_type, default)
    pydantic_model = create_model(
        db_model.__name__, __config__=config(from_attributes=True), **fields
    )
    return pydantic_model


def configure_schemas():
    for name, candidate in vars(models).items():
        if not isinstance(candidate, type):
            continue
        # skip anything that isn't a mapped class
        try:
            inspect(candidate).mapper
        except Exception:
            continue

        schema_cls = sqlalchemy_to_pydantic(candidate)
        globals()[schema_cls.__name__] = schema_cls
        # __all__.append(schema_cls.__name__)
    logger.info("Configured schemas")