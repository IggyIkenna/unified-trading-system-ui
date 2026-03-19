"""Order book snapshot schema for market-data-api.

This is the canonical domain schema for real-time order book snapshots
served by the market-data-api SSE service.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class OrderBookSnapshot:
    """A point-in-time snapshot of an order book for a single instrument.

    Attributes:
        symbol: Instrument symbol (e.g. "BTCUSDT").
        bids: List of (price, quantity) tuples, best bid first.
        asks: List of (price, quantity) tuples, best ask first.
        timestamp: UTC timestamp of the snapshot.
        venue: Exchange or data source name.
        spread_bps: Bid-ask spread in basis points.
    """

    symbol: str
    bids: list[tuple[float, float]]
    asks: list[tuple[float, float]]
    timestamp: datetime
    venue: str
    spread_bps: float = field(default=0.0)
