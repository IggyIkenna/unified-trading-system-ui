"""Reconciliation resolution schemas — cross-service contract.

Used by position-balance-monitor-service and batch-live-reconciliation-service
to persist break resolutions and by the UI reporting API to submit operator
decisions.

Includes:
- Resolution workflow types (ReconciliationAction, ReconciliationResolution)
- Deviation lifecycle state machine (DeviationState, DeviationStatus, DeviationType)
- Balance reconciliation snapshots (BalanceReconciliationSnapshot, BalanceReconciliationStatus)
- PnL reconciliation snapshots (PnLReconciliationSnapshot)
- Auto-reconciliation reasons (AutoReconcileReason)
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Resolution workflow
# ---------------------------------------------------------------------------


class ReconciliationAction(StrEnum):
    """Operator action on a reconciliation break."""

    ACCEPT = "accept"
    """Expected divergence (timing, rounding) — no correction needed."""

    REJECT = "reject"
    """Error requiring correction — triggers book-correction flow."""

    INVESTIGATE = "investigate"
    """Needs further analysis before resolution."""


class ReconciliationResolution(BaseModel):
    """Operator resolution of a reconciliation break.

    Persisted to the audit log for FCA compliance. When action is REJECT,
    the correcting_instruction_id links to the manual booking that corrects
    the break.
    """

    break_id: str
    action: ReconciliationAction
    note: str = Field(min_length=10)
    resolved_by: str
    correcting_instruction_id: str | None = None


# ---------------------------------------------------------------------------
# Auto-reconciliation reasons
# ---------------------------------------------------------------------------


class AutoReconcileReason(StrEnum):
    """Reason why a deviation was automatically reconciled without human action."""

    FEE_ROUNDING = "fee_rounding"
    """Exchange fee rounding difference below threshold."""

    MARGIN_INTEREST = "margin_interest"
    """Margin interest accrual difference below threshold."""

    EXCHANGE_FEE_ADJUSTMENT = "exchange_fee_adjustment"
    """Exchange-side fee adjustment (rebate, tier change)."""

    TIMING_DIFFERENCE = "timing_difference"
    """Transient timing difference that resolved itself."""

    STAKING_REWARD = "staking_reward"
    """Staking reward accrual not yet reflected locally."""

    FUNDING_RATE_ACCRUAL = "funding_rate_accrual"
    """Funding rate payment accrual difference."""


# ---------------------------------------------------------------------------
# Deviation lifecycle state machine
# ---------------------------------------------------------------------------


class DeviationType(StrEnum):
    """Type of reconciliation deviation."""

    POSITION = "position"
    BALANCE = "balance"
    PNL = "pnl"


class DeviationStatus(StrEnum):
    """Lifecycle status of a deviation.

    Flow: TRANSIENT → CONFIRMED → (AUTO_RECONCILED | ESCALATED) → RESOLVED
    """

    TRANSIENT = "transient"
    """Deviation just detected; waiting for confirmation threshold."""

    CONFIRMED = "confirmed"
    """Deviation persisted beyond confirmation threshold (e.g. 30s)."""

    AUTO_RECONCILED = "auto_reconciled"
    """Small deviation auto-accepted (fee rounding, interest, etc.)."""

    ESCALATED = "escalated"
    """Large deviation sent to human attention."""

    RESOLVED = "resolved"
    """Human operator resolved via accept/reject/investigate."""


class DeviationState(BaseModel):
    """State of a single reconciliation deviation through its lifecycle.

    Tracks a discrepancy between internal and exchange values from first
    detection through confirmation, auto-reconciliation or escalation,
    to final resolution.
    """

    deviation_id: str
    instrument: str
    venue: str
    deviation_type: DeviationType
    internal_value: Decimal
    exchange_value: Decimal
    discrepancy: Decimal
    discrepancy_pct: Decimal
    first_seen: datetime
    last_seen: datetime
    confirmed_at: datetime | None = None
    status: DeviationStatus = DeviationStatus.TRANSIENT
    resolution: ReconciliationAction | None = None
    resolution_note: str | None = None
    resolved_by: str | None = None
    auto_reconcile_reason: AutoReconcileReason | None = None


# ---------------------------------------------------------------------------
# Balance reconciliation
# ---------------------------------------------------------------------------


class BalanceReconciliationStatus(StrEnum):
    """Classification of a balance reconciliation result."""

    MATCH = "match"
    DISCREPANCY = "discrepancy"
    CRITICAL = "critical"


class BalanceReconciliationSnapshot(BaseModel):
    """Result of comparing internal vs exchange balance for a single currency."""

    venue: str
    currency: str
    timestamp: datetime
    internal_free: Decimal
    internal_locked: Decimal
    internal_total: Decimal
    exchange_free: Decimal
    exchange_locked: Decimal
    exchange_total: Decimal
    discrepancy_free: Decimal
    discrepancy_locked: Decimal
    discrepancy_total: Decimal
    discrepancy_pct: Decimal
    status: BalanceReconciliationStatus


# ---------------------------------------------------------------------------
# PnL reconciliation
# ---------------------------------------------------------------------------


class PnLReconciliationSnapshot(BaseModel):
    """Result of comparing attributed PnL components vs exchange-reported PnL.

    The goal is to minimize unexplained_pnl (= exchange_pnl - component_pnl).
    A non-zero residual indicates missing attribution factors.
    """

    venue: str
    instrument: str
    timestamp: datetime
    component_pnl: Decimal = Field(description="Sum of all attributed PnL components")
    exchange_pnl: Decimal = Field(description="PnL as reported by exchange (balance change)")
    unexplained_pnl: Decimal = Field(description="exchange_pnl - component_pnl")
    unexplained_pct: Decimal = Field(description="unexplained_pnl / abs(exchange_pnl) if nonzero")
    components: dict[str, Decimal] = Field(
        default_factory=dict,
        description="Breakdown by dimension: greeks, funding, interest, fees, basis, spread, delta, etc.",
    )
    ad_hoc_items: dict[str, Decimal] = Field(
        default_factory=dict,
        description="Non-standard items: staking rewards, airdrops, rebates, etc.",
    )
    status: BalanceReconciliationStatus = Field(
        description="MATCH if unexplained_pct < threshold, else DISCREPANCY or CRITICAL",
    )


__all__ = [
    "AutoReconcileReason",
    "BalanceReconciliationSnapshot",
    "BalanceReconciliationStatus",
    "DeviationState",
    "DeviationStatus",
    "DeviationType",
    "PnLReconciliationSnapshot",
    "ReconciliationAction",
    "ReconciliationResolution",
]
