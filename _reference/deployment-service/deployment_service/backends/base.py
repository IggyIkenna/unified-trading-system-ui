"""
Abstract base class for compute backends.

All backends (Cloud Run, VM) implement this interface for consistent
deployment orchestration.
"""

from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, cast

if TYPE_CHECKING:
    from ..events import ShardEvent, VMEventType


class JobStatus(Enum):
    """Status of a deployed job/VM."""

    PENDING = "pending"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    UNKNOWN = "unknown"


@dataclass
class JobInfo:
    """Information about a deployed job or VM."""

    job_id: str
    shard_id: str
    status: JobStatus
    start_time: datetime | None = None
    end_time: datetime | None = None
    error_message: str | None = None
    logs_url: str | None = None
    metadata: dict[str, object] = field(default_factory=dict)

    @property
    def duration_seconds(self) -> float | None:
        """Calculate job duration in seconds."""
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary for serialization."""
        return {
            "job_id": self.job_id,
            "shard_id": self.shard_id,
            "status": self.status.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": self.duration_seconds,
            "error_message": self.error_message,
            "logs_url": self.logs_url,
            "metadata": self.metadata,
        }


class ComputeBackend(ABC):
    """
    Abstract base class for compute backends.

    Implementations:
    - CloudRunBackend: Triggers Cloud Run Jobs
    - VMBackend: Creates GCE VMs with Container-Optimized OS
    """

    def __init__(
        self,
        project_id: str,
        region: str,
        service_account_email: str,
    ):
        """
        Initialize the compute backend.

        Args:
            project_id: GCP project ID
            region: GCP region (e.g., "asia-northeast1")
            service_account_email: Service account for jobs/VMs
        """
        self.project_id = project_id
        self.region = region
        self.service_account_email = service_account_email

        # Optional event recorder — wire via set_event_recorder()
        self._event_recorder: Callable[[ShardEvent], None] | None = None
        self._current_deployment_id: str | None = None

    def set_event_recorder(
        self,
        deployment_id: str,
        recorder: Callable[["ShardEvent"], None],
    ) -> None:
        """Wire event recording for a deployment run (called by orchestrator)."""
        self._current_deployment_id = deployment_id
        self._event_recorder = recorder

    def _emit_event(
        self,
        shard_id: str,
        event_type: "VMEventType",
        message: str,
        metadata: dict[str, str] | None = None,
    ) -> None:
        """Emit a ShardEvent if a recorder is wired. No-op otherwise."""
        if self._event_recorder and self._current_deployment_id:
            from ..events import ShardEvent  # late import — events.py has no circular deps

            event = ShardEvent(
                deployment_id=self._current_deployment_id,
                shard_id=shard_id,
                event_type=event_type,
                message=message,
                metadata=metadata or {},
            )
            self._event_recorder(event)

    @property
    @abstractmethod
    def backend_type(self) -> str:
        """Return the backend type name (e.g., 'cloud_run', 'vm')."""
        pass

    @abstractmethod
    def deploy_shard(
        self,
        shard_id: str,
        docker_image: str,
        args: list[str],
        environment_variables: dict[str, str],
        compute_config: dict[str, object],
        labels: dict[str, str],
    ) -> JobInfo:
        """
        Deploy a single shard.

        Args:
            shard_id: Unique identifier for this shard
            docker_image: Docker image URL
            args: Command line arguments for the container
            environment_variables: Environment variables to set
            compute_config: Backend-specific compute configuration
            labels: Labels to apply to the job/VM

        Returns:
            JobInfo with job_id and initial status
        """
        pass

    @abstractmethod
    def get_status(self, job_id: str) -> JobInfo:
        """
        Get the current status of a job.

        Args:
            job_id: The job ID returned from deploy_shard

        Returns:
            JobInfo with current status
        """
        pass

    def get_status_with_context(
        self,
        job_id: str,
        *,
        deployment_id: str | None = None,
        shard_id: str | None = None,
    ) -> JobInfo:
        """
        Get job status, optionally providing deployment/shard context.

        Some backends (notably VMs) can use context to confirm completion even
        after the underlying resource self-deletes.
        """
        _ = deployment_id
        _ = shard_id
        return self.get_status(job_id)

    @abstractmethod
    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a running job.

        Args:
            job_id: The job ID to cancel

        Returns:
            True if cancellation was successful
        """
        pass

    @abstractmethod
    def get_logs_url(self, job_id: str) -> str:
        """
        Get the URL to view logs for a job.

        Args:
            job_id: The job ID

        Returns:
            URL to Cloud Logging or serial console
        """
        pass

    def deploy_shards(
        self,
        shards: list[dict[str, object]],
        docker_image: str,
        environment_variables: dict[str, str],
        compute_config: dict[str, object],
        labels: dict[str, str],
        parallelism: int = 10,
    ) -> list[JobInfo]:
        """
        Deploy multiple shards with parallelism control.

        Default implementation deploys sequentially.
        Subclasses can override for true parallel deployment.

        Args:
            shards: List of shard configurations
            docker_image: Docker image URL
            environment_variables: Environment variables to set
            compute_config: Backend-specific compute configuration
            labels: Labels to apply
            parallelism: Max concurrent jobs (for subclass override)

        Returns:
            List of JobInfo for all deployed shards
        """
        jobs = []
        for shard in shards:
            shard_id = cast(str, shard.get("shard_id", f"shard-{len(jobs)}"))
            args = cast("list[str]", shard.get("args") or [])

            job_info = self.deploy_shard(
                shard_id=shard_id,
                docker_image=docker_image,
                args=args,
                environment_variables=environment_variables,
                compute_config=compute_config,
                labels=labels,
            )
            jobs.append(job_info)

        return jobs
