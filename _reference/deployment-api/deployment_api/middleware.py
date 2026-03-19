"""
Middleware configuration for the FastAPI application.

Handles CORS setup and other middleware configurations.
"""

import time
import uuid
from collections.abc import Awaitable, Callable

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp

from deployment_api import settings
from deployment_api.metrics import PROCESSING_LATENCY, RECORDS_PROCESSED

_RequestResponseEndpoint = Callable[[Request], Awaitable[Response]]


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """Propagate or generate X-Correlation-ID for every request."""

    async def dispatch(self, request: Request, call_next: _RequestResponseEndpoint) -> Response:
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request.state.correlation_id = correlation_id
        response = await call_next(request)
        response.headers["X-Correlation-ID"] = correlation_id
        return response


class PrometheusMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that records request counts and latency into Prometheus metrics.

    Uses the existing RECORDS_PROCESSED Counter and PROCESSING_LATENCY Histogram
    from deployment_api.metrics — no additional Prometheus dependencies required.
    """

    def __init__(self, app: ASGIApp, service_name: str = "deployment-api") -> None:
        super().__init__(app)
        self.service_name = service_name

    async def dispatch(self, request: Request, call_next: _RequestResponseEndpoint) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        status = "success" if response.status_code < 500 else "error"
        RECORDS_PROCESSED.labels(status=status).inc()
        PROCESSING_LATENCY.observe(duration)
        return response


def configure_middleware(app: FastAPI) -> None:
    """Configure middleware for the FastAPI application."""
    # Build CORS allowed origins from config
    _api_port = settings.API_PORT
    _frontend_port = settings.FRONTEND_PORT

    # Production domains
    _cors_origins_env = settings.CORS_ALLOWED_ORIGINS
    production_origins = _cors_origins_env.split(",") if _cors_origins_env else []

    # Development origins (only in development mode)
    dev_origins: list[str] = []
    if settings.DEPLOYMENT_ENV == "development":
        _static_dev_origins = [o.strip() for o in settings.CORS_DEV_ORIGINS.split(",") if o.strip()]
        dev_origins = [
            *_static_dev_origins,
            f"http://localhost:{_frontend_port}",
            f"http://127.0.0.1:{_frontend_port}",
            f"http://localhost:{_api_port}",
        ]

    allowed_origins = production_origins + dev_origins

    # Only allow specific Cloud Run services (not wildcard)
    # Configure this via CORS_ALLOWED_CLOUD_RUN env var
    allowed_cloud_run = settings.CORS_ALLOWED_CLOUD_RUN
    origin_regex = None
    if allowed_cloud_run:
        # Example: "deployment-dashboard,execution-service" -> regex for those specific services
        services = allowed_cloud_run.split(",")
        if services:
            pattern = "|".join(f"{service.strip()}-[a-z0-9]{{10}}" for service in services)
            origin_regex = rf"https://({pattern})-[a-z0-9]{{10}}\.run\.app"

    # Configure CORS with stricter settings
    if origin_regex:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Request-ID"],
            max_age=3600,
            allow_origin_regex=origin_regex,
        )
    else:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=allowed_origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "X-API-Key", "X-Request-ID"],
            max_age=3600,
        )
