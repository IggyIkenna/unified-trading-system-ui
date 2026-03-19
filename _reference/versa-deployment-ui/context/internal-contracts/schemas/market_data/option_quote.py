"""Canonical option quote schema."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class CanonicalOptionQuote(BaseModel):
    """Normalized option quote — all venues.

    Represents a single option quote with bid/ask prices, Greeks, and implied volatility.
    """

    instrument_key: str
    venue: str
    timestamp: datetime
    underlying_symbol: str
    expiry: datetime
    strike: Decimal
    put_call: Literal["put", "call"]

    # Pricing
    bid: Decimal | None = None
    ask: Decimal | None = None
    bid_size: Decimal | None = None
    ask_size: Decimal | None = None
    last: Decimal | None = None
    last_size: Decimal | None = None
    mark_price: Decimal | None = None

    # Greeks
    delta: Decimal | None = None
    gamma: Decimal | None = None
    theta: Decimal | None = None
    vega: Decimal | None = None
    rho: Decimal | None = None

    # Volatility
    implied_volatility: Decimal | None = None

    # Volume and interest
    volume: Decimal | None = None
    open_interest: Decimal | None = None

    # Underlying reference
    underlying_price: Decimal | None = None
    schema_version: str = "1.0"
