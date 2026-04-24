from __future__ import annotations

from decimal import Decimal
from enum import StrEnum

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from .._base import CanonicalBase


class CanonicalLiquidation(CanonicalBase):
    """Normalised liquidation event — all CeFi venues."""

    instrument_key: str
    venue: str
    timestamp: AwareDatetime
    side: str = Field(description="buy or sell")
    price: Decimal
    size: Decimal
    order_id: str | None = None
    liquidated_account_value: Decimal | None = None
    liquidated_ntl_pos: Decimal | None = None
    liquidated_user: str | None = Field(default=None, json_schema_extra={"pii": True})
    schema_version: str = "1.0"


class CanonicalLiquidationCluster(CanonicalBase):
    """Predicted forced-flow concentration at a price level."""

    instrument_key: str
    venue: str
    timestamp: AwareDatetime
    price_level: Decimal = Field(description="Reference price for this cluster")
    long_liq_usd: Decimal = Field(description="Estimated USD value of long liquidations at this level")
    short_liq_usd: Decimal = Field(description="Estimated USD value of short liquidations at this level")
    leverage_assumption: Decimal | None = Field(default=None, description="Assumed leverage used in cluster model")
    cluster_strength: Decimal | None = Field(default=None, description="Normalised cluster intensity [0-1] if provided")
    source: str = Field(description="Data provider: internal (own liquidation prediction model)")
    schema_version: str = "1.0"


class CanonicalFundingRate(CanonicalBase):
    """Normalised funding rate — perps/futures."""

    venue: str
    symbol: str
    rate: Decimal
    timestamp: AwareDatetime
    next_funding_timestamp: AwareDatetime | None = None
    predicted_rate: Decimal | None = None


class CanonicalDerivativeTicker(CanonicalBase):
    """Normalised derivative ticker — perps, futures, options."""

    instrument_key: str
    venue: str
    timestamp: AwareDatetime
    last_price: Decimal | None = None
    mark_price: Decimal | None = None
    index_price: Decimal | None = None
    mid_price: Decimal | None = None
    prev_day_price: Decimal | None = None
    funding_rate: Decimal | None = None
    predicted_funding_rate: Decimal | None = None
    next_funding_timestamp: AwareDatetime | None = None
    funding_timestamp: AwareDatetime | None = None
    open_interest: Decimal | None = None
    open_interest_value: Decimal | None = None
    day_ntl_volume: Decimal | None = None
    bid_price: Decimal | None = None
    ask_price: Decimal | None = None
    volume_24h: Decimal | None = None
    schema_version: str = "1.0"


class CanonicalOptionsChainEntry(CanonicalBase):
    """Normalised options chain entry — strike, greeks, bid/ask."""

    timestamp: AwareDatetime
    venue: str
    symbol: str
    underlying: str
    strike: Decimal
    option_type: str = Field(description="call or put")
    expiration: AwareDatetime | None = None
    bid_price: Decimal | None = None
    ask_price: Decimal | None = None
    bid_size: Decimal | None = None
    ask_size: Decimal | None = None
    implied_volatility: float | None = None
    delta: float | None = None
    gamma: float | None = None
    theta: float | None = None
    vega: float | None = None
    instrument_key: str | None = None


class _DerivativesBase(BaseModel):
    """Base for institutional derivatives schemas — rejects unknown fields."""

    model_config = ConfigDict(extra="forbid")


class PositionRisk(_DerivativesBase):
    """Position risk metrics."""

    liquidationPrice: Decimal | None = Field(None, description="Liquidation price")
    bankruptcyPrice: Decimal | None = Field(None, description="Bankruptcy price")
    maintenanceMarginRate: Decimal | None = Field(None, description="Maintenance margin rate")
    initialMarginRate: Decimal | None = Field(None, description="Initial margin rate")
    marginRatio: Decimal | None = Field(None, description="Current margin ratio")
    adlRank: int | None = Field(None, description="Auto-deleveraging rank")
    riskTier: int | None = Field(None, description="Risk tier")


class InsuranceFundState(_DerivativesBase):
    """Insurance fund state snapshot."""

    asset: str = Field(..., description="Asset symbol")
    amount: Decimal = Field(..., description="Fund amount")
    timestamp: AwareDatetime = Field(..., description="Snapshot timestamp")


class LongShortRatio(_DerivativesBase):
    """Long/short ratio aggregate."""

    longShortRatio: Decimal = Field(..., description="Ratio of long to short")
    longAccount: Decimal = Field(..., description="Long account proportion")
    shortAccount: Decimal = Field(..., description="Short account proportion")


class OpenInterestHistory(_DerivativesBase):
    """Open interest history point."""

    symbol: str = Field(..., description="Instrument symbol")
    timestamp: AwareDatetime = Field(..., description="Snapshot timestamp")
    openInterest: Decimal = Field(..., description="Open interest value")


class FundingRateHistory(_DerivativesBase):
    """Funding rate history point."""

    fundingTime: AwareDatetime = Field(..., description="Funding timestamp")
    rate: Decimal = Field(..., description="Funding rate")
    markPrice: Decimal | None = Field(None, description="Mark price at funding")
    indexPrice: Decimal | None = Field(None, description="Index price at funding")


class SettlementEvent(_DerivativesBase):
    """Settlement event record."""

    instrument: str = Field(..., description="Instrument symbol")
    settlementPrice: Decimal = Field(..., description="Settlement price")
    deliveryTime: AwareDatetime = Field(..., description="Delivery/settlement time")
    cashFlow: Decimal | None = Field(None, description="Cash flow amount")
    fee: Decimal | None = Field(None, description="Settlement fee")


class VolSmilePoint(_DerivativesBase):
    """Single point on volatility smile."""

    strike: Decimal = Field(..., description="Strike price")
    impliedVol: Decimal = Field(..., description="Implied volatility")


class VolSurfaceSlice(_DerivativesBase):
    """Volatility smile at a single expiry."""

    expiry: AwareDatetime = Field(..., description="Expiry timestamp")
    points: list[VolSmilePoint] = Field(default_factory=list)


class VolTermStructure(_DerivativesBase):
    """Volatility term structure (expiry vs ATM IV)."""

    expiry: AwareDatetime = Field(..., description="Expiry timestamp")
    atmVol: Decimal = Field(..., description="At-the-money implied volatility")


class VolSurface(_DerivativesBase):
    """Full volatility surface."""

    symbol: str = Field(..., description="Underlying symbol")
    timestamp: AwareDatetime = Field(..., description="Snapshot timestamp")
    slices: list[VolSurfaceSlice] = Field(default_factory=list)
    termStructure: list[VolTermStructure] = Field(default_factory=list)


class ComboStrategyType(StrEnum):
    """Multi-leg/combo strategy classification.

    Covers every common exchange-listed or OTC combo shape. String values are
    the canonical on-disk tokens used in ``build_instrument_id`` and the
    ``strategy=`` partition level.
    """

    # Simple 2-leg spreads
    CALENDAR_SPREAD = "calendar_spread"
    CALENDAR = "calendar"  # alias for non-option calendar (futures roll)
    DIAGONAL = "diagonal"
    VERTICAL = "vertical"
    SPREAD = "spread"  # generic 2-leg price spread (inter-commodity, etc.)
    RISK_REVERSAL = "risk_reversal"
    BULL_CALL_SPREAD = "bull_call_spread"
    BEAR_PUT_SPREAD = "bear_put_spread"
    COLLAR = "collar"
    COVERED_CALL = "covered_call"
    PROTECTIVE_PUT = "protective_put"
    RATIO_SPREAD = "ratio_spread"
    # Straddles / strangles (2-leg same expiry)
    STRADDLE = "straddle"
    STRANGLE = "strangle"
    # Butterflies (3-leg)
    BUTTERFLY = "butterfly"
    CALL_BUTTERFLY = "call_butterfly"
    PUT_BUTTERFLY = "put_butterfly"
    IRON_BUTTERFLY = "iron_butterfly"
    # Condors (4-leg)
    CONDOR = "condor"
    IRON_CONDOR = "iron_condor"
    # Fixed-income / funding
    BOX = "box"
    JELLY_ROLL = "jelly_roll"
    # Cash-vs-future
    EFP = "efp"
    # Fallback
    CUSTOM = "custom"


class ComboLeg(_DerivativesBase):
    """Single leg of a multi-leg instrument."""

    instrument_id: str
    direction: str
    ratio: int = 1
    venue: str | None = None


class MultiLegInstrument(_DerivativesBase):
    """Normalized multi-leg/combo instrument."""

    combo_id: str | None = None
    venue: str
    strategy_type: ComboStrategyType | None = None
    underlying: str | None = None
    legs: list[ComboLeg]
    block_trade_only: bool = False
    description: str | None = None
    timestamp: AwareDatetime | None = None


class ComboQuote(_DerivativesBase):
    """Unified combo price + net greeks."""

    combo_id: str
    venue: str
    net_price: Decimal | None = None
    bid: Decimal | None = None
    ask: Decimal | None = None
    net_delta: Decimal | None = None
    net_gamma: Decimal | None = None
    net_vega: Decimal | None = None
    net_theta: Decimal | None = None
    timestamp: AwareDatetime | None = None
