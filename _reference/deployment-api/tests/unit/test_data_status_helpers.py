"""
Unit tests for data_status_helpers module.

Tests cover _bucket helper and verify the CLI wrapper structure.
"""

from unittest.mock import AsyncMock, patch

import pytest


class TestBucketHelper:
    """Tests for _bucket function."""

    def test_bucket_name_format(self):
        from deployment_api.routes import data_status_helpers

        with patch.object(data_status_helpers, "_pid", "my-project-123"):
            bucket_name = data_status_helpers._bucket("instruments-store", "CEFI")
            assert bucket_name == "instruments-store-cefi-my-project-123"

    def test_bucket_lowercases_category(self):
        from deployment_api.routes import data_status_helpers

        with patch.object(data_status_helpers, "_pid", "proj"):
            bucket_name = data_status_helpers._bucket("market-data", "TRADFI")
            assert "tradfi" in bucket_name
            assert "TRADFI" not in bucket_name

    def test_bucket_includes_prefix_and_project(self):
        from deployment_api.routes import data_status_helpers

        with patch.object(data_status_helpers, "_pid", "test-project"):
            bucket_name = data_status_helpers._bucket("my-prefix", "DEFI")
            assert bucket_name.startswith("my-prefix-defi-")
            assert bucket_name.endswith("test-project")


class TestRunDataStatusCli:
    """Tests for _run_data_status_cli (via mocked HTTP client)."""

    @pytest.mark.asyncio
    async def test_successful_cli_returns_dict(self):
        from deployment_api.routes.data_status_helpers import _run_data_status_cli

        expected = {"completion_pct": 95.0, "service": "instruments-service"}

        with patch(
            "deployment_api.routes.data_status_helpers._ds_client.get_data_status",
            new=AsyncMock(return_value=expected),
        ):
            result = await _run_data_status_cli(
                service="instruments-service",
                start_date="2024-01-01",
                end_date="2024-01-31",
            )
        assert result["completion_pct"] == 95.0

    @pytest.mark.asyncio
    async def test_failed_cli_raises_http_exception(self):
        from fastapi import HTTPException

        from deployment_api.routes.data_status_helpers import _run_data_status_cli

        with (
            patch(
                "deployment_api.routes.data_status_helpers._ds_client.get_data_status",
                new=AsyncMock(side_effect=RuntimeError("connection refused")),
            ),
            pytest.raises(HTTPException) as exc_info,
        ):
            await _run_data_status_cli(
                service="instruments-service",
                start_date="2024-01-01",
                end_date="2024-01-31",
            )
        assert exc_info.value.status_code == 500

    @pytest.mark.asyncio
    async def test_invalid_json_returns_raw(self):
        from deployment_api.routes.data_status_helpers import _run_data_status_cli

        with patch(
            "deployment_api.routes.data_status_helpers._ds_client.get_data_status",
            new=AsyncMock(return_value={"raw": "data"}),
        ):
            result = await _run_data_status_cli(
                service="instruments-service",
                start_date="2024-01-01",
                end_date="2024-01-31",
            )
        assert isinstance(result, dict)
