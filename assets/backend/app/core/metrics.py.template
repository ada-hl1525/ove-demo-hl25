import os

from fastapi import Depends
from starlette.responses import Response
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import CollectorRegistry, multiprocess, generate_latest, CONTENT_TYPE_LATEST

from app.app import app
from app.core.logger import logger
from app.core.auth import metrics_scheme
from app.core.config import get_settings

settings = get_settings()

instrumentator = Instrumentator(should_instrument_requests_inprogress=True).instrument(app)


@app.get("/metrics", response_model=dict)
async def get_metrics(_auth=Depends(metrics_scheme)):
    ephemeral_registry = instrumentator.registry
    if "PROMETHEUS_MULTIPROC_DIR" in os.environ:
        ephemeral_registry = CollectorRegistry()
        multiprocess.MultiProcessCollector(ephemeral_registry)

    resp = Response(content=generate_latest(ephemeral_registry))
    resp.headers["Content-Type"] = CONTENT_TYPE_LATEST

    return resp


def configure_metrics():
    logger.info("Metrics configured")