"""Multi-leg execution instruction contracts.

Defines the MultiLegInstruction model and MultiLegExecutionMode enum for
leader/follower, sequential, and parallel multi-leg execution patterns.
Used by execution-service MultiLegOrchestrator to coordinate complex
multi-leg orders (spreads, arb, hedged positions).
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class MultiLegExecutionMode(StrEnum):
    """How legs should be executed relative to each other."""

    SEQUENTIAL = "SEQUENTIAL"  # Legs executed in order, one at a time
    LEADER_FOLLOWER = "LEADER_FOLLOWER"  # Leader fills first, then followers dispatch
    PARALLEL = "PARALLEL"  # All legs submitted simultaneously


class LegStatus(StrEnum):
    """Status of an individual leg in a multi-leg instruction."""

    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class LegInstruction(BaseModel):
    """A single leg within a multi-leg instruction.

    Attributes:
        leg_id: Unique identifier for this leg within the multi-leg instruction.
        instrument_id: Canonical instrument identifier.
        venue: Target execution venue.
        side: "BUY" or "SELL".
        quantity: Leg quantity in base asset units.
        order_type: Order type (MARKET, LIMIT).
        price: Limit price (required for LIMIT orders).
        time_in_force: Time-in-force (GTC, IOC, FOK).
        priority: Execution priority (lower = higher priority).
        depends_on: List of leg_ids that must complete before this leg.
    """

    leg_id: str
    instrument_id: str
    venue: str
    side: str
    quantity: Decimal
    order_type: str = "MARKET"
    price: Decimal | None = None
    time_in_force: str = "IOC"
    priority: int = 0
    depends_on: list[str] = Field(default_factory=list)


class MultiLegInstruction(BaseModel):
    """Multi-leg execution instruction for coordinated order execution.

    Attributes:
        instruction_id: Unique identifier for the multi-leg instruction.
        strategy_id: Strategy that generated this instruction.
        legs: Ordered list of individual leg instructions.
        execution_mode: How legs should be coordinated.
        leader_leg_index: Index of the leader leg (LEADER_FOLLOWER mode only).
        timeout_seconds: Maximum time to wait for all legs to complete.
        max_partial_fill_ratio: Maximum acceptable partial fill ratio (0.0-1.0).
            If leader fills less than this ratio, followers are not dispatched.
        created_at: UTC timestamp of instruction creation.
    """

    instruction_id: str
    strategy_id: str
    legs: list[LegInstruction]
    execution_mode: MultiLegExecutionMode = MultiLegExecutionMode.SEQUENTIAL
    leader_leg_index: int = 0
    timeout_seconds: int = 60
    max_partial_fill_ratio: Decimal = Field(default=Decimal("0.8"))
    created_at: datetime | None = None


class LegExecutionResult(BaseModel):
    """Result of executing a single leg.

    Attributes:
        leg_id: The leg identifier.
        status: Final status of the leg.
        filled_quantity: Quantity that was filled.
        average_price: Volume-weighted average fill price.
        order_id: Exchange order ID (if submitted).
        error_message: Error message (if failed).
    """

    leg_id: str
    status: LegStatus
    filled_quantity: Decimal = Field(default=Decimal("0"))
    average_price: Decimal | None = None
    order_id: str | None = None
    error_message: str | None = None


class MultiLegExecutionResult(BaseModel):
    """Aggregate result of a multi-leg execution.

    Attributes:
        instruction_id: The multi-leg instruction identifier.
        leg_results: Results for each leg.
        fully_filled: Whether all legs were completely filled.
        execution_time_ms: Total execution time in milliseconds.
    """

    instruction_id: str
    leg_results: list[LegExecutionResult]
    fully_filled: bool = False
    execution_time_ms: int = 0


__all__ = [
    "LegExecutionResult",
    "LegInstruction",
    "LegStatus",
    "MultiLegExecutionMode",
    "MultiLegExecutionResult",
    "MultiLegInstruction",
]
