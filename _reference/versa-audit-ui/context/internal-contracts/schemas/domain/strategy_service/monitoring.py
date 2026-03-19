"""Strategy-service monitoring data schemas.

These are the primary data containers produced by strategy-service monitoring
components (PositionMonitor, ExposureMonitor, RiskMonitor, PnLMonitor,
BaseStrategyManager) and consumed by GCS storage, domain event logging, and
the execution pipeline.

All classes are @dataclass to avoid Pydantic overhead in tight compute loops.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal


@dataclass
class PositionData:
    """Point-in-time snapshot of simulated or live positions.

    Attributes:
        positions: instrument_key → quantity (positive = long, negative = short).
        position_type: "simulated" for backtest, "live" for production.
        trigger_source: Component that triggered the snapshot.
        metadata: Arbitrary key-value pairs for debugging.
    """

    positions: dict[str, float]
    position_type: str
    trigger_source: str
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass
class ExposureData:
    """Point-in-time exposure snapshot — positions converted to share-class currency.

    Attributes:
        exposures: instrument_key → exposure dict with keys:
            ``amount`` (float), ``value_share_class`` (float), ``value_usd`` (float),
            ``delta`` (float | None), ``price_usd`` (float | None),
            ``price_share_class`` (float | None).
        total_delta: Net delta in share-class units (sum of all instrument deltas).
    """

    exposures: dict[str, dict[str, object]]
    total_delta: float = 0.0


@dataclass
class RiskData:
    """Risk assessment result from RiskMonitor.

    Attributes:
        risk_level: Severity — "low" | "medium" | "high" | "critical".
        warnings: Human-readable warning messages.
        breaches: Machine-readable breach codes (e.g. "health_factor_below_min").
        health_factor: AAVE health factor (None if not applicable).
        ltv_ratio: Loan-to-value ratio (None if not applicable).
        liquidation_threshold: LTV threshold triggering liquidation.
        margin_usage: CEX margin utilisation fraction (None if not applicable).
        metadata: Arbitrary key-value pairs.
    """

    risk_level: str
    warnings: list[str] = field(default_factory=list)
    breaches: list[str] = field(default_factory=list)
    health_factor: float | None = None
    ltv_ratio: float | None = None
    liquidation_threshold: float | None = None
    margin_usage: float | None = None
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass
class PnLData:
    """Comprehensive P&L metrics produced by PnLMonitor.

    Attributes:
        total_equity_current: Current portfolio equity in share class.
        total_equity_initial: Initial capital in share class.
        pnl_cumulative: total_equity_current - total_equity_initial.
        pnl_hourly: P&L in the most recent one-hour window.
        pnl_percentage: pnl_cumulative / total_equity_initial x 100.
        total_assets: Sum of asset positions in share class.
        total_debts: Sum of debt positions (absolute value) in share class.
        asset_positions: instrument_key -> value_share_class for assets.
        debt_positions: instrument_key -> value_share_class (negative) for debts.
        excluded_derivatives: Derivative positions excluded from equity.
        share_class: Reporting currency (e.g. "USDT", "BTC").
        cumulative_volume: Running volume traded in share class.
        pnl_bps: pnl_cumulative / cumulative_volume x 10,000.
        rolling_sharpe_ratio: Annualised Sharpe over rolling window.
        rolling_sortino_ratio: Annualised Sortino over rolling window.
        max_drawdown: Maximum drawdown as fraction (0-1).
        high_water_mark: Peak equity reached so far.
        current_drawdown: Current drawdown from high water mark as fraction.
        metadata: Arbitrary key-value pairs.
    """

    total_equity_current: Decimal
    total_equity_initial: Decimal
    pnl_cumulative: Decimal
    pnl_hourly: Decimal
    pnl_percentage: Decimal
    total_assets: Decimal
    total_debts: Decimal
    share_class: str = "USDT"
    cumulative_volume: Decimal = Decimal("0")
    pnl_bps: int = 0
    rolling_sharpe_ratio: Decimal = Decimal("0")
    rolling_sortino_ratio: Decimal = Decimal("0")
    max_drawdown: Decimal = Decimal("0")
    high_water_mark: Decimal = Decimal("0")
    current_drawdown: Decimal = Decimal("0")
    asset_positions: dict[str, Decimal] = field(default_factory=dict)
    debt_positions: dict[str, Decimal] = field(default_factory=dict)
    excluded_derivatives: dict[str, Decimal] = field(default_factory=dict)
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass
class OrderData:
    """A single execution order produced by a strategy manager.

    Attributes:
        order_id: Unique identifier for this order (typically a UUID).
        operation_id: Idempotency key for the underlying operation.
        operation_type: High-level operation type (e.g. "SPOT_TRADE", "PERP_TRADE",
            "DEFI_SWAP").
        venue: Canonical venue slug (e.g. "binance", "aave_v3").
        source_venue: Venue holding the source tokens.
        target_venue: Venue to receive the target tokens.
        source_token: Token being sold or consumed.
        target_token: Token being bought or received.
        amount: Absolute size of the order.
        expected_deltas: instrument_key → expected position delta post-execution.
        strategy_id: Strategy that generated this order.
        strategy_intent: Human-readable intent label (e.g. "entry_full", "rebalance").
        metadata: Arbitrary key-value pairs for routing/audit.
    """

    order_id: str
    operation_id: str
    operation_type: str
    venue: str
    source_venue: str
    target_venue: str
    source_token: str
    target_token: str
    amount: Decimal
    strategy_id: str
    expected_deltas: dict[str, Decimal] = field(default_factory=dict)
    strategy_intent: str = ""
    metadata: dict[str, object] = field(default_factory=dict)


@dataclass
class StrategyDecisionData:
    """The outcome of a strategy manager's decision cycle.

    Attributes:
        decision_type: High-level classification (e.g. "ENTER", "EXIT", "HOLD",
            "REBALANCE").
        trigger_source: Event that triggered the decision cycle.
        orders_generated: Number of orders produced (set after generate_orders()).
        action_taken: Machine-readable action code.
        reasoning: Human-readable explanation logged for audit.
        market_conditions: Snapshot of relevant market data at decision time.
        portfolio_state: Snapshot of portfolio state at decision time.
        risk_level: Risk assessment at decision time.
        constraints_violated: List of constraint codes that were breached.
        target_delta: Desired net delta after execution.
        delta_drift: Current net delta minus target delta.
        metadata: Arbitrary key-value pairs.
    """

    decision_type: str
    trigger_source: str
    orders_generated: int = 0
    action_taken: str = ""
    reasoning: str = ""
    risk_level: str = "low"
    target_delta: float = 0.0
    delta_drift: float = 0.0
    market_conditions: dict[str, object] = field(default_factory=dict)
    portfolio_state: dict[str, object] = field(default_factory=dict)
    constraints_violated: list[str] = field(default_factory=list)
    metadata: dict[str, object] = field(default_factory=dict)


__all__ = [
    "ExposureData",
    "OrderData",
    "PnLData",
    "PositionData",
    "RiskData",
    "StrategyDecisionData",
]
