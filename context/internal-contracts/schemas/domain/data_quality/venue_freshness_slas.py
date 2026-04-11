"""Per-venue data freshness SLAs.

Defines the maximum acceptable age (in seconds) for the most recent data point
from each venue before it is considered stale.  These thresholds drive alerting
in market-data-processing-service and data-freshness checks in SIT.

The values reflect the nature of each venue:
- CeFi exchanges push WebSocket ticks at sub-second frequency; SLAs are 1-10 s.
- TradFi feeds are slower and often batch-oriented; SLAs are 30-60 s.
- DeFi protocols depend on block times and indexer lag; SLAs are 15-300 s.
- Onchain perps sit between CeFi and DeFi; SLAs are 2-5 s.

SSOT for venue names: market-tick-data-service market_interface VENUE_REGISTRY (factory.py).
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class VenueCategory(Enum):
    """Venue category matching UMI VENUE_REGISTRY categories."""

    CEFI = "cefi"
    TRADFI = "tradfi"
    DEFI = "defi"
    ONCHAIN_PERPS = "onchain_perps"


@dataclass(frozen=True, slots=True)
class VenueFreshnessSLA:
    """Freshness SLA for a single venue."""

    venue: str
    category: VenueCategory
    max_staleness_seconds: int


# ---------------------------------------------------------------------------
# CeFi venues (9)
# ---------------------------------------------------------------------------
_CEFI_SLAS: list[VenueFreshnessSLA] = [
    VenueFreshnessSLA("binance", VenueCategory.CEFI, 1),
    VenueFreshnessSLA("coinbase", VenueCategory.CEFI, 5),
    VenueFreshnessSLA("bybit", VenueCategory.CEFI, 2),
    VenueFreshnessSLA("okx", VenueCategory.CEFI, 2),
    VenueFreshnessSLA("deribit", VenueCategory.CEFI, 5),
    VenueFreshnessSLA("ccxt", VenueCategory.CEFI, 10),
    VenueFreshnessSLA("upbit", VenueCategory.CEFI, 10),
]

# ---------------------------------------------------------------------------
# TradFi venues (9)
# ---------------------------------------------------------------------------
_TRADFI_SLAS: list[VenueFreshnessSLA] = [
    VenueFreshnessSLA("databento", VenueCategory.TRADFI, 30),
    VenueFreshnessSLA("tardis", VenueCategory.TRADFI, 30),
    VenueFreshnessSLA("yahoo_finance", VenueCategory.TRADFI, 60),
    VenueFreshnessSLA("barchart", VenueCategory.TRADFI, 60),
    VenueFreshnessSLA("fred", VenueCategory.TRADFI, 60),
    VenueFreshnessSLA("ecb", VenueCategory.TRADFI, 60),
    VenueFreshnessSLA("ofr", VenueCategory.TRADFI, 60),
    VenueFreshnessSLA("openbb", VenueCategory.TRADFI, 60),
    VenueFreshnessSLA("ibkr", VenueCategory.TRADFI, 30),
]

# ---------------------------------------------------------------------------
# DeFi venues (14)
# ---------------------------------------------------------------------------
_DEFI_SLAS: list[VenueFreshnessSLA] = [
    VenueFreshnessSLA("aave_v3", VenueCategory.DEFI, 60),
    VenueFreshnessSLA("balancer", VenueCategory.DEFI, 30),
    VenueFreshnessSLA("curve", VenueCategory.DEFI, 30),
    VenueFreshnessSLA("ethena", VenueCategory.DEFI, 60),
    VenueFreshnessSLA("euler", VenueCategory.DEFI, 60),
    VenueFreshnessSLA("fluid", VenueCategory.DEFI, 60),
    VenueFreshnessSLA("etherfi", VenueCategory.DEFI, 300),
    VenueFreshnessSLA("lido", VenueCategory.DEFI, 300),
    VenueFreshnessSLA("morpho", VenueCategory.DEFI, 60),
    VenueFreshnessSLA("uniswap_v2", VenueCategory.DEFI, 15),
    VenueFreshnessSLA("uniswap_v3", VenueCategory.DEFI, 15),
    VenueFreshnessSLA("uniswap_v4", VenueCategory.DEFI, 15),
    VenueFreshnessSLA("instadapp", VenueCategory.DEFI, 60),
    VenueFreshnessSLA("defillama", VenueCategory.DEFI, 60),
]

# ---------------------------------------------------------------------------
# Onchain Perps (2)
# ---------------------------------------------------------------------------
_ONCHAIN_PERPS_SLAS: list[VenueFreshnessSLA] = [
    VenueFreshnessSLA("hyperliquid", VenueCategory.ONCHAIN_PERPS, 2),
    VenueFreshnessSLA("aster", VenueCategory.ONCHAIN_PERPS, 5),
]

# ---------------------------------------------------------------------------
# Aggregate registry: venue_name -> VenueFreshnessSLA
# ---------------------------------------------------------------------------
VENUE_FRESHNESS_SLAS: dict[str, VenueFreshnessSLA] = {
    sla.venue: sla for sla in _CEFI_SLAS + _TRADFI_SLAS + _DEFI_SLAS + _ONCHAIN_PERPS_SLAS
}


def get_sla_for_venue(venue: str) -> VenueFreshnessSLA:
    """Return the freshness SLA for a venue.

    Args:
        venue: Venue name (must match a key in VENUE_FRESHNESS_SLAS).

    Raises:
        ValueError: If the venue is not registered.
    """
    venue_key = venue.lower()
    if venue_key not in VENUE_FRESHNESS_SLAS:
        registered = ", ".join(sorted(VENUE_FRESHNESS_SLAS))
        raise ValueError(f"Unknown venue: {venue!r}. Registered venues: {registered}")
    return VENUE_FRESHNESS_SLAS[venue_key]


def get_slas_by_category(category: VenueCategory) -> list[VenueFreshnessSLA]:
    """Return all freshness SLAs for a given category.

    Args:
        category: The venue category to filter by.
    """
    return [sla for sla in VENUE_FRESHNESS_SLAS.values() if sla.category == category]
