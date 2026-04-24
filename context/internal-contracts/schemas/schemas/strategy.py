"""Strategy type classification — cross-service contract.

Used by strategy-service (signal generation), execution-service (routing),
risk-and-exposure-service (exposure attribution), ML services (training targets).
"""

from enum import StrEnum

from pydantic import BaseModel, Field


class StrategyType(StrEnum):
    """Strategy classification. Config-driven — services route by type, not by name."""

    # Directional
    MOMENTUM = "MOMENTUM"
    MEAN_REVERSION = "MEAN_REVERSION"
    TREND_FOLLOWING = "TREND_FOLLOWING"
    # Relative value
    BASIS_TRADE = "BASIS_TRADE"  # spot vs perp/future
    STAT_ARB = "STAT_ARB"  # pairs/cointegration
    CROSS_VENUE_ARB = "CROSS_VENUE_ARB"  # same instrument, different venues
    # DeFi
    YIELD_OPTIMIZATION = "YIELD_OPTIMIZATION"  # lending/staking rotation
    DEX_ARB = "DEX_ARB"  # DEX price discrepancy
    FLASH_LOAN_ARB = "FLASH_LOAN_ARB"  # atomic flash loan arbitrage
    LIQUIDITY_PROVISION = "LIQUIDITY_PROVISION"  # LP on DEX pools
    # Market making
    MARKET_MAKING = "MARKET_MAKING"  # quote both sides
    # Sports
    SPORTS_VALUE_BET = "SPORTS_VALUE_BET"  # odds mispricing (statistical)
    SPORTS_ML = "SPORTS_ML"  # ML-predicted outcomes
    SPORTS_ARB = "SPORTS_ARB"  # cross-bookmaker arbitrage
    SPORTS_HALFTIME_ML = "SPORTS_HALFTIME_ML"  # live in-play ML
    # Prediction markets
    PREDICTION_ARB = "PREDICTION_ARB"


class StrategySpec(BaseModel):
    """Strategy specification — config-driven definition for mock and production."""

    strategy_id: str = Field(..., description="Unique ID e.g. CEFI_BTC_MOMENTUM_HUF_5M_V1")
    strategy_type: StrategyType
    category: str = Field(..., description="CEFI, TRADFI, DEFI, SPORTS, PREDICTION")
    instruments: list[str] = Field(
        default_factory=list, description="Instrument keys this strategy trades"
    )
    venues: list[str] = Field(default_factory=list, description="Venues this strategy uses")
    timeframe: str = Field(default="1h", description="Primary timeframe")
    description: str = ""
