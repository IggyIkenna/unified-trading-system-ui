"""Pydantic row-level models for features-volatility-service GCS parquet outputs."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, field_validator


class OptionsIvRecord(BaseModel):
    """Output row from features-volatility-service (options_iv schema)."""

    timestamp: datetime
    timestamp_out: datetime
    venue: str
    underlying_symbol: str
    atm_iv: float | None = None
    call_25d_iv: float | None = None
    put_25d_iv: float | None = None
    skew_25d: float | None = None
    skew_25d_ratio: float | None = None
    risk_reversal_25d: float | None = None
    butterfly_25d: float | None = None
    term_slope: float | None = None
    term_curvature: float | None = None
    iv_at_90_moneyness: float | None = None
    iv_at_100_moneyness: float | None = None
    iv_at_110_moneyness: float | None = None
    implied_forward: Decimal | None = None
    implied_rate: float | None = None
    total_options_volume: Decimal | None = None
    put_call_volume_ratio: float | None = None
    atm_bid_ask_spread: Decimal | None = None


class FuturesTermStructureRecord(BaseModel):
    """Output row from features-volatility-service (futures_term_structure schema)."""

    timestamp: datetime
    timestamp_out: datetime
    venue: str
    underlying_symbol: str
    spot_price: Decimal
    front_month_price: Decimal | None = None
    front_month_expiry_days: int | None = None
    basis: Decimal | None = None
    basis_pct: Decimal | None = None
    annualized_basis: Decimal | None = None
    curve_slope: float | None = None
    curve_curvature: float | None = None
    roll_yield_1m: float | None = None
    roll_yield_3m: float | None = None
    calendar_spread_1_2: Decimal | None = None
    calendar_spread_2_3: Decimal | None = None

    @field_validator(
        "basis",
        "basis_pct",
        "annualized_basis",
        "calendar_spread_1_2",
        "calendar_spread_2_3",
        mode="before",
    )
    @classmethod
    def coerce_to_decimal(cls, v: object) -> Decimal | None:
        if v is None or isinstance(v, Decimal):
            return v
        return Decimal(str(v))


class VolSurfaceTermStructureRecord(BaseModel):
    """Output row from features-volatility-service (vol surface term structure)."""

    venue: str
    underlying: str
    timestamp: int
    underlying_price: Decimal
    atm_iv_7d: float | None = None
    atm_iv_30d: float | None = None
    atm_iv_60d: float | None = None
    atm_iv_90d: float | None = None
    atm_iv_180d: float | None = None
    call_25d_iv_30d: float | None = None
    put_25d_iv_30d: float | None = None
    call_10d_iv_30d: float | None = None
    put_10d_iv_30d: float | None = None
    term_structure_slope: float | None = None
    skew_25d_30d: float | None = None
    skew_10d_30d: float | None = None
    atm_iv_percentile_252d: float | None = None
    vrp_30d: float | None = None
