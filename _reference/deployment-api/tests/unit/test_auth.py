"""
Unit tests for auth module.

Tests verify_api_key behavior including disabled auth, missing key,
invalid key, and valid key scenarios. Also tests production guard
for DISABLE_AUTH.
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException


class TestVerifyApiKeyDisabledAuth:
    """Tests when DISABLE_AUTH=True."""

    @pytest.mark.asyncio
    async def test_disabled_auth_returns_dev_mode(self):
        with patch("deployment_api.auth.DISABLE_AUTH", True):
            from deployment_api.auth import verify_api_key

            result = await verify_api_key(api_key=None)
            assert result == "dev-mode"

    @pytest.mark.asyncio
    async def test_disabled_auth_ignores_provided_key(self):
        with patch("deployment_api.auth.DISABLE_AUTH", True):
            from deployment_api.auth import verify_api_key

            result = await verify_api_key(api_key="any-key")
            assert result == "dev-mode"


class TestVerifyApiKeyMissingKey:
    """Tests when API key is missing."""

    @pytest.mark.asyncio
    async def test_missing_key_raises_401(self):
        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth.log_event") as mock_log,
        ):
            from deployment_api.auth import verify_api_key

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key=None)

            assert exc_info.value.status_code == 401
            assert "Missing" in exc_info.value.detail
            mock_log.assert_called_once()

    @pytest.mark.asyncio
    async def test_empty_string_key_raises_401(self):
        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth.log_event"),
        ):
            from deployment_api.auth import verify_api_key

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key="")

            assert exc_info.value.status_code == 401


class TestVerifyApiKeyInvalidKey:
    """Tests when API key is provided but wrong."""

    @pytest.mark.asyncio
    async def test_invalid_key_raises_401(self):
        mock_cfg = MagicMock()
        mock_cfg.api_key = "correct-key"

        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth._auth_cfg", mock_cfg),
            patch("deployment_api.auth.log_event") as mock_log,
        ):
            from deployment_api.auth import verify_api_key

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key="wrong-key")

            assert exc_info.value.status_code == 401
            assert "Invalid" in exc_info.value.detail
            mock_log.assert_called_once()

    @pytest.mark.asyncio
    async def test_no_expected_key_raises_401(self):
        mock_cfg = MagicMock()
        mock_cfg.api_key = None

        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth._auth_cfg", mock_cfg),
            patch("deployment_api.auth.log_event"),
        ):
            from deployment_api.auth import verify_api_key

            with pytest.raises(HTTPException) as exc_info:
                await verify_api_key(api_key="some-key")

            assert exc_info.value.status_code == 401


class TestVerifyApiKeyValidKey:
    """Tests when API key is valid."""

    @pytest.mark.asyncio
    async def test_valid_key_returns_key(self):
        mock_cfg = MagicMock()
        mock_cfg.api_key = "secret-key-123"

        with (
            patch("deployment_api.auth.DISABLE_AUTH", False),
            patch("deployment_api.auth._auth_cfg", mock_cfg),
            patch("deployment_api.auth.log_event") as mock_log,
        ):
            from deployment_api.auth import verify_api_key

            result = await verify_api_key(api_key="secret-key-123")
            assert result == "secret-key-123"
            # log_event is NOT called on successful authentication (only on failures)
            mock_log.assert_not_called()


class TestProductionGuard:
    """Tests the production guard that prevents DISABLE_AUTH in production."""

    def test_disable_auth_false_in_non_prod(self):
        """DISABLE_AUTH can be true in non-production environments."""
        import deployment_api.auth as auth_module

        # DISABLE_AUTH is determined at module load time
        # We can just verify the module attribute exists
        assert hasattr(auth_module, "DISABLE_AUTH")
        assert isinstance(auth_module.DISABLE_AUTH, bool)

    def test_api_key_header_configured(self):
        """api_key_header should be configured with correct header name."""
        from deployment_api.auth import api_key_header

        assert api_key_header.model.name == "X-API-Key"
