"""
Environment variable substitution utilities.

This module handles substitution of environment variables in configuration
values with support for default values and various patterns.
"""

import logging
import os
import re

from ..deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Initialize configuration for project ID
_config = DeploymentConfig()


def _get_env_snapshot() -> dict[str, str]:
    """Take a snapshot of the current environment for config substitution.

    # config-bootstrap: This is the intentional config substitution boundary.
    # All env var reads for template substitution must go through this function.
    """
    return dict(
        os.environ
    )  # config-bootstrap: intentional full env snapshot for template substitution


def get_cloud_provider() -> str:
    """Get the current cloud provider from environment."""
    return _config.cloud_provider.lower()


def substitute_env_vars(value: str) -> str:
    """
    Substitute environment variables in a string.

    Supports patterns:
    - ${VAR_NAME} - required variable
    - ${VAR_NAME:-default} - with default value
    """
    pattern = r"\$\{([^}:]+)(?::-([^}]*))?\}"
    env = _get_env_snapshot()

    def replace(match: re.Match[str]) -> str:
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

    return re.sub(pattern, replace, value)


def substitute_template_vars(template: str, variables: dict[str, str]) -> str:
    """Substitute template variables in a string."""
    try:
        return template.format(**variables)
    except KeyError as e:
        logger.warning("Missing template variable: %s", e)
        raise


def build_storage_path_variables(
    project_id: str | None = None,
    region: str | None = None,
    **extra_vars: str,
) -> dict[str, str]:
    """Build common template variables for storage paths."""
    variables: dict[str, str] = {
        "project_id": project_id or str(_config.gcp_project_id or ""),
        "region": region or str(_config.gcs_region or ""),
        **extra_vars,
    }

    for key, value in list(variables.items()):
        variables[f"{key}_lower"] = value.lower()

    return variables


def parse_storage_path(storage_path: str) -> tuple[str, str]:
    """Parse a cloud storage path (GCS or S3) into bucket and prefix."""
    if storage_path.startswith("gs://") or storage_path.startswith("s3://"):  # noqa: gs-uri — env_substitutor parses storage path prefixes for template substitution
        path = storage_path[5:]
    else:
        raise ValueError(
            f"Invalid storage path: {storage_path}. Must start with 'gs://' or 's3://'"
        )

    parts = path.split("/", 1)
    bucket = parts[0]
    prefix = parts[1] if len(parts) > 1 else ""

    return bucket, prefix


def parse_gcs_path(gcs_path: str) -> tuple[str, str]:
    """Parse a GCS path into bucket and prefix. DEPRECATED: Use parse_storage_path()."""
    if not gcs_path.startswith("gs://"):  # noqa: gs-uri — env_substitutor validates GCS path prefix for template substitution
        raise ValueError(f"Invalid GCS path: {gcs_path}. Must start with 'gs://'")

    return parse_storage_path(gcs_path)
