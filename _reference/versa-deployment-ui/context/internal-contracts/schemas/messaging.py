"""Messaging scope and canonical topic names — backend-agnostic contracts."""

from __future__ import annotations

from enum import StrEnum


class MessagingScope(StrEnum):
    """Backend-agnostic messaging scope — drives backend selection.

    IN_PROCESS: Single process; internal API calls, in-memory queue.
    SAME_VM: Multi-process or multi-thread on one VM/host; Redis Pub/Sub.
    CROSS_VM: Network boundary; Pub/Sub, SNS+SQS, or cross-VM Redis.
    """

    IN_PROCESS = "in_process"
    SAME_VM = "same_vm"
    CROSS_VM = "cross_vm"


class MessagingTopic(StrEnum):
    """Canonical topic/channel names for internal messaging.

    Maps to GCP Pub/Sub topics, Redis channels, or AWS SNS topics.
    Fill events use venue suffix: fill-events-{venue} (e.g. fill-events-binance).
    """

    FILL_EVENTS = "fill-events-{venue}"
    ORDER_REQUESTS = "order-requests"
    EXECUTION_RESULTS = "execution-results"
    POSITION_UPDATES = "position-updates"
    POSITIONS = "positions"
    RISK_ALERTS = "risk-alerts"
    MARGIN_WARNINGS = "margin-warnings"
    MARKET_TICKS = "market-ticks"
    ORDER_BOOK_UPDATES = "order-book-updates"
    DERIVATIVE_TICKERS = "derivative-tickers"
    LIQUIDATIONS = "liquidations"
    FEATURE_UPDATES = "feature-updates"
    STRATEGY_SIGNALS = "strategy-signals"
    ML_PREDICTIONS = "ml-predictions"
    SERVICE_EVENTS = "service-lifecycle-events"
    HEALTH_ALERTS = "health-alerts"
    CIRCUIT_BREAKER_EVENTS = "circuit-breaker-events"
