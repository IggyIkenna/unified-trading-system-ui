"""Internal Pub/Sub message schemas — all topics and their typed message bodies."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class InternalPubSubTopic(StrEnum):
    """Canonical topic names for internal Pub/Sub messaging."""

    # Execution layer
    FILL_EVENTS = "fill-events-{venue}"  # Published per venue: fill-events-binance etc.
    ORDER_REQUESTS = "order-requests"
    EXECUTION_RESULTS = "execution-results"

    # Risk / positions
    POSITION_UPDATES = "position-updates"
    POSITIONS = "positions"
    RISK_ALERTS = "risk-alerts"
    MARGIN_WARNINGS = "margin-warnings"

    # Market data (live mode broadcast)
    MARKET_TICKS = "market-ticks"
    ORDER_BOOK_UPDATES = "order-book-updates"
    DERIVATIVE_TICKERS = "derivative-tickers"
    LIQUIDATIONS = "liquidations"

    # Features / signals
    FEATURE_UPDATES = "feature-updates"
    STRATEGY_SIGNALS = "strategy-signals"
    ML_PREDICTIONS = "ml-predictions"

    # Lifecycle
    SERVICE_EVENTS = "service-lifecycle-events"
    HEALTH_ALERTS = "health-alerts"
    CIRCUIT_BREAKER_EVENTS = "circuit-breaker-events"

    # Aggregated positions
    AGGREGATED_POSITIONS = "aggregated-positions"
    PORTFOLIO_VIEWS = "portfolio-views"
    RISK_GROUP_UPDATES = "risk-group-updates"

    # Settlement
    EOD_SETTLEMENT = "eod-settlement"


class PubSubMessageEnvelope(BaseModel):
    """Outer wrapper for every internal Pub/Sub message — standardises routing metadata."""

    topic: str
    message_type: str
    schema_version: str = "1.0"
    source_service: str
    timestamp: datetime
    correlation_id: str | None = None
    partition_key: str | None = Field(
        default=None, description="Used for ordered delivery; e.g. instrument_key or client_id"
    )
    payload: dict[str, str | int | float | bool | list[str] | dict[str, str] | None]


# ---------------------------------------------------------------------------
# Per-topic typed message bodies
# ---------------------------------------------------------------------------


class FillEventMessage(BaseModel):
    """Published to ``fill-events-{venue}`` after every execution fill."""

    fill_id: str
    order_id: str
    timestamp: str = Field(description="ISO 8601 UTC")
    venue: str
    instrument_id: str
    side: str
    quantity: str = Field(description="Decimal string")
    price: str = Field(description="Decimal string")
    fee: str | None = None
    fee_currency: str | None = None
    is_maker: bool | None = None
    strategy_id: str | None = None
    client_id: str | None = Field(default=None, json_schema_extra={"pii": True})


class OrderRequestMessage(BaseModel):
    """Published to ``order-requests`` by strategy-service."""

    request_id: str
    strategy_id: str
    client_id: str = Field(..., json_schema_extra={"pii": True})
    venue: str
    instrument_id: str
    side: str
    order_type: str
    quantity: str
    price: str | None = None
    algo: str | None = None
    timestamp: str


class ExecutionResultMessage(BaseModel):
    """Published to ``execution-results`` after each instruction completes or fails."""

    instruction_id: str
    operation: str
    status: str
    timestamp_submitted: str
    timestamp_completed: str | None = None
    actual_execution_price: str | None = None
    benchmark_price: str | None = None
    amount_executed: str | None = None
    slippage_bps: float | None = None
    transaction_hash: str | None = None
    error_message: str | None = None


class PositionUpdateMessage(BaseModel):
    """Published to ``position-updates`` after fill processing."""

    account_id: str = Field(..., json_schema_extra={"pii": True})
    venue: str
    instrument_id: str
    side: str
    quantity: str
    entry_price: str
    mark_price: str
    unrealized_pnl: str
    realized_pnl: str | None = None
    timestamp: str
    client_id: str | None = Field(default=None, json_schema_extra={"pii": True})


class VenuePositionBreakdownMessage(BaseModel):
    """Wire-safe venue breakdown — str-encoded Decimals."""

    venue: str
    quantity: str
    side: str
    entry_price: str
    mark_price: str
    unrealized_pnl: str
    instrument_type: str | None = None
    strategy_id: str | None = None
    margin_type: str | None = None
    chain: str | None = None


class AggregatedPositionMessage(BaseModel):
    """Published to ``aggregated-positions`` on cross-venue recalculation."""

    client_id: str | None = Field(default=None, json_schema_extra={"pii": True})
    instrument_id: str
    asset_class: str | None = None
    instrument_type: str | None = None
    strategy_id: str | None = None
    underlying: str | None = None
    denomination_currency: str = "USD"
    net_quantity: str
    net_side: str
    gross_quantity: str
    per_venue: list[VenuePositionBreakdownMessage] = Field(default_factory=list)
    weighted_avg_entry_price: str
    total_unrealized_pnl: str
    mark_price: str
    timestamp: str
    sequence_number: int = 0


class RiskAlertMessage(BaseModel):
    """Published to ``risk-alerts`` when a risk threshold is breached."""

    alert_type: str
    client_id: str = Field(..., json_schema_extra={"pii": True})
    metric: str
    current_value: float
    threshold: float
    severity: str
    timestamp: str
    recommended_action: str | None = None
    instrument: str | None = None
    venue: str | None = None


class MarketTickMessage(BaseModel):
    """Published to ``market-ticks`` in live mode by market-tick-data-handler."""

    instrument_key: str
    price: Decimal
    size: Decimal
    aggressor_side: int
    trade_id: str
    ts_event: int
    ts_init: int
    venue: str


class DerivativeTickerMessage(BaseModel):
    """Published to ``derivative-tickers`` in live mode."""

    instrument_key: str
    ts_event: int
    ts_init: int
    funding_rate: Decimal | None = None
    index_price: Decimal | None = None
    mark_price: Decimal | None = None
    open_interest: float | None = None


class LiquidationMessage(BaseModel):
    """Published to ``liquidations`` in live mode."""

    instrument_key: str
    price: Decimal
    size: Decimal
    aggressor_side: int
    ts_event: int
    ts_init: int


class FeatureUpdateMessage(BaseModel):
    """Published to ``feature-updates`` when a feature batch completes (live mode)."""

    instrument_id: str
    timestamp: str
    feature_group: str
    feature_count: int
    features: dict[str, float | int | bool | None]


class StrategySignalMessage(BaseModel):
    """Published to ``strategy-signals`` by strategy-service."""

    signal_id: str
    strategy_id: str
    timestamp: str
    is_atomic: bool
    instruction_count: int
    expected_apy: float | None = None
    instructions_json: str = Field(description="JSON-serialised list of StrategyInstruction dicts")


class MLPredictionMessage(BaseModel):
    """Published to ``ml-predictions`` by ml-inference-service."""

    request_id: str
    model_id: str
    instrument_id: str
    timestamp: str
    prediction: float
    confidence: float | None = None
    target_type: str
    latency_ms: float | None = None


class ServiceLifecycleEventMessage(BaseModel):
    """Published to ``service-lifecycle-events`` — mirrors GCS JSONL envelope over Pub/Sub."""

    event: str
    service: str
    timestamp: str
    severity: str = "INFO"
    details: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    correlation_id: str | None = None


class HealthAlertMessage(BaseModel):
    """Published to ``health-alerts`` when a service transitions to degraded/unhealthy."""

    service_name: str
    status: str
    previous_status: str | None = None
    timestamp: str
    components: dict[str, str] = Field(default_factory=dict)
    uptime_seconds: float | None = None


class CircuitBreakerEventMessage(BaseModel):
    """Published to ``circuit-breaker-events`` on state transition."""

    name: str
    previous_state: str
    new_state: str
    timestamp: str
    reason: str | None = None
    failure_count: int = 0
    service_name: str | None = None
