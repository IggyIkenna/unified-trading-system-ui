"""
VM Lifecycle Management.

Handles VM creation, deletion, and cancellation operations for GCE VM backends.
Includes zone failover logic, error handling, and cleanup operations.
"""

import logging
import re
import time
from datetime import UTC, datetime
from typing import cast

from .._gcp_sdk import compute_v1
from ..base import JobInfo, JobStatus
from .vm_config import VMConfigManager, get_instances_client
from .vm_monitoring import VMMonitoringManager

logger = logging.getLogger(__name__)


class VMLifecycleManager:
    """Manages VM lifecycle operations including creation and deletion."""

    def __init__(
        self,
        project_id: str,
        region: str,
        service_account_email: str,
        zones: list[str],
        status_bucket: str | None = None,
        status_prefix: str = "deployments",
    ):
        """
        Initialize VM lifecycle manager.

        Args:
            project_id: GCP project ID
            region: GCP region
            service_account_email: Service account email for VMs
            zones: List of zones to try in order
            status_bucket: GCS bucket for status files
            status_prefix: Prefix for status files in bucket
        """
        self.project_id = project_id
        self.region = region
        self.service_account_email = service_account_email
        self.zones = zones
        self.status_bucket = status_bucket
        self.status_prefix = status_prefix

        self._instances_client = get_instances_client()
        self._config_manager = VMConfigManager(project_id, region)

        # Track job_id -> (deployment_id, shard_id, zone) for status lookups
        self._job_context: dict[str, tuple[str, str, str | None]] = {}

        # Round-robin zone tracking
        self._zone_index = 0  # Current position in zone rotation
        self._zone_exhaustion_counts: dict[str, int] = {}  # zone -> exhaustion count

    def get_next_zone_round_robin(self) -> str:
        """
        Get the next zone in round-robin rotation.

        Returns the next zone to try, cycling through all zones.
        """
        zone = self.zones[self._zone_index % len(self.zones)]
        self._zone_index += 1
        return zone

    def record_zone_exhaustion(self, zone: str) -> None:
        """
        Record a zone exhaustion event.

        Single-region mode: no region switching. Zone exhaustion counts
        are for logging/monitoring only.
        """
        self._zone_exhaustion_counts[zone] = self._zone_exhaustion_counts.get(zone, 0) + 1

    def get_zones_to_try(self) -> list[str]:
        """
        Get ordered list of zones to try for the next VM creation.

        Uses round-robin starting from current position, trying each zone once.
        """
        zones_to_try = []
        start_index = self._zone_index % len(self.zones)

        for i in range(len(self.zones)):
            zone_index = (start_index + i) % len(self.zones)
            zones_to_try.append(self.zones[zone_index])

        return zones_to_try

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

        Args:
            shard_id: Unique identifier for this shard
            docker_image: Docker image URL
            args: Command line arguments
            environment_variables: Environment variables
            compute_config: VM config (machine_type, disk_size_gb, preemptible)
            labels: Labels for the VM

        Returns:
            JobInfo with instance name
        """
        service_name = labels.get("service", "job")
        deployment_id = labels.get("deployment_id", datetime.now(UTC).strftime("%Y%m%d-%H%M%S"))

        instance_name = self._config_manager.generate_instance_name(service_name, shard_id)
        machine_type = cast(str, compute_config.get("machine_type", "c2-standard-4"))
        disk_size_gb = cast(int, compute_config.get("disk_size_gb", 50))
        preemptible = cast(
            bool, compute_config.get("preemptible", False)
        )  # Default False: PREEMPTIBLE_CPUS quota is only 16
        timeout_seconds = cast(int, compute_config.get("timeout_seconds", 0))
        self_delete = cast(bool, compute_config.get("self_delete", True))
        delete_batch_index = cast(int, compute_config.get("delete_batch_index", 0))
        delete_batch_delay_seconds = cast(int, compute_config.get("delete_batch_delay_seconds", 45))
        gcsfuse_buckets = cast("list[str] | None", compute_config.get("gcsfuse_buckets"))

        # Zone hint: if compute_config specifies a preferred zone, start zone iteration from there
        preferred_zone = cast("str | None", compute_config.get("zone"))
        if preferred_zone and preferred_zone in self.zones:
            self._zone_index = self.zones.index(preferred_zone)

        # When using GCS FUSE: filter out UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS,
        # add GCS_FUSE_MOUNT_PATH so UCS uses the mount
        use_gcs_fuse = bool(gcsfuse_buckets)
        if use_gcs_fuse:
            env_vars_for_container = {
                k: v
                for k, v in environment_variables.items()
                if k.upper() != "UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS"
            }
            env_vars_for_container["GCS_FUSE_MOUNT_PATH"] = "/mnt/gcs"
        else:
            env_vars_for_container = environment_variables

        logger.info("Creating VM %s for shard %s", instance_name, shard_id)
        logger.debug("Machine type: %s, Preemptible: %s", machine_type, preemptible)
        if use_gcs_fuse:
            assert gcsfuse_buckets is not None
            logger.info("GCS FUSE enabled: mounting %s buckets", len(gcsfuse_buckets))

        # Build environment flags for docker run
        env_flags = " ".join([f"-e {k}='{v}'" for k, v in env_vars_for_container.items()])
        args_string = " ".join(args)

        # Resolve gcsfuse bucket names (substitute project_id)
        gcsfuse_buckets_str = ""
        if use_gcs_fuse:
            assert gcsfuse_buckets is not None
            resolved_buckets = []
            for b in gcsfuse_buckets:
                name = (
                    str(b)
                    .replace("{project_id}", self.project_id)
                    .replace("${GCP_PROJECT_ID}", self.project_id)
                )
                if name and name not in resolved_buckets:
                    resolved_buckets.append(name)
            gcsfuse_buckets_str = " ".join(resolved_buckets)

        # Try each zone until success (single region, zone failover only)
        last_error = None
        successful_zone = None
        zones_tried = []

        # Get zones to try in round-robin order; advance index for next shard
        zones_to_try = self.get_zones_to_try()
        self._zone_index += 1

        for zone in zones_to_try:
            zones_tried.append(zone)

            # Prepare template context
            template_context: dict[str, object] = {
                "instance_name": instance_name,
                "project_id": self.project_id,
                "zone": zone,
                "registry_region": self._config_manager.extract_registry_region(docker_image),
                "docker_image": docker_image,
                "env_flags": env_flags,
                "args_string": args_string,
                "self_delete": self_delete,
                "status_path": self._config_manager.get_status_path(
                    self.status_bucket, self.status_prefix, deployment_id, shard_id
                ),
                "service_name": service_name,
                "shard_id": shard_id,
                "timeout_seconds": timeout_seconds,
                "delete_batch_index": delete_batch_index,
                "delete_batch_delay_seconds": delete_batch_delay_seconds,
            }

            if use_gcs_fuse:
                template_context["gcsfuse_buckets_str"] = gcsfuse_buckets_str

            # Generate cloud-init with current zone
            cloud_init = self._config_manager.render_cloud_init_template(
                template_context, use_gcs_fuse
            )

            # Build the instance configuration for this zone
            instance_labels = {
                "service": service_name,
                "shard-id": re.sub(r"[^a-z0-9-]", "-", shard_id.lower())[:63],
                "deployment-id": deployment_id[:63],
                **labels,
            }

            instance = self._config_manager.build_instance_config(
                instance_name=instance_name,
                zone=zone,
                machine_type=machine_type,
                disk_size_gb=disk_size_gb,
                service_account_email=self.service_account_email,
                cloud_init=cloud_init,
                labels=instance_labels,
                preemptible=preemptible,
                use_gcs_fuse=use_gcs_fuse,
            )

            # Retry with exponential backoff for rate limiting (403 rateLimitExceeded)
            max_retries = 3
            retry_delays = [10, 30, 60]  # seconds between retries

            for attempt in range(max_retries + 1):
                try:
                    # Create the instance
                    request = compute_v1.InsertInstanceRequest(
                        project=self.project_id,
                        zone=zone,
                        instance_resource=instance,
                    )
                    operation = self._instances_client.insert(request=request)
                    # Wait for operation to complete
                    operation.result()

                    logger.info(
                        "Created VM %s in zone %s for shard %s", instance_name, zone, shard_id
                    )
                    successful_zone = zone
                    break  # Success, exit retry loop

                except (OSError, ValueError, RuntimeError) as e:
                    error_str = str(e)
                    last_error = e

                    # Check for zone exhaustion - record and try next zone
                    if self._config_manager.is_zone_exhausted_error(error_str):
                        exhaustion_count = self._zone_exhaustion_counts.get(zone, 0) + 1
                        logger.warning(
                            "[ZONE_EXHAUSTED] Zone %s exhausted for shard %s"
                            " (exhaustion #%s for this zone), trying next zone. Error: %s",
                            zone,
                            shard_id,
                            exhaustion_count,
                            error_str[:200],
                        )
                        self.record_zone_exhaustion(zone)
                        break  # Exit retry loop, try next zone

                    # Check for regional quota (IP, CPU, SSD) - try next zone, no region switch
                    if self._config_manager.is_regional_quota_error(error_str):
                        quota_type = "unknown"
                        if "IN_USE_ADDRESSES" in error_str or "IP" in error_str.upper():
                            quota_type = "IP"
                        elif "C2_CPUS" in error_str:
                            quota_type = "C2_CPUS"
                        elif "CPUS" in error_str:
                            quota_type = "CPUS"
                        elif "SSD" in error_str:
                            quota_type = "SSD"

                        logger.warning(
                            "[REGIONAL_QUOTA_EXHAUSTED] %s quota exhausted in region %s"
                            " for shard %s, trying next zone. Error: %s",
                            quota_type,
                            self.region,
                            shard_id,
                            error_str[:200],
                        )
                        break  # Exit retry loop, try next zone

                    # Check for rate limit error (403 rateLimitExceeded)
                    if (
                        "rateLimitExceeded" in error_str
                        or "Rate Limit" in error_str
                        or ("403" in error_str and "limit" in error_str.lower())
                    ):
                        if attempt < max_retries:
                            delay = retry_delays[attempt]
                            logger.warning(
                                "[RATE_LIMITED] VM creation rate limited for shard %s,"
                                " retrying in %ss (attempt %s/%s)",
                                shard_id,
                                delay,
                                attempt + 1,
                                max_retries,
                            )
                            time.sleep(delay)
                            continue  # Retry same zone
                        else:
                            # Exhausted retries for rate limit - try next zone
                            logger.warning(
                                "[RATE_LIMITED] Rate limit persists in zone %s, trying next zone",
                                zone,
                            )
                            break  # Try next zone
                    else:
                        # Other error - re-raise to be handled below
                        raise

            if successful_zone:
                break  # Successfully created VM, exit zone loop

        # Check if we succeeded
        if successful_zone:
            # Track job context for status lookups (now includes zone)
            self._job_context[instance_name] = (
                deployment_id,
                shard_id,
                successful_zone,
            )

            return JobInfo(
                job_id=instance_name,
                shard_id=shard_id,
                status=JobStatus.RUNNING,
                start_time=datetime.now(UTC),
                logs_url=self._get_logs_url(instance_name, zone=successful_zone),
                metadata={
                    "instance_name": instance_name,
                    "zone": successful_zone,
                    "machine_type": machine_type,
                    "preemptible": preemptible,
                    "status_path": self._config_manager.get_status_path(
                        self.status_bucket, self.status_prefix, deployment_id, shard_id
                    ),
                },
            )

        # If we get here, all zones in region failed
        error_str = str(last_error) if last_error else "Unknown error"
        tried_zones = ", ".join(zones_tried)

        # Check for specific quota errors and provide clear messaging
        if "Quota" in error_str or "quota" in error_str:
            if "IN_USE_ADDRESSES" in error_str or "IP addresses" in error_str.lower():
                error_msg = (
                    f"[IP_QUOTA_EXCEEDED] Failed to create VM for shard {shard_id}: "
                    f"External IP address quota exhausted in region {self.region}. "
                    f"Tried zones: {tried_zones}. "
                    f"Too many concurrent VMs with external IPs. "
                    f"Wait for existing VMs to complete or request quota increase. "
                    f"Original error: {error_str}"
                )
            elif "CPUS" in error_str or "CPU" in error_str:
                error_msg = (
                    f"[CPU_QUOTA_EXCEEDED] Failed to create VM for shard {shard_id}: "
                    f"CPU quota exhausted in region {self.region}. "
                    f"Tried zones: {tried_zones}. "
                    f"Too many concurrent VMs or machine type too large. "
                    f"Wait for existing VMs to complete or request quota increase. "
                    f"Original error: {error_str}"
                )
            elif "SSD" in error_str or "DISK" in error_str:
                error_msg = (
                    f"[DISK_QUOTA_EXCEEDED] Failed to create VM for shard {shard_id}: "
                    f"SSD disk quota exhausted in region {self.region}. "
                    f"Tried zones: {tried_zones}. "
                    f"Too many concurrent VMs with large disks. "
                    f"Wait for existing VMs to complete or request quota increase. "
                    f"Original error: {error_str}"
                )
            else:
                error_msg = (
                    f"[QUOTA_EXCEEDED] Failed to create VM for shard {shard_id}: "
                    f"GCP quota exceeded in region {self.region}. "
                    f"Tried zones: {tried_zones}. "
                    f"Original error: {error_str}"
                )
        elif self._config_manager.is_zone_exhausted_error(error_str):
            error_msg = (
                f"[ALL_ZONES_EXHAUSTED] Failed to create VM for shard {shard_id}: "
                f"All zones in region {self.region} are resource exhausted. "
                f"Tried zones: {tried_zones}. "
                f"Wait for resources to free up or request quota increase. "
                f"Original error: {error_str}"
            )
        else:
            error_msg = (
                f"Failed to create VM for shard {shard_id} in any zone."
                f" Tried zones: {tried_zones}. Error: {error_str}"
            )

        logger.error(error_msg)
        return JobInfo(
            job_id=f"failed-{shard_id}",
            shard_id=shard_id,
            status=JobStatus.FAILED,
            error_message=error_msg,
        )

    def get_zone_for_job(self, job_id: str) -> str:
        """Get the zone for a job from context or try to find it."""
        if job_id in self._job_context:
            context = self._job_context[job_id]
            if len(context) >= 3 and context[2] is not None:
                return context[2]  # (deployment_id, shard_id, zone)
        return self.zones[0]  # Fallback to first zone

    def cancel_job(self, job_id: str, zone: str | None = None) -> bool:
        """
        Delete a VM to cancel the job.

        Tries all zones if the VM is not found in the expected zone.

        Args:
            job_id: The instance name
            zone: Known zone (from aggregatedList); if provided, try this first

        Returns:
            True if deletion was successful
        """
        # Try provided zone first, then expected zone, then all others
        zones_to_try = []
        if zone:
            zones_to_try.append(zone)
        zones_to_try.append(self.get_zone_for_job(job_id))
        zones_to_try.extend([z for z in self.zones if z not in zones_to_try])

        logger.warning("Cancelling VM %s - trying zones: %s", job_id, zones_to_try)

        errors = []
        for z in zones_to_try:
            try:
                request = compute_v1.DeleteInstanceRequest(
                    project=self.project_id,
                    zone=z,
                    instance=job_id,
                )
                operation = self._instances_client.delete(request=request)
                operation.result()
                logger.warning("Deleted VM %s in zone %s", job_id, z)
                return True
            except (OSError, ValueError, RuntimeError) as e:
                error_str = str(e)
                if "was not found" in error_str or "404" in error_str:
                    continue  # Try next zone
                else:
                    logger.warning("Error deleting VM %s in zone %s: %s", job_id, z, error_str)
                    errors.append(f"{z}: {error_str}")
                    continue

        if errors:
            logger.error("Failed to delete VM %s. Errors: %s", job_id, errors)
            return False  # Actually failed, not just "not found"

        logger.warning("VM %s not found in any zone (may have already been deleted)", job_id)
        return True  # Consider it a success if not found in any zone

    def cancel_job_fire_and_forget(self, job_id: str, zone: str | None = None) -> None:
        """
        Fire delete request and return immediately (no wait).
        Caller is charged until delete is initiated; this minimizes that window.

        Does not raise; logs errors only.
        """
        zones_to_try = []
        if zone:
            zones_to_try.append(zone)
        zones_to_try.append(self.get_zone_for_job(job_id))
        zones_to_try.extend([z for z in self.zones if z not in zones_to_try])

        for z in zones_to_try:
            try:
                request = compute_v1.DeleteInstanceRequest(
                    project=self.project_id,
                    zone=z,
                    instance=job_id,
                )
                self._instances_client.delete(request=request)
                logger.info("[FIRE_AND_FORGET] Delete initiated for %s (zone %s)", job_id, z)
                return
            except (OSError, ValueError, RuntimeError) as e:
                if "was not found" in str(e) or "404" in str(e):
                    continue
                logger.warning("[FIRE_AND_FORGET] %s zone %s: %s", job_id, z, e)
                continue
        logger.debug("[FIRE_AND_FORGET] %s not found in any zone", job_id)

    def cleanup_zombie_vms(self, deployment_id: str, shard_ids: list[str]) -> dict[str, bool]:
        """
        Detect and delete ZOMBIE VMs (failed to self-delete but marked in GCS).

        Args:
            deployment_id: Deployment ID to check
            shard_ids: List of shard IDs to check

        Returns:
            Dict mapping shard_id to cleanup success status
        """
        results = {}

        for shard_id in shard_ids:
            try:
                # Check if shard has ZOMBIE marker
                monitoring = VMMonitoringManager(
                    self.project_id, self.zones, self.status_bucket, self.status_prefix
                )

                gcs_status = monitoring.check_gcs_status(deployment_id, shard_id)
                if gcs_status != "ZOMBIE":
                    continue

                # Find the VM instance name (format: {service}-{shard_id}-{suffix})
                # Try to find it from job context first
                job_id = None
                for jid in self._job_context:
                    if self._job_context[jid][1] == shard_id:
                        job_id = jid
                        break

                if not job_id:
                    logger.warning("Could not find VM instance for zombie shard %s", shard_id)
                    results[shard_id] = False
                    continue

                # Try to delete the VM
                logger.warning("Attempting to cleanup ZOMBIE VM %s for shard %s", job_id, shard_id)
                success = self.cancel_job(job_id)
                results[shard_id] = success

                if success:
                    logger.warning("✅ Cleaned up ZOMBIE VM %s", job_id)
                else:
                    logger.warning(
                        "❌ Failed to cleanup ZOMBIE VM %s (may have already shut down)", job_id
                    )

            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Error cleaning up zombie for %s: %s", shard_id, e)
                results[shard_id] = False

        return results

    @property
    def job_context(self) -> dict[str, tuple[str, str, str | None]]:
        """Public accessor for job context mapping."""
        return self._job_context

    def get_logs_url(self, job_id: str, zone: str | None = None) -> str:
        """Public wrapper for logs URL generation."""
        return self._get_logs_url(job_id, zone)

    def _get_logs_url(self, job_id: str, zone: str | None = None) -> str:
        """
        Get the serial console URL for a VM.

        Args:
            job_id: The instance name
            zone: The zone where the VM is running (defaults to primary zone)

        Returns:
            URL to serial console
        """
        # Try to get zone from job context, fall back to provided zone or primary zone
        if job_id in self._job_context:
            context = self._job_context[job_id]
            if len(context) >= 3:
                zone = context[2]  # (deployment_id, shard_id, zone)
        zone = zone or self.zones[0]
        return (
            f"https://console.cloud.google.com/compute/instancesDetail/"
            f"zones/{zone}/instances/{job_id}?project={self.project_id}&tab=serialconsole"
        )

    def get_job_context(self, job_id: str) -> tuple[str, str, str | None] | None:
        """Get job context (deployment_id, shard_id, zone) for a job."""
        return self._job_context.get(job_id)

    def set_job_context(
        self, job_id: str, deployment_id: str, shard_id: str, zone: str | None = None
    ) -> None:
        """Set job context for external monitoring."""
        zone = zone or self.zones[0]
        self._job_context[job_id] = (deployment_id, shard_id, zone)
