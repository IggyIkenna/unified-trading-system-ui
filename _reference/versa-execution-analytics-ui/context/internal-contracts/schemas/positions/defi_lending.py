"""DeFi lending position schemas (Aave, Compound, etc.)."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class LendingEntry(BaseModel):
    """A single supplied or borrowed asset entry in a lending position."""

    asset: str
    amount: Decimal
    apy: Decimal = Decimal("0")
    value_usd: Decimal = Decimal("0")
    entry_type: Literal["supply", "borrow"]


class DeFiLendingPosition(BaseModel):
    """Canonical DeFi lending/borrowing position (Aave, Compound, etc.)."""

    schema_version: Literal["v1"] = "v1"
    protocol: str = Field(..., description="e.g. aave_v3, compound_v3")
    chain: str = Field(..., description="e.g. ethereum, arbitrum, base")
    supplied: list[LendingEntry] = Field(default_factory=list)
    borrowed: list[LendingEntry] = Field(default_factory=list)
    health_factor: Decimal | None = None
    ltv_ratio: Decimal | None = Field(None, description="Loan-to-value ratio 0-1")
    net_apy: Decimal = Decimal("0")
    collateral_usd: Decimal = Decimal("0")
    debt_usd: Decimal = Decimal("0")
    client_id: str = Field(..., json_schema_extra={"pii": True})
    strategy_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    raw: dict[str, object] = Field(default_factory=dict)

    model_config = {"frozen": False}
