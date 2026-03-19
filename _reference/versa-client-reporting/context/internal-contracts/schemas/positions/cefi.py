"""CeFi position schema — canonical representation for centralised-exchange positions."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class CeFiPosition(BaseModel):
    """Canonical CeFi position (spot, perp, futures, options)."""

    schema_version: Literal["v1"] = "v1"
    instrument_key: str = Field(..., description="venue:symbol e.g. binance:BTC-USDT-PERP")
    venue: str
    symbol: str
    instrument_type: Literal["SPOT", "PERP", "FUTURE", "OPTION"]
    side: Literal["LONG", "SHORT", "FLAT"]
    size: Decimal = Field(..., description="Absolute position size")
    entry_price: Decimal
    mark_price: Decimal
    liquidation_price: Decimal | None = None
    unrealized_pnl: Decimal = Decimal("0")
    realized_pnl: Decimal = Decimal("0")
    leverage: Decimal | None = None
    margin_used: Decimal | None = None
    client_id: str = Field(..., json_schema_extra={"pii": True})
    strategy_id: str
    account_id: str | None = Field(default=None, json_schema_extra={"pii": True})
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    raw: dict[str, object] = Field(default_factory=dict)

    model_config = {"frozen": False}
