"""Pydantic row-level model for features-delta-one-service GCS parquet output."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class DeltaOneFeatureRecord(BaseModel):
    """Output row from features-delta-one-service (subset of FEATURES_SCHEMA key groups).

    All feature columns are NOT NULL in the GCS parquet; None here indicates
    optional group presence depending on instrument type.
    """

    timestamp: datetime
    timestamp_out: datetime
    instrument_id: str

    # Technical indicators
    rsi_14: float | None = None
    rsi_7: float | None = None
    macd: float | None = None
    macd_signal: float | None = None
    macd_hist: float | None = None
    adx: float | None = None

    # Moving averages
    sma_5: Decimal | None = None
    sma_20: Decimal | None = None
    sma_50: Decimal | None = None
    sma_200: Decimal | None = None
    ema_5: Decimal | None = None
    ema_20: Decimal | None = None
    ema_50: Decimal | None = None
    ema_200: Decimal | None = None

    # Volatility realized
    rv_5: float | None = None
    rv_20: float | None = None
    rv_60: float | None = None
    parkinson_5: float | None = None
    garman_klass_5: float | None = None

    # Momentum
    momentum_5: float | None = None
    momentum_20: float | None = None
    roc_5: float | None = None
    roc_20: float | None = None

    # Volume
    volume_sma_20: Decimal | None = None
    volume_ratio: float | None = None
    obv: Decimal | None = None
    vwap_deviation: Decimal | None = None

    # Market microstructure
    bid_ask_spread: Decimal | None = None
    order_imbalance: float | None = None
    trade_intensity: float | None = None

    # Funding / OI (derivatives)
    funding_rate: float | None = None
    funding_rate_ma_8h: float | None = None
    open_interest: Decimal | None = None
    open_interest_change_pct: float | None = None

    # Liquidations
    liquidation_buy_usd: Decimal | None = None
    liquidation_sell_usd: Decimal | None = None
    liquidation_ratio: float | None = None

    # Returns
    return_1h: float | None = None
    return_4h: float | None = None
    return_24h: float | None = None

    # Temporal
    hour_of_day: int | None = None
    day_of_week: int | None = None
    is_weekend: bool | None = None

    # Targets (labels for ML)
    target_direction: int | None = None
    target_return_1h: float | None = None

    @field_validator(
        "bid_ask_spread",
        "sma_5",
        "sma_20",
        "sma_50",
        "sma_200",
        "ema_5",
        "ema_20",
        "ema_50",
        "ema_200",
        "volume_sma_20",
        "obv",
        "vwap_deviation",
        "open_interest",
        mode="before",
    )
    @classmethod
    def coerce_bid_ask_spread(cls, v: object) -> Decimal | None:
        if v is None or isinstance(v, Decimal):
            return v
        return Decimal(str(v))
