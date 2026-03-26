"""features-onchain-service internal domain contracts.

Canonical Pydantic schemas for the on-chain features service output.

The parquet write enforcement descriptors (SchemaDefinition / ColumnSchema) remain
in the service package at:
  features_onchain_service/schemas/output_schemas.py

This module exposes the runtime data contracts consumed by downstream services
(strategy-service, ML services, etc.).
"""

from unified_api_contracts.internal.features import OnchainFeatureRecord

__all__ = [
    "OnchainFeatureRecord",
]
