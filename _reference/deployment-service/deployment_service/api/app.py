"""
FastAPI application for the deployment-service HTTP API.

Run with:
    python -m deployment_service --serve --port 9000

Or directly:
    uvicorn deployment_service.api.app:app --host 0.0.0.0 --port 9000
"""

from fastapi import FastAPI

from deployment_service.api.routes.state import router

app = FastAPI(
    title="Deployment Service API",
    version="0.1.0",
    docs_url=None,
    redoc_url=None,
)

app.include_router(router)
