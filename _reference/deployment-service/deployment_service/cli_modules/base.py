"""Base CLI module with shared functionality."""

import logging
from pathlib import Path

from deployment_service.config_loader import ConfigLoader

logger = logging.getLogger(__name__)


class BaseCLI:
    """Base class for all CLI modules with shared functionality."""

    def __init__(self):
        """Initialize base CLI."""
        self.config_dir = self._get_config_dir()
        self.logger = logger

    @staticmethod
    def _get_config_dir() -> Path:
        """Get the configs directory path."""
        # Check if running from deployment-service
        cwd = Path.cwd()

        # Try relative to script location
        script_dir = Path(__file__).parent.parent
        configs_dir = script_dir / "configs"

        if configs_dir.exists():
            return configs_dir

        # Try current directory
        configs_dir = cwd / "configs"
        if configs_dir.exists():
            return configs_dir

        # Try parent directory
        configs_dir = cwd.parent / "configs"
        if configs_dir.exists():
            return configs_dir

        # Try deployment-service structure
        configs_dir = cwd / "deployment-service" / "configs"
        if configs_dir.exists():
            return configs_dir

        # Default to current directory configs
        return cwd / "configs"

    @staticmethod
    def setup_logging(level: str = "INFO"):
        """Setup logging configuration."""
        log_level = getattr(logging, level.upper(), logging.INFO)
        logging.getLogger().setLevel(log_level)

    def load_config(self, service: str) -> dict[str, object] | None:
        """Load configuration for a service."""
        try:
            loader = ConfigLoader(str(self.config_dir))
            return loader.load_service_config(service)
        except (OSError, ValueError, RuntimeError) as e:
            self.logger.error("Failed to load config for %s: %s", service, e)
            return None
