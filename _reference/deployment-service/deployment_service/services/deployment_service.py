"""Deployment service for handling deployment operations."""

import logging

import click

from ..config_loader import ConfigLoader
from ..shard_calculator import ShardCalculator

logger = logging.getLogger(__name__)


class DeploymentService:
    """Service for handling deployment operations."""

    def __init__(self, config_dir: str | None = None):
        """Initialize deployment service.

        Args:
            config_dir: Path to configuration directory
        """
        self.config_dir = config_dir
        self._config_loader = None
        self._shard_calculator = None

    @property
    def config_loader(self) -> ConfigLoader:
        """Get config loader instance."""
        if self._config_loader is None:
            self._config_loader = ConfigLoader(self.config_dir or "configs")
        return self._config_loader

    @property
    def shard_calculator(self) -> ShardCalculator:
        """Get shard calculator instance."""
        if self._shard_calculator is None:
            self._shard_calculator = ShardCalculator(self.config_dir or "configs")
        return self._shard_calculator

    def validate_service(self, service: str) -> None:
        """Validate service name exists in configs.

        Args:
            service: Service name to validate

        Raises:
            click.ClickException: If service is invalid
        """
        try:
            self.config_loader.load_service_config(service)
        except (OSError, ValueError, RuntimeError) as e:
            raise click.ClickException(f"Invalid service '{service}': {e}") from e

    def get_service_info(self, service: str) -> dict[str, object]:
        """Get detailed information about a service.

        Args:
            service: Service name

        Returns:
            Service information dictionary
        """
        try:
            config = self.config_loader.load_service_config(service)

            metadata: dict[str, object] = {}
            info: dict[str, object] = {"service": service, "config": config, "metadata": metadata}

            # Add service metadata if available
            if hasattr(config, "description"):
                metadata["description"] = config.description
            if hasattr(config, "version"):
                metadata["version"] = config.version

            return info

        except (OSError, ValueError, RuntimeError) as e:
            raise click.ClickException(f"Failed to get service info for '{service}': {e}") from e

    def list_available_services(self) -> list[str]:
        """Get list of available services.

        Returns:
            List of service names
        """
        try:
            return self.config_loader.list_services()
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to list services: %s", e)
            return []

    def get_venues_for_service(self, service: str) -> list[str]:
        """Get venues configured for a service.

        Args:
            service: Service name

        Returns:
            List of venue names
        """
        try:
            config = self.config_loader.load_service_config(service)
            venues = getattr(config, "venues", [])
            if isinstance(venues, dict):
                return list(venues.keys())
            return venues
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to get venues for service %s: %s", service, e)
            return []
