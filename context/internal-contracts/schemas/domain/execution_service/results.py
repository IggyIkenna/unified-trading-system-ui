"""Cross-service execution result TypedDicts.

Canonical result schemas produced by DeFi protocol connectors (swap, pool-state,
transaction) and CeFi external venue adapters (order fill, order status, positions).

Migrated from unified-defi-execution-interface protocols/base.py and
connectors/cefi_base.py to unify cross-service contracts in UIC.

DeFi type names are prefixed with ``DeFi`` to avoid collision with the
matching-engine ``SwapResult`` dataclass in ``domain.matching_engine``.

CeFi types that would collide with existing UIC schemas (``OrderData`` in
strategy_service.monitoring, ``CeFiPosition`` in positions.cefi) are prefixed
with ``CeFiVenue``.
"""

from __future__ import annotations

from decimal import Decimal
from typing import TypedDict

# ---------------------------------------------------------------------------
# DeFi execution results (from UDEI protocols/base.py)
# ---------------------------------------------------------------------------


class DeFiSwapQuoteResult(TypedDict):
    """Result of get_quote for DEX swap."""

    token_in: str
    token_out: str
    amount_in: Decimal
    amount_out: Decimal
    fee_tier: int
    fee_amount: Decimal
    price_impact_bps: int
    sqrt_price_x96_after: Decimal | None


class DeFiSwapResult(TypedDict, total=False):
    """Result of swap execution."""

    success: bool
    error: str
    token_in: str
    token_out: str
    amount_in: Decimal
    amount_out: Decimal
    fee_tier: int
    price_impact_bps: int
    gas_used: int
    tx_hash: str


class DeFiPoolStateResult(TypedDict, total=False):
    """Pool state from get_pool_state."""

    liquidity: Decimal
    sqrt_price_x96: Decimal | None
    tick: int
    observation_index: int
    fee_growth_global_0: Decimal
    fee_growth_global_1: Decimal


class DeFiConnectorStateDict(TypedDict):
    """Connector state for to_dict."""

    venue_id: str
    chain: str
    is_live: bool
    is_connected: bool


class DeFiTxResult(TypedDict, total=False):
    """Generic transaction result."""

    success: bool
    error: str
    market_id: str
    token_in: str
    token_out: str
    amount_in: Decimal
    amount_out: Decimal
    gas_used: int
    interest_rate_mode: int
    steth_amount: Decimal
    steth_value: Decimal
    withdrawal_delay: int
    debt_repaid: Decimal
    tokens: list[str]
    amounts: list[Decimal]
    fees: list[Decimal]
    tx_hash: str
    shares: Decimal
    rewards: Decimal
    delay_blocks: int


# ---------------------------------------------------------------------------
# CeFi execution results (from UDEI connectors/cefi_base.py)
# ---------------------------------------------------------------------------


class CeFiOrderFill(TypedDict):
    """Represents an order fill."""

    price: Decimal
    quantity: Decimal
    timestamp: str
    trade_id: str
    fee: Decimal | None


class CeFiVenueOrderData(TypedDict):
    """Represents order submission data."""

    symbol: str
    side: str  # "buy" or "sell"
    type: str  # "market", "limit", etc.
    quantity: Decimal
    price: Decimal | None
    time_in_force: str | None


class CeFiOrderStatus(TypedDict):
    """Represents order status response."""

    order_id: str
    symbol: str
    side: str
    status: str
    quantity: Decimal
    filled_quantity: Decimal
    price: Decimal | None
    average_price: Decimal | None
    timestamp: str


class CeFiVenuePosition(TypedDict):
    """Represents a trading position from an external venue adapter."""

    symbol: str
    side: str  # "long" or "short"
    size: Decimal
    entry_price: Decimal
    mark_price: Decimal
    pnl: Decimal
    timestamp: str


class CeFiOpenOrder(TypedDict):
    """Represents an open order."""

    order_id: str
    symbol: str
    side: str
    type: str
    quantity: Decimal
    filled_quantity: Decimal
    remaining_quantity: Decimal
    price: Decimal | None
    status: str
    timestamp: str


__all__ = [
    "CeFiOpenOrder",
    "CeFiOrderFill",
    "CeFiOrderStatus",
    "CeFiVenueOrderData",
    "CeFiVenuePosition",
    "DeFiConnectorStateDict",
    "DeFiPoolStateResult",
    "DeFiSwapQuoteResult",
    "DeFiSwapResult",
    "DeFiTxResult",
]
