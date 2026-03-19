from __future__ import annotations

from decimal import Decimal
from enum import StrEnum

from pydantic import AwareDatetime, Field

from .._base import CanonicalBase


class MarketState(StrEnum):
    NORMAL = "normal"
    HALTED = "halted"
    AUCTION = "auction"
    PRE_MARKET = "pre_market"
    POST_MARKET = "post_market"
    CLOSED = "closed"


class MarketTrade(CanonicalBase):
    """Raw trade tick (TRADES_SCHEMA)."""

    instrument_key: str
    price: float
    size: float
    aggressor_side: int = Field(description="1=buyer 2=seller")
    trade_id: str
    ts_event: int = Field(description="nanoseconds UTC")
    ts_init: int = Field(description="nanoseconds UTC")


class BookLevel(CanonicalBase):
    price: float
    size: float


class OrderBookSnapshot5(CanonicalBase):
    """Top-5 order book snapshot."""

    instrument_key: str
    ts_event: int
    ts_init: int
    bid_price_0: float | None = None
    bid_size_0: float | None = None
    bid_price_1: float | None = None
    bid_size_1: float | None = None
    bid_price_2: float | None = None
    bid_size_2: float | None = None
    bid_price_3: float | None = None
    bid_size_3: float | None = None
    bid_price_4: float | None = None
    bid_size_4: float | None = None
    ask_price_0: float | None = None
    ask_size_0: float | None = None
    ask_price_1: float | None = None
    ask_size_1: float | None = None
    ask_price_2: float | None = None
    ask_size_2: float | None = None
    ask_price_3: float | None = None
    ask_size_3: float | None = None
    ask_price_4: float | None = None
    ask_size_4: float | None = None


class CanonicalOrderBook(CanonicalBase):
    """Normalised order book."""

    venue: str
    symbol: str
    timestamp: AwareDatetime
    bids: list[tuple[Decimal, Decimal]] = Field(description="[(price, qty), ...]")
    asks: list[tuple[Decimal, Decimal]] = Field(description="[(price, qty), ...]")
    sequence_number: int | None = None
    instrument_key: str | None = Field(default=None, description="VENUE:TYPE:SYMBOL")
    levels: int | None = None
    schema_version: str = "1.0"


class CanonicalTrade(CanonicalBase):
    """Normalised trade."""

    venue: str = Field(min_length=1)
    symbol: str = Field(min_length=1)
    trade_id: str
    timestamp: AwareDatetime
    price: Decimal = Field(gt=0)
    quantity: Decimal = Field(gt=0)
    side: str = Field(description="buy or sell")
    buyer_maker: bool | None = None
    venue_trade_id: str | None = None
    instrument_key: str | None = Field(default=None, description="VENUE:TYPE:SYMBOL")
    is_liquidation: bool | None = None
    schema_version: str = "1.0"


class CanonicalTicker(CanonicalBase):
    """Normalised spot ticker."""

    instrument_key: str
    venue: str
    timestamp: AwareDatetime
    last_price: Decimal
    bid_price: Decimal | None = None
    ask_price: Decimal | None = None
    volume_24h: Decimal | None = None
    quote_volume_24h: Decimal | None = None
    price_change_24h: Decimal | None = None
    price_change_percent_24h: Decimal | None = None
    schema_version: str = "1.0"


class CanonicalOhlcvBar(CanonicalBase):
    """Normalised OHLCV bar."""

    timestamp: AwareDatetime
    venue: str
    symbol: str
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    quote_volume: Decimal | None = None
    count: int | None = None
    vwap: Decimal | None = None


class CanonicalMarketStateEvent(CanonicalBase):
    """Normalized market state transition event."""

    timestamp: AwareDatetime
    venue: str
    instrument_key: str = Field(description="VENUE:TYPE:SYMBOL")
    state: MarketState
    previous_state: MarketState | None = None
    reason: str | None = Field(default=None, description="Halt reason or auction trigger")
    scheduled_reopen: AwareDatetime | None = None
    schema_version: str = "1.0"
