"""Unified position type contracts.

All position models across asset classes (CeFi, DeFi, TradFi) must implement
PositionQuantityProtocol so cross-asset portfolio aggregators work with Decimal
arithmetic throughout.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Protocol, runtime_checkable


@runtime_checkable
class PositionQuantityProtocol(Protocol):
    """Protocol that all position models must satisfy.

    Enforces Decimal for quantity and price to prevent float precision errors
    in cross-asset position aggregation.
    """

    @property
    def quantity(self) -> Decimal:
        """Current position quantity in instrument units. Must be Decimal."""
        ...

    @property
    def price(self) -> Decimal:
        """Current mark price or entry price. Must be Decimal."""
        ...

    @property
    def last_updated(self) -> datetime:
        """Timestamp of last position update. Used for staleness checking."""
        ...


def aggregate_positions(positions: list[PositionQuantityProtocol]) -> Decimal:
    """Sum quantities across positions using pure Decimal arithmetic.

    Never casts to float internally.

    Args:
        positions: List of position objects satisfying PositionQuantityProtocol.

    Returns:
        Total quantity as Decimal.
    """
    return sum((p.quantity for p in positions), Decimal(0))


def aggregate_notional(positions: list[PositionQuantityProtocol]) -> Decimal:
    """Sum notional values (quantity * price) across positions using Decimal.

    Args:
        positions: List of position objects satisfying PositionQuantityProtocol.

    Returns:
        Total notional as Decimal.
    """
    return sum((p.quantity * p.price for p in positions), Decimal(0))


__all__ = [
    "PositionQuantityProtocol",
    "aggregate_notional",
    "aggregate_positions",
]
