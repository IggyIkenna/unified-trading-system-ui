"""Cross-timeframe feature schemas for features-multi-timeframe-service."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class CrossTimeframeFeatures(BaseModel):
    """Features computed across multiple timeframes for a single instrument.

    Produced by features-multi-timeframe-service (Layer 3b).
    """

    timestamp: datetime
    timestamp_out: datetime
    instrument_id: str
    feature_category: str
    timeframe: str | None = Field(default=None, description="Primary timeframe, e.g. 1h")

    tf_alignment_1h_4h: int | None = None
    tf_alignment_4h_1d: int | None = None
    tf_alignment_all_bullish: int | None = None
    tf_trend_agreement_score: float | None = None
    momentum_acceleration_1h_4h: float | None = None
    tf_momentum_divergence: int | None = None
    structure_bias_4h: float | None = None
    structure_bias_1d: float | None = None
    tf_structure_aligned_1h_4h: int | None = None
    tf_level_multi_confluence: int | None = None
    bos_1h_and_4h_aligned: int | None = None
    channel_convergence_4h: float | None = None
    vol_ratio_1h_4h: float | None = None
    vol_ratio_4h_1d: float | None = None
    vol_compression_trend: int | None = None
    tf_all_vol_low: int | None = None
    hours_to_next_4h_close: float | None = None
    hours_to_weekly_close: float | None = None
    is_4h_boundary: int | None = None
    is_daily_boundary: int | None = None
    london_ny_overlap: int | None = None
    session_vol_multiplier: float | None = None
