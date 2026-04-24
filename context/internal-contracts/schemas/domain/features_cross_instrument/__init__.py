"""features-cross-instrument-service internal domain contracts.

Canonical Pydantic schemas for the cross-instrument features service output.

The parquet write enforcement descriptors (SchemaDefinition / ColumnSchema) remain
in the service package at:
  features_cross_instrument_service/schemas/output_schemas.py

This module exposes the runtime data contracts consumed by downstream services
(strategy-service, ML services, etc.).
"""

from unified_internal_contracts.features import CrossInstrumentFeatures, PairSpreadFeatureRecord

__all__ = [
    "CrossInstrumentFeatures",
    "PairSpreadFeatureRecord",
]
