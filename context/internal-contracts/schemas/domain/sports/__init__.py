"""UIC domain/sports — canonical sports execution extension types.

Extends UAC CanonicalOrder with sports-specific fields (persistence type,
market ID, selection ID, handicap, odds format).  Base CanonicalOrder fields
are unchanged so generic execution-service code works without modification.
"""

from unified_api_contracts.internal.domain.sports.execution import (
    BetCancelledEvent,
    BetFilledEvent,
    BetPlacedEvent,
    BetSettledEvent,
    CanonicalSportsFill,
    CanonicalSportsOrder,
    SportsBetEvent,
)

__all__ = [
    "BetCancelledEvent",
    "BetFilledEvent",
    "BetPlacedEvent",
    "BetSettledEvent",
    "CanonicalSportsFill",
    "CanonicalSportsOrder",
    "SportsBetEvent",
]
