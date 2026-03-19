"""Strategy-service Order model — canonical execution order shape.

``Order`` is the structured execution directive passed from strategy-service
to execution-service. It carries the minimal fields needed for a single
exchange/DEX operation and enforces non-NaN numeric values.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass
class Order:
    """A validated execution order from strategy-service.

    Attributes:
        operation_id: Idempotency key — unique per operation attempt.
        operation_type: High-level type: "SPOT_TRADE", "PERP_TRADE",
            "DEFI_SWAP", "FLASH_LOAN", etc.
        venue: Canonical venue slug (e.g. "binance", "uniswap_v3").
        source_token: Token sold / consumed.
        target_token: Token bought / received.
        amount: Absolute positive size of the order.
        side: "buy" | "sell" (direction of the source_token flow).
        price: Limit price in quote currency; None for market orders.
        strategy_id: Originating strategy identifier.
    """

    operation_id: str
    operation_type: str
    venue: str
    source_token: str
    target_token: str
    amount: Decimal
    side: str
    price: Decimal | None = None
    strategy_id: str = ""


__all__ = ["Order"]
