from pathlib import Path

from fastapi import FastAPI, Request, Depends
from fastapi.templating import Jinja2Templates

from app.core.logger import logger
from app.core.auth import cookie_scheme
from app.core.config import get_settings

settings = get_settings()

TEMPLATES_DIR = Path(settings.templates_dir)

templates = Jinja2Templates(directory=TEMPLATES_DIR)

context = {
    "VITE_APP_TITLE": settings.app_name,
    "VITE_BACKEND": settings.vite_backend,
    "VITE_SOCKET_SERVER": settings.vite_socket_server,
    "VITE_SOCKET_PATH": settings.vite_socket_path,
    "VITE_LOG_LEVEL": settings.log_level,
    "VITE_LOGGING_SERVER": settings.logging_server,
    "VITE_ENABLE_DEBUG": settings.vite_enable_debug,
}


def make_view(name: str):
    async def view(request: Request, _auth: str = Depends(cookie_scheme)):
        return templates.TemplateResponse(name=name, request=request, context=context)

    view.__name__ = f"view_{name.replace(".", "_")}"
    return view


def configure_templates(app: FastAPI):
    for file in TEMPLATES_DIR.glob("*.template"):
        stem = file.stem
        endpoint_path = f"/{stem}"
        template_name = file.name

        view_fn = make_view(template_name)
        app.get(endpoint_path)(view_fn)

    logger.info("Configured templates")