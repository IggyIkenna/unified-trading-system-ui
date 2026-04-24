"""Canonical execution schemas — shared base types, enums, and core models.

Identifier convention
---------------------
``instrument_id``   — venue-opaque execution identifier used in CanonicalOrder,
                      CanonicalFill, and ExecutionInstruction. May be a numeric or
                      string ID assigned by the venue (e.g. Binance symbol "BTCUSDT",
                      Deribit contract name "BTC-PERPETUAL"). Execution adapters are
                      responsible for mapping this to the canonical ``instrument_key``
                      when bridging to market-data layer.

``instrument_key``  — canonical cross-venue market-data identifier in
                      ``VENUE:TYPE:SYMBOL`` format. Lives in domain.py schemas only;
                      NOT used in execution schemas. Execution-to-market-data joins
                      must go through the instruments-service lookup.
"""

from __future__ import annotations

from decimal import Decimal
from enum import StrEnum

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field


class _CanonicalBase(BaseModel):
    """Base for all canonical execution schemas — rejects unknown fields."""

    model_config = ConfigDict(extra="forbid")


class OrderSide(StrEnum):
    BUY = "buy"
    SELL = "sell"


class OrderType(StrEnum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"
    TRAILING_STOP = "trailing_stop"
    TWAP = "twap"
    VWAP = "vwap"


class OrderStatus(StrEnum):
    PENDING = "pending"
    OPEN = "open"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"


class TimeInForce(StrEnum):
    GTC = "GTC"
    IOC = "IOC"
    FOK = "FOK"
    GTD = "GTD"
    POST_ONLY = "POST_ONLY"


class OperationType(StrEnum):
    # CeFi / TradFi
    BUY = "BUY"
    SELL = "SELL"
    # DeFi — DEX
    SWAP = "SWAP"
    # DeFi — Lending
    LEND = "LEND"
    BORROW = "BORROW"
    REPAY = "REPAY"
    WITHDRAW = "WITHDRAW"
    DEPOSIT = "DEPOSIT"
    # DeFi — Staking / LST
    STAKE = "STAKE"
    UNSTAKE = "UNSTAKE"
    # DeFi — Flash Loans (atomic)
    FLASH_BORROW = "FLASH_BORROW"
    FLASH_REPAY = "FLASH_REPAY"
    # DeFi — LP
    ADD_LIQUIDITY = "ADD_LIQUIDITY"
    REMOVE_LIQUIDITY = "REMOVE_LIQUIDITY"
    REBALANCE_RANGE = "REBALANCE_RANGE"
    COLLECT_FEES = "COLLECT_FEES"
    # DeFi — Rewards
    CLAIM_REWARD = "CLAIM_REWARD"
    SELL_REWARD = "SELL_REWARD"
    # Cross-cutting
    TRANSFER = "TRANSFER"
    TRADE = "TRADE"
    REBALANCE = "REBALANCE"


class ExecutionStatus(StrEnum):
    PENDING = "pending"
    SUBMITTED = "submitted"
    PARTIAL = "partial"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    TIMEOUT = "timeout"


class BenchmarkType(StrEnum):
    ARRIVAL = "arrival"
    VWAP = "vwap"
    TWAP = "twap"
    CLOSE = "close"
    MID = "mid"


# ---------------------------------------------------------------------------
# Canonical execution schema version constants
# ---------------------------------------------------------------------------

CANONICAL_ORDER_VERSION = "1.0.0"
CANONICAL_FILL_VERSION = "1.0.0"
CANONICAL_EXECUTION_INSTRUCTION_VERSION = "1.0.0"
CANONICAL_EXECUTION_RESULT_VERSION = "1.0.0"

# ---------------------------------------------------------------------------
# Order / Fill — canonical cross-venue
# ---------------------------------------------------------------------------


class CanonicalOrder(_CanonicalBase):
    order_id: str
    client_order_id: str | None = None
    timestamp: AwareDatetime
    venue: str
    instrument_id: str
    side: OrderSide
    order_type: OrderType
    quantity: Decimal
    price: Decimal | None = None
    time_in_force: TimeInForce = TimeInForce.GTC
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: Decimal = Decimal("0")
    remaining_quantity: Decimal | None = None
    average_fill_price: Decimal | None = None
    strategy_id: str | None = None
    client_id: str | None = Field(default=None, json_schema_extra={"pii": True})
    # Shard dimensions — resolved at write time by RecordEnricher
    strategy_name: str | None = Field(default=None, description="Display name from StrategyRegistry")
    client_name: str | None = Field(default=None, description="Display name from ClientRegistry")
    category: str | None = Field(default=None, description="CEFI, DEFI, TRADFI, SPORTS, PREDICTION")
    strategy_family: str | None = Field(default=None, description="Strategy family from registry")
    chain: str | None = Field(default=None, description="Blockchain for DeFi orders")
    account_id: str | None = Field(default=None, description="Composite account key (client:venue:label)")
    share_class: str | None = Field(default=None, description="Base currency denomination (USDT, ETH, BTC)")
    # Derivative-specific optional fields
    reduce_only: bool | None = None
    stop_price: Decimal | None = None
    leverage: Decimal | None = None
    margin_mode: str | None = Field(default=None, description="cross or isolated")
    schema_version: str = CANONICAL_ORDER_VERSION


class CanonicalFill(_CanonicalBase):
    """Fill record — also used as Pub/Sub fill-events-{venue} message body."""

    fill_id: str
    order_id: str
    timestamp: AwareDatetime
    venue: str
    instrument_id: str
    side: OrderSide
    price: Decimal
    quantity: Decimal
    fee: Decimal | None = None
    fee_currency: str | None = None
    is_maker: bool | None = None
    strategy_id: str | None = None
    client_id: str | None = Field(default=None, json_schema_extra={"pii": True})
    # Shard dimensions — resolved at write time by RecordEnricher
    strategy_name: str | None = Field(default=None, description="Display name from StrategyRegistry")
    client_name: str | None = Field(default=None, description="Display name from ClientRegistry")
    category: str | None = Field(default=None, description="CEFI, DEFI, TRADFI, SPORTS, PREDICTION")
    strategy_family: str | None = Field(default=None, description="Strategy family from registry")
    chain: str | None = Field(default=None, description="Blockchain for DeFi fills")
    account_id: str | None = Field(default=None, description="Composite account key (client:venue:label)")
    share_class: str | None = Field(default=None, description="Base currency denomination (USDT, ETH, BTC)")
    fee_rate: Decimal | None = None
    rebate: Decimal | None = None
    realized_pnl: Decimal | None = None
    schema_version: str = CANONICAL_FILL_VERSION


# ---------------------------------------------------------------------------
# Execution instructions (strategy → execution routing)
# ---------------------------------------------------------------------------


class ExecutionInstruction(_CanonicalBase):
    """Single atomic execution directive (from execution-services)."""

    instruction_id: str
    operation: OperationType
    timestamp: AwareDatetime
    from_venue: str | None = None
    to_venue: str | None = None
    instrument_id: str | None = None
    token_in: str | None = None
    amount: Decimal | None = None
    token_out: str | None = None
    direction: str | None = None
    target_position: Decimal | None = None
    max_slippage_bps: int | None = None
    limit_price: Decimal | None = None
    order_type: OrderType | None = None
    benchmark_price: Decimal | None = None
    benchmark_type: BenchmarkType | None = None
    stop_loss_price: Decimal | None = None
    take_profit_price: Decimal | None = None
    gas_limit: int | None = None
    priority_fee_gwei: Decimal | None = None
    deadline_timestamp: AwareDatetime | None = None
    metadata: dict[str, str | int | float | bool | None] = Field(default_factory=dict)
    schema_version: str = CANONICAL_EXECUTION_INSTRUCTION_VERSION


class ExecutionResult(_CanonicalBase):
    """Result of a single ExecutionInstruction."""

    instruction_id: str
    operation: OperationType
    status: ExecutionStatus
    timestamp_submitted: AwareDatetime
    timestamp_completed: AwareDatetime | None = None
    actual_execution_price: Decimal | None = None
    benchmark_price: Decimal | None = None
    amount_executed: Decimal | None = None
    amount_received: Decimal | None = None
    slippage_bps: Decimal | None = None
    gas_used: int | None = None
    gas_price_gwei: Decimal | None = None
    transaction_hash: str | None = None
    error_message: str | None = None
    schema_version: str = CANONICAL_EXECUTION_RESULT_VERSION


# ---------------------------------------------------------------------------
# Execution Alpha — quality metrics returned for every execution
# ---------------------------------------------------------------------------

CANONICAL_EXECUTION_ALPHA_VERSION = "1.0.0"


class ExecutionAlpha(_CanonicalBase):
    """Execution quality metrics returned for every execution.

    Captures how well an instruction was executed relative to arrival price.
    One ExecutionAlpha is produced per executed instruction regardless of type.
    """

    strategy_id: str
    instruction_id: str
    instruction_type: str  # InstructionType value (TRADE, SWAP, OPTIONS_COMBO, etc.)
    venue: str
    algo_used: str  # TWAP, VWAP, SOR, BENCHMARK_FILL, BEST_PRICE, etc.
    arrival_price: Decimal
    fill_price: Decimal
    execution_alpha_bps: Decimal  # fill improvement vs arrival (positive = better)
    slippage_bps: Decimal
    market_impact_bps: Decimal
    timing_alpha_bps: Decimal
    fill_rate_pct: Decimal
    latency_ms: Decimal
    fees_bps: Decimal
    schema_version: str = CANONICAL_EXECUTION_ALPHA_VERSION
