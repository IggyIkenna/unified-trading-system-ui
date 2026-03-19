"""
Base configuration classes and common functionality.

This module provides the foundational classes and utilities
for configuration loading and management.
"""

import logging
from pathlib import Path
from typing import cast

import yaml

logger = logging.getLogger(__name__)


class BaseConfigLoader:
    """Base class for configuration loading with common functionality."""

    def __init__(self, config_dir: str = "configs"):
        """
        Initialize the base config loader.

        Args:
            config_dir: Path to directory containing configuration files
        """
        self.config_dir = Path(config_dir)
        self._cache: dict[str, object] = {}

    def _load_yaml_file(self, filename: str, cache_key: str | None = None) -> dict[str, object]:
        """
        Load a YAML file with caching support.

        Args:
            filename: Name of the YAML file to load
            cache_key: Key for caching (defaults to filename)

        Returns:
            Loaded YAML content as dictionary

        Raises:
            FileNotFoundError: If the file doesn't exist
            yaml.YAMLError: If the file is not valid YAML
        """
        cache_key = cache_key or filename

        if cache_key in self._cache:
            return cast(dict[str, object], self._cache[cache_key])

        config_path = self.config_dir / filename

        if not config_path.exists():
            raise FileNotFoundError(f"Config file not found: {config_path}")

        logger.debug("Loading config from %s", config_path)

        with open(config_path) as f:
            content = cast(dict[str, object], yaml.safe_load(f) or {})

        self._cache[cache_key] = content
        return content

    def _load_optional_yaml_file(
        self,
        filename: str,
        cache_key: str | None = None,
        default: dict[str, object] | None = None,
    ) -> dict[str, object]:
        """
        Load an optional YAML file that may not exist.

        Args:
            filename: Name of the YAML file to load
            cache_key: Key for caching (defaults to filename)
            default: Default value if file doesn't exist

        Returns:
            Loaded YAML content or default value
        """
        try:
            return self._load_yaml_file(filename, cache_key)
        except FileNotFoundError:
            logger.warning(
                "%s not found at %s, using defaults", filename, self.config_dir / filename
            )
            return default or {}

    def clear_cache(self):
        """Clear the configuration cache."""
        self._cache.clear()

    def get_cache_keys(self) -> list[str]:
        """Get all cached configuration keys."""
        return list(self._cache.keys())
