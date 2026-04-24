"""Domain schemas for features-commodity-service.

Canonical output schema definitions for GCS parquet outputs from the commodity
feature calculator pipeline.

SchemaDefinition / ColumnSchema objects are parquet write enforcement descriptors
(infrastructure). They live here so that any service or tool importing from UIC
gets the single source of truth for the features-commodity output contract.

Factor groups computed by features-commodity-service:
    storage_alpha: EIA storage surplus/deficit vs 5-year seasonal average (NG, CL).
    weather_delta: Population-weighted degree day demand signal (HDD/CDD) for NG.
    cot_positioning: CFTC managed money net long positioning z-score.
    rig_count: Baker Hughes rig count week-over-week change signal (NG, CL).
    price_momentum: Rolling 20-day return z-score via tanh normalisation.

Supported commodities: NG (natural gas), CL (crude oil).

Output is a CommoditySignal published to 'commodity-signals-{commodity.lower()}' topics
via features-commodity-service. The parquet write contract here covers the factor-level
feature rows stored to GCS.
"""

from __future__ import annotations

from unified_internal_contracts.domain.features_commodity.commodity_feature_request import (
    CommodityFeatureRequest as CommodityFeatureRequest,
)
from unified_internal_contracts.domain.features_commodity.commodity_signal import (
    CommoditySignal as CommoditySignal,
)
from unified_internal_contracts.domain.features_commodity.commodity_signal import (
    FactorValue as FactorValue,
)
from unified_internal_contracts.domain.features_commodity.commodity_signal import (
    RegimeState as RegimeState,
)
from unified_internal_contracts.schema_definition import ColumnSchema, SchemaDefinition

# ==============================================================================
# COMMODITY FEATURES OUTPUT SCHEMA
# ==============================================================================
# Covers all factor group rows written to GCS by features-commodity-service.
# Each row = one factor observation for one commodity at one timestamp.

COMMODITY_FEATURES_SCHEMA = SchemaDefinition(
    name="features_commodity",
    version="1.0",
    description=(
        "Commodity feature factor rows (storage, weather, COT, rig count, momentum) for NG and CL."
    ),
    dimension_keys=["commodity", "factor_group"],
    columns=[
        # ======================================================================
        # REQUIRED CORE FIELDS
        # ======================================================================
        ColumnSchema(
            name="timestamp",
            dtype="datetime64[ns]",
            nullable=False,
            description="Event timestamp (timezone-aware UTC)",
        ),
        ColumnSchema(
            name="commodity",
            dtype="string",
            nullable=False,
            description="Commodity code (e.g. 'NG', 'CL')",
        ),
        ColumnSchema(
            name="factor_group",
            dtype="string",
            nullable=False,
            description=(
                "Factor group key: storage_alpha | weather_delta | cot_positioning "
                "| rig_count | price_momentum"
            ),
        ),
        # ======================================================================
        # FACTOR VALUE FIELDS
        # ======================================================================
        ColumnSchema(
            name="raw_value",
            dtype="float64",
            nullable=False,
            description="Raw factor value before normalisation (units vary by factor group)",
        ),
        ColumnSchema(
            name="normalized_value",
            dtype="float64",
            nullable=False,
            description="IC-calibrated normalised factor signal in [-1.0, 1.0] via tanh",
        ),
        ColumnSchema(
            name="weight",
            dtype="float64",
            nullable=False,
            description="IC-calibrated weight assigned to this factor for signal composition",
        ),
        ColumnSchema(
            name="staleness_seconds",
            dtype="int64",
            nullable=False,
            description="Seconds since underlying data source was last refreshed",
        ),
        # ======================================================================
        # SIGNAL COMPOSITION FIELDS (master signal row, factor_group='composite')
        # ======================================================================
        ColumnSchema(
            name="master_signal",
            dtype="float64",
            nullable=True,
            description=(
                "IC-weighted composite signal in [-1.0, 1.0]. "
                "Only populated when factor_group='composite'."
            ),
        ),
        ColumnSchema(
            name="regime",
            dtype="string",
            nullable=True,
            description=(
                "HMM regime label: LOW_VOL_MEAN_REVERTING | TRANSITIONING "
                "| HIGH_VOL_TRENDING | CRISIS. Only populated for composite row."
            ),
        ),
        ColumnSchema(
            name="regime_confidence",
            dtype="float64",
            nullable=True,
            description=(
                "HMM posterior probability of current regime state [0.0, 1.0]. "
                "Only populated for composite row."
            ),
        ),
    ],
)


# Factor groups produced by features-commodity-service
FACTOR_GROUPS: list[str] = [
    "storage_alpha",
    "weather_delta",
    "cot_positioning",
    "rig_count",
    "price_momentum",
]

# Supported commodity codes
SUPPORTED_COMMODITIES: list[str] = ["NG", "CL"]


def get_commodity_features_schema() -> SchemaDefinition:
    """Return the commodity features output schema."""
    return COMMODITY_FEATURES_SCHEMA


__all__ = [
    "COMMODITY_FEATURES_SCHEMA",
    "FACTOR_GROUPS",
    "SUPPORTED_COMMODITIES",
    "CommodityFeatureRequest",
    "CommoditySignal",
    "FactorValue",
    "RegimeState",
    "get_commodity_features_schema",
]
