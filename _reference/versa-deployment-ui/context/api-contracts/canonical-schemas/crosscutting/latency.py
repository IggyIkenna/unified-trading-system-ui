"""HFT and latency measurement schemas — tick-to-trade, co-location, order latency."""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


class LatencyComponent(StrEnum):
    MARKET_DATA_DECODE = "market_data_decode"
    SIGNAL_GENERATION = "signal_generation"
    RISK_CHECK = "risk_check"
    ORDER_ENCODING = "order_encoding"
    NETWORK_SEND = "network_send"
    EXCHANGE_PROCESSING = "exchange_processing"
    NETWORK_RECEIVE = "network_receive"
    FILL_DECODE = "fill_decode"


class LatencyPercentile(BaseModel):
    """Latency distribution at key percentiles (all values in microseconds)."""

    p50_us: float
    p90_us: float
    p95_us: float
    p99_us: float
    p999_us: float
    min_us: float | None = None
    max_us: float | None = None
    mean_us: float | None = None
    sample_count: int | None = None


class TickToTradeMetric(BaseModel):
    """Measures latency from receiving a market data tick to submitting an order.

    All timestamps in integer nanoseconds UTC.
    """

    measurement_id: str
    instrument_key: str
    strategy_id: str | None = None
    trigger_ts_ns: int = Field(description="ns UTC when trigger tick was received")
    signal_ts_ns: int | None = Field(default=None, description="ns UTC when signal fired")
    risk_check_ts_ns: int | None = Field(default=None, description="ns UTC after risk check pass")
    order_sent_ts_ns: int = Field(description="ns UTC when order was sent to exchange")
    ack_ts_ns: int | None = Field(default=None, description="ns UTC when exchange ACK received")
    fill_ts_ns: int | None = Field(default=None, description="ns UTC of first fill (if any)")
    tick_to_signal_us: float | None = None
    tick_to_risk_check_us: float | None = None
    tick_to_order_us: float = Field(description="tick_to_trade = trigger to order_sent")
    order_to_ack_us: float | None = None
    order_to_fill_us: float | None = None
    venue: str | None = None
    session: str | None = None


class OrderLatencyRecord(BaseModel):
    """Per-order end-to-end latency record stored to GCS for analysis."""

    order_id: str
    venue: str
    strategy: str | None = None
    instrument_id: str
    order_type: str
    side: str
    timestamp: datetime
    component_latencies: dict[str, float] = Field(
        default_factory=dict,
        description="LatencyComponent -> microseconds breakdown",
    )
    total_us: float
    percentile_snapshot: LatencyPercentile | None = Field(
        default=None, description="rolling percentile at time of order"
    )
    is_outlier: bool = False
    outlier_reason: str | None = None


class CoLocationPerformanceMetric(BaseModel):
    """Performance metrics for co-located infrastructure at a specific datacenter."""

    venue: str
    datacenter: str = Field(description="e.g. LD4, NY4, TY3, SG1")
    measured_at: datetime
    avg_rtt_us: float = Field(description="average round-trip time to exchange matching engine")
    jitter_us: float = Field(description="RTT standard deviation in microseconds")
    p99_rtt_us: float
    packet_loss_pct: float = Field(description="packet loss percentage (0-100)")
    network_hops: int | None = None
    link_bandwidth_gbps: float | None = None
    fiber_distance_km: float | None = None
    cross_connect_type: str | None = Field(default=None, description="e.g. 10G MM fiber, 1G copper")


class NetworkJitterMetric(BaseModel):
    """Short-window network jitter measurement."""

    measured_at: datetime
    measurement_window_ms: int = Field(description="measurement window in milliseconds")
    venue: str
    datacenter: str | None = None
    jitter_p50_us: float
    jitter_p99_us: float
    jitter_p999_us: float
    packet_loss_pct: float = 0.0
    sample_count: int | None = None


class SubMillisecondLatencyRecord(BaseModel):
    """General sub-millisecond operation timing record."""

    record_id: str
    component: LatencyComponent
    operation: str
    latency_ns: int = Field(description="nanoseconds")
    timestamp_ns: int = Field(description="ns UTC when measurement was taken")
    venue: str | None = None
    instrument_key: str | None = None
    strategy_id: str | None = None
    session_id: str | None = None
    cpu_affinity: int | None = Field(default=None, description="CPU core number if pinned")
    numa_node: int | None = None


class LatencyBenchmarkReport(BaseModel):
    """Aggregated latency benchmark report for a trading session."""

    session_id: str
    venue: str
    datacenter: str | None = None
    period_start: datetime
    period_end: datetime
    tick_to_trade: LatencyPercentile | None = None
    order_to_ack: LatencyPercentile | None = None
    order_to_fill: LatencyPercentile | None = None
    co_location_rtt: CoLocationPerformanceMetric | None = None
    total_orders_measured: int = 0
    outlier_count: int = 0
    outlier_threshold_us: float | None = None
    notes: str | None = None
