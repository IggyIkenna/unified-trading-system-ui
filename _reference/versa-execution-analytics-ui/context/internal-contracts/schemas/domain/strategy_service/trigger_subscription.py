"""Trigger subscription contracts for event-driven strategy execution.

Defines TriggerSubscription, the schema for subscribing strategies to specific
event types with filtering conditions. Used by the EventDrivenStrategyEngine
to route incoming events (feature updates, odds changes, price crosses) to
the correct strategies.

Usage:
    subscription = TriggerSubscription(
        subscription_id="sub_001",
        event_type="FEATURE_UPDATE",
        filter_conditions={"instrument_id": "BTC-PERP", "feature_name": "momentum_5m"},
        strategy_ids=["CEFI_MOMENTUM_BTC_5M"],
    )
"""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, Field


class TriggerEventType(StrEnum):
    """Known trigger event types for strategy subscriptions."""

    FEATURE_UPDATE = "FEATURE_UPDATE"
    ODDS_CHANGE = "ODDS_CHANGE"
    PRICE_CROSS = "PRICE_CROSS"
    VOLATILITY_REGIME_CHANGE = "VOLATILITY_REGIME_CHANGE"
    RISK_ALERT = "RISK_ALERT"
    POSITION_UPDATE = "POSITION_UPDATE"
    ML_PREDICTION = "ML_PREDICTION"
    MARKET_TICK = "MARKET_TICK"
    CUSTOM = "CUSTOM"


class TriggerSubscription(BaseModel):
    """A subscription that routes events to strategies based on type and filters.

    Attributes:
        subscription_id: Unique identifier for this subscription.
        event_type: The event type to subscribe to (from TriggerEventType or custom string).
        filter_conditions: Key-value filter conditions that the incoming event must match.
            Keys are event field names, values are the required values.
            Supports simple equality matching. Example:
            {"instrument_id": "BTC-PERP", "threshold": 0.5}
        strategy_ids: List of strategy IDs that should be notified when a matching event arrives.
        enabled: Whether this subscription is active.
        priority: Subscription priority (lower = higher priority). Used for ordering
            when multiple subscriptions match the same event.
        description: Human-readable description of what this subscription does.
    """

    subscription_id: str
    event_type: str
    filter_conditions: dict[str, str | int | float | bool] = Field(default_factory=dict)
    strategy_ids: list[str]
    enabled: bool = True
    priority: int = 0
    description: str = ""


class TriggerEvent(BaseModel):
    """An incoming event that may match trigger subscriptions.

    Attributes:
        event_id: Unique event identifier.
        event_type: The type of event (must match subscription event_type).
        payload: Event payload as key-value pairs.
        timestamp_iso: ISO-format UTC timestamp of the event.
    """

    event_id: str
    event_type: str
    payload: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    timestamp_iso: str = ""


__all__ = [
    "TriggerEvent",
    "TriggerEventType",
    "TriggerSubscription",
]
