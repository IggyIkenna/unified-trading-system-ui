"""DeFi protocol payload schemas — Aave, Curve.

Internal domain schemas for features-onchain-service and unified-defi-execution-interface.
Moved from UAC protocol_sdks.py.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class AaveBorrowParams(BaseModel):
    """AAVE V3 borrow payload."""

    asset: str = Field(..., description="Token to borrow")
    amount: str = Field(..., description="Amount (wei string)")
    interestRateMode: Literal[1, 2] = Field(2, description="1=stable, 2=variable")  # noqa: N815
    referralCode: int | None = Field(0, description="Referral code")  # noqa: N815
    onBehalfOf: str | None = Field(None, description="Debt recipient")  # noqa: N815


class CurveDepositParams(BaseModel):
    """Curve pool deposit (add_liquidity) payload."""

    amounts: list[str] = Field(..., description="Token amounts (wei strings)")
    min_mint_amount: str = Field("0", description="Min LP tokens (wei string)")
    use_eth: bool = Field(False, description="Use ETH for one of the coins")
