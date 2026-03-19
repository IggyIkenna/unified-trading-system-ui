"""
Unit tests for health_routes module.

Tests root, health_check, get_workers_status, clear_cache, and serve_spa
route handler functions with mocked dependencies.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


class TestRootRoute:
    """Tests for the / route handler."""

    @pytest.mark.asyncio
    async def test_root_returns_health_when_no_ui(self):
        with patch("deployment_api.health_routes.get_ui_dist_dir", return_value=None):
            from deployment_api.health_routes import root

            result = await root()
            assert result["status"] == "ok"
            assert "Deployment Monitoring API" in result["message"]

    @pytest.mark.asyncio
    async def test_root_returns_file_response_when_ui_exists(self, tmp_path):
        ui_dist = tmp_path / "dist"
        ui_dist.mkdir()
        (ui_dist / "index.html").write_text("<html/>")

        with patch("deployment_api.health_routes.get_ui_dist_dir", return_value=ui_dist):
            from fastapi.responses import FileResponse

            from deployment_api.health_routes import root

            result = await root()
            assert isinstance(result, FileResponse)


class TestHealthCheck:
    """Tests for the /api/health route handler."""

    @pytest.mark.asyncio
    async def test_health_check_returns_healthy(self):
        mock_fuse_status = {"active": False, "env": "development"}

        with patch(
            "deployment_api.utils.storage_facade.get_gcs_fuse_status",
            return_value=mock_fuse_status,
        ):
            from deployment_api.health_routes import health_check

            result = await health_check()
            assert result["status"] == "healthy"
            assert "version" in result

    @pytest.mark.asyncio
    async def test_health_check_includes_version(self):
        with patch(
            "deployment_api.utils.storage_facade.get_gcs_fuse_status",
            return_value={},
        ):
            from deployment_api.health_routes import health_check

            result = await health_check()
            assert "version" in result
            assert result["version"] is not None


class TestGetWorkersStatus:
    """Tests for the /api/workers route handler."""

    @pytest.mark.asyncio
    async def test_returns_active_workers(self):
        import sys

        mock_workers = {
            "dep-1": {"pid": 1234, "alive": True, "exitcode": None},
        }
        mock_dw = MagicMock()
        mock_dw.get_active_workers.return_value = mock_workers
        sys.modules["deployment_api.workers.deployment_worker"] = mock_dw

        from deployment_api.health_routes import get_workers_status

        result = await get_workers_status()
        assert result["active_workers"] == 1
        assert result["workers"] == mock_workers

    @pytest.mark.asyncio
    async def test_returns_empty_on_error(self):
        import sys

        mock_dw = MagicMock()
        mock_dw.get_active_workers.side_effect = RuntimeError("worker crashed")
        sys.modules["deployment_api.workers.deployment_worker"] = mock_dw

        from deployment_api.health_routes import get_workers_status

        result = await get_workers_status()
        assert result["active_workers"] == 0
        assert "error" in result

    @pytest.mark.asyncio
    async def test_zero_workers_when_empty(self):
        import sys

        mock_dw = MagicMock()
        mock_dw.get_active_workers.return_value = {}
        sys.modules["deployment_api.workers.deployment_worker"] = mock_dw

        from deployment_api.health_routes import get_workers_status

        result = await get_workers_status()
        assert result["active_workers"] == 0


class TestClearCache:
    """Tests for the /api/cache/clear route handler."""

    @pytest.mark.asyncio
    async def test_clear_cache_success(self):
        import sys

        mock_cache_mod = MagicMock()
        mock_cache_obj = MagicMock()
        mock_cache_obj.clear_pattern = AsyncMock(return_value=5)
        mock_cache_mod.cache = mock_cache_obj

        # Also mock route imports to avoid errors
        mock_svc_status = MagicMock()
        mock_svc_status._clear_gcs_cache = MagicMock()
        mock_data_cache = MagicMock()
        mock_data_cache.clear_cache = MagicMock(return_value=0)

        with (
            patch.dict(
                sys.modules,
                {
                    "deployment_api.utils.cache": mock_cache_mod,
                    "deployment_api.routes.service_status": mock_svc_status,
                    "deployment_api.utils.data_status_cache": mock_data_cache,
                },
            ),
        ):
            from deployment_api.health_routes import clear_cache

            result = await clear_cache()
        assert result["status"] == "success"
        assert result["cleared"] >= 0

    @pytest.mark.asyncio
    async def test_clear_cache_handles_error(self):
        import sys

        mock_cache_mod = MagicMock()
        mock_cache_obj = MagicMock()
        mock_cache_obj.clear_pattern = AsyncMock(side_effect=RuntimeError("cache error"))
        mock_cache_mod.cache = mock_cache_obj
        sys.modules["deployment_api.utils.cache"] = mock_cache_mod

        from deployment_api.health_routes import clear_cache

        result = await clear_cache()
        assert result["status"] == "error"
        assert "cache error" in result["error"]

    @pytest.mark.asyncio
    async def test_clear_cache_counts_all_patterns(self):
        import sys

        mock_cache_mod = MagicMock()
        mock_cache_obj = MagicMock()
        mock_cache_obj.clear_pattern = AsyncMock(return_value=2)
        mock_cache_mod.cache = mock_cache_obj

        mock_svc_status = MagicMock()
        mock_svc_status._clear_gcs_cache = MagicMock()
        mock_data_cache = MagicMock()
        mock_data_cache.clear_cache = MagicMock(return_value=0)

        with patch.dict(
            sys.modules,
            {
                "deployment_api.utils.cache": mock_cache_mod,
                "deployment_api.routes.service_status": mock_svc_status,
                "deployment_api.utils.data_status_cache": mock_data_cache,
            },
        ):
            from deployment_api.health_routes import clear_cache

            result = await clear_cache()
        # 6 patterns x 2 each = 12 (plus any from turbo cache)
        assert result["cleared"] >= 12


class TestServeSpa:
    """Tests for the catch-all SPA route."""

    @pytest.mark.asyncio
    async def test_returns_404_dict_when_no_ui(self):
        with patch("deployment_api.health_routes.get_ui_dist_dir", return_value=None):
            from deployment_api.health_routes import serve_spa

            result = await serve_spa("some/path")
            assert "error" in result
            assert result["path"] == "some/path"

    @pytest.mark.asyncio
    async def test_serves_existing_static_file(self, tmp_path):
        ui_dist = tmp_path / "dist"
        ui_dist.mkdir()
        (ui_dist / "index.html").write_text("<html/>")
        static_file = ui_dist / "logo.png"
        static_file.write_bytes(b"PNG")

        with patch("deployment_api.health_routes.get_ui_dist_dir", return_value=ui_dist):
            from fastapi.responses import FileResponse

            from deployment_api.health_routes import serve_spa

            result = await serve_spa("logo.png")
            assert isinstance(result, FileResponse)

    @pytest.mark.asyncio
    async def test_serves_index_for_spa_routes(self, tmp_path):
        ui_dist = tmp_path / "dist"
        ui_dist.mkdir()
        (ui_dist / "index.html").write_text("<html/>")

        with patch("deployment_api.health_routes.get_ui_dist_dir", return_value=ui_dist):
            from fastapi.responses import FileResponse

            from deployment_api.health_routes import serve_spa

            result = await serve_spa("history/2024")
            assert isinstance(result, FileResponse)


class TestHealthDataFreshness:
    """Health check must return expected fields."""

    @pytest.mark.asyncio
    async def test_health_data_freshness_is_dict(self):
        with patch(
            "deployment_api.utils.storage_facade.get_gcs_fuse_status",
            return_value={},
        ):
            from deployment_api.health_routes import health_check

            result = await health_check()
            assert isinstance(result, dict)
            assert result["status"] == "healthy"

    @pytest.mark.asyncio
    async def test_health_data_freshness_fields(self):
        with patch(
            "deployment_api.utils.storage_facade.get_gcs_fuse_status",
            return_value={"mounted": True, "path": "/mnt/gcs"},
        ):
            from deployment_api.health_routes import health_check

            result = await health_check()
            assert "gcs_fuse" in result
            assert isinstance(result["gcs_fuse"], dict)


class TestSimpleHealthDataFreshness:
    """Tests for data_freshness on the /health liveness probe."""

    @pytest.mark.asyncio
    async def test_health_includes_data_freshness(self):
        from deployment_api.health_routes import health

        result = await health()
        assert "data_freshness" in result

    @pytest.mark.asyncio
    async def test_health_data_freshness_is_dict(self):
        from deployment_api.health_routes import health

        result = await health()
        freshness = result.get("data_freshness")
        assert isinstance(freshness, dict), f"data_freshness must be dict, got {type(freshness)}"

    @pytest.mark.asyncio
    async def test_health_data_freshness_fields(self):
        from deployment_api.health_routes import health

        result = await health()
        freshness = result["data_freshness"]
        assert isinstance(freshness.get("last_processed_date"), str)
        assert isinstance(freshness.get("stale"), bool)
