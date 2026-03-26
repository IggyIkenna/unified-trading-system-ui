"""CeFi account schemas: deposits, withdrawals, sub-accounts, fee schedules, margin.

Shared schemas for CeFi exchange APIs (Binance, OKX, Bybit, etc.).
Moved from unified-api-contracts to unified-internal-contracts (internal service-to-service).
"""

from unified_api_contracts.internal.domain.cefi_accounts.schemas import (
    DepositAddress,
    DepositRecord,
    ExchangeFeeSchedule,
    InternalTransfer,
    PortfolioMarginAccount,
    SubAccount,
    WithdrawalRecord,
)

__all__ = [
    "DepositAddress",
    "DepositRecord",
    "ExchangeFeeSchedule",
    "InternalTransfer",
    "PortfolioMarginAccount",
    "SubAccount",
    "WithdrawalRecord",
]
