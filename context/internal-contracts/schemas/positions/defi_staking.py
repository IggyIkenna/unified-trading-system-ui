"""DeFi staking position schema (Lido, EigenLayer, etc.)."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class DeFiStakingPosition(BaseModel):
    """Canonical DeFi staking position."""

    schema_version: Literal["v1"] = "v1"
    protocol: str = Field(..., description="e.g. lido, eigenlayer, rocketpool")
    chain: str = Field(..., description="e.g. ethereum, arbitrum")
    staked_asset: str = Field(..., description="e.g. ETH, stETH")
    receipt_asset: str | None = Field(None, description="Receipt token e.g. stETH, rETH")
    staked_amount: Decimal
    receipt_amount: Decimal | None = None
    staked_value_usd: Decimal = Decimal("0")
    rewards_earned_usd: Decimal = Decimal("0")
    apy: Decimal = Decimal("0")
    lock_end: datetime | None = None
    position_type: Literal["liquid", "locked"] = "liquid"
    client_id: str = Field(..., json_schema_extra={"pii": True})
    strategy_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    raw: dict[str, object] = Field(default_factory=dict)

    model_config = {"frozen": False}
