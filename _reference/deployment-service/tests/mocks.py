"""
Shared mocks for deployment-service tests.

Provides reusable mock builders for GCS, PathCombinatorics, etc.
"""

from unittest.mock import MagicMock

# deployment-api is required (editable dep in venv)
from deployment_api.utils.path_combinatorics import CombinatoricEntry as _CombinatoricEntry

# Minimal SERVICE_PATH_TEMPLATES mirror (instruments-service only) so that
# make_mock_path_combinatorics can generate realistic prefixes without loading
# the full deployment-api config stack.
_SERVICE_PATH_TEMPLATES = {
    "instruments-service": "instrument_availability/by_date/day={date}/venue={venue}/",
    "features-delta-one-service": "features/by_date/day={date}/feature_group={feature_group}/",
    "features-volatility-service": "features/by_date/day={date}/feature_group={feature_group}/",
    "features-onchain-service": "features/by_date/day={date}/feature_group={feature_group}/",
    "features-calendar-service": "features/by_date/day={date}/",
    "corporate-actions": "corporate_actions/by_date/day={date}/",
}

# Default venue sets per category used when no real config is available
_DEFAULT_VENUES: dict[str, dict[str, list[str]]] = {
    "instruments-service": {
        "CEFI": ["BINANCE-SPOT", "BINANCE-FUTURES"],
        "TRADFI": ["CME", "CBOE", "NASDAQ", "NYSE", "ICE", "FX"],
        "DEFI": ["UNISWAP-V3"],
    },
}

# Default feature groups for feature services
_DEFAULT_FEATURE_GROUPS: dict[str, list[str]] = {
    "features-delta-one-service": ["momentum", "mean_reversion", "volatility"],
    "features-volatility-service": ["realized_vol", "implied_vol"],
    "features-onchain-service": ["defi_flows", "miner_activity"],
}


def _make_prefixes_for_date(
    service: str,
    category: str,
    date_str: str,
    venue_filter: list[str] | None = None,
) -> list[tuple[str, str | None]]:
    """Generate (prefix, sub_dim) tuples for a service+category+date, without loading configs."""
    template = _SERVICE_PATH_TEMPLATES.get(service)
    if not template:
        return []

    if service == "instruments-service":
        venues = _DEFAULT_VENUES.get(service, {}).get(category.upper(), [])
        if venue_filter:
            venue_set = {v.upper() for v in venue_filter}
            venues = [v for v in venues if v.upper() in venue_set]
        return [
            (template.replace("{date}", date_str).replace("{venue}", v), v) for v in sorted(venues)
        ]

    if service in _DEFAULT_FEATURE_GROUPS:
        groups = _DEFAULT_FEATURE_GROUPS[service]
        return [
            (template.replace("{date}", date_str).replace("{feature_group}", g), g) for g in groups
        ]

    # Services with no sub-dimension (corporate-actions, calendar)
    return [(template.replace("{date}", date_str), None)]


def make_mock_path_combinatorics(
    venues: dict[str, dict[str, list[str]]] | None = None,
):
    """Return a PathCombinatorics mock that generates prefixes using _make_prefixes_for_date.

    Parameters
    ----------
    venues:
        Optional override for default venue sets per service per category.
        E.g. {'instruments-service': {'TRADFI': ['CME', 'NYSE']}}

    Use in data_status tests to exercise GCS listing via combinatoric prefix generation.
    """
    if venues:
        # Merge override into defaults
        effective_venues: dict[str, dict[str, list[str]]] = dict(_DEFAULT_VENUES)
        for svc, cat_map in venues.items():
            effective_venues.setdefault(svc, {}).update(cat_map)
    else:
        effective_venues = _DEFAULT_VENUES

    pc = MagicMock()
    pc.has_service_combinatorics.return_value = False
    pc.config_loader = MagicMock()
    pc.config_loader.load_service_config.side_effect = Exception("mock")

    # Build minimal CombinatoricEntry objects for market-tick-data-handler if available
    _market_tick_combos: list[object] = []
    if _CombinatoricEntry is not None:
        for cat, cat_venues in _DEFAULT_VENUES.get("instruments-service", {}).items():
            # market-tick uses CEFI venues for CEFI, TRADFI for TRADFI
            tick_venues = (
                ["BINANCE-SPOT", "BINANCE-FUTURES"]
                if cat == "CEFI"
                else ["CME", "ICE"]
                if cat == "TRADFI"
                else []
            )
            for v in tick_venues:
                for dt in ["trades", "book_snapshot_5"]:
                    _market_tick_combos.append(
                        _CombinatoricEntry(
                            category=cat,
                            venue=v,
                            folder="spot",
                            data_type=dt,
                            start_date=None,
                            tick_window_only=False,
                        )
                    )

    def _get_combinatorics(
        category: str | None = None,
        venues: list[str] | None = None,
        folders: list[str] | None = None,
        data_types: list[str] | None = None,
        service: str | None = None,
    ) -> list[object]:
        if not _market_tick_combos:
            return []
        result = list(_market_tick_combos)
        if category:
            result = [c for c in result if c.category.upper() == category.upper()]  # type: ignore[union-attr]
        if venues:
            vset = {v.upper() for v in venues}
            result = [c for c in result if c.venue.upper() in vset]  # type: ignore[union-attr]
        if data_types:
            dtset = {d.lower() for d in data_types}
            result = [c for c in result if c.data_type.lower() in dtset]  # type: ignore[union-attr]
        return result

    pc.get_combinatorics.side_effect = _get_combinatorics
    pc.is_in_tick_window.return_value = True
    pc._get_base_prefix.return_value = "raw_tick_data/by_date"
    pc.get_base_prefix.return_value = "raw_tick_data/by_date"

    def _get_service_prefixes_for_date(
        service: str,
        category: str,
        date_str: str,
        venue_filter: list[str] | None = None,
    ) -> list[tuple[str, str | None]]:
        template = _SERVICE_PATH_TEMPLATES.get(service)
        if not template:
            return []

        if service == "instruments-service":
            cat_venues = effective_venues.get(service, {}).get(category.upper(), [])
            if venue_filter:
                venue_set = {v.upper() for v in venue_filter}
                cat_venues = [v for v in cat_venues if v.upper() in venue_set]
            return [
                (template.replace("{date}", date_str).replace("{venue}", v), v)
                for v in sorted(cat_venues)
            ]

        if service in _DEFAULT_FEATURE_GROUPS:
            groups = _DEFAULT_FEATURE_GROUPS[service]
            return [
                (template.replace("{date}", date_str).replace("{feature_group}", g), g)
                for g in groups
            ]

        return [(template.replace("{date}", date_str), None)]

    pc.get_service_prefixes_for_date.side_effect = _get_service_prefixes_for_date
    return pc
