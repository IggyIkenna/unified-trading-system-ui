"""Domain schemas for features-calendar-service.

Canonical output schema definitions for GCS parquet outputs from the
features-calendar-service pipeline.

SchemaDefinition / ColumnSchema objects are parquet write enforcement descriptors.
They live here so that any service or tool importing from UIC gets the single
source of truth for the features-calendar output contract.

MVP Feature Categories:
    time_features: Time-based features (session indicators, cyclical encoding)
    economic_events: Deterministic event dates (FOMC, NFP, CPI, GDP, etc.)

Deferred (future work):
    event_actuals: Actual vs expected values (requires FRED API)
    macro_features: Treasury rates, yield curves (requires OpenBB)
"""

from __future__ import annotations

from unified_internal_contracts.schema_definition import ColumnSchema, SchemaDefinition

# ==============================================================================
# TIME FEATURES SCHEMA
# ==============================================================================
TIME_FEATURES_SCHEMA = SchemaDefinition(
    name="time_features",
    version="1.0",
    description="Time-based features: sessions, cyclical encoding, binary indicators",
    dimension_keys=["category"],
    columns=[
        ColumnSchema(
            name="timestamp",
            dtype="datetime64[ns]",
            nullable=False,
            description="UTC timestamp for this feature row",
        ),
        ColumnSchema(
            name="date",
            dtype="string",
            nullable=False,
            description="ISO date string (YYYY-MM-DD)",
        ),
        # Trading sessions
        ColumnSchema(
            name="asia_session", dtype="int64", nullable=False, description="Asia session (0/1)"
        ),
        ColumnSchema(
            name="london_session", dtype="int64", nullable=False, description="London session (0/1)"
        ),
        ColumnSchema(
            name="ny_session", dtype="int64", nullable=False, description="NY session (0/1)"
        ),
        ColumnSchema(
            name="london_ny_overlap",
            dtype="int64",
            nullable=False,
            description="London-NY overlap (0/1)",
        ),
        # Cyclical encoding
        ColumnSchema(
            name="hour_sin", dtype="float64", nullable=False, description="sin(2pi * hour / 24)"
        ),
        ColumnSchema(
            name="hour_cos", dtype="float64", nullable=False, description="cos(2pi * hour / 24)"
        ),
        ColumnSchema(
            name="day_sin",
            dtype="float64",
            nullable=False,
            description="sin(2pi * day_of_week / 7)",
        ),
        ColumnSchema(
            name="day_cos",
            dtype="float64",
            nullable=False,
            description="cos(2pi * day_of_week / 7)",
        ),
        # Binary indicators
        ColumnSchema(name="is_weekend", dtype="int64", nullable=False, description="Weekend (0/1)"),
    ],
)

# ==============================================================================
# ECONOMIC EVENTS SCHEMA
# ==============================================================================
ECONOMIC_EVENTS_SCHEMA = SchemaDefinition(
    name="economic_events",
    version="1.0",
    description="Deterministic economic event dates (FOMC, NFP, CPI, GDP, etc.)",
    dimension_keys=["category"],
    columns=[
        ColumnSchema(
            name="timestamp",
            dtype="datetime64[ns]",
            nullable=False,
            description="Event timestamp (UTC)",
        ),
        ColumnSchema(
            name="date",
            dtype="string",
            nullable=False,
            description="ISO date string (YYYY-MM-DD)",
        ),
        ColumnSchema(
            name="event_type",
            dtype="string",
            nullable=False,
            description="Event type (FOMC, NFP, CPI, GDP, JOBLESS_CLAIMS, ELECTIONS)",
        ),
        ColumnSchema(
            name="importance",
            dtype="string",
            nullable=False,
            description="Event importance (high, medium, low)",
        ),
    ],
)

# ==============================================================================
# SCHEMA MAPPING
# ==============================================================================
CALENDAR_SCHEMAS: dict[str, SchemaDefinition] = {
    "time_features": TIME_FEATURES_SCHEMA,
    "economic_events": ECONOMIC_EVENTS_SCHEMA,
}


def get_schema_for_category(category: str) -> SchemaDefinition | None:
    """Get schema definition for a feature category."""
    return CALENDAR_SCHEMAS.get(category)


__all__ = [
    "CALENDAR_SCHEMAS",
    "ECONOMIC_EVENTS_SCHEMA",
    "TIME_FEATURES_SCHEMA",
    "get_schema_for_category",
]
