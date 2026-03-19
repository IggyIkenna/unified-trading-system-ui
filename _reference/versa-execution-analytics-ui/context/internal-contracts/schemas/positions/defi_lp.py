"""DeFi liquidity-provider position schema."""

from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class DeFiLPPosition(BaseModel):
    """Canonical DeFi LP position (Uniswap V2/V3, Curve, Balancer, etc.)."""

    schema_version: Literal["v1"] = "v1"
    protocol: str = Field(..., description="e.g. uniswap_v3, curve, balancer")
    pool_address: str
    chain: str = Field(..., description="e.g. ethereum, arbitrum, base")
    token0: str
    token1: str
    token0_amount: Decimal
    token1_amount: Decimal
    lp_tokens: Decimal = Field(..., description="LP token balance")
    lp_token_value_usd: Decimal = Decimal("0")
    fee_tier: Decimal | None = None
    tick_lower: int | None = None
    tick_upper: int | None = None
    unrealized_pnl_usd: Decimal = Decimal("0")
    fees_earned_usd: Decimal = Decimal("0")
    client_id: str = Field(..., json_schema_extra={"pii": True})
    strategy_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC))
    raw: dict[str, object] = Field(default_factory=dict)

    model_config = {"frozen": False}
