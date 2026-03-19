"""Prime broker canonical types — credit intermediation, cross-venue netting, settlement.

Normalised canonical types for prime broker operations (HiddenRoad, Talos,
FalconX, etc.). When a specific PB API integration is added, its raw schemas
go in external/{provider}/ and normalize to these types.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class PrimeBrokerProvider(StrEnum):
    HIDDEN_ROAD = "hidden_road"
    TALOS = "talos"
    FALCON_X = "falconx"
    GENESIS = "genesis"
    CUMBERLAND = "cumberland"
    OTHER = "other"


class CollateralAsset(BaseModel):
    asset: str
    quantity: Decimal
    value_usd: Decimal
    haircut_pct: float = Field(description="collateral haircut percentage applied by PB")
    eligible_for_margin: bool = True


class PrimeBrokerAccount(BaseModel):
    """Prime broker account snapshot — credit limit and collateral."""

    account_id: str = Field(..., json_schema_extra={"pii": True})
    provider: PrimeBrokerProvider
    timestamp: datetime
    credit_limit_usd: Decimal
    used_credit_usd: Decimal
    available_credit_usd: Decimal
    collateral_assets: list[CollateralAsset] = Field(default_factory=list)
    total_collateral_usd: Decimal = Decimal("0")
    margin_utilization_pct: float | None = None
    is_active: bool = True
    account_type: str = "omnibus"


class PrimeBrokerPosition(BaseModel):
    """Cross-venue netted position at the prime broker level."""

    account_id: str = Field(..., json_schema_extra={"pii": True})
    instrument_id: str
    timestamp: datetime
    gross_notional_usd: Decimal
    net_notional_usd: Decimal
    long_qty: Decimal = Decimal("0")
    short_qty: Decimal = Decimal("0")
    net_qty: Decimal = Decimal("0")
    venues: list[str] = Field(default_factory=list, description="venues holding sub-positions")
    mark_price: Decimal | None = None
    unrealized_pnl_usd: Decimal | None = None
    netting_efficiency_pct: float | None = Field(default=None, description="% margin saved via cross-venue netting")


class PrimeBrokerMarginCall(BaseModel):
    """Margin call issued by the prime broker."""

    call_id: str
    account_id: str = Field(..., json_schema_extra={"pii": True})
    issued_at: datetime
    due_by: datetime
    call_amount_usd: Decimal
    currency: str = "USD"
    reason: str
    current_margin_ratio: float
    required_margin_ratio: float
    collateral_shortfall_usd: Decimal
    remediation_options: list[str] = Field(
        default_factory=list,
        description="e.g. ['deposit_usdc', 'reduce_position_btc']",
    )
    is_urgent: bool = False


class NetClearingInstruction(BaseModel):
    """Instruction to net-clear a position across two venues via the prime broker."""

    clearing_id: str
    account_id: str = Field(..., json_schema_extra={"pii": True})
    from_venue: str
    to_venue: str
    instrument_id: str
    net_qty: Decimal
    direction: str = Field(description="buy or sell — net direction to achieve")
    settlement_date: str = Field(description="YYYY-MM-DD settlement date")
    settlement_currency: str = "USD"
    estimated_margin_saving_usd: Decimal | None = None
    initiated_at: datetime | None = None
    status: str = "pending"


class CrossMarginNettingResult(BaseModel):
    """Result of computing cross-venue margin netting."""

    account_id: str = Field(..., json_schema_extra={"pii": True})
    computed_at: datetime
    original_margin_usd: Decimal = Field(description="sum of per-venue margins before netting")
    net_margin_usd: Decimal = Field(description="margin after cross-venue netting credits")
    saved_margin_usd: Decimal
    saved_margin_pct: float
    netting_instructions: list[NetClearingInstruction] = Field(default_factory=list)
    span_credit_applied: Decimal | None = None


class PrimeBrokerFill(BaseModel):
    """Fill that cleared through a prime broker (enriched with clearing metadata)."""

    fill_id: str
    order_id: str
    account_id: str = Field(..., json_schema_extra={"pii": True})
    prime_broker: PrimeBrokerProvider
    timestamp: datetime
    instrument_id: str
    side: str
    quantity: Decimal
    price: Decimal
    gross_price: Decimal = Field(description="price before PB fee")
    net_price_after_fees: Decimal
    pb_fee_usd: Decimal | None = None
    settlement_date: str | None = None
    cleared_through: str | None = Field(default=None, description="CCP or bilateral")
    transaction_reference: str | None = None


class PrimeBrokerError(BaseModel):
    code: str
    message: str
    timestamp: datetime | None = None

    def classify(self) -> str:
        code_lower = self.code.lower()
        if "margin" in code_lower or "credit" in code_lower:
            return "margin_breach"
        if "auth" in code_lower or "token" in code_lower:
            return "auth_failure"
        if "limit" in code_lower:
            return "rate_limit"
        return "unknown"
