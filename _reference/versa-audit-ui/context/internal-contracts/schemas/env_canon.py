"""Canonical environment variable names — SINGLE SOURCE OF TRUTH.

All repos MUST use these constants instead of raw getenv calls with literal strings.
Import EnvVars from unified_internal_contracts for validation_alias and env reads.
"""

# Module-level constants (convenience aliases)
RUNTIME_MODE = "RUNTIME_MODE"
DATA_MODE = "DATA_MODE"
CLOUD_PROVIDER = "CLOUD_PROVIDER"
PHASE_MODE = "PHASE_MODE"
GCP_PROJECT_ID = "GCP_PROJECT_ID"
AWS_ACCOUNT_ID = "AWS_ACCOUNT_ID"
RUNTIME_TOPOLOGY_PATH = "RUNTIME_TOPOLOGY_PATH"
WORKSPACE_ROOT = "WORKSPACE_ROOT"
LOG_LEVEL = "LOG_LEVEL"


class EnvVars:
    """Canonical env var names. Use for validation_alias and env reads."""

    # Mode (deployment-time)
    RUNTIME_MODE = "RUNTIME_MODE"  # live | batch
    DATA_MODE = "DATA_MODE"  # mock | real
    CLOUD_PROVIDER = "CLOUD_PROVIDER"  # gcp | aws | local
    PHASE_MODE = "PHASE_MODE"  # phase1 | phase2 | phase3

    # Project / bootstrap
    GCP_PROJECT_ID = "GCP_PROJECT_ID"
    AWS_ACCOUNT_ID = "AWS_ACCOUNT_ID"
    RUNTIME_TOPOLOGY_PATH = "RUNTIME_TOPOLOGY_PATH"
    WORKSPACE_ROOT = "WORKSPACE_ROOT"

    # Environment / deployment
    DEPLOYMENT_ENV = "DEPLOYMENT_ENV"
    ENVIRONMENT = "ENVIRONMENT"

    # Protocol (from topology; routing-key suffix applied per domain)
    PROTOCOL_DATA_SINK_BUCKET = "PROTOCOL_DATA_SINK_BUCKET"
    PROTOCOL_DATA_SINK_BACKEND = "PROTOCOL_DATA_SINK_BACKEND"
    PROTOCOL_DATA_SINK_TABLE_PREFIX = "PROTOCOL_DATA_SINK_TABLE_PREFIX"
    PROTOCOL_DATA_SOURCE_BUCKET = "PROTOCOL_DATA_SOURCE_BUCKET"
    PROTOCOL_DATA_SOURCE_BACKEND = "PROTOCOL_DATA_SOURCE_BACKEND"
    PROTOCOL_DATA_SOURCE_DIR = "PROTOCOL_DATA_SOURCE_DIR"
    PROTOCOL_EVENT_BUS_PROJECT = "PROTOCOL_EVENT_BUS_PROJECT"
    PROTOCOL_EVENT_BUS_BACKEND = "PROTOCOL_EVENT_BUS_BACKEND"
    PROTOCOL_ANALYTICS_PROJECT = "PROTOCOL_ANALYTICS_PROJECT"
    PROTOCOL_ANALYTICS_DATASET = "PROTOCOL_ANALYTICS_DATASET"
    PROTOCOL_ANALYTICS_BACKEND = "PROTOCOL_ANALYTICS_BACKEND"

    # Service / factory
    SERVICE_MODE = "SERVICE_MODE"

    # Logging (bootstrap, read before config is loaded)
    LOG_LEVEL = "LOG_LEVEL"  # DEBUG | INFO | WARNING | ERROR | CRITICAL

    # AWS
    AWS_REGION = "AWS_REGION"
    AWS_PROFILE = "AWS_PROFILE"
    ATHENA_OUTPUT_BUCKET = "ATHENA_OUTPUT_BUCKET"

    # GCP
    GOOGLE_APPLICATION_CREDENTIALS = "GOOGLE_APPLICATION_CREDENTIALS"
    GCS_REGION = "GCS_REGION"
    GCS_LOCATION = "GCS_LOCATION"
    BIGQUERY_LOCATION = "BIGQUERY_LOCATION"

    # Secrets
    SECRETS_CLOUD_PROVIDER = "SECRETS_CLOUD_PROVIDER"

    # Cache
    REDIS_URL = "REDIS_URL"

    # Emulators (local testing)
    PUBSUB_EMULATOR_HOST = "PUBSUB_EMULATOR_HOST"
    STORAGE_EMULATOR_HOST = "STORAGE_EMULATOR_HOST"
    BIGQUERY_EMULATOR_HOST = "BIGQUERY_EMULATOR_HOST"

    @classmethod
    def all_canonical(cls) -> set[str]:
        """Return set of all canonical env var string values."""
        return {
            cls.RUNTIME_MODE,
            cls.DATA_MODE,
            cls.CLOUD_PROVIDER,
            cls.PHASE_MODE,
            cls.GCP_PROJECT_ID,
            cls.AWS_ACCOUNT_ID,
            cls.RUNTIME_TOPOLOGY_PATH,
            cls.WORKSPACE_ROOT,
            cls.DEPLOYMENT_ENV,
            cls.ENVIRONMENT,
            cls.PROTOCOL_DATA_SINK_BUCKET,
            cls.PROTOCOL_DATA_SINK_BACKEND,
            cls.PROTOCOL_DATA_SINK_TABLE_PREFIX,
            cls.PROTOCOL_DATA_SOURCE_BUCKET,
            cls.PROTOCOL_DATA_SOURCE_BACKEND,
            cls.PROTOCOL_DATA_SOURCE_DIR,
            cls.PROTOCOL_EVENT_BUS_PROJECT,
            cls.PROTOCOL_EVENT_BUS_BACKEND,
            cls.PROTOCOL_ANALYTICS_PROJECT,
            cls.PROTOCOL_ANALYTICS_DATASET,
            cls.PROTOCOL_ANALYTICS_BACKEND,
            cls.SERVICE_MODE,
            cls.AWS_REGION,
            cls.AWS_PROFILE,
            cls.ATHENA_OUTPUT_BUCKET,
            cls.GOOGLE_APPLICATION_CREDENTIALS,
            cls.GCS_REGION,
            cls.GCS_LOCATION,
            cls.BIGQUERY_LOCATION,
            cls.SECRETS_CLOUD_PROVIDER,
            cls.REDIS_URL,
            cls.PUBSUB_EMULATOR_HOST,
            cls.STORAGE_EMULATOR_HOST,
            cls.BIGQUERY_EMULATOR_HOST,
            cls.LOG_LEVEL,
        }
