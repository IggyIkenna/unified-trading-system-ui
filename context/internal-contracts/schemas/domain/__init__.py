"""
unified_internal_contracts.domain
==================================
Service domain data schemas — SSOT for all cross-repo data contracts that describe
the primary output shape of a service.

Layout rule (from schema_contracts_full_audit.md + SCHEMA_CONTRACTS_AUDIT.md):
  Each service that publishes a canonical domain schema gets its own subdirectory:

    unified_internal_contracts/domain/<service-name>/__init__.py

  Services NEVER define their own Pydantic/TypedDict/dataclass schemas. They
  import from this package (via unified-trading-library or unified-domain-client).

Permitted importers:
  - unified-trading-library (T1) — re-exports for service consumption
  - unified-domain-client (T3) — client-facing access layer
  - Any service (T4+) — via UTL or UDC only, never direct UIC import

NOT for:
  - SchemaDefinition / ColumnSchema objects — those are parquet write enforcement
    descriptors (infrastructure) and stay in the service. See UTL SchemaDefinition.
  - Raw venue API models — those belong in unified-api-contracts (UAC).

Status: directory scaffolded 2026-03-06. Service-specific subdirectories are added
as each service migrates its domain schemas per the remediation priority order in
SCHEMA_CONTRACTS_AUDIT.md Section 6.
"""

from unified_internal_contracts.domain.client_reporting import (
    DocumentCategory,
    DocumentMetadata,
    DocumentStatus,
)
from unified_internal_contracts.domain.data_quality import (
    VENUE_FRESHNESS_SLAS,
    VenueCategory,
    VenueFreshnessSLA,
    get_sla_for_venue,
    get_slas_by_category,
)

__all__ = [
    "VENUE_FRESHNESS_SLAS",
    "DocumentCategory",
    "DocumentMetadata",
    "DocumentStatus",
    "VenueCategory",
    "VenueFreshnessSLA",
    "get_sla_for_venue",
    "get_slas_by_category",
]
