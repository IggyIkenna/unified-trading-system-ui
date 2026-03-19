"""Protocol SDK schemas: AAVE, Morpho, Euler, Fluid (Plasma), Lido, Curve.

Scope: deposit, borrow, repay, flash loan payloads.
Internal domain schemas for features-onchain-service and unified-defi-execution-interface.
Moved from UAC protocol_sdks.py.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# --- AAVE V3 ---
class AaveDepositParams(BaseModel):
    """AAVE V3 deposit/supply payload."""

    asset: str = Field(..., description="Token contract address")
    amount: str = Field(..., description="Amount (wei string)")
    onBehalfOf: str | None = Field(None, description="Credit recipient")
    referralCode: int | None = Field(0, description="Referral code")


class AaveRepayParams(BaseModel):
    """AAVE V3 repay payload."""

    asset: str = Field(..., description="Token to repay")
    amount: str = Field(..., description="Amount (wei string); max = -1")
    interestRateMode: Literal[1, 2] = Field(2, description="1=stable, 2=variable")
    onBehalfOf: str | None = Field(None, description="Debt owner to repay for")


class AaveFlashLoanParams(BaseModel):
    """AAVE V3 flash loan params (initiator callback)."""

    receiverAddress: str = Field(..., description="Flash loan receiver")
    assets: list[str] = Field(..., description="Token addresses")
    amounts: list[str] = Field(..., description="Amounts (wei strings)")
    interestRateModes: list[int] = Field(..., description="0=no debt, 1=stable, 2=variable")
    onBehalfOf: str = Field(..., description="Debt recipient")
    params: str = Field("0x", description="Encoded params for callback")


# --- Morpho ---
class MorphoSupplyParams(BaseModel):
    """Morpho supply/deposit payload."""

    loanToken: str = Field(..., description="Market loan token")
    collateralToken: str = Field(..., description="Collateral token")
    amount: str = Field(..., description="Supply amount (wei string)")
    onBehalfOf: str | None = Field(None, description="Position owner")


class MorphoBorrowParams(BaseModel):
    """Morpho borrow payload."""

    loanToken: str = Field(..., description="Market loan token")
    collateralToken: str = Field(..., description="Collateral token")
    amount: str = Field(..., description="Borrow amount (wei string)")
    onBehalfOf: str | None = Field(None, description="Debt recipient")


class MorphoRepayParams(BaseModel):
    """Morpho repay payload."""

    loanToken: str = Field(..., description="Market loan token")
    collateralToken: str = Field(..., description="Collateral token")
    amount: str = Field(..., description="Repay amount (wei string)")
    onBehalfOf: str | None = Field(None, description="Debt owner")


class MorphoFlashLoanParams(BaseModel):
    """Morpho flash loan callback payload (onMorphoFlashLoan)."""

    token: str = Field(..., description="Borrowed token")
    amount: str = Field(..., description="Borrowed amount (wei string)")
    data: str = Field("0x", description="Encoded callback data")


# --- Euler ---
class EulerDepositParams(BaseModel):
    """Euler (Plasma) deposit payload."""

    subAccountId: int = Field(0, description="Sub-account id")
    amount: str = Field(..., description="Deposit amount (wei string)")


class EulerBorrowParams(BaseModel):
    """Euler (Plasma) borrow payload."""

    subAccountId: int = Field(0, description="Sub-account id")
    amount: str = Field(..., description="Borrow amount (wei string)")


class EulerRepayParams(BaseModel):
    """Euler (Plasma) repay payload."""

    subAccountId: int = Field(0, description="Sub-account id")
    amount: str = Field(..., description="Repay amount (wei string)")


# --- Fluid (Plasma) ---
class FluidDepositParams(BaseModel):
    """Fluid (Plasma) deposit payload."""

    amount: str = Field(..., description="Deposit amount (wei string)")


class FluidBorrowParams(BaseModel):
    """Fluid (Plasma) borrow payload."""

    amount: str = Field(..., description="Borrow amount (wei string)")


class FluidRepayParams(BaseModel):
    """Fluid (Plasma) repay payload."""

    amount: str = Field(..., description="Repay amount (wei string)")


# --- Lido ---
class LidoSubmitParams(BaseModel):
    """Lido stETH submit/deposit payload."""

    amount: str = Field(..., description="ETH amount to stake (wei string)")
    referral: str | None = Field(None, description="Referral address")


class LidoRequestWithdrawalsParams(BaseModel):
    """Lido request withdrawals payload."""

    amounts: list[str] = Field(..., description="stETH amounts (wei strings)")


# --- Curve ---
class CurveWithdrawParams(BaseModel):
    """Curve pool withdraw (remove_liquidity) payload."""

    amount: str = Field(..., description="LP tokens to burn (wei string)")
    min_amounts: list[str] = Field(default_factory=list, description="Min token amounts out")
    use_eth: bool = Field(False, description="Receive ETH for one coin")


class CurveSwapParams(BaseModel):
    """Curve pool swap (exchange) payload."""

    i: int = Field(..., description="Input token index")
    j: int = Field(..., description="Output token index")
    dx: str = Field(..., description="Input amount (wei string)")
    min_dy: str = Field("0", description="Min output amount (wei string)")


# --- Aave V3 data (reserve / user) ---
class AaveV3ReserveData(BaseModel):
    """Aave V3 reserve data (getReserveData)."""

    unbacked: str | None = None
    accruedToTreasuryScaled: str | None = None
    totalAToken: str | None = None
    totalStableDebt: str | None = None
    totalVariableDebt: str | None = None
    liquidityRate: str | None = None
    variableBorrowRate: str | None = None
    stableBorrowRate: str | None = None
    averageStableBorrowRate: str | None = None
    liquidityIndex: str | None = None
    variableBorrowIndex: str | None = None
    lastUpdateTimestamp: int | None = None


class AaveV3UserAccountData(BaseModel):
    """Aave V3 user account data (getUserAccountData)."""

    totalCollateralBase: str | None = None
    totalDebtBase: str | None = None
    availableBorrowsBase: str | None = None
    currentLiquidationThreshold: str | None = None
    ltv: str | None = None
    healthFactor: str | None = None


class AaveV3UserReserveData(BaseModel):
    """Aave V3 user reserve data (getUserReserveData)."""

    currentATokenBalance: str | None = None
    currentStableDebt: str | None = None
    currentVariableDebt: str | None = None
    principalStableDebt: str | None = None
    scaledVariableDebt: str | None = None
    liquidityRate: str | None = None
    stableBorrowRate: str | None = None
    reserveLastUpdatedTimestamp: int | None = None


# --- Compound V3 ---
class CompoundV3MarketInfo(BaseModel):
    """Compound V3 market info."""

    supplyRate: str | None = None
    borrowRate: str | None = None
    totalSupply: str | None = None
    totalBorrow: str | None = None
    utilization: str | None = None
    reserveFactor: str | None = None
    collateralFactor: str | None = None


class CompoundV3UserPosition(BaseModel):
    """Compound V3 user position."""

    supplyBalance: str | None = None
    borrowBalance: str | None = None
    collateralBalance: str | None = None
    liquidationThreshold: str | None = None
    healthFactor: str | None = None


# --- Morpho ---
class MorphoMarketParams(BaseModel):
    """Morpho market parameters."""

    loanToken: str | None = None
    collateralToken: str | None = None
    oracle: str | None = None
    irm: str | None = None
    lltv: str | None = None
    supplyRate: str | None = None
    borrowRate: str | None = None


class MorphoUserPosition(BaseModel):
    """Morpho user position (supply/borrow)."""

    supplyShares: str | None = None
    borrowShares: str | None = None
    collateral: str | None = None
    loanToken: str | None = None
    collateralToken: str | None = None
    healthFactor: str | None = None


# --- Euler ---
class EulerVaultData(BaseModel):
    """Euler vault data."""

    totalSupply: str | None = None
    totalBorrows: str | None = None
    supplyRate: str | None = None
    borrowRate: str | None = None
    reserveFactor: str | None = None


class EulerUserPosition(BaseModel):
    """Euler user position."""

    supplyBalance: str | None = None
    borrowBalance: str | None = None
    collateralValue: str | None = None
    healthFactor: str | None = None


# --- Uniswap V3 on-chain response shapes ---
class UniswapV3QuoteResponse(BaseModel):
    """Uniswap V3 QuoterV2.quoteExactInputSingle return value.

    Decoded from eth_call to QuoterV2 (0x61fFE014bA17989E743c5F6cB21bF9697530B21e).
    Fields are strings (wei amounts) or ints as returned by web3.py ABI decoder.
    """

    amountOut: str | None = None
    sqrtPriceX96After: str | None = None
    initializedTicksCrossed: int | None = None
    gasEstimate: str | None = None


class UniswapV3PoolStateResponse(BaseModel):
    """Uniswap V3 Pool.slot0() + liquidity() call response.

    Decoded from eth_call to pool contract.
    """

    sqrtPriceX96: str | None = None
    tick: int | None = None
    observationIndex: int | None = None
    observationCardinality: int | None = None
    feeProtocol: int | None = None
    unlocked: bool | None = None
    liquidity: str | None = None
    feeGrowthGlobal0X128: str | None = None
    feeGrowthGlobal1X128: str | None = None


class UniswapV3SwapTxReceipt(BaseModel):
    """Decoded on-chain receipt for Uniswap V3 exact-input swap.

    Parsed from TransactionReceipt returned by web3.py after swap execution.
    """

    transactionHash: str | None = None
    blockNumber: int | None = None
    gasUsed: int | None = None
    status: int | None = None  # 1 = success, 0 = reverted
    amountIn: str | None = None
    amountOut: str | None = None
    sqrtPriceX96After: str | None = None
    tickAfter: int | None = None


# --- Lido on-chain response shapes ---
class LidoSubmitResponse(BaseModel):
    """Lido stETH.submit() transaction receipt.

    Decoded from web3.py TransactionReceipt after staking ETH.
    """

    transactionHash: str | None = None
    blockNumber: int | None = None
    gasUsed: int | None = None
    status: int | None = None  # 1 = success
    stEthMinted: str | None = None  # stETH amount minted (wei string)


class LidoWstEthWrapResponse(BaseModel):
    """wstETH.wrap() transaction receipt.

    Decoded from web3.py TransactionReceipt after wrapping stETH to wstETH.
    """

    transactionHash: str | None = None
    blockNumber: int | None = None
    gasUsed: int | None = None
    status: int | None = None  # 1 = success
    wstEthMinted: str | None = None  # wstETH amount minted (wei string)
    stEthWrapped: str | None = None  # stETH consumed (wei string)


# --- EtherFi on-chain response shapes ---
class EtherFiStakeResponse(BaseModel):
    """EtherFi LiquidityPool.deposit() transaction receipt.

    Decoded from web3.py TransactionReceipt after staking ETH to receive weETH.
    """

    transactionHash: str | None = None
    blockNumber: int | None = None
    gasUsed: int | None = None
    status: int | None = None  # 1 = success
    eEthMinted: str | None = None  # eETH amount minted before wrapping (wei string)
    weEthReceived: str | None = None  # weETH received (wei string)


class EtherFiUnstakeResponse(BaseModel):
    """EtherFi LiquidityPool.requestWithdraw() transaction receipt.

    Decoded from web3.py TransactionReceipt after requesting withdrawal.
    """

    transactionHash: str | None = None
    blockNumber: int | None = None
    gasUsed: int | None = None
    status: int | None = None  # 1 = success
    requestId: str | None = None  # withdrawal NFT request ID
    amountRequested: str | None = None  # ETH amount requested (wei string)
