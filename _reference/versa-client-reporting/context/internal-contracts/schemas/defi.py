"""DeFi-specific internal contract schemas."""

from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel


class GasCostAction(StrEnum):
    SWAP = "SWAP"
    SUPPLY = "SUPPLY"
    BORROW = "BORROW"
    STAKE = "STAKE"
    UNSTAKE = "UNSTAKE"
    WITHDRAW = "WITHDRAW"
    REPAY = "REPAY"
    LIQUIDATE = "LIQUIDATE"


class GasCostEstimate(BaseModel):
    protocol: str
    chain: str
    action: GasCostAction
    gas_estimate_gwei: Decimal
    gas_estimate_usd: Decimal | None = None
