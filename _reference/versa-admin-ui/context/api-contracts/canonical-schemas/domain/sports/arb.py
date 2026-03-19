"""Sports arbitrage position models for cross-venue arb tracking."""

from __future__ import annotations

from decimal import Decimal

from pydantic import AwareDatetime, Field

from .._base import CanonicalBase


class SportsArbLeg(CanonicalBase):
    """Single leg of a sports arbitrage position."""

    venue: str
    side: str = Field(description="BACK or LAY")
    stake: Decimal
    odds: Decimal
    commission_rate: Decimal = Decimal("0")
    commission_amount: Decimal = Decimal("0")


class SportsArbPosition(CanonicalBase):
    """Cross-venue sports arbitrage position for a single selection.

    Tracks back on venue A + lay on venue B for the same fixture/selection,
    calculating guaranteed P&L after commission netting.
    Limited to 2-outcome back/lay markets; multi-outcome arb is future scope.
    """

    fixture_id: str
    market_type: str
    selection: str
    legs: list[SportsArbLeg] = Field(default_factory=list)
    net_exposure: Decimal = Decimal("0")
    guaranteed_pnl: Decimal = Decimal("0")
    total_commission: Decimal = Decimal("0")
    net_pnl_after_commission: Decimal = Decimal("0")
    is_arb: bool = False
    timestamp: AwareDatetime | None = None
