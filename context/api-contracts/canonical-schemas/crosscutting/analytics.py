"""Alternative data signal schemas — sentiment, satellite, options flow, dark pool."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class AlternativeDataType(StrEnum):
    SENTIMENT = "sentiment"
    SATELLITE = "satellite"
    OPTIONS_FLOW = "options_flow"
    DARK_POOL = "dark_pool"
    SOCIAL_MEDIA = "social_media"
    NEWS_FLOW = "news_flow"
    WEB_TRAFFIC = "web_traffic"
    BLOCKCHAIN_METRICS = "blockchain_metrics"
    INSIDER_TRANSACTIONS = "insider_transactions"


# ---------------------------------------------------------------------------
# Alternative data
# ---------------------------------------------------------------------------


class SentimentScore(BaseModel):
    """Aggregated sentiment score for an asset from a data source."""

    signal_id: str
    source: str = Field(description="e.g. twitter, reddit, news_aggregator, fear_greed_index")
    asset: str
    score: float = Field(description="-1 (extreme bearish) to +1 (extreme bullish)")
    normalized_score: float | None = Field(default=None, description="0-100 scale if source-specific")
    confidence: float | None = Field(default=None, description="0-1")
    timestamp: datetime
    raw_signal_count: int | None = Field(default=None, description="number of raw signals aggregated")
    sample_period_hours: int | None = None
    sentiment_change: float | None = Field(default=None, description="change vs previous period")


class SatelliteObservation(BaseModel):
    """Observation from satellite imagery analysis."""

    observation_id: str
    provider: str = Field(description="e.g. Orbital Insight, SpaceKnow, RS Metrics")
    asset: str = Field(description="commodity or company being observed")
    location: str | None = Field(default=None, description="geohash or lat/lon string")
    observation_date: date
    metric_name: str = Field(description="e.g. oil_tank_fill_pct, parking_lot_cars, ship_count")
    metric_value: float
    confidence: float | None = None
    yoy_change_pct: float | None = None


class OptionsFlowRecord(BaseModel):
    """Unusual options flow detection record (dark pool / block trades)."""

    flow_id: str
    detected_at: datetime
    underlying: str
    expiry: date
    strike: Decimal
    option_type: str = Field(description="call or put")
    contract_count: int
    premium_usd: Decimal
    implied_volatility: float | None = None
    delta: float | None = None
    is_bullish: bool | None = None
    venue: str | None = None
    trade_type: str | None = Field(default=None, description="sweep | block | complex")


class DarkPoolPrintRecord(BaseModel):
    """Off-exchange / dark pool trade print."""

    print_id: str
    detected_at: datetime
    instrument_id: str
    quantity: Decimal
    price: Decimal
    notional_usd: Decimal | None = None
    venue: str = Field(description="e.g. IEX, FINRA ADF, LIQUIDNET")
    is_above_midpoint: bool | None = None
    trade_code: str | None = Field(default=None, description="FINRA trade condition code")


class AlternativeDataSignal(BaseModel):
    """Unified wrapper for any alternative data signal."""

    signal_id: str
    data_type: AlternativeDataType
    asset: str
    value: float
    raw_signal: str | None = Field(default=None, description="serialised source-specific payload")
    timestamp: datetime
    provider: str
    confidence: float | None = None
    lookback_hours: int | None = None
    sentiment: SentimentScore | None = None
    satellite: SatelliteObservation | None = None
    options_flow: OptionsFlowRecord | None = None
    dark_pool: DarkPoolPrintRecord | None = None
