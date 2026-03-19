"""Internal ML schemas — model metadata, inference requests/responses, training jobs."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


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


class ModelType(StrEnum):
    LIGHTGBM = "lightgbm"
    XGBOOST = "xgboost"
    RANDOM_FOREST = "random_forest"
    NEURAL_NET = "neural_net"
    LINEAR = "linear"
    ENSEMBLE = "ensemble"


class TrainingPeriod(BaseModel):
    start: str = Field(description="ISO date string YYYY-MM-DD")
    end: str = Field(description="ISO date string YYYY-MM-DD")


class HyperparameterConfig(BaseModel):
    """LightGBM hyperparameter configuration.

    Canonical SSOT for training hyperparameters shared across ml-training-service,
    ml-inference-service, and unified-ml-interface. to_dict() produces the params
    dict consumed directly by lightgbm.train().
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


class ModelVariantConfig(BaseModel):
    """Config for a single model variant in the training grid (ModelVariantConfig)."""

    instrument_id: str
    timeframe: str
    lookback_window: int
    target_type: TargetType
    std_dev_threshold: float
    breakout_threshold: float


class ModelMetadata(BaseModel):
    """Full metadata record stored in GCS after a training run (ModelMetadata.to_dict())."""

    model_id: str
    model_version: str
    instrument_id: str
    symbol: str
    category: str
    timeframe: str
    lookback_window: int
    target_type: TargetType
    std_dev_threshold: float
    breakout_threshold: float
    model_type: ModelType
    feature_count: int
    feature_names: str = Field(description="comma-separated feature names")
    hyperparameters: str = Field(description="JSON-serialised dict")
    performance_metrics: str = Field(description="JSON-serialised dict")
    training_timestamp: str = Field(description="ISO 8601 UTC")
    training_duration_seconds: float
    training_period_start: str | None = None
    training_period_end: str | None = None


class MLConfigDict(BaseModel):
    """Full config dict for a model (MLConfigDict TypedDict converted to model)."""

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
    lookback_window: int
    description: str = ""
    grid_metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)


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
