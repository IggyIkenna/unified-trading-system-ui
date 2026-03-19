from __future__ import annotations

from enum import StrEnum

from pydantic import AwareDatetime, Field

from .._base import CanonicalBase


class InstrumentType(StrEnum):
    SPOT_PAIR = "SPOT_PAIR"
    PERPETUAL = "PERPETUAL"
    PERP = "PERP"  # Legacy alias — prefer PERPETUAL. Required by UCI parity.
    FUTURE = "FUTURE"
    OPTION = "OPTION"
    LST = "LST"
    A_TOKEN = "A_TOKEN"
    INDEX = "INDEX"
    # TradFi
    BOND = "BOND"
    EQUITY = "EQUITY"
    ETF = "ETF"
    COMMODITY = "COMMODITY"
    CURRENCY = "CURRENCY"
    CDS = "CDS"
    # UCI parity
    SPOT_ASSET = "SPOT_ASSET"
    YIELD_BEARING = "YIELD_BEARING"
    DEBT_TOKEN = "DEBT_TOKEN"
    POOL = "POOL"
    LENDING = "LENDING"
    STAKING = "STAKING"
    # Sports / Prediction Markets
    PREDICTION_MARKET = "PREDICTION_MARKET"
    EXCHANGE_ODDS = "EXCHANGE_ODDS"
    FIXED_ODDS = "FIXED_ODDS"
    PROP = "PROP"


class OptionType(StrEnum):
    CALL = "call"
    PUT = "put"


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
    asset_class: str | None = None
    data_types: list[str] | None = None
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
    inverse: bool | None = None
    tick_size: float | None = None
    min_size: float | None = None
    contract_size: float | None = None
    strike: float | None = None
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
    session_date_tag: str | None = None


InstrumentWarehouseRow = CanonicalInstrument
