"""CEX withdrawal schemas: Binance, OKX, Bybit, Upbit, Coinbase.

Scope: Withdrawal request/response per venue. Aligned with Agent 3 (Orders/Positions).
"""

from __future__ import annotations

from pydantic import BaseModel, Field

__all__ = [
    "BinanceWithdrawRequest",
    "BinanceWithdrawResponse",
    "BybitWithdrawRequest",
    "BybitWithdrawResponse",
    "CoinbaseWithdrawRequest",
    "CoinbaseWithdrawResponse",
    "OKXWithdrawRequest",
    "OKXWithdrawResponse",
    "UpbitWithdrawRequest",
    "UpbitWithdrawResponse",
]


# --- Binance ---
class BinanceWithdrawRequest(BaseModel):
    """Binance withdrawal request (POST /sapi/v1/capital/withdraw/apply).

    Ref: https://developers.binance.com/docs/wallet/capital/withdraw
    """

    coin: str = Field(..., description="Cryptocurrency to withdraw")
    address: str = Field(..., description="Withdrawal destination address")
    amount: str = Field(..., description="Amount to withdraw")
    network: str | None = Field(None, description="Blockchain network (default if omitted)")
    addressTag: str | None = Field(None, description="Secondary address (XRP, XMR, etc.)")
    withdrawOrderId: str | None = Field(None, description="Client-side withdrawal ID")
    transactionFeeFlag: bool | None = Field(None, description="Return fees to destination")
    walletType: int | None = Field(None, description="0=spot, 1=funding")


class BinanceWithdrawResponse(BaseModel):
    """Binance withdrawal response."""

    id: str = Field(..., description="Withdrawal ID")


# --- OKX ---
class OKXWithdrawRequest(BaseModel):
    """OKX withdrawal request (POST /api/v5/asset/withdrawal).

    Ref: https://www.okx.com/docs-v5/en/#rest-api-funding-withdrawal
    """

    ccy: str = Field(..., description="Currency (e.g. BTC, ETH)")
    amt: str = Field(..., description="Withdrawal amount")
    dest: str = Field(..., description="4=on-chain, 6=internal transfer")
    toAddr: str = Field(..., description="Destination address")
    chain: str | None = Field(None, description="Chain (e.g. ETH-ERC20)")
    fee: str | None = Field(None, description="Network fee (optional for internal)")
    clientId: str | None = Field(None, description="Client-supplied ID")


class OKXWithdrawResponse(BaseModel):
    """OKX withdrawal response."""

    wdId: str | None = Field(None, description="Withdrawal ID")
    ccy: str | None = None
    chain: str | None = None
    amt: str | None = None
    clientId: str | None = None


# --- Bybit ---
class BybitWithdrawRequest(BaseModel):
    """Bybit withdrawal request (POST /v5/asset/withdraw/create).

    Ref: https://bybit-exchange.github.io/docs/v5/asset/withdraw
    """

    coin: str = Field(..., description="Currency (e.g. BTC, USDT)")
    chain: str = Field(..., description="Chain type (e.g. ETH, TRC20)")
    address: str = Field(..., description="Destination address")
    amount: str = Field(..., description="Withdrawal amount")
    tag: str | None = Field(None, description="Memo/tag for XRP, XLM, etc.")
    forceChain: int | None = Field(None, description="0=default, 1=force chain")
    accountType: str | None = Field(None, description="UNIFIED, CONTRACT, SPOT")


class BybitWithdrawResponse(BaseModel):
    """Bybit withdrawal response."""

    withdrawId: str | None = Field(None, description="Withdrawal ID")
    success: bool | None = None


# --- Upbit ---
class UpbitWithdrawRequest(BaseModel):
    """Upbit withdrawal request (POST /v1/withdraws/krw or /v1/withdraws/coin).

    Ref: Upbit API docs
    """

    currency: str = Field(..., description="Currency (e.g. BTC, KRW)")
    amount: str = Field(..., description="Withdrawal amount")
    address: str | None = Field(None, description="Destination address (crypto)")
    secondary_address: str | None = Field(None, description="Memo/tag (crypto)")
    bank: str | None = Field(None, description="Bank code (KRW)")
    account: str | None = Field(None, description="Account number (KRW)")


class UpbitWithdrawResponse(BaseModel):
    """Upbit withdrawal response."""

    uuid: str | None = Field(None, description="Withdrawal ID")
    currency: str | None = None
    net_type: str | None = None
    amount: str | None = None
    state: str | None = None


# --- Coinbase ---
class CoinbaseWithdrawRequest(BaseModel):
    """Coinbase withdrawal request (POST /v2/accounts/:id/transactions).

    Ref: Coinbase API - create withdrawal
    """

    type: str = Field("send", description="Transaction type (send for withdraw)")
    to: str = Field(..., description="Destination address or Coinbase ID")
    amount: str = Field(..., description="Amount to withdraw")
    currency: str = Field(..., description="Currency (e.g. BTC, ETH)")
    network: str | None = Field(None, description="Network (e.g. ethereum, bitcoin)")
    idem: str | None = Field(None, description="Idempotency key")


class CoinbaseWithdrawResponse(BaseModel):
    """Coinbase withdrawal response."""

    id: str | None = Field(None, description="Transaction ID")
    status: str | None = None
    amount: dict[str, object] | None = None
