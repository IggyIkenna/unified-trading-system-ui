"""
Deployment Configuration - Service-specific configuration for deployment-service.

Extends UnifiedCloudConfig with deployment-specific settings like:
- State bucket configuration
- Service account settings
- Deployment concurrency limits
- Cloud provider defaults

All direct environment variable access should be replaced with this config class.
"""

from pydantic import AliasChoices, Field
from unified_config_interface import UnifiedCloudConfig


class DeploymentConfig(UnifiedCloudConfig):
    """
    Configuration for deployment-service.

    Provides deployment-specific configuration on top of UnifiedCloudConfig:
    - State bucket for deployment tracking
    - Service account configuration
    - Deployment concurrency limits
    - Default cloud provider settings
    """

    # =========================================================================
    # DEPLOYMENT-SPECIFIC CONFIGURATION
    # =========================================================================

    deployment_env: str = Field(
        default="development",
        validation_alias=AliasChoices("DEPLOYMENT_ENV"),
        description="Deployment environment (development, staging, production)",
    )

    # AliasChoices bootstrap exception: GCP_PROJECT_ID read only at DeploymentConfig init time
    # via pydantic AliasChoices. This is NOT os.environ.get() — the value is owned by
    # UnifiedCloudConfig after init. Documented bootstrap exception per codex §bootstrap-phase.
    gcp_project_id: str = Field(
        default="",
        validation_alias=AliasChoices("GCP_PROJECT_ID", "PROJECT_ID"),
        description="GCP project ID (PROJECT_ID for Cloud Functions)",
    )

    gcs_region: str = Field(
        default="asia-northeast1",
        validation_alias=AliasChoices("GCS_REGION", "GOOGLE_CLOUD_REGION"),
        description="Default GCS region for deployment scripts",
    )

    aws_region: str = Field(
        default="ap-northeast-1",
        validation_alias=AliasChoices("AWS_REGION", "AWS_DEFAULT_REGION"),
        description="Default AWS region for deployment scripts",
    )

    state_bucket: str = Field(
        default="",
        validation_alias=AliasChoices("STATE_BUCKET"),
        description="GCS bucket for deployment state storage",
    )

    service_account_email: str = Field(
        default="",
        validation_alias=AliasChoices("SERVICE_ACCOUNT", "SERVICE_ACCOUNT_EMAIL"),
        description="Service account email for deployments",
    )

    # =========================================================================
    # DEPLOYMENT CONCURRENCY LIMITS
    # =========================================================================

    default_max_concurrent: int = Field(
        default=2000,
        validation_alias=AliasChoices("DEFAULT_MAX_CONCURRENT"),
        description="Default maximum concurrent deployments",
    )

    max_concurrent_hard_limit: int = Field(
        default=2500,
        validation_alias=AliasChoices("MAX_CONCURRENT_HARD_LIMIT"),
        description="Hard limit for maximum concurrent deployments",
    )

    # =========================================================================
    # QUOTA BROKER CONFIGURATION
    # =========================================================================

    quota_broker_url: str = Field(
        default="",
        validation_alias=AliasChoices("QUOTA_BROKER_URL"),
        description="URL for quota broker service",
    )

    quota_broker_auth_mode: str = Field(
        default="iam",
        validation_alias=AliasChoices("QUOTA_BROKER_AUTH_MODE"),
        description="Authentication mode for quota broker (iam or none)",
    )

    quota_broker_timeout_seconds: float = Field(
        default=10.0,
        validation_alias=AliasChoices("QUOTA_BROKER_TIMEOUT_SECONDS"),
        description="Timeout for quota broker requests in seconds",
    )

    # =========================================================================
    # SERVER CONFIGURATION
    # =========================================================================

    api_port: str = Field(
        default="8000",
        validation_alias=AliasChoices("API_PORT"),
        description="API server port",
    )

    workers: int = Field(
        default=4,
        validation_alias=AliasChoices("WORKERS"),
        description="Number of worker processes",
    )

    port: str = Field(
        default="",  # Will be computed in effective_port
        validation_alias=AliasChoices("PORT"),
        description="Port for Gunicorn binding (Cloud Run convention)",
    )

    frontend_port: str = Field(
        default="5173",
        validation_alias=AliasChoices("FRONTEND_PORT"),
        description="Frontend dev server port (for CORS dev origins)",
    )

    cors_allowed_origins: str = Field(
        default="",
        validation_alias=AliasChoices("CORS_ALLOWED_ORIGINS"),
        description="Comma-separated list of allowed CORS origins in production",
    )

    cors_allowed_cloud_run: str = Field(
        default="",
        validation_alias=AliasChoices("CORS_ALLOWED_CLOUD_RUN"),
        description="Comma-separated Cloud Run service names allowed via CORS regex",
    )

    # =========================================================================
    # AUTO-SYNC CONFIGURATION
    # =========================================================================

    auto_sync_enabled: bool = Field(
        default=True,
        validation_alias=AliasChoices("AUTO_SYNC_ENABLED"),
        description="Enable automatic synchronization",
    )

    auto_sync_interval_seconds: int = Field(
        default=60,
        validation_alias=AliasChoices("AUTO_SYNC_INTERVAL_SECONDS"),
        description="Interval between auto-sync operations in seconds",
    )

    auto_sync_interval_active: int = Field(
        default=30,
        validation_alias=AliasChoices("AUTO_SYNC_INTERVAL_ACTIVE"),
        description="Seconds between syncs when active; 30 to avoid rate limits",
    )

    auto_sync_lock_ttl_seconds: int = Field(
        default=90,
        validation_alias=AliasChoices("AUTO_SYNC_LOCK_TTL_SECONDS"),
        description="Lock TTL for auto-sync operations in seconds",
    )

    auto_sync_max_parallel: int = Field(
        default=10,
        validation_alias=AliasChoices("AUTO_SYNC_MAX_PARALLEL"),
        description="Concurrent deployment processors (higher = faster orphan kill)",
    )

    orphan_delete_max_parallel: int = Field(
        default=500,
        validation_alias=AliasChoices("ORPHAN_DELETE_MAX_PARALLEL"),
        description="Max concurrent delete requests (keeps deletes within write quota)",
    )

    orphan_delete_retry_seconds: int = Field(
        default=30,
        validation_alias=AliasChoices("ORPHAN_DELETE_RETRY_SECONDS"),
        description="Retry delete if VM still RUNNING after this many seconds",
    )

    orphan_cleanup_recently_completed_minutes: int = Field(
        default=30,
        validation_alias=AliasChoices("ORPHAN_CLEANUP_RECENTLY_COMPLETED_MINUTES"),
        description="Run orphan cleanup for deployments marked completed in last N minutes",
    )

    write_quota_per_minute: int = Field(
        default=6000,
        validation_alias=AliasChoices("WRITE_QUOTA_PER_MINUTE"),
        description="GCP Compute Engine write quota (insert + delete); fixed pool Option A",
    )

    write_quota_buffer: int = Field(
        default=1000,
        validation_alias=AliasChoices("WRITE_QUOTA_BUFFER"),
        description=(
            "Reserve for other workloads; effective = WRITE_QUOTA_PER_MINUTE - WRITE_QUOTA_BUFFER"
        ),
    )

    # =========================================================================
    # AUTO-SCHEDULER CONFIGURATION
    # =========================================================================

    auto_scheduler_max_launch_per_tick: int = Field(
        default=2000,
        validation_alias=AliasChoices("AUTO_SCHEDULER_MAX_LAUNCH_PER_TICK"),
        description="Maximum launches per scheduler tick",
    )

    auto_scheduler_max_releases_per_tick: int = Field(
        default=200,
        validation_alias=AliasChoices("AUTO_SCHEDULER_MAX_RELEASES_PER_TICK"),
        description="Maximum releases per scheduler tick",
    )

    auto_scheduler_batch_size: int = Field(
        default=200,
        validation_alias=AliasChoices("AUTO_SCHEDULER_BATCH_SIZE"),
        description="Auto-scheduler batch size",
    )

    auto_scheduler_inter_batch_delay: float = Field(
        default=1.0,
        validation_alias=AliasChoices("AUTO_SCHEDULER_INTER_BATCH_DELAY"),
        description="Delay between auto-scheduler batches in seconds",
    )

    auto_scheduler_delete_batch_size: int = Field(
        default=200,
        validation_alias=AliasChoices("AUTO_SCHEDULER_DELETE_BATCH_SIZE"),
        description="Auto-scheduler delete batch size",
    )

    auto_scheduler_delete_batch_delay_seconds: int = Field(
        default=45,
        validation_alias=AliasChoices("AUTO_SCHEDULER_DELETE_BATCH_DELAY_SECONDS"),
        description="Delay between delete batches in seconds",
    )

    auto_scheduler_parallel_workers: int = Field(
        default=56,
        validation_alias=AliasChoices("AUTO_SCHEDULER_PARALLEL_WORKERS"),
        description="Number of parallel auto-scheduler workers",
    )

    auto_scheduler_vm_rate_limit: float = Field(
        default=10.0,
        validation_alias=AliasChoices("AUTO_SCHEDULER_VM_RATE_LIMIT"),
        description="VM rate limit for auto-scheduler",
    )

    stuck_shard_grace_seconds: int = Field(
        default=600,
        validation_alias=AliasChoices("STUCK_SHARD_GRACE_SECONDS"),
        description="Grace period for stuck shards in seconds",
    )

    vm_startup_timeout_seconds: int = Field(
        default=300,
        validation_alias=AliasChoices("VM_STARTUP_TIMEOUT_SECONDS"),
        description="VM health check: terminate if no startup signal after this many seconds",
    )

    oom_kill_threshold: int = Field(
        default=5,
        validation_alias=AliasChoices("OOM_KILL_THRESHOLD"),
        description="OOM detection: terminate if this many OOM messages in serial logs",
    )

    state_ttl_hours: int = Field(
        default=48,
        validation_alias=AliasChoices("STATE_TTL_HOURS"),
        description="State TTL: cleanup old deployment state files (keep last N hours)",
    )

    # =========================================================================
    # VM ORCHESTRATION
    # =========================================================================

    vm_launch_mini_batch_size: int = Field(
        default=200,
        validation_alias=AliasChoices("VM_LAUNCH_MINI_BATCH_SIZE"),
        description="VM launch mini-batch size",
    )

    vm_launch_mini_batch_delay_seconds: float = Field(
        default=3.0,
        validation_alias=AliasChoices("VM_LAUNCH_MINI_BATCH_DELAY_SECONDS"),
        description="Delay between VM launch mini-batches in seconds",
    )

    unknown_status_max_polls: int = Field(
        default=10,
        validation_alias=AliasChoices("UNKNOWN_STATUS_MAX_POLLS"),
        description="Maximum polls for unknown status VMs",
    )

    # =========================================================================
    # PERFORMANCE TUNING
    # =========================================================================

    gcs_pool_size: int = Field(
        default=200,
        validation_alias=AliasChoices("GCS_POOL_SIZE"),
        description="GCS connection pool size",
    )

    compute_pool_size: int = Field(
        default=200,
        validation_alias=AliasChoices("COMPUTE_POOL_SIZE"),
        description="Compute engine connection pool size",
    )

    compute_pool_maxsize: int = Field(
        default=200,
        validation_alias=AliasChoices("COMPUTE_POOL_MAXSIZE"),
        description="Compute engine connection pool max size",
    )

    # =========================================================================
    # CACHE CONFIGURATION
    # =========================================================================

    redis_url: str = Field(
        default="redis://localhost:6379/0",
        validation_alias=AliasChoices("REDIS_URL"),
        description="Redis server URL",
    )

    data_status_cache_ttl_seconds: int = Field(
        default=1800,
        validation_alias=AliasChoices("DATA_STATUS_CACHE_TTL_SECONDS"),
        description="Data status cache TTL in seconds",
    )

    # =========================================================================
    # GITHUB CONFIGURATION
    # =========================================================================

    github_org: str = Field(
        default="IggyIkenna",
        validation_alias=AliasChoices("GITHUB_ORG"),
        description="GitHub organization",
    )

    github_token_sa: str = Field(
        default="",
        validation_alias=AliasChoices("GITHUB_TOKEN_SA"),
        description="GitHub token service account",
    )

    # =========================================================================
    # TESTING CONFIGURATION
    # =========================================================================

    enforce_single_region: bool = Field(
        default=True,
        validation_alias=AliasChoices("ENFORCE_SINGLE_REGION"),
        description="Enforce single region deployment",
    )

    warn_cross_region_egress: bool = Field(
        default=True,
        validation_alias=AliasChoices("WARN_CROSS_REGION_EGRESS"),
        description="Warn about cross-region egress",
    )

    broker_max_wait_seconds: float = Field(
        default=900.0,
        validation_alias=AliasChoices("BROKER_MAX_WAIT_SECONDS"),
        description="Maximum wait time for broker requests in seconds",
    )

    tardis_access_mode: str = Field(
        default="",
        validation_alias=AliasChoices("TARDIS_ACCESS_MODE"),
        description="Tardis API access mode override (full_access or perpetuals_only)",
    )

    workspace_root: str = Field(
        default="",
        validation_alias=AliasChoices("WORKSPACE_ROOT"),
        description=(
            "Absolute path to the workspace root (mono/multi-repo root)."
            " Used for local dev pyproject.toml lookups."
        ),
    )

    shard_index: int = Field(
        default=0,
        validation_alias=AliasChoices("SHARD_INDEX"),
        description="Shard index for parallel script execution",
    )

    graph_secret_name: str = Field(
        default="thegraph-api-key",
        validation_alias=AliasChoices("GRAPH_SECRET_NAME", "THEGRAPH_SECRET_NAME"),
        description="Secret name for The Graph API key",
    )

    instrument_download_workers: int | None = Field(
        default=None,
        validation_alias=AliasChoices("INSTRUMENT_DOWNLOAD_WORKERS"),
        description="Override for instrument download worker count (scripts)",
    )

    instrument_list_workers: int | None = Field(
        default=None,
        validation_alias=AliasChoices("INSTRUMENT_LIST_WORKERS"),
        description="Override for instrument list worker count (scripts)",
    )

    trade_key_max_age_days: int = Field(
        default=90,
        validation_alias=AliasChoices("TRADE_KEY_MAX_AGE_DAYS"),
        description="Max age in days for trade/execution keys (PCI DSS rotation)",
    )

    data_key_max_age_days: int = Field(
        default=180,
        validation_alias=AliasChoices("DATA_KEY_MAX_AGE_DAYS"),
        description="Max age in days for data vendor keys",
    )

    warn_before_days: int = Field(
        default=14,
        validation_alias=AliasChoices("WARN_BEFORE_DAYS"),
        description="Warn this many days before key expiry",
    )

    alert_topic: str = Field(
        default="secret-rotation-alerts",
        validation_alias=AliasChoices("ALERT_TOPIC"),
        description="PubSub topic for secret rotation alerts",
    )

    # =========================================================================
    # CLOUD-SPECIFIC DEFAULTS WITH FALLBACKS
    # =========================================================================

    @property
    def effective_project_id(self) -> str:
        """Get the effective project ID based on cloud provider."""
        if self.cloud_provider == "aws":
            return self.aws_account_id
        return self.gcp_project_id

    @property
    def effective_region(self) -> str:
        """Get the effective region based on cloud provider."""
        if self.cloud_provider == "aws":
            return self.aws_region
        return self.gcs_region

    @property
    def effective_state_bucket(self) -> str:
        """Get the effective state bucket with fallback."""
        if self.state_bucket:
            return self.state_bucket
        if self.cloud_provider == "aws":
            return f"unified-deployment-state-{self.aws_account_id}"
        return f"unified-deployment-state-{self.gcp_project_id}"

    @property
    def all_failover_regions(self) -> list[str]:
        """Get failover regions based on cloud provider."""
        if self.cloud_provider == "aws":
            return [
                "us-east-1",
                "us-west-2",
                "eu-west-1",
                "ap-southeast-1",
            ]
        return [
            "us-central1",
            "us-east1",
            "europe-west1",
            "asia-northeast1",
        ]

    @property
    def effective_github_token_sa(self) -> str:
        """Get the effective GitHub token service account with fallback."""
        if self.github_token_sa:
            return self.github_token_sa
        return f"github-token-sa@{self.gcp_project_id}.iam.gserviceaccount.com"

    @property
    def effective_port(self) -> str:
        """Get effective port with Cloud Run convention fallback."""
        if self.port:
            return self.port
        if self.api_port != "8000":
            return self.api_port
        return "8080"
