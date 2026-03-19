"""Liquidity feature domain schemas for features-cross-instrument-service.

These are the canonical output schemas produced by the liquidity feature calculators.
All schemas are at 1-minute resolution unless explicitly suffixed.

Calculators → output schemas:
  BookDepthCalculator      → BookDepthFeature1m
  LiquidityWallCalculator  → LiquidityWallEvent
  LiquidationClusterCalc   → LiquidationClusterFeature1m
  FlowInteractionCalc      → FlowInteractionFeature1m
  CompositeSRCalculator    → CompositeSRFeature1m
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# BookDepthFeature1m — relative depth bands normalised by ADV
# ---------------------------------------------------------------------------


class BookDepthFeature1m(BaseModel):
    """1-minute book depth metrics: relative depth bands + ADV normalisation.

    Bands are expressed as basis-point offsets from mid price.
    Each band value = cumulative quote-side depth within ±N bps / 30d ADV.
    """

    instrument_key: str
    venue: str
    timestamp: datetime
    reference_price_type: Literal["mid", "mark"] = "mid"

    # Bid depth bands (cumulative, normalised by 30d ADV)
    bid_depth_10bps: float | None = Field(
        default=None, description="Cum bid depth within 10 bps / ADV"
    )
    bid_depth_25bps: float | None = Field(
        default=None, description="Cum bid depth within 25 bps / ADV"
    )
    bid_depth_50bps: float | None = Field(
        default=None, description="Cum bid depth within 50 bps / ADV"
    )
    bid_depth_100bps: float | None = Field(
        default=None, description="Cum bid depth within 100 bps / ADV"
    )
    bid_depth_200bps: float | None = Field(
        default=None, description="Cum bid depth within 200 bps / ADV"
    )
    bid_depth_300bps: float | None = Field(
        default=None, description="Cum bid depth within 300 bps / ADV"
    )
    bid_depth_500bps: float | None = Field(
        default=None, description="Cum bid depth within 500 bps / ADV"
    )

    # Ask depth bands (cumulative, normalised by 30d ADV)
    ask_depth_10bps: float | None = None
    ask_depth_25bps: float | None = None
    ask_depth_50bps: float | None = None
    ask_depth_100bps: float | None = None
    ask_depth_200bps: float | None = None
    ask_depth_300bps: float | None = None
    ask_depth_500bps: float | None = None

    # Bid/ask depth ratio (imbalance proxy)
    depth_imbalance_50bps: float | None = Field(
        default=None, description="bid_depth_50bps / (bid_depth_50bps + ask_depth_50bps)"
    )
    depth_imbalance_200bps: float | None = None

    # Raw mid price used for band calculation
    mid_price: Decimal | None = None
    adv_30d_usd: float | None = Field(
        default=None, description="30-day rolling average daily volume (USD)"
    )
    schema_version: str = "1.0.0"


# ---------------------------------------------------------------------------
# LiquidityWallEvent — statistically significant order concentration
# ---------------------------------------------------------------------------


class LiquidityWallEvent(BaseModel):
    """Detected liquidity wall at a price level.

    A wall is a statistically significant cluster of resting order size,
    identified via z-score peak detection relative to rolling baseline depth.
    """

    instrument_key: str
    venue: str
    timestamp: datetime
    side: Literal["bid", "ask"]
    price_level: Decimal
    wall_size_usd: Decimal = Field(description="Notional USD depth at wall price level")
    wall_size_z: float = Field(description="Z-score of wall size relative to rolling distribution")
    distance_bps: float = Field(description="Distance from mid price in basis points")
    add_pressure: float | None = Field(
        default=None, description="Recent size additions at this level"
    )
    cancel_pressure: float | None = Field(
        default=None, description="Recent size cancellations at this level"
    )
    schema_version: str = "1.0.0"


# ---------------------------------------------------------------------------
# LiquidationClusterFeature1m — nearest cluster analytics
# ---------------------------------------------------------------------------


class LiquidationClusterFeature1m(BaseModel):
    """1-minute liquidation cluster proximity and asymmetry features."""

    instrument_key: str
    venue: str
    timestamp: datetime

    # Nearest cluster above (short liquidation zone)
    nearest_short_cluster_distance_bps: float | None = Field(
        default=None, description="Distance to nearest short liq cluster above mid (bps)"
    )
    nearest_short_cluster_usd: float | None = Field(
        default=None, description="Short liq USD at nearest cluster above mid"
    )

    # Nearest cluster below (long liquidation zone)
    nearest_long_cluster_distance_bps: float | None = Field(
        default=None, description="Distance to nearest long liq cluster below mid (bps)"
    )
    nearest_long_cluster_usd: float | None = Field(
        default=None, description="Long liq USD at nearest cluster below mid"
    )

    # Asymmetry: positive = more short liq above than long liq below → bearish forced-flow
    long_short_cluster_asymmetry: float | None = Field(
        default=None,
        description=(
            "(short_cluster_usd - long_cluster_usd) / (short_cluster_usd + long_cluster_usd)"
        ),
    )

    # Overlap with book walls (non-zero when a liq cluster coincides with a wall)
    wall_cluster_overlap_count: int | None = Field(
        default=None, description="Number of price levels where a wall and cluster co-occur"
    )

    source: str = Field(description="Data provider: coinglass | hyblock")
    schema_version: str = "1.0.0"


# ---------------------------------------------------------------------------
# FlowInteractionFeature1m — CVD, taker imbalance, wall absorption
# ---------------------------------------------------------------------------


class FlowInteractionFeature1m(BaseModel):
    """1-minute order flow interaction features.

    Measures directional flow pressure and its interaction with resting liquidity.
    """

    instrument_key: str
    venue: str
    timestamp: datetime

    # Cumulative volume delta (taker buy - taker sell in USD)
    cvd_usd: float | None = Field(
        default=None, description="Taker buy USD - taker sell USD this minute"
    )
    cvd_5m_usd: float | None = Field(default=None, description="Rolling 5-min CVD in USD")

    # Taker imbalance ratio: buy / (buy + sell)
    taker_buy_ratio: float | None = Field(
        default=None, description="Taker buy USD / total taker USD"
    )

    # Wall absorption: trade volume executed within ±5bps of the nearest wall
    wall_absorption_usd: float | None = Field(
        default=None, description="USD traded within 5 bps of the nearest bid/ask wall"
    )
    wall_absorption_ratio: float | None = Field(
        default=None, description="wall_absorption_usd / total volume this minute"
    )

    schema_version: str = "1.0.0"


# ---------------------------------------------------------------------------
# CompositeSRFeature1m — wall ∩ cluster SR composite score
# ---------------------------------------------------------------------------


class CompositeSRFeature1m(BaseModel):
    """Composite support/resistance feature: wall + liquidation cluster overlap score.

    A price level scores high when it has both a large book wall (resting
    liquidity barrier) and a liquidation cluster (forced-flow magnet).
    """

    instrument_key: str
    venue: str
    timestamp: datetime

    # Best bid/ask SR levels with composite scores
    top_bid_sr_price: Decimal | None = Field(
        default=None, description="Strongest composite bid SR price"
    )
    top_bid_sr_score: float | None = Field(
        default=None, description="Composite score [0-1] for top bid SR"
    )
    top_ask_sr_price: Decimal | None = Field(
        default=None, description="Strongest composite ask SR price"
    )
    top_ask_sr_score: float | None = Field(
        default=None, description="Composite score [0-1] for top ask SR"
    )

    # Distance to top SR levels
    top_bid_sr_distance_bps: float | None = None
    top_ask_sr_distance_bps: float | None = None

    # Aggregate SR zone density (count of levels with composite score > 0.5)
    sr_zone_count: int | None = None

    schema_version: str = "1.0.0"


__all__ = [
    "BookDepthFeature1m",
    "CompositeSRFeature1m",
    "FlowInteractionFeature1m",
    "LiquidationClusterFeature1m",
    "LiquidityWallEvent",
]
