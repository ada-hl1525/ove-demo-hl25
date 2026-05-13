import os
import sys
import json
import inspect
from pathlib import Path

from pydantic import BaseModel
from fastapi.openapi.utils import get_openapi

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.main import app
from app.core import schemas
from app.core.sockets import generate_asyncapi

with open(Path(__file__).parent.parent / "schemas" / "openapi.json", 'w') as f:
    json.dump(get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    ), f, indent=2)

out = Path(__file__).parent.parent / "schemas" / "asyncapi"
generate_asyncapi(out, title=app.title, version=app.version, url="localhost:8000")

out = Path(__file__).parent.parent / "schemas" / "entities"
out.mkdir(exist_ok=True)

for name, model in inspect.getmembers(schemas):
    if inspect.isclass(model) and issubclass(model, BaseModel) and name != "BaseModel":
        with open(out / f"{model.__name__}.schema.json", "w") as f:
            json.dump(model.model_json_schema(), f, indent=2)