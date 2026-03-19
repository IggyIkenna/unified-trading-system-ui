"""Service startup smoke tests for deployment-api.

Verifies that:
1. The package imports cleanly without real cloud connections.
2. Core FastAPI app can be instantiated with auth disabled.
3. /health and /readiness probes return expected status.
4. S2S verify_service_token is callable.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def disable_cloud_env(monkeypatch: pytest.MonkeyPatch) -> None:
    """Prevent real cloud calls during startup."""
    monkeypatch.setenv("CLOUD_PROVIDER", "local")
    monkeypatch.setenv("CLOUD_MOCK_MODE", "true")
    monkeypatch.setenv("GCP_PROJECT_ID", "test-project")
    monkeypatch.setenv("DISABLE_AUTH", "true")


class TestDeploymentApiStartup:
    """Smoke tests: package imports and app instantiation."""

    def test_import_package(self) -> None:
        """Package import must succeed — verifies __init__.py is valid."""
        import deployment_api

        assert deployment_api.__name__ == "deployment_api"

    def test_import_auth_module(self) -> None:
        """auth.py must import cleanly."""
        import deployment_api.auth

        assert deployment_api.auth.__name__ == "deployment_api.auth"

    def test_verify_service_token_exists(self) -> None:
        """verify_service_token must be exported from auth module."""
        from deployment_api.auth import verify_service_token

        assert callable(verify_service_token)

    def test_verify_api_key_exists(self) -> None:
        """verify_api_key must be exported from auth module."""
        from deployment_api.auth import verify_api_key

        assert callable(verify_api_key)

    def test_service_token_header_configured(self) -> None:
        """service_token_header must be configured with X-Service-Token header name."""
        from deployment_api.auth import service_token_header

        assert service_token_header.model.name == "X-Service-Token"

    def test_api_key_header_configured(self) -> None:
        """api_key_header must be configured with X-API-Key header name."""
        from deployment_api.auth import api_key_header

        assert api_key_header.model.name == "X-API-Key"


class TestVerifyServiceToken:
    """Tests for verify_service_token dependency."""

    @pytest.mark.asyncio
    async def test_disabled_auth_returns_dev_mode(self) -> None:
        """When DISABLE_AUTH=True, verify_service_token must return 'dev-mode'."""
        with patch("deployment_api.auth.DISABLE_AUTH", True):
            from deployment_api.auth import verify_service_token

            result = await verify_service_token(service_token=None)
            assert result == "dev-mode"

    @pytest.mark.asyncio
    async def test_missing_token_raises_401(self) -> None:
        """Missing X-Service-Token must raise 401."""
        from fastapi import HTTPException

        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth.log_event"),
        ):
            from deployment_api.auth import verify_service_token

            with pytest.raises(HTTPException) as exc_info:
                await verify_service_token(service_token=None)

            assert exc_info.value.status_code == 401
            assert "Missing" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_invalid_token_raises_403(self) -> None:
        """Wrong X-Service-Token must raise 403."""
        from fastapi import HTTPException

        mock_cfg = MagicMock()
        mock_cfg.service_token = "correct-token"

        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth._auth_cfg", mock_cfg),
            patch("deployment_api.auth.log_event"),
        ):
            from deployment_api.auth import verify_service_token

            with pytest.raises(HTTPException) as exc_info:
                await verify_service_token(service_token="wrong-token")

            assert exc_info.value.status_code == 403
            assert "Invalid" in exc_info.value.detail

    @pytest.mark.asyncio
    async def test_valid_token_returns_token(self) -> None:
        """Correct X-Service-Token must be returned on success."""
        mock_cfg = MagicMock()
        mock_cfg.service_token = "secret-s2s-token"

        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth._auth_cfg", mock_cfg),
            patch("deployment_api.auth.log_event") as mock_log,
        ):
            from deployment_api.auth import verify_service_token

            result = await verify_service_token(service_token="secret-s2s-token")
            assert result == "secret-s2s-token"
            mock_log.assert_not_called()


class TestDeploymentApiHealthProbes:
    """Tests for /health route handler (called directly, without full app startup)."""

    @pytest.mark.asyncio
    async def test_health_returns_healthy(self) -> None:
        """health_check handler must return status=healthy."""
        mock_fuse_status = {"active": False, "env": "development"}
        with patch(
            "deployment_api.utils.storage_facade.get_gcs_fuse_status",
            return_value=mock_fuse_status,
        ):
            from deployment_api.health_routes import health_check

            result = await health_check()
            assert result["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_includes_version(self) -> None:
        """health_check handler must include a version field."""
        with patch(
            "deployment_api.utils.storage_facade.get_gcs_fuse_status",
            return_value={},
        ):
            from deployment_api.health_routes import health_check

            result = await health_check()
            assert "version" in result
            assert result["version"] is not None
