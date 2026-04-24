"""Pytest fixtures for tick replay testing.

Register in conftest.py:
    pytest_plugins = ["unified_internal_contracts.testing.conftest_fixtures"]
"""

from __future__ import annotations

import pytest

from unified_internal_contracts.testing.tick_replay import TickReplayEngine


@pytest.fixture
def tick_replay_engine() -> TickReplayEngine:
    """Pytest fixture providing a TickReplayEngine with built-in fixtures."""
    return TickReplayEngine()


@pytest.fixture
def binance_ticks() -> list[dict[str, object]]:
    """Pytest fixture returning pre-filtered Binance BTC-USDT ticks."""
    engine = TickReplayEngine(venue_filter="binance", symbol_filter="BTC-USDT")
    return engine.replay_sync()
