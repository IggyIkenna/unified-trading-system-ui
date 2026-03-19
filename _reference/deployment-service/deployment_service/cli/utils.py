"""Shared utilities for CLI commands."""

import logging

from ..deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Initialize deployment configuration
_deployment_config = DeploymentConfig()

# Deployment concurrency defaults (from config)
DEFAULT_MAX_CONCURRENT = _deployment_config.default_max_concurrent
MAX_CONCURRENT_HARD_LIMIT = _deployment_config.max_concurrent_hard_limit

# Default values from deployment config
DEFAULT_PROJECT_ID = _deployment_config.gcp_project_id
DEFAULT_REGION = _deployment_config.gcs_region
DEFAULT_SERVICE_ACCOUNT = _deployment_config.service_account_email
DEFAULT_STATE_BUCKET = _deployment_config.effective_state_bucket
