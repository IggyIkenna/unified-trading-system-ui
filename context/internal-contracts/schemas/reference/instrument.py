"""Canonical instrument record and related enums for reference data.

This is the SSOT for InstrumentRecord — all repos that need instrument
definitions import from here.

Schema design
-------------
22 stored fields (down from 36). Fields derivable from UAC venue mappings
(symbol, settlement_asset, data_source_constraint, etc.) are removed.
``asset_group`` is set explicitly by URDI adapters using the UAC registry
(per-instrument, not per-venue — e.g. ES futures are equity, CL futures
are commodity, even though both trade on CME).
"""

from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from pydantic import BaseModel, Field


class InstrumentType(StrEnum):
    """Instrument classification."""

    SPOT = "spot"
    PERP = "perp"
    FUTURES = "futures"
    OPTION = "option"
    # DeFi instrument types
    POOL = "pool"
    LENDING_MARKET = "lending_market"
    LST = "lst"
    YIELD = "yield"
    # TradFi
    ETF = "etf"


class OptionType(StrEnum):
    """Option direction."""

    CALL = "call"
    PUT = "put"


class AssetClass(StrEnum):
    """Asset class classification — market domain category.

    Used for position grouping, strategy routing, and domain-specific
    commentary. A BTC future and BTC spot are both ``crypto``. An ES
    future and AAPL stock are both ``equity``. This is the domain the
    instrument belongs to, not the physical form of the underlying.
    """

    CRYPTO = "crypto"
    EQUITY = "equity"
    FX = "fx"
    COMMODITY = "commodity"
    FIXED_INCOME = "fixed_income"


class InstrumentStatus(StrEnum):
    """Instrument trading status."""

    ACTIVE = "active"
    HALTED = "halted"
    EXPIRED = "expired"
    DELISTED = "delisted"


class MarginType(StrEnum):
    """Settlement/margin type for derivative instruments.

    Determines how notional value is calculated and which currency settles PnL.

    LINEAR  — USDT/USDC-margined; notional = qty x price x contract_size (quote currency)
    INVERSE — Coin-margined; contract denominated in USD, settled in base coin.
              USD notional = qty x contract_size (fixed); delta_coin = notional_usd / price.
              Example: Bybit BTCUSD perpetual — 1 contract = $1 USD, settled in BTC.
    QUANTO  — Fixed foreign-currency multiplier; rare (some Deribit instruments).
    """

    LINEAR = "linear"
    INVERSE = "inverse"
    QUANTO = "quanto"


class InstrumentRecord(BaseModel):
    """Canonical instrument definition for reference data adapters.

    Used by all URDI adapters to represent normalised instrument metadata
    fetched from exchange REST APIs.

    Ownership note
    --------------
    UIC owns InstrumentRecord (22 fields, Decimal, normalised, URDI adapter
    output contract). UAC owns CanonicalInstrument (76+ fields, float,
    raw symbols, GCS parquet storage shape). These are intentionally different
    shapes serving different layers — do NOT merge.

    Removed fields (derivable from UAC mappings)
    ---------------------------------------------
    - base, quote: duplicates of base_asset, quote_asset
    - symbol: derivable as f"{base_asset}/{quote_asset}"
    - settlement_asset: = quote_asset (linear) or base_asset (inverse)
    - min_order_size: = lot_size in practice
    - data_source_constraint: derivable from asset_group
    - is_active: redundant with status
    - trading_hours_open/close: time portion of regular_open/close_utc
    - trading_session: derivable from is_trading_day
    - holiday_calendar: derivable from venue
    - auction_open/close_utc: derivable from venue + date
    - updated_at: metadata, not domain data
    """

    # --- Universal fields (all categories) ---
    instrument_key: str = Field(description="Unique identifier: VENUE:TYPE:SYMBOL")
    venue: str
    instrument_type: InstrumentType | str
    raw_symbol: str = ""
    base_asset: str = ""
    quote_asset: str = ""
    status: InstrumentStatus = InstrumentStatus.ACTIVE
    available_since: datetime | None = Field(
        default=None,
        description="Earliest date instrument data is available from source",
    )
    available_to: datetime | None = Field(
        default=None,
        description="Latest date instrument data is available (None = still active)",
    )

    # --- Market domain (set by adapter from UAC registry) ---
    asset_group: AssetClass = AssetClass.CRYPTO
    margin_type: MarginType | None = None

    # --- Trading params (CeFi/TradFi, None for DeFi) ---
    tick_size: Decimal | None = None
    lot_size: Decimal | None = None
    contract_size: Decimal | None = None

    # --- Derivatives (futures/options only) ---
    expiry: datetime | None = None
    strike: Decimal | None = None
    option_type: str | None = None
    underlying: str | None = None

    # --- Session metadata (TradFi only, None for CeFi/DeFi) ---
    is_trading_day: bool | None = Field(
        default=None, description="Whether the instrument trades on the target date"
    )
    regular_open_utc: str | None = Field(
        default=None, description="Regular session open as ISO datetime in UTC"
    )
    regular_close_utc: str | None = Field(
        default=None, description="Regular session close as ISO datetime in UTC"
    )
    early_close_utc: str | None = Field(
        default=None, description="Early close time as ISO datetime in UTC (shortened days)"
    )
