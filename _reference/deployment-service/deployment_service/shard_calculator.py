"""
Shard Calculator - Core logic for calculating deployment shards

This module calculates all possible shard combinations for a given service
based on its sharding configuration, validates against max_shards cap,
and generates CLI commands for each shard.
"""

import logging
from datetime import date
from typing import cast

from .calculators.base_calculator import Shard, ShardLimitExceeded
from .calculators.shard_dimensions import DimensionProcessor
from .calculators.shard_distribution import CombinationCalculator
from .cloud_client import CloudClient
from .config_loader import ConfigLoader

logger = logging.getLogger(__name__)


class ShardCalculator:
    """
    Calculates deployment shards for services based on configuration.

    Handles:
    - Fixed dimensions (category, feature_group, etc.)
    - Hierarchical dimensions (venue depends on category)
    - Date range dimensions (daily, weekly, monthly granularity)
    - Dynamic GCS dimensions (config files listed at runtime)
    """

    def __init__(self, config_dir: str = "configs"):
        """
        Initialize the shard calculator.

        Args:
            config_dir: Path to directory containing sharding configs
        """
        self.config_loader = ConfigLoader(config_dir)
        self.cloud_client = CloudClient()
        self.venues_config = self.config_loader.load_venues_config()

        # Initialize processors
        self.dimension_processor = DimensionProcessor(
            self.config_loader, self.cloud_client, self.venues_config
        )
        self.combination_calculator = CombinationCalculator(self.config_loader, self.cloud_client)

    def calculate_shards(
        self,
        service: str,
        start_date: date | None = None,
        end_date: date | None = None,
        max_shards: int = 10000,
        cloud_config_path: str | None = None,
        respect_start_dates: bool = True,
        skip_existing: bool = False,
        skip_dimensions: list[str] | None = None,
        date_granularity_override: str | None = None,
        **filters: object,
    ) -> list[Shard]:
        """
        Calculate all possible shards for a service.

        Args:
            service: Service name (e.g., "instruments-service")
            start_date: Start date for date-based sharding
            end_date: End date for date-based sharding
            max_shards: Maximum allowed shards (error if exceeded)
            cloud_config_path: Cloud storage path for dynamic config discovery
            respect_start_dates: Filter out shards before venue start dates
            skip_existing: Filter out shards where data already exists
            skip_dimensions: Dimension names to skip from sharding
            date_granularity_override: Override date granularity from config
            **filters: Additional filters (category, venue, etc.)

        Returns:
            List of Shard objects

        Raises:
            ShardLimitExceeded: If combinations exceed max_shards
            ValueError: If required parameters are missing
        """
        # Load service config
        service_config = self.config_loader.load_service_config(service)
        skip_dimensions = skip_dimensions or []

        # Build dimension values
        dimension_values: dict[str, list[object]]
        dimension_counts: dict[str, int]
        hierarchical_dims: dict[str, str]
        dimension_values, dimension_counts, hierarchical_dims = (
            self.dimension_processor.process_dimensions(
                service_config,
                start_date,
                end_date,
                cloud_config_path,
                skip_dimensions,
                date_granularity_override,
                **filters,
            )
        )

        # Calculate all valid combinations
        combinations: list[dict[str, object]] = self.combination_calculator.calculate_combinations(
            dimension_values, hierarchical_dims
        )

        # Apply filtering strategies
        combinations = self._apply_filters(
            combinations, service, respect_start_dates, skip_existing
        )

        total_shards = len(combinations)
        logger.info("Service %s: %s total shards", service, total_shards)

        # Check shard limit
        if total_shards > max_shards:
            raise ShardLimitExceeded(
                total_shards=total_shards,
                max_shards=max_shards,
                service=service,
                breakdown=dimension_counts,
            )

        # Create Shard objects
        shards: list[Shard] = []
        cli_args_config: dict[str, str] = cast(dict[str, str], service_config.get("cli_args") or {})
        for i, combo in enumerate(combinations):
            shard = Shard(
                service=service,
                shard_index=i,
                total_shards=total_shards,
                dimensions=combo,
                cli_args_config=cli_args_config,
            )
            shards.append(shard)

        return shards

    def _apply_filters(
        self,
        combinations: list[dict[str, object]],
        service: str,
        respect_start_dates: bool,
        skip_existing: bool,
    ) -> list[dict[str, object]]:
        """Apply various filtering strategies to combinations."""
        # Filter by venue start dates if requested
        if respect_start_dates:
            original_count: int = len(combinations)
            combinations = self.combination_calculator.filter_by_start_dates(combinations, service)
            filtered_count: int = original_count - len(combinations)
            if filtered_count > 0:
                logger.info("Filtered %s shards for dates before venue start dates", filtered_count)

        # Filter by Tardis access for market-tick-data-service
        combinations = self.combination_calculator.filter_by_tardis_access(combinations, service)

        # Filter by existing data if requested
        if skip_existing:
            original_count = len(combinations)
            combinations = self.combination_calculator.filter_by_existing_data(
                combinations, service
            )
            filtered_count = original_count - len(combinations)
            if filtered_count > 0:
                logger.info("Filtered %s shards where data already exists", filtered_count)

        return combinations

    def get_shard_summary(self, shards: list[Shard]) -> dict[str, object]:
        """
        Generate a summary of calculated shards.

        Args:
            shards: List of calculated shards

        Returns:
            Summary dict with counts and breakdowns
        """
        if not shards:
            return {"total_shards": 0, "breakdown": {}}

        # Count unique values per dimension
        dimension_values_summary: dict[str, set[object]] = {}
        for shard in shards:
            for dim_name, dim_value in shard.dimensions.items():
                if dim_name not in dimension_values_summary:
                    dimension_values_summary[dim_name] = set()
                # Convert dict to tuple for hashability
                if isinstance(dim_value, dict):
                    dimension_values_summary[dim_name].add(tuple(sorted(dim_value.items())))
                else:
                    dimension_values_summary[dim_name].add(dim_value)

        breakdown: dict[str, int] = {k: len(v) for k, v in dimension_values_summary.items()}

        return {
            "service": shards[0].service,
            "total_shards": len(shards),
            "breakdown": breakdown,
        }


__all__ = ["Shard", "ShardCalculator", "ShardLimitExceeded"]
