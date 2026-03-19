"""Institutional account schemas: deposits, withdrawals, sub-accounts, fee schedules, margin.

Shared schemas for CeFi exchange APIs (Binance, OKX, Bybit, etc.).
"""

from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class DepositAddress(BaseModel):
    """Deposit address for a network."""

    network: str = Field(..., description="Blockchain network (e.g. ETH, TRC20)")
    address: str = Field(..., description="Deposit address")
    addressTag: str | None = Field(None, description="Memo/tag (XRP, XLM, etc.)")
    url: str | None = Field(None, description="Explorer or deposit info URL")


class DepositRecord(BaseModel):
    """Deposit transaction record."""

    status: str = Field(..., description="Status (e.g. pending, completed, failed)")
    amount: Decimal = Field(..., description="Deposit amount")
    asset: str = Field(..., description="Asset symbol (e.g. BTC, USDT)")
    network: str = Field(..., description="Blockchain network")
    txId: str | None = Field(None, description="Transaction ID on chain")
    confirmTimes: str | None = Field(None, description="Confirmations (e.g. 12/15)")


class WithdrawalRecord(BaseModel):
    """Withdrawal transaction record."""

    status: str = Field(..., description="Status (e.g. pending, completed, failed)")
    amount: Decimal = Field(..., description="Withdrawal amount")
    asset: str = Field(..., description="Asset symbol")
    network: str = Field(..., description="Blockchain network")
    txId: str | None = Field(None, description="Transaction ID on chain")
    fee: Decimal | None = Field(None, description="Network fee charged")


class InternalTransfer(BaseModel):
    """Internal transfer between account types."""

    fromAccountType: str = Field(..., description="Source account type (e.g. SPOT, FUTURES)")
    toAccountType: str = Field(..., description="Destination account type")
    asset: str = Field(..., description="Asset symbol")
    amount: Decimal = Field(..., description="Transfer amount")


class SubAccount(BaseModel):
    """Sub-account entry."""

    id: str = Field(..., description="Sub-account ID")
    email: str | None = Field(
        default=None, description="Sub-account email", json_schema_extra={"pii": True}
    )
    isFreeze: bool = Field(False, description="Whether sub-account is frozen")


class ExchangeFeeSchedule(BaseModel):
    """Fee tier schedule."""

    tier: int = Field(..., description="Fee tier level")
    makerRate: Decimal = Field(..., description="Maker fee rate")
    takerRate: Decimal = Field(..., description="Taker fee rate")
    volumeThreshold: Decimal | None = Field(None, description="Volume threshold for tier (USD)")


class PortfolioMarginAccount(BaseModel):
    """Portfolio margin account snapshot."""

    totalEquity: Decimal = Field(..., description="Total equity (USD)")
    actualEquity: Decimal = Field(..., description="Actual equity after unrealized PnL")
    availableBalance: Decimal = Field(..., description="Available balance for trading")
    uniMMR: Decimal | None = Field(None, description="Unified maintenance margin ratio")
    accountMaintMargin: Decimal | None = Field(None, description="Account maintenance margin")
