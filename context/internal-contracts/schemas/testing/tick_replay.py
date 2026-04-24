"""Deterministic tick replay engine for integration testing.

Reads schema-validated tick fixtures and replays them as an async stream
with configurable delay and fast-forward factor for time-compressed testing.

Usage:
    from unified_internal_contracts.testing import TickReplayEngine, ScenarioConfig
    from unified_internal_contracts.modes import MockScenario

    cfg = ScenarioConfig.load(MockScenario.DELAYED_DATA)
    async for tick in TickReplayEngine().replay(scenario=cfg):
        await process_tick(tick)

Pytest fixtures are in conftest_fixtures.py (not imported here to keep this
module free of pytest as a runtime dependency).
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from pathlib import Path

from unified_internal_contracts.testing.scenario_config import ScenarioConfig

logger = logging.getLogger(__name__)

# Minimal built-in fixture for when seed data is not available.
_BUILTIN_TICK_FIXTURES: list[dict[str, object]] = [
    {
        "instrument_key": "binance:SPOT_PAIR:BTCUSDT",
        "venue": "binance",
        "symbol": "BTC-USDT",
        "bid_price": "45000.00",
        "ask_price": "45001.00",
        "last_price": "45000.50",
        "bid_size": "0.5",
        "ask_size": "1.2",
        "timestamp": "2026-01-15T10:00:00+00:00",
        "sequence": 1,
    },
    {
        "instrument_key": "binance:SPOT_PAIR:BTCUSDT",
        "venue": "binance",
        "symbol": "BTC-USDT",
        "bid_price": "45002.00",
        "ask_price": "45003.00",
        "last_price": "45002.50",
        "bid_size": "0.3",
        "ask_size": "0.8",
        "timestamp": "2026-01-15T10:00:01+00:00",
        "sequence": 2,
    },
    {
        "instrument_key": "deribit:PERPETUAL:BTCUSD",
        "venue": "deribit",
        "symbol": "BTC-PERPETUAL",
        "bid_price": "44998.00",
        "ask_price": "44999.50",
        "last_price": "44998.75",
        "bid_size": "100.0",
        "ask_size": "200.0",
        "timestamp": "2026-01-15T10:00:00.500000+00:00",
        "sequence": 1,
    },
]


class TickReplayEngine:
    """Replays tick fixtures as a deterministic async stream.

    Reads fixture data from JSON files or falls back to built-in minimal fixtures.

    Fixture JSON format mirrors CanonicalTicker fields from UAC:
        instrument_key (str): canonical VENUE:INSTRUMENT_TYPE:SYMBOL key
        venue (str): exchange/venue name
        timestamp (str): ISO-8601 with UTC offset (AwareDatetime-compatible)
        last_price (str): Decimal-compatible string
        bid_price (str | None): Decimal-compatible string
        ask_price (str | None): Decimal-compatible string
        sequence (int | None): monotonic sequence number within venue+symbol

    Args:
        fixture_path: Path to JSON fixture file. If None, uses built-in fixtures.
        time_multiplier: Speed multiplier for replay (100.0 = 100x realtime).
        venue_filter: Optional venue name to filter ticks.
        symbol_filter: Optional symbol to filter ticks (matches the ``symbol`` field).
    """

    def __init__(
        self,
        fixture_path: Path | None = None,
        time_multiplier: float = 100.0,
        venue_filter: str | None = None,
        symbol_filter: str | None = None,
    ) -> None:
        self._fixture_path = fixture_path
        self._time_multiplier = time_multiplier
        self._venue_filter = venue_filter
        self._symbol_filter = symbol_filter

    def _load_fixtures(self) -> list[dict[str, object]]:
        """Load tick fixtures from file or use built-in defaults."""
        if self._fixture_path is None or not self._fixture_path.exists():
            if self._fixture_path is not None:
                logger.warning(
                    "Fixture file not found: %s — using built-in fixtures",
                    self._fixture_path,
                )
            return _BUILTIN_TICK_FIXTURES

        with self._fixture_path.open() as f:
            data: list[dict[str, object]] = json.load(f)
        logger.info("Loaded %d ticks from %s", len(data), self._fixture_path)
        return data

    def _filter_ticks(self, ticks: list[dict[str, object]]) -> list[dict[str, object]]:
        """Apply venue and symbol filters, then sort by timestamp ascending."""
        result = ticks
        if self._venue_filter:
            result = [t for t in result if t.get("venue") == self._venue_filter]
        if self._symbol_filter:
            result = [t for t in result if t.get("symbol") == self._symbol_filter]
        return sorted(result, key=lambda t: str(t.get("timestamp", "")))  # noqa: qg-empty-fallback

    async def replay(
        self, scenario: ScenarioConfig | None = None
    ) -> AsyncIterator[dict[str, object]]:
        """Yield ticks from fixture in timestamp order.

        When ``scenario`` provides a delay_ms and fast_forward_factor, each tick
        is preceded by ``asyncio.sleep(delay_ms / fast_forward_factor / 1000)``.
        For ``delayed_data`` this compresses 1 hour of simulated delay to ~1ms.

        Yields:
            dict representing a single canonical tick.
        """
        ticks = self._filter_ticks(self._load_fixtures())
        sleep_s = 0.0
        if scenario is not None and scenario.delay_ms > 0:
            sleep_s = scenario.delay_ms / scenario.fast_forward_factor / 1000.0
        for tick in ticks:
            if sleep_s > 0:
                await asyncio.sleep(sleep_s)
            yield tick

    def replay_sync(self) -> list[dict[str, object]]:
        """Return all filtered ticks as a list (synchronous convenience method)."""
        return self._filter_ticks(self._load_fixtures())

    @property
    def fixture_path(self) -> Path | None:
        """Return the configured fixture path (None means built-in fixtures)."""
        return self._fixture_path

    @property
    def time_multiplier(self) -> float:
        """Return the replay speed multiplier."""
        return self._time_multiplier


def make_tick(
    instrument_key: str,
    venue: str,
    symbol: str,
    last_price: str,
    timestamp: datetime | None = None,
    bid_price: str | None = None,
    ask_price: str | None = None,
    sequence: int | None = None,
) -> dict[str, object]:
    """Build a single tick dict compatible with CanonicalTicker field shapes.

    Args:
        instrument_key: Canonical VENUE:INSTRUMENT_TYPE:SYMBOL key.
        venue: Exchange/venue name.
        symbol: Human-readable symbol string (e.g. "BTC-USDT").
        last_price: Last trade price as Decimal-compatible string.
        timestamp: Aware datetime; defaults to 2026-01-15T10:00:00Z if None.
        bid_price: Best bid as Decimal-compatible string.
        ask_price: Best ask as Decimal-compatible string.
        sequence: Monotonic sequence number within venue+symbol stream.

    Returns:
        dict with all provided fields, timestamp serialized to ISO-8601.
    """
    if timestamp is None:
        timestamp = datetime(2026, 1, 15, 10, 0, 0, tzinfo=UTC)

    tick: dict[str, object] = {
        "instrument_key": instrument_key,
        "venue": venue,
        "symbol": symbol,
        "last_price": last_price,
        "timestamp": timestamp.isoformat(),
    }
    if bid_price is not None:
        tick["bid_price"] = bid_price
    if ask_price is not None:
        tick["ask_price"] = ask_price
    if sequence is not None:
        tick["sequence"] = sequence
    return tick
