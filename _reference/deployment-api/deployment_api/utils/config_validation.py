"""
Configuration validation utilities for deployment-api.

Provides ConfigurationError and ValidationUtils — previously imported from
deployment_service.config.config_validator. These are inlined here to remove
the cross-service import boundary. deployment-api must not import deployment-service
as a Python package; interaction is via messaging/APIs/storage per topology DAG.
"""

import logging

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
