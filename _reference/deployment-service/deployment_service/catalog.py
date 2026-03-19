"""
Data Catalog - Track data completion status across services.

This module provides functionality to:
1. List GCS files for each combinatoric (category/venue/date)
2. Calculate completion percentages
3. Aggregate catalogs across services
"""

import json
import logging
from dataclasses import dataclass, field
from datetime import date, timedelta
from itertools import product
from typing import cast

from unified_api_contracts import DATA_TYPES_BY_CATEGORY

from .cloud_client import CloudClient
from .config_loader import ConfigLoader
from .deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Project ID from config (used in GCS bucket name templates)
_config = DeploymentConfig()
_PROJECT_ID: str | None = cast(str | None, _config.gcp_project_id)


@dataclass
class CatalogEntry:
    """Represents a single combinatoric entry in the catalog."""

    service: str
    dimensions: dict[str, object]
    file_count: int
    expected_count: int = 1  # Default to 1 file per combinatoric
    files: list[str] = field(default_factory=list)

    @property
    def completion_percentage(self) -> float:
        """Calculate completion percentage."""
        if self.expected_count == 0:
            return 100.0
        return min(100.0, (self.file_count / self.expected_count) * 100)

    @property
    def is_complete(self) -> bool:
        """Check if this entry is complete."""
        return self.file_count >= self.expected_count

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary for serialization."""
        return {
            "service": self.service,
            "dimensions": self.dimensions,
            "file_count": self.file_count,
            "expected_count": self.expected_count,
            "completion_percentage": self.completion_percentage,
            "is_complete": self.is_complete,
        }


@dataclass
class ServiceCatalog:
    """Catalog for a single service."""

    service: str
    start_date: str
    end_date: str
    entries: list[CatalogEntry] = field(default_factory=list)

    @property
    def total_entries(self) -> int:
        """Total number of entries."""
        return len(self.entries)

    @property
    def complete_entries(self) -> int:
        """Number of complete entries."""
        return sum(1 for e in self.entries if e.is_complete)

    @property
    def overall_completion(self) -> float:
        """Overall completion percentage."""
        if self.total_entries == 0:
            return 0.0
        return (self.complete_entries / self.total_entries) * 100

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary for serialization."""
        return {
            "service": self.service,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "total_entries": self.total_entries,
            "complete_entries": self.complete_entries,
            "overall_completion": self.overall_completion,
            "entries": [e.to_dict() for e in self.entries],
        }

    def get_breakdown_by_dimension(self, dimension: str) -> dict[str, dict[str, int]]:
        """Get completion breakdown by a specific dimension."""
        breakdown: dict[str, dict[str, int]] = {}

        for entry in self.entries:
            dim_value_raw = entry.dimensions.get(dimension)
            if dim_value_raw is None:
                continue

            # Handle date dimension (dict with start/end)
            if isinstance(dim_value_raw, dict):
                date_dict = cast(dict[str, str], dim_value_raw)
                dim_value: str = date_dict.get("start") or date_dict.get("end", "unknown")
            else:
                dim_value = str(dim_value_raw)

            if dim_value not in breakdown:
                breakdown[dim_value] = {"total": 0, "complete": 0}

            breakdown[dim_value]["total"] += 1
            if entry.is_complete:
                breakdown[dim_value]["complete"] += 1

        return breakdown


# Service-specific GCS path configurations (key=value format for BigQuery hive partitioning)
SERVICE_GCS_CONFIGS = {
    "instruments-service": {
        "bucket_template": "instruments-store-{category_lower}-{project_id}",
        "path_template": "instrument_availability/by_date/day={date}/instruments.parquet",
        "dimensions": ["category", "date"],
    },
    "corporate-actions": {
        "bucket_template": "instruments-store-{category_lower}-{project_id}",
        "path_template": "corporate_actions/by_date/day={date}/",
        "dimensions": ["category", "date"],
        "date_granularity": "none",  # Bulk download, daily partitions
        "list_prefix": True,  # Directory check - verify files exist
        # Additional paths for the new GCS layout:
        "by_ticker_template": "corporate_actions/by_ticker/",
        "metadata_template": "corporate_actions/metadata/",
        "config_template": "corporate_actions/config/",
    },
    "market-tick-data-service": {
        "bucket_template": "market-data-tick-{category_lower}-{project_id}",
        "path_template": "raw_tick_data/by_date/day={date}/data_type={data_type}/",
        "dimensions": ["category", "venue", "data_type", "date"],
        "list_prefix": True,  # List files in prefix (includes instrument_type=, venue= subdirs)
    },
    "market-data-processing-service": {
        "bucket_template": "market-data-tick-{category_lower}-{project_id}",
        "path_template": (
            "processed_candles/by_date/day={date}/timeframe={timeframe}/data_type={data_type}/"
        ),
        "dimensions": ["category", "timeframe", "data_type", "venue", "date"],
        "list_prefix": True,
        # Expected timeframes - all 7 must be present for completion
        "expected_timeframes": ["15s", "1m", "5m", "15m", "1h", "4h", "24h"],
        # Expected data types per category (SSOT: unified-api-contracts DATA_TYPES_BY_CATEGORY)
        # Keys uppercased to match service config category convention (CEFI, TRADFI, DEFI, etc.)
        "expected_data_types": {k.upper(): v for k, v in DATA_TYPES_BY_CATEGORY.items()},
        # Chain data types have special path structure
        "chain_data_types": ["options_chain", "futures_chain"],
        # Chain path templates - match market-data-processing implementation
        # Implementation: .../data_type={type}/{asset_class}/{venue}/{instrument_id}.parquet
        "chain_path_templates": {
            "options_chain": (
                "processed_candles/by_date/day={date}/timeframe={timeframe}"
                "/data_type=options_chain/options_chain/{venue}/"
            ),
            "futures_chain": (
                "processed_candles/by_date/day={date}/timeframe={timeframe}"
                "/data_type={data_type}/futures_chain/{venue}/"
            ),
        },
        # Enable venue-specific data_type expectations from venue_data_types.yaml
        "use_venue_specific_data_types": True,
    },
    "features-delta-one-service": {
        "bucket_template": "features-delta-one-{category_lower}-{project_id}",
        "path_template": "by_date/day={date}/feature_group={feature_group}/",
        "dimensions": ["category", "feature_group", "date"],
        "list_prefix": True,
    },
    "features-volatility-service": {
        "bucket_template": "features-volatility-{category_lower}-{project_id}",
        "path_template": "by_date/day={date}/feature_group={feature_group}/",
        "dimensions": ["category", "feature_group", "date"],
        "list_prefix": True,
    },
    "features-onchain-service": {
        # SHARED bucket - onchain metrics apply across all domains
        "bucket_template": "features-onchain-{project_id}",
        "path_template": "by_date/day={date}/feature_group={feature_group}/",
        "dimensions": ["feature_group", "date"],  # No category dimension
        "list_prefix": True,
    },
    "features-calendar-service": {
        # SHARED bucket - calendar features are universal (same for all categories)
        "bucket_template": "features-calendar-{project_id}",
        "path_template": "calendar/category={feature_group}/by_date/day={date}/",
        "dimensions": ["feature_group", "date"],  # No category dimension
        "list_prefix": True,
        # Feature groups: temporal (hour/day cycles), scheduled_events (FOMC, NFP),
        # event_actuals (T+1 data)
        "expected_feature_groups": ["temporal", "scheduled_events", "event_actuals"],
    },
    "ml-training-service": {
        "bucket_template": "ml-models-store-{project_id}",
        "path_template": "models/",
        "dimensions": ["instrument", "timeframe", "target_type"],
        "list_prefix": True,
    },
    "ml-inference-service": {
        "bucket_template": "ml-predictions-store-{project_id}",
        "path_template": "predictions/{mode}/{date}/",
        "dimensions": ["mode", "instrument", "date"],
        "list_prefix": True,
    },
    "strategy-service": {
        # SHARED bucket - strategy signals span all categories
        "bucket_template": "strategy-store-{project_id}",
        "path_template": "signals/",
        "dimensions": ["strategy_id", "date"],  # No domain dimension for bucket
        "list_prefix": True,
    },
    "execution-service": {
        "bucket_template": "execution-store-{domain}-{project_id}",
        "path_template": "backtest_results/",
        # Dimensions align with sharding: domain determines bucket,
        # strategy/instruments filter signals
        "dimensions": ["domain", "strategy_id", "instrument", "date"],
        "list_prefix": True,
        "notes": (
            "execution-service shards by: domain (bucket), strategy_id (signal source), "
            "instrument (filter within signals), date (time range). "
            "Instrument list filters which instruments from strategy signals to execute."
        ),
    },
}


@dataclass
class ExecutionConfigStatus:
    """
    Data status for a single execution-service config file.

    Used by get_execution_data_status() to report config-based (not date-based)
    completion for execution-service and strategy-service.
    """

    config_path: str
    present_dates: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return {
            "config_path": self.config_path,
            "present_dates": self.present_dates,
            "present_count": len(self.present_dates),
        }


class DataCatalog:
    """
    Data Catalog for tracking service output completion.

    Scans GCS buckets to count files for each combinatoric
    and calculates completion percentages.
    """

    def __init__(
        self,
        config_dir: str = "configs",
        project_id: str | None = None,
    ):
        """
        Initialize the data catalog.

        Args:
            config_dir: Path to configuration directory
            project_id: GCP project ID for bucket names
        """
        self.config_loader = ConfigLoader(config_dir)
        _pid_fallback: str = _PROJECT_ID if _PROJECT_ID is not None else ""
        self.project_id: str = project_id or _pid_fallback
        self.cloud_client = CloudClient(project_id=self.project_id)

    def catalog_service(
        self,
        service: str,
        start_date: date,
        end_date: date,
        include_files: bool = False,
        **filters: object,
    ) -> ServiceCatalog:
        """
        Generate a catalog for a single service.

        Args:
            service: Service name
            start_date: Start of date range to check
            end_date: End of date range to check
            include_files: Whether to include individual file paths
            **filters: Dimension filters (category, venue, etc.)

        Returns:
            ServiceCatalog with entries for each combinatoric
        """
        logger.info("Cataloging %s from %s to %s", service, start_date, end_date)

        # Get GCS config for this service
        gcs_config = SERVICE_GCS_CONFIGS.get(service)
        if not gcs_config or not gcs_config.get("bucket_template"):
            logger.warning("No GCS config for %s, skipping", service)
            return ServiceCatalog(
                service=service,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
            )

        # Load service sharding config
        try:
            service_config = self.config_loader.load_service_config(service)
        except FileNotFoundError:
            logger.warning("No sharding config for %s", service)
            return ServiceCatalog(
                service=service,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat(),
            )

        # Build all combinatorics
        combinations = self._build_combinations(service_config, start_date, end_date, **filters)

        # Check each combination
        entries: list[CatalogEntry] = []
        for combo in combinations:
            entry = self._check_combination(
                service, cast(dict[str, object], gcs_config), combo, include_files
            )
            entries.append(entry)

        return ServiceCatalog(
            service=service,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            entries=entries,
        )

    def _build_combinations(
        self,
        service_config: dict[str, object],
        start_date: date,
        end_date: date,
        **filters: object,
    ) -> list[dict[str, object]]:
        """Build all dimension combinations for a service."""
        dimension_values: dict[str, list[object]] = {}

        for dim in cast(list[dict[str, object]], service_config["dimensions"]):
            dim_name = str(dim["name"])
            dim_type = str(dim["type"])

            # Apply filter if provided
            filter_value = filters.get(dim_name)

            if dim_type == "fixed":
                values: list[object] = cast(list[object], dim.get("values") or [])
                if filter_value:
                    filter_list = (
                        cast(list[object], filter_value)
                        if isinstance(filter_value, list)
                        else [filter_value]
                    )
                    values = [v for v in values if v in filter_list]
                dimension_values[dim_name] = values

            elif dim_type == "date_range":
                # Generate dates
                dates: list[object] = []
                current = start_date
                while current <= end_date:
                    dates.append(current.isoformat())
                    current += timedelta(days=1)
                dimension_values[dim_name] = dates

            elif dim_type == "hierarchical":
                # Load from venues config
                parent_obj = dim.get("parent")
                parent = str(parent_obj) if parent_obj is not None else ""
                parent_values = dimension_values.get(parent, [])

                hier_values: list[object]
                if dim_name == "venue":
                    venues_config = self.config_loader.load_venues_config()
                    hier_values = []
                    for pv in parent_values:
                        cats = cast(dict[str, object], venues_config["categories"])
                        cat_cfg = cast(dict[str, object], cats.get(str(pv), {}))
                        cat_venues: list[object] = cast(list[object], cat_cfg.get("venues") or [])
                        hier_values.extend(cat_venues)
                    hier_values = list(set(hier_values))
                else:
                    hier_values = []

                if filter_value:
                    filter_list2 = (
                        cast(list[object], filter_value)
                        if isinstance(filter_value, list)
                        else [filter_value]
                    )
                    hier_values = [v for v in hier_values if v in filter_list2]

                dimension_values[dim_name] = hier_values

            elif dim_type == "gcs_dynamic":
                # For catalog, just use empty - dynamic configs are scanned separately
                dimension_values[dim_name] = ["*"]

        # Build Cartesian product
        if not dimension_values:
            return [{}]

        keys: list[str] = list(dimension_values.keys())
        value_lists: list[list[object]] = [dimension_values[k] for k in keys]

        combinations: list[dict[str, object]] = []
        for combo in product(*value_lists):
            combinations.append(dict(zip(keys, combo, strict=False)))

        return combinations

    def _check_combination(
        self,
        service: str,
        gcs_config: dict[str, object],
        dimensions: dict[str, object],
        include_files: bool,
    ) -> CatalogEntry:
        """Check a single combinatoric for completion."""
        # Build template variables
        template_vars: dict[str, object] = {
            **dimensions,
            **{f"{k}_lower": str(v).lower() for k, v in dimensions.items()},
            "project_id": self.project_id,
        }
        str_template_vars = {k: str(v) for k, v in template_vars.items()}

        # Handle date dimension
        date_val = dimensions.get("date")
        if date_val:
            str_template_vars["date"] = str(date_val)

        # Build bucket and path
        bucket_template = str(gcs_config["bucket_template"])
        path_template = str(gcs_config["path_template"])
        try:
            bucket = bucket_template.format(**str_template_vars)
            path = path_template.format(**str_template_vars)
        except KeyError as e:
            logger.debug("Missing template var for %s: %s", service, e)
            return CatalogEntry(
                service=service,
                dimensions=dimensions,
                file_count=0,
            )

        # Check GCS
        gcs_path = f"gs://{bucket}/{path}"  # noqa: gs-uri — catalog builds GCS path for data existence check

        if gcs_config.get("list_prefix"):
            # Count files in prefix
            files = self.cloud_client.list_files(gcs_path, "*.parquet")
            file_count = len(files)
        else:
            # Check single file exists
            exists = self.cloud_client.file_exists(gcs_path)
            file_count = 1 if exists else 0
            files = [gcs_path] if exists else []

        return CatalogEntry(
            service=service,
            dimensions=dimensions,
            file_count=file_count,
            files=files if include_files else [],
        )

    def catalog_all_services(
        self,
        start_date: date,
        end_date: date,
        services: list[str] | None = None,
        **filters: object,
    ) -> dict[str, ServiceCatalog]:
        """
        Generate catalogs for all services.

        Args:
            start_date: Start of date range
            end_date: End of date range
            services: Optional list of services (default: all)
            **filters: Dimension filters

        Returns:
            Dict mapping service names to their catalogs
        """
        if services is None:
            services = self.config_loader.list_available_services()

        catalogs: dict[str, ServiceCatalog] = {}
        dimension_filters: dict[str, object] = {
            k: v for k, v in filters.items() if k != "include_files"
        }
        include_files: bool = bool(filters.get("include_files", False))
        for service in services:
            try:
                catalog = self.catalog_service(
                    service, start_date, end_date, include_files=include_files, **dimension_filters
                )
                catalogs[service] = catalog
            except FileNotFoundError as e:
                logger.error("Configuration file not found for %s: %s", service, e)
            except ConnectionError as e:
                logger.error("Cloud storage connection failed for %s: %s", service, e)
            except ValueError as e:
                logger.error("Invalid configuration or parameters for %s: %s", service, e)
            except KeyError as e:
                logger.error("Missing required configuration key for %s: %s", service, e)
            except OSError as e:
                logger.error("File system error while cataloging %s: %s", service, e)
            except RuntimeError as e:
                logger.exception("Error cataloging %s: %s", service, e)

        return catalogs

    def generate_report(
        self,
        catalogs: dict[str, ServiceCatalog],
        output_format: str = "table",
    ) -> str:
        """
        Generate a human-readable report from catalogs.

        Args:
            catalogs: Service catalogs
            output_format: "table" or "json"

        Returns:
            Formatted report string
        """
        if output_format == "json":
            return json.dumps(
                {name: cat.to_dict() for name, cat in catalogs.items()},
                indent=2,
            )

        # Table format
        lines: list[str] = []
        lines.append("=" * 60)
        lines.append("DATA CATALOG REPORT")
        lines.append("=" * 60)

        for service, catalog in catalogs.items():
            lines.append(f"\n{service}")
            lines.append("-" * len(service))
            lines.append(f"Date Range: {catalog.start_date} to {catalog.end_date}")
            lines.append(
                f"Completion: {catalog.overall_completion:.1f}%"
                f" ({catalog.complete_entries}/{catalog.total_entries})"
            )

            # Show breakdown by first dimension
            if catalog.entries:
                first_dim = next(iter(catalog.entries[0].dimensions.keys()))
                breakdown = catalog.get_breakdown_by_dimension(first_dim)

                if breakdown:
                    lines.append(f"\nBreakdown by {first_dim}:")
                    for dim_val, counts in sorted(breakdown.items()):
                        pct = (
                            (counts["complete"] / counts["total"] * 100)
                            if counts["total"] > 0
                            else 0
                        )
                        lines.append(
                            f"  {dim_val}: {pct:.1f}% ({counts['complete']}/{counts['total']})"
                        )

        lines.append("\n" + "=" * 60)

        return "\n".join(lines)

    # ── Instrument search ──────────────────────────────────────────────────

    def search_instruments(self, service: str, query: str) -> list[str]:
        """
        Search for instruments under a service's data path in GCS.

        Performs a prefix listing using the service's bucket template and returns
        paths/names that contain the query string (case-insensitive).

        Args:
            service: Service name (used to resolve the GCS bucket prefix).
            query: Search term (matched against path segment, case-insensitive).

        Returns:
            List of matching instrument identifiers (up to 200 results).
        """
        gcs_config = SERVICE_GCS_CONFIGS.get(service)
        if not gcs_config or not gcs_config.get("bucket_template"):
            logger.debug("search_instruments: no GCS config for %s", service)
            return []

        try:
            bucket_template = str(gcs_config["bucket_template"])
            # Use a neutral template fill for listing (category=cefi as fallback)
            bucket = bucket_template.format(
                category_lower="cefi",
                project_id=self.project_id,
            )
            prefix = "instrument_availability/"
            all_files = self.cloud_client.list_files(f"gs://{bucket}/{prefix}", "*")  # noqa: gs-uri — catalog builds GCS path for instrument availability scan
        except (OSError, ValueError, RuntimeError, KeyError) as exc:
            logger.debug("search_instruments: GCS error for %s: %s", service, exc)
            return []

        query_lower = query.lower()
        results: list[str] = []
        for path in all_files:
            # Extract the last path segment as the instrument identifier
            segment = path.rstrip("/").split("/")[-1]
            if query_lower in segment.lower() or query_lower in path.lower():
                results.append(segment)
            if len(results) >= 200:
                break
        return sorted(set(results))

    # ── Execution data status ──────────────────────────────────────────────

    def get_execution_data_status(
        self,
        service: str = "execution-service",
    ) -> list["ExecutionConfigStatus"]:
        """
        Return config-based data status for execution-service or strategy-service.

        Instead of a date-heatmap view (used by batch services), execution services
        are partitioned by *config file* (strategy + mode + timeframe + algo).

        Lists config files from the service's GCS results bucket and summarises
        which dates have results vs which are missing.

        Args:
            service: Service name (default "execution-service").

        Returns:
            List of ExecutionConfigStatus, one per config file found.
        """
        # Execution services store results under: execution-results-{project_id}/
        bucket_name = f"execution-results-{self.project_id}"
        prefix = f"{service}/"

        try:
            all_files = self.cloud_client.list_files(f"gs://{bucket_name}/{prefix}", "*.parquet")  # noqa: gs-uri — catalog builds GCS path for execution data scan
        except (OSError, ValueError, RuntimeError) as exc:
            logger.debug("get_execution_data_status: GCS error for %s: %s", service, exc)
            return []

        # Group files by config path (strip date segment at the end)
        config_dates: dict[str, list[str]] = {}
        for path in all_files:
            parts = path.split("/")
            # Expected: execution-service/config_path.../day=YYYY-MM-DD/file.parquet
            day_part = next((p for p in parts if p.startswith("day=")), None)
            if day_part:
                date_str = day_part.replace("day=", "")
                day_idx = parts.index(day_part)
                config_key = "/".join(parts[1:day_idx])  # strip bucket name + day= suffix
                config_dates.setdefault(config_key, []).append(date_str)

        return [
            ExecutionConfigStatus(
                config_path=config_key,
                present_dates=sorted(dates),
            )
            for config_key, dates in sorted(config_dates.items())
        ]
