"""
Distribution logic for calculating valid shard combinations.

This module handles the complex logic of calculating all valid combinations
of dimension values while respecting hierarchical relationships and applying
various filtering strategies.
"""

import itertools
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import cast

from unified_events_interface import log_event
from unified_trading_library import get_secret_client, get_storage_client

from ..catalog import SERVICE_GCS_CONFIGS
from ..cloud_client import CloudClient
from ..config_loader import ConfigLoader
from ..deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Initialize configuration for project ID
_config = DeploymentConfig()


class CombinationCalculator:
    """Calculates valid combinations of dimension values with filtering capabilities."""

    def __init__(self, config_loader: ConfigLoader, cloud_client: CloudClient):
        """
        Initialize combination calculator.

        Args:
            config_loader: Configuration loader instance
            cloud_client: Cloud client for operations
        """
        self.config_loader = config_loader
        self.cloud_client = cloud_client

    def calculate_combinations(
        self,
        dimension_values: dict[str, list[object]],
        hierarchical_dims: dict[str, str],
    ) -> list[dict[str, object]]:
        """
        Calculate all valid combinations of dimension values.

        Handles hierarchical dimensions by ensuring parent-child relationships
        are maintained (e.g., CEFI venues only combined with CEFI category).
        """
        if not dimension_values:
            return [{}]

        # Separate hierarchical and non-hierarchical dimensions
        non_hier_dims = {k: v for k, v in dimension_values.items() if k not in hierarchical_dims}
        hier_dims = {k: v for k, v in dimension_values.items() if k in hierarchical_dims}

        # If no hierarchical dimensions, simple cartesian product
        if not hier_dims:
            return self._simple_combinations(dimension_values)

        # With hierarchical dimensions, build combinations carefully
        combinations: list[dict[str, object]] = []

        # First, get all non-hierarchical combinations
        non_hier_combos: list[dict[str, object]]
        if non_hier_dims:
            non_hier_keys = list(non_hier_dims.keys())
            non_hier_lists = [non_hier_dims[k] for k in non_hier_keys]
            non_hier_combos = [
                dict(zip(non_hier_keys, c, strict=False))
                for c in itertools.product(*non_hier_lists)
            ]
        else:
            non_hier_combos = [{}]

        # For each non-hierarchical combo, add valid hierarchical values
        for base_combo in non_hier_combos:
            valid_hier_combos = self._build_hierarchical_combos(
                base_combo,
                cast(dict[str, list[tuple[object, object]]], hier_dims),
                hierarchical_dims,
            )

            for hier_combo in valid_hier_combos:
                full_combo: dict[str, object] = {**base_combo, **hier_combo}
                combinations.append(full_combo)

        return combinations

    def _simple_combinations(
        self, dimension_values: dict[str, list[object]]
    ) -> list[dict[str, object]]:
        """Calculate simple cartesian product for non-hierarchical dimensions."""
        keys = list(dimension_values.keys())
        value_lists = [dimension_values[k] for k in keys]

        combinations: list[dict[str, object]] = []
        for combo in itertools.product(*value_lists):
            combinations.append(dict(zip(keys, combo, strict=False)))
        return combinations

    def _build_hierarchical_combos(
        self,
        base_combo: dict[str, object],
        hier_dims: dict[str, list[tuple[object, object]]],
        hierarchical_parents: dict[str, str],
    ) -> list[dict[str, object]]:
        """Build valid combinations of hierarchical dimensions."""
        if not hier_dims:
            return [{}]

        result: list[dict[str, object]] = [{}]

        for hier_name, tuples in hier_dims.items():
            parent_name = hierarchical_parents[hier_name]

            # Get parent value from base_combo
            parent_val = base_combo.get(parent_name)

            # Filter tuples to match parent
            valid_children = [child for p, child in tuples if p == parent_val]

            # Expand result with valid children
            new_result: list[dict[str, object]] = []
            for existing in result:
                for child in valid_children:
                    new_combo: dict[str, object] = {**existing, hier_name: child}
                    new_result.append(new_combo)

            result = new_result

        return result

    def filter_by_start_dates(
        self,
        combinations: list[dict[str, object]],
        service: str,
    ) -> list[dict[str, object]]:
        """
        Filter out combinations where the date is before the expected start date.

        This prevents creating shards for date combinations where no data is expected.
        """
        filtered: list[dict[str, object]] = []

        for combo in combinations:
            date_val = combo.get("date")
            venue = combo.get("venue")
            category = combo.get("category")

            # If no date dimension, nothing to filter
            if date_val is None:
                filtered.append(combo)
                continue

            # Extract the date string for comparison
            combo_date = (
                cast(dict[str, str], date_val).get("start")
                if isinstance(date_val, dict)
                else str(date_val)
            )

            if combo_date is None:
                filtered.append(combo)
                continue

            # Determine the start date to filter against
            start_date: str | None = None

            if venue is not None:
                # Service has venue dimension - try venue-specific start date first
                start_date = self.config_loader.get_venue_start_date(
                    service, str(category) if category else "", str(venue)
                )

            if start_date is None and category is not None:
                # Fall back to category start date
                start_date = self.config_loader.get_category_start_date(service, str(category))

            if start_date is None:
                # No start date configured, include the combo
                filtered.append(combo)
                continue

            # Compare dates (string comparison works for ISO format YYYY-MM-DD)
            if combo_date >= start_date:
                filtered.append(combo)
            else:
                venue_str = f"/{venue}" if venue else ""
                logger.debug(
                    "Filtering out %s%s on %s (before start date %s)",
                    category,
                    venue_str,
                    combo_date,
                    start_date,
                )

        return filtered

    def filter_by_tardis_access(
        self,
        combinations: list[dict[str, object]],
        service: str,
    ) -> list[dict[str, object]]:
        """Filter venues based on Tardis subscription access for market-tick-data-handler."""
        if (
            "venue" not in [combo.get("venue") for combo in combinations]
            or service != "market-tick-data-handler"
        ):
            return combinations

        original_count = len(combinations)

        # Check Tardis access mode
        tardis_mode = self._get_tardis_access_mode()
        logger.info("Tardis access mode: %s", tardis_mode)

        if tardis_mode == "perpetuals_only":
            # Filter out spot-only venues
            combinations = self._filter_spot_only_venues(combinations)
            filtered_count = original_count - len(combinations)
            if filtered_count > 0:
                logger.info("Filtered %s shards for spot-only venues", filtered_count)
        else:
            logger.info("Tardis full_access mode: all venues accessible")

        return combinations

    def filter_by_existing_data(
        self,
        combinations: list[dict[str, object]],
        service: str,
    ) -> list[dict[str, object]]:
        """
        Filter out combinations where data already exists in GCS.

        Used by "Deploy Missing" feature to only deploy shards that don't have data yet.
        """
        # Get GCS config for this service
        gcs_config = SERVICE_GCS_CONFIGS.get(service)
        if not gcs_config or not gcs_config.get("bucket_template"):
            logger.warning("No GCS config for service %s, skipping existing data check", service)
            return combinations

        bucket_template = str(gcs_config["bucket_template"])
        path_template = str(gcs_config["path_template"])
        list_prefix = bool(gcs_config.get("list_prefix", False))

        if not path_template:
            logger.warning("No path template for service %s, skipping existing data check", service)
            return combinations

        try:
            storage_client = get_storage_client(project_id=str(_config.gcp_project_id or ""))
        except (OSError, ValueError, RuntimeError) as e:  # non-fatal; degrade gracefully
            logger.warning(
                "Storage client unavailable for skip_existing check on service %s; "
                "treating all shards as not existing: %s",
                service,
                e,
            )
            return combinations

        def check_data_exists(combo: dict[str, object]) -> tuple[dict[str, object], bool]:
            """Check if data exists for a shard combination."""
            try:
                # Extract dimensions for path construction
                category = str(combo.get("category") or "")
                date_val = combo.get("date")
                venue = str(combo.get("venue") or "") or None
                data_type = str(combo.get("data_type") or "") or None
                feature_group = str(combo.get("feature_group") or "") or None
                timeframe = str(combo.get("timeframe") or "") or None

                # Extract date string
                if isinstance(date_val, dict):
                    date_str = str(cast(dict[str, str], date_val).get("start") or "")
                else:
                    date_str = str(date_val) if date_val else ""

                # Construct bucket and path
                project_id = str(_config.gcp_project_id or "")
                bucket_name = bucket_template.format(
                    category_lower=category.lower() if category else "",
                    project_id=project_id,
                )

                path = path_template.format(
                    date=date_str,
                    category=category,
                    category_lower=category.lower() if category else "",
                    venue=venue or "",
                    data_type=data_type or "",
                    feature_group=feature_group or "",
                    timeframe=timeframe or "",
                )

                # Check if data exists
                bucket = storage_client.bucket(bucket_name)

                if list_prefix:
                    # For services with directory structure, check for files in prefix
                    venue_str = str(venue) if venue else ""
                    if service == "market-tick-data-handler" and venue_str:
                        blobs = list(bucket.list_blobs(prefix=path, max_results=100))
                        venue_files = [b for b in blobs if venue_str in b.name]
                        exists = len(venue_files) > 0
                    elif service == "market-data-processing-service" and venue:
                        match_glob = f"{path}**/{venue}/*.parquet"
                        blobs = list(bucket.list_blobs(match_glob=match_glob, max_results=1))
                        exists = len(blobs) > 0
                    else:
                        blobs = list(bucket.list_blobs(prefix=path, max_results=1))
                        exists = len(blobs) > 0
                else:
                    # Check for specific file
                    blob = bucket.blob(path)
                    exists = blob.exists()

                return (combo, exists)
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Error checking data existence for %s: %s", combo, e)
                return (combo, False)

        # Check all combinations in parallel
        filtered: list[dict[str, object]] = []
        with ThreadPoolExecutor(max_workers=50) as executor:
            futures = {executor.submit(check_data_exists, combo): combo for combo in combinations}
            for future in as_completed(futures):
                result_combo, exists = future.result()
                if not exists:
                    filtered.append(result_combo)

        return filtered

    def _get_tardis_access_mode(self) -> str:
        """Determine Tardis API access mode."""
        # Check env var override first
        mode_override = _config.tardis_access_mode or None
        if mode_override in ["full_access", "perpetuals_only"]:
            logger.info("Tardis mode from env var: %s", mode_override)
            return mode_override

        # Auto-detect from secrets
        try:
            providers_config = self.config_loader.load_data_providers_config()
            tardis_config: dict[str, object] = cast(
                dict[str, object], providers_config.get("tardis") or {}
            )

            # Check if auto mode is configured
            mode_setting = str(tardis_config.get("mode", "auto") or "auto")
            if mode_setting in ["full_access", "perpetuals_only"]:
                logger.info("Tardis mode from config: %s", mode_setting)
                return mode_setting

            # Auto-detect: Check if full access secret exists
            secrets_config: dict[str, object] = cast(
                dict[str, object], tardis_config.get("secrets") or {}
            )
            full_secret_name = str(
                secrets_config.get("full_access", "tardis-api-key-full") or "tardis-api-key-full"
            )

            try:
                client = get_secret_client()
                full_key = client.get_secret(full_secret_name)
                log_event(
                    "SECRET_ACCESSED",
                    details={
                        "secret_name": full_secret_name,
                        "service": "deployment-service",
                        "accessor": "CombinationCalculator._detect_tardis_mode",
                    },
                )
                if full_key:
                    logger.info("Tardis mode auto-detected: full_access")
                    return "full_access"
            except (OSError, ValueError, RuntimeError) as e:
                logger.debug("Full access secret %s not found: %s", full_secret_name, e)
                logger.info("Tardis mode auto-detected: perpetuals_only")
                return "perpetuals_only"
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Error detecting Tardis mode: %s, defaulting to perpetuals_only", e)

        return "perpetuals_only"

    def _filter_spot_only_venues(
        self,
        combinations: list[dict[str, object]],
    ) -> list[dict[str, object]]:
        """Filter out spot-only venues for perpetuals-only Tardis subscriptions."""
        try:
            providers_config = self.config_loader.load_data_providers_config()
            tardis_config_raw: dict[str, object] = cast(
                dict[str, object], providers_config.get("tardis") or {}
            )
            spot_only_venues: set[str] = set(
                cast(
                    list[str],
                    tardis_config_raw.get("spot_only_venues")
                    or ["BINANCE-SPOT", "COINBASE", "UPBIT"],
                )
            )
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Could not load spot-only venues config: %s, using defaults", e)
            spot_only_venues = {"BINANCE-SPOT", "COINBASE", "UPBIT"}

        if not spot_only_venues:
            return combinations

        filtered: list[dict[str, object]] = []
        skipped_venues: set[str] = set()
        for combo in combinations:
            venue = combo.get("venue")
            if venue and str(venue) in spot_only_venues:
                skipped_venues.add(str(venue))
                continue
            filtered.append(combo)

        if skipped_venues:
            logger.info("Filtered spot-only venue(s): %s", ", ".join(sorted(skipped_venues)))

        return filtered
