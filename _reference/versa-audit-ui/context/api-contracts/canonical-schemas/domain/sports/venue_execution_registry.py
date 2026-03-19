"""Tier 1 (API) venue execution registry — sports betting execution profiles.

Aggregates all venue sub-registries into a single VENUE_EXECUTION_REGISTRY dict.
Sub-registries are split by category:
  - _registry_exchanges: API-based exchanges and prediction markets
  - _registry_intl_scrapers: International (non-US) scraper bookmakers
  - _registry_us: US sportsbooks, DFS, and social betting
"""

from __future__ import annotations

from ._registry_exchanges import EXCHANGE_REGISTRY
from ._registry_intl_scrapers import INTL_SCRAPER_REGISTRY
from ._registry_regional import REGIONAL_REGISTRY
from ._registry_us import US_VENUE_REGISTRY
from .venue_execution import VenueExecutionProfile

VENUE_EXECUTION_REGISTRY: dict[str, VenueExecutionProfile] = {
    **EXCHANGE_REGISTRY,
    **INTL_SCRAPER_REGISTRY,
    **REGIONAL_REGISTRY,
    **US_VENUE_REGISTRY,
}
