from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum
from typing import Literal

from pydantic import AwareDatetime, Field

from .._base import CanonicalBase


class CanonicalPosition(CanonicalBase):
    """Normalised position — all venues."""

    instrument_id: str
    side: str = Field(description="LONG or SHORT")
    quantity: Decimal
    entry_price: Decimal
    mark_price: Decimal
    unrealized_pnl: Decimal
    leverage: Decimal | None = None
    venue: str | None = None
    timestamp: AwareDatetime | None = None
    liquidation_price: Decimal | None = None
    raw: dict[str, object] | None = None


class CanonicalBalance(CanonicalBase):
    """Normalised balance for a single currency."""

    currency: str
    free: Decimal
    locked: Decimal
    total: Decimal
    venue: str | None = None
    available: Decimal | None = None
    timestamp: AwareDatetime | None = None
    raw: dict[str, object] | None = None


class CanonicalAccountSnapshot(CanonicalBase):
    """Full account snapshot including balances and positions."""

    venue: str
    balances: list[CanonicalBalance] = []
    positions: list[CanonicalPosition] = []
    timestamp: AwareDatetime = Field(default_factory=lambda: datetime.now(UTC))


class CanonicalSettlement(CanonicalBase):
    """Settlement event for a position or balance change."""

    venue: str
    asset: str
    amount: Decimal
    settlement_type: str
    timestamp: AwareDatetime
    raw: dict[str, object] | None = None


# ---------------------------------------------------------------------------
# Cross-venue position aggregation schemas
# ---------------------------------------------------------------------------


class VenuePositionBreakdown(CanonicalBase):
    """Per-venue component of an aggregated cross-venue position."""

    venue: str
    quantity: Decimal
    side: str = Field(description="LONG or SHORT")
    entry_price: Decimal
    mark_price: Decimal
    unrealized_pnl: Decimal
    leverage: Decimal | None = None
    instrument_type: str | None = None
    strategy_id: str | None = None
    margin_type: str | None = None
    chain: str | None = None


class AggregatedPosition(CanonicalBase):
    """Cross-venue aggregated position for a single instrument.

    Net position computed from per-venue constituents. Published to
    AGGREGATED_POSITIONS PubSub topic by position-balance-monitor-service.
    """

    instrument_id: str
    asset_class: str | None = None
    instrument_type: str | None = None
    strategy_id: str | None = None
    margin_type: str | None = None
    underlying: str | None = None
    denomination_currency: str = "USD"
    expiry: AwareDatetime | None = None
    risk_group_id: str | None = None

    net_quantity: Decimal = Field(description="Signed net quantity across all venues")
    net_side: str = Field(description="LONG, SHORT, or FLAT")
    gross_quantity: Decimal = Field(description="Sum of abs(quantity) across venues")
    per_venue: list[VenuePositionBreakdown] = Field(default_factory=list)
    weighted_avg_entry_price: Decimal = Decimal("0")
    total_unrealized_pnl: Decimal = Decimal("0")
    total_realized_pnl: Decimal = Decimal("0")
    mark_price: Decimal = Decimal("0")
    timestamp: AwareDatetime | None = None
    client_id: str | None = Field(default=None, json_schema_extra={"pii": True})
    # Shard dimensions — resolved at write time by RecordEnricher
    strategy_name: str | None = Field(default=None, description="Display name from StrategyRegistry")
    client_name: str | None = Field(default=None, description="Display name from ClientRegistry")
    category: str | None = Field(default=None, description="CEFI, DEFI, TRADFI, SPORTS, PREDICTION")
    strategy_family: str | None = Field(default=None, description="Strategy family from registry")
    account_id: str | None = Field(default=None, description="Composite account key (client:venue:label)")

    @property
    def quantity(self) -> Decimal:
        """PositionQuantityProtocol: net position quantity."""
        return self.net_quantity

    @property
    def price(self) -> Decimal:
        """PositionQuantityProtocol: average entry price."""
        return self.weighted_avg_entry_price

    @property
    def symbol(self) -> str:
        """PositionQuantityProtocol: instrument identifier."""
        return self.instrument_id


class UnderlyingGreeksBreakdown(CanonicalBase):
    """Per-underlying Greeks aggregation — same underlying nets at correlation=1."""

    underlying: str
    delta: Decimal = Decimal("0")
    gamma: Decimal = Decimal("0")
    theta: Decimal = Decimal("0")
    vega: Decimal = Decimal("0")
    rho: Decimal = Decimal("0")
    position_count: int = 0


class PortfolioGreeksSnapshot(CanonicalBase):
    """Portfolio-level Greeks with per-underlying breakdown."""

    total_delta: Decimal = Decimal("0")
    total_gamma: Decimal = Decimal("0")
    total_theta: Decimal = Decimal("0")
    total_vega: Decimal = Decimal("0")
    total_rho: Decimal = Decimal("0")
    per_underlying: list[UnderlyingGreeksBreakdown] = Field(default_factory=list)
    timestamp: AwareDatetime | None = None


class PortfolioPnLAttribution(CanonicalBase):
    """Portfolio-level PnL attribution across all 11 dimensions."""

    delta_pnl: Decimal = Decimal("0")
    gamma_pnl: Decimal = Decimal("0")
    theta_pnl: Decimal = Decimal("0")
    vega_pnl: Decimal = Decimal("0")
    rho_pnl: Decimal = Decimal("0")
    funding_pnl: Decimal = Decimal("0")
    basis_pnl: Decimal = Decimal("0")
    interest_rate_pnl: Decimal = Decimal("0")
    carry_pnl: Decimal = Decimal("0")
    fx_pnl: Decimal = Decimal("0")
    residual_pnl: Decimal = Decimal("0")
    total_pnl: Decimal = Decimal("0")
    by_asset_class: dict[str, Decimal] = Field(default_factory=dict)
    by_strategy: dict[str, Decimal] = Field(default_factory=dict)
    timestamp: AwareDatetime | None = None


class RiskGroupSummary(CanonicalBase):
    """Risk group aggregation for positions sharing the same underlying."""

    risk_group_id: str
    underlying: str
    asset_class: str
    net_delta: Decimal = Decimal("0")
    net_gamma: Decimal = Decimal("0")
    net_theta: Decimal = Decimal("0")
    net_vega: Decimal = Decimal("0")
    gross_exposure: Decimal = Decimal("0")
    net_exposure: Decimal = Decimal("0")
    position_count: int = 0
    venues: list[str] = Field(default_factory=list)
    instruments: list[str] = Field(default_factory=list)


class PortfolioView(CanonicalBase):
    """Full portfolio snapshot across all venues, asset classes, and risk groups."""

    client_id: str = Field(..., json_schema_extra={"pii": True})
    snapshot_id: str
    timestamp: AwareDatetime
    positions: list[AggregatedPosition] = Field(default_factory=list)
    balances: list[CanonicalBalance] = Field(default_factory=list)

    total_equity_usd: Decimal = Decimal("0")
    total_unrealized_pnl: Decimal = Decimal("0")
    total_realized_pnl: Decimal = Decimal("0")
    gross_exposure: Decimal = Decimal("0")
    net_exposure: Decimal = Decimal("0")
    diversified_exposure: Decimal = Decimal("0")
    venue_count: int = 0
    instrument_count: int = 0

    asset_class_exposures: dict[str, Decimal] = Field(default_factory=dict)
    strategy_exposures: dict[str, Decimal] = Field(default_factory=dict)

    portfolio_greeks: PortfolioGreeksSnapshot | None = None
    pnl_attribution: PortfolioPnLAttribution | None = None
    risk_groups: list[RiskGroupSummary] = Field(default_factory=list)

    portfolio_duration: Decimal | None = None


class ProtocolHealthBreakdown(CanonicalBase):
    """Per-protocol DeFi lending health metrics."""

    protocol: str
    chain: str
    collateral_usd: Decimal = Decimal("0")
    debt_usd: Decimal = Decimal("0")
    health_factor: Decimal | None = None
    ltv_ratio: Decimal | None = None
    net_apy: Decimal = Decimal("0")


class DeFiAggregatedHealth(CanonicalBase):
    """Combined DeFi lending health factor across protocols and chains."""

    client_id: str = Field(..., json_schema_extra={"pii": True})
    protocols: list[ProtocolHealthBreakdown] = Field(default_factory=list)
    combined_collateral_usd: Decimal = Decimal("0")
    combined_debt_usd: Decimal = Decimal("0")
    combined_health_factor: Decimal | None = None
    weighted_net_apy: Decimal = Decimal("0")
    riskiest_protocol: str | None = None
    per_chain_health: dict[str, Decimal] = Field(default_factory=dict)
    timestamp: AwareDatetime | None = None


class LPProtocolBreakdown(CanonicalBase):
    """Per-protocol DeFi LP metrics."""

    protocol: str
    chain: str
    total_value_usd: Decimal = Decimal("0")
    fees_earned_usd: Decimal = Decimal("0")
    impermanent_loss_usd: Decimal = Decimal("0")
    pool_count: int = 0


class DeFiLPAggregatedMetrics(CanonicalBase):
    """Combined DeFi LP metrics across Uniswap/Curve/Balancer."""

    client_id: str = Field(..., json_schema_extra={"pii": True})
    total_lp_value_usd: Decimal = Decimal("0")
    total_fees_earned_usd: Decimal = Decimal("0")
    total_impermanent_loss_usd: Decimal = Decimal("0")
    protocols: list[LPProtocolBreakdown] = Field(default_factory=list)
    timestamp: AwareDatetime | None = None


class StakingProtocolBreakdown(CanonicalBase):
    """Per-protocol DeFi staking metrics."""

    protocol: str
    chain: str
    staked_value_usd: Decimal = Decimal("0")
    rewards_earned_usd: Decimal = Decimal("0")
    apy: Decimal = Decimal("0")
    lock_end: AwareDatetime | None = None


class DeFiStakingAggregatedMetrics(CanonicalBase):
    """Combined DeFi staking metrics across Lido/EtherFi/etc."""

    client_id: str = Field(..., json_schema_extra={"pii": True})
    total_staked_value_usd: Decimal = Decimal("0")
    total_rewards_earned_usd: Decimal = Decimal("0")
    weighted_apy: Decimal = Decimal("0")
    protocols: list[StakingProtocolBreakdown] = Field(default_factory=list)
    timestamp: AwareDatetime | None = None


class FeeType(StrEnum):
    MAKER = "maker"
    TAKER = "taker"
    OTHER = "other"


class CanonicalFee(CanonicalBase):
    """Normalised fee — all venues."""

    amount: Decimal = Field(description="Fee amount or rate")
    currency: str = Field(description="Fee currency")
    asset: str | None = Field(default=None, description="Asset symbol if different from currency")
    fee_type: FeeType = Field(default=FeeType.OTHER, description="maker, taker, or other")
    venue: str = Field(min_length=1)
    timestamp: AwareDatetime | None = Field(default=None)
    schema_version: str = "1.0"


# ---------------------------------------------------------------------------
# Institutional account schemas: deposits, withdrawals, sub-accounts, fees
# ---------------------------------------------------------------------------


class DepositAddress(CanonicalBase):
    """Deposit address for a network."""

    network: str = Field(..., description="Blockchain network (e.g. ETH, TRC20)")
    address: str = Field(..., description="Deposit address")
    addressTag: str | None = Field(None, description="Memo/tag (XRP, XLM, etc.)")
    url: str | None = Field(None, description="Explorer or deposit info URL")


class DepositRecord(CanonicalBase):
    """Deposit transaction record."""

    status: str = Field(..., description="Status (e.g. pending, completed, failed)")
    amount: Decimal = Field(..., description="Deposit amount")
    asset: str = Field(..., description="Asset symbol (e.g. BTC, USDT)")
    network: str = Field(..., description="Blockchain network")
    txId: str | None = Field(None, description="Transaction ID on chain")
    confirmTimes: str | None = Field(None, description="Confirmations (e.g. 12/15)")


class WithdrawalRecord(CanonicalBase):
    """Withdrawal transaction record."""

    status: str = Field(..., description="Status (e.g. pending, completed, failed)")
    amount: Decimal = Field(..., description="Withdrawal amount")
    asset: str = Field(..., description="Asset symbol")
    network: str = Field(..., description="Blockchain network")
    txId: str | None = Field(None, description="Transaction ID on chain")
    fee: Decimal | None = Field(None, description="Network fee charged")


class InternalTransfer(CanonicalBase):
    """Internal transfer between account types."""

    fromAccountType: str = Field(..., description="Source account type (e.g. SPOT, FUTURES)")
    toAccountType: str = Field(..., description="Destination account type")
    asset: str = Field(..., description="Asset symbol")
    amount: Decimal = Field(..., description="Transfer amount")


class SubAccount(CanonicalBase):
    """Sub-account entry."""

    id: str = Field(..., description="Sub-account ID")
    email: str | None = Field(default=None, description="Sub-account email", json_schema_extra={"pii": True})
    isFreeze: bool = Field(False, description="Whether sub-account is frozen")


class ExchangeFeeSchedule(CanonicalBase):
    """Fee tier schedule."""

    tier: int = Field(..., description="Fee tier level")
    makerRate: Decimal = Field(..., description="Maker fee rate")
    takerRate: Decimal = Field(..., description="Taker fee rate")
    volumeThreshold: Decimal | None = Field(None, description="Volume threshold for tier (USD)")


class PortfolioMarginAccount(CanonicalBase):
    """Portfolio margin account snapshot."""

    totalEquity: Decimal = Field(..., description="Total equity (USD)")
    actualEquity: Decimal = Field(..., description="Actual equity after unrealized PnL")
    availableBalance: Decimal = Field(..., description="Available balance for trading")
    uniMMR: Decimal | None = Field(None, description="Unified maintenance margin ratio")
    accountMaintMargin: Decimal | None = Field(None, description="Account maintenance margin")


# ---------------------------------------------------------------------------
# CEX withdrawal request/response schemas per venue
# ---------------------------------------------------------------------------


class BinanceWithdrawRequest(CanonicalBase):
    """Binance withdrawal request (POST /sapi/v1/capital/withdraw/apply)."""

    coin: str = Field(..., description="Cryptocurrency to withdraw")
    address: str = Field(..., description="Withdrawal destination address")
    amount: str = Field(..., description="Amount to withdraw")
    network: str | None = Field(None, description="Blockchain network (default if omitted)")
    addressTag: str | None = Field(None, description="Secondary address (XRP, XMR, etc.)")
    withdrawOrderId: str | None = Field(None, description="Client-side withdrawal ID")
    transactionFeeFlag: bool | None = Field(None, description="Return fees to destination")
    walletType: int | None = Field(None, description="0=spot, 1=funding")


class BinanceWithdrawResponse(CanonicalBase):
    """Binance withdrawal response."""

    id: str = Field(..., description="Withdrawal ID")


class OKXWithdrawRequest(CanonicalBase):
    """OKX withdrawal request (POST /api/v5/asset/withdrawal)."""

    ccy: str = Field(..., description="Currency (e.g. BTC, ETH)")
    amt: str = Field(..., description="Withdrawal amount")
    dest: str = Field(..., description="4=on-chain, 6=internal transfer")
    toAddr: str = Field(..., description="Destination address")
    chain: str | None = Field(None, description="Chain (e.g. ETH-ERC20)")
    fee: str | None = Field(None, description="Network fee (optional for internal)")
    clientId: str | None = Field(None, description="Client-supplied ID")


class OKXWithdrawResponse(CanonicalBase):
    """OKX withdrawal response."""

    wdId: str | None = Field(None, description="Withdrawal ID")
    ccy: str | None = None
    chain: str | None = None
    amt: str | None = None
    clientId: str | None = None


class BybitWithdrawRequest(CanonicalBase):
    """Bybit withdrawal request (POST /v5/asset/withdraw/create)."""

    coin: str = Field(..., description="Currency (e.g. BTC, USDT)")
    chain: str = Field(..., description="Chain type (e.g. ETH, TRC20)")
    address: str = Field(..., description="Destination address")
    amount: str = Field(..., description="Withdrawal amount")
    tag: str | None = Field(None, description="Memo/tag for XRP, XLM, etc.")
    forceChain: int | None = Field(None, description="0=default, 1=force chain")
    accountType: str | None = Field(None, description="UNIFIED, CONTRACT, SPOT")


class BybitWithdrawResponse(CanonicalBase):
    """Bybit withdrawal response."""

    withdrawId: str | None = Field(None, description="Withdrawal ID")
    success: bool | None = None


class UpbitWithdrawRequest(CanonicalBase):
    """Upbit withdrawal request (POST /v1/withdraws/krw or /v1/withdraws/coin)."""

    currency: str = Field(..., description="Currency (e.g. BTC, KRW)")
    amount: str = Field(..., description="Withdrawal amount")
    address: str | None = Field(None, description="Destination address (crypto)")
    secondary_address: str | None = Field(None, description="Memo/tag (crypto)")
    bank: str | None = Field(None, description="Bank code (KRW)")
    account: str | None = Field(None, description="Account number (KRW)")


class UpbitWithdrawResponse(CanonicalBase):
    """Upbit withdrawal response."""

    uuid: str | None = Field(None, description="Withdrawal ID")
    currency: str | None = None
    net_type: str | None = None
    amount: str | None = None
    state: str | None = None


class CoinbaseWithdrawRequest(CanonicalBase):
    """Coinbase withdrawal request (POST /v2/accounts/:id/transactions)."""

    type: str = Field("send", description="Transaction type (send for withdraw)")
    to: str = Field(..., description="Destination address or Coinbase ID")
    amount: str = Field(..., description="Amount to withdraw")
    currency: str = Field(..., description="Currency (e.g. BTC, ETH)")
    network: str | None = Field(None, description="Network (e.g. ethereum, bitcoin)")
    idem: str | None = Field(None, description="Idempotency key")


class CoinbaseWithdrawResponse(CanonicalBase):
    """Coinbase withdrawal response."""

    id: str | None = Field(None, description="Transaction ID")
    status: str | None = None
    amount: dict[str, object] | None = None


# ---------------------------------------------------------------------------
# On-chain transfer schemas: eth_sendRawTransaction, ERC20 calldata
# ---------------------------------------------------------------------------


ERC20_TRANSFER_SELECTOR = "0xa9059cbb"
ERC20_TRANSFER_FROM_SELECTOR = "0x23b872dd"


class EthSendRawTransactionRequest(CanonicalBase):
    """eth_sendRawTransaction JSON-RPC request shape."""

    jsonrpc: Literal["2.0"] = "2.0"
    id: int | str
    method: Literal["eth_sendRawTransaction"] = "eth_sendRawTransaction"
    params: list[str] = Field(..., min_length=1, max_length=1)


class EthSendRawTransactionResponse(CanonicalBase):
    """eth_sendRawTransaction JSON-RPC response."""

    jsonrpc: Literal["2.0"] = "2.0"
    id: int | str
    result: str | None = Field(None, description="Tx hash on success")
    error: dict[str, object] | None = Field(None, description="Error object on failure")


class EthTransactionRequest(CanonicalBase):
    """eth_sendTransaction / eth_call transaction object (unsigned)."""

    from_: str | None = Field(None, alias="from", description="Sender address")
    to: str | None = Field(None, description="Recipient (null for contract creation)")
    gas: str | None = Field(None, description="Gas limit (hex)")
    gasPrice: str | None = Field(None, description="Legacy gas price (hex)")
    maxFeePerGas: str | None = Field(None, description="EIP-1559 max fee (hex)")
    maxPriorityFeePerGas: str | None = Field(None, description="EIP-1559 priority fee (hex)")
    value: str | None = Field(None, description="Value in wei (hex)")
    data: str | None = Field(None, description="Calldata (hex)")
    nonce: str | None = Field(None, description="Nonce (hex)")
    chainId: str | None = Field(None, description="Chain ID (hex)")

    model_config = {"populate_by_name": True}


class EthSendTransactionRequest(CanonicalBase):
    """eth_sendTransaction JSON-RPC request shape."""

    jsonrpc: Literal["2.0"] = "2.0"
    id: int | str
    method: Literal["eth_sendTransaction"] = "eth_sendTransaction"
    params: list[EthTransactionRequest] = Field(..., min_length=1, max_length=1)


class Erc20TransferCalldata(CanonicalBase):
    """ERC20 transfer(to, amount) calldata. Selector: 0xa9059cbb."""

    selector: Literal["0xa9059cbb"] = ERC20_TRANSFER_SELECTOR
    to: str = Field(..., description="Recipient address (20 bytes)")
    amount: str = Field(..., description="Amount (uint256 wei string)")


class Erc20TransferFromCalldata(CanonicalBase):
    """ERC20 transferFrom(from, to, amount) calldata. Selector: 0x23b872dd."""

    selector: Literal["0x23b872dd"] = ERC20_TRANSFER_FROM_SELECTOR
    from_: str = Field(..., alias="from", description="Source address (20 bytes)")
    to: str = Field(..., description="Recipient address (20 bytes)")
    amount: str = Field(..., description="Amount (uint256 wei string)")

    model_config = {"populate_by_name": True}
