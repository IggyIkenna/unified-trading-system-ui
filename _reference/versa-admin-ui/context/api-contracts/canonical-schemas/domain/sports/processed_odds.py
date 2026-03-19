"""Processed odds output — result of OddsProcessingEngine for one fixture snapshot."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from .arbitrage import (
    ArbitrageOpportunity,
)
from .odds import CanonicalOdds


class ProcessedOddsOutput(BaseModel):
    """Output of OddsProcessingEngine for one fixture snapshot."""

    model_config = ConfigDict(frozen=True)

    fixture_id: str
    processed_at_utc: datetime
    normalized_odds: list[CanonicalOdds]
    consensus_home_prob: Decimal | None = None
    consensus_draw_prob: Decimal | None = None
    consensus_away_prob: Decimal | None = None
    market_overround_avg: Decimal | None = None
    arbitrage_opportunities: list[ArbitrageOpportunity]
    bookmaker_coverage: int
