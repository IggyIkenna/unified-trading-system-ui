"""Calculation CLI module for shard calculations and resource planning."""

import logging
from datetime import UTC, datetime
from typing import cast

from deployment_service.cli_modules.base import BaseCLI
from deployment_service.shard_builder import build_shard_args, build_shard_id
from deployment_service.shard_calculator import ShardCalculator, ShardLimitExceeded

logger = logging.getLogger(__name__)


class CalculationCLI(BaseCLI):
    """Handle shard calculation and resource planning operations."""

    def __init__(self):
        """Initialize calculation CLI."""
        super().__init__()
        self.calculator = None

    def calculate_shards(
        self,
        service: str,
        start_date: str | None = None,
        end_date: str | None = None,
        category: str | None = None,
        max_shards: int = 100,
        output_format: str = "json",
    ) -> dict[str, object]:
        """Calculate shards for a service.

        Args:
            service: Service name
            start_date: Start date for calculation
            end_date: End date for calculation
            category: Category filter (CEFI, TRADFI, DEFI)
            max_shards: Maximum number of shards
            output_format: Output format (json, table, summary)

        Returns:
            Shard calculation results
        """
        logger.info("Calculating shards for %s", service)

        # Load service configuration
        config = self.load_config(service)
        if not config:
            logger.error("Failed to load configuration for %s", service)
            return {}

        # Initialize calculator
        self.calculator = ShardCalculator(str(self.config_dir))

        # Prepare calculation parameters
        params = self._prepare_calculation_params(start_date, end_date, category, max_shards)

        try:
            # Perform calculation
            shards = self.calculator.calculate_shards(service=service)

            # Format results
            results = self._format_shard_results(service, list(shards), params, output_format)

            return results

        except ShardLimitExceeded as e:
            logger.error("Shard limit exceeded: %s", e)
            return {"error": "Shard limit exceeded", "message": str(e), "max_shards": max_shards}

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to calculate shards: %s", e)
            return {"error": str(e)}

    def calculate_resources(
        self, service: str, shard_count: int | None = None, environment: str = "production"
    ) -> dict[str, object]:
        """Calculate resource requirements for a service.

        Args:
            service: Service name
            shard_count: Number of shards (auto-calculate if None)
            environment: Target environment

        Returns:
            Resource requirements
        """
        logger.info("Calculating resources for %s", service)

        # Load configuration
        config = self.load_config(service)
        if not config:
            return {}

        # Calculate shards if not provided
        if shard_count is None:
            shard_results = self.calculate_shards(service)
            shard_count = len(cast(list[object], shard_results.get("shards") or []))

        # Calculate resources
        resources = self._calculate_resource_requirements(config, shard_count, environment)

        return resources

    def optimize_shards(
        self,
        service: str,
        target_metric: str = "cost",
        constraints: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """Optimize shard configuration for a service.

        Args:
            service: Service name
            target_metric: Optimization target (cost, performance, balance)
            constraints: Optimization constraints

        Returns:
            Optimized shard configuration
        """
        logger.info("Optimizing shards for %s targeting %s", service, target_metric)

        config = self.load_config(service)
        if not config:
            return {}

        constraints = constraints or {}

        # Perform optimization
        optimized = self._run_shard_optimization(config, target_metric, constraints)

        return optimized

    def _prepare_calculation_params(
        self, start_date: str | None, end_date: str | None, category: str | None, max_shards: int
    ) -> dict[str, object]:
        """Prepare parameters for shard calculation.

        Args:
            start_date: Start date
            end_date: End date
            category: Category filter
            max_shards: Maximum shards

        Returns:
            Calculation parameters
        """
        params: dict[str, object] = {"limit": max_shards}

        if start_date:
            params["start_date"] = start_date
        if end_date:
            params["end_date"] = end_date
        if category:
            params["category"] = category

        return params

    def _format_shard_results(
        self, service: str, shards: list[object], params: dict[str, object], output_format: str
    ) -> dict[str, object]:
        """Format shard calculation results.

        Args:
            service: Service name
            shards: List of shard configurations
            params: Calculation parameters
            output_format: Output format

        Returns:
            Formatted results
        """
        shards_list: list[object] = []
        results: dict[str, object] = {
            "service": service,
            "timestamp": datetime.now(UTC).isoformat(),
            "parameters": params,
            "shard_count": len(shards),
            "shards": shards_list,
        }

        # Build a minimal service config for shard builder (no mapping = use defaults)
        service_config: dict[str, object] = {}

        if output_format == "summary":
            # Just include summary statistics
            shard_dicts = [
                cast(dict[str, object], s) if isinstance(s, dict) else {} for s in shards
            ]
            results["summary"] = self._calculate_shard_summary(shard_dicts)

        elif output_format == "table":
            # Format as table-friendly structure
            shard_dicts = [
                cast(dict[str, object], s) if isinstance(s, dict) else {} for s in shards
            ]
            results["shards"] = self._format_shards_as_table(shard_dicts)

        else:  # json (default)
            # Include full shard details
            for i, shard in enumerate(shards):
                shard_info: dict[str, object] = {
                    "index": i,
                    "id": build_shard_id(shard, i),
                    "args": build_shard_args(shard, service_config),
                    "config": shard,
                }
                shards_list.append(shard_info)

        return results

    def _calculate_shard_summary(self, shards: list[dict[str, object]]) -> dict[str, object]:
        """Calculate summary statistics for shards.

        Args:
            shards: List of shard configurations

        Returns:
            Summary statistics
        """
        if not shards:
            return {}

        # Calculate various statistics
        date_ranges: list[dict[str, object]] = [
            cast(dict[str, object], s.get("date_range") or {}) for s in shards
        ]
        categories: list[object] = [s.get("category", "unknown") for s in shards]

        category_distribution: dict[str, object] = {}
        summary: dict[str, object] = {
            "total_shards": len(shards),
            "categories": list(set(str(c) for c in categories)),
            "category_distribution": category_distribution,
            "date_coverage": {
                "earliest": min(
                    (str(dr.get("start") or "") for dr in date_ranges if dr.get("start")),
                    default="",
                ),
                "latest": max(
                    (str(dr.get("end") or "") for dr in date_ranges if dr.get("end")),
                    default="",
                ),
            },
        }

        # Calculate category distribution
        str_categories = [str(c) for c in categories]
        for category in set(str_categories):
            count = str_categories.count(category)
            category_distribution[category] = {
                "count": count,
                "percentage": f"{(count / len(shards)) * 100:.1f}%",
            }

        return summary

    def _format_shards_as_table(self, shards: list[dict[str, object]]) -> list[dict[str, object]]:
        """Format shards for table display.

        Args:
            shards: List of shard configurations

        Returns:
            Table-formatted shard data
        """
        table_data: list[dict[str, object]] = []

        for i, shard in enumerate(shards):
            date_range = cast(dict[str, object], shard.get("date_range") or {})
            venues_raw: object = shard.get("venues")
            instruments_raw: object = shard.get("instruments")
            row: dict[str, object] = {
                "index": i,
                "id": build_shard_id(shard, i),
                "category": str(shard.get("category") or "N/A"),
                "date_start": str(date_range.get("start") or "N/A"),
                "date_end": str(date_range.get("end") or "N/A"),
                "venues": len(cast(list[object], venues_raw))
                if isinstance(venues_raw, list)
                else 0,
                "instruments": len(cast(list[object], instruments_raw))
                if isinstance(instruments_raw, list)
                else 0,
            }
            table_data.append(row)

        return table_data

    def _calculate_resource_requirements(
        self, config: dict[str, object], shard_count: int, environment: str
    ) -> dict[str, object]:
        """Calculate resource requirements.

        Args:
            config: Service configuration
            shard_count: Number of shards
            environment: Target environment

        Returns:
            Resource requirements
        """
        # Base resource requirements from config
        base_resources = cast(dict[str, object], config.get("resources") or {})

        # Environment multipliers
        env_multipliers = {"production": 1.0, "staging": 0.5, "dev": 0.25, "test": 0.1}

        multiplier = env_multipliers.get(environment, 1.0)

        cpu = float(cast(float, base_resources.get("cpu") or 1))
        memory = float(cast(float, base_resources.get("memory") or 2))
        storage = float(cast(float, base_resources.get("storage") or 10))

        # Calculate total resources
        resources: dict[str, object] = {
            "environment": environment,
            "shard_count": shard_count,
            "total_resources": {
                "cpu": f"{shard_count * cpu * multiplier:.1f} cores",
                "memory": f"{shard_count * memory * multiplier:.1f} GB",
                "storage": f"{shard_count * storage * multiplier:.1f} GB",
            },
            "per_shard": {
                "cpu": f"{cpu * multiplier:.1f} cores",
                "memory": f"{memory * multiplier:.1f} GB",
                "storage": f"{storage * multiplier:.1f} GB",
            },
            "estimated_cost": {
                "hourly": f"${shard_count * 0.15 * multiplier:.2f}",
                "daily": f"${shard_count * 0.15 * 24 * multiplier:.2f}",
                "monthly": f"${shard_count * 0.15 * 24 * 30 * multiplier:.2f}",
            },
        }

        return resources

    def _run_shard_optimization(
        self, config: dict[str, object], target_metric: str, constraints: dict[str, object]
    ) -> dict[str, object]:
        """Run shard optimization.

        Args:
            config: Service configuration
            target_metric: Optimization target
            constraints: Optimization constraints

        Returns:
            Optimization results
        """
        # This would implement actual optimization logic
        # For now, return a simple optimization result

        optimization_result = {
            "target_metric": target_metric,
            "constraints": constraints,
            "original_shards": config.get("max_shards", 100),
            "optimized_shards": 75,  # Example optimized value
            "improvements": {
                "cost_reduction": "25%",
                "performance_gain": "15%",
                "resource_efficiency": "30%",
            },
            "recommendations": [
                "Consolidate low-volume shards",
                "Use larger instance types for high-throughput shards",
                "Enable auto-scaling for variable workloads",
            ],
        }

        return optimization_result
