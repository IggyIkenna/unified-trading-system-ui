"""DeFi market data schemas."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class CanonicalSwap(BaseModel):
    """Normalized swap event — Uniswap, Curve, Balancer."""

    protocol: str
    chain: str
    token_in: str
    token_out: str
    amount_in: Decimal
    amount_out: Decimal
    timestamp: datetime
    tx_hash: str = Field(default="", json_schema_extra={"pii": True, "gdpr_erasable": True})


class CanonicalLiquidityPool(BaseModel):
    """Normalized LP state — Uniswap V2/V3/V4, Curve, Balancer."""

    pool_address: str
    protocol: str
    chain: str
    token0: str
    token1: str
    fee_tier: int | None = None
    reserve0: Decimal | None = None
    reserve1: Decimal | None = None
    tvl: Decimal | None = None
    price0: Decimal | None = None
    price1: Decimal | None = None
    volume_24h: Decimal | None = None
    fees_24h: Decimal | None = None
    apy: Decimal | None = None
    tick_current: int | None = None
    sqrt_price_x96: int | None = None
    timestamp: datetime


class CanonicalLendingRate(BaseModel):
    """Normalized lending rate — Aave, Morpho, Compound."""

    protocol: str
    chain: str
    asset: str
    timestamp: datetime
    supply_apy: Decimal
    borrow_apy_variable: Decimal
    borrow_apy_stable: Decimal | None = None
    utilization_rate: Decimal | None = None
    total_supply: Decimal | None = None
    total_borrowed: Decimal | None = None
    supply_index: Decimal | None = None
    borrow_index: Decimal | None = None
    borrow_shares: Decimal | None = None
    supply_shares: Decimal | None = None
    lltv: Decimal | None = None
    health_factor: Decimal | None = None


class CanonicalStakingRate(BaseModel):
    """Normalized staking rate — Lido, EtherFi."""

    protocol: str
    chain: str
    asset: str
    apy: Decimal
    total_staked: Decimal
    rewards_per_second: Decimal | None = None


class CanonicalOraclePrice(BaseModel):
    """Normalized oracle price — Pyth, Chainlink."""

    feed_id: str
    protocol: str
    asset: str
    price: Decimal
    confidence: Decimal | None = None
    publish_time: datetime
