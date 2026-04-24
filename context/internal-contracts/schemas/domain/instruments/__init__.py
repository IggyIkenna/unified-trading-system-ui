"""Domain schemas for instruments-service.

Canonical output schema definitions for GCS parquet outputs and the
SchemaDefinition enforcement descriptor for the instruments domain.

SchemaDefinition / ColumnSchema objects are parquet write enforcement descriptors.
They live here so that any service or tool importing from UIC gets the single
source of truth for the instruments output contract.

Pydantic row-level models (InstrumentDefinition, InstrumentKey) are in
``unified_internal_contracts.reference`` and re-exported from the top-level package.

Categories:
    CEFI: Centralized exchange instruments (Tardis data)
    TRADFI: Traditional finance instruments (Databento data)
    DEFI: Decentralized finance instruments (on-chain data)
"""

from __future__ import annotations

from unified_internal_contracts.schema_definition import ColumnSchema, SchemaDefinition

# INSTRUMENTS OUTPUT SCHEMA — columns with dimension-aware nullability rules.
# Key dimensions: category (CEFI, TRADFI, DEFI)

INSTRUMENTS_SCHEMA = SchemaDefinition(
    name="instruments",
    version="1.0",
    description="Instrument definitions for all categories (CEFI, TRADFI, DEFI)",
    dimension_keys=["category"],
    columns=[
        # ======================================================================
        # REQUIRED CORE FIELDS (always NOT NULL)
        # ======================================================================
        ColumnSchema(
            name="instrument_key",
            dtype="string",
            nullable=False,
            description="Canonical instrument key: VENUE:INSTRUMENT_TYPE:SYMBOL",
        ),
        ColumnSchema(
            name="venue",
            dtype="string",
            nullable=False,
            description="Venue identifier (e.g., BINANCE-FUTURES, DERIBIT, CME)",
        ),
        ColumnSchema(
            name="instrument_type",
            dtype="string",
            nullable=False,
            description="Instrument type (SPOT_PAIR, PERPETUAL, FUTURE, OPTION, LST, A_TOKEN)",
        ),
        ColumnSchema(
            name="symbol",
            dtype="string",
            nullable=False,
            description="Symbol string extracted from instrument_key",
        ),
        ColumnSchema(
            name="available_from_datetime",
            dtype="datetime64[ns]",
            nullable=False,
            description="When instrument became available (timezone-naive UTC)",
        ),
        ColumnSchema(
            name="timestamp",
            dtype="datetime64[ns]",
            nullable=False,
            description="Generation timestamp when instrument definition was created/stored",
        ),
        # ======================================================================
        # EXECUTION INSTRUCTION TYPE
        # ======================================================================
        ColumnSchema(
            name="instruction_type",
            dtype="string",
            nullable=True,
            description=(
                "Instruction type for execution algorithm selection: "
                "TRADE (CLOB), SWAP (DEX), or ZERO_ALPHA (lending/staking)"
            ),
        ),
        # ======================================================================
        # METADATA FIELDS
        # ======================================================================
        ColumnSchema(
            name="venue_type",
            dtype="string",
            nullable=True,
            description="Type of venue: 'exchange', 'protocol', or 'wallet'",
        ),
        ColumnSchema(
            name="data_provider",
            dtype="string",
            nullable=True,
            description="Data provider source: 'tardis' or 'databento'",
        ),
        ColumnSchema(
            name="asset_class",
            dtype="string",
            nullable=True,
            description="Asset class: 'crypto' or 'traditional'",
        ),
        ColumnSchema(
            name="data_types",
            dtype="string",
            nullable=True,
            description="Comma-separated list of available data types",
        ),
        ColumnSchema(
            name="available_to_datetime",
            dtype="datetime64[ns]",
            nullable=True,
            description="When instrument expires (None for SPOT/PERPETUAL)",
        ),
        ColumnSchema(
            name="base_asset",
            dtype="string",
            nullable=True,
            description="Base asset symbol (e.g., BTC, ETH)",
        ),
        ColumnSchema(
            name="quote_asset",
            dtype="string",
            nullable=True,
            description="Quote asset symbol (e.g., USDT, USD)",
        ),
        ColumnSchema(
            name="settle_asset",
            dtype="string",
            nullable=True,
            description="Settlement asset symbol",
        ),
        ColumnSchema(
            name="exchange_raw_symbol",
            dtype="string",
            nullable=True,
            description="Raw exchange code from exchange API",
        ),
        ColumnSchema(
            name="databento_symbol",
            dtype="string",
            nullable=True,
            nullable_overrides={"TRADFI": False},
            description="Databento query symbol format",
        ),
        ColumnSchema(
            name="tardis_exchange",
            dtype="string",
            nullable=True,
            nullable_overrides={"CEFI": False},
            description="Tardis exchange identifier",
        ),
        ColumnSchema(
            name="tardis_symbol",
            dtype="string",
            nullable=True,
            description="Symbol format used by Tardis API",
        ),
        ColumnSchema(
            name="inverse",
            dtype="bool",
            nullable=True,
            description="Whether this is an inverse contract",
        ),
        ColumnSchema(
            name="tick_size", dtype="string", nullable=True, description="Minimum price increment"
        ),
        ColumnSchema(
            name="min_size", dtype="string", nullable=True, description="Minimum order size"
        ),
        ColumnSchema(
            name="strike", dtype="string", nullable=True, description="Strike price for options"
        ),
        ColumnSchema(
            name="option_type",
            dtype="string",
            nullable=True,
            description="Option type: 'CALL' or 'PUT'",
        ),
        ColumnSchema(
            name="expiry",
            dtype="datetime64[ns]",
            nullable=True,
            description="Expiry datetime for futures/options",
        ),
        ColumnSchema(
            name="contract_size",
            dtype="float64",
            nullable=True,
            description="Contract size/multiplier",
        ),
        ColumnSchema(
            name="underlying",
            dtype="string",
            nullable=True,
            description="Underlying asset for derivatives",
        ),
        ColumnSchema(
            name="ccxt_symbol",
            dtype="string",
            nullable=True,
            description="Symbol format for CCXT library",
        ),
        ColumnSchema(
            name="ccxt_exchange",
            dtype="string",
            nullable=True,
            description="Exchange identifier for CCXT library",
        ),
        ColumnSchema(
            name="base_asset_contract_address",
            dtype="string",
            nullable=True,
            description="ERC-20 contract address for base asset (DeFi only)",
        ),
        ColumnSchema(
            name="quote_asset_contract_address",
            dtype="string",
            nullable=True,
            description="ERC-20 contract address for quote asset (DeFi only)",
        ),
        ColumnSchema(
            name="pool_id",
            dtype="string",
            nullable=True,
            description="Full pool ID for API queries (e.g., Balancer poolEvents)",
        ),
        ColumnSchema(
            name="pool_address",
            dtype="string",
            nullable=True,
            description="Pool contract address (DeFi DEX only)",
        ),
        ColumnSchema(
            name="pool_fee_tier",
            dtype="int64",
            nullable=True,
            description="Pool fee in basis points (DeFi DEX only)",
        ),
        ColumnSchema(
            name="flash_loan_providers",
            dtype="string",
            nullable=True,
            description="Flash loan provider addresses",
        ),
        ColumnSchema(
            name="instadapp_routing",
            dtype="string",
            nullable=True,
            description="Instadapp routing configuration",
        ),
        ColumnSchema(name="ltv", dtype="float64", nullable=True, description="Loan-to-Value ratio"),
        ColumnSchema(
            name="liquidation_threshold",
            dtype="float64",
            nullable=True,
            description="Liquidation threshold",
        ),
        ColumnSchema(
            name="liquidation_bonus",
            dtype="float64",
            nullable=True,
            description="Liquidation bonus",
        ),
        ColumnSchema(
            name="reserve_factor", dtype="float64", nullable=True, description="Reserve factor"
        ),
        ColumnSchema(
            name="emode_category_id", dtype="int64", nullable=True, description="E-mode category ID"
        ),
        ColumnSchema(
            name="emode_label", dtype="string", nullable=True, description="E-mode category label"
        ),
        ColumnSchema(
            name="emode_underlying",
            dtype="string",
            nullable=True,
            description="E-mode underlying asset",
        ),
        ColumnSchema(
            name="emode_liquidation_threshold",
            dtype="float64",
            nullable=True,
            description="E-mode liquidation threshold",
        ),
        ColumnSchema(
            name="emode_liquidation_bonus",
            dtype="float64",
            nullable=True,
            description="E-mode liquidation bonus",
        ),
        ColumnSchema(
            name="optimal_utilization_rate",
            dtype="float64",
            nullable=True,
            description="Optimal utilization rate",
        ),
        ColumnSchema(
            name="base_variable_borrow_rate",
            dtype="float64",
            nullable=True,
            description="Base variable borrow rate",
        ),
        ColumnSchema(
            name="variable_rate_slope1",
            dtype="float64",
            nullable=True,
            description="Variable rate slope 1",
        ),
        ColumnSchema(
            name="variable_rate_slope2",
            dtype="float64",
            nullable=True,
            description="Variable rate slope 2",
        ),
        ColumnSchema(
            name="max_position_size",
            dtype="float64",
            nullable=True,
            description="Maximum position size in quote currency",
        ),
        ColumnSchema(
            name="max_leverage",
            dtype="float64",
            nullable=True,
            description="Maximum leverage available",
        ),
        ColumnSchema(
            name="initial_margin_rate",
            dtype="float64",
            nullable=True,
            description="Initial margin rate",
        ),
        ColumnSchema(
            name="maintenance_margin_rate",
            dtype="float64",
            nullable=True,
            description="Maintenance margin rate",
        ),
        ColumnSchema(
            name="leverage_tiers_json",
            dtype="string",
            nullable=True,
            description="JSON string of all leverage tiers",
        ),
        ColumnSchema(
            name="trading_hours_open",
            dtype="string",
            nullable=True,
            description="Trading hours open time in UTC (TRADFI only)",
        ),
        ColumnSchema(
            name="trading_hours_close",
            dtype="string",
            nullable=True,
            description="Trading hours close time in UTC (TRADFI only)",
        ),
        ColumnSchema(
            name="trading_session",
            dtype="string",
            nullable=True,
            description="Trading session identifier (TRADFI only)",
        ),
        ColumnSchema(
            name="is_trading_day",
            dtype="bool",
            nullable=True,
            description="Whether instrument trades on given date (TRADFI only)",
        ),
        ColumnSchema(
            name="holiday_calendar",
            dtype="string",
            nullable=True,
            description="Exchange holiday calendar identifier (TRADFI only)",
        ),
        ColumnSchema(
            name="regular_open_utc",
            dtype="string",
            nullable=True,
            description="Regular session open as ISO datetime in UTC (TRADFI only)",
        ),
        ColumnSchema(
            name="regular_close_utc",
            dtype="string",
            nullable=True,
            description="Regular session close as ISO datetime in UTC (TRADFI only)",
        ),
        ColumnSchema(
            name="auction_open_utc",
            dtype="string",
            nullable=True,
            description="Opening auction start as ISO datetime in UTC (TRADFI only)",
        ),
        ColumnSchema(
            name="auction_close_utc",
            dtype="string",
            nullable=True,
            description="Closing auction start as ISO datetime in UTC (TRADFI only)",
        ),
        ColumnSchema(
            name="early_close_utc",
            dtype="string",
            nullable=True,
            description="Early close time as ISO datetime in UTC on shortened days (TRADFI only)",
        ),
        ColumnSchema(
            name="session_date_tag",
            dtype="string",
            nullable=True,
            description="UTC midnight spanning tag: 'close_date' or 'open_date'. Only for CME/ICE.",
        ),
    ],
)


def get_instruments_schema() -> SchemaDefinition:
    """Get the instruments output schema."""
    return INSTRUMENTS_SCHEMA


# INSTRUMENTS PARQUET SCHEMA — maps to pandas DataFrame columns when stored to GCS.

INSTRUMENTS_PARQUET_SCHEMA: list[dict[str, str | bool]] = [
    {
        "name": "instrument_key",
        "type": "string",
        "required": True,
        "description": "Canonical instrument key: VENUE:INSTRUMENT_TYPE:SYMBOL",
    },
    {
        "name": "venue",
        "type": "string",
        "required": True,
        "description": "Venue identifier. Must match first part of instrument_key",
    },
    {
        "name": "instrument_type",
        "type": "string",
        "required": True,
        "description": "Instrument type. Must match second part of instrument_key",
    },
    {
        "name": "symbol",
        "type": "string",
        "required": True,
        "description": "Symbol string. Extracted from instrument_key",
    },
    {
        "name": "available_from_datetime",
        "type": "datetime64[ns]",
        "required": True,
        "description": "ISO datetime (timezone-naive UTC) when instrument became available",
    },
    {
        "name": "venue_type",
        "type": "string",
        "required": False,
        "default": "exchange",
        "description": "Type of venue: 'exchange', 'protocol', or 'wallet'",
    },
    {
        "name": "tardis_exchange",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Tardis exchange identifier",
    },
    {
        "name": "data_provider",
        "type": "string",
        "required": False,
        "default": "tardis",
        "description": "Data provider source: 'tardis' or 'databento'",
    },
    {
        "name": "asset_class",
        "type": "string",
        "required": False,
        "default": "crypto",
        "description": "Asset class: 'crypto' or 'traditional'",
    },
    {
        "name": "available_to_datetime",
        "type": "datetime64[ns]",
        "required": False,
        "nullable": True,
        "description": "ISO datetime when instrument expires. Empty/None for SPOT/PERPETUAL",
    },
    {
        "name": "data_types",
        "type": "string",
        "required": False,
        "default": "trades,book_snapshot_5",
        "description": "Comma-separated list of data types",
    },
    {
        "name": "base_asset",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Base asset symbol",
    },
    {
        "name": "quote_asset",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Quote asset symbol",
    },
    {
        "name": "settle_asset",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Settlement asset symbol",
    },
    {
        "name": "exchange_raw_symbol",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Raw exchange code from exchange API",
    },
    {
        "name": "databento_symbol",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Databento query symbol format",
    },
    {
        "name": "tardis_symbol",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Symbol format used by Tardis API",
    },
    {
        "name": "inverse",
        "type": "bool",
        "required": False,
        "default": False,
        "description": "Whether this is an inverse contract",
    },
    {
        "name": "strike",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Strike price for options",
    },
    {
        "name": "option_type",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Option type: 'CALL' or 'PUT'",
    },
    {
        "name": "expiry",
        "type": "datetime64[ns]",
        "required": False,
        "nullable": True,
        "description": "Expiry datetime for futures/options. None for SPOT/PERPETUAL",
    },
    {
        "name": "contract_size",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Contract size/multiplier",
    },
    {
        "name": "tick_size",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Minimum price increment",
    },
    {
        "name": "underlying",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Underlying asset for derivatives",
    },
    {
        "name": "min_size",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Minimum order size",
    },
    {
        "name": "ccxt_symbol",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Symbol format for CCXT library",
    },
    {
        "name": "ccxt_exchange",
        "type": "string",
        "required": False,
        "default": "",
        "description": "Exchange identifier for CCXT library",
    },
    {
        "name": "base_asset_contract_address",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "ERC-20 contract address for base asset (DeFi only)",
    },
    {
        "name": "quote_asset_contract_address",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "ERC-20 contract address for quote asset (DeFi only)",
    },
    {
        "name": "pool_id",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Full pool ID for API queries",
    },
    {
        "name": "pool_address",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Pool contract address (DEX pairs)",
    },
    {
        "name": "pool_fee_tier",
        "type": "int64",
        "required": False,
        "nullable": True,
        "description": "Pool fee in basis points. Only for DEX pools",
    },
    {
        "name": "flash_loan_providers",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Comma-separated flash loan provider addresses",
    },
    {
        "name": "instadapp_routing",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Instadapp routing configuration",
    },
    {
        "name": "ltv",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Loan-to-Value ratio",
    },
    {
        "name": "liquidation_threshold",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Liquidation threshold",
    },
    {
        "name": "liquidation_bonus",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Liquidation bonus",
    },
    {
        "name": "reserve_factor",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Reserve factor",
    },
    {
        "name": "emode_category_id",
        "type": "int64",
        "required": False,
        "nullable": True,
        "description": "E-mode category ID",
    },
    {
        "name": "emode_label",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "E-mode category label",
    },
    {
        "name": "emode_underlying",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "E-mode underlying asset symbol",
    },
    {
        "name": "emode_liquidation_threshold",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "E-mode liquidation threshold",
    },
    {
        "name": "emode_liquidation_bonus",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "E-mode liquidation bonus",
    },
    {
        "name": "optimal_utilization_rate",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Optimal utilization rate",
    },
    {
        "name": "base_variable_borrow_rate",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Base variable borrow rate",
    },
    {
        "name": "variable_rate_slope1",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Variable rate slope 1",
    },
    {
        "name": "variable_rate_slope2",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Variable rate slope 2",
    },
    {
        "name": "max_position_size",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Maximum position size in quote currency",
    },
    {
        "name": "max_leverage",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Maximum leverage available",
    },
    {
        "name": "initial_margin_rate",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Initial margin rate",
    },
    {
        "name": "maintenance_margin_rate",
        "type": "float64",
        "required": False,
        "nullable": True,
        "description": "Maintenance margin rate",
    },
    {
        "name": "leverage_tiers_json",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "JSON string of all leverage tiers",
    },
    {
        "name": "trading_hours_open",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Trading hours open time (TradFi only)",
    },
    {
        "name": "trading_hours_close",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Trading hours close time (TradFi only)",
    },
    {
        "name": "trading_session",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Trading session identifier (TradFi only)",
    },
    {
        "name": "is_trading_day",
        "type": "bool",
        "required": False,
        "nullable": True,
        "description": "Whether instrument trades on given date (TradFi only)",
    },
    {
        "name": "holiday_calendar",
        "type": "string",
        "required": False,
        "nullable": True,
        "description": "Exchange holiday calendar identifier (TradFi only)",
    },
    {
        "name": "timestamp",
        "type": "datetime64[ns]",
        "required": True,
        "description": (
            "Generation timestamp (timezone-naive UTC). Added automatically during storage"
        ),
    },
]

SCHEMA_METADATA: dict[str, str | list[str]] = {
    "version": "1.0",
    "last_updated": "2025-01-15",
    "source_model": (
        "InstrumentDefinition (unified_internal_contracts.reference.instrument_definition)"
    ),
    "storage_format": "Parquet",
    "storage_location": "GCS",
    "validation": "Pydantic model validation + storage-level checks",
    "notes": [
        "All datetime fields are stored as timezone-naive UTC (datetime64[ns])",
        "String fields with defaults use empty string ('') not None",
        "Optional float fields (contract_size) can be None",
        "Optional datetime fields (expiry, available_to_datetime) can be None",
    ],
}


def get_required_columns() -> list[str]:
    """Get list of required column names."""
    return [str(col["name"]) for col in INSTRUMENTS_PARQUET_SCHEMA if col.get("required", False)]


def get_optional_columns() -> list[str]:
    """Get list of optional column names."""
    return [
        str(col["name"]) for col in INSTRUMENTS_PARQUET_SCHEMA if not col.get("required", False)
    ]


def get_column_info(column_name: str) -> dict[str, str | bool] | None:
    """Get schema information for a specific column."""
    for col in INSTRUMENTS_PARQUET_SCHEMA:
        if col["name"] == column_name:
            return col
    return None


def validate_schema_compliance(df_columns: list[str]) -> tuple[bool, list[str]]:
    """Validate that DataFrame columns match expected schema."""
    required = set(get_required_columns())
    actual = set(df_columns)
    missing_required = list(required - actual)
    return len(missing_required) == 0, missing_required


def get_schema_summary() -> dict[str, str | int | list[str] | dict[str, str | list[str]]]:
    """Get summary of schema structure."""
    return {
        "total_fields": len(INSTRUMENTS_PARQUET_SCHEMA),
        "required_fields": len(get_required_columns()),
        "optional_fields": len(get_optional_columns()),
        "required_column_names": get_required_columns(),
        "metadata": SCHEMA_METADATA,
    }


__all__ = [
    "INSTRUMENTS_PARQUET_SCHEMA",
    "INSTRUMENTS_SCHEMA",
    "SCHEMA_METADATA",
    "get_column_info",
    "get_instruments_schema",
    "get_optional_columns",
    "get_required_columns",
    "get_schema_summary",
    "validate_schema_compliance",
]
