"""Cross-instrument feature schemas for features-cross-instrument-service."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class CrossInstrumentFeatures(BaseModel):
    """Features computed across multiple instruments."""

    timestamp: datetime
    timestamp_out: datetime
    instrument_id_primary: str
    instrument_id_secondary: str | None = None
    instrument_ids: list[str] = Field(default_factory=list)

    spread_absolute: Decimal | None = None
    spread_percentage: float | None = None
    spread_z_score: float | None = None
    spread_percentile: float | None = None
    correlation_1h: float | None = None
    correlation_4h: float | None = None
    correlation_24h: float | None = None
    correlation_7d: float | None = None
    rolling_beta: float | None = None
    cointegration_score: float | None = None
    half_life: float | None = None
    relative_strength: float | None = None
    relative_volume: float | None = None
    relative_volatility: float | None = None
    momentum_divergence: float | None = None
    price_ratio: Decimal | None = None
    price_ratio_ma_20: Decimal | None = None
    price_ratio_std_20: Decimal | None = None
    basis: Decimal | None = None
    basis_pct: Decimal | None = None
    annualized_carry: Decimal | None = None

    @field_validator(
        "price_ratio",
        "price_ratio_ma_20",
        "price_ratio_std_20",
        "basis",
        "basis_pct",
        "annualized_carry",
        mode="before",
    )
    @classmethod
    def coerce_to_decimal(cls, v: object) -> Decimal | None:
        if v is None or isinstance(v, Decimal):
            return v
        return Decimal(str(v))

    regime_correlation: str | None = None
    regime_volatility: str | None = None
    lookback_window: int | None = None
    timeframe: str | None = None


class PairSpreadFeatureRecord(BaseModel):
    """Feature record for cointegrated pair spread strategies."""

    instrument_key_a: str
    instrument_key_b: str
    spread_value: Decimal
    spread_zscore: float
    hedge_ratio: float
    cointegration_score: float
    half_life_bars: float
    ou_mean_reversion_speed: float
    spread_velocity: Decimal
    timestamp: int
