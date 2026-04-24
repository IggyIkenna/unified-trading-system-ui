"""Internal ML schemas — model metadata, inference requests/responses, training jobs.

Includes the uniform 5+1 phase training pipeline, multi-model-type hyperparameters,
ensemble configuration, and sports target types.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, Field, model_validator


class TargetType(StrEnum):
    DIRECTION = "direction"
    RETURN = "return"
    VOLATILITY = "volatility"
    REGIME = "regime"
    SPREAD = "spread"
    SIGNAL = "signal"
    SWING_HIGH = "swing_high"
    SWING_LOW = "swing_low"
    CROSS_VENUE_SPREAD = "cross_venue_spread"
    # Sports targets
    CLV = "clv"
    XG = "xg"
    HT_DELTA = "ht_delta"
    CLV_META = "clv_meta"
    XG_META = "xg_meta"


class ModelType(StrEnum):
    LIGHTGBM = "lightgbm"
    XGBOOST = "xgboost"
    RANDOM_FOREST = "random_forest"
    NEURAL_NET = "neural_net"
    LINEAR = "linear"
    ENSEMBLE = "ensemble"
    # Additional model types for sports/ensemble pipelines
    CATBOOST = "catboost"
    HUBER = "huber"
    POISSON_GLM = "poisson_glm"
    RIDGE = "ridge"


class TrainingPhase(StrEnum):
    """Uniform training pipeline phase — each phase is a separate batch deployment.

    Phases 1-3 always run. Phases 4-5 are optional (multi_model=True).
    Phase 6 is optional (pipeline_dependencies specified).
    """

    FEATURE_SELECTION = "feature_selection"
    HYPERPARAMETER_TUNING = "hyperparameter_tuning"
    BASE_RESULTS = "base_results"
    META_LEARNING = "meta_learning"
    META_RESULTS = "meta_results"
    CROSS_PIPELINE = "cross_pipeline"


class TrainingPeriod(BaseModel):
    start: str = Field(description="ISO date string YYYY-MM-DD")
    end: str = Field(description="ISO date string YYYY-MM-DD")


# ---------------------------------------------------------------------------
# Per-model-type hyperparameter configs (discriminated union)
# ---------------------------------------------------------------------------


class LightGBMHyperparams(BaseModel):
    """LightGBM hyperparameters. to_dict() produces the params dict for lgb.train()."""

    model_type: Literal["lightgbm"] = "lightgbm"
    num_leaves: int = 31
    max_depth: int = -1
    learning_rate: float = 0.05
    feature_fraction: float = 1.0
    bagging_fraction: float = 1.0
    bagging_freq: int = 0
    min_child_samples: int = 20
    lambda_l1: float = 0.0
    lambda_l2: float = 0.0
    n_estimators: int = 100
    objective: str = "multiclass"
    num_class: int = 3
    verbosity: int = -1

    def to_dict(self) -> dict[str, object]:
        """Return a lightgbm-compatible params dict (excludes model_type)."""
        d = self.model_dump()
        d.pop("model_type", None)
        return d


class XGBoostHyperparams(BaseModel):
    """XGBoost hyperparameters."""

    model_type: Literal["xgboost"] = "xgboost"
    max_depth: int = 6
    learning_rate: float = 0.1
    n_estimators: int = 100
    subsample: float = 0.8
    colsample_bytree: float = 0.8
    min_child_weight: int = 1
    reg_alpha: float = 0.0
    reg_lambda: float = 1.0
    objective: str = "multi:softprob"
    num_class: int = 3
    verbosity: int = 0

    def to_dict(self) -> dict[str, object]:
        d = self.model_dump()
        d.pop("model_type", None)
        return d


class CatBoostHyperparams(BaseModel):
    """CatBoost hyperparameters."""

    model_type: Literal["catboost"] = "catboost"
    depth: int = 6
    learning_rate: float = 0.03
    iterations: int = 1000
    l2_leaf_reg: float = 3.0
    bagging_temperature: float = 1.0
    random_strength: float = 1.0
    border_count: int = 254
    verbose: int = 0

    def to_dict(self) -> dict[str, object]:
        d = self.model_dump()
        d.pop("model_type", None)
        return d


class HuberHyperparams(BaseModel):
    """Huber regression hyperparameters (sklearn.linear_model.HuberRegressor)."""

    model_type: Literal["huber"] = "huber"
    max_iter: int = 5000
    alpha: float = 0.1
    epsilon: float = 1.35
    tol: float = 1e-5

    def to_dict(self) -> dict[str, object]:
        d = self.model_dump()
        d.pop("model_type", None)
        return d


class PoissonGLMHyperparams(BaseModel):
    """Poisson GLM hyperparameters (sklearn.linear_model.PoissonRegressor)."""

    model_type: Literal["poisson_glm"] = "poisson_glm"
    alpha: float = 0.1
    max_iter: int = 300
    tol: float = 1e-4

    def to_dict(self) -> dict[str, object]:
        d = self.model_dump()
        d.pop("model_type", None)
        return d


class RidgeHyperparams(BaseModel):
    """Ridge regression hyperparameters (sklearn.linear_model.Ridge)."""

    model_type: Literal["ridge"] = "ridge"
    alpha: float = 1.0
    max_iter: int = 1000
    tol: float = 1e-4

    def to_dict(self) -> dict[str, object]:
        d = self.model_dump()
        d.pop("model_type", None)
        return d


AnyHyperparameterConfig = Annotated[
    LightGBMHyperparams
    | XGBoostHyperparams
    | CatBoostHyperparams
    | HuberHyperparams
    | PoissonGLMHyperparams
    | RidgeHyperparams,
    Field(discriminator="model_type"),
]
"""Discriminated union of all hyperparameter configs. Use this as a field type
in Pydantic models that need to accept any model type's hyperparameters."""


class HyperparameterConfig(BaseModel):
    """Backward-compatible wrapper — defaults to LightGBM hyperparameters.

    Existing code that constructs HyperparameterConfig(num_leaves=31, ...) still works.
    New code should use the specific classes (LightGBMHyperparams, etc.) directly.
    """

    num_leaves: int = 31
    max_depth: int = -1
    learning_rate: float = 0.05
    feature_fraction: float = 1.0
    bagging_fraction: float = 1.0
    bagging_freq: int = 0
    min_child_samples: int = 20
    lambda_l1: float = 0.0
    lambda_l2: float = 0.0
    objective: str = "multiclass"
    num_class: int = 3
    verbosity: int = -1

    def to_dict(self) -> dict[str, object]:
        """Return a lightgbm-compatible params dict."""
        return self.model_dump()

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> HyperparameterConfig:
        """Build from a plain dict, ignoring unknown keys and using defaults for missing ones."""
        known = {k: v for k, v in data.items() if k in cls.model_fields and v is not None}
        return cls.model_validate(known)


# ---------------------------------------------------------------------------
# Ensemble configuration
# ---------------------------------------------------------------------------


class EnsembleMember(BaseModel):
    """One model in an ensemble with its weight and hyperparameters."""

    model_type: ModelType
    weight: float = Field(
        ge=0.0, le=1.0, description="Weight in [0, 1]. All weights should sum to 1."
    )
    hyperparameters: AnyHyperparameterConfig


class EnsembleConfig(BaseModel):
    """Configuration for a weighted ensemble of heterogeneous models.

    Used by EnsembleTrainer in ml-training-service. Supports optional stacking
    via a meta-model trained on base model predictions.
    """

    members: list[EnsembleMember] = Field(min_length=2)
    stacking_enabled: bool = False
    meta_model_type: ModelType | None = None
    meta_model_hyperparameters: AnyHyperparameterConfig | None = None


# ---------------------------------------------------------------------------
# Uniform training pipeline configuration
# ---------------------------------------------------------------------------


class TrainingPipelineConfig(BaseModel):
    """Asset-class-agnostic configuration for the uniform 5+1 phase training pipeline.

    Drives everything from feature selection through meta-learning. Each phase
    is a separate batch deployment instance. The pipeline code is identical
    across TradFi, CeFi, DeFi, and Sports — only this config differs.
    """

    # --- Identity ---
    pipeline_id: str = Field(description="e.g. 'sports-odds-drift', 'cefi-btc-swing'")
    category: str = Field(description="cefi, tradfi, defi, or sports")
    asset: str = Field(description="BTC, SPY, FOOTBALL, etc.")
    target_type: TargetType

    # --- Task type ---
    task_type: Literal["regression", "classification"] = "classification"

    # --- Phase control ---
    multi_model: bool = Field(
        default=False,
        description=(
            "False = 3-phase (stop at BASE_RESULTS). "
            "True = 5-phase (include META_LEARNING + META_RESULTS)."
        ),
    )

    # --- Phase 1: Feature selection ---
    feature_selection_method: str = "shap"
    feature_selection_threshold: float = 0.01
    feature_subscriptions: list[str] = Field(
        default_factory=list,
        description="Feature service topics/tables to consume",
    )

    # --- Phase 2: Hyperparameter tuning ---
    walk_forward_folds: int = 5
    train_test_ratio: float = 0.8
    split_strategy: Literal["date", "season"] = "date"
    gap_days: int = 1
    tuning_method: str = "optuna"

    # --- Phase 3: Base results ---
    selection_metric: str = "accuracy"
    validation_granularity: Literal["seasonal", "quarterly", "monthly", "yearly"] = "quarterly"

    # --- Base model config ---
    base_model_type: ModelType = ModelType.LIGHTGBM
    base_hyperparameters: AnyHyperparameterConfig = Field(
        default_factory=LightGBMHyperparams,
    )
    ensemble_config: EnsembleConfig | None = Field(
        default=None,
        description="If set, trains an ensemble instead of a single base model",
    )

    # --- Phase 4-5: Meta-learning (requires multi_model=True) ---
    meta_input_strategy: Literal["residual", "signal_vector"] = "residual"
    meta_model_type: ModelType = ModelType.RIDGE
    meta_model_hyperparameters: AnyHyperparameterConfig = Field(
        default_factory=RidgeHyperparams,
    )

    # --- Phase 6: Cross-pipeline (optional) ---
    pipeline_dependencies: list[str] | None = Field(
        default=None,
        description=(
            "Pipeline IDs whose outputs become features for this pipeline's cross-pipeline phase"
        ),
    )

    # --- Sports-specific ---
    pool_horizons: bool = Field(
        default=True,
        description=(
            "Sports: train one base model across all time "
            "horizons with minutes_to_kickoff as feature"
        ),
    )
    time_horizons: list[str] = Field(
        default_factory=list,
        description=(
            "Sports fixture-relative horizons: "
            "['T-24h', 'T-12h', 'T-6h', 'T-3h', 'T-15m', 'T-0', 'HT']"
        ),
    )
    competition_phase_filter: list[str] = Field(
        default_factory=lambda: ["NORMAL_LEAGUE"],
        description="Sports: filter training data to these competition phases",
    )
    lineup_known_cutoff_minutes: int = Field(
        default=45,
        description=(
            "Sports: conservative cutoff for when lineup is "
            "considered known (minutes before kickoff)"
        ),
    )

    # --- TradFi-specific ---
    market_hours_filter: bool = Field(
        default=False,
        description="TradFi: filter rows where market is closed",
    )

    # --- Evaluation ---
    evaluation_metrics: list[str] = Field(
        default_factory=lambda: ["accuracy", "f1"],
        description=(
            "Metrics to compute. Sports: ['poisson_nll', 'rps', 'brier']. "
            "Financial: ['accuracy', 'f1', 'auc']"
        ),
    )

    # --- Scheduling ---
    retrain_interval: str = Field(
        default="3M",
        description="How often to re-run the pipeline: '1M', '3M', '6M', '1Y'",
    )

    @model_validator(mode="after")
    def _validate_meta_requires_multi(self) -> TrainingPipelineConfig:
        if self.pipeline_dependencies and not self.multi_model:
            pass  # cross-pipeline doesn't strictly require multi_model
        return self


_FLAT_TARGET_KEYS = ("swing_lookback_window", "std_dev_threshold", "breakout_threshold")


def _migrate_flat_to_target_params(values: dict[str, object]) -> dict[str, object]:
    """Move legacy flat swing fields into target_params dict."""
    if "lookback_window" in values and "swing_lookback_window" not in values:
        values["swing_lookback_window"] = values.pop("lookback_window")
    tp = values.get("target_params")
    if not tp or not isinstance(tp, dict):
        tp = {}
    for key in _FLAT_TARGET_KEYS:
        if key in values:
            tp.setdefault(key, values.pop(key))
    if tp:
        values["target_params"] = tp
    return values


class ModelVariantConfig(BaseModel):
    """Config for a single model variant in the training grid.

    Target-type-specific parameters live in ``target_params``.
    See domain/ml/schemas.py ModelVariantConfig for full docstring.
    """

    instrument_id: str
    timeframe: str
    target_type: TargetType
    target_params: dict[str, int | float | str | bool] = Field(
        default_factory=dict,
        description="Target-type-specific parameters (e.g. swing_lookback_window for swing_high)",
    )

    def get_target_param(
        self, key: str, default: int | float | str | bool = 0
    ) -> int | float | str | bool:
        """Get a target-type-specific parameter with a default fallback."""
        return self.target_params.get(key, default)

    @model_validator(mode="before")
    @classmethod
    def _compat_flat_to_target_params(cls, values: dict[str, object]) -> dict[str, object]:
        """Backwards compat: migrate flat swing fields into target_params."""
        if not isinstance(values, dict):
            return values
        return _migrate_flat_to_target_params(values)


class ModelMetadata(BaseModel):
    """Full metadata record stored in GCS after a training run."""

    model_id: str
    model_version: str
    instrument_id: str
    symbol: str
    category: str
    timeframe: str
    target_type: TargetType
    target_params: dict[str, int | float | str | bool] = Field(
        default_factory=dict,
        description="Target-type-specific parameters from the variant config",
    )
    model_type: ModelType
    feature_count: int
    feature_names: str = Field(description="comma-separated feature names")
    hyperparameters: str = Field(description="JSON-serialised dict")
    performance_metrics: str = Field(description="JSON-serialised dict")
    training_timestamp: str = Field(description="ISO 8601 UTC")
    training_duration_seconds: float
    training_period_start: str | None = None
    training_period_end: str | None = None

    @model_validator(mode="before")
    @classmethod
    def _compat_flat_to_target_params(cls, values: dict[str, object]) -> dict[str, object]:
        """Backwards compat: migrate flat swing fields into target_params."""
        if not isinstance(values, dict):
            return values
        return _migrate_flat_to_target_params(values)


class MLConfigDict(BaseModel):
    """Full config dict for a model."""

    model_id: str
    model_version: str
    category: str
    asset: str
    target_type: TargetType
    model_type: ModelType
    timeframe: str
    features_config: dict[str, str | int | float | bool | list[str] | None]
    hyperparameters: dict[str, str | int | float | bool | None]
    training_period: TrainingPeriod
    training_cutoff_date: str
    performance_metrics: dict[str, float]
    feature_names: list[str]
    target_params: dict[str, int | float | str | bool] = Field(
        default_factory=dict,
        description="Target-type-specific parameters",
    )
    description: str = ""
    grid_metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)

    @model_validator(mode="before")
    @classmethod
    def _compat_flat_to_target_params(cls, values: dict[str, object]) -> dict[str, object]:
        """Backwards compat: migrate flat swing fields into target_params."""
        if not isinstance(values, dict):
            return values
        return _migrate_flat_to_target_params(values)


class InferenceRequest(BaseModel):
    """Request sent to ml-inference-service for a single prediction."""

    request_id: str = ""
    model_id: str = ""
    instrument_id: str
    timestamp: datetime | None = None
    features: dict[str, float | int | bool | None] = Field(default_factory=dict)
    timeframe: str = "1h"
    target_type: str = "swing_high"
    model_version: str | None = None


class InferenceResult(BaseModel):
    """Prediction output from ml-inference-service."""

    request_id: str
    model_id: str
    instrument_id: str
    timestamp: datetime
    prediction: float
    confidence: float | None = None
    target_type: str = "swing_high"
    feature_importance: dict[str, float] | None = None
    latency_ms: float | None = None
    model_version: str | None = None
    probabilities: list[float] | None = None
    timeframe: str | None = None
    metadata: dict[str, object] | None = None


class TrainingJobRequest(BaseModel):
    """Request to kick off a training run in ml-training-service."""

    job_id: str
    job_config: MLConfigDict
    training_data_path: str
    output_path: str
    triggered_by: str = "scheduled"
    triggered_at: datetime | None = None
    priority: int = 5


class TrainingJobResult(BaseModel):
    """Outcome of a training job."""

    job_id: str
    model_id: str
    model_version: str
    status: str
    started_at: datetime
    completed_at: datetime | None = None
    model_path: str | None = None
    metadata: ModelMetadata | None = None
    error: str | None = None


class CrossValidationResult(BaseModel):
    """Results from a cross-validation run during model training.

    Captures per-fold metrics and aggregate statistics for walk-forward
    cross-validation runs in ml-training-service.
    """

    model_id: str
    model_version: str
    instrument_id: str
    target_type: TargetType
    timeframe: str
    n_folds: int
    fold_metrics: list[dict[str, float]] = Field(
        description="Per-fold metric dicts (accuracy, f1, precision, recall, etc.)",
        default_factory=list,
    )
    mean_accuracy: float | None = None
    std_accuracy: float | None = None
    mean_f1: float | None = None
    std_f1: float | None = None
    completed_at: datetime | None = None
    training_duration_seconds: float | None = None


class ModelDegradationAlert(BaseModel):
    """Alert emitted when a deployed model's live performance degrades below threshold.

    Published to PubSub by ml-inference-service when rolling accuracy or
    calibration metrics drop below configured thresholds. Consumed by
    alerting-service for operator notification and circuit-breaker logic.
    """

    alert_id: str
    model_id: str
    model_version: str
    instrument_id: str
    target_type: TargetType
    timeframe: str
    metric_name: str = Field(description="Degraded metric (e.g. accuracy, f1, calibration_error)")
    current_value: float
    threshold_value: float
    baseline_value: float | None = None
    window_size_hours: int = Field(
        default=24,
        description="Rolling window size in hours used to compute current_value",
    )
    severity: str = Field(
        default="warning",
        description="Alert severity: warning | critical",
    )
    detected_at: datetime
    details: dict[str, float | str | int | None] = Field(default_factory=dict)


class MLModelScorecard(BaseModel):
    """Standardized model performance metrics emitted by ml-training-service.

    Cross-service contract consumed by ml-inference-service (model selection),
    alerting-service (degradation monitoring), and trading-analytics-api (dashboards).
    """

    model_id: str
    instrument_id: str
    timeframe: str
    target_type: str  # swing_high, swing_low, direction, etc.
    # Classification metrics
    accuracy: float = 0.0
    precision_class_0: float = 0.0
    precision_class_1: float = 0.0
    precision_class_2: float = 0.0
    recall_class_0: float = 0.0
    recall_class_1: float = 0.0
    recall_class_2: float = 0.0
    f1_macro: float = 0.0
    f1_weighted: float = 0.0
    auc_roc: float = 0.0
    # Feature importance
    top_features: list[str] = Field(default_factory=list)
    feature_count: int = 0
    # Training metadata
    train_samples: int = 0
    test_samples: int = 0
    training_duration_seconds: float = 0.0
    trained_at: datetime | None = None
    # Validation
    walk_forward_sharpe: float = 0.0
    out_of_sample_accuracy: float = 0.0


class MLPrediction(BaseModel):
    """Standardized prediction output from ml-inference-service.

    Cross-service contract consumed by strategy-service (signal generation)
    and execution-service (order routing decisions).
    """

    prediction_id: str
    model_id: str
    instrument_id: str
    timeframe: str
    timestamp: datetime
    predicted_class: int  # 0=neither, 1=breakout, 2=reversion
    confidence: float = Field(ge=0.0, le=1.0)
    class_probabilities: dict[str, float] = Field(default_factory=dict)
    features_used: int = 0


class BackfillSpec(BaseModel):
    """Per-service lookback requirements for transitioning from batch to live.

    When a service starts in live mode, it needs historical data to warm up
    indicators, ML models, etc. This spec declares what each service needs.
    Cross-service contract used by deployment-service (orchestration) and
    execution-service (readiness checks).
    """

    service_name: str
    min_lookback_days: int = Field(..., description="Minimum history needed")
    recommended_lookback_days: int = Field(..., description="Recommended for full accuracy")
    required_upstream_services: list[str] = Field(default_factory=list)
    warm_up_features: list[str] = Field(default_factory=list, description="Feature groups needed")
    can_start_cold: bool = Field(default=False, description="Can start without history (degraded)")
