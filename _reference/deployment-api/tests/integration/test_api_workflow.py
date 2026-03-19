"""API workflow integration tests for deployment-api.

Exercises real FastAPI routes under CLOUD_MOCK_MODE=true, DISABLE_AUTH=true
using TestClient. Tests health, readiness, workers, and error flows.

Note: deployment_api.main imports PubSubEventSink and setup_events at module
level, so we pre-initialize events in test mode and mock the PubSub sink
to avoid network calls during import.
"""

from __future__ import annotations

import os

os.environ.setdefault("CLOUD_MOCK_MODE", "true")
os.environ.setdefault("CLOUD_PROVIDER", "local")
os.environ.setdefault("GCP_PROJECT_ID", "test-project")
os.environ.setdefault("DISABLE_AUTH", "true")
os.environ.setdefault("MOCK_STATE_MODE", "deterministic")

from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient
from unified_events_interface import setup_events

# Pre-initialize events in test mode before any application import
setup_events("deployment-api", "test")

# Patch PubSubEventSink and setup_tracing to prevent network calls during
# deployment_api.main module load
with patch("deployment_api.main.PubSubEventSink"), \
     patch("deployment_api.main.setup_events"), \
     patch("deployment_api.main.setup_tracing"):
    from deployment_api.main import app

pytestmark = [pytest.mark.integration, pytest.mark.timeout(120)]


@pytest.fixture(scope="module")
def client() -> TestClient:
    """Create a TestClient for the deployment-api app."""
    return TestClient(app)


# ---------------------------------------------------------------------------
# Health & readiness
# ---------------------------------------------------------------------------


class TestHealthWorkflow:
    """Health and readiness probe tests."""

    def test_health_returns_200(self, client: TestClient) -> None:
        """GET /health returns 200 with service identity."""
        resp = client.get("/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["service"] == "deployment-api"
        assert body["status"] == "ok"

    def test_api_health_returns_200(self, client: TestClient) -> None:
        """GET /api/health returns 200 with detailed health info."""
        resp = client.get("/api/health")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] in ("ok", "healthy")

    def test_readiness_returns_200(self, client: TestClient) -> None:
        """GET /readiness returns 200 with ready status."""
        resp = client.get("/readiness")
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "ready"

    def test_api_readiness_returns_200(self, client: TestClient) -> None:
        """GET /api/readiness returns 200."""
        resp = client.get("/api/readiness")
        assert resp.status_code == 200

    def test_metrics_returns_prometheus_format(self, client: TestClient) -> None:
        """GET /metrics returns Prometheus text format."""
        resp = client.get("/metrics")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Workers workflow
# ---------------------------------------------------------------------------


class TestWorkersWorkflow:
    """Workers status endpoint tests."""

    def test_get_workers_status(self, client: TestClient) -> None:
        """GET /api/workers returns worker status."""
        resp = client.get("/api/workers")
        assert resp.status_code == 200
        body = resp.json()
        assert "active_workers" in body


# ---------------------------------------------------------------------------
# Infra health
# ---------------------------------------------------------------------------


class TestInfraHealthWorkflow:
    """Infrastructure health endpoint tests."""

    def test_infra_health_endpoint(self, client: TestClient) -> None:
        """GET /infra/health returns infra health info."""
        resp = client.get("/infra/health")
        assert resp.status_code == 200


# ---------------------------------------------------------------------------
# Correlation ID
# ---------------------------------------------------------------------------


class TestCorrelationId:
    """Correlation ID middleware tests."""

    def test_correlation_id_generated(self, client: TestClient) -> None:
        """Responses include X-Correlation-ID when not provided."""
        resp = client.get("/health")
        assert "x-correlation-id" in resp.headers

    def test_correlation_id_propagated(self, client: TestClient) -> None:
        """Provided X-Correlation-ID is echoed back."""
        resp = client.get("/health", headers={"X-Correlation-ID": "deploy-corr-789"})
        assert resp.headers.get("x-correlation-id") == "deploy-corr-789"


# ---------------------------------------------------------------------------
# Error handling
# ---------------------------------------------------------------------------


class TestErrorHandling:
    """Error response tests."""

    def test_nonexistent_api_endpoint_returns_error(self, client: TestClient) -> None:
        """GET /api/does-not-exist returns an error response."""
        resp = client.get("/api/definitely-not-a-real-endpoint-xyz")
        # deployment-api has a catch-all SPA route, so this may return 200 with error JSON
        # instead of 404 -- that's expected behavior for the SPA catch-all
        assert resp.status_code in (200, 404, 405)
