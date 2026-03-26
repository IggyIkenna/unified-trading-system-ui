"""Cascade multi-timeframe prediction schemas.

Published by ml-inference-service CascadeInferenceMode.
Consumed by strategy-service (cascade_subscriber.py, signal_vector/assembler.py).

Cross-service contract SSOT: this module.

Both ml-inference-service and strategy-service must import CascadeConfig,
CascadePredictionEvent, and PredictionSnapshot from this module's package
(unified_api_contracts.internal.domain.ml_inference_service).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime


@dataclass
class PredictionSnapshot:
    """Summary of a single-TF prediction event, stored in PredictionCache."""

    instrument_id: str
    timeframe: str
    direction: int  # -1 = reversion, 0 = neither, 1 = breakout
    confidence: float  # Model probability for the predicted class [0, 1]
    model_id: str
    predicted_at: datetime


@dataclass
class CascadeConfig:
    """Runtime-configurable cascade profile stored in ConfigStore.

    Named profiles are switchable without redeploy.
    """

    profile_name: str  # e.g. "momentum_cascade"
    trigger_timeframe: str  # TF that fires the cascade check, e.g. "1h"
    context_timeframes: list[str]  # Higher-TF context to check, e.g. ["1d", "4h"]
    entry_timeframes: list[str]  # Drill-down TFs for entry timing, e.g. ["15m", "5m"]
    confidence_threshold: float = 0.6  # Min cascade_confidence to publish event
    require_context_alignment: bool = True  # All context TFs must agree on direction


@dataclass
class CascadePredictionEvent:
    """Multi-timeframe composite prediction event published by CascadeInferenceMode.

    Consumed by strategy-service instead of individual per-TF PredictionEvents.
    strategy-service uses cascade_confidence_score and cascade_aligned directly
    without re-implementing cross-TF logic.
    """

    instrument_id: str
    profile_name: str  # Which CascadeConfig fired this event
    trigger_timeframe: str  # The TF that triggered the cascade check
    trigger_direction: int  # Direction from trigger model (-1/0/1)
    trigger_confidence: float  # Confidence from trigger model [0,1]
    context: dict[str, PredictionSnapshot]  # {timeframe: snapshot} for context TFs
    cascade_confidence_score: float  # Weighted combination of context + trigger
    cascade_aligned: bool  # True if all context TFs agree with trigger direction
    recommended_entry_timeframes: list[str]  # Drill-down TFs for optimal entry
    published_at: datetime = field(default_factory=lambda: datetime.now(UTC))
