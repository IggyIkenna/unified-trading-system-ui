"""Request to fetch a feature snapshot for ML inference."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class FeatureSnapshotRequest(BaseModel):
    """Request to fetch a feature snapshot for ML inference."""

    instrument_id: str
    timestamp: datetime
    lookback_window: int = Field(description="Number of bars to include")
    feature_groups: list[str] = Field(default_factory=list, description="Empty = all groups")
    timeframe: str = "1h"


__all__ = ["FeatureSnapshotRequest"]
