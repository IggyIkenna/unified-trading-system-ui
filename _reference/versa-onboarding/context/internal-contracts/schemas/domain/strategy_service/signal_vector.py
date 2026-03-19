"""Signal vector and meta-signal schemas for strategy-service cross-service contracts.

SignalVectorRecord: structured 5D signal replacing scalar signal collapse.
MetaSignalRecord: output of meta-learning stack (LR or LightGBM over signal vector).
RegimeStateRecord: embedded 3-layer regime state (macro + intraday + micro).
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class RegimeStateRecord(BaseModel):
    """Embedded 3-layer regime state within a signal vector.

    Layer 1 (macro): daily HMM from features-cross-instrument-service.
    Layer 2 (intraday): 1h EWMA vol ratio from features-multi-timeframe-service.
    Layer 3 (micro): 1m vol spike from features-multi-timeframe-service.
    """

    # Layer 1 — macro (daily HMM, produced by features-cross-instrument-service)
    macro_state: int | None = None  # HMM state index (0-based)
    macro_prob: float | None = None  # Probability of macro_state [0, 1]
    time_in_regime: int | None = None  # Bars since last macro regime change
    changepoint_score: float | None = None  # Bayesian changepoint probability [0, 1]
    macro_volatility: float | None = None  # Regime-level realized vol (annualized)

    # Layer 2 — intraday (1h, produced by features-multi-timeframe-service)
    intraday_state: str | None = None  # TRENDING | MEAN_REVERTING | COMPRESSED | DISLOCATED
    intraday_confidence: float | None = None  # Regime classification confidence [0, 1]
    hours_in_intraday_regime: int | None = None
    ewma_vol_ratio: float | None = None  # fast EWMA vol / slow EWMA vol (span 12/48)

    # Layer 3 — micro (1m, produced by features-multi-timeframe-service)
    micro_state: str | None = None  # NORMAL | VOL_SPIKE | MOMENTUM_BURST | STRESS
    microstructure_stress: float | None = None  # composite stress score [0, 1]

    # Composite gating flags (set by HierarchicalRegimeCombiner)
    strategy_allowed: bool | None = None  # macro_state is valid for strategy
    size_allowed: bool | None = None  # intraday != DISLOCATED
    entry_allowed: bool | None = None  # micro in {NORMAL, MOMENTUM_BURST}
    composite_score: float | None = None  # 0.5*macro_prob + 0.3*intraday_conf + 0.2*(1-stress)


class SignalVectorRecord(BaseModel):
    """Structured 5D signal vector replacing scalar signal collapse.

    Produced by strategy-service SignalVectorAssembler. Each dimension is
    computed from an orthogonal feature set to avoid feature reuse:
    - direction_signal: fundamentals + regime only (NO vol features)
    - vol_signal: VRP + skew + kurtosis only (NO price-direction features)
    - timing_signal: session context + liquidity + vol compression
    - sizing_confidence: regime certainty * data quality score

    source_features_used tracks which base feature names were consumed,
    enabling MetaFeatureOrthogonalityChecker to enforce no reuse in meta-model.
    """

    timestamp: datetime
    instrument_id: str

    # Core signal dimensions — orthogonal by construction
    direction_signal: float = Field(
        ge=-1.0, le=1.0, description="Fundamentals/regime directional bias. NO vol features."
    )
    vol_signal: float = Field(
        ge=-1.0,
        le=1.0,
        description="Vol dynamics: VRP, skew, kurtosis. NO price-direction features.",
    )
    timing_signal: float = Field(
        ge=0.0, le=1.0, description="Entry quality: session overlap, liquidity, vol compression."
    )
    sizing_confidence: float = Field(
        ge=0.0, le=1.0, description="Regime certainty * data quality score."
    )

    # Embedded 3-layer regime state
    regime_state: RegimeStateRecord = Field(default_factory=RegimeStateRecord)

    # Orthogonality tracking — consumed by MetaFeatureOrthogonalityChecker
    source_features_used: list[str] = Field(
        default_factory=list,
        description=(
            "Base feature names consumed during assembly. Used to enforce meta-model orthogonality."
        ),
    )

    # Sub-component breakdowns (for explainability and debugging)
    direction_subcomponents: dict[str, float] = Field(
        default_factory=dict,
        description=(
            "Named components contributing to direction_signal"
            " (e.g. cascade_confidence_score, cot_net)."
        ),
    )
    vol_subcomponents: dict[str, float] = Field(
        default_factory=dict,
        description=(
            "Named components contributing to vol_signal"
            " (e.g. vrp_z_score_252d, skew_25d, kurtosis_20)."
        ),
    )


class MetaSignalRecord(BaseModel):
    """Output of the meta-learning stack over a SignalVectorRecord.

    Produced by ml-inference-service MetaSignalInferenceEngine.
    Default model: Logistic Regression — coefficients ARE signal_weights (interpretable).
    Fallback: LightGBM (max_depth=3) when LR AUC < 0.52 on validation set.
    Equal-weight fallback when no trained model is available.

    meta_signal maps LR probability output [0, 1] to [-1, 1]:
        meta_signal = (proba - 0.5) * 2
    """

    timestamp: datetime
    instrument_id: str

    meta_signal: float = Field(
        ge=-1.0, le=1.0, description="Weighted combination of signal vector components."
    )
    meta_confidence: float = Field(
        ge=0.0, le=1.0, description="Model confidence in meta_signal direction."
    )

    # Learned weights over signal vector dimensions (from LR coefficients or SHAP)
    signal_weights: dict[str, float] = Field(
        description=(
            "Weight per signal dimension: direction, vol, timing, sizing."
            " Sums approx 1.0 after rescaling."
        )
    )

    # Fallback tracking
    is_fallback_equal_weight: bool = Field(
        default=False,
        description=(
            "True when no trained model loaded;"
            " equal-weight {direction:0.4, vol:0.3, timing:0.2, sizing:0.1}."
        ),
    )
    meta_model_version: str = Field(
        default="", description="Version tag of the deployed meta-model artifact."
    )
