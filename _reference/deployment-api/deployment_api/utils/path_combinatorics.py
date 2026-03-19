"""
Path Combinatorics - Generate all valid GCS path prefixes for efficient parallel queries.

This module loads the venue_data_types.yaml configuration and generates all possible
valid GCS path prefixes based on the combinatorics of:
  - Category (CEFI, TRADFI, DEFI)
  - Venue
  - Folder (spot, perpetuals, futures_chain, options_chain, equities, etf, pool, lst, etc.)
  - Data type (trades, book_snapshot_5, derivative_ticker, liquidations, ohlcv_1m, etc.)

The generated prefixes are used for highly efficient parallel GCS queries, where we query
only the paths that could possibly contain data, rather than scanning everything.

Usage:
    from deployment_api.utils.path_combinatorics import PathCombinatorics

    pc = PathCombinatorics()

    # Get all valid prefixes for CEFI, filtered by venue
    prefixes = pc.get_prefixes_for_date(
        service="market-tick-data-handler",
        date="2024-01-15",
        category="CEFI",
        venues=["BINANCE-FUTURES"],
    )

    # Execute parallel queries
    results = await pc.parallel_query_prefixes(bucket, prefixes)
"""

import asyncio
import logging
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import cast

import yaml

logger = logging.getLogger(__name__)


# Valid timeframes for market-data-processing-service
PROCESSING_TIMEFRAMES = ["15s", "1m", "5m", "15m", "1h", "4h", "24h"]

# Data types that are downsampled (only these exist in processing service)
PROCESSING_DATA_TYPES = ["trades", "derivative_ticker"]

# Calendar service feature types (not in sharding config since it's date-only sharding)
CALENDAR_FEATURE_TYPES = ["temporal", "scheduled_events", "macro"]

# Instrument type to GCS folder mapping
# Used to filter combinatorics by accessible_instrument_types from venue_data_types.yaml.
# Maps canonical instrument type names to the GCS folder they produce data in.
# Must stay in sync with venue_data_types.yaml folder_mappings and folder names.
INSTRUMENT_TYPE_TO_FOLDER = {
    # CeFi
    "SPOT_PAIR": "spot",
    "PERPETUAL": "perpetuals",
    "FUTURE": "futures_chain",
    "OPTION": "options_chain",
    # TradFi
    "EQUITY": "equities",
    "ETF": "etf",
    "INDEX": "indices",
    # DeFi (matches DEFI.folder_mappings in venue_data_types.yaml)
    "POOL": "pool",
    "A_TOKEN": "pool",
    "DEBT_TOKEN": "pool",
    "LST": "lst",
    "YIELD_BEARING": "lst",
}

# Service-specific GCS path templates (key=value format for BigQuery hive partitioning)
SERVICE_PATH_TEMPLATES = {
    "instruments-service": "instrument_availability/by_date/day={date}/venue={venue}/",
    "features-delta-one-service": "by_date/day={date}/feature_group={feature_group}/",
    "features-onchain-service": "by_date/day={date}/feature_group={feature_group}/",
    "features-volatility-service": "by_date/day={date}/feature_group={feature_group}/",
    "features-calendar-service": "calendar/category={feature_type}/by_date/day={date}/",
    "corporate-actions": "corporate_actions/by_date/day={date}/",
}

# Services that load their dimensions from sharding.{service}.yaml
SHARDING_CONFIG_SERVICES = [
    "features-delta-one-service",
    "features-onchain-service",
    "features-volatility-service",
    "features-calendar-service",
    "instruments-service",
    "corporate-actions",
]


@dataclass
class CombinatoricEntry:
    """A single valid combinatoric (category, venue, folder, data_type, optional timeframe)."""

    category: str
    venue: str
    folder: str
    data_type: str
    start_date: str | None = None
    timeframe: str | None = None  # Only for market-data-processing-service
    tick_window_only: bool = False  # True if this data_type is only expected in tick windows

    def __hash__(self):
        return hash((self.category, self.venue, self.folder, self.data_type, self.timeframe))

    def to_gcs_prefix(self, date_str: str, base_prefix: str = "raw_tick_data/by_date") -> str:
        """Generate GCS prefix for this combinatoric and date.

        Uses key=value format for BigQuery hive partitioning:
        - market-tick-data-handler:
          {base}/day={date}/data_type={dt}/instrument_type={folder}/venue={venue}/
        - market-data-processing-service: {base}/day={date}/timeframe={tf}/data_type={dt}/
          (flat path, no instrument_type/venue folders)
        """
        if self.timeframe:
            # market-data-processing-service: flat path
            # processed_candles/by_date/day=.../timeframe=.../data_type=.../{instrument}.parquet
            return (
                f"{base_prefix}/day={date_str}"
                f"/timeframe={self.timeframe}/data_type={self.data_type}/"
            )
        else:
            # market-tick-data-handler: key=value for hive partitioning
            # raw_tick_data/by_date/day=.../data_type=.../instrument_type=equities/
            # venue=NYSE/instrument_key=*.parquet
            return (
                f"{base_prefix}/day={date_str}/data_type={self.data_type}"
                f"/instrument_type={self.folder}/venue={self.venue}/"
            )


@dataclass
class PathCombinatorics:
    """
    Generate and manage all valid GCS path combinatorics.

    Loads venue_data_types.yaml once and provides efficient methods to:
    1. Get all valid combinatorics for filtering
    2. Generate GCS prefixes for parallel queries
    3. Execute parallel queries against GCS
    """

    config: dict[str, dict[str, object]] = field(default_factory=dict)
    combinatorics: list[CombinatoricEntry] = field(default_factory=list)
    service_dimensions: dict[str, dict[str, list[str]]] = field(default_factory=dict)
    tick_windows: list[tuple[str, str]] = field(default_factory=list)
    _loaded: bool = field(default=False)

    def __post_init__(self):
        """Load config on initialization."""
        if not self._loaded:
            self._load_config()
            self._load_tick_windows()
            self._build_combinatorics()
            self._load_service_dimensions()
            self._loaded = True

    def _load_tick_windows(self) -> None:
        """Load tick data windows from TRADFI config in venue_data_types.yaml.

        Tick windows define date ranges where expensive tick data (trades, tbbo)
        is downloaded. Outside these windows, only cost-efficient ohlcv_1m is used.
        """
        tradfi_config: dict[str, object] = self.config.get("TRADFI") or {}
        raw_windows_val = tradfi_config.get("tick_windows")
        raw_windows: list[object] = (
            cast(list[object], raw_windows_val) if isinstance(raw_windows_val, list) else []
        )
        self.tick_windows = []
        for w in raw_windows:
            if isinstance(w, dict):
                w_dict = cast(dict[str, object], w)
                start_val = w_dict.get("start")
                end_val = w_dict.get("end")
                if isinstance(start_val, str) and isinstance(end_val, str):
                    self.tick_windows.append((start_val, end_val))
        if self.tick_windows:
            logger.info(
                "Loaded %s tick data window(s): %s",
                len(self.tick_windows),
                ", ".join(f"{s} to {e}" for s, e in self.tick_windows),
            )

    def is_in_tick_window(self, date_str: str) -> bool:
        """Check if a date falls within any tick data window."""
        return any(
            window_start <= date_str <= window_end for window_start, window_end in self.tick_windows
        )

    def _load_config(self) -> None:
        """Load venue_data_types.yaml configuration."""
        config_path = Path(__file__).parent.parent.parent / "configs" / "venue_data_types.yaml"
        if not config_path.exists():
            logger.warning("venue_data_types.yaml not found at %s", config_path)
            return

        with open(config_path) as f:
            raw: object = cast(object, yaml.safe_load(f))
        self.config = cast(dict[str, dict[str, object]], raw) if isinstance(raw, dict) else {}
        logger.debug("Loaded venue_data_types.yaml with %s categories", len(self.config))

    def _resolve_data_types(
        self, data_types: "list[object] | dict[str, object]"
    ) -> tuple[list[str], set[str]]:
        """Resolve data_types config into (final_data_types, tick_window_only_types)."""
        if not isinstance(data_types, dict):
            return [str(d) for d in data_types if d is not None], set()
        dt_dict: dict[str, object] = data_types
        default_val = dt_dict.get("default")
        tick_val = dt_dict.get("tick_window")
        default_list: list[str] = (
            cast(list[str], default_val) if isinstance(default_val, list) else []
        )
        tick_list: list[str] = cast(list[str], tick_val) if isinstance(tick_val, list) else []
        tick_window_only = set(tick_list) - set(default_list)
        all_dt: set[str] = set()
        for dt_list_val in dt_dict.values():
            if isinstance(dt_list_val, list):
                for item in cast(list[object], dt_list_val):
                    if isinstance(item, str):
                        all_dt.add(item)
        return list(all_dt), tick_window_only

    def _filter_folders_by_access(
        self, venue: str, folders: list[object], venue_config: "dict[str, object]"
    ) -> tuple[list[object], bool]:
        """Apply accessible_instrument_types filter. Returns (filtered_folders, should_skip)."""
        accessible_types_val = venue_config.get("accessible_instrument_types")
        if accessible_types_val is None:
            return folders, False
        accessible_types: list[object] = (
            cast(list[object], accessible_types_val)
            if isinstance(accessible_types_val, list)
            else []
        )
        if len(accessible_types) == 0:
            return [], True
        accessible_folders: set[str | None] = {
            INSTRUMENT_TYPE_TO_FOLDER.get(str(t)) for t in accessible_types
        } - {None}
        filtered: list[object] = [
            f for f in folders if isinstance(f, str) and f in accessible_folders
        ]
        return filtered, not filtered

    def _build_combinatorics(self) -> None:
        """Build all valid combinatorics from the config.

        Respects accessible_instrument_types from venue_data_types.yaml:
        - If accessible_instrument_types is not present: full access (all folders included)
        - If accessible_instrument_types is [] (empty): venue skipped entirely
        - If accessible_instrument_types is non-empty: only folders mapped from those types
        """
        self.combinatorics = []
        skipped_venues: list[str] = []

        for category in ["CEFI", "TRADFI", "DEFI"]:
            cat_config: dict[str, object] = self.config.get(category) or {}
            venues_val = cat_config.get("venues")
            venues: dict[str, object] = (
                cast(dict[str, object], venues_val) if isinstance(venues_val, dict) else {}
            )

            for venue_raw, venue_config_raw in venues.items():
                if not isinstance(venue_config_raw, dict):
                    continue
                venue = venue_raw
                venue_config = cast(dict[str, object], venue_config_raw)

                folders_val = venue_config.get("folders")
                folders: list[object] = (
                    cast(list[object], folders_val) if isinstance(folders_val, list) else []
                )
                data_types_val = venue_config.get("data_types")
                data_types: list[object] | dict[str, object] = (
                    cast(list[object], data_types_val)
                    if isinstance(data_types_val, list)
                    else (
                        cast(dict[str, object], data_types_val)
                        if isinstance(data_types_val, dict)
                        else []
                    )
                )
                start_date_val = venue_config.get("start_date")
                start_date: str | None = start_date_val if isinstance(start_date_val, str) else None

                folders, should_skip = self._filter_folders_by_access(venue, folders, venue_config)
                if should_skip:
                    skipped_venues.append(venue)
                    continue

                final_data_types, tick_window_only_types = self._resolve_data_types(data_types)

                for folder_raw in folders:
                    folder = folder_raw if isinstance(folder_raw, str) else ""
                    if not folder:
                        continue
                    for data_type in final_data_types:
                        self.combinatorics.append(
                            CombinatoricEntry(
                                category=category,
                                venue=venue,
                                folder=folder,
                                data_type=data_type,
                                start_date=start_date,
                                tick_window_only=data_type in tick_window_only_types,
                            )
                        )

        if skipped_venues:
            logger.info(
                "Skipped %s venue(s) with no accessible instrument types"
                " (Tardis subscription limitation): %s",
                len(skipped_venues),
                ", ".join(skipped_venues),
            )
        logger.info("Built %s valid path combinatorics", len(self.combinatorics))

    def _load_service_dimensions(self) -> None:
        """Load sharding dimensions from sharding.{service}.yaml for all services.

        This allows combinatorics-based (targeted prefix) queries for services
        beyond market-tick-data-handler and market-data-processing-service.
        """
        for svc in SHARDING_CONFIG_SERVICES:
            config_path = Path(__file__).parent.parent.parent / "configs" / f"sharding.{svc}.yaml"
            if not config_path.exists():
                logger.debug("No sharding config found for %s at %s", svc, config_path)
                continue
            try:
                with open(config_path) as f:
                    raw_svc: object = cast(object, yaml.safe_load(f))
                svc_config: dict[str, object] = (
                    cast(dict[str, object], raw_svc) if isinstance(raw_svc, dict) else {}
                )
                dims: dict[str, list[str]] = {}
                raw_dimensions = svc_config.get("dimensions")
                dimensions: list[object] = (
                    cast(list[object], raw_dimensions) if isinstance(raw_dimensions, list) else []
                )
                for dim_raw in dimensions:
                    if not isinstance(dim_raw, dict):
                        continue
                    dim = cast(dict[str, object], dim_raw)
                    name_val = dim.get("name")
                    if not isinstance(name_val, str):
                        continue
                    name = name_val
                    if dim.get("type") == "fixed" and "values" in dim:
                        values_val = dim["values"]
                        dims[name] = (
                            cast(list[str], values_val) if isinstance(values_val, list) else []
                        )
                self.service_dimensions[svc] = dims
                logger.debug(
                    "Loaded sharding dimensions for %s: %s",
                    svc,
                    ", ".join(f"{k}={len(v)}" for k, v in dims.items()),
                )
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Failed to load sharding config for %s: %s", svc, e)

        logger.info("Loaded service dimensions for %s services", len(self.service_dimensions))

    def get_service_prefixes_for_date(
        self,
        service: str,
        category: str,
        date_str: str,
        venue_filter: list[str] | None = None,
    ) -> list[tuple[str, str | None]]:
        """
        Get (prefix, sub_dimension_value) tuples for any service's combinatorics.

        This is the generic alternative to get_prefixes_for_date() for services
        that don't use the CombinatoricEntry model (venue x folder x data_type).

        Args:
            service: Service name
            category: Category (CEFI, TRADFI, DEFI)
            date_str: Date in YYYY-MM-DD format
            venue_filter: Optional venue filter (for instruments-service)

        Returns:
            List of (gcs_prefix, sub_dimension_value) tuples.
            sub_dimension_value is the value of the service's sub_dimension
            (e.g., venue name for instruments-service, feature_group for features-*).
        """
        template = SERVICE_PATH_TEMPLATES.get(service)
        if not template:
            return []

        dims = self.service_dimensions.get(service, {})

        # Validate category is supported by this service
        valid_cats = dims.get("category")
        if valid_cats and category.upper() not in [c.upper() for c in valid_cats]:
            return []

        if service == "instruments-service":
            # Use venues from venue_data_types.yaml (same config used for tick data)
            venues = self.get_all_venues_for_category(category)
            if venue_filter:
                venue_set = {v.upper() for v in venue_filter}
                venues = venues & venue_set
            return [
                (
                    template.replace("{date}", date_str).replace("{venue}", v),
                    v,
                )
                for v in sorted(venues)
            ]

        elif service in (
            "features-delta-one-service",
            "features-onchain-service",
            "features-volatility-service",
        ):
            # Use feature_group values from sharding config
            groups = dims.get("feature_group") or []
            return [
                (
                    template.replace("{date}", date_str).replace("{feature_group}", g),
                    g,
                )
                for g in groups
            ]

        elif service == "features-calendar-service":
            # Calendar uses hardcoded feature types (not in sharding dimensions)
            return [
                (
                    template.replace("{date}", date_str).replace("{feature_type}", ft),
                    ft,
                )
                for ft in CALENDAR_FEATURE_TYPES
            ]

        elif service == "corporate-actions":
            # No sub-dimension, just check date existence
            return [(template.replace("{date}", date_str), None)]

        return []

    def has_service_combinatorics(self, service: str, category: str) -> bool:
        """Check if a service has combinatorics available for a given category.

        Returns True if the service can use targeted prefix queries instead of
        directory listing for the given category.
        """
        if service in ("market-tick-data-handler", "market-data-processing-service"):
            return len(self.get_combinatorics(category=category, service=service)) > 0

        # For generic services, check if prefixes would be generated
        return len(self.get_service_prefixes_for_date(service, category, "2024-01-01")) > 0

    def get_combinatorics(
        self,
        category: str | None = None,
        venues: list[str] | None = None,
        folders: list[str] | None = None,
        data_types: list[str] | None = None,
        timeframes: list[str] | None = None,
        service: str | None = None,
    ) -> list[CombinatoricEntry]:
        """
        Get filtered combinatorics based on criteria.

        Args:
            category: Filter by category (CEFI, TRADFI, DEFI)
            venues: Filter by venue names
            folders: Filter by folder names
            data_types: Filter by data type names
            timeframes: Filter by timeframes (only for market-data-processing-service)
            service: Service name - if "market-data-processing-service", generates timeframe combos

        Returns:
            List of matching CombinatoricEntry objects
        """
        # For market-data-processing-service, generate timeframe-expanded combinatorics on-the-fly
        if service == "market-data-processing-service":
            results = self._get_processing_combinatorics(
                category=category,
                venues=venues,
                folders=folders,
                data_types=data_types,
                timeframes=timeframes,
            )
        else:
            # For other services, use base combinatorics (no timeframe)
            results = self.combinatorics

            if category:
                results = [c for c in results if c.category == category.upper()]

            if venues:
                venue_set = {v.upper() for v in venues}
                results = [c for c in results if c.venue in venue_set]

            if folders:
                folder_set = {f.lower() for f in folders}
                results = [c for c in results if c.folder.lower() in folder_set]

            if data_types:
                dt_set = {dt.lower() for dt in data_types}
                results = [c for c in results if c.data_type.lower() in dt_set]

        return results

    def _get_processing_combinatorics(
        self,
        category: str | None = None,
        venues: list[str] | None = None,
        folders: list[str] | None = None,
        data_types: list[str] | None = None,
        timeframes: list[str] | None = None,
    ) -> list[CombinatoricEntry]:
        """
        Generate combinatorics for market-data-processing-service.

        This expands the base combinatorics with timeframes and filters to
        only data_types that are downsampled (trades, derivative_ticker).
        """
        # Start with base combinatorics
        base = self.combinatorics

        if category:
            base = [c for c in base if c.category == category.upper()]

        if venues:
            venue_set = {v.upper() for v in venues}
            base = [c for c in base if c.venue in venue_set]

        if folders:
            folder_set = {f.lower() for f in folders}
            base = [c for c in base if c.folder.lower() in folder_set]

        # Filter to only data_types that are downsampled (processing service doesn't
        # have book_snapshot_5, liquidations, etc.)
        valid_dt = {dt.lower() for dt in PROCESSING_DATA_TYPES}
        dt_set = {dt.lower() for dt in data_types} & valid_dt if data_types else valid_dt
        base = [c for c in base if c.data_type.lower() in dt_set]

        # Determine timeframes to use
        target_timeframes = timeframes if timeframes else PROCESSING_TIMEFRAMES

        # Expand each base combinatoric with all timeframes
        results: list[CombinatoricEntry] = []
        for combo in base:
            for tf in target_timeframes:
                results.append(
                    CombinatoricEntry(
                        category=combo.category,
                        venue=combo.venue,
                        folder=combo.folder,
                        data_type=combo.data_type,
                        start_date=combo.start_date,
                        timeframe=tf,
                        tick_window_only=combo.tick_window_only,
                    )
                )

        return results

    def get_prefixes_for_date(
        self,
        service: str,
        date_str: str,
        category: str | None = None,
        venues: list[str] | None = None,
        folders: list[str] | None = None,
        data_types: list[str] | None = None,
        timeframes: list[str] | None = None,
    ) -> list[str]:
        """
        Get all valid GCS prefixes for a specific date.

        Args:
            service: Service name (for determining base prefix)
            date_str: Date in YYYY-MM-DD format
            category: Optional category filter
            venues: Optional venue filters
            folders: Optional folder filters
            data_types: Optional data type filters
            timeframes: Optional timeframe filters (for market-data-processing-service)

        Returns:
            List of GCS prefix strings to query
        """
        # Get base prefix based on service
        base_prefix = self._get_base_prefix(service)

        # Get filtered combinatorics (pass service for timeframe expansion)
        combos = self.get_combinatorics(
            category=category,
            venues=venues,
            folders=folders,
            data_types=data_types,
            timeframes=timeframes,
            service=service,
        )

        # Filter out combinatorics that started after this date
        # Also filter out tick_window_only combos when date is outside tick windows
        date_dt = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=UTC)
        in_tick_window = self.is_in_tick_window(date_str)
        valid_combos: list[CombinatoricEntry] = []
        for c in combos:
            if c.start_date:
                try:
                    start_dt = datetime.strptime(c.start_date, "%Y-%m-%d").replace(tzinfo=UTC)
                    if date_dt < start_dt:
                        continue
                except ValueError:
                    pass  # Invalid date format, include anyway
            # Skip tick_window_only data types outside tick windows
            if c.tick_window_only and not in_tick_window:
                continue
            valid_combos.append(c)

        # Generate prefixes
        prefixes: list[str] = [c.to_gcs_prefix(date_str, base_prefix) for c in valid_combos]

        logger.debug(
            "Generated %s prefixes for date=%s, category=%s, venues=%s, service=%s",
            len(prefixes),
            date_str,
            category,
            venues,
            service,
        )

        return prefixes

    def _get_base_prefix(self, service: str) -> str:
        """Get the base GCS prefix for a service."""
        return self.get_base_prefix(service)

    def get_base_prefix(self, service: str) -> str:
        """Get the base GCS prefix for a service (public API)."""
        if service == "instruments-service":
            return "instruments"
        elif service == "market-data-processing-service":
            return "processed_candles/by_date"
        else:
            return "raw_tick_data/by_date"

    def get_all_venues_for_category(self, category: str) -> set[str]:
        """Get all configured venues for a category."""
        cat_config: dict[str, object] = self.config.get(category.upper()) or {}
        venues_val = cat_config.get("venues")
        if not isinstance(venues_val, dict):
            return set()
        venues: dict[str, object] = cast(dict[str, object], venues_val)
        return {str(k) for k in venues}

    def get_all_folders_for_category(self, category: str) -> set[str]:
        """Get all possible folders for a category."""
        folders: set[str] = set()
        for c in self.combinatorics:
            if c.category == category.upper():
                folders.add(c.folder)
        return folders

    def get_all_data_types_for_category(self, category: str) -> set[str]:
        """Get all possible data types for a category."""
        data_types: set[str] = set()
        for c in self.combinatorics:
            if c.category == category.upper():
                data_types.add(c.data_type)
        return data_types

    async def parallel_query_prefixes(
        self,
        bucket_or_name: object,  # bucket object (legacy) or bucket_name str
        prefixes: list[str],
        query_fn: Callable[[str], list[str]] | None = None,
        max_workers: int = 50,
    ) -> dict[str, list[str]]:
        """
        Execute parallel GCS queries for all prefixes.
        Uses storage facade (FUSE when production) when bucket_or_name is str.

        Args:
            bucket_or_name: GCS bucket name (str) or legacy bucket object
            prefixes: List of GCS prefixes to query
            query_fn: Optional custom query function. If None, uses list_objects.
            max_workers: Maximum parallel threads

        Returns:
            Dict mapping prefix -> list of blob names
        """
        if not prefixes:
            return {}

        # Support both bucket name (str) and legacy bucket object
        bucket_name: str | None = (
            bucket_or_name
            if isinstance(bucket_or_name, str)
            else cast(str | None, getattr(bucket_or_name, "name", None))
        )

        loop = asyncio.get_event_loop()

        def default_query(prefix: str) -> list[str]:
            """Default query: list all blobs under prefix via storage facade."""
            try:
                if bucket_name:
                    from deployment_api.utils.storage_facade import list_objects

                    objs = list_objects(bucket_name, prefix)
                    return [o.name for o in objs]
                return []
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Query failed for %s: %s", prefix, e)
                return []

        query_func: Callable[[str], list[str]] = query_fn if query_fn is not None else default_query

        # Execute all queries in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            # Create futures for all prefixes
            futures: dict[str, asyncio.Future[list[str]]] = {
                prefix: loop.run_in_executor(executor, query_func, prefix) for prefix in prefixes
            }

            # Gather all results
            results: dict[str, list[str]] = {}
            for prefix, future in futures.items():
                try:
                    results[prefix] = await future
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Query failed for %s: %s", prefix, e)
                    results[prefix] = []

        logger.info(
            "Completed %s parallel queries, %s total blobs found",
            len(prefixes),
            sum(len(r) for r in results.values()),
        )

        return results

    def get_instruments_service_prefixes(
        self,
        date_str: str,
        category: str | None = None,
        venues: list[str] | None = None,
    ) -> list[str]:
        """
        Get prefixes for instruments-service (key=value format).

        Instruments-service structure: instrument_availability/by_date/day={date}/venue={venue}/

        Args:
            date_str: Date in YYYY-MM-DD format
            category: Optional category filter
            venues: Optional venue filters

        Returns:
            List of GCS prefix strings
        """
        # Get all venues for the category(ies)
        target_venues: set[str] = set()
        categories = [category.upper()] if category else ["CEFI", "TRADFI", "DEFI"]

        for cat in categories:
            cat_venues: set[str] = self.get_all_venues_for_category(cat)
            if venues:
                # Filter to requested venues
                venue_set = {v.upper() for v in venues}
                cat_venues = cat_venues & venue_set
            target_venues.update(cat_venues)

        # Generate prefixes (key=value format)
        base_prefix = f"instrument_availability/by_date/day={date_str}"
        prefixes: list[str] = [f"{base_prefix}/venue={venue}/" for venue in target_venues]

        return prefixes


# Singleton instance for reuse
_path_combinatorics: PathCombinatorics | None = None


def get_path_combinatorics() -> PathCombinatorics:
    """Get singleton PathCombinatorics instance."""
    global _path_combinatorics
    if _path_combinatorics is None:
        _path_combinatorics = PathCombinatorics()
    return _path_combinatorics


def clear_path_combinatorics_cache() -> None:
    """Clear the cached PathCombinatorics (useful for testing or config reload)."""
    global _path_combinatorics
    _path_combinatorics = None
