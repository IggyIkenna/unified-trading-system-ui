"""DeFi protocol data schemas — lending, staking, oracles, liquidity pools."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass
class LiquidityPool:
    """Liquidity pool snapshot."""

    protocol: str
    chain: str
    pool_address: str
    token0: str
    token1: str
    reserve0: Decimal
    reserve1: Decimal
    total_liquidity_usd: Decimal
    volume_24h_usd: Decimal
    fee_tier: Decimal = Decimal("0.003")
    timestamp: datetime | None = None


@dataclass
class OraclePrice:
    """Oracle price feed snapshot."""

    oracle: str
    pair: str
    price: Decimal
    timestamp: datetime
    confidence: Decimal | None = None
    chain: str | None = None


@dataclass
class StakingRate:
    """Staking rate snapshot."""

    protocol: str
    asset: str
    apy: Decimal
    tvl_usd: Decimal
    timestamp: datetime
    chain: str | None = None


@dataclass
class LendingRate:
    """Lending rate snapshot."""

    protocol: str
    asset: str
    supply_apy: Decimal
    borrow_apy: Decimal
    utilization_rate: Decimal
    tvl_usd: Decimal
    timestamp: datetime
    chain: str | None = None
