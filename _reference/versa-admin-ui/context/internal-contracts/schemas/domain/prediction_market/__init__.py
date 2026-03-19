"""Domain schemas for prediction market arbitrage.

Cross-venue prediction market arb schemas (Kalshi, Polymarket, sports books).
Moved from unified-api-contracts; consumed by features-sports-service and
arb detection pipelines.
"""

from __future__ import annotations

from unified_internal_contracts.domain.prediction_market.prediction_market_arb import (
    BucketMarket,
    CrossVenueArbLeg,
    CrossVenueArbSignal,
    CrossVenueLink,
    PredictionMarketUniverse,
    PredictionMarketUseCase,
    ProbabilityBucket,
    SportsbookLink,
)

__all__ = [
    "BucketMarket",
    "CrossVenueArbLeg",
    "CrossVenueArbSignal",
    "CrossVenueLink",
    "PredictionMarketUniverse",
    "PredictionMarketUseCase",
    "ProbabilityBucket",
    "SportsbookLink",
]
