"""
Unit tests for utils/deployment_events module.

Tests SSE queue management, notify functions, sync queue,
and drain task behavior.
"""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

import deployment_api.utils.deployment_events as ev


class TestGetSyncQueue:
    """Tests for _get_sync_queue function."""

    def test_returns_queue_instance(self):
        # Reset module state first
        ev._sync_queue = None
        result = ev._get_sync_queue()
        # May return None if no event loop, or an asyncio.Queue
        assert result is None or isinstance(result, asyncio.Queue)

    @pytest.mark.asyncio
    async def test_returns_queue_with_running_loop(self):
        ev._sync_queue = None
        q = ev._get_sync_queue()
        if q is not None:
            assert isinstance(q, asyncio.Queue)

    def test_returns_same_instance_on_second_call(self):
        ev._sync_queue = None
        q1 = ev._get_sync_queue()
        q2 = ev._get_sync_queue()
        assert q1 is q2


class TestBroadcast:
    """Tests for _broadcast function."""

    @pytest.mark.asyncio
    async def test_broadcast_to_no_subscribers(self):
        # No subscribers for deployment - should not raise
        await ev._broadcast("dep-no-sub")

    @pytest.mark.asyncio
    async def test_broadcast_puts_updated_message(self):
        q = asyncio.Queue()
        ev._sse_queues["dep-broadcast"] = {q}
        try:
            await ev._broadcast("dep-broadcast")
            msg = await asyncio.wait_for(q.get(), timeout=1.0)
            assert msg == "updated"
        finally:
            ev._sse_queues.pop("dep-broadcast", None)

    @pytest.mark.asyncio
    async def test_broadcast_multiple_queues(self):
        q1 = asyncio.Queue()
        q2 = asyncio.Queue()
        ev._sse_queues["dep-multi"] = {q1, q2}
        try:
            await ev._broadcast("dep-multi")
            msg1 = await asyncio.wait_for(q1.get(), timeout=1.0)
            msg2 = await asyncio.wait_for(q2.get(), timeout=1.0)
            assert msg1 == "updated"
            assert msg2 == "updated"
        finally:
            ev._sse_queues.pop("dep-multi", None)


class TestNotifyDeploymentUpdated:
    """Tests for notify_deployment_updated function."""

    @pytest.mark.asyncio
    async def test_notifies_broadcast(self):
        q = asyncio.Queue()
        ev._sse_queues["dep-notify"] = {q}

        try:
            with patch(
                "deployment_api.routes.deployment_caching.invalidate_deployment_state_cache",
                new=AsyncMock(),
            ):
                await ev.notify_deployment_updated("dep-notify")
            msg = await asyncio.wait_for(q.get(), timeout=1.0)
            assert msg == "updated"
        finally:
            ev._sse_queues.pop("dep-notify", None)

    @pytest.mark.asyncio
    async def test_handles_cache_error_gracefully(self):
        with patch(
            "deployment_api.routes.deployment_caching.invalidate_deployment_state_cache",
            new=AsyncMock(side_effect=RuntimeError("cache down")),
        ):
            # Should not raise
            await ev.notify_deployment_updated("dep-cache-fail")


class TestNotifyDeploymentUpdatedSync:
    """Tests for notify_deployment_updated_sync function."""

    def test_puts_to_sync_queue_when_available(self):
        mock_q = MagicMock()
        ev._sync_queue = mock_q

        # unified_cloud_interface.get_queue_client is lazily imported inside the function
        mock_uci = MagicMock()
        mock_uci.get_queue_client = MagicMock(side_effect=RuntimeError("no queue"))

        with patch.dict(
            __import__("sys").modules,
            {"unified_cloud_interface": mock_uci},
        ):
            ev.notify_deployment_updated_sync("dep-sync-1")

        mock_q.put_nowait.assert_called_once_with("dep-sync-1")
        ev._sync_queue = None

    def test_handles_none_sync_queue(self):
        ev._sync_queue = None
        with patch.dict(
            __import__("sys").modules,
            {
                "unified_cloud_interface": MagicMock(
                    get_queue_client=MagicMock(side_effect=RuntimeError("no queue"))
                )
            },
        ):
            # Should not raise
            ev.notify_deployment_updated_sync("dep-sync-null")

    def test_handles_queue_client_error(self):
        mock_q = MagicMock()
        ev._sync_queue = mock_q

        with patch.dict(
            __import__("sys").modules,
            {
                "unified_cloud_interface": MagicMock(
                    get_queue_client=MagicMock(side_effect=RuntimeError)
                )
            },
        ):
            # Should not raise
            ev.notify_deployment_updated_sync("dep-sync-err")

        ev._sync_queue = None


class TestSubscribe:
    """Tests for subscribe async generator."""

    @pytest.mark.asyncio
    async def test_subscribe_yields_message(self):
        deployment_id = "dep-subscribe-test"
        received = []

        async def consumer():
            async for msg in ev.subscribe(deployment_id):
                received.append(msg)
                break

        consumer_task = asyncio.create_task(consumer())
        await asyncio.sleep(0.05)  # Let the consumer start and register

        await ev._broadcast(deployment_id)
        await asyncio.wait_for(consumer_task, timeout=2.0)

        assert received == ["updated"]

    @pytest.mark.asyncio
    async def test_subscribe_cleans_up_on_cancel(self):
        deployment_id = "dep-subscribe-cancel"

        async def consumer():
            async for _msg in ev.subscribe(deployment_id):
                pass

        consumer_task = asyncio.create_task(consumer())
        await asyncio.sleep(0.05)  # Let it register

        consumer_task.cancel()
        try:
            await asyncio.wait_for(consumer_task, timeout=1.0)
        except (TimeoutError, asyncio.CancelledError):
            pass

        # Queue should be cleaned up
        assert deployment_id not in ev._sse_queues


class TestDrainSyncQueue:
    """Tests for _drain_sync_queue function."""

    @pytest.mark.asyncio
    async def test_drain_processes_items_and_broadcasts(self):
        deployment_id = "dep-drain-test"
        q = asyncio.Queue()
        ev._sync_queue = q

        # Put an item into the sync queue
        q.put_nowait(deployment_id)

        # Track broadcasts
        broadcast_called = []

        async def mock_broadcast(dep_id: str):
            broadcast_called.append(dep_id)

        mock_cache_mod = MagicMock()
        mock_cache_mod.invalidate_deployment_state_cache = AsyncMock()

        with (
            patch.object(ev, "_broadcast", mock_broadcast),
            patch(
                "deployment_api.routes.deployment_caching.invalidate_deployment_state_cache",
                new=AsyncMock(),
            ),
        ):
            drain_task = asyncio.create_task(ev.drain_sync_queue())
            await asyncio.sleep(0.1)
            drain_task.cancel()
            try:
                await asyncio.wait_for(drain_task, timeout=1.0)
            except (TimeoutError, asyncio.CancelledError):
                pass

        assert deployment_id in broadcast_called
        ev._sync_queue = None
