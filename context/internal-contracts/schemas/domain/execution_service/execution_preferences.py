"""Execution preferences configuration for strategy-to-execution routing.

Defines ExecutionMode and ExecutionPreferencesConfig used by strategy-service
to communicate execution intent to execution-service.
"""

from __future__ import annotations

from enum import StrEnum
from typing import TypedDict


class ExecutionMode(StrEnum):
    """Execution algorithm mode."""

    AGGRESSIVE = "AGGRESSIVE"
    PASSIVE = "PASSIVE"
    NEUTRAL = "NEUTRAL"
    TWAP = "TWAP"
    VWAP = "VWAP"


class UrgencyLevel(StrEnum):
    """Order urgency classification."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ExecutionPreferencesConfig(TypedDict):
    """Execution preferences passed from strategy-service to execution-service.

    Attributes:
        execution_mode: Algorithm mode (AGGRESSIVE takes liquidity, PASSIVE posts).
        max_slippage_bps: Maximum allowed slippage in basis points.
        urgency_level: How urgently the order should be filled.
        prefer_maker: If True, prefer maker orders to reduce fees.
        allow_partial_fill: If True, accept partial fills.
    """

    execution_mode: ExecutionMode
    max_slippage_bps: int
    urgency_level: UrgencyLevel
    prefer_maker: bool
    allow_partial_fill: bool


__all__ = [
    "ExecutionMode",
    "ExecutionPreferencesConfig",
    "UrgencyLevel",
]
