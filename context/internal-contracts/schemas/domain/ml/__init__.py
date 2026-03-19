"""Shared ML domain schemas for ml-training-service and ml-inference-service."""

from unified_internal_contracts.domain.ml.schemas import (
    CrossValidationResult,
    HyperparameterConfig,
    InferenceRequest,
    InferenceResult,
    MLConfigDict,
    ModelDegradationAlert,
    ModelMetadata,
    ModelType,
    ModelVariantConfig,
    TargetType,
    TrainingJobRequest,
    TrainingJobResult,
    TrainingPeriod,
)

__all__ = [
    "CrossValidationResult",
    "HyperparameterConfig",
    "InferenceRequest",
    "InferenceResult",
    "MLConfigDict",
    "ModelDegradationAlert",
    "ModelMetadata",
    "ModelType",
    "ModelVariantConfig",
    "TargetType",
    "TrainingJobRequest",
    "TrainingJobResult",
    "TrainingPeriod",
]
