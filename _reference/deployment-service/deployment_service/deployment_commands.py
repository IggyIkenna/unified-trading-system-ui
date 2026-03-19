"""Deployment-related CLI commands extracted from main CLI module."""

import logging

from .deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Initialize deployment configuration
_deployment_config = DeploymentConfig()

# Deployment concurrency defaults (from config)
DEFAULT_MAX_CONCURRENT = _deployment_config.default_max_concurrent
MAX_CONCURRENT_HARD_LIMIT = _deployment_config.max_concurrent_hard_limit

# Default values from deployment config
DEFAULT_PROJECT_ID = _deployment_config.effective_project_id
DEFAULT_REGION = _deployment_config.effective_region
DEFAULT_SERVICE_ACCOUNT = _deployment_config.service_account_email or (
    f"instruments-service-cloud-run"
    f"@{_deployment_config.effective_project_id}.iam.gserviceaccount.com"
)
DEFAULT_STATE_BUCKET = _deployment_config.effective_state_bucket


def get_default_config(cloud_provider: str) -> dict[str, object]:
    """Get default configuration for the specified cloud provider from DeploymentConfig."""
    config = DeploymentConfig()

    if cloud_provider == "aws":
        return {
            "project_id": config.aws_account_id,
            "region": config.aws_region,
            "service_account": "",  # IAM roles used instead
            "state_bucket": f"deployment-orchestration-{config.aws_account_id}",
        }
    else:  # gcp
        return {
            "project_id": config.gcp_project_id,
            "region": config.gcs_region,
            "service_account": config.service_account_email
            or f"instruments-service-cloud-run@{config.gcp_project_id}.iam.gserviceaccount.com",
            "state_bucket": config.effective_state_bucket,
        }


# This module will contain deployment commands when fully implemented
# For now, just exporting the configuration helpers
__all__ = [
    "DEFAULT_PROJECT_ID",
    "DEFAULT_REGION",
    "DEFAULT_SERVICE_ACCOUNT",
    "DEFAULT_STATE_BUCKET",
    "get_default_config",
]
