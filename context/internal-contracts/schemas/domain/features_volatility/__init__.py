"""Domain schemas for features-volatility-service.

Canonical output schema definitions for GCS parquet outputs from the volatility
feature calculator pipeline (options implied volatility and futures term structure).

SchemaDefinition / ColumnSchema objects are parquet write enforcement descriptors
(infrastructure). They live here so that any service or tool importing from UIC
gets the single source of truth for the features-volatility output contract.

Pydantic row-level models (OptionsIvRecord, FuturesTermStructureRecord) are in
``unified_api_contracts.internal.features`` and re-exported from the top-level package.

Feature Groups:
    options_iv: Implied volatility features from options chains.
    futures_term_structure: Futures term structure features.
"""

from __future__ import annotations

from unified_api_contracts.internal.schema_definition import ColumnSchema, SchemaDefinition

# ==============================================================================
# OPTIONS IV SCHEMA
# ==============================================================================
OPTIONS_IV_SCHEMA = SchemaDefinition(
    name="options_iv",
    version="1.0",
    description="Implied volatility features from options chains",
    dimension_keys=["feature_group", "category"],
    columns=[
        # Core fields
        ColumnSchema(
            name="timestamp", dtype="int64", nullable=False, description="Timestamp in microseconds"
        ),
        ColumnSchema(
            name="timestamp_out",
            dtype="int64",
            nullable=False,
            description="Timestamp when available",
        ),
        ColumnSchema(name="venue", dtype="string", nullable=False, description="Venue identifier"),
        ColumnSchema(
            name="underlying_symbol",
            dtype="string",
            nullable=False,
            description="Underlying symbol",
        ),
        # ATM features
        ColumnSchema(
            name="atm_iv", dtype="float64", nullable=True, description="ATM implied volatility"
        ),
        # 25-delta features
        ColumnSchema(
            name="call_25d_iv", dtype="float64", nullable=True, description="25-delta call IV"
        ),
        ColumnSchema(
            name="put_25d_iv", dtype="float64", nullable=True, description="25-delta put IV"
        ),
        ColumnSchema(name="skew_25d", dtype="float64", nullable=True, description="25-delta skew"),
        ColumnSchema(
            name="skew_25d_ratio", dtype="float64", nullable=True, description="25-delta skew ratio"
        ),
        ColumnSchema(
            name="risk_reversal_25d",
            dtype="float64",
            nullable=True,
            description="25-delta risk reversal",
        ),
        ColumnSchema(
            name="butterfly_25d", dtype="float64", nullable=True, description="25-delta butterfly"
        ),
        # Term structure
        ColumnSchema(
            name="term_slope", dtype="float64", nullable=True, description="IV term slope"
        ),
        ColumnSchema(
            name="term_curvature", dtype="float64", nullable=True, description="IV term curvature"
        ),
        # Moneyness features
        ColumnSchema(
            name="iv_at_90_moneyness",
            dtype="float64",
            nullable=True,
            description="IV at 90% moneyness",
        ),
        ColumnSchema(
            name="iv_at_100_moneyness", dtype="float64", nullable=True, description="IV at ATM"
        ),
        ColumnSchema(
            name="iv_at_110_moneyness",
            dtype="float64",
            nullable=True,
            description="IV at 110% moneyness",
        ),
        # Implied features
        ColumnSchema(
            name="implied_forward",
            dtype="float64",
            nullable=True,
            description="Implied forward price",
        ),
        ColumnSchema(
            name="implied_rate",
            dtype="float64",
            nullable=True,
            description="Implied risk-free rate",
        ),
        # Volume features
        ColumnSchema(
            name="total_options_volume",
            dtype="float64",
            nullable=True,
            description="Total options volume",
        ),
        ColumnSchema(
            name="put_call_volume_ratio",
            dtype="float64",
            nullable=True,
            description="Put/call volume ratio",
        ),
        ColumnSchema(
            name="atm_bid_ask_spread",
            dtype="float64",
            nullable=True,
            description="ATM bid-ask spread in vol",
        ),
    ],
)

# ==============================================================================
# FUTURES TERM STRUCTURE SCHEMA
# ==============================================================================
FUTURES_TERM_STRUCTURE_SCHEMA = SchemaDefinition(
    name="futures_term_structure",
    version="1.0",
    description="Futures term structure features",
    dimension_keys=["feature_group", "category"],
    columns=[
        # Core fields
        ColumnSchema(
            name="timestamp", dtype="int64", nullable=False, description="Timestamp in microseconds"
        ),
        ColumnSchema(
            name="timestamp_out",
            dtype="int64",
            nullable=False,
            description="Timestamp when available",
        ),
        ColumnSchema(name="venue", dtype="string", nullable=False, description="Venue identifier"),
        ColumnSchema(
            name="underlying_symbol",
            dtype="string",
            nullable=False,
            description="Underlying symbol",
        ),
        # Price fields
        ColumnSchema(name="spot_price", dtype="float64", nullable=True, description="Spot price"),
        ColumnSchema(
            name="front_month_price",
            dtype="float64",
            nullable=True,
            description="Front month price",
        ),
        ColumnSchema(
            name="front_month_expiry_days",
            dtype="int64",
            nullable=True,
            description="Days to front month expiry",
        ),
        # Basis fields
        ColumnSchema(
            name="basis", dtype="float64", nullable=True, description="Basis (front - spot)"
        ),
        ColumnSchema(
            name="basis_pct", dtype="float64", nullable=True, description="Basis percentage"
        ),
        ColumnSchema(
            name="annualized_basis", dtype="float64", nullable=True, description="Annualized basis"
        ),
        # Curve shape
        ColumnSchema(name="curve_slope", dtype="float64", nullable=True, description="Curve slope"),
        ColumnSchema(
            name="curve_curvature", dtype="float64", nullable=True, description="Curve curvature"
        ),
        # Roll features
        ColumnSchema(
            name="roll_yield_1m", dtype="float64", nullable=True, description="1-month roll yield"
        ),
        ColumnSchema(
            name="roll_yield_3m", dtype="float64", nullable=True, description="3-month roll yield"
        ),
    ],
)

# ==============================================================================
# COMBINED SCHEMA (primary schema for VolatilityWriter)
# ==============================================================================
# Default schema for volatility features output (options_iv as primary).
VOLATILITY_FEATURES_SCHEMA = OPTIONS_IV_SCHEMA

# ==============================================================================
# SCHEMA MAPPING
# ==============================================================================
VOLATILITY_SCHEMAS: dict[str, SchemaDefinition] = {
    "options_iv": OPTIONS_IV_SCHEMA,
    "futures_term_structure": FUTURES_TERM_STRUCTURE_SCHEMA,
}


def get_schema_for_feature_group(feature_group: str) -> SchemaDefinition | None:
    """Return schema definition for a volatility feature group."""
    return VOLATILITY_SCHEMAS.get(feature_group)


__all__ = [
    "FUTURES_TERM_STRUCTURE_SCHEMA",
    "OPTIONS_IV_SCHEMA",
    "VOLATILITY_FEATURES_SCHEMA",
    "VOLATILITY_SCHEMAS",
    "get_schema_for_feature_group",
]
