"""Position protocol and cross-asset portfolio aggregator (Stream I).

Defines PositionQuantityProtocol requiring all position models to expose
``quantity`` and ``price`` as ``Decimal`` — enforces IEEE 754-safe arithmetic
across all position types.

The CrossAssetPortfolioAggregator works with any object satisfying the protocol,
so CeFi, DeFi, TradFi, and sports-book positions can be mixed freely.
"""

from __future__ import annotations

from decimal import Decimal
from typing import Protocol, runtime_checkable


@runtime_checkable
class PositionQuantityProtocol(Protocol):
    """Protocol requiring all position models to expose quantity and price as Decimal.

    Enforces IEEE 754-safe arithmetic across all position types.
    All implementations must use Decimal, not float, for these fields.
    """

    @property
    def quantity(self) -> Decimal:
        """Net position quantity (positive=long, negative=short)."""
        ...

    @property
    def price(self) -> Decimal:
        """Average entry price."""
        ...

    @property
    def symbol(self) -> str:
        """Trading symbol identifier."""
        ...


class CrossAssetPortfolioAggregator:
    """Aggregates positions across asset classes using Decimal arithmetic.

    Uses PositionQuantityProtocol to ensure type safety.
    Keyed by symbol; adding a position for an existing symbol replaces it.
    """

    def __init__(self) -> None:
        self._positions: dict[str, PositionQuantityProtocol] = {}

    def add_position(self, position: PositionQuantityProtocol) -> None:
        """Add or replace a position."""
        self._positions[position.symbol] = position

    def remove_position(self, symbol: str) -> None:
        """Remove a position by symbol.  No-op if symbol is unknown."""
        self._positions.pop(symbol, None)

    def gross_exposure(self) -> Decimal:
        """Sum of |quantity * price| across all positions."""
        return sum(
            (abs(p.quantity) * p.price for p in self._positions.values()),
            Decimal("0"),
        )

    def net_exposure(self) -> Decimal:
        """Sum of quantity * price across all positions (signed)."""
        return sum(
            (p.quantity * p.price for p in self._positions.values()),
            Decimal("0"),
        )

    def position_count(self) -> int:
        """Number of positions currently tracked."""
        return len(self._positions)

    def positions(self) -> list[PositionQuantityProtocol]:
        """Snapshot of all tracked positions."""
        return list(self._positions.values())


__all__ = [
    "CrossAssetPortfolioAggregator",
    "PositionQuantityProtocol",
]
