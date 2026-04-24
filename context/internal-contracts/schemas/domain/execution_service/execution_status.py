"""Service-internal execution status for DeFi instruction lifecycle.

This is the richer execution-service-specific status enum, distinct from the
canonical ``ExecutionStatus`` in UAC (which uses simpler string values for
cross-service communication).

This enum captures the full instruction lifecycle including validation,
market-state rejections, and partial fills. See
NAN_HANDLING_DESIGN_SPECIFICATION.md Section 9 for market-state rejection
details.
"""

from __future__ import annotations

from enum import Enum


class ServiceExecutionStatus(Enum):
    """Status of instruction execution within the execution engine."""

    PENDING = "PENDING"
    """Instruction received, not yet processed."""

    VALIDATED = "VALIDATED"
    """Instruction passed validation (schema + preconditions)."""

    SUBMITTED = "SUBMITTED"
    """Order placed / transaction broadcast."""

    COMPLETED_SUCCESS = "COMPLETED_SUCCESS"
    """Execution completed successfully."""

    COMPLETED_FAILED = "COMPLETED_FAILED"
    """Execution failed (no state change beyond costs)."""

    COMPLETED_PARTIAL = "COMPLETED_PARTIAL"
    """Partial execution (allowed only for some CEX order actions)."""

    REVERTED = "REVERTED"
    """On-chain transaction reverted."""

    TIMEOUT = "TIMEOUT"
    """Execution timed out."""

    CANCELLED = "CANCELLED"
    """Execution cancelled by user/system."""

    REJECTED = "REJECTED"
    """Execution rejected (slippage too high, validation failed, etc.)."""

    # Market state rejection statuses
    # See NAN_HANDLING_DESIGN_SPECIFICATION.md Section 9
    REJECTED_MARKET_HALTED = "REJECTED_MARKET_HALTED"
    """Rejected because market is halted (circuit breaker, news halt)."""

    REJECTED_AUCTION_ONLY = "REJECTED_AUCTION_ONLY"
    """Rejected because market is in auction-only mode."""

    REJECTED_CIRCUIT_BREAKER = "REJECTED_CIRCUIT_BREAKER"
    """Rejected due to circuit breaker activation."""


__all__ = ["ServiceExecutionStatus"]
