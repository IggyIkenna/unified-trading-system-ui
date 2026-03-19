"""
Unit tests for background_sync module.

Tests the SyncService-based background_sync orchestrator including
get_held_deployment_locks, set_shutdown_event, get_owner_id,
and _set_owner_id.
"""

import asyncio
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Mock SyncService before importing background_sync to avoid circular import
# (background_sync imports from deployment_api.services which has a circular dep)
_mock_sync_service_cls = MagicMock()
sys.modules.setdefault("deployment_api.services", MagicMock(SyncService=_mock_sync_service_cls))

import deployment_api.background_sync as bsync


class TestGetHeldDeploymentLocks:
    """Tests for get_held_deployment_locks function."""

    def test_returns_empty_set_when_no_sync_service(self):
        with patch.object(bsync, "_sync_service", None):
            result = bsync.get_held_deployment_locks()
            assert result == set()

    def test_returns_locks_from_sync_service(self):
        mock_service = MagicMock()
        mock_service.get_held_deployment_locks.return_value = {"dep-1", "dep-2"}
        with patch.object(bsync, "_sync_service", mock_service):
            result = bsync.get_held_deployment_locks()
            assert result == {"dep-1", "dep-2"}


class TestSetShutdownEvent:
    """Tests for set_shutdown_event function."""

    def test_sets_shutdown_event(self):
        original = bsync._shutdown_event
        try:
            event = asyncio.Event()
            bsync.set_shutdown_event(event)
            assert bsync._shutdown_event is event
        finally:
            bsync._shutdown_event = original


class TestGetOwnerIdFromSyncService:
    """Tests for get_owner_id function."""

    def test_returns_empty_string_when_no_sync_service(self):
        with patch.object(bsync, "_sync_service", None):
            result = bsync.get_owner_id()
            assert result == ""

    def test_returns_owner_id_from_sync_service(self):
        mock_service = MagicMock()
        mock_service.state_manager.owner_id = "host:123:abc"
        with patch.object(bsync, "_sync_service", mock_service):
            result = bsync.get_owner_id()
            assert result == "host:123:abc"


class TestSetOwnerIdStore:
    """Tests for _set_owner_id function."""

    def test_sets_owner_id_in_store(self):
        original = bsync._owner_id_store[0]
        try:
            bsync._set_owner_id("new-owner-id")
            assert bsync._owner_id_store[0] == "new-owner-id"
        finally:
            bsync._owner_id_store[0] = original

    def test_set_and_read_owner_id(self):
        original = bsync._owner_id_store[0]
        try:
            bsync._set_owner_id("test-owner-123")
            assert bsync._owner_id_store[0] == "test-owner-123"
        finally:
            bsync._owner_id_store[0] = original


class TestAutoSyncRunningDeploymentsShutdown:
    """Tests for _auto_sync_running_deployments coroutine - shutdown path."""

    @pytest.mark.asyncio
    async def test_exits_immediately_when_shutdown_set(self):
        """Should exit loop when shutdown event is already set."""
        shutdown_event = asyncio.Event()
        shutdown_event.set()

        mock_service = MagicMock()
        mock_service.state_manager.owner_id = "test-owner"
        mock_service.sync_deployments.return_value = (0, 0)

        with (
            patch("deployment_api.background_sync.SyncService", return_value=mock_service),
            patch.object(bsync, "_shutdown_event", shutdown_event),
            patch.object(bsync, "_sync_service", None),
        ):
            # Should return quickly since shutdown_event is already set
            task = asyncio.create_task(bsync._auto_sync_running_deployments())
            try:
                await asyncio.wait_for(task, timeout=1.0)
            except TimeoutError:
                task.cancel()
                pytest.fail("Task should have exited when shutdown event is set")

    @pytest.mark.asyncio
    async def test_cancelled_error_exits_cleanly(self):
        """Task should exit cleanly on CancelledError."""
        shutdown_event = asyncio.Event()

        mock_service = MagicMock()
        mock_service.state_manager.owner_id = "test-owner"
        mock_service.sync_deployments.return_value = (0, 0)

        with (
            patch("deployment_api.background_sync.SyncService", return_value=mock_service),
            patch.object(bsync, "_shutdown_event", shutdown_event),
            patch.object(bsync, "_sync_service", None),
        ):
            task = asyncio.create_task(bsync._auto_sync_running_deployments())
            await asyncio.sleep(0.05)
            task.cancel()
            try:
                await task
            except asyncio.CancelledError:
                pass  # Expected

    @pytest.mark.asyncio
    async def test_first_run_delay_then_shutdown(self):
        """Verifies first_run sleeps briefly before the loop can check shutdown."""
        shutdown_event = asyncio.Event()

        mock_service = MagicMock()
        mock_service.state_manager.owner_id = "test-owner"
        mock_service.sync_deployments.return_value = (0, 0)
        mock_service.cleanup_state_ttl.return_value = 0

        with (
            patch("deployment_api.background_sync.SyncService", return_value=mock_service),
            patch.object(bsync, "_shutdown_event", shutdown_event),
            patch.object(bsync, "_sync_service", None),
            patch("deployment_api.background_sync.asyncio.sleep", new=AsyncMock()) as mock_sleep,
        ):
            # Set shutdown immediately after first sleep
            async def set_after_sleep(secs):
                shutdown_event.set()

            mock_sleep.side_effect = set_after_sleep

            task = asyncio.create_task(bsync._auto_sync_running_deployments())
            try:
                await asyncio.wait_for(task, timeout=2.0)
            except TimeoutError:
                task.cancel()
                pytest.fail("Task should have exited")


class TestAutoSyncRunLoopBody:
    """Tests for _auto_sync_running_deployments loop body execution."""

    @pytest.mark.asyncio
    async def test_sync_ops_executed_and_stops(self):
        shutdown_event = asyncio.Event()

        mock_service = MagicMock()
        mock_service.sync_deployments.return_value = (2, 3)
        mock_service.cleanup_state_ttl.return_value = 0
        mock_service.state_manager.owner_id = "test-owner"

        call_count = 0

        async def controlled_sleep(secs):
            nonlocal call_count
            call_count += 1
            if call_count >= 2:
                shutdown_event.set()

        with (
            patch("deployment_api.background_sync.SyncService", return_value=mock_service),
            patch.object(bsync, "_shutdown_event", shutdown_event),
            patch.object(bsync, "_sync_service", None),
            patch(
                "deployment_api.background_sync.asyncio.sleep",
                new=AsyncMock(side_effect=controlled_sleep),
            ),
        ):
            task = asyncio.create_task(bsync._auto_sync_running_deployments())
            try:
                await asyncio.wait_for(task, timeout=3.0)
            except TimeoutError:
                task.cancel()
                pytest.fail("Task should have exited")

    @pytest.mark.asyncio
    async def test_oserror_handled_gracefully(self):
        shutdown_event = asyncio.Event()

        mock_service = MagicMock()
        mock_service.sync_deployments.side_effect = OSError("connection failed")
        mock_service.state_manager.owner_id = "test-owner"

        call_count = 0

        async def controlled_sleep(secs):
            nonlocal call_count
            call_count += 1
            if call_count >= 2:
                shutdown_event.set()

        with (
            patch("deployment_api.background_sync.SyncService", return_value=mock_service),
            patch.object(bsync, "_shutdown_event", shutdown_event),
            patch.object(bsync, "_sync_service", None),
            patch(
                "deployment_api.background_sync.asyncio.sleep",
                new=AsyncMock(side_effect=controlled_sleep),
            ),
        ):
            task = asyncio.create_task(bsync._auto_sync_running_deployments())
            try:
                await asyncio.wait_for(task, timeout=3.0)
            except TimeoutError:
                task.cancel()
                pytest.fail("Task should have exited after OSError handling")


class TestModuleLevelConstants:
    """Tests for module-level constant exports."""

    def test_project_id_exported(self):
        assert hasattr(bsync, "PROJECT_ID")

    def test_state_bucket_exported(self):
        assert hasattr(bsync, "STATE_BUCKET")

    def test_owner_id_store_initialized(self):
        assert isinstance(bsync._owner_id_store, list)
        assert len(bsync._owner_id_store) == 1
