"""Internal feature schemas — delta-one features, vol surface, term structure, on-chain features."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


class DeltaOneFeatureRecord(BaseModel):
    """Output row from features-delta-one-service (subset of FEATURES_SCHEMA key groups).

    All feature columns are NOT NULL in the GCS parquet; None here indicates
    optional group presence depending on instrument type.
    """

    timestamp: datetime
    timestamp_out: datetime
    instrument_id: str

    # Technical indicators
    rsi_14: float | None = None  # financial-ratio: float-ok
    rsi_7: float | None = None  # financial-ratio: float-ok
    macd: float | None = None  # financial-ratio: float-ok
    macd_signal: float | None = None  # financial-ratio: float-ok
    macd_hist: float | None = None  # financial-ratio: float-ok
    adx: float | None = None  # financial-ratio: float-ok

    # Moving averages (price-derived → Decimal for monetary precision)
    sma_5: Decimal | None = None
    sma_20: Decimal | None = None
    sma_50: Decimal | None = None
    sma_200: Decimal | None = None
    ema_5: Decimal | None = None
    ema_20: Decimal | None = None
    ema_50: Decimal | None = None
    ema_200: Decimal | None = None

    # Volatility realized
    rv_5: float | None = None  # volatility-pct: float-ok
    rv_20: float | None = None  # volatility-pct: float-ok
    rv_60: float | None = None  # volatility-pct: float-ok
    parkinson_5: float | None = None  # volatility-pct: float-ok
    garman_klass_5: float | None = None  # volatility-pct: float-ok

    # Momentum
    momentum_5: float | None = None  # financial-ratio: float-ok
    momentum_20: float | None = None  # financial-ratio: float-ok
    roc_5: float | None = None  # financial-ratio: float-ok
    roc_20: float | None = None  # financial-ratio: float-ok

    # Volume
    volume_sma_20: Decimal | None = None
    volume_ratio: float | None = None  # financial-ratio: float-ok
    obv: Decimal | None = None
    vwap_deviation: Decimal | None = None

    # Market microstructure
    bid_ask_spread: Decimal | None = None
    order_imbalance: float | None = None  # financial-ratio: float-ok
    trade_intensity: float | None = None  # financial-ratio: float-ok

    # Funding / OI (derivatives)
    funding_rate: float | None = None  # financial-ratio: float-ok
    funding_rate_ma_8h: float | None = None  # financial-ratio: float-ok
    open_interest: Decimal | None = None
    open_interest_change_pct: float | None = None  # financial-ratio: float-ok

    # Liquidations
    liquidation_buy_usd: Decimal | None = None
    liquidation_sell_usd: Decimal | None = None
    liquidation_ratio: float | None = None  # financial-ratio: float-ok

    # Returns
    return_1h: float | None = None  # financial-ratio: float-ok
    return_4h: float | None = None  # financial-ratio: float-ok
    return_24h: float | None = None  # financial-ratio: float-ok

    # Temporal
    hour_of_day: int | None = None
    day_of_week: int | None = None
    is_weekend: bool | None = None

    # Targets (labels for ML)
    target_direction: int | None = None
    target_return_1h: float | None = None  # financial-ratio: float-ok

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
        """Coerce float input via str() to avoid IEEE 754 accumulation drift."""
        if v is None or isinstance(v, Decimal):
            return v
        return Decimal(str(v))


class OptionsIvRecord(BaseModel):
    """Output row from features-volatility-service (options_iv schema)."""

    timestamp: datetime
    timestamp_out: datetime
    venue: str
    underlying_symbol: str
    atm_iv: float | None = None  # volatility-pct: float-ok
    call_25d_iv: float | None = None  # volatility-pct: float-ok
    put_25d_iv: float | None = None  # volatility-pct: float-ok
    skew_25d: float | None = None  # financial-ratio: float-ok
    skew_25d_ratio: float | None = None  # financial-ratio: float-ok
    risk_reversal_25d: float | None = None  # volatility-pct: float-ok
    butterfly_25d: float | None = None  # volatility-pct: float-ok
    term_slope: float | None = None  # financial-ratio: float-ok
    term_curvature: float | None = None  # financial-ratio: float-ok
    iv_at_90_moneyness: float | None = None  # volatility-pct: float-ok
    iv_at_100_moneyness: float | None = None  # volatility-pct: float-ok
    iv_at_110_moneyness: float | None = None  # volatility-pct: float-ok
    implied_forward: Decimal | None = None
    implied_rate: float | None = None  # financial-ratio: float-ok
    total_options_volume: Decimal | None = None
    put_call_volume_ratio: float | None = None  # financial-ratio: float-ok
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
    curve_slope: float | None = None  # financial-ratio: float-ok
    curve_curvature: float | None = None  # financial-ratio: float-ok
    roll_yield_1m: float | None = None  # financial-ratio: float-ok
    roll_yield_3m: float | None = None  # financial-ratio: float-ok
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
        """Coerce float input via str() to avoid IEEE 754 accumulation drift."""
        if v is None or isinstance(v, Decimal):
            return v
        return Decimal(str(v))


class FeatureSnapshotRequest(BaseModel):
    """Request to fetch a feature snapshot for ML inference."""

    instrument_id: str
    timestamp: datetime
    lookback_window: int = Field(description="Number of bars to include")
    feature_groups: list[str] = Field(default_factory=list, description="Empty = all groups")
    timeframe: str = "1h"


class CrossTimeframeFeatures(BaseModel):
    """
    Features computed across multiple timeframes for a single instrument.

    Produced by features-multi-timeframe-service (Layer 3b).
    Symmetric counterpart to CrossInstrumentFeatures:
      - CrossInstrumentFeatures: many instruments x 1 TF
      - CrossTimeframeFeatures:  1 instrument x many TFs

    All binary features use int (0/1) not bool — GBT-friendly, no monotonic transforms.
    """

    timestamp: datetime
    timestamp_out: datetime
    instrument_id: str
    # tf_momentum_alignment | tf_structure_context | tf_vol_compression | tf_session_context
    feature_category: str
    timeframe: str | None = Field(
        default=None, description="Primary timeframe of the trigger, e.g. '1h'"
    )

    # ── tf_momentum_alignment ──────────────────────────────────────────────────
    tf_alignment_1h_4h: int | None = None  # sign(roc_5_1h) == sign(roc_5_4h)
    tf_alignment_4h_1d: int | None = None  # sign(roc_5_4h) == sign(roc_5_1d)
    tf_alignment_all_bullish: int | None = None  # all active TFs show positive momentum
    tf_trend_agreement_score: float | None = None  # financial-ratio: float-ok
    momentum_acceleration_1h_4h: float | None = None  # financial-ratio: float-ok
    tf_momentum_divergence: int | None = None  # 1h vs 4h momentum opposite sign

    # ── tf_structure_context ──────────────────────────────────────────────────
    structure_bias_4h: float | None = None  # financial-ratio: float-ok
    structure_bias_1d: float | None = None  # financial-ratio: float-ok
    tf_structure_aligned_1h_4h: int | None = None  # 1h and 4h biases same sign
    tf_level_multi_confluence: int | None = None  # S/R level appears on ≥2 TFs
    bos_1h_and_4h_aligned: int | None = None  # BOS on both 1h and 4h within 10 bars
    channel_convergence_4h: float | None = None  # financial-ratio: float-ok

    # ── tf_vol_compression ────────────────────────────────────────────────────
    vol_ratio_1h_4h: float | None = None  # financial-ratio: float-ok; atr_14_1h / atr_14_4h
    vol_ratio_4h_1d: float | None = None  # financial-ratio: float-ok; atr_14_4h / atr_14_1d
    vol_compression_trend: int | None = None  # vol_ratio declining over 10 bars
    tf_all_vol_low: int | None = None  # all TFs in LOW_VOL regime

    # ── tf_session_context ────────────────────────────────────────────────────
    hours_to_next_4h_close: float | None = None  # time-based: float-ok
    hours_to_weekly_close: float | None = None  # time-based: float-ok
    is_4h_boundary: int | None = None  # current 1h bar is also a 4h close
    is_daily_boundary: int | None = None  # current 4h bar is also a daily close
    london_ny_overlap: int | None = None  # London/NY overlap session active
    session_vol_multiplier: float | None = None  # financial-ratio: float-ok


class CrossInstrumentFeatures(BaseModel):
    """Features computed across multiple instruments.

    Used for spread trading, correlation analysis, and cross-asset strategies.
    """

    timestamp: datetime
    timestamp_out: datetime

    # Instrument identifiers
    instrument_id_primary: str
    instrument_id_secondary: str | None = None
    instrument_ids: list[str] = Field(
        default_factory=list, description="All instruments in the feature set"
    )

    # Spread features
    spread_absolute: Decimal | None = None
    spread_percentage: float | None = None  # financial-ratio: float-ok
    spread_z_score: float | None = None  # financial-ratio: float-ok
    spread_percentile: float | None = None  # financial-ratio: float-ok

    # Correlation features
    correlation_1h: float | None = None  # financial-ratio: float-ok
    correlation_4h: float | None = None  # financial-ratio: float-ok
    correlation_24h: float | None = None  # financial-ratio: float-ok
    correlation_7d: float | None = None  # financial-ratio: float-ok
    rolling_beta: float | None = None  # financial-ratio: float-ok

    # Cointegration
    cointegration_score: float | None = None  # financial-ratio: float-ok
    half_life: float | None = None  # time-based: float-ok

    # Relative strength
    relative_strength: float | None = None  # financial-ratio: float-ok
    relative_volume: float | None = None  # financial-ratio: float-ok
    relative_volatility: float | None = None  # financial-ratio: float-ok

    # Cross-asset momentum
    momentum_divergence: float | None = None  # financial-ratio: float-ok
    price_ratio: Decimal | None = None
    price_ratio_ma_20: Decimal | None = None
    price_ratio_std_20: Decimal | None = None

    # Basis and carry (for futures/spot)
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
        """Coerce float input via str() to avoid IEEE 754 accumulation drift."""
        if v is None or isinstance(v, Decimal):
            return v
        return Decimal(str(v))

    # Market regime indicators
    regime_correlation: str | None = Field(default=None, description="high, medium, low, negative")
    regime_volatility: str | None = Field(default=None, description="high, medium, low")

    # Metadata
    lookback_window: int | None = Field(
        default=None, description="Number of bars used for computation"
    )
    timeframe: str | None = Field(default=None, description="e.g., 1h, 4h, 1d")


class PairSpreadFeatureRecord(BaseModel):
    """Feature record for cointegrated pair spread strategies (stat arb, rel vol).

    Produced by features-cross-instrument-service CointegrationCalculator.
    Consumed by strategy-service in stat_arb and rel_vol modes.
    """

    instrument_key_a: str  # long leg
    instrument_key_b: str  # short leg (or relative)
    spread_value: Decimal  # raw spread: price_a - β * price_b
    spread_zscore: float  # financial-ratio: float-ok; z-score vs rolling window
    hedge_ratio: float  # financial-ratio: float-ok; β from rolling OLS
    cointegration_score: float  # financial-ratio: float-ok; [0, 1] Johansen trace
    half_life_bars: float  # time-based: float-ok; OU half-life
    ou_mean_reversion_speed: float  # financial-ratio: float-ok; theta from OU
    spread_velocity: Decimal  # first difference of spread — feeds into monetary spread calculations
    timestamp: int  # unix milliseconds


class VolSurfaceTermStructureRecord(BaseModel):
    """Output row from features-volatility-service (vol surface term structure).

    Computed from multi-expiry options chains. Fields represent ATM IV across
    tenor buckets (7d, 30d, 60d, 90d, 180d), delta-space IVs, skew, VRP,
    and percentile regime features.
    """

    venue: str
    underlying: str
    timestamp: int  # Unix milliseconds
    underlying_price: Decimal

    # ATM IV per expiry bucket
    atm_iv_7d: float | None = None  # volatility-pct: float-ok
    atm_iv_30d: float | None = None  # volatility-pct: float-ok
    atm_iv_60d: float | None = None  # volatility-pct: float-ok
    atm_iv_90d: float | None = None  # volatility-pct: float-ok
    atm_iv_180d: float | None = None  # volatility-pct: float-ok

    # Delta-space IVs (~30d bucket)
    call_25d_iv_30d: float | None = None  # volatility-pct: float-ok
    put_25d_iv_30d: float | None = None  # volatility-pct: float-ok
    call_10d_iv_30d: float | None = None  # volatility-pct: float-ok
    put_10d_iv_30d: float | None = None  # volatility-pct: float-ok

    # Derived surface metrics
    term_structure_slope: float | None = None  # financial-ratio: float-ok
    skew_25d_30d: float | None = None  # volatility-pct: float-ok; put_25d - call_25d
    skew_10d_30d: float | None = None  # volatility-pct: float-ok; put_10d - call_10d

    # Vol regime features
    atm_iv_percentile_252d: float | None = None  # financial-ratio: float-ok; [0, 1]
    vrp_30d: float | None = None  # volatility-pct: float-ok; realized_vol_20d - atm_iv_30d


class OnchainFeatureRecord(BaseModel):
    """Output row from features-onchain-service (DeFi/on-chain metrics).

    Represents a single on-chain feature observation for a DeFi instrument.
    instrument_key format: ``DEFI:PROTOCOL:TOKEN:CHAIN`` (e.g., ``DEFI:AAVE:USDC:ETHEREUM``).
    """

    timestamp: datetime
    instrument_key: str = Field(description="DEFI:PROTOCOL:TOKEN:CHAIN identifier")

    # DeFi lending / borrowing
    lending_rate: float | None = None  # financial-ratio: float-ok
    borrowing_rate: float | None = None  # financial-ratio: float-ok
    utilization_ratio: float | None = None  # financial-ratio: float-ok

    # Staking / yield
    staking_yield: float | None = None  # financial-ratio: float-ok
    reward_apy: float | None = None  # financial-ratio: float-ok

    # Liquidity
    tvl: Decimal | None = None
    available_liquidity: Decimal | None = None

    # Risk parameters
    ltv: float | None = Field(  # financial-ratio: float-ok
        default=None, description="Loan-to-value ratio"
    )
    liquidation_threshold: float | None = None  # financial-ratio: float-ok

    # Market state
    market_state: str | None = Field(
        default=None,
        description="normal, halted, auction, pre_market, post_market, closed",
    )
    is_halted: bool | None = None
    is_auction: bool | None = None


class LiquidationBandEntry(BaseModel):
    """Single leverage-tier band in a liquidation prediction snapshot."""

    leverage_tier: int = Field(description="Leverage multiple: 5, 10, 25, 50, 100")
    long_liq_price: Decimal = Field(description="Predicted long liquidation price")
    short_liq_price: Decimal = Field(description="Predicted short liquidation price")
    probability: float = Field(ge=0.0, le=1.0, description="P(leverage=tier) from model")
    estimated_long_usd: Decimal = Field(description="probability * OI allocation (long side)")
    estimated_short_usd: Decimal = Field(description="probability * OI allocation (short side)")
    maintenance_margin_rate: float = Field(
        ge=0.0, description="Venue maintenance margin rate for this tier"
    )

    @field_validator("leverage_tier")
    @classmethod
    def _validate_leverage_tier(cls, v: int) -> int:
        if v <= 0:
            raise ValueError(f"leverage_tier must be positive, got {v}")
        return v


class LiquidationBandPredictionSnapshot(BaseModel):
    """Full liquidation band prediction for an instrument at a point in time.

    Produced by features-cross-instrument-service LiquidationBandPredictionCalculator.
    Consumed by strategy-service for liquidation-aware position sizing and entry/exit.
    Each band represents a leverage tier with estimated liquidation prices and sizes.
    """

    instrument_key: str
    venue: str
    timestamp: datetime
    current_price: Decimal
    bands: list[LiquidationBandEntry]
    model_version: str = Field(description="Version identifier of the calibrated model")
    calibration_date: str = Field(description="ISO date when model was last calibrated")
    total_oi_usd: Decimal | None = Field(
        default=None, description="Total open interest in USD at prediction time"
    )

    def to_canonical_clusters(self) -> list[dict[str, object]]:
        """Convert bands to CanonicalLiquidationCluster-compatible dicts.

        Each band produces two cluster entries (long side and short side)
        with source='internal_prediction'.
        """
        clusters: list[dict[str, object]] = []
        for band in self.bands:
            clusters.append(
                {
                    "instrument_key": self.instrument_key,
                    "venue": self.venue,
                    "timestamp": self.timestamp,
                    "price_level": band.long_liq_price,
                    "long_liq_usd": band.estimated_long_usd,
                    "short_liq_usd": Decimal("0"),
                    "leverage_assumption": Decimal(str(band.leverage_tier)),
                    "cluster_strength": Decimal(str(round(band.probability, 6))),
                    "source": "internal_prediction",
                }
            )
            clusters.append(
                {
                    "instrument_key": self.instrument_key,
                    "venue": self.venue,
                    "timestamp": self.timestamp,
                    "price_level": band.short_liq_price,
                    "long_liq_usd": Decimal("0"),
                    "short_liq_usd": band.estimated_short_usd,
                    "leverage_assumption": Decimal(str(band.leverage_tier)),
                    "cluster_strength": Decimal(str(round(band.probability, 6))),
                    "source": "internal_prediction",
                }
            )
        return clusters
