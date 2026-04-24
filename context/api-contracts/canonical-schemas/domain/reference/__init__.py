from __future__ import annotations

from decimal import Decimal
from enum import StrEnum

from pydantic import AwareDatetime, Field

# Re-export from cycle-free SSOT module at package root.
# Direct import avoids the circular dependency chain:
#   canonical → internal.__init__ → alerting → top-level → canonical.
from unified_api_contracts._instrument_enums import (
    AssetClass,
    InstrumentType,
    MarginType,
    OptionType,
)

from .._base import CanonicalBase


class InstructionType(StrEnum):
    TRADE = "TRADE"
    SWAP = "SWAP"
    ZERO_ALPHA = "ZERO_ALPHA"
    PREDICTION_BET = "PREDICTION_BET"
    SPORTS_BET = "SPORTS_BET"
    SPORTS_EXCHANGE_ORDER = "SPORTS_EXCHANGE_ORDER"
    FUTURES_ROLL = "FUTURES_ROLL"
    OPTIONS_COMBO = "OPTIONS_COMBO"
    ADD_LIQUIDITY = "ADD_LIQUIDITY"
    REMOVE_LIQUIDITY = "REMOVE_LIQUIDITY"
    COLLECT_FEES = "COLLECT_FEES"


class Sport(StrEnum):
    """Canonical sport identifiers used across all sports strategies."""

    FOOTBALL = "FOOTBALL"
    BASKETBALL = "BASKETBALL"
    BASEBALL = "BASEBALL"
    HOCKEY = "HOCKEY"
    TENNIS = "TENNIS"
    CRICKET = "CRICKET"
    RUGBY = "RUGBY"
    GOLF = "GOLF"
    MMA = "MMA"
    BOXING = "BOXING"
    MOTORSPORT = "MOTORSPORT"
    AMERICAN_FOOTBALL = "AMERICAN_FOOTBALL"
    HANDBALL = "HANDBALL"
    VOLLEYBALL = "VOLLEYBALL"
    TABLE_TENNIS = "TABLE_TENNIS"
    DARTS = "DARTS"
    SNOOKER = "SNOOKER"
    ESPORTS = "ESPORTS"
    SOCCER = "SOCCER"


class CanonicalInstrument(CanonicalBase):
    """Canonical instrument definition."""

    instrument_key: str = Field(description="VENUE:INSTRUMENT_TYPE:SYMBOL")
    venue: str
    instrument_type: InstrumentType | None = None
    symbol: str
    available_from_datetime: AwareDatetime | None = None
    timestamp: AwareDatetime
    instruction_type: InstructionType | None = None
    venue_type: str | None = None
    data_provider: str | None = None
    asset_class: AssetClass | None = None
    available_to_datetime: AwareDatetime | None = None
    base_asset: str | None = None
    quote_asset: str | None = None
    settle_asset: str | None = None
    exchange_raw_symbol: str | None = None
    databento_symbol: str | None = None
    tardis_exchange: str | None = None
    tardis_symbol: str | None = None
    ccxt_symbol: str | None = None
    ccxt_exchange: str | None = None
    margin_type: MarginType | None = None
    tick_size: Decimal | None = None
    min_size: Decimal | None = None
    contract_size: Decimal | None = None
    strike: Decimal | None = None
    option_type: OptionType | None = None
    expiry: AwareDatetime | None = None
    underlying: str | None = None
    max_position_size: float | None = None
    max_leverage: float | None = None
    initial_margin_rate: float | None = None
    maintenance_margin_rate: float | None = None
    base_asset_contract_address: str | None = None
    quote_asset_contract_address: str | None = None
    pool_id: str | None = None
    pool_address: str | None = None
    pool_fee_tier: str | None = None
    flash_loan_providers: list[str] | None = None
    ltv: float | None = None
    liquidation_threshold: float | None = None
    trading_hours_open: str | None = None
    trading_hours_close: str | None = None
    trading_session: str | None = None
    is_trading_day: bool | None = None
    holiday_calendar: str | None = None
    regular_open_utc: str | None = None
    regular_close_utc: str | None = None
    auction_open_utc: str | None = None
    auction_close_utc: str | None = None
    early_close_utc: str | None = None
    pre_market_open_utc: str | None = None
    post_market_close_utc: str | None = None
    timezone: str | None = None
    session_date_tag: str | None = None
    market_category: str | None = None


InstrumentWarehouseRow = CanonicalInstrument
