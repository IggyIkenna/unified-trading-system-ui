"""
Configuration validation logic.

This module handles validation of configuration files to ensure
they have the correct structure and required fields.
"""

import logging
from typing import cast

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when configuration validation fails."""

    pass


class ValidationUtils:
    """Utility functions for validating configuration values."""

    @staticmethod
    def get_required(config: dict[str, object], key: str, context: str = "") -> object:
        """Get a required value from config, raising an exception if missing or empty."""
        if key not in config:
            context_msg = f" in {context}" if context else ""
            raise ConfigurationError(f"Missing required configuration key '{key}'{context_msg}")

        value = config[key]
        if value is None or (isinstance(value, str) and value.strip() == ""):
            context_msg = f" in {context}" if context else ""
            raise ConfigurationError(f"Configuration key '{key}'{context_msg} cannot be empty")

        return value

    @staticmethod
    def get_with_default(
        config: dict[str, object], key: str, default: object, context: str = ""
    ) -> object:
        """Get a value from config with a sensible non-empty default."""
        value = config.get(key)
        if value is None or (isinstance(value, str) and value.strip() == ""):
            if isinstance(default, str) and default == "":
                context_msg = f" in {context}" if context else ""
                logger.warning(
                    "Using empty string default for '%s'%s"
                    " - consider using ValidationUtils.get_required() instead",
                    key,
                    context_msg,
                )
            return default

        return value


class ConfigValidator:
    """Validates configuration files for correctness."""

    @staticmethod
    def validate_venues_config(config: dict[str, object]) -> None:
        """Validate venues configuration structure."""
        if "categories" not in config:
            raise ValueError("venues.yaml must have 'categories' key")

        for category, category_config in config["categories"].items():
            if "venues" not in category_config:
                raise ValueError(f"Category {category} must have 'venues' list")
            if not isinstance(category_config["venues"], list):
                raise ValueError(f"Category {category} 'venues' must be a list")

    @staticmethod
    def validate_service_config(config: dict[str, object], service: str) -> None:
        """Validate service sharding configuration."""
        required_keys = ["service", "dimensions"]

        for key in required_keys:
            if key not in config:
                raise ValueError(f"Service config for {service} missing required key: {key}")

        if config["service"] != service:
            raise ValueError(
                f"Service name mismatch: config says '{config['service']}'"
                f" but loaded as '{service}'"
            )

        ConfigValidator._validate_dimensions(
            cast(list[dict[str, object]], config["dimensions"]), service
        )

    @staticmethod
    def _validate_dimensions(dimensions: list[dict[str, object]], service: str) -> None:
        """Validate dimension configurations."""
        for i, dim in enumerate(dimensions):
            if "name" not in dim:
                raise ValueError(f"Dimension {i} in {service} config missing 'name'")
            if "type" not in dim:
                raise ValueError(f"Dimension '{dim['name']}' in {service} config missing 'type'")

            dim_type = dim["type"]
            valid_types = [
                "fixed",
                "hierarchical",
                "date_range",
                "gcs_dynamic",
                "monthly_rolling",
            ]

            if dim_type not in valid_types:
                raise ValueError(
                    f"Dimension '{dim['name']}' has invalid type '{dim_type}'."
                    f" Valid types: {valid_types}"
                )

            ConfigValidator._validate_dimension_type(dim, service)

    @staticmethod
    def _validate_dimension_type(dim: dict[str, object], service: str) -> None:
        """Validate specific dimension type requirements."""
        dim_type = dim["type"]
        dim_name = dim["name"]

        if dim_type == "fixed" and "values" not in dim:
            raise ValueError(f"Fixed dimension '{dim_name}' must have 'values' list")

        if dim_type == "hierarchical" and "parent" not in dim:
            raise ValueError(f"Hierarchical dimension '{dim_name}' must have 'parent'")

        if dim_type == "date_range":
            granularity = dim.get("granularity", "daily")
            valid_granularities = ["daily", "weekly", "monthly", "none"]
            if granularity not in valid_granularities:
                raise ValueError(
                    f"Dimension '{dim_name}' has invalid granularity '{granularity}'."
                    f" Valid: {valid_granularities}"
                )

    @staticmethod
    def validate_cloud_providers_config(config: dict[str, object]) -> None:
        """Validate cloud providers configuration."""
        for provider in ["gcp", "aws"]:
            if provider in config:
                provider_config = config[provider]
                if not isinstance(provider_config, dict):
                    raise ValueError(f"Provider '{provider}' config must be a dictionary")

                if "container_registry" in provider_config:
                    registry = provider_config["container_registry"]
                    if "url_pattern" not in registry:
                        logger.warning(
                            "Provider '%s' container registry missing url_pattern", provider
                        )

    @staticmethod
    def validate_expected_start_dates_config(config: dict[str, object]) -> None:
        """Validate expected start dates configuration."""
        for service, service_config in config.items():
            if not isinstance(service_config, dict):
                logger.warning(
                    "Service '%s' in expected_start_dates.yaml should be a dict", service
                )
                continue

            for category, category_config in service_config.items():
                if not isinstance(category_config, dict):
                    continue

                if "category_start" in category_config:
                    date_str = category_config["category_start"]
                    if not ConfigValidator._is_valid_date_string(date_str):
                        logger.warning(
                            "Invalid date format in %s.%s.category_start: %s",
                            service,
                            category,
                            date_str,
                        )

                venues = category_config.get("venues") or {}
                if isinstance(venues, dict):
                    for venue, venue_date in venues.items():
                        if not ConfigValidator._is_valid_date_string(venue_date):
                            logger.warning(
                                "Invalid date format in %s.%s.venues.%s: %s",
                                service,
                                category,
                                venue,
                                venue_date,
                            )

    @staticmethod
    def _is_valid_date_string(date_str: str) -> bool:
        """Check if a string is a valid ISO date format (YYYY-MM-DD)."""
        if len(date_str) != 10:
            return False

        try:
            year, month, day = date_str.split("-")
            return (
                year.isdigit()
                and len(year) == 4
                and month.isdigit()
                and 1 <= int(month) <= 12
                and day.isdigit()
                and 1 <= int(day) <= 31
            )
        except (ValueError, AttributeError) as e:
            logger.warning("Invalid date format %r: %s", date_str, e)
            return False
