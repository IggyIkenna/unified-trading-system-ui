"""Market-data-processing candle schema — market state and data type enumerations.

These enums are the SSOT for market-state classification and data-type routing
used by market-data-processing-service adapters, calculators, and writers.

MarketState is written into every candle row as the ``market_state`` column;
downstream services (features-delta-one, etc.) filter out non-NORMAL candles.

DataType drives schema selection (SCHEMA_BY_DATA_TYPE in models.py) and GCS
path construction.
"""

from __future__ import annotations

from enum import StrEnum


class MarketState(StrEnum):
    """Classification of the market session for a candle time window."""

    NORMAL = "normal"
    HALTED = "halted"
    AUCTION = "auction"
    PRE_MARKET = "pre_market"
    POST_MARKET = "post_market"
    CLOSED = "closed"


class DataType(StrEnum):
    """Canonical data-type identifiers used to select processing schemas and GCS paths."""

    TRADES = "trades"
    BOOK_SNAPSHOT_5 = "book_snapshot_5"
    DERIVATIVE_TICKER = "derivative_ticker"
    LIQUIDATIONS = "liquidations"
    OHLCV_1M = "ohlcv_1m"
    OHLCV_15M = "ohlcv_15m"
    OHLCV_24H = "ohlcv_24h"
    TBBO = "tbbo"
    SWAPS = "swaps"
    RATE_INDICES = "rate_indices"
    ORACLE_PRICES = "oracle_prices"
    OPTIONS_CHAIN = "options_chain"
    FUTURES_CHAIN = "futures_chain"
    SPORTS_ARBITRAGE = "sports_arbitrage"
    SPORTS_ODDS_SNAPSHOT = "sports_odds_snapshot"
    SPORTS_ODDS_MOVEMENT = "sports_odds_movement"


__all__ = ["DataType", "MarketState"]
