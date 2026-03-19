"""
Common helpers for deployment-service scripts.

All config access goes through DeploymentConfig.
"""

from deployment_service.deployment_config import DeploymentConfig

_config = DeploymentConfig()


def get_project_id() -> str:
    """Return GCP_PROJECT_ID, raising RuntimeError if not set."""
    pid = _config.gcp_project_id
    if not pid:
        raise RuntimeError("GCP_PROJECT_ID env var required — set it before running this script")
    return pid


def get_gcs_region(default: str = "asia-northeast1") -> str:
    """Return GCS_REGION, falling back to default if not set."""
    return _config.gcs_region or default


def get_aws_region(default: str = "ap-northeast-1") -> str:
    """Return AWS_REGION, falling back to default if not set."""
    return _config.aws_region or default


def get_aws_account_id() -> str | None:
    """Return AWS_ACCOUNT_ID if set, or None."""
    val = _config.aws_account_id
    return val if val else None


def get_shard_index(default: int = 0) -> int:
    """Return SHARD_INDEX as int, defaulting to 0."""
    return _config.shard_index if _config.shard_index is not None else default


def get_graph_secret_name() -> str:
    """Return GRAPH_SECRET_NAME or THEGRAPH_SECRET_NAME, defaulting to 'thegraph-api-key'."""
    return _config.graph_secret_name or "thegraph-api-key"
