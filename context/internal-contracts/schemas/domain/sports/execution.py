"""Sports-specific canonical execution extensions.

CanonicalSportsOrder and CanonicalSportsFill extend the UAC cross-venue
canonical types with fields that only exist in sports/prediction-market
execution contexts (exchange market IDs, selection IDs, persistence type,
decimal odds, etc.).

Usage
-----
Import CanonicalSportsOrder and CanonicalSportsFill from this module
(unified_api_contracts.internal.domain.sports.execution).

Architecture note
-----------------
The base CanonicalOrder / CanonicalFill fields cover order_id, venue,
instrument_id (used as ``{market_id}/{selection_id}`` for sports), side,
quantity (= stake), price (= decimal odds), status, and timestamps.
The sports-specific fields here are optional so that generic downstream
consumers (execution-service position tracker) work without change.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict
from unified_api_contracts import CanonicalFill, CanonicalOrder


class CanonicalSportsOrder(CanonicalOrder):
    """Canonical order extended with sports-exchange specific fields.

    instrument_id convention: ``{market_id}/{selection_id}`` (e.g.
    ``1.234567890/12345678`` for Betfair; ``{event_id}/{line_id}`` for
    Pinnacle; ``{token_id}`` for Polymarket CLOB).

    quantity = stake in account currency.
    price    = decimal odds at placement (e.g. 2.50 = evens+).
    """

    # Sports exchange / market identifiers
    market_id: str | None = None
    selection_id: str | None = None

    # Betfair-specific
    persistence_type: str | None = None  # LAPSE | PERSIST | MARKET_ON_CLOSE
    bet_side: str | None = None  # BACK | LAY (Betfair side; not same as OrderSide)

    # Pinnacle-specific
    line_id: int | None = None
    period_number: int | None = None  # 0 = full match, 1 = 1st half
    team: str | None = None  # TEAM1 | TEAM2 | DRAW
    over_under_side: str | None = None  # OVER | UNDER (for totals)

    # Polymarket-specific
    token_id: str | None = None  # CLOB conditional token ID
    outcome: str | None = None  # Yes | No
    transaction_hash: str | None = None

    # Shared decimal odds (redundant with price; kept for explicitness)
    decimal_odds: Decimal | None = None

    # Bookmaker key (e.g. "betfair", "pinnacle", "polymarket")
    bookmaker_key: str | None = None


class CanonicalSportsFill(CanonicalFill):
    """Canonical fill extended with sports-specific fields.

    quantity = stake matched.
    price    = decimal odds matched.
    """

    market_id: str | None = None
    selection_id: str | None = None

    # Betfair-specific
    bet_id: str | None = None  # Betfair bet ID (their internal reference)
    size_matched: Decimal | None = None
    size_remaining: Decimal | None = None

    # Pinnacle-specific
    win_loss: Decimal | None = None

    # Polymarket-specific
    token_id: str | None = None
    outcome: str | None = None  # Yes | No

    # Shared
    bookmaker_key: str | None = None
    decimal_odds_matched: Decimal | None = None


class SportsBetEvent(BaseModel):
    """Base event for sports bet lifecycle tracking."""

    model_config = ConfigDict(frozen=True)

    event_type: str
    bet_id: str
    order_id: str
    venue_key: str
    fixture_id: str
    market_type: str
    selection: str
    timestamp: datetime


class BetPlacedEvent(SportsBetEvent):
    """Emitted when a bet is successfully placed at a venue."""

    event_type: str = "BET_PLACED"
    requested_odds: Decimal
    requested_stake: Decimal
    execution_method: str  # "rest_api" | "browser_automation"


class BetFilledEvent(SportsBetEvent):
    """Emitted when a bet is matched/filled (full or partial)."""

    event_type: str = "BET_FILLED"
    filled_odds: Decimal
    filled_stake: Decimal
    bookmaker_ref: str | None = None


class BetSettledEvent(SportsBetEvent):
    """Emitted when a bet is settled (win/loss/void)."""

    event_type: str = "BET_SETTLED"
    settlement_status: str  # "win" | "loss" | "void" | "half_win" | "half_loss"
    payout: Decimal
    profit_loss: Decimal
    closing_odds: Decimal | None = None
    clv_edge_pct: Decimal | None = None


class BetCancelledEvent(SportsBetEvent):
    """Emitted when a bet is cancelled or rejected."""

    event_type: str = "BET_CANCELLED"
    reason: str
    was_matched: bool = False


__all__ = [
    "BetCancelledEvent",
    "BetFilledEvent",
    "BetPlacedEvent",
    "BetSettledEvent",
    "CanonicalSportsFill",
    "CanonicalSportsOrder",
    "SportsBetEvent",
]
