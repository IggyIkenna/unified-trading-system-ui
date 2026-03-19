"""
VM Configuration Management.

Handles VM configuration templates, image resolution, instance naming,
and zone management for GCE VM backends.
"""

import logging
import re
import uuid

from jinja2 import Template
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from deployment_service.deployment_config import DeploymentConfig as _DeploymentConfig

from .._gcp_sdk import (
    compute_v1,
    google_auth_default,
    google_auth_requests,
    images_transports,
    instances_transports,
)

_vm_config = _DeploymentConfig()
logger = logging.getLogger(__name__)

# Connection pool size for Compute Engine API (default 200, configurable via env var)
# This prevents "Connection pool is full" warnings during high-concurrency VM operations
COMPUTE_POOL_SIZE = _vm_config.compute_pool_size
COMPUTE_POOL_MAXSIZE = _vm_config.compute_pool_maxsize

# Patch requests default adapter pool size for SDK internals
_original_adapter_init = HTTPAdapter.__init__


def _patched_adapter_init(
    self, pool_connections=COMPUTE_POOL_SIZE, pool_maxsize=COMPUTE_POOL_SIZE, **kwargs
):
    """Patched HTTPAdapter init with larger default pool sizes."""
    _original_adapter_init(
        self, pool_connections=pool_connections, pool_maxsize=pool_maxsize, **kwargs
    )


HTTPAdapter.__init__ = _patched_adapter_init

# Singleton storage for compute clients with larger connection pools
_instances_client: compute_v1.InstancesClient | None = None
_images_client: compute_v1.ImagesClient | None = None
_authorized_session: google_auth_requests.AuthorizedSession | None = None


def _get_authorized_session() -> google_auth_requests.AuthorizedSession:
    """Get or create an AuthorizedSession with a larger connection pool."""
    global _authorized_session
    if _authorized_session is None:
        # Get default credentials
        credentials, _project = google_auth_default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        # Create an AuthorizedSession
        _authorized_session = google_auth_requests.AuthorizedSession(credentials)

        # Configure the underlying requests session with larger connection pool
        adapter = HTTPAdapter(
            pool_connections=COMPUTE_POOL_SIZE,
            pool_maxsize=COMPUTE_POOL_MAXSIZE,
            max_retries=Retry(total=3, backoff_factor=0.5),
        )
        _authorized_session.mount("https://", adapter)
        _authorized_session.mount("http://", adapter)

        logger.info(
            "[COMPUTE_CLIENT] Created AuthorizedSession with pool_size=%s", COMPUTE_POOL_SIZE
        )
    return _authorized_session


def get_instances_client() -> compute_v1.InstancesClient:
    """Get a singleton InstancesClient with larger connection pool."""
    global _instances_client
    if _instances_client is None:
        # Create REST transport with our custom authorized session
        session = _get_authorized_session()
        transport = instances_transports.InstancesRestTransport(
            credentials=session.credentials,
            host="compute.googleapis.com",
        )
        _instances_client = compute_v1.InstancesClient(transport=transport)
        logger.info(
            "[COMPUTE_CLIENT] Created InstancesClient with custom transport (pool_size=%s)",
            COMPUTE_POOL_SIZE,
        )
    return _instances_client


def get_images_client() -> compute_v1.ImagesClient:
    """Get a singleton ImagesClient with larger connection pool."""
    global _images_client
    if _images_client is None:
        # Create REST transport with our custom authorized session
        session = _get_authorized_session()
        transport = images_transports.ImagesRestTransport(
            credentials=session.credentials,
            host="compute.googleapis.com",
        )
        _images_client = compute_v1.ImagesClient(transport=transport)
        logger.info(
            "[COMPUTE_CLIENT] Created ImagesClient with custom transport (pool_size=%s)",
            COMPUTE_POOL_SIZE,
        )
    return _images_client


# Cloud-init template for Container-Optimized OS
CLOUD_INIT_TEMPLATE = """#cloud-config
#
# Cloud-init configuration for Container-Optimized OS
# Runs a Docker container and self-deletes on completion
#
# Suppress "Failed to wait for network. No network activator found" on COS
#

write_files:
  - path: /etc/cloud/cloud.cfg.d/99-disable-network-activation.cfg
    permissions: "0644"
    content: |
      disable_network_activation: true

  - path: /etc/systemd/system/job-runner.service
    permissions: "0644"
    owner: root:root
    content: |
      [Unit]
      Description=Container Job Runner - {{ service_name }}
      Requires=docker.service
      After=docker.service network-online.target
      Wants=network-online.target

      [Service]
      Type=oneshot
      RemainAfterExit=yes
      Environment="HOME=/var/tmp"

      # Configure Docker credential helper for Artifact Registry
      ExecStartPre=/usr/bin/docker-credential-gcr configure-docker --registries={{ registry_region }}-docker.pkg.dev

      # Pull the container image
      ExecStartPre=/usr/bin/docker pull {{ docker_image }}

      # Run the container (no --rm so we can capture logs after exit)
      # CRITICAL: Do NOT add --dns with public DNS servers. Public DNS does not resolve
      # metadata.google.internal (GCE-internal hostname). Containers need it for ADC,
      # Secret Manager, gRPC auth. See tests/unit/test_docker_dns_validation.py
      ExecStart=/usr/bin/docker run --name job-container \\
        -e GCP_PROJECT_ID={{ project_id }} \\
        -e PYTHONUNBUFFERED=1 \\
        {{ env_flags }} \\
        {{ docker_image }} \\
        {{ args_string }}

      # Standard output to journal (visible in serial console and Cloud Logging)
      StandardOutput=journal+console
      StandardError=journal+console

      # Long timeout for batch jobs (12 hours default)
      {% if timeout_seconds > 0 %}
      TimeoutStartSec={{ timeout_seconds }}
      {% else %}
      TimeoutStartSec=43200
      {% endif %}

      [Install]
      WantedBy=multi-user.target

runcmd:
  - echo "========================================"
  - echo "VM Startup - {{ service_name }}"
  - echo "Instance - {{ instance_name }}"
  - echo "Shard - {{ shard_id }}"
  - echo "Image - {{ docker_image }}"
  - echo "========================================"

  - systemctl daemon-reload
  - systemctl enable job-runner.service

  # nohup ensures cleanup survives cloud-init exit (fixes VM self-delete)
  - |
    nohup sh -c '
      echo "Starting job-runner service..."
      systemctl start job-runner.service

      if systemctl is-active job-runner.service >/dev/null 2>&1; then
        echo "SUCCESS: Job completed successfully"
        STATUS="SUCCESS"
      else
        echo "FAILED: Job failed"
        STATUS="FAILED"
      fi

      {% if status_path %}
      GCS_TOKEN=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" \\
        "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" \\
        | python3 -c "import sys, json; print(json.load(sys.stdin)[\"access_token\"])")
      GCS_BUCKET=$(echo "{{ status_path }}" | sed "s|gs://||" | cut -d"/" -f1)
      STATUS_OBJECT=$(echo "{{ status_path }}" | sed "s|gs://[^/]*/||")
      LOGS_OBJECT=$(echo "$STATUS_OBJECT" | sed "s|/status$|/logs.txt|")
      echo "Capturing Docker container logs..."
      docker logs job-container > /tmp/job_logs.txt 2>&1 || echo "No logs available" > /tmp/job_logs.txt
      docker rm job-container 2>/dev/null || true
      curl -s --max-time 120 -X POST -H "Authorization: Bearer $GCS_TOKEN" -H "Content-Type: text/plain" --data-binary @/tmp/job_logs.txt "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$LOGS_OBJECT" && echo "Logs uploaded" || echo "Failed to upload logs"
      echo "Writing status to GCS: {{ status_path }}"
      TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
      curl -s --max-time 60 -X POST -H "Authorization: Bearer $GCS_TOKEN" -H "Content-Type: text/plain" --data "$STATUS:$TIMESTAMP" "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$STATUS_OBJECT" && echo "Status written" || echo "Failed to write status"
      {% endif %}

      {% if self_delete %}
      sleep $(( {{ delete_batch_index | default(0) }} * {{ delete_batch_delay_seconds | default(45) }} ))
      echo "Self-deleting VM: {{ instance_name }}"
      ACCESS_TOKEN=""
      for token_attempt in 1 2 3; do
        TOKEN_RESPONSE=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" 2>&1)
        if [ $? -eq 0 ] && [ -n "$TOKEN_RESPONSE" ]; then
          ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get(\"access_token\", \"\"))" 2>/dev/null)
          [ -n "$ACCESS_TOKEN" ] && break
        fi
        [ "$token_attempt" -lt 3 ] && sleep 5
      done

      if [ -z "$ACCESS_TOKEN" ]; then
        echo "CRITICAL: Failed to retrieve access token - cannot self-delete"
        {% if status_path %}
        [ -n "$GCS_TOKEN" ] && curl -s --max-time 60 -X POST -H "Authorization: Bearer $GCS_TOKEN" -H "Content-Type: text/plain" --data "ZOMBIE:$(date -u +%Y-%m-%dT%H:%M:%SZ):token_failed" "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$STATUS_OBJECT" || true
        {% endif %}
        sleep 30 && sudo poweroff
      else
        DELETED=0
        for i in 1 2 3 4 5 6 7 8 9 10; do
          HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" "https://compute.googleapis.com/compute/v1/projects/{{ project_id }}/zones/{{ zone }}/instances/{{ instance_name }}")
          if [ "$HTTP" = "200" ] || [ "$HTTP" = "204" ]; then
            echo "VM deletion initiated"
            DELETED=1
            break
          fi
          [ "$i" -lt 10 ] && sleep $((15 + i * 10))
        done
        if [ "$DELETED" -eq 0 ]; then
          {% if status_path %}
          [ -n "$GCS_TOKEN" ] && curl -s --max-time 60 -X POST -H "Authorization: Bearer $GCS_TOKEN" -H "Content-Type: text/plain" --data "ZOMBIE:$(date -u +%Y-%m-%dT%H:%M:%SZ):deletion_failed" "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$STATUS_OBJECT" || true
          {% endif %}
          sleep 30 && sudo poweroff
        fi
      fi
      {% endif %}
    ' >> /var/log/job-completion.log 2>&1 &
"""

# Cloud-init for Ubuntu + GCS FUSE (used when gcsfuse_buckets is in compute_config)
# Mounts GCS buckets at /mnt/gcs/{bucket}, bind-mounts into container for faster parquet reads
CLOUD_INIT_GCSFUSE_TEMPLATE = """#cloud-config
# Ubuntu 22.04 with GCS FUSE - mount buckets before running container
# Requires: gcsfuse_buckets in compute_config (space-separated bucket names)

package_update: true
package_upgrade: false

packages:
  - ca-certificates
  - curl
  - fuse
  - lsb-release

write_files:
  - path: /opt/setup-gcsfuse.sh
    permissions: "0755"
    content: |
      #!/bin/bash
      set -e
      export GCSFUSE_REPO=gcsfuse-$(lsb_release -c -s)
      curl -sS https://packages.cloud.google.com/apt/doc/apt-key.gpg | gpg --dearmor -o /usr/share/keyrings/cloud.google.gpg
      echo "deb [signed-by=/usr/share/keyrings/cloud.google.gpg] https://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list
      apt-get update && apt-get install -y gcsfuse

      mkdir -p /mnt/gcs
      for bucket in {{ gcsfuse_buckets_str }}; do
        mount_point="/mnt/gcs/$bucket"
        mkdir -p "$mount_point"
        if ! mountpoint -q "$mount_point"; then
          # Limit caches to prevent OOM on heavy workloads (6 mounts × unbounded cache = memory spike)
          gcsfuse --implicit-dirs --foreground=false --stat-cache-max-size-mb 16 --type-cache-max-size-mb 2 --metadata-cache-ttl-secs 30 "$bucket" "$mount_point" &
          sleep 5
        fi
      done
      wait

  - path: /etc/systemd/system/job-runner.service
    permissions: "0644"
    owner: root:root
    content: |
      [Unit]
      Description=Container Job Runner - {{ service_name }}
      Requires=docker.service
      After=docker.service network-online.target
      Wants=network-online.target

      [Service]
      Type=oneshot
      RemainAfterExit=yes
      Environment="HOME=/var/tmp"
      Environment="GCS_FUSE_MOUNT_PATH=/mnt/gcs"

      ExecStartPre=/usr/bin/docker-credential-gcr configure-docker --registries={{ registry_region }}-docker.pkg.dev
      ExecStartPre=/usr/bin/docker pull {{ docker_image }}

      # CRITICAL: Do NOT add --dns with public DNS servers. Public DNS does not resolve
      # metadata.google.internal (GCE-internal hostname). Containers need it for ADC,
      # Secret Manager, gRPC auth. See tests/unit/test_docker_dns_validation.py
      ExecStart=/usr/bin/docker run --name job-container \\
        -v /mnt/gcs:/mnt/gcs \\
        -e GCP_PROJECT_ID={{ project_id }} \\
        -e PYTHONUNBUFFERED=1 \\
        -e GCS_FUSE_MOUNT_PATH=/mnt/gcs \\
        {{ env_flags }} \\
        {{ docker_image }} \\
        {{ args_string }}

      StandardOutput=journal+console
      StandardError=journal+console
      {% if timeout_seconds > 0 %}
      TimeoutStartSec={{ timeout_seconds }}
      {% else %}
      TimeoutStartSec=43200
      {% endif %}

      [Install]
      WantedBy=multi-user.target

runcmd:
  # Disable unattended-upgrades to prevent OOM (Ubuntu runs apt in background, competes with job)
  - systemctl stop unattended-upgrades 2>/dev/null || true
  - systemctl disable unattended-upgrades 2>/dev/null || true
  - /opt/setup-gcsfuse.sh
  - systemctl daemon-reload
  - systemctl enable job-runner.service

  # nohup ensures cleanup survives cloud-init exit (fixes VM self-delete)
  - |
    nohup sh -c '
      echo "Starting job-runner service..."
      systemctl start job-runner.service

      if systemctl is-active job-runner.service >/dev/null 2>&1; then
        echo "SUCCESS: Job completed successfully"
        STATUS="SUCCESS"
      else
        echo "FAILED: Job failed"
        STATUS="FAILED"
      fi

      {% if status_path %}
      GCS_TOKEN=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" | python3 -c "import sys, json; print(json.load(sys.stdin)[\"access_token\"])")
      GCS_BUCKET=$(echo "{{ status_path }}" | sed "s|gs://||" | cut -d"/" -f1)
      STATUS_OBJECT=$(echo "{{ status_path }}" | sed "s|gs://[^/]*/||")
      LOGS_OBJECT=$(echo "$STATUS_OBJECT" | sed "s|/status$|/logs.txt|")
      docker logs job-container > /tmp/job_logs.txt 2>&1 || echo "No logs available" > /tmp/job_logs.txt
      docker rm job-container 2>/dev/null || true
      curl -s --max-time 120 -X POST -H "Authorization: Bearer $GCS_TOKEN" -H "Content-Type: text/plain" --data-binary @/tmp/job_logs.txt "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$LOGS_OBJECT" && echo "Logs uploaded" || true
      TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
      curl -s --max-time 60 -X POST -H "Authorization: Bearer $GCS_TOKEN" -H "Content-Type: text/plain" --data "$STATUS:$TIMESTAMP" "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$STATUS_OBJECT" && echo "Status written" || true
      {% endif %}

      {% if self_delete %}
      sleep $(( {{ delete_batch_index | default(0) }} * {{ delete_batch_delay_seconds | default(45) }} ))
      echo "Self-deleting VM: {{ instance_name }}"
      ACCESS_TOKEN=""
      for token_attempt in 1 2 3; do
        TOKEN_RESPONSE=$(curl -s --max-time 30 -H "Metadata-Flavor: Google" "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token" 2>&1)
        if [ $? -eq 0 ] && [ -n "$TOKEN_RESPONSE" ]; then
          ACCESS_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get(\"access_token\", \"\"))" 2>/dev/null)
          [ -n "$ACCESS_TOKEN" ] && break
        fi
        [ "$token_attempt" -lt 3 ] && sleep 5
      done

      if [ -n "$ACCESS_TOKEN" ]; then
        DELETED=0
        for i in 1 2 3 4 5 6 7 8 9 10; do
          HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 60 -X DELETE -H "Authorization: Bearer $ACCESS_TOKEN" "https://compute.googleapis.com/compute/v1/projects/{{ project_id }}/zones/{{ zone }}/instances/{{ instance_name }}")
          if [ "$HTTP" = "200" ] || [ "$HTTP" = "204" ]; then
            DELETED=1
            break
          fi
          [ "$i" -lt 10 ] && sleep $((15 + i * 10))
        done
      else
        DELETED=0
      fi

      if [ "$DELETED" -eq 0 ]; then
        {% if status_path %}
        [ -n "$GCS_TOKEN" ] && curl -s --max-time 60 -X POST -H "Authorization: Bearer $GCS_TOKEN" -H "Content-Type: text/plain" --data "ZOMBIE:$(date -u +%Y-%m-%dT%H:%M:%SZ):deletion_failed" "https://storage.googleapis.com/upload/storage/v1/b/$GCS_BUCKET/o?uploadType=media&name=$STATUS_OBJECT" || true
        {% endif %}
        sleep 30 && sudo poweroff
      fi
      {% endif %}
    ' >> /var/log/job-completion.log 2>&1 &
"""


class VMConfigManager:
    """Manages VM configuration, templates, and metadata."""

    # Zone suffixes per region (asia-northeast1 has a, b, c)
    REGION_ZONE_SUFFIXES = {
        "asia-northeast1": ["b", "c", "a"],
    }
    DEFAULT_ZONE_SUFFIXES = ["b", "c", "a"]  # Fallback for unknown regions

    def __init__(self, project_id: str, region: str):
        """
        Initialize VM configuration manager.

        Args:
            project_id: GCP project ID
            region: GCP region
        """
        self.project_id = project_id
        self.region = region
        self._cloud_init_template: Template = Template(CLOUD_INIT_TEMPLATE)
        self._cloud_init_gcsfuse_template: Template = Template(CLOUD_INIT_GCSFUSE_TEMPLATE)
        self._images_client = get_images_client()

    def get_zone_suffixes(self, region: str) -> list[str]:
        """Get zone suffixes for a region (handles regions with different zone availability)."""
        return self.REGION_ZONE_SUFFIXES.get(region, self.DEFAULT_ZONE_SUFFIXES)

    def get_zones_for_region(self, region: str) -> list[str]:
        """Get list of zones for a region."""
        suffixes = self.get_zone_suffixes(region)
        return [f"{region}-{suffix}" for suffix in suffixes]

    def get_cos_image(self) -> str:
        """Get the latest Container-Optimized OS image."""
        request = compute_v1.GetFromFamilyImageRequest(
            project="cos-cloud",
            family="cos-stable",
        )
        image = self._images_client.get_from_family(request=request)
        return image.self_link

    def get_ubuntu_image(self, zone: str) -> str:
        """Get Ubuntu 22.04 LTS image (required for GCS FUSE)."""
        request = compute_v1.GetFromFamilyImageRequest(
            project="ubuntu-os-cloud",
            family="ubuntu-2204-lts",
        )
        image = self._images_client.get_from_family(request=request)
        return image.self_link

    def extract_registry_region(self, docker_image: str) -> str:
        """Extract registry region from image URL."""
        match = re.match(r"^([a-z]+-[a-z]+[0-9]*)-docker\.pkg\.dev", docker_image)
        if match:
            return match.group(1)
        return "asia-northeast1"  # Default

    def generate_instance_name(self, service_name: str, shard_id: str) -> str:
        """Generate a unique instance name."""
        suffix = uuid.uuid4().hex[:8]
        # Sanitize shard_id for use in instance name
        safe_shard = re.sub(r"[^a-z0-9-]", "-", shard_id.lower())[:20]
        return f"{service_name[:20]}-{safe_shard}-{suffix}"

    def get_status_path(
        self, status_bucket: str | None, status_prefix: str, deployment_id: str, shard_id: str
    ) -> str:
        """Generate GCS path for status file."""
        if not status_bucket:
            return ""
        return f"gs://{status_bucket}/{status_prefix}/{deployment_id}/{shard_id}/status"  # noqa: gs-uri — VM config builds GCS paths for cloud-init status tracking

    def is_zone_exhausted_error(self, error_str: str) -> bool:
        """Check if error indicates zone resource exhaustion."""
        exhaustion_indicators = [
            "ZONE_RESOURCE_POOL_EXHAUSTED",
            "does not have enough resources",
            "stockout",
            "insufficient resources",
            "resource pool exhausted",
        ]
        return any(indicator.lower() in error_str.lower() for indicator in exhaustion_indicators)

    def is_regional_quota_error(self, error_str: str) -> bool:
        """Check if error indicates regional quota exhaustion (IP, CPU, SSD)."""
        # These are regional quotas that should trigger region switching
        quota_indicators = [
            "IN_USE_ADDRESSES",
            "IP addresses",
            "CPUS",
            "C2_CPUS",
            "SSD_TOTAL_GB",
            "quotaExceeded",
            "Quota exceeded",
        ]
        error_lower = error_str.lower()
        # Must be a quota error AND contain a regional quota indicator
        is_quota = "quota" in error_lower
        has_regional_indicator = any(ind.lower() in error_lower for ind in quota_indicators)
        return is_quota and has_regional_indicator

    def render_cloud_init_template(
        self,
        template_context: dict[str, object],
        use_gcs_fuse: bool = False,
    ) -> str:
        """
        Render the appropriate cloud-init template.

        Args:
            template_context: Template context variables
            use_gcs_fuse: Whether to use GCS FUSE template

        Returns:
            Rendered cloud-init configuration
        """
        template = self._cloud_init_gcsfuse_template if use_gcs_fuse else self._cloud_init_template
        return template.render(**template_context)

    def build_instance_config(
        self,
        instance_name: str,
        zone: str,
        machine_type: str,
        disk_size_gb: int,
        service_account_email: str,
        cloud_init: str,
        labels: dict[str, str],
        preemptible: bool = False,
        use_gcs_fuse: bool = False,
    ) -> compute_v1.Instance:
        """
        Build VM instance configuration.

        Args:
            instance_name: VM instance name
            zone: Zone for the VM
            machine_type: VM machine type
            disk_size_gb: Boot disk size
            service_account_email: Service account email
            cloud_init: Cloud-init user data
            labels: VM labels
            preemptible: Whether to use preemptible instance
            use_gcs_fuse: Whether using GCS FUSE (affects boot image)

        Returns:
            Compute instance configuration
        """
        boot_image = self.get_ubuntu_image(zone) if use_gcs_fuse else self.get_cos_image()

        return compute_v1.Instance(
            name=instance_name,
            machine_type=f"zones/{zone}/machineTypes/{machine_type}",
            disks=[
                compute_v1.AttachedDisk(
                    boot=True,
                    auto_delete=True,
                    initialize_params=compute_v1.AttachedDiskInitializeParams(
                        source_image=boot_image,
                        disk_size_gb=disk_size_gb,
                        disk_type=f"zones/{zone}/diskTypes/pd-ssd",
                    ),
                )
            ],
            network_interfaces=[
                compute_v1.NetworkInterface(
                    network="global/networks/default",
                    access_configs=[
                        compute_v1.AccessConfig(
                            name="External NAT",
                            type_="ONE_TO_ONE_NAT",
                        )
                    ],
                )
            ],
            service_accounts=[
                compute_v1.ServiceAccount(
                    email=service_account_email,
                    scopes=["https://www.googleapis.com/auth/cloud-platform"],
                )
            ],
            metadata=compute_v1.Metadata(
                items=[
                    compute_v1.Items(key="user-data", value=cloud_init),
                    compute_v1.Items(key="serial-port-logging-enable", value="true"),
                    compute_v1.Items(key="enable-oslogin", value="true"),
                ]
            ),
            labels={
                "managed-by": "deploy-cli",
                **{k: v[:63] for k, v in labels.items()},
            },
            scheduling=compute_v1.Scheduling(
                preemptible=preemptible,
                automatic_restart=False,
                on_host_maintenance="TERMINATE",
                provisioning_model="SPOT" if preemptible else "STANDARD",
            ),
            tags=compute_v1.Tags(items=["container-vm", labels.get("service", "job")]),
        )
