"""Market-data-processing adapter domain contracts.

InstrumentInfo, InstrumentMetadata — typed dicts for instrument metadata
passed from the orchestration layer to candle adapters.

CandleOutput — dataclass returned by every candle adapter; wraps numpy
arrays and provides a to_dataframe() helper for Parquet writing.
"""

from __future__ import annotations

import dataclasses
from dataclasses import dataclass

import pandas as pd


class InstrumentInfo(dict[str, object]):
    """Minimal instrument identifiers passed to candle adapters.

    Required keys: ``instrument_id`` (str), ``venue`` (str), ``symbol`` (str).

    Implemented as a dict subclass so existing code that passes plain dicts
    is fully compatible; add typed accessors for IDE support.

    Usage::

        info = InstrumentInfo(
            instrument_id="BINANCE:SPOT:BTCUSDT", venue="BINANCE", symbol="BTCUSDT"
        )
        adapter.process_to_candles(tick_data, "1m", instrument_info=info)
    """

    @property
    def instrument_id(self) -> str:
        return str(self["instrument_id"])

    @property
    def venue(self) -> str:
        return str(self["venue"])

    @property
    def symbol(self) -> str:
        return str(self["symbol"])


class InstrumentMetadata(dict[str, object]):
    """Extended instrument metadata for market-state detection.

    Optional keys consumed by MarketStateDetector:
    - ``trading_hours_open`` (str | None) — e.g. "09:30" (local exchange time)
    - ``trading_hours_close`` (str | None) — e.g. "16:00"
    - ``pre_market_open`` (str | None)
    - ``post_market_close`` (str | None)
    - ``holiday_calendar`` (list[str] | None) — ISO date strings of exchange holidays

    Implemented as a dict subclass for mutable key-value access (dict protocol).
    """

    @property
    def trading_hours_open(self) -> str | None:
        v = self.get("trading_hours_open")
        return str(v) if v is not None else None

    @property
    def trading_hours_close(self) -> str | None:
        v = self.get("trading_hours_close")
        return str(v) if v is not None else None

    @property
    def holiday_calendar(self) -> list[str] | None:
        v = self.get("holiday_calendar")
        if v is None:
            return None
        if isinstance(v, list):
            return [str(item) for item in v]  # pyright: ignore[reportUnknownArgumentType,reportUnknownVariableType]
        return None


@dataclass
class CandleOutput:
    """Structured output from a candle adapter.

    All array fields contain numpy ndarrays of shape ``(n_candles,)``.
    The three identifier fields are required; all OHLCV and derived metric
    fields are optional (adapters only populate the columns they produce).

    Calling ``to_dataframe()`` drops ``None`` fields and returns a pandas
    DataFrame ready for schema validation and Parquet writing.
    """

    # Required identifiers
    timestamp: object = None  # np.ndarray[np.int64]  — nanoseconds since epoch
    timestamp_out: object = None  # np.ndarray[np.int64]  — with synthetic delay
    venue: object = None  # np.ndarray[object]
    symbol: object = None  # np.ndarray[object]
    instrument_id: object = None  # np.ndarray[object]

    # Core OHLCV
    open: object = None
    high: object = None
    low: object = None
    close: object = None
    volume: object = None
    trade_count: object = None
    buy_volume: object = None
    sell_volume: object = None
    buy_trade_count: object = None
    sell_trade_count: object = None
    vwap: object = None

    # Trade latency
    delay_median_ms: object = None
    delay_mean_ms: object = None
    delay_min_ms: object = None
    delay_max_ms: object = None

    # Trade size distribution
    trade_size_p10: object = None
    trade_size_p50: object = None
    trade_size_p90: object = None
    trade_size_p99: object = None

    # Microstructure
    tick_direction_momentum: object = None
    whale_trade: object = None
    whale_trade_count: object = None
    whale_trade_volume: object = None
    volume_clock_mean_seconds: object = None
    volume_clock_std_seconds: object = None
    volume_imbalance_ratio: object = None

    # Book snapshot features
    spread_bps: object = None
    mid_price: object = None
    depth_bid: object = None
    depth_ask: object = None
    imbalance_ratio: object = None
    spread_bps_mean_15s: object = None
    depth_bid_mean_15s: object = None
    depth_ask_mean_15s: object = None
    imbalance_ratio_mean_15s: object = None
    bid_vol_0_mean_15s: object = None
    ask_vol_0_mean_15s: object = None
    tob_depth_ratio_mean_15s: object = None
    mid_price_mean_15s: object = None
    weighted_mid_price_5level: object = None
    effective_spread_5level: object = None

    # Market state (TradFi / TBBO adapters)
    market_state: object = None
    is_halted: object = None
    is_auction: object = None

    # Derivative/options fields
    mark_price: object = None
    index_price: object = None
    funding_rate: object = None
    open_interest: object = None
    implied_volatility: object = None
    strike: object = None
    option_type: object = None
    expiration: object = None

    # Liquidations
    liquidation_count: object = None
    liquidation_volume: object = None
    liquidation_notional: object = None

    # DeFi / swap fields
    amount_in: object = None
    amount_out: object = None
    price_impact: object = None
    fee: object = None
    protocol: object = None

    # Rate indices
    rate: object = None
    rate_type: object = None

    # Sports arbitrage / odds fields
    home_odds: object = None
    away_odds: object = None
    draw_odds: object = None
    arb_margin_pct: object = None
    best_bookmaker: object = None

    # DeFi lending / flash loan fields
    liquidity_rate: object = None
    borrow_rate: object = None
    utilization_ratio: object = None
    liquidity_index: object = None
    borrow_index: object = None
    available_liquidity: object = None
    max_flash_loan: object = None
    flash_loan_fee: object = None
    total_supply: object = None
    total_borrow: object = None

    # DeFi yield fields
    yield_apy: object = None

    def to_dataframe(self) -> pd.DataFrame:
        """Convert non-None array fields to a pandas DataFrame.

        Returns an empty DataFrame if all fields are None.
        """
        data: dict[str, object] = {}
        for f in dataclasses.fields(self):
            v: object = getattr(self, f.name)  # pyright: ignore[reportAny]
            if v is not None:
                data[f.name] = v
        if not data:
            return pd.DataFrame()
        return pd.DataFrame(data)


__all__ = ["CandleOutput", "InstrumentInfo", "InstrumentMetadata"]
