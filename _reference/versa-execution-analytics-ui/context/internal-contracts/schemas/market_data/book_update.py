"""Canonical incremental order book update schema."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class BookUpdateLevel(BaseModel):
    """Single price level update in incremental book."""

    price: Decimal
    size: Decimal
    action: Literal["add", "update", "delete"]
    count: int | None = None


class CanonicalBookUpdate(BaseModel):
    """Normalized incremental L2 order book update — all venues.

    Represents delta changes to the order book rather than full snapshots.
    Services apply these updates to maintain local book state.
    """

    instrument_key: str
    venue: str
    timestamp: datetime
    sequence: int | None = None
    is_snapshot: bool = False

    # Incremental updates
    bid_updates: list[BookUpdateLevel] = []
    ask_updates: list[BookUpdateLevel] = []

    # Optional full snapshot data (when is_snapshot=True)
    bids: list[BookUpdateLevel] | None = None
    asks: list[BookUpdateLevel] | None = None
    schema_version: str = "1.0"
