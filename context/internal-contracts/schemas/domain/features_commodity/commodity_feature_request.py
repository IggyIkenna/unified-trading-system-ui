"""Request schema for commodity feature computation.

Input contract for features-commodity-service compute_features.
Consumers (e.g. batch handlers, live loops) pass CommodityFeatureRequest
with pre-computed FactorValues and regime state.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from unified_api_contracts.internal.domain.features_commodity.commodity_signal import (
    FactorValue,
    RegimeState,
)


@dataclass
class CommodityFeatureRequest:
    """Request payload for computing signals for a single commodity."""

    commodity: str
    factor_values: list[FactorValue]
    regime: RegimeState = RegimeState.UNKNOWN
    regime_confidence: float = 0.0
    dry_run: bool = False
    factor_groups: list[str] = field(default_factory=list)
