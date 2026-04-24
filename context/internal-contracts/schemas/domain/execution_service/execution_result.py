"""Execution result dataclasses for DeFi instruction lifecycle.

``ExecutionResult`` captures a single instruction's execution outcome,
including price, gas costs, slippage, and execution-alpha calculation.

``SignalExecutionResult`` aggregates multiple instruction results for
an entire signal (multi-instruction DeFi operation).

Migrated from execution-service/execution_service/models/execution_result.py
to UIC so strategy-service, risk-service, pnl-service, and execution-service
all share the same contract.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from decimal import Decimal
from typing import cast

from unified_internal_contracts.domain.execution_service.execution_status import (
    ServiceExecutionStatus as ExecutionStatus,
)
from unified_internal_contracts.domain.execution_service.types import OperationType


@dataclass
class ExecutionResult:
    """
    Result of executing a single instruction.

    Contains actual execution details for alpha calculation:
    - Actual execution price vs benchmark
    - Gas costs (for on-chain)
    - Slippage realized
    - Execution timing

    Attributes:
        instruction_id: ID of the instruction that was executed
        operation: Type of operation executed
        status: Execution status
        timestamp_submitted: When execution was submitted
        timestamp_completed: When execution completed
        actual_execution_price: Actual price achieved
        benchmark_price: Reference benchmark price
        amount_executed: Actual amount executed
        amount_received: Amount received (for swaps)
        gas_used: Gas consumed (for on-chain)
        gas_price_gwei: Gas price paid
        transaction_hash: On-chain tx hash
        error_message: Error details if failed
    """

    # Identification
    instruction_id: str
    operation: OperationType
    status: ExecutionStatus

    # Timing
    timestamp_submitted: datetime
    timestamp_completed: datetime | None = None

    # Execution details
    actual_execution_price: Decimal = Decimal("0")
    benchmark_price: Decimal = Decimal("0")
    benchmark_type: str = "ORACLE"

    amount_requested: Decimal = Decimal("0")
    amount_executed: Decimal = Decimal("0")
    amount_received: Decimal | None = None  # For swaps

    # Costs
    gas_used: int | None = None
    gas_price_gwei: Decimal | None = None
    trading_fee: Decimal = Decimal("0")

    # Slippage
    slippage_bps: int | None = None

    # On-chain details
    transaction_hash: str | None = None
    block_number: int | None = None

    # Error handling
    error_message: str | None = None

    # Algorithm and venue info
    algorithm_used: str | None = None
    venues_used: list[str] = field(default_factory=list)

    # Direct execution alpha (when calculated explicitly, not from prices)
    _explicit_execution_alpha_bps: Decimal | None = None

    # Metadata
    metadata: dict[str, object] = field(default_factory=dict)

    def __post_init__(self) -> None:
        """Ensure Decimal types."""
        for field_name in [
            "actual_execution_price",
            "benchmark_price",
            "amount_requested",
            "amount_executed",
            "trading_fee",
        ]:
            val: object = cast(object, getattr(self, field_name))
            if val is not None and not isinstance(val, Decimal):  # pyright: ignore[reportUnnecessaryIsInstance]
                setattr(self, field_name, Decimal(str(val)))

        if self.amount_received is not None and not isinstance(self.amount_received, Decimal):  # pyright: ignore[reportUnnecessaryIsInstance]
            self.amount_received = Decimal(str(self.amount_received))

        if self.gas_price_gwei is not None and not isinstance(self.gas_price_gwei, Decimal):  # pyright: ignore[reportUnnecessaryIsInstance]
            self.gas_price_gwei = Decimal(str(self.gas_price_gwei))

    @property
    def is_success(self) -> bool:
        """Check if execution was successful."""
        return self.status == ExecutionStatus.COMPLETED_SUCCESS

    @property
    def is_failed(self) -> bool:
        """Check if execution failed."""
        return self.status in [
            ExecutionStatus.COMPLETED_FAILED,
            ExecutionStatus.REVERTED,
            ExecutionStatus.TIMEOUT,
        ]

    @property
    def is_terminal(self) -> bool:
        """Check if execution is in terminal state."""
        return self.status in [
            ExecutionStatus.COMPLETED_SUCCESS,
            ExecutionStatus.COMPLETED_FAILED,
            ExecutionStatus.COMPLETED_PARTIAL,
            ExecutionStatus.REVERTED,
            ExecutionStatus.TIMEOUT,
            ExecutionStatus.CANCELLED,
            ExecutionStatus.REJECTED_MARKET_HALTED,
            ExecutionStatus.REJECTED_AUCTION_ONLY,
            ExecutionStatus.REJECTED_CIRCUIT_BREAKER,
        ]

    @property
    def is_market_state_rejection(self) -> bool:
        """Check if execution was rejected due to market state."""
        return self.status in [
            ExecutionStatus.REJECTED_MARKET_HALTED,
            ExecutionStatus.REJECTED_AUCTION_ONLY,
            ExecutionStatus.REJECTED_CIRCUIT_BREAKER,
        ]

    @property
    def execution_alpha_bps(self) -> Decimal | None:
        """
        Get execution alpha in basis points.

        If explicitly set via _explicit_execution_alpha_bps, uses that value.
        Otherwise calculates from actual_execution_price vs benchmark_price.

        Positive = better than benchmark
        Negative = worse than benchmark (slippage cost)
        """
        # Use explicit value if set
        if self._explicit_execution_alpha_bps is not None:
            return self._explicit_execution_alpha_bps

        # Calculate from prices
        if not self.actual_execution_price or not self.benchmark_price:
            return None

        if self.benchmark_price == 0:
            return None

        # Price improvement as decimal
        price_diff = self.benchmark_price - self.actual_execution_price
        price_improvement = price_diff / self.benchmark_price

        # Convert to basis points
        return Decimal(str(int(price_improvement * 10000)))

    @execution_alpha_bps.setter
    def execution_alpha_bps(self, value: Decimal | None) -> None:
        """Set explicit execution alpha value."""
        if value is not None and not isinstance(value, Decimal):  # pyright: ignore[reportUnnecessaryIsInstance]
            value = Decimal(str(value))
        self._explicit_execution_alpha_bps = value

    @property
    def gas_cost_eth(self) -> Decimal | None:
        """Calculate total gas cost in ETH."""
        if self.gas_used is None or self.gas_price_gwei is None:
            return None

        # gas_used * gas_price_gwei / 1e9
        return Decimal(self.gas_used) * self.gas_price_gwei / Decimal("1000000000")

    @property
    def total_cost(self) -> Decimal:
        """Calculate total execution cost (fees + gas)."""
        total = self.trading_fee

        gas_cost = self.gas_cost_eth
        if gas_cost:
            # Would need ETH price to convert to same units as trading_fee
            # For now, just track separately
            pass

        return total

    @property
    def fill_rate(self) -> Decimal:
        """Calculate fill rate (amount_executed / amount_requested)."""
        if self.amount_requested == 0:
            return Decimal("0")
        return self.amount_executed / self.amount_requested

    @property
    def execution_latency_ms(self) -> int | None:
        """Calculate execution latency in milliseconds."""
        if not self.timestamp_completed:
            return None

        delta = self.timestamp_completed - self.timestamp_submitted
        return int(delta.total_seconds() * 1000)

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary for serialization."""
        return {
            "instruction_id": self.instruction_id,
            "operation": self.operation.value,
            "status": self.status.value,
            "timestamp_submitted": self.timestamp_submitted.isoformat(),
            "timestamp_completed": (
                self.timestamp_completed.isoformat() if self.timestamp_completed else None
            ),
            "actual_execution_price": str(self.actual_execution_price),
            "benchmark_price": str(self.benchmark_price),
            "benchmark_type": self.benchmark_type,
            "amount_requested": str(self.amount_requested),
            "amount_executed": str(self.amount_executed),
            "amount_received": str(self.amount_received) if self.amount_received else None,
            "gas_used": self.gas_used,
            "gas_price_gwei": str(self.gas_price_gwei) if self.gas_price_gwei else None,
            "trading_fee": str(self.trading_fee),
            "slippage_bps": self.slippage_bps,
            "transaction_hash": self.transaction_hash,
            "block_number": self.block_number,
            "error_message": self.error_message,
            "algorithm_used": self.algorithm_used,
            "venues_used": self.venues_used,
            "execution_alpha_bps": (
                str(self.execution_alpha_bps) if self.execution_alpha_bps else None
            ),
            "fill_rate": str(self.fill_rate),
            "metadata": self.metadata,
        }


@dataclass
class SignalExecutionResult:
    """
    Result of executing an entire DeFi signal (all instructions).

    Aggregates results from all instructions and calculates overall PnL.
    """

    signal_id: str
    strategy_id: str
    is_atomic: bool

    # Individual results
    instruction_results: list[ExecutionResult]

    # Timing
    timestamp_started: datetime
    timestamp_completed: datetime | None = None

    # Overall status
    overall_status: ExecutionStatus = ExecutionStatus.PENDING

    # Aggregated metrics
    total_gas_used: int = 0
    total_trading_fees: Decimal = Decimal("0")

    # Metadata
    metadata: dict[str, object] = field(default_factory=dict)

    @property
    def all_succeeded(self) -> bool:
        """Check if all instructions succeeded."""
        return all(r.is_success for r in self.instruction_results)

    @property
    def any_failed(self) -> bool:
        """Check if any instruction failed."""
        return any(r.is_failed for r in self.instruction_results)

    @property
    def average_execution_alpha_bps(self) -> int | None:
        """Calculate average execution alpha across all instructions."""
        alphas = [
            r.execution_alpha_bps
            for r in self.instruction_results
            if r.execution_alpha_bps is not None
        ]
        if not alphas:
            return None
        return int(sum(alphas) / len(alphas))

    @property
    def total_execution_latency_ms(self) -> int | None:
        """Calculate total execution latency."""
        if not self.timestamp_completed:
            return None
        delta = self.timestamp_completed - self.timestamp_started
        return int(delta.total_seconds() * 1000)


__all__ = [
    "ExecutionResult",
    "SignalExecutionResult",
]
