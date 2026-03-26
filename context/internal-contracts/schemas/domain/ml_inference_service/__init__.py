"""UIC domain module for ml-inference-service.

Cross-service contracts published by ml-inference-service and consumed by
strategy-service (and any future consumers) must live here, not in interface libs.

Canonical imports:
    from unified_api_contracts.internal.domain.ml_inference_service import (
        CascadeConfig,
        CascadePredictionEvent,
        PredictionSnapshot,
    )
"""

from unified_api_contracts.internal.domain.ml_inference_service.cascade_prediction import (
    CascadeConfig,
    CascadePredictionEvent,
    PredictionSnapshot,
)

__all__ = [
    "CascadeConfig",
    "CascadePredictionEvent",
    "PredictionSnapshot",
]
