"""Market data canonical schemas.

Import boundary note
--------------------
CanonicalLiquidation, CanonicalOrderBook,
CanonicalTicker, and CanonicalTrade are defined in
``unified-api-contracts/unified_api_contracts/canonical/domain/market_data/`` (UAC).

They are re-exported here as a convenience layer so that internal services
can import from ``unified_internal_contracts.market_data`` without taking a
direct UAC dependency.

Import direction: UIC → UAC canonical layer is PERMITTED.
                  UAC → UIC is FORBIDDEN (would be a circular dependency).
"""

from unified_api_contracts.canonical import (
    CanonicalLiquidation,
    CanonicalOrderBook,
    CanonicalTicker,
    CanonicalTrade,
)

from unified_internal_contracts.market_data.book_update import (
    BookUpdateLevel,
    CanonicalBookUpdate,
)
from unified_internal_contracts.market_data.defi import (
    CanonicalLendingRate,
    CanonicalLiquidityPool,
    CanonicalOraclePrice,
    CanonicalStakingRate,
    CanonicalSwap,
)
from unified_internal_contracts.market_data.fixed_income import (
    CanonicalBondData,
    CanonicalYieldCurve,
    YieldCurveTenor,
)
from unified_internal_contracts.market_data.ohlcv import CanonicalOHLCV, OHLCVSource
from unified_internal_contracts.market_data.option_quote import CanonicalOptionQuote
from unified_internal_contracts.market_data.options_chain import InternalOptionsChainSnapshot

__all__ = [
    "BookUpdateLevel",
    "CanonicalBondData",
    "CanonicalBookUpdate",
    "CanonicalLendingRate",
    "CanonicalLiquidation",
    "CanonicalLiquidityPool",
    "CanonicalOHLCV",
    "CanonicalOptionQuote",
    "CanonicalOraclePrice",
    "CanonicalOrderBook",
    "CanonicalStakingRate",
    "CanonicalSwap",
    "CanonicalTicker",
    "CanonicalTrade",
    "CanonicalYieldCurve",
    "InternalOptionsChainSnapshot",
    "OHLCVSource",
    "YieldCurveTenor",
]
