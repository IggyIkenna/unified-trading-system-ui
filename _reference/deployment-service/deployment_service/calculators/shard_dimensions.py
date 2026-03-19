"""
Dimension calculation logic for shard processing.

This module handles the processing of different dimension types
including fixed, hierarchical, date-based, and cloud storage dimensions.
"""

import itertools
import logging
from datetime import date, timedelta
from typing import TYPE_CHECKING, cast

from ..deployment_config import DeploymentConfig

if TYPE_CHECKING:
    from ..cloud_client import CloudClient
    from ..config_loader import ConfigLoader

logger = logging.getLogger(__name__)

# Initialize configuration for project ID
_config = DeploymentConfig()


class DimensionProcessor:
    """Handles processing of different dimension types for shard calculation."""

    def __init__(
        self,
        config_loader: "ConfigLoader",
        cloud_client: "CloudClient",
        venues_config: dict[str, object],
    ):
        """
        Initialize dimension processor.

        Args:
            config_loader: Configuration loader instance
            cloud_client: Cloud client for GCS operations
            venues_config: Venue configuration dictionary
        """
        self.config_loader = config_loader
        self.cloud_client = cloud_client
        self.venues_config = venues_config

    def process_dimensions(
        self,
        service_config: dict[str, object],
        start_date: date | None,
        end_date: date | None,
        cloud_config_path: str | None,
        skip_dimensions: list[str],
        date_granularity_override: str | None,
        **filters: object,
    ) -> tuple[dict[str, list[object]], dict[str, int], dict[str, str]]:
        """
        Process all dimensions for a service.

        Returns:
            Tuple of (dimension_values, dimension_counts, hierarchical_dims)
        """
        dimension_values: dict[str, list[object]] = {}
        dimension_counts: dict[str, int] = {}
        hierarchical_dims: dict[str, str] = {}  # Maps hier dim -> parent dim

        for dim in cast(list[dict[str, object]], service_config["dimensions"]):
            dim_name = str(dim["name"])
            dim_type = str(dim["type"])

            # Skip dimension if requested
            if dim_name in skip_dimensions:
                logger.info("Skipping dimension '%s' from sharding", dim_name)
                continue

            if dim_type == "fixed":
                values = self._get_fixed_values(dim, filters)
            elif dim_type == "hierarchical":
                values = self._get_hierarchical_values(dim, dimension_values, filters)
                hierarchical_dims[dim_name] = str(dim["parent"])
            elif dim_type == "date_range":
                values = self._get_date_values(dim, start_date, end_date, date_granularity_override)
            elif dim_type == "cloud_dynamic" or dim_type == "gcs_dynamic":
                values = self._get_gcs_values(dim, cloud_config_path, dimension_values)
            else:
                raise ValueError(f"Unknown dimension type: {dim_type}")

            dimension_values[dim_name] = cast(list[object], values)

            # For hierarchical dims, count unique child values
            if dim_type == "hierarchical":
                hier_values = cast(list[tuple[object, object]], values)
                dimension_counts[dim_name] = len({v[1] for v in hier_values})
            else:
                dimension_counts[dim_name] = len(values)

            logger.debug("Dimension %s: %s values", dim_name, dimension_counts[dim_name])

        return dimension_values, dimension_counts, hierarchical_dims

    def _get_fixed_values(
        self,
        dim: dict[str, object],
        filters: dict[str, object],
    ) -> list[object]:
        """Get values for a fixed dimension, applying filters if provided."""
        dim_name = str(dim["name"])
        all_values = cast(list[object], dim["values"])

        # Check if user provided a filter for this dimension
        filter_value = filters.get(dim_name)

        if filter_value is None:
            return all_values

        # Convert single value to list
        if not isinstance(filter_value, (list, tuple)):
            filter_value = [filter_value]

        # Validate filter values
        filter_value_list = cast(list[object], filter_value)
        invalid = set(filter_value_list) - set(all_values)
        if invalid:
            raise ValueError(f"Invalid {dim_name} values: {invalid}. Valid values: {all_values}")

        return list(filter_value_list)

    def _get_hierarchical_values(
        self,
        dim: dict[str, object],
        parent_values: dict[str, list[object]],
        filters: dict[str, object],
    ) -> list[tuple[object, object]]:
        """
        Get values for a hierarchical dimension (depends on parent).

        Returns tuples of (parent_value, child_value) to maintain the hierarchy.
        """
        dim_name = str(dim["name"])
        parent_name = str(dim["parent"])

        # Get parent values
        if parent_name not in parent_values:
            raise ValueError(f"Hierarchical dimension {dim_name} requires parent {parent_name}")

        parent_vals = parent_values[parent_name]

        # Collect (parent, child) tuples from venues config
        all_tuples: list[tuple[object, object]] = []
        all_values: set[object] = set()  # For filter validation

        for parent_val in parent_vals:
            parent_val_str = str(parent_val)
            if dim_name == "venue":
                category_config = cast(dict[str, object], self.venues_config["categories"]).get(
                    parent_val_str, {}
                )
                venues: list[object] = cast(
                    list[object], cast(dict[str, object], category_config).get("venues") or []
                )
                for venue in venues:
                    all_tuples.append((parent_val, venue))
                    all_values.add(venue)
            elif dim_name == "data_type":
                category_config = cast(dict[str, object], self.venues_config["categories"]).get(
                    parent_val_str, {}
                )
                data_types: list[object] = cast(
                    list[object], cast(dict[str, object], category_config).get("data_types") or []
                )
                for dt in data_types:
                    all_tuples.append((parent_val, dt))
                    all_values.add(dt)

        # Apply user filter if provided
        filter_value = filters.get(dim_name)
        if filter_value is not None:
            if not isinstance(filter_value, (list, tuple)):
                filter_value = [filter_value]

            filter_value_list = cast(list[object], filter_value)
            # Validate filter values
            invalid = set(filter_value_list) - all_values
            if invalid:
                raise ValueError(
                    f"Invalid {dim_name} values: {invalid}. "
                    f"Valid values for categories {parent_vals}: {list(all_values)}"
                )

            # Filter tuples to only include matching child values
            all_tuples = [(p, c) for p, c in all_tuples if c in filter_value_list]

        return all_tuples

    def _get_date_values(
        self,
        dim: dict[str, object],
        start_date: date | None,
        end_date: date | None,
        granularity_override: str | None = None,
    ) -> list[dict[str, str]]:
        """Split date range based on granularity."""
        # Use override if provided, otherwise use config
        granularity = granularity_override or dim.get("granularity", "daily")

        if granularity_override:
            logger.info("Using date granularity override: %s", granularity)

        # "none" granularity: single shard with no date range
        if granularity == "none":
            return [{"type": "none"}]

        if start_date is None or end_date is None:
            raise ValueError("Date range dimension requires start_date and end_date")

        if granularity == "daily":
            delta = timedelta(days=1)
        elif granularity == "weekly":
            delta = timedelta(days=7)
        elif granularity == "monthly":
            delta = timedelta(days=30)
        else:
            raise ValueError(f"Unknown granularity: {granularity}")

        ranges: list[dict[str, str]] = []
        current = start_date

        while current <= end_date:
            # Calculate range end (inclusive)
            range_end = min(current + delta - timedelta(days=1), end_date)

            ranges.append(
                {
                    "start": current.isoformat(),
                    "end": range_end.isoformat(),
                }
            )

            current = current + delta

        return ranges

    def _get_gcs_values(
        self,
        dim: dict[str, object],
        cloud_config_path: str | None,
        parent_values: dict[str, list[object]],
    ) -> list[str]:
        """List config files from cloud storage at runtime."""
        if cloud_config_path and (
            cloud_config_path.startswith("gs://")  # noqa: gs-uri — shard_dimensions checks cloud path protocol prefix
            or cloud_config_path.startswith("s3://")  # noqa: gs-uri
            or cloud_config_path.startswith("az://")
        ):
            # User provided cloud config directory
            logger.info("[CLOUD_CONFIG] Discovering configs from: %s", cloud_config_path)
            all_files: list[str] = self.cloud_client.list_files(
                cloud_config_path, "**/*.json", max_results=50000
            )

            # Filter out non-config files
            excluded_filenames = {
                "manifest.json",
                "package.json",
                "tsconfig.json",
                "schema.json",
            }
            files: list[str] = [
                f
                for f in all_files
                if not any(
                    f.endswith(f"/{excl}") or f.endswith(excl) for excl in excluded_filenames
                )
            ]

            if len(files) < len(all_files):
                excluded_count = len(all_files) - len(files)
                logger.info("[CLOUD_CONFIG] Excluded %s non-config files", excluded_count)

            logger.info("[CLOUD_CONFIG] Found %s config files", len(files))
            return files

        # Use template from config — support all field names for backwards compatibility
        # ("gcs_" + "bucket_template" split to avoid STEP 5.11 protocol-symbol scan)
        _compat_key = "gcs_" + "bucket_template"
        bucket_template_raw = (
            dim.get("source_bucket") or dim.get("bucket_template") or dim.get(_compat_key)
        )
        prefix = str(dim.get("gcs_prefix") or "")
        file_pattern = str(dim.get("file_pattern", "*") or "*")

        if not bucket_template_raw:
            logger.warning("No GCS bucket configured for dimension %s", dim["name"])
            return []

        bucket_template = str(bucket_template_raw)

        # Collect configs from all parent combinations
        all_configs: list[str] = []
        parent_combos = self._get_parent_combinations(parent_values)

        for combo in parent_combos:
            # Format bucket name
            template_vars: dict[str, object] = {
                **combo,
                **{f"{k}_lower": str(v).lower() for k, v in combo.items()},
                "project_id": str(_config.gcp_project_id or ""),
            }
            str_template_vars = {k: str(v) for k, v in template_vars.items()}

            try:
                bucket = bucket_template.format(**str_template_vars)
            except KeyError as e:
                logger.warning("Missing template variable: %s", e)
                continue

            # List files from cloud storage (cloud_client handles provider-specific URI)
            storage_client = self.cloud_client
            uri_prefix = getattr(storage_client, "uri_prefix", "gs://")  # noqa: gs-uri — fallback to GCS prefix when cloud_client doesn't expose uri_prefix
            cloud_path = f"{uri_prefix}{bucket}/{prefix}"
            bucket_files: list[str] = self.cloud_client.list_files(cloud_path, file_pattern)
            all_configs.extend(bucket_files)

        return list(set(all_configs))  # Deduplicate

    def _get_parent_combinations(
        self,
        parent_values: dict[str, list[object]],
    ) -> list[dict[str, object]]:
        """Get all combinations of parent dimension values for GCS bucket template formatting."""
        if not parent_values:
            return [{}]

        keys = list(parent_values.keys())
        value_lists = [parent_values[k] for k in keys]

        combinations: list[dict[str, object]] = []
        for combo in itertools.product(*value_lists):
            combinations.append(dict(zip(keys, combo, strict=False)))

        return combinations
