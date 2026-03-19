"""
Config Loader for deployment-api.

Loads sharding/service configurations from YAML files in the configs/ directory.
This is a self-contained implementation in deployment-api to remove the cross-service
import boundary with deployment-service. deployment-api must not import
deployment-service as a Python package; interaction is via messaging/APIs/storage.

Configs are read from pm-configs/ (symlink to unified-trading-pm/configs/ in local dev;
real directory populated by cloudbuild before docker build in production).
"""

import logging
import re
from pathlib import Path
from typing import cast

import yaml
from unified_trading_library import get_env_copy

logger = logging.getLogger(__name__)


def substitute_env_vars(value: str) -> str:
    """
    Substitute environment variables in a string.

    Supports patterns:
    - ${VAR_NAME} - required variable
    - ${VAR_NAME:-default} - with default value

    Inlined from deployment-service config_loader.substitute_env_vars to remove
    cross-service import boundary.
    """
    pattern = r"\$\{([^}:]+)(?::-([^}]*))?\}"
    env = get_env_copy()

    def _replace(match: re.Match[str]) -> str:
        var_name = match.group(1)
        default = match.group(2)
        env_value = env.get(var_name)
        if env_value:
            return env_value
        elif default is not None:
            return default
        else:
            logger.warning("Environment variable %s not set and no default", var_name)
            return ""

    return re.sub(pattern, _replace, value)


class ConfigLoader:
    """
    Loads sharding configuration files from the configs/ directory.

    Configuration files expected in YAML format:
    - configs/venues.yaml: Venue-category mappings
    - configs/sharding.{service}.yaml: Service-specific sharding configs
    - configs/cloud-providers.yaml: Cloud provider configurations
    - configs/expected_start_dates.yaml: Expected data start dates
    - configs/dependencies.yaml: Service dependency graph
    """

    def __init__(self, config_dir: str = "configs") -> None:
        """Initialize the config loader."""
        self.config_dir = Path(config_dir)
        self._cache: dict[str, object] = {}

    def _load_yaml_file(self, filename: str, cache_key: str | None = None) -> dict[str, object]:
        """Load a YAML file with caching support."""
        key = cache_key or filename
        if key in self._cache:
            return cast(dict[str, object], self._cache[key])

        config_path = self.config_dir / filename
        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        logger.debug("Loading config from %s", config_path)
        with open(config_path) as f:
            content = cast(dict[str, object], yaml.safe_load(f) or {})

        self._cache[key] = content
        return content

    def _load_optional_yaml_file(
        self,
        filename: str,
        cache_key: str | None = None,
        default: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """Load an optional YAML file that may not exist."""
        try:
            return self._load_yaml_file(filename, cache_key)
        except FileNotFoundError:
            logger.warning(
                "%s not found at %s, using defaults", filename, self.config_dir / filename
            )
            return default or {}

    def load_venues_config(self) -> dict[str, object]:
        """Load the venues configuration file."""
        return self._load_yaml_file("venues.yaml")

    def load_service_config(self, service: str) -> dict[str, object]:
        """Load sharding configuration for a specific service."""
        return self._load_yaml_file(f"sharding.{service}.yaml", service)

    def load_expected_start_dates(self) -> dict[str, object]:
        """Load expected start dates configuration."""
        return self._load_optional_yaml_file("expected_start_dates.yaml")

    def list_available_services(self) -> list[str]:
        """List all services that have sharding configs."""
        services: list[str] = []
        if not self.config_dir.exists():
            return services
        for f in sorted(self.config_dir.glob("sharding.*.yaml")):
            match = re.match(r"sharding\.(.+)\.yaml", f.name)
            if match:
                services.append(match.group(1))
        return services

    def get_compute_recommendation(self, service: str, compute_type: str) -> dict[str, object]:
        """Get compute configuration recommendation for a service."""
        try:
            config = self.load_service_config(service)
        except FileNotFoundError:
            return {}
        compute_configs = cast(dict[str, object], config.get("compute") or {})
        raw: object = compute_configs.get(compute_type) or compute_configs.get("default") or {}
        return cast(dict[str, object], raw) if isinstance(raw, dict) else {}

    def get_scaled_compute_config(
        self,
        service: str,
        compute_type: str,
        max_workers: int | None = None,
        skip_venue: bool = False,
    ) -> dict[str, object]:
        """Get scaled compute configuration for a service."""
        base = self.get_compute_recommendation(service, compute_type)
        if max_workers is not None and isinstance(base.get("max_workers"), int):
            base = dict(base)
            base["max_workers"] = max_workers
        return base

    def clear_cache(self) -> None:
        """Clear the configuration cache."""
        self._cache.clear()
