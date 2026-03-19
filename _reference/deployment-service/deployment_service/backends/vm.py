"""
VM backend using Google Compute Engine - Thin Facade.

Creates VMs with Container-Optimized OS that run Docker containers.
VMs self-delete after completion.

This is the new modularized version that delegates to service modules.
"""

import logging

from ..events import VMEventType
from .base import ComputeBackend, JobInfo, JobStatus
from .services.vm_config import VMConfigManager
from .services.vm_lifecycle import VMLifecycleManager
from .services.vm_monitoring import VMMonitoringManager

logger = logging.getLogger(__name__)

# Suppress noisy urllib3 "Connection pool is full" warnings during high-concurrency deployments
# These warnings don't affect functionality - connections are just recreated
logging.getLogger("urllib3.connectionpool").setLevel(logging.ERROR)


class VMBackend(ComputeBackend):
    """
    GCE VM backend with Container-Optimized OS.

    Creates VMs that:
    1. Pull Docker image from Artifact Registry
    2. Run the container with specified args
    3. Write status to GCS on completion
    4. Self-delete after completion

    Supports round-robin zone rotation within a single region:
    - Zones are tried in round-robin order (3 retries per zone)
    - After exhausting all 3 zones (9 total attempts), fail the shard
    - Single region only (matches GCS bucket, avoids cross-region egress)
    """

    def __init__(
        self,
        project_id: str,
        region: str,
        service_account_email: str,
        zone: str | None = None,
        zones: list[str] | None = None,
        status_bucket: str | None = None,
        status_prefix: str = "deployments",
    ):
        """
        Initialize the VM backend.

        Args:
            project_id: GCP project ID
            region: GCP region (single region for zone failover)
            service_account_email: Service account for VMs
            zone: Primary GCP zone (defaults to region-a). Deprecated, use zones instead.
            zones: List of zones to try in order
                (e.g., ["asia-northeast1-a", "asia-northeast1-b", "asia-northeast1-c"]).
                If not provided, defaults to all zones in the region (a, b, c).
            status_bucket: GCS bucket for status files
            status_prefix: Prefix for status files in bucket
        """
        super().__init__(project_id, region, service_account_email)

        # Initialize configuration manager
        self._config_manager = VMConfigManager(project_id, region)

        # Build zones for current region
        if zones:
            self.zones = zones
        elif zone:
            # Single zone specified - use it as primary with fallback to others
            suffixes = self._config_manager.get_zone_suffixes(region)
            self.zones = [zone] + [
                f"{region}-{suffix}" for suffix in suffixes if f"{region}-{suffix}" != zone
            ]
        else:
            # Default: try all zones in the region
            self.zones = self._config_manager.get_zones_for_region(region)

        self.zone = self.zones[0]  # Primary zone
        self.status_bucket = status_bucket
        self.status_prefix = status_prefix

        # Initialize service managers
        self._lifecycle_manager = VMLifecycleManager(
            project_id=project_id,
            region=region,
            service_account_email=service_account_email,
            zones=self.zones,
            status_bucket=status_bucket,
            status_prefix=status_prefix,
        )

        self._monitoring_manager = VMMonitoringManager(
            project_id=project_id,
            zones=self.zones,
            status_bucket=status_bucket,
            status_prefix=status_prefix,
        )

    @property
    def backend_type(self) -> str:
        return "vm"

    @staticmethod
    def _classify_vm_error(err: str) -> VMEventType:
        """Map a VM error message to the most specific VMEventType."""
        lower = err.lower()
        if "zone" in lower and "exhaust" in lower:
            return VMEventType.VM_ZONE_UNAVAILABLE
        if "quota" in lower:
            return VMEventType.VM_QUOTA_EXHAUSTED
        if "preempt" in lower:
            return VMEventType.VM_PREEMPTED
        if "timeout" in lower:
            return VMEventType.VM_TIMEOUT
        if "oom" in lower or "out of memory" in lower:
            return VMEventType.CONTAINER_OOM
        return VMEventType.JOB_FAILED

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
        Create a VM to run the container for this shard.

        Supports multi-zone failover: if a zone is exhausted, tries other zones in the region.
        """
        job_info = self._lifecycle_manager.deploy_shard(
            shard_id=shard_id,
            docker_image=docker_image,
            args=args,
            environment_variables=environment_variables,
            compute_config=compute_config,
            labels=labels,
        )

        # Emit VM lifecycle events based on result
        if job_info.status == JobStatus.RUNNING:
            self._emit_event(
                shard_id,
                VMEventType.JOB_STARTED,
                f"VM created: {job_info.job_id}",
                {"instance": job_info.job_id, "region": self.region},
            )
        elif job_info.status == JobStatus.FAILED:
            err = job_info.error_message or ""
            self._emit_event(
                shard_id,
                self._classify_vm_error(err),
                err[:300] if err else "VM deployment failed",
                {"region": self.region},
            )

        return job_info

    def get_status_with_context(
        self,
        job_id: str,
        *,
        deployment_id: str | None = None,
        shard_id: str | None = None,
    ) -> JobInfo:
        """
        Get the current status of a VM, using deployment/shard context when provided.

        This prevents false failures when a VM self-deletes and we need to confirm
        the final outcome via the GCS status marker.
        """
        job_context = self._lifecycle_manager.job_context
        return self._monitoring_manager.get_status_with_context(
            job_id=job_id,
            job_context=job_context,
            deployment_id=deployment_id,
            shard_id=shard_id,
        )

    def get_status(self, job_id: str) -> JobInfo:
        """
        Get the current status of a VM.

        Checks both VM status and GCS status file (if VM self-deleted).
        Tries all zones if the VM is not found in the expected zone.
        """
        job_context = self._lifecycle_manager.job_context
        return self._monitoring_manager.get_status(job_id, job_context)

    def cancel_job(self, job_id: str, zone: str | None = None) -> bool:
        """
        Delete a VM to cancel the job.

        Tries all zones if the VM is not found in the expected zone.
        """
        return self._lifecycle_manager.cancel_job(job_id, zone)

    def cancel_job_fire_and_forget(self, job_id: str, zone: str | None = None) -> None:
        """
        Fire delete request and return immediately (no wait).
        Caller is charged until delete is initiated; this minimizes that window.

        Does not raise; logs errors only.
        """
        return self._lifecycle_manager.cancel_job_fire_and_forget(job_id, zone)

    def cleanup_zombie_vms(self, deployment_id: str, shard_ids: list[str]) -> dict[str, bool]:
        """
        Detect and delete ZOMBIE VMs (failed to self-delete but marked in GCS).
        """
        return self._lifecycle_manager.cleanup_zombie_vms(deployment_id, shard_ids)

    def get_logs_url(self, job_id: str, zone: str | None = None) -> str:
        """
        Get the serial console URL for a VM.
        """
        return self._lifecycle_manager.get_logs_url(job_id, zone)
