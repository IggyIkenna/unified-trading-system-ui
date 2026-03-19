"""Execution-service sports domain contracts.

Internal schemas for sports bet execution results and venue routing.
External betting schemas (BetOrder, BetExecution, BetStatus, CanonicalOdds) live in UAC.

UIC may import from UAC — this is the correct direction per TIER-ARCHITECTURE.md
(UAC = T0 pure leaf; UIC = T0-with-UAC-dependency, builds after UAC).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, computed_field
from unified_api_contracts import BetStatus

# Schema version for UIC execution-service sports domain contracts.
# UIC re-uses UAC types (BetStatus) but owns its own versioning here.
# Bump rules: MAJOR = breaking field change; MINOR = optional field added;
# PATCH = docs/metadata only.
__schema_version__ = "1.0.0"

__all__ = [
    "BetStatus",
    "SportsBetResult",
    "SportsVenueScore",
    "SportsVenueSelection",
]

_SUCCESS_STATUSES: frozenset[BetStatus] = frozenset(
    {
        BetStatus.PLACED,
        BetStatus.MATCHED,
        BetStatus.PARTIALLY_MATCHED,
        BetStatus.SETTLED_WIN,
    }
)


class SportsBetResult(BaseModel, frozen=True):
    """Result of a sports bet execution attempt.

    Wraps the raw BetExecution from UAC with computed outcome properties.
    Owned by execution-service; published to downstream consumers via UTL/UDC.
    """

    execution_id: str
    order_id: str
    bet_id: str | None = None
    status: BetStatus
    bookmaker_key: str
    executed_at_utc: datetime
    error_message: str | None = None
    filled_odds: Decimal | None = None
    filled_stake: Decimal | None = None
    schema_version: str = __schema_version__

    @computed_field
    @property
    def is_success(self) -> bool:
        """True when the bet was accepted and matched by the bookmaker/exchange."""
        return self.status in _SUCCESS_STATUSES

    @computed_field
    @property
    def is_failed(self) -> bool:
        """True when the bet was definitively rejected or voided."""
        return not self.is_success


class SportsVenueScore(BaseModel, frozen=True):
    """Scored venue entry returned by SportsRouter.get_all_venues()."""

    bookmaker_key: str
    margin_score: float
    liquidity_score: float
    latency_score: float
    total_score: float
    expected_margin_pct: float
    is_exchange: bool


class SportsVenueSelection(BaseModel, frozen=True):
    """Venue chosen by SportsRouter for a given fixture and market."""

    bookmaker_key: str
    fixture_id: str
    market: str
    expected_margin_pct: float
    is_exchange: bool
    reason: str = ""
