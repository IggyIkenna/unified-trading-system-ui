"""market-tick-data-service domain schemas.

Canonical Pydantic models for sports odds tick data produced by the
market-tick-data-service pipeline.

UIC may import from UAC — this is the correct direction per TIER-ARCHITECTURE.md
(UAC = T0 pure leaf; UIC = T0-with-UAC-dependency, builds after UAC).
"""

from unified_internal_contracts.domain.market_tick_data.sports import (
    SportsBookUpdate,
    SportsOddsTick,
)

__all__ = [
    "SportsBookUpdate",
    "SportsOddsTick",
]
