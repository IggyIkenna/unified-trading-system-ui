from __future__ import annotations

from decimal import Decimal

from pydantic import AwareDatetime, Field

from .._base import CanonicalBase


class CanonicalOnChainMetric(CanonicalBase):
    """Normalized on-chain analytics data point."""

    timestamp: AwareDatetime
    venue: str = Field(description="Data provider: glassnode | arkham | defillama")
    metric_type: str = Field(description="Metric identifier e.g. mvrv, nvt, sopr, protocol_tvl")
    asset: str | None = Field(default=None, description="Asset the metric applies to e.g. BTC")
    value: Decimal | None = Field(default=None, description="Primary metric value")
    secondary_value: Decimal | None = Field(default=None, description="Secondary value when metric has 2 fields")
    entity: str | None = Field(default=None, description="Entity name for entity-level metrics")
    chain: str | None = None
    raw: dict[str, float | int | str | None] | None = Field(default=None, description="Original fields as-is")
    schema_version: str = "1.0"
