"""Strategy-service domain event wrappers.

Each class is a typed envelope that wraps one monitoring data object with the
common audit fields emitted by DomainEventLogger: timestamp (engine clock),
real_utc_time (wall clock), correlation_id, pid, client_name, and order
(sequential event index within a run).

These envelopes are serialised and stored by CloudStrategyStorage to GCS.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .monitoring import (
    ExposureData,
    OrderData,
    PnLData,
    PositionData,
    RiskData,
    StrategyDecisionData,
)


@dataclass
class PositionSnapshot:
    """Domain event wrapping a PositionData snapshot."""

    timestamp: str
    real_utc_time: str
    correlation_id: str
    pid: int
    client_name: str
    data: PositionData
    order: int = 0


@dataclass
class ExposureSnapshot:
    """Domain event wrapping an ExposureData snapshot."""

    timestamp: str
    real_utc_time: str
    correlation_id: str
    pid: int
    client_name: str
    data: ExposureData
    order: int = 0


@dataclass
class RiskAssessment:
    """Domain event wrapping a RiskData assessment."""

    timestamp: str
    real_utc_time: str
    correlation_id: str
    pid: int
    client_name: str
    data: RiskData
    order: int = 0


@dataclass
class PnLCalculation:
    """Domain event wrapping a PnLData calculation."""

    timestamp: str
    real_utc_time: str
    correlation_id: str
    pid: int
    client_name: str
    data: PnLData
    order: int = 0


@dataclass
class OrderEvent:
    """Domain event wrapping a list of OrderData objects generated in one cycle."""

    timestamp: str
    real_utc_time: str
    correlation_id: str
    pid: int
    client_name: str
    data: list[OrderData] = field(default_factory=list)
    order: int = 0


@dataclass
class StrategyDecision:
    """Domain event wrapping a StrategyDecisionData record."""

    timestamp: str
    real_utc_time: str
    correlation_id: str
    pid: int
    client_name: str
    data: StrategyDecisionData
    order: int = 0


__all__ = [
    "ExposureSnapshot",
    "OrderEvent",
    "PnLCalculation",
    "PositionSnapshot",
    "RiskAssessment",
    "StrategyDecision",
]
