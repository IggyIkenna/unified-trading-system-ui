"""On-chain feature schemas for features-onchain-service."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class OnchainFeatureRecord(BaseModel):
    """Output row from features-onchain-service (DeFi/on-chain metrics)."""

    timestamp: datetime
    instrument_key: str = Field(description="DEFI:PROTOCOL:TOKEN:CHAIN identifier")
    lending_rate: float | None = None
    borrowing_rate: float | None = None
    utilization_ratio: float | None = None
    staking_yield: float | None = None
    reward_apy: float | None = None
    tvl: Decimal | None = None
    available_liquidity: Decimal | None = None
    ltv: float | None = Field(default=None, description="Loan-to-value ratio")
    liquidation_threshold: float | None = None
    market_state: str | None = Field(
        default=None,
        description="normal, halted, auction, pre_market, post_market, closed",
    )
    is_halted: bool | None = None
    is_auction: bool | None = None
