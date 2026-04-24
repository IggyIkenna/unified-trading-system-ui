"""Execution-service cross-service type schemas.

BenchmarkType, OperationType, OrderType, PositionType, and ExecutionInstruction
are the core contracts shared between strategy-service, execution-service, and
unified-defi-execution-interface.  They live here (UIC) as the single source
of truth.

Note: ``OrderType`` in this module is for execution instruction order types
(MARKET, LIMIT, etc.).  The matching-engine ``OrderType`` in
``unified_internal_contracts.domain.matching_engine`` is a separate concept
(LIMIT, IOC, FOK, etc.).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from enum import Enum, StrEnum
from typing import cast

# ---------------------------------------------------------------------------
# OperationType
# ---------------------------------------------------------------------------


class BenchmarkType(Enum):
    """Types of benchmark prices for execution comparison."""

    ORACLE = "ORACLE"
    """
    On-chain oracle price (AAVE, Chainlink, etc.)

    Best for:
    - Lending operations (LEND, BORROW, WITHDRAW, REPAY)
    - Staking operations (STAKE, UNSTAKE)
    - Flash loan operations

    Source: AAVE Price Oracle, Chainlink feeds
    """

    TWAP = "TWAP"
    """
    Time-weighted average price over a window.

    Best for:
    - DEX swaps (SWAP)
    - Large orders that execute over time

    Window: Typically 5 minutes to 1 hour
    Source: DEX pool prices, Uniswap TWAP oracle
    """

    ARRIVAL = "ARRIVAL"
    """
    Mid-price at the moment signal arrives.

    Best for:
    - CLOB trades (TRADE)
    - Perp positions (Hyperliquid, Aster)

    Source: Order book mid-price at signal timestamp
    """

    VWAP = "VWAP"
    """
    Volume-weighted average price.

    Best for:
    - Large orders that execute over time
    - Benchmark for execution algorithms

    Source: Trade data over execution window
    """

    CLOSE = "CLOSE"
    """
    Closing price of a time period (e.g., candle close).

    Best for:
    - End-of-period rebalancing
    - Signal generation comparison

    Source: OHLCV data
    """


# ---------------------------------------------------------------------------
# OperationType
# ---------------------------------------------------------------------------


class OperationType(Enum):
    """
    Enumeration of supported operation types.

    Operations are categorized by venue type:
    - Lending operations (DeFi protocols like AAVE, Morpho)
    - Staking operations (LST protocols like EtherFi, Lido)
    - Trading operations (DEX swaps and CEX/CLOB trades)
    - Cross-venue operations (transfers between venues)
    - Flash loan operations (atomic-only operations)
    - Sports / prediction / derivatives operations
    """

    # LENDING OPERATIONS (DeFi Lending Protocols)
    LEND = "LEND"
    BORROW = "BORROW"
    WITHDRAW = "WITHDRAW"
    REPAY = "REPAY"

    # STAKING OPERATIONS (LST Protocols)
    STAKE = "STAKE"
    UNSTAKE = "UNSTAKE"

    # TRADING OPERATIONS
    SWAP = "SWAP"
    TRADE = "TRADE"

    # CROSS-VENUE OPERATIONS
    TRANSFER = "TRANSFER"

    # FLASH LOAN OPERATIONS (Atomic Only)
    FLASH_BORROW = "FLASH_BORROW"
    FLASH_REPAY = "FLASH_REPAY"

    # LIQUIDITY PROVISION OPERATIONS
    ADD_LIQUIDITY = "ADD_LIQUIDITY"
    REMOVE_LIQUIDITY = "REMOVE_LIQUIDITY"
    COLLECT_FEES = "COLLECT_FEES"

    # SPORTS OPERATIONS (Betting Exchanges & Bookmakers)
    BET = "BET"
    CANCEL_BET = "CANCEL_BET"
    SPORTS_EXCHANGE = "SPORTS_EXCHANGE"

    # OPTIONS COMBO OPERATIONS (Multi-leg options execution)
    OPTIONS_COMBO = "OPTIONS_COMBO"

    # FUTURES ROLL OPERATIONS (Calendar roll)
    FUTURES_ROLL = "FUTURES_ROLL"

    # PREDICTION BET OPERATIONS (Polymarket/Kalshi)
    PREDICTION_BET = "PREDICTION_BET"

    # SPORTS EXCHANGE OPERATIONS (Betfair/Smarkets back/lay) - strategy-service variant
    SPORTS_BET = "SPORTS_BET"
    SPORTS_EXCHANGE_ORDER = "SPORTS_EXCHANGE_ORDER"

    # HELPER METHODS

    @classmethod
    def lending_operations(cls) -> list[OperationType]:
        """Get all lending-related operations."""
        return [cls.LEND, cls.BORROW, cls.WITHDRAW, cls.REPAY]

    @classmethod
    def staking_operations(cls) -> list[OperationType]:
        """Get all staking-related operations."""
        return [cls.STAKE, cls.UNSTAKE]

    @classmethod
    def trading_operations(cls) -> list[OperationType]:
        """Get all trading-related operations."""
        return [cls.SWAP, cls.TRADE]

    @classmethod
    def flash_loan_operations(cls) -> list[OperationType]:
        """Get all flash loan operations (atomic only)."""
        return [cls.FLASH_BORROW, cls.FLASH_REPAY]

    @classmethod
    def lp_operations(cls) -> list[OperationType]:
        """Get all liquidity provision operations."""
        return [cls.ADD_LIQUIDITY, cls.REMOVE_LIQUIDITY, cls.COLLECT_FEES]

    @classmethod
    def sports_operations(cls) -> list[OperationType]:
        """Get all sports betting operations."""
        return [cls.BET, cls.CANCEL_BET, cls.SPORTS_EXCHANGE]

    @classmethod
    def options_operations(cls) -> list[OperationType]:
        """Get all options-related operations."""
        return [cls.OPTIONS_COMBO]

    @classmethod
    def futures_operations(cls) -> list[OperationType]:
        """Get all futures-related operations."""
        return [cls.FUTURES_ROLL]

    @classmethod
    def prediction_operations(cls) -> list[OperationType]:
        """Get all prediction market operations."""
        return [cls.PREDICTION_BET]

    @classmethod
    def requires_atomic(cls, op: OperationType) -> bool:
        """Check if operation requires atomic execution."""
        return op in cls.flash_loan_operations()

    @classmethod
    def benchmark_type_for_operation(cls, op: OperationType) -> str:
        """
        Get recommended benchmark type for an operation.

        Returns:
            "ORACLE" - For lending/staking (on-chain prices)
            "TWAP" - For DEX swaps (time-weighted)
            "ARRIVAL" - For CLOB trades (arrival price)
            "ODDS" - For sports betting (odds-based)
            "MID" - For prediction markets (mid price)
        """
        _benchmark_map: dict[OperationType, str] = {
            cls.SWAP: "TWAP",
            cls.TRADE: "ARRIVAL",
            cls.OPTIONS_COMBO: "ARRIVAL",
            cls.FUTURES_ROLL: "ARRIVAL",
            cls.BET: "ODDS",
            cls.CANCEL_BET: "ODDS",
            cls.SPORTS_EXCHANGE: "ODDS",
            cls.SPORTS_BET: "ODDS",
            cls.SPORTS_EXCHANGE_ORDER: "ODDS",
            cls.PREDICTION_BET: "MID",
        }
        return _benchmark_map.get(op, "ORACLE")


# ---------------------------------------------------------------------------
# OrderType  (execution instruction order types, NOT matching-engine OrderType)
# ---------------------------------------------------------------------------


class OrderType(Enum):
    """Order types for TRADE operations on execution instructions."""

    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP_LIMIT = "STOP_LIMIT"
    STOP_MARKET = "STOP_MARKET"
    TWAP = "TWAP"
    VWAP = "VWAP"


# ---------------------------------------------------------------------------
# PositionType  (DeFi position categories)
# ---------------------------------------------------------------------------


class PositionType(Enum):
    """Types of positions across all instrument categories.

    Covers DeFi protocol positions, CeFi instrument types, and wallet holdings.
    """

    # Spot / wallet
    SPOT = "SPOT"
    """Spot token holding (wallet balance)."""

    SPOT_ASSET = "SPOT_ASSET"
    """Spot asset holding (BTC, ETH, USDT) — alias used by strategy-service."""

    # Derivatives
    PERPETUAL = "PERPETUAL"
    """Perpetual futures position."""

    FUTURE = "FUTURE"
    """Expiring futures contract."""

    # Lending protocol positions
    A_TOKEN = "A_TOKEN"
    """AAVE supply position (aUSDT, aWETH, etc.)."""

    DEBT_TOKEN = "DEBT_TOKEN"
    """AAVE borrow position (debtWETH, etc.)."""

    # Staking positions
    LST = "LST"
    """Liquid staking token (weETH, wstETH, stETH)."""

    YIELD_BEARING = "YIELD_BEARING"
    """Generic yield-bearing token (sUSDe, etc.)."""

    # DEX / LP positions
    LP_POSITION = "LP_POSITION"
    """DEX liquidity pool position."""

    POOL = "POOL"
    """DEX liquidity pool token — alias used by strategy-service."""


# ---------------------------------------------------------------------------
# PositionSide  (directional state of a position)
# ---------------------------------------------------------------------------


class PositionSide(Enum):
    """Directional side of a position.

    Used by strategy-service and execution-service for position tracking.
    """

    LONG = "LONG"
    """Long / buy side."""

    SHORT = "SHORT"
    """Short / sell side."""

    NEUTRAL = "NEUTRAL"
    """Non-directional (lending, staking, LP positions)."""


# ---------------------------------------------------------------------------
# InstructionType  (execution algorithm selection)
# ---------------------------------------------------------------------------


class InstructionType(StrEnum):
    """Instruction type for execution algorithm selection.

    Determines which execution algorithms are available for a given instrument:
    - TRADE: CLOB execution (TWAP, VWAP, Iceberg, etc.) + BENCHMARK_FILL
    - SWAP: DEX execution (Smart Order Router, Max Slippage) + BENCHMARK_FILL
    - ZERO_ALPHA: No algorithm needed, fills at benchmark (BENCHMARK_FILL only)
    - OPTIONS_COMBO: Multi-leg options (straddle, strangle, spread)
    - FUTURES_ROLL: Calendar roll (near to far contract)
    - PREDICTION_BET: Binary outcome bet (Polymarket/Kalshi)
    - SPORTS_BET: Bookmaker bet placement
    - SPORTS_EXCHANGE: Exchange-style bet (Betfair/Smarkets)

    BENCHMARK_FILL is available for ALL types - it fills at arrival price
    and returns 0 execution alpha. Useful for baseline comparison.
    """

    # CLOB execution (Central Limit Order Book)
    TRADE = "TRADE"

    # DEX execution (Decentralized Exchange)
    SWAP = "SWAP"

    # Zero-alpha operations (no execution algorithm needed)
    ZERO_ALPHA = "ZERO_ALPHA"

    # Multi-leg options combo (straddle, strangle, spread)
    OPTIONS_COMBO = "OPTIONS_COMBO"

    # Calendar roll (near to far contract)
    FUTURES_ROLL = "FUTURES_ROLL"

    # Binary outcome bet (Polymarket/Kalshi)
    PREDICTION_BET = "PREDICTION_BET"

    # Bookmaker bet placement
    SPORTS_BET = "SPORTS_BET"

    # Exchange-style bet (Betfair/Smarkets)
    SPORTS_EXCHANGE = "SPORTS_EXCHANGE"


# ---------------------------------------------------------------------------
# ExecutionInstruction  (strategy -> execution contract)
# ---------------------------------------------------------------------------


def _ensure_dict(
    val: dict[str, object] | None,
) -> dict[str, object]:
    """Return val if dict, else {} (explicit None check for optional metadata)."""
    return val if isinstance(val, dict) else {}


@dataclass
class ExecutionInstruction:
    """
    Single explicit instruction to execute.

    Tells the execution engine exactly what action to perform, with all
    necessary parameters for execution and benchmark comparison.
    """

    # Core identification
    instruction_id: str
    operation: OperationType
    timestamp: datetime

    # Source and destination venues
    from_venue: str
    to_venue: str

    # Asset details
    token_in: str
    amount: Decimal  # 18 decimals for ERC-20 precision
    token_out: str | None = None  # For SWAP operations

    # Execution parameters
    max_slippage_bps: int = 50  # Default 0.5% slippage
    limit_price: Decimal | None = None  # For TRADE operations
    order_type: OrderType | None = None  # MARKET, LIMIT, etc.

    # Benchmark for execution alpha measurement
    benchmark_price: Decimal = Decimal("0")
    benchmark_type: str = "ORACLE"  # ORACLE, TWAP, ARRIVAL

    # Gas parameters (for on-chain operations)
    gas_limit: int | None = None
    priority_fee_gwei: Decimal | None = None
    deadline_timestamp: datetime | None = None

    # Additional metadata
    metadata: dict[str, object] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Validate instruction after initialization."""
        # Ensure amount is Decimal
        if not isinstance(self.amount, Decimal):  # pyright: ignore[reportUnnecessaryIsInstance]
            self.amount = Decimal(str(self.amount))

        if self.benchmark_price and not isinstance(self.benchmark_price, Decimal):  # pyright: ignore[reportUnnecessaryIsInstance]
            self.benchmark_price = Decimal(str(self.benchmark_price))

        if self.limit_price and not isinstance(self.limit_price, Decimal):  # pyright: ignore[reportUnnecessaryIsInstance]
            self.limit_price = Decimal(str(self.limit_price))

        # Validate operation-specific requirements
        if self.operation == OperationType.SWAP and not self.token_out:
            raise ValueError("SWAP operation requires token_out")

        if self.operation == OperationType.TRADE and not self.order_type:
            self.order_type = OrderType.MARKET  # Default to market order

    @property
    def is_buy(self) -> bool:
        """For TRADE operations, check if this is a buy (long)."""
        return self.amount > 0

    @property
    def is_sell(self) -> bool:
        """For TRADE operations, check if this is a sell (short)."""
        return self.amount < 0

    @property
    def abs_amount(self) -> Decimal:
        """Get absolute amount (useful for TRADE operations)."""
        return abs(self.amount)

    @property
    def requires_on_chain(self) -> bool:
        """Check if this instruction requires on-chain execution."""
        cex_venues = {
            "BINANCE-SPOT",
            "BINANCE-FUTURES",
            "BYBIT",
            "BYBIT-SPOT",
            "BYBIT-FUTURES",
            "OKX",
            "OKX-SPOT",
            "OKX-FUTURES",
            "COINBASE-SPOT",
            "HYPERLIQUID",
            "ASTER",
        }
        return self.from_venue not in cex_venues and self.to_venue not in cex_venues

    @property
    def is_flash_loan_operation(self) -> bool:
        """Check if this is a flash loan operation."""
        return self.operation in OperationType.flash_loan_operations()

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary for serialization."""
        return {
            "instruction_id": self.instruction_id,
            "operation": self.operation.value,
            "timestamp": self.timestamp.isoformat(),
            "from_venue": self.from_venue,
            "to_venue": self.to_venue,
            "token_in": self.token_in,
            "token_out": self.token_out,
            "amount": str(self.amount),
            "max_slippage_bps": self.max_slippage_bps,
            "limit_price": str(self.limit_price) if self.limit_price else None,
            "order_type": self.order_type.value if self.order_type else None,
            "benchmark_price": str(self.benchmark_price),
            "benchmark_type": self.benchmark_type,
            "gas_limit": self.gas_limit,
            "priority_fee_gwei": str(self.priority_fee_gwei) if self.priority_fee_gwei else None,
            "deadline_timestamp": self.deadline_timestamp.isoformat()
            if self.deadline_timestamp
            else None,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> ExecutionInstruction:
        """Create from dictionary."""
        return cls(
            instruction_id=cast(str, data["instruction_id"]),
            operation=OperationType(cast(str, data["operation"])),
            timestamp=datetime.fromisoformat(cast(str, data["timestamp"])),
            from_venue=cast(str, data["from_venue"]),
            to_venue=cast(str, data["to_venue"]),
            token_in=cast(str, data["token_in"]),
            token_out=cast("str | None", data.get("token_out")),
            amount=Decimal(cast(str, data["amount"])),
            max_slippage_bps=cast(int, data.get("max_slippage_bps", 50)),
            limit_price=(
                Decimal(cast(str, data["limit_price"])) if data.get("limit_price") else None
            ),
            order_type=(
                OrderType(cast(str, data["order_type"])) if data.get("order_type") else None
            ),
            benchmark_price=Decimal(cast(str, data.get("benchmark_price", "0"))),
            benchmark_type=cast(str, data.get("benchmark_type", "ORACLE")),
            gas_limit=cast("int | None", data.get("gas_limit")),
            priority_fee_gwei=Decimal(cast(str, data["priority_fee_gwei"]))
            if data.get("priority_fee_gwei")
            else None,
            deadline_timestamp=datetime.fromisoformat(cast(str, data["deadline_timestamp"]))
            if data.get("deadline_timestamp")
            else None,
            metadata=_ensure_dict(cast("dict[str, object] | None", data.get("metadata"))),
        )


__all__ = [
    "BenchmarkType",
    "ExecutionInstruction",
    "InstructionType",
    "OperationType",
    "OrderType",
    "PositionSide",
    "PositionType",
]
