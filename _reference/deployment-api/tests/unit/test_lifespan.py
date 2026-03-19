"""
Unit tests for lifespan module.

Tests background task management functions: get_background_task_handles,
set_background_task_handles, and lifespan context manager startup/shutdown.
"""

import asyncio
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Mock SyncService before importing lifespan to avoid circular import via background_sync
sys.modules.setdefault("deployment_api.services", MagicMock(SyncService=MagicMock()))

import deployment_api.lifespan as lm


class TestLifespanModuleAttributes:
    """Tests for lifespan module-level attributes."""

    def test_lifespan_has_background_task_var(self):
        assert hasattr(lm, "_background_task")

    def test_lifespan_has_events_drain_task_var(self):
        assert hasattr(lm, "_events_drain_task")

    def test_lifespan_has_shutdown_event_var(self):
        assert hasattr(lm, "_shutdown_event")

    def test_lifespan_function_is_async_context_manager(self):
        """lifespan should be an async context manager function."""

        assert callable(lm.lifespan)


class TestLifespanStartup:
    """Tests for lifespan startup phase."""

    @pytest.mark.asyncio
    async def test_startup_sets_config_dir(self, tmp_path):
        (tmp_path / "configs").mkdir()

        mock_app = MagicMock()
        mock_cache_obj = AsyncMock()
        mock_cache_obj.initialize = AsyncMock()
        mock_cache_obj.shutdown = AsyncMock()
        mock_cache_mod = MagicMock()
        mock_cache_mod.cache = mock_cache_obj

        mock_drain_mod = MagicMock()
        mock_drain_mod._drain_sync_queue = AsyncMock(return_value=None)

        bg_task = asyncio.create_task(asyncio.sleep(0))
        drain_task = asyncio.create_task(asyncio.sleep(0))

        with (
            patch("deployment_api.lifespan.get_config_dir", return_value=tmp_path / "configs"),
            patch("deployment_api.lifespan.set_shutdown_event"),
            patch("deployment_api.lifespan._auto_sync_running_deployments", new=AsyncMock()),
            patch.dict(sys.modules, {"deployment_api.utils.cache": mock_cache_mod}),
            patch.dict(sys.modules, {"deployment_api.utils.deployment_events": mock_drain_mod}),
            patch("asyncio.create_task", side_effect=[bg_task, drain_task]),
            patch("deployment_api.lifespan.get_held_deployment_locks", return_value=set()),
            patch("deployment_api.lifespan.get_owner_id", return_value="owner"),
            patch("deployment_api.lifespan._storage_object_exists", return_value=False),
        ):
            async with lm.lifespan(mock_app):
                assert mock_app.state.config_dir == tmp_path / "configs"

    @pytest.mark.asyncio
    async def test_startup_initializes_cache(self):
        mock_app = MagicMock()
        mock_cache_obj = AsyncMock()
        mock_cache_obj.initialize = AsyncMock()
        mock_cache_obj.shutdown = AsyncMock()
        mock_cache_mod = MagicMock()
        mock_cache_mod.cache = mock_cache_obj

        mock_drain_mod = MagicMock()
        mock_drain_mod._drain_sync_queue = AsyncMock(return_value=None)

        bg_task = asyncio.create_task(asyncio.sleep(0))
        drain_task = asyncio.create_task(asyncio.sleep(0))

        with (
            patch("deployment_api.lifespan.get_config_dir", return_value=MagicMock()),
            patch("deployment_api.lifespan.set_shutdown_event"),
            patch("deployment_api.lifespan._auto_sync_running_deployments", new=AsyncMock()),
            patch.dict(sys.modules, {"deployment_api.utils.cache": mock_cache_mod}),
            patch.dict(sys.modules, {"deployment_api.utils.deployment_events": mock_drain_mod}),
            patch("asyncio.create_task", side_effect=[bg_task, drain_task]),
            patch("deployment_api.lifespan.get_held_deployment_locks", return_value=set()),
            patch("deployment_api.lifespan.get_owner_id", return_value="owner"),
            patch("deployment_api.lifespan._storage_object_exists", return_value=False),
        ):
            async with lm.lifespan(mock_app):
                pass

        mock_cache_obj.initialize.assert_called_once()

    @pytest.mark.asyncio
    async def test_startup_calls_set_shutdown_event(self):
        mock_app = MagicMock()
        mock_cache_obj = AsyncMock()
        mock_cache_obj.initialize = AsyncMock()
        mock_cache_obj.shutdown = AsyncMock()
        mock_cache_mod = MagicMock()
        mock_cache_mod.cache = mock_cache_obj

        mock_drain_mod = MagicMock()
        mock_drain_mod._drain_sync_queue = AsyncMock(return_value=None)

        bg_task = asyncio.create_task(asyncio.sleep(0))
        drain_task = asyncio.create_task(asyncio.sleep(0))

        with (
            patch("deployment_api.lifespan.get_config_dir", return_value=MagicMock()),
            patch("deployment_api.lifespan.set_shutdown_event") as mock_set_shutdown,
            patch("deployment_api.lifespan._auto_sync_running_deployments", new=AsyncMock()),
            patch.dict(sys.modules, {"deployment_api.utils.cache": mock_cache_mod}),
            patch.dict(sys.modules, {"deployment_api.utils.deployment_events": mock_drain_mod}),
            patch("asyncio.create_task", side_effect=[bg_task, drain_task]),
            patch("deployment_api.lifespan.get_held_deployment_locks", return_value=set()),
            patch("deployment_api.lifespan.get_owner_id", return_value="owner"),
            patch("deployment_api.lifespan._storage_object_exists", return_value=False),
        ):
            async with lm.lifespan(mock_app):
                pass

        mock_set_shutdown.assert_called_once()


class TestLifespanShutdown:
    """Tests for lifespan shutdown phase."""

    @pytest.mark.asyncio
    async def test_shutdown_calls_cache_shutdown(self):
        mock_app = MagicMock()
        mock_cache_obj = AsyncMock()
        mock_cache_obj.initialize = AsyncMock()
        mock_cache_obj.shutdown = AsyncMock()
        mock_cache_mod = MagicMock()
        mock_cache_mod.cache = mock_cache_obj

        mock_drain_mod = MagicMock()
        mock_drain_mod._drain_sync_queue = AsyncMock(return_value=None)

        bg_task = asyncio.create_task(asyncio.sleep(0))
        drain_task = asyncio.create_task(asyncio.sleep(0))

        with (
            patch("deployment_api.lifespan.get_config_dir", return_value=MagicMock()),
            patch("deployment_api.lifespan.set_shutdown_event"),
            patch("deployment_api.lifespan._auto_sync_running_deployments", new=AsyncMock()),
            patch.dict(sys.modules, {"deployment_api.utils.cache": mock_cache_mod}),
            patch.dict(sys.modules, {"deployment_api.utils.deployment_events": mock_drain_mod}),
            patch("asyncio.create_task", side_effect=[bg_task, drain_task]),
            patch("deployment_api.lifespan.get_held_deployment_locks", return_value=set()),
            patch("deployment_api.lifespan.get_owner_id", return_value="owner"),
            patch("deployment_api.lifespan._storage_object_exists", return_value=False),
        ):
            async with lm.lifespan(mock_app):
                pass

        mock_cache_obj.shutdown.assert_called_once()

    @pytest.mark.asyncio
    async def test_shutdown_handles_storage_error_gracefully(self):
        mock_app = MagicMock()
        mock_cache_obj = AsyncMock()
        mock_cache_obj.initialize = AsyncMock()
        mock_cache_obj.shutdown = AsyncMock()
        mock_cache_mod = MagicMock()
        mock_cache_mod.cache = mock_cache_obj

        mock_drain_mod = MagicMock()
        mock_drain_mod._drain_sync_queue = AsyncMock(return_value=None)

        bg_task = asyncio.create_task(asyncio.sleep(0))
        drain_task = asyncio.create_task(asyncio.sleep(0))

        with (
            patch("deployment_api.lifespan.get_config_dir", return_value=MagicMock()),
            patch("deployment_api.lifespan.set_shutdown_event"),
            patch("deployment_api.lifespan._auto_sync_running_deployments", new=AsyncMock()),
            patch.dict(sys.modules, {"deployment_api.utils.cache": mock_cache_mod}),
            patch.dict(sys.modules, {"deployment_api.utils.deployment_events": mock_drain_mod}),
            patch("asyncio.create_task", side_effect=[bg_task, drain_task]),
            patch("deployment_api.lifespan.get_held_deployment_locks", return_value={"dep-x"}),
            patch("deployment_api.lifespan.get_owner_id", return_value="owner"),
            patch(
                "deployment_api.lifespan._storage_object_exists",
                side_effect=OSError("network"),
            ),
        ):
            # Should not raise even with storage error
            async with lm.lifespan(mock_app):
                pass

    @pytest.mark.asyncio
    async def test_shutdown_releases_lock_when_owner_matches(self):
        mock_app = MagicMock()
        mock_cache_obj = AsyncMock()
        mock_cache_obj.initialize = AsyncMock()
        mock_cache_obj.shutdown = AsyncMock()
        mock_cache_mod = MagicMock()
        mock_cache_mod.cache = mock_cache_obj

        mock_drain_mod = MagicMock()
        mock_drain_mod._drain_sync_queue = AsyncMock(return_value=None)

        bg_task = asyncio.create_task(asyncio.sleep(0))
        drain_task = asyncio.create_task(asyncio.sleep(0))

        mock_delete = MagicMock()

        with (
            patch("deployment_api.lifespan.get_config_dir", return_value=MagicMock()),
            patch("deployment_api.lifespan.set_shutdown_event"),
            patch("deployment_api.lifespan._auto_sync_running_deployments", new=AsyncMock()),
            patch.dict(sys.modules, {"deployment_api.utils.cache": mock_cache_mod}),
            patch.dict(sys.modules, {"deployment_api.utils.deployment_events": mock_drain_mod}),
            patch("asyncio.create_task", side_effect=[bg_task, drain_task]),
            patch("deployment_api.lifespan.get_held_deployment_locks", return_value={"dep-1"}),
            patch("deployment_api.lifespan.get_owner_id", return_value="test-owner"),
            patch("deployment_api.lifespan._storage_object_exists", return_value=True),
            patch(
                "deployment_api.lifespan._read_storage_object_text",
                return_value='{"owner": "test-owner"}',
            ),
            patch("deployment_api.lifespan._delete_storage_object", mock_delete),
        ):
            async with lm.lifespan(mock_app):
                pass

        mock_delete.assert_called_once()
