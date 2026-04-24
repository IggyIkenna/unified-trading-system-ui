"""features-multi-timeframe-service internal domain contracts.

Canonical Pydantic schemas for the multi-timeframe features service output.

The parquet write enforcement descriptors (SchemaDefinition / ColumnSchema) remain
in the service package at:
  features_multi_timeframe_service/schemas/output_schemas.py

This module exposes the runtime data contracts consumed by downstream services
(strategy-service, ML services, etc.).
"""

from unified_internal_contracts.features import CrossTimeframeFeatures

__all__ = [
    "CrossTimeframeFeatures",
]
