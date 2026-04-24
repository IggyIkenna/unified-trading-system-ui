"""Audit trail schemas for financial and strategy compliance.

Machine-readable SSOT for audit requirements. Documentation in
unified-trading-codex/07-security/audit-logging.md references these schemas.
"""

from __future__ import annotations

from pydantic import BaseModel


class AuditRetention(BaseModel):
    """Data retention tiers for audit records."""

    hot_days: int = 90
    warm_days: int = 365
    cold_years: int = 3


class AuditRequirement(BaseModel):
    """Defines what must be logged for a given audit domain."""

    event_types: list[str]
    required_fields: list[str]
    retention: AuditRetention
    immutable: bool = True
    gcs_path_template: str


EXECUTION_AUDIT = AuditRequirement(
    event_types=[
        "ORDER_CREATED",
        "ORDER_UPDATED",
        "ORDER_CANCELLED",
        "ORDER_FILLED",
        "ORDER_REJECTED",
    ],
    required_fields=[
        "client_order_id",
        "exchange_timestamp",
        "venue_response_id",
        "fill_price",
        "fill_quantity",
    ],
    retention=AuditRetention(cold_years=7),
    gcs_path_template="audit/{client_id}/{date}/{event_type}/",
)

STRATEGY_AUDIT = AuditRequirement(
    event_types=["STRATEGY_INSTRUCTION", "SIGNAL_GENERATED"],
    required_fields=[
        "strategy_id",
        "client",
        "signal_source",
        "position_snapshot",
    ],
    retention=AuditRetention(cold_years=3),
    gcs_path_template="audit/{client_id}/{date}/strategy/",
)
