import json
from pathlib import Path

import uvicorn
from fastapi.routing import APIRoute
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi import Request, FastAPI, Response, HTTPException

from app.app import app
from app.db import configure_db
from app.api.v1.endpoints import example
from app.core.auth import configure_auth
from app.core.config import get_settings
from app.core.cors import configure_cors
from app.core import schemas, downgrade_ssl
from app.core.metrics import configure_metrics
from app.core.schemas import configure_schemas
from app.core.sockets import configure_sockets
from app.core.templates import configure_templates
from app.api.v1.sockets import configure_v1_namespace
from app.core.rate_limiter import limiter, configure_limiter

settings = get_settings()

if settings.downgrade_ssl:
    downgrade_ssl()

configure_limiter()
configure_cors()
configure_metrics()
configure_auth()
configure_db()
configure_schemas()

configure_sockets(app)
configure_templates(app)

configure_v1_namespace()

app.include_router(example.router, prefix=f"/api/v1", tags=["example"])  # TODO: replace


# noinspection PyUnusedLocal
@app.get("/status", response_model=schemas.Status)
@limiter.limit("1/second")
async def get_status(request: Request) -> schemas.Status:
    return schemas.Status(status="running")


@app.get("/env.js")
async def get_env(request: Request):
    env = {
        "VITE_APP_TITLE": settings.app_name,
        "VITE_BACKEND": settings.vite_backend,
        "VITE_SOCKET_SERVER": settings.vite_socket_server,
        "VITE_SOCKET_PATH": settings.vite_socket_path,
        "VITE_LOG_LEVEL": settings.log_level,
        "VITE_LOGGING_SERVER": settings.logging_server,
        "VITE_ENABLE_DEBUG": settings.vite_enable_debug,
    }
    payload = "window._env_ = " + json.dumps(env) + ";"
    return Response(payload, media_type="application/javascript")


app.mount("/asyncapi", StaticFiles(directory=settings.asyncapi_dir), name="asyncapi")


@app.get("/{full_path:path}")
async def spa(full_path: str):
    print(full_path)
    file_path = Path(settings.public_dir, full_path)
    if file_path.is_file():
        return FileResponse(file_path)
    index = Path(settings.public_dir, "index.html")
    if index.is_file():
        return FileResponse(index)
    raise HTTPException(status_code=404)


def use_route_names_as_operation_ids(app_: FastAPI) -> None:
    """
    Simplify operation IDs so that generated API clients have simpler function
    names.

    Should be called only after all routes have been added.
    """
    for route in app_.routes:
        if isinstance(route, APIRoute):
            if route.path.startswith("/api/v"):
                route.operation_id = route.name + f"_v{route.path.split("/")[2][1:]}"
            else:
                route.operation_id = route.name  # in this case, 'read_items'


use_route_names_as_operation_ids(app)

if __name__ == "__main__":
    # this is what PyInstaller will turn into an exe
    uvicorn.run(app, host="0.0.0.0", port=settings.port)