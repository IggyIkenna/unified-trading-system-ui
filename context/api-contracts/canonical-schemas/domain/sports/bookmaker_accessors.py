"""Bookmaker query accessors — extracted from ``bookmaker_registry.py``.

Keeps the data-heavy registry module under the 900-line QG ceiling.

SSOT: ``codex/02-data/mtds-data-source-coverage-matrix.md`` §5.
"""

from __future__ import annotations

from .bookmaker_registry import BOOKMAKER_REGISTRY


def get_expected_bookmakers(category: str | None = None) -> list[str]:
    """Return canonical bookmaker keys expected to produce odds shards.

    Canonical denominator for deployment-api MTDS SPORTS coverage %. Matches
    the ``venue`` column the market-tick-data-service writes for bookmaker
    odds feeds.

    Args:
        category: Optional filter on ``BookmakerCategory`` value
            (``exchange`` / ``bookmaker_api`` / ``aggregator`` /
            ``streaming_api`` / ``scraper``). ``None`` returns every
            registered bookmaker.

    Returns:
        Sorted list of bookmaker keys (e.g. ``["bet365", "betfair",
        "coral", "draftkings", ...]``). Empty list if no bookmakers match
        the filter.
    """
    if category is None:
        return sorted(BOOKMAKER_REGISTRY.keys())
    cat_lower = category.lower()
    return sorted(k for k, v in BOOKMAKER_REGISTRY.items() if v.category.value.lower() == cat_lower)


__all__ = ["get_expected_bookmakers"]
