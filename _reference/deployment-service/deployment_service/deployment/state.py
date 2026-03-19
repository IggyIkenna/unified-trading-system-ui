"""
State Manager - GCS-backed deployment state tracking.

Tracks deployment progress across sessions, enabling:
- Resume of failed deployments
- Cross-session persistence
- Status monitoring

Environment-based separation:
- DEPLOYMENT_ENV=development (default for local): deployments.development/
- DEPLOYMENT_ENV=production (Docker/Cloud Run): deployments.production/
"""

import json
import logging
import time
import uuid
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import cast

from unified_trading_library import get_storage_client

from deployment_service.deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Environment-based state separation: development vs production
# Local runs default to "development", Docker builds inject "production"
DEPLOYMENT_ENV = DeploymentConfig().deployment_env


class DeploymentStatus(Enum):
    """Overall deployment status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    COMPLETED_PENDING_DELETE = (
        "completed_pending_delete"  # All shards terminal; VMs may still be deleting
    )
    COMPLETED_WITH_ERRORS = "completed_with_errors"  # Completed but had errors in logs
    COMPLETED_WITH_WARNINGS = "completed_with_warnings"  # Completed but had warnings
    FAILED = "failed"
    CANCELLED = "cancelled"


class ShardStatus(Enum):
    """Individual shard status."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"


class FailureCategory(Enum):
    """Standardized failure categories for infrastructure reporting."""

    ZONE_EXHAUSTION = "zone_exhaustion"
    IP_QUOTA = "ip_quota"
    CPU_QUOTA = "cpu_quota"
    SSD_QUOTA = "ssd_quota"
    PREEMPTION = "preemption"
    TIMEOUT = "timeout"
    APPLICATION_ERROR = "application_error"
    NETWORK_ERROR = "network_error"
    AUTH_ERROR = "auth_error"
    UNKNOWN = "unknown"

    @classmethod
    def from_error_message(cls, error_message: str) -> "FailureCategory":
        """Classify failure from error message."""
        if not error_message:
            return cls.UNKNOWN
        error_lower = error_message.lower()

        if "zone_resource_pool_exhausted" in error_lower or "zone exhausted" in error_lower:
            return cls.ZONE_EXHAUSTION
        elif (
            "in_use_addresses" in error_lower
            or "ip quota" in error_lower
            or "ip_quota" in error_lower
        ):
            return cls.IP_QUOTA
        elif "cpus" in error_lower and "quota" in error_lower:
            return cls.CPU_QUOTA
        elif "ssd" in error_lower and "quota" in error_lower:
            return cls.SSD_QUOTA
        elif "preempted" in error_lower:
            return cls.PREEMPTION
        elif "timeout" in error_lower or "timed out" in error_lower:
            return cls.TIMEOUT
        elif (
            "permission" in error_lower
            or "unauthorized" in error_lower
            or "forbidden" in error_lower
        ):
            return cls.AUTH_ERROR
        elif "network" in error_lower or "connection" in error_lower:
            return cls.NETWORK_ERROR
        else:
            return cls.APPLICATION_ERROR


@dataclass
class ExecutionAttempt:
    """Record of a single execution attempt for a shard."""

    attempt: int
    zone: str | None = None
    region: str | None = None
    started_at: str | None = None
    ended_at: str | None = None
    status: str = "pending"
    failure_reason: str | None = None
    failure_category: str | None = None
    job_id: str | None = None

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary."""
        return {
            "attempt": self.attempt,
            "zone": self.zone,
            "region": self.region,
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "status": self.status,
            "failure_reason": self.failure_reason,
            "failure_category": self.failure_category,
            "job_id": self.job_id,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> "ExecutionAttempt":
        """Create from dictionary."""
        return cls(
            attempt=cast(int, data.get("attempt", 1)),
            zone=cast("str | None", data.get("zone")),
            region=cast("str | None", data.get("region")),
            started_at=cast("str | None", data.get("started_at")),
            ended_at=cast("str | None", data.get("ended_at")),
            status=cast(str, data.get("status", "pending")),
            failure_reason=cast("str | None", data.get("failure_reason")),
            failure_category=cast("str | None", data.get("failure_category")),
            job_id=cast("str | None", data.get("job_id")),
        )


@dataclass
class ShardState:
    """State of a single shard."""

    shard_id: str
    status: ShardStatus = ShardStatus.PENDING
    job_id: str | None = None
    start_time: str | None = None
    end_time: str | None = None
    error_message: str | None = None
    # Centralized quota-broker lease id (best-effort; may be absent if broker disabled).
    quota_lease_id: str | None = None
    # If launch was denied by broker, store reason + suggested retry delay for UI/debugging.
    quota_denied_reason: str | None = None
    quota_retry_after_seconds: int | None = None
    retries: int = 0
    # Count of consecutive UNKNOWN backend status polls (for stuck detection)
    unknown_polls: int = 0
    dimensions: dict[str, object] = field(default_factory=dict)
    args: list[str] = field(default_factory=list)
    # Execution history - tracks every attempt with zone/region/failure info
    execution_history: list[ExecutionAttempt] = field(default_factory=list)
    # Final location where shard ran successfully
    final_zone: str | None = None
    final_region: str | None = None
    # Failover counts
    zone_switches: int = 0
    region_switches: int = 0
    # Failure classification
    failure_category: str | None = None

    def add_execution_attempt(
        self,
        zone: str | None = None,
        region: str | None = None,
        job_id: str | None = None,
    ) -> ExecutionAttempt:
        """Add a new execution attempt."""
        attempt_num = len(self.execution_history) + 1
        attempt = ExecutionAttempt(
            attempt=attempt_num,
            zone=zone,
            region=region,
            started_at=datetime.now(UTC).isoformat(),
            status="running",
            job_id=job_id,
        )
        self.execution_history.append(attempt)
        return attempt

    def complete_current_attempt(
        self,
        status: str,
        failure_reason: str | None = None,
    ) -> None:
        """Complete the current (latest) execution attempt."""
        if not self.execution_history:
            return

        attempt = self.execution_history[-1]
        attempt.ended_at = datetime.now(UTC).isoformat()
        attempt.status = status
        attempt.failure_reason = failure_reason

        if failure_reason:
            category = FailureCategory.from_error_message(failure_reason)
            attempt.failure_category = category.value
            self.failure_category = category.value

        if status == "succeeded":
            self.final_zone = attempt.zone
            self.final_region = attempt.region

        # Count zone/region switches
        if len(self.execution_history) >= 2:
            prev = self.execution_history[-2]
            if attempt.zone and prev.zone and attempt.zone != prev.zone:
                self.zone_switches += 1
            if attempt.region and prev.region and attempt.region != prev.region:
                self.region_switches += 1

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary."""
        return {
            "shard_id": self.shard_id,
            "status": self.status.value,
            "job_id": self.job_id,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "error_message": self.error_message,
            "quota_lease_id": self.quota_lease_id,
            "quota_denied_reason": self.quota_denied_reason,
            "quota_retry_after_seconds": self.quota_retry_after_seconds,
            "retries": self.retries,
            "unknown_polls": self.unknown_polls,
            "dimensions": self.dimensions,
            "args": self.args,
            "execution_history": [e.to_dict() for e in self.execution_history],
            "final_zone": self.final_zone,
            "final_region": self.final_region,
            "zone_switches": self.zone_switches,
            "region_switches": self.region_switches,
            "failure_category": self.failure_category,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> "ShardState":
        """Create from dictionary."""
        execution_history_raw = cast("list[dict[str, object]]", data.get("execution_history") or [])
        execution_history = [ExecutionAttempt.from_dict(e) for e in execution_history_raw]
        return cls(
            shard_id=cast(str, data["shard_id"]),
            status=ShardStatus(data.get("status", "pending")),
            job_id=cast("str | None", data.get("job_id")),
            start_time=cast("str | None", data.get("start_time")),
            end_time=cast("str | None", data.get("end_time")),
            error_message=cast("str | None", data.get("error_message")),
            quota_lease_id=cast("str | None", data.get("quota_lease_id")),
            quota_denied_reason=cast("str | None", data.get("quota_denied_reason")),
            quota_retry_after_seconds=cast("int | None", data.get("quota_retry_after_seconds")),
            retries=cast(int, data.get("retries", 0)),
            unknown_polls=cast(int, data.get("unknown_polls", 0)),
            dimensions=cast("dict[str, object]", data.get("dimensions") or {}),
            args=cast("list[str]", data.get("args") or []),
            execution_history=execution_history,
            final_zone=cast("str | None", data.get("final_zone")),
            final_region=cast("str | None", data.get("final_region")),
            zone_switches=cast(int, data.get("zone_switches", 0)),
            region_switches=cast(int, data.get("region_switches", 0)),
            failure_category=cast("str | None", data.get("failure_category")),
        )


@dataclass
class DeploymentState:
    """State of an entire deployment."""

    deployment_id: str
    service: str
    compute_type: str
    status: DeploymentStatus = DeploymentStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    start_date: str | None = None
    end_date: str | None = None
    total_shards: int = 0
    shards: list[ShardState] = field(default_factory=list)
    config: dict[str, object] = field(default_factory=dict)
    tag: str | None = None  # Human-readable description/annotation for this deployment
    # "batch" = one-off jobs (Cloud Run Jobs / VMs);
    # "live" = long-running services (Cloud Run Services)
    deployment_mode: str = "batch"

    @property
    def pending_shards(self) -> list[ShardState]:
        """Get shards that haven't started."""
        return [s for s in self.shards if s.status == ShardStatus.PENDING]

    @property
    def running_shards(self) -> list[ShardState]:
        """Get currently running shards."""
        return [s for s in self.shards if s.status == ShardStatus.RUNNING]

    @property
    def succeeded_shards(self) -> list[ShardState]:
        """Get successfully completed shards."""
        return [s for s in self.shards if s.status == ShardStatus.SUCCEEDED]

    @property
    def failed_shards(self) -> list[ShardState]:
        """Get failed shards."""
        return [s for s in self.shards if s.status == ShardStatus.FAILED]

    @property
    def progress_percent(self) -> float:
        """Calculate completion percentage."""
        if self.total_shards == 0:
            return 0.0
        completed = len(self.succeeded_shards) + len(self.failed_shards)
        return (completed / self.total_shards) * 100

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary."""
        return {
            "deployment_id": self.deployment_id,
            "service": self.service,
            "compute_type": self.compute_type,
            "status": self.status.value,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "start_date": self.start_date,
            "end_date": self.end_date,
            "total_shards": self.total_shards,
            "shards": [s.to_dict() for s in self.shards],
            "config": self.config,
            "tag": self.tag,
            "deployment_mode": self.deployment_mode,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> "DeploymentState":
        """Create from dictionary."""
        shards_raw = cast("list[dict[str, object]]", data.get("shards") or [])
        shards = [ShardState.from_dict(s) for s in shards_raw]
        return cls(
            deployment_id=cast(str, data["deployment_id"]),
            service=cast(str, data["service"]),
            compute_type=cast(str, data["compute_type"]),
            status=DeploymentStatus(data.get("status", "pending")),
            created_at=cast(str, data.get("created_at", datetime.now(UTC).isoformat())),
            updated_at=cast(str, data.get("updated_at", datetime.now(UTC).isoformat())),
            start_date=cast("str | None", data.get("start_date")),
            end_date=cast("str | None", data.get("end_date")),
            total_shards=cast(int, data.get("total_shards", len(shards))),
            shards=shards,
            config=cast("dict[str, object]", data.get("config") or {}),
            tag=cast("str | None", data.get("tag")),
            deployment_mode=cast(str, data.get("deployment_mode", "batch")),
        )


class StateManager:
    """
    Manages deployment state in GCS.

    State is stored at:
    gs://{bucket}/{prefix}.{env}/{deployment_id}/state.json

    Environment separation:
    - Local development: deployments.development/
    - Production (Cloud Run): deployments.production/
    """

    def __init__(
        self,
        bucket_name: str,
        prefix: str = "deployments",
        project_id: str | None = None,
    ):
        """
        Initialize the state manager.

        Args:
            bucket_name: Cloud storage bucket for state storage
            prefix: Prefix for state files (auto-appends environment if not already present)
            project_id: Cloud project ID
        """
        self.bucket_name = bucket_name
        # Auto-append environment suffix if not already present
        # This allows both "deployments" and "deployments.{env}" as valid inputs
        if not prefix.endswith(f".{DEPLOYMENT_ENV}"):
            self.prefix = f"{prefix}.{DEPLOYMENT_ENV}"
        else:
            self.prefix = prefix
        self.project_id = project_id
        logger.info("StateManager initialized with prefix=%s (env=%s)", self.prefix, DEPLOYMENT_ENV)

    def _get_state_path(self, deployment_id: str) -> str:
        """Get the GCS path for a deployment's state."""
        return f"{self.prefix}/{deployment_id}/state.json"

    def generate_deployment_id(self, service: str) -> str:
        """Generate a unique deployment ID."""
        timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
        suffix = uuid.uuid4().hex[:6]
        return f"{service}-{timestamp}-{suffix}"

    def create_deployment(
        self,
        service: str,
        compute_type: str,
        shards: list[dict[str, object]],
        start_date: str | None = None,
        end_date: str | None = None,
        config: dict[str, object] | None = None,
        deployment_id: str | None = None,  # Allow passing a pre-generated ID
        tag: str | None = None,  # Human-readable description for this deployment
    ) -> DeploymentState:
        """
        Create a new deployment state.

        Args:
            service: Service name
            compute_type: 'cloud_run' or 'vm'
            shards: List of shard configurations (with shard_id, dimensions, args)
            start_date: Start date for the deployment
            end_date: End date for the deployment
            config: Additional configuration
            deployment_id: Optional pre-generated deployment ID (if None, generates one)
            tag: Human-readable description/annotation for this deployment

        Returns:
            DeploymentState for the new deployment
        """
        if deployment_id is None:
            deployment_id = self.generate_deployment_id(service)

        shard_states = [
            ShardState(
                shard_id=cast(str, s.get("shard_id", f"shard-{i}")),
                dimensions=cast("dict[str, object]", s.get("dimensions") or {}),
                args=cast("list[str]", s.get("args") or []),
            )
            for i, s in enumerate(shards)
        ]

        state = DeploymentState(
            deployment_id=deployment_id,
            service=service,
            compute_type=compute_type,
            start_date=start_date,
            end_date=end_date,
            total_shards=len(shards),
            shards=shard_states,
            config=config or {},
            tag=tag,
        )

        self.save_state(state)
        logger.info("Created deployment %s with %s shards", deployment_id, len(shards))

        return state

    def save_state(self, state: DeploymentState, retry_on_conflict: int = 3) -> None:
        """
        Save deployment state to cloud storage.

        Cloud-agnostic implementation using get_storage_client.
        Note: Simplified concurrency control compared to GCS metageneration.

        Args:
            state: DeploymentState to save
            retry_on_conflict: Number of retry attempts on conflict (default: 3)
        """
        state.updated_at = datetime.now(UTC).isoformat()
        path = self._get_state_path(state.deployment_id)

        for attempt in range(retry_on_conflict):
            try:
                content = json.dumps(state.to_dict(), indent=2)
                client = get_storage_client(project_id=self.project_id)
                bucket = client.bucket(self.bucket_name)
                blob = bucket.blob(path)
                upload_fn = cast(object, getattr(blob, "upload_from_string", None))
                if callable(upload_fn):
                    upload_fn(content, content_type="application/json")
                logger.debug("Saved state to %s/%s", self.bucket_name, path)
                return

            except (OSError, ValueError, RuntimeError) as e:
                if attempt < retry_on_conflict - 1:
                    wait_time: float = 0.1 * (2.0**attempt)  # Exponential backoff
                    logger.warning(
                        "State save failed on %s (attempt %s/%s): %s, retrying in %.1fs...",
                        state.deployment_id,
                        attempt + 1,
                        retry_on_conflict,
                        e,
                        wait_time,
                    )
                    time.sleep(wait_time)
                else:
                    logger.error(
                        "State save failed on %s - all %s attempts failed: %s",
                        state.deployment_id,
                        retry_on_conflict,
                        e,
                    )
                    raise

    def load_state(self, deployment_id: str) -> DeploymentState | None:
        """
        Load deployment state from cloud storage.

        Cloud-agnostic implementation using get_storage_client.

        Args:
            deployment_id: The deployment ID to load

        Returns:
            DeploymentState if found, None otherwise
        """
        path = self._get_state_path(deployment_id)

        try:
            client = get_storage_client(project_id=self.project_id)
            bucket = client.bucket(self.bucket_name)
            blob = bucket.blob(path)
            if not blob.exists():
                logger.warning("State not found for deployment %s", deployment_id)
                return None
            download_fn = cast(object, getattr(blob, "download_as_string", None))
            raw: bytes = cast(bytes, download_fn()) if callable(download_fn) else b""
            content: str = raw.decode("utf-8")
            data = cast("dict[str, object]", json.loads(content))
            return DeploymentState.from_dict(data)
        except (OSError, ValueError, KeyError, TypeError) as e:
            logger.error("Failed to load state for %s: %s", deployment_id, e)
            return None

    def update_shard_status(
        self,
        deployment_id: str,
        shard_id: str,
        status: ShardStatus,
        job_id: str | None = None,
        error_message: str | None = None,
    ) -> None:
        """
        Update the status of a single shard.

        Args:
            deployment_id: The deployment ID
            shard_id: The shard ID to update
            status: New status
            job_id: Job ID if starting
            error_message: Error message if failed
        """
        state = self.load_state(deployment_id)
        if not state:
            raise ValueError(f"Deployment {deployment_id} not found")

        for shard in state.shards:
            if shard.shard_id == shard_id:
                shard.status = status
                if job_id:
                    shard.job_id = job_id
                if status == ShardStatus.RUNNING:
                    shard.start_time = datetime.now(UTC).isoformat()
                if status in (ShardStatus.SUCCEEDED, ShardStatus.FAILED):
                    shard.end_time = datetime.now(UTC).isoformat()
                if error_message:
                    shard.error_message = error_message
                break

        # Update overall status
        if all(s.status == ShardStatus.SUCCEEDED for s in state.shards):
            state.status = DeploymentStatus.COMPLETED
        elif any(s.status == ShardStatus.RUNNING for s in state.shards):
            state.status = DeploymentStatus.RUNNING
        elif any(s.status == ShardStatus.FAILED for s in state.shards):
            state.status = DeploymentStatus.FAILED

        self.save_state(state)

    def list_deployments(
        self, service: str | None = None, limit: int = 20
    ) -> list[dict[str, object]]:
        """
        List recent deployments.

        Args:
            service: Filter by service name
            limit: Maximum number of deployments to return

        Returns:
            List of deployment summaries
        """
        prefix = f"{self.prefix}/"
        _client = get_storage_client(project_id=self.project_id)
        _bucket = _client.bucket(self.bucket_name)
        _list_result = _bucket.list_blobs(prefix=prefix, delimiter="/")
        _prefixes_attr = cast(object, getattr(_list_result, "prefixes", []))
        prefixes: list[str] = [str(b) for b in cast(list[object], _prefixes_attr)]

        # Filter to new-style folders (service-YYYYMMDD-HHMMSS-hash format)
        valid_prefixes: list[str] = []
        for folder in prefixes:
            folder_name: str = folder.rstrip("/").split("/")[-1]
            # New-style: has multiple dashes and contains timestamp pattern
            if folder_name.count("-") >= 3 and not folder_name.startswith("d-"):
                valid_prefixes.append(folder)

        # Sort folders by name (newest first - timestamp is embedded in name)
        valid_prefixes.sort(reverse=True)

        # Filter to only include folders that contain the service name
        if service is not None:
            valid_prefixes = [folder for folder in valid_prefixes if service in folder]

        # Only check the most recent folders (limit * 2 to account for service filtering)
        valid_prefixes = valid_prefixes[: limit * 2]

        def fetch_deployment(folder: str) -> dict[str, object] | None:
            """Fetch a single deployment's state."""
            folder_name = folder.rstrip("/").split("/")[-1]
            state_blob_name = f"{folder}state.json"
            try:
                _fetch_client = get_storage_client(project_id=self.project_id)
                _fetch_bucket = _fetch_client.bucket(self.bucket_name)
                _blob = _fetch_bucket.blob(state_blob_name)
                if not _blob.exists():
                    return None
                _dl_fn = cast(object, getattr(_blob, "download_as_string", None))
                _raw: bytes = cast(bytes, _dl_fn()) if callable(_dl_fn) else b""
                content = _raw.decode("utf-8")
            except (OSError, ValueError, RuntimeError) as e:
                logger.debug("Failed to read %s: %s", state_blob_name, e)
                return None

            try:
                data = cast("dict[str, object]", json.loads(content))

                if service and data.get("service") != service:
                    return None

                shards = cast("list[dict[str, object]]", data.get("shards") or [])
                running = sum(1 for s in shards if s.get("status") == "running")
                pending = sum(1 for s in shards if s.get("status") == "pending")
                failed = sum(1 for s in shards if s.get("status") == "failed")
                # Derive status from shards so list view matches reality
                # (not stale top-level status)
                if running > 0:
                    effective_status = "running"
                elif pending > 0:
                    effective_status = "pending"
                elif failed > 0:
                    effective_status = "failed"
                else:
                    effective_status = "completed"

                return {
                    "deployment_id": cast(str, data.get("deployment_id", folder_name)),
                    "service": cast(str, data.get("service", "unknown")),
                    "compute_type": cast(str, data.get("compute_type", "unknown")),
                    "status": effective_status,
                    "created_at": cast(str, data.get("created_at") or ""),
                    "total_shards": cast(int, data.get("total_shards", 0)),
                    "progress": (
                        f"{len([s for s in shards if s.get('status') == 'succeeded'])}"
                        f"/{cast(int, data.get('total_shards', 0))}"
                    ),
                    "tag": cast("str | None", data.get("tag")),  # Human-readable description
                }
            except (ValueError, KeyError, TypeError, OSError) as e:
                logger.debug("Failed to fetch %s: %s", state_blob_name, e)
                return None

        # Fetch deployments in parallel (20 workers for faster fetching)
        deployments: list[dict[str, object]] = []
        with ThreadPoolExecutor(max_workers=20) as executor:
            futures: dict[Future[dict[str, object] | None], str] = {
                executor.submit(fetch_deployment, folder): folder for folder in valid_prefixes
            }
            for future in as_completed(futures):
                result = future.result()
                if result is not None:
                    deployments.append(result)

        # Sort by creation time (newest first)
        deployments.sort(key=lambda x: str(x.get("created_at") or ""), reverse=True)

        return deployments[:limit]

    def force_status(
        self,
        deployment_id: str,
        new_status: DeploymentStatus,
        shard_status: ShardStatus | None = None,
        reason: str = "Manual status override",
    ) -> DeploymentState:
        """
        Force a deployment and its shards to a specific status.

        This is useful for fixing stale deployments that are stuck in 'running'
        state when the underlying VMs/jobs have already terminated.

        Args:
            deployment_id: The deployment ID to update
            new_status: Target deployment status (COMPLETED, FAILED, CANCELLED)
            shard_status: Optional shard status to apply to non-terminal shards.
                         If None, defaults based on new_status:
                         - COMPLETED -> SUCCEEDED
                         - FAILED -> FAILED
                         - CANCELLED -> CANCELLED
            reason: Reason for the status override (stored in error_message)

        Returns:
            Updated DeploymentState

        Raises:
            ValueError: If deployment not found or invalid status transition
        """
        state = self.load_state(deployment_id)
        if not state:
            raise ValueError(f"Deployment {deployment_id} not found")

        # Determine shard status if not specified
        if shard_status is None:
            if new_status == DeploymentStatus.COMPLETED:
                shard_status = ShardStatus.SUCCEEDED
            elif new_status == DeploymentStatus.FAILED:
                shard_status = ShardStatus.FAILED
            elif new_status == DeploymentStatus.CANCELLED:
                shard_status = ShardStatus.CANCELLED
            else:
                raise ValueError(
                    f"Cannot force status to {new_status.value} - must be terminal status"
                )

        # Update all non-terminal shards
        # IMPORTANT: PENDING shards should NEVER be marked as SUCCEEDED
        # because they never ran, so they cannot have succeeded.
        # Similarly, RUNNING shards without verified GCS status should not be marked SUCCEEDED.
        now = datetime.now(UTC).isoformat()
        updated_count = 0

        for shard in state.shards:
            # Only update shards that are not already in a terminal state
            if shard.status in (ShardStatus.PENDING, ShardStatus.RUNNING):
                # Determine the appropriate status for this shard
                actual_shard_status = shard_status

                # SAFETY: Never mark PENDING shards as SUCCEEDED - they never ran
                if shard.status == ShardStatus.PENDING and shard_status == ShardStatus.SUCCEEDED:
                    actual_shard_status = ShardStatus.FAILED
                    shard.error_message = (
                        reason or "Marked as failed: shard was pending (never ran)"
                    )
                    logger.warning(
                        "Shard %s was PENDING but attempted to mark as SUCCEEDED"
                        " - marking as FAILED instead (shards that never ran cannot succeed)",
                        shard.shard_id,
                    )
                # SAFETY: RUNNING shards without job_id should not be marked SUCCEEDED
                elif (
                    shard.status == ShardStatus.RUNNING
                    and not shard.job_id
                    and shard_status == ShardStatus.SUCCEEDED
                ):
                    actual_shard_status = ShardStatus.FAILED
                    shard.error_message = reason or "Marked as failed: shard had no job_id"
                    logger.warning(
                        "Shard %s was RUNNING but had no job_id"
                        " - marking as FAILED instead of SUCCEEDED",
                        shard.shard_id,
                    )
                elif actual_shard_status in (ShardStatus.FAILED, ShardStatus.CANCELLED):
                    shard.error_message = reason

                shard.status = actual_shard_status
                shard.end_time = now
                updated_count += 1

        # Update overall deployment status
        old_status = state.status
        state.status = new_status
        state.updated_at = now

        # Save the updated state
        self.save_state(state)

        logger.info(
            "Force updated deployment %s: %s -> %s, %s shards updated to %s",
            deployment_id,
            old_status.value,
            new_status.value,
            updated_count,
            shard_status.value,
        )

        return state
