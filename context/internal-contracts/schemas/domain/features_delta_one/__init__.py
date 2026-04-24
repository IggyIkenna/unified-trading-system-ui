"""Domain schemas for features-delta-one-service.

Canonical output schema definitions for GCS parquet outputs from the delta-one
feature calculator pipeline.

SchemaDefinition / ColumnSchema objects are parquet write enforcement descriptors
(infrastructure). They live here so that any service or tool importing from UIC
gets the single source of truth for the features-delta-one output contract.

Pydantic row-level models (DeltaOneFeatureRecord) are in
``unified_internal_contracts.features`` and re-exported from the top-level package.

Feature Groups:
    technical_indicators, moving_averages, oscillators, volatility_realized,
    momentum, volume_analysis, vwap, candlestick_patterns, market_structure,
    returns, round_numbers, streaks, microstructure, funding_oi, liquidations,
    temporal, economic_events, targets, polynomial_trendlines
"""

from __future__ import annotations

import pandas as pd

from unified_internal_contracts.schema_definition import ColumnSchema, SchemaDefinition

# ==============================================================================
# FEATURES DELTA-ONE OUTPUT SCHEMA
# ==============================================================================
# All calculated features should NEVER have NaN values.
# Common columns that apply to all feature groups.

FEATURES_SCHEMA = SchemaDefinition(
    name="features_delta_one",
    version="1.0",
    description="Delta-one features for all feature groups (technical, volume, etc.)",
    dimension_keys=["feature_group", "category"],
    columns=[
        # ==========================================================================
        # REQUIRED CORE FIELDS (always NOT NULL for all feature groups)
        # ==========================================================================
        ColumnSchema(
            name="timestamp",
            dtype="datetime64[ns]",
            nullable=False,
            description="Event timestamp (timezone-aware UTC)",
        ),
        ColumnSchema(
            name="timestamp_out",
            dtype="datetime64[ns]",
            nullable=False,
            description=(
                "Timestamp when feature became available (timestamp + 500ms synthetic delay)"
            ),
        ),
        ColumnSchema(
            name="instrument_id",
            dtype="string",
            nullable=False,
            description="Instrument identifier in canonical format",
        ),
        # ==========================================================================
        # COMMON FEATURE COLUMNS
        # These are dynamically generated based on feature group.
        # The specific columns vary by feature group but ALL are NOT NULL since
        # they are calculated values. We use a base schema that validates the
        # core columns only.
        # ==========================================================================
    ],
)


# Feature groups that share the same core schema.
# Each group adds its own feature columns dynamically.
FEATURE_GROUPS: list[str] = [
    "technical_indicators",
    "moving_averages",
    "oscillators",
    "volatility_realized",
    "momentum",
    "volume_analysis",
    "vwap",
    "candlestick_patterns",
    "market_structure",
    "returns",
    "round_numbers",
    "streaks",
    "microstructure",
    "funding_oi",
    "liquidations",
    "temporal",
    "economic_events",
    "targets",
    "polynomial_trendlines",
]


def get_features_schema() -> SchemaDefinition:
    """Return the features delta-one output schema."""
    return FEATURES_SCHEMA


def validate_feature_columns_not_null(
    df: pd.DataFrame,
    feature_columns: list[str],
    context: str = "",
) -> tuple[bool, list[str]]:
    """Validate that all feature columns have no NaN/null values.

    Args:
        df: Pandas DataFrame.
        feature_columns: List of feature column names to check.
        context: Optional context string for error messages.

    Returns:
        Tuple of (is_valid, list of error messages).
    """
    errors: list[str] = []

    for col in feature_columns:
        if col not in df.columns:
            continue

        null_count = int(df[col].isna().sum())
        if null_count > 0:
            ctx = f" ({context})" if context else ""
            errors.append(
                f"Feature column '{col}' has {null_count} NaN values{ctx}"
                " - calculated features should never be NaN"
            )

    return len(errors) == 0, errors


__all__ = [
    "FEATURES_SCHEMA",
    "FEATURE_GROUPS",
    "get_features_schema",
    "validate_feature_columns_not_null",
]
