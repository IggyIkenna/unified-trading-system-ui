"""Matching engine domain contracts.

Internal schemas for order matching, AMM swap results, and fee calculations.
Used by matching-engine-library. External exchange/venue schemas live in UAC.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import TypedDict

__all__ = [
    "BookType",
    "FeeResult",
    "MatchResult",
    "MatchingFeeType",
    "OrderRecord",
    "OrderType",
    "SwapResult",
]


class OrderType(StrEnum):
    """Order types supported by the matching engine."""

    LIMIT = "LIMIT"
    IOC = "IOC"
    FOK = "FOK"
    MAX_SLIPPAGE = "MAX_SLIPPAGE"
    MARKET = "MARKET"


class BookType(StrEnum):
    """Book types that determine matching logic."""

    L0_TOB = "L0_TOB"
    L1_MBP = "L1_MBP"
    L2_MBP = "L2_MBP"
    AMM = "AMM"
    ALPHA_ZERO = "ALPHA_ZERO"


class MatchingFeeType(StrEnum):
    """Fee structure type based on venue domain."""

    ASYMMETRIC = "asymmetric"
    SYMMETRIC = "symmetric"
    POOL = "pool"
    LENDING = "lending"
    NONE = "none"


class OrderRecord(TypedDict):
    """Record of a limit order placed via narrow-range liquidity."""

    pool_key: dict[str, str | int]
    params: dict[str, str | int | Decimal]


@dataclass
class FeeResult:
    """Fee calculation result."""

    fee_amount: Decimal
    fee_rate_bps: Decimal
    fee_type: MatchingFeeType
    is_maker: bool


@dataclass
class SwapResult:
    """Result of an AMM swap calculation."""

    amount_in: Decimal
    amount_out: Decimal
    fee_amount: Decimal
    price_impact_bps: Decimal
    execution_price: Decimal
    spot_price_before: Decimal
    spot_price_after: Decimal

    @property
    def slippage_bps(self) -> Decimal:
        """Calculate slippage in basis points."""
        if self.spot_price_before == 0:
            return Decimal("0")
        return abs(
            (self.execution_price - self.spot_price_before)
            / self.spot_price_before
            * Decimal("10000")
        )


@dataclass
class MatchResult:
    """Result of order matching."""

    success: bool
    filled_quantity: Decimal
    remaining_quantity: Decimal
    fill_price: Decimal
    timestamp: datetime
    order_type: OrderType
    book_type: BookType
    price_impact_bps: Decimal | None = None
    fee_amount: Decimal | None = None
    error_message: str | None = None

    @property
    def is_partial_fill(self) -> bool:
        """Check if this was a partial fill."""
        return self.filled_quantity > 0 and self.remaining_quantity > 0

    @property
    def is_full_fill(self) -> bool:
        """Check if this was a full fill."""
        return self.remaining_quantity == 0 and self.success
