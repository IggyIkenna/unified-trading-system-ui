"""
VM Monitoring and Status Management.

Handles VM status checking, health monitoring, and GCS status verification
for GCE VM backends.
"""

import logging
from datetime import UTC, datetime

from unified_trading_library import get_storage_client

from .._gcp_sdk import compute_v1
from ..base import JobInfo, JobStatus
from .vm_config import get_instances_client

logger = logging.getLogger(__name__)


class VMMonitoringManager:
    """Manages VM status monitoring and health checks."""

    def __init__(
        self,
        project_id: str,
        zones: list[str],
        status_bucket: str | None = None,
        status_prefix: str = "deployments",
    ):
        """
        Initialize VM monitoring manager.

        Args:
            project_id: GCP project ID
            zones: List of zones to check for VMs
            status_bucket: GCS bucket for status files
            status_prefix: Prefix for status files in bucket
        """
        self.project_id = project_id
        self.zones = zones
        self.status_bucket = status_bucket
        self.status_prefix = status_prefix

        self._instances_client = get_instances_client()

    def get_status_with_context(
        self,
        job_id: str,
        job_context: dict[str, tuple[str, str, str | None]] | None = None,
        *,
        deployment_id: str | None = None,
        shard_id: str | None = None,
    ) -> JobInfo:
        """
        Get the current status of a VM, using deployment/shard context when provided.

        This prevents false failures when a VM self-deletes and we need to confirm
        the final outcome via the GCS status marker.
        """
        # Create temporary context if needed
        temp_context = {}
        if deployment_id and shard_id and job_context is not None and job_id not in job_context:
            # Ensure we can resolve GCS status even if this backend instance did not
            # create the VM (e.g., fresh process during monitoring).
            temp_context[job_id] = (deployment_id, shard_id, self.zones[0])

        combined_context = {**(job_context or {}), **temp_context}
        return self.get_status(job_id, combined_context)

    def get_status(
        self, job_id: str, job_context: dict[str, tuple[str, str, str | None]] | None = None
    ) -> JobInfo:
        """
        Get the current status of a VM.

        Checks both VM status and GCS status file (if VM self-deleted).
        Tries all zones if the VM is not found in the expected zone.

        Args:
            job_id: The instance name
            job_context: Optional job context dict for GCS status lookup

        Returns:
            JobInfo with current status
        """
        # Try the expected zone first, then all others
        zones_to_try = [self._get_zone_for_job(job_id, job_context)]
        zones_to_try.extend([z for z in self.zones if z not in zones_to_try])

        for zone in zones_to_try:
            try:
                request = compute_v1.GetInstanceRequest(
                    project=self.project_id,
                    zone=zone,
                    instance=job_id,
                )
                instance = self._instances_client.get(request=request)
                shard_id = instance.labels.get("shard-id", "unknown")
                deployment_id = instance.labels.get("deployment-id", "unknown")

                # Map VM status to JobStatus
                vm_status = instance.status
                if vm_status == "RUNNING":
                    # VM may have finished job and be waiting in staggered delete queue
                    # Check GCS first - if SUCCESS, job is done (VM will self-delete soon)
                    gcs_status = self.check_gcs_status(deployment_id, shard_id)
                    if gcs_status == "SUCCESS":
                        status = JobStatus.SUCCEEDED
                    elif gcs_status == "FAILED" or gcs_status == "ZOMBIE":
                        status = JobStatus.FAILED
                    else:
                        status = JobStatus.RUNNING
                elif vm_status == "STAGING":
                    status = JobStatus.PENDING
                elif vm_status in ("TERMINATED", "STOPPED"):
                    # VM stopped - check GCS status file to determine actual outcome
                    # TERMINATED can mean: completed, preempted, or crashed
                    gcs_status = self.check_gcs_status(deployment_id, shard_id)
                    if gcs_status == "SUCCESS":
                        status = JobStatus.SUCCEEDED
                    elif gcs_status == "FAILED":
                        status = JobStatus.FAILED
                    elif gcs_status == "ZOMBIE":
                        # VM failed to self-delete but left a marker
                        status = JobStatus.FAILED
                    else:
                        # No status file yet - job might still be finishing or was preempted
                        status = JobStatus.RUNNING  # Treat as still running until confirmed
                else:
                    status = JobStatus.UNKNOWN

                return JobInfo(
                    job_id=job_id,
                    shard_id=shard_id,
                    status=status,
                    logs_url=self._get_logs_url(job_id, zone=zone),
                    metadata={
                        "vm_status": vm_status,
                        "zone": zone,
                    },
                )
            except (OSError, ValueError, RuntimeError) as e:
                if "was not found" in str(e) or "404" in str(e):
                    continue  # Try next zone
                # Other error - log and continue
                logger.debug("Error checking zone %s for %s: %s", zone, job_id, e)
                continue

        # VM not found in any zone - might have been deleted (self-delete on completion)
        # Check GCS for status using cached context
        if job_context and job_id in job_context:
            context = job_context[job_id]
            deployment_id = context[0]
            shard_id = context[1]
            gcs_status = self.check_gcs_status(deployment_id, shard_id)
            if gcs_status == "SUCCESS":
                return JobInfo(
                    job_id=job_id,
                    shard_id=shard_id,
                    status=JobStatus.SUCCEEDED,
                    end_time=datetime.now(UTC),
                )
            elif gcs_status == "FAILED":
                return JobInfo(
                    job_id=job_id,
                    shard_id=shard_id,
                    status=JobStatus.FAILED,
                    end_time=datetime.now(UTC),
                    error_message="Job failed (from GCS status)",
                )
            elif gcs_status == "ZOMBIE":
                # VM failed to self-delete but marked itself as zombie before shutdown
                return JobInfo(
                    job_id=job_id,
                    shard_id=shard_id,
                    status=JobStatus.FAILED,
                    end_time=datetime.now(UTC),
                    error_message="VM failed to self-delete (ZOMBIE marker found)",
                )
            else:
                # No status file - VM deleted without confirmation (preempted?)
                return JobInfo(
                    job_id=job_id,
                    shard_id=shard_id,
                    status=JobStatus.FAILED,
                    end_time=datetime.now(UTC),
                    error_message="VM deleted without status confirmation (possibly preempted)",
                )

        # Fallback to search-based lookup
        return self._get_status_from_gcs(job_id)

    def check_gcs_status(self, deployment_id: str, shard_id: str) -> str | None:
        """
        Check GCS for status file written by VM on completion.

        Uses storage facade (FUSE) when available for faster reads.

        Returns:
            "SUCCESS", "FAILED", "ZOMBIE", or None if no status file exists
        """
        if not self.status_bucket:
            return None

        blob_path = f"{self.status_prefix}/{deployment_id}/{shard_id}/status"

        try:
            client = get_storage_client(project_id=self.project_id)
            bucket = client.bucket(self.status_bucket)
            blob = bucket.blob(blob_path)

            if not blob.exists():
                return None

            content = blob.download_as_string().decode("utf-8").strip()
            # Format: SUCCESS:timestamp or FAILED:timestamp or ZOMBIE:timestamp:reason
            status_part = content.split(":")[0]

            # Log ZOMBIE status for visibility
            if status_part == "ZOMBIE":
                logger.warning(
                    "VM %s marked as ZOMBIE (failed to self-delete): %s", shard_id, content
                )

            return status_part  # "SUCCESS", "FAILED", or "ZOMBIE"
        except (OSError, ValueError, KeyError):
            return None

    def _get_status_from_gcs(self, job_id: str) -> JobInfo:
        """
        Check GCS for status file after VM self-deleted.

        The status file contains: SUCCESS:timestamp or FAILED:timestamp
        """
        # Try to extract deployment_id and shard_id from job_id
        # job_id format: {service}-{shard}-{suffix}
        # We need to look up the status file, but without deployment_id we can't
        # So we'll search for any matching status file or return UNKNOWN

        if not self.status_bucket:
            # No status bucket configured - can't verify, assume FAILED (not success!)
            # This is safer than assuming success - we should never mark succeeded
            # without confirmation
            logger.warning(
                "No status bucket configured, cannot verify VM %s completion - marking as FAILED",
                job_id,
            )
            return JobInfo(
                job_id=job_id,
                shard_id="unknown",
                status=JobStatus.FAILED,
                end_time=datetime.now(UTC),
                error_message="VM deleted, no status bucket configured to verify completion",
            )

        try:
            client = get_storage_client(project_id=self.project_id)
            bucket = client.bucket(self.status_bucket)

            # Search for status files that might match this job
            prefix = f"{self.status_prefix}/"
            blobs = list(bucket.list_blobs(prefix=prefix, max_results=1000))

            # Look for any status file containing this job_id or partial match
            for blob in blobs:
                if blob.name.endswith("/status") and job_id[:20] in blob.name:
                    content = blob.download_as_string().decode("utf-8").strip()
                    status_part = content.split(":")[0]
                    if status_part == "SUCCESS":
                        return JobInfo(
                            job_id=job_id,
                            shard_id="unknown",
                            status=JobStatus.SUCCEEDED,
                            end_time=datetime.now(UTC),
                            metadata={"status_path": blob.name},
                        )
                    elif status_part == "FAILED":
                        return JobInfo(
                            job_id=job_id,
                            shard_id="unknown",
                            status=JobStatus.FAILED,
                            end_time=datetime.now(UTC),
                            metadata={"status_path": blob.name},
                        )

            # No status file found - VM might have been preempted before writing status
            logger.warning("No status file found for deleted VM %s", job_id)
            return JobInfo(
                job_id=job_id,
                shard_id="unknown",
                status=JobStatus.FAILED,  # Assume failure if no status confirmation
                end_time=datetime.now(UTC),
                error_message="VM deleted without status confirmation (possibly preempted)",
            )
        except (OSError, ValueError, RuntimeError) as e:
            return JobInfo(
                job_id=job_id,
                shard_id="unknown",
                status=JobStatus.UNKNOWN,
                error_message=str(e),
            )

    def _get_zone_for_job(
        self, job_id: str, job_context: dict[str, tuple[str, str, str | None]] | None = None
    ) -> str:
        """Get the zone for a job from context or try to find it."""
        if job_context and job_id in job_context:
            context = job_context[job_id]
            if len(context) >= 3 and context[2] is not None:
                return context[2]  # (deployment_id, shard_id, zone)
        return self.zones[0]  # Fallback to primary zone

    def _get_logs_url(self, job_id: str, zone: str | None = None) -> str:
        """
        Get the serial console URL for a VM.

        Args:
            job_id: The instance name
            zone: The zone where the VM is running (defaults to primary zone)

        Returns:
            URL to serial console
        """
        zone = zone or self.zones[0]
        return (
            f"https://console.cloud.google.com/compute/instancesDetail/"
            f"zones/{zone}/instances/{job_id}?project={self.project_id}&tab=serialconsole"
        )
