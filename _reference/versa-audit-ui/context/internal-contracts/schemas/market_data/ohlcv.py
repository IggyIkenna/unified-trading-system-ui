"""Canonical OHLCV schema."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel


class OHLCVSource(StrEnum):
    """Source of OHLCV data."""

    NATIVE_CANDLE = "NATIVE_CANDLE"
    COMPUTED_FROM_TICKS = "COMPUTED_FROM_TICKS"


class CanonicalOHLCV(BaseModel):
    """Normalized OHLCV bar — all venues."""

    instrument_key: str
    venue: str
    timestamp: datetime
    interval: str
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    vwap: Decimal | None = None
    trade_count: int | None = None
    source: OHLCVSource
    schema_version: str = "1.0"
