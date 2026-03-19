"""
Service Version & Deployment Status Monitor

Tracks:
- Image versions (git commit, build date, deployed version)
- Deployment status (running, completed, failed)
- Data completeness per service/date
"""

import contextlib
import json
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import cast

from unified_trading_library import get_storage_client

from .config_loader import ConfigLoader
from .dependencies import DependencyGraph
from .deployment_config import DeploymentConfig
from .events import VM_EVENT_TYPES, ShardEvent

logger = logging.getLogger(__name__)

# Initialize configuration for project ID
_config = DeploymentConfig()


@dataclass
class ServiceVersion:
    """Tracks version information for a service."""

    service: str
    image_tag: str
    git_commit: str
    git_branch: str
    build_date: datetime
    deployed_at: datetime | None = None

    # Image metadata
    registry: str = ""
    repository: str = ""

    def __post_init__(self):
        if not self.registry:
            _pid = _config.gcp_project_id
            self.registry = f"gcr.io/{_pid}"
        if not self.repository:
            self.repository = self.service

    @property
    def full_image_name(self) -> str:
        return f"{self.registry}/{self.repository}:{self.image_tag}"

    @property
    def short_commit(self) -> str:
        return self.git_commit[:7] if self.git_commit else "unknown"

    def to_dict(self) -> dict[str, object]:
        return {
            "service": self.service,
            "image_tag": self.image_tag,
            "full_image_name": self.full_image_name,
            "git_commit": self.git_commit,
            "short_commit": self.short_commit,
            "git_branch": self.git_branch,
            "build_date": self.build_date.isoformat() if self.build_date else None,
            "deployed_at": self.deployed_at.isoformat() if self.deployed_at else None,
        }

    @classmethod
    def from_dict(cls, data: dict[str, object]) -> "ServiceVersion":
        return cls(
            service=str(data["service"]),
            image_tag=str(data["image_tag"]),
            git_commit=str(data["git_commit"]),
            git_branch=str(data["git_branch"]),
            build_date=(
                datetime.fromisoformat(str(data["build_date"]))
                if data.get("build_date")
                else datetime.now(UTC)
            ),
            deployed_at=(
                datetime.fromisoformat(str(data["deployed_at"]))
                if data.get("deployed_at")
                else None
            ),
        )


@dataclass
class DeploymentStatus:
    """Status of a single deployment/job."""

    service: str
    shard_id: str
    status: str  # pending, running, completed, failed, skipped
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None

    # Job dimensions
    dimensions: dict[str, str] = field(default_factory=dict)

    # Version info
    version: ServiceVersion | None = None

    # Progress tracking
    progress_percent: float = 0.0
    records_processed: int = 0
    records_total: int = 0

    @property
    def duration_seconds(self) -> float | None:
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return None

    @property
    def is_terminal(self) -> bool:
        return self.status in ("completed", "failed", "skipped")

    def to_dict(self) -> dict[str, object]:
        return {
            "service": self.service,
            "shard_id": self.shard_id,
            "status": self.status,
            "dimensions": self.dimensions,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": (self.completed_at.isoformat() if self.completed_at else None),
            "duration_seconds": self.duration_seconds,
            "error_message": self.error_message,
            "progress_percent": self.progress_percent,
            "records_processed": self.records_processed,
            "records_total": self.records_total,
            "version": self.version.to_dict() if self.version else None,
        }


@dataclass
class ServiceHealthReport:
    """Overall health report for a service."""

    service: str
    date: str
    category: str

    # Status counts
    total_shards: int = 0
    pending: int = 0
    running: int = 0
    completed: int = 0
    failed: int = 0
    skipped: int = 0

    # Dependency info
    dependencies_met: bool = True
    missing_dependencies: list[str] = field(default_factory=list)

    # Version
    current_version: ServiceVersion | None = None

    @property
    def completion_percent(self) -> float:
        if self.total_shards == 0:
            return 0.0
        return (self.completed / self.total_shards) * 100

    @property
    def status_summary(self) -> str:
        if self.failed > 0:
            return "failed"
        if self.running > 0:
            return "running"
        if self.pending > 0:
            return "pending"
        if self.completed == self.total_shards:
            return "completed"
        return "partial"

    def to_dict(self) -> dict[str, object]:
        return {
            "service": self.service,
            "date": self.date,
            "category": self.category,
            "status_summary": self.status_summary,
            "completion_percent": self.completion_percent,
            "total_shards": self.total_shards,
            "pending": self.pending,
            "running": self.running,
            "completed": self.completed,
            "failed": self.failed,
            "skipped": self.skipped,
            "dependencies_met": self.dependencies_met,
            "missing_dependencies": self.missing_dependencies,
            "current_version": (self.current_version.to_dict() if self.current_version else None),
        }


class DeploymentMonitor:
    """
    Monitors deployment status across all services.

    Integrates with:
    - GCS for reading completion markers
    - Cloud Run Jobs API for running job status
    - Artifact Registry for image versions
    """

    def __init__(self, config_dir: str = "configs", project_id: str | None = None):
        self.config_dir = config_dir
        self.project_id: str | None = project_id or cast(str | None, _config.gcp_project_id)
        self._gcs_client = None
        self._run_client = None

        # In-memory cache of deployment statuses
        self._status_cache: dict[str, DeploymentStatus] = {}
        self._version_cache: dict[str, ServiceVersion] = {}

    @property
    def gcs_client(self):
        """Lazy-load GCS client."""
        if self._gcs_client is None and not _config.is_mock_mode():
            try:
                self._gcs_client = get_storage_client(project_id=self.project_id)
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Could not initialize GCS client: %s", e)
        return self._gcs_client

    def get_service_version(self, service: str) -> ServiceVersion | None:
        """Get the current deployed version of a service."""
        if service in self._version_cache:
            return self._version_cache[service]

        # Try to read from GCS version manifest
        try:
            if self.gcs_client:
                bucket = self.gcs_client.bucket(f"deployment-metadata-{self.project_id}")
                blob = bucket.blob(f"versions/{service}/current.json")

                if blob.exists():
                    data = cast(dict[str, object], json.loads(blob.download_as_text()))
                    version = ServiceVersion.from_dict(data)
                    self._version_cache[service] = version
                    return version
        except (OSError, ValueError, RuntimeError) as e:
            logger.debug("Could not fetch version for %s: %s", service, e)

        return None

    def get_all_service_versions(self) -> dict[str, ServiceVersion]:
        """Get versions for all services."""
        loader = ConfigLoader(self.config_dir)
        services = loader.list_available_services()

        versions = {}
        for service in services:
            version = self.get_service_version(service)
            if version:
                versions[service] = version

        return versions

    def get_deployment_status(
        self,
        service: str,
        date: str,
        category: str,
    ) -> ServiceHealthReport:
        """Get deployment status for a service on a date."""
        # Check dependencies first
        graph = DependencyGraph(self.config_dir)
        dep_report = graph.check_dependencies(service, date, category)

        report = ServiceHealthReport(
            service=service,
            date=date,
            category=category,
            dependencies_met=dep_report.required_passed,
            missing_dependencies=[
                check.upstream_service
                for check in dep_report.checks
                if check.required and not check.passed
            ],
        )

        # Get version
        report.current_version = self.get_service_version(service)

        # Try to read shard statuses from GCS
        try:
            if self.gcs_client:
                bucket_name = f"deployment-status-{self.project_id}"
                prefix = f"status/{service}/{date}/{category.lower()}/"

                bucket = self.gcs_client.bucket(bucket_name)
                blobs = list(bucket.list_blobs(prefix=prefix))

                report.total_shards = len(blobs)

                for blob in blobs:
                    try:
                        data = cast(dict[str, object], json.loads(blob.download_as_text()))
                        status = str(data.get("status") or "pending")

                        if status == "pending":
                            report.pending += 1
                        elif status == "running":
                            report.running += 1
                        elif status == "completed":
                            report.completed += 1
                        elif status == "failed":
                            report.failed += 1
                        elif status == "skipped":
                            report.skipped += 1
                    except (OSError, ValueError, RuntimeError):
                        report.pending += 1
        except (ConnectionError, TimeoutError, OSError, ValueError) as e:
            logger.debug("Could not fetch deployment status: %s", e)

        return report

    def get_all_service_status(
        self,
        date: str,
        category: str,
    ) -> dict[str, ServiceHealthReport]:
        """Get status for all services."""
        loader = ConfigLoader(self.config_dir)
        services = loader.list_available_services()

        statuses = {}
        for service in services:
            statuses[service] = self.get_deployment_status(service, date, category)

        return statuses

    def generate_status_report(
        self,
        statuses: dict[str, ServiceHealthReport],
        include_deps: bool = True,
    ) -> str:
        """Generate a text-based status report."""
        lines: list[str] = []

        lines.append("=" * 70)
        lines.append("DEPLOYMENT STATUS REPORT")
        lines.append("=" * 70)
        lines.append("")

        # Group by status
        completed: list[tuple[str, ServiceHealthReport]] = []
        running: list[tuple[str, ServiceHealthReport]] = []
        pending: list[tuple[str, ServiceHealthReport]] = []
        failed: list[tuple[str, ServiceHealthReport]] = []
        blocked: list[tuple[str, ServiceHealthReport]] = []

        for service, report in statuses.items():
            if not report.dependencies_met:
                blocked.append((service, report))
            elif report.status_summary == "completed":
                completed.append((service, report))
            elif report.status_summary == "running":
                running.append((service, report))
            elif report.status_summary == "failed":
                failed.append((service, report))
            else:
                pending.append((service, report))

        # Failed services
        if failed:
            lines.append("❌ FAILED:")
            for service, report in failed:
                lines.append(f"   {service}: {report.failed}/{report.total_shards} failed")
                if report.current_version:
                    lines.append(f"      Version: {report.current_version.short_commit}")
            lines.append("")

        # Blocked services
        if blocked:
            lines.append("🚫 BLOCKED (dependencies not met):")
            for service, report in blocked:
                lines.append(f"   {service}: waiting on {', '.join(report.missing_dependencies)}")
            lines.append("")

        # Running services
        if running:
            lines.append("⏳ RUNNING:")
            for service, report in running:
                lines.append(
                    f"   {service}: {report.completion_percent:.0f}%"
                    f" ({report.completed}/{report.total_shards})"
                )
            lines.append("")

        # Pending services
        if pending:
            lines.append("📋 PENDING:")
            for service, report in pending:
                lines.append(f"   {service}: {report.pending} shards queued")
            lines.append("")

        # Completed services
        if completed:
            lines.append("✅ COMPLETED:")
            for service, report in completed:
                version_str = ""
                if report.current_version:
                    version_str = f" (v{report.current_version.short_commit})"
                lines.append(f"   {service}{version_str}: {report.total_shards} shards")
            lines.append("")

        # Summary
        lines.append("-" * 70)
        total = len(statuses)
        lines.append(
            f"Total: {len(completed)}/{total} completed, {len(running)} running, "
            f"{len(failed)} failed, {len(blocked)} blocked"
        )

        return "\n".join(lines)

    # ── Event stream API ───────────────────────────────────────────────────

    def _events_bucket_name(self) -> str:
        return f"deployment-status-{self.project_id}"

    def _events_blob_path(self, deployment_id: str, shard_id: str) -> str:
        return f"deployments/{deployment_id}/shards/{shard_id}/events.jsonl"

    def record_event(self, event: ShardEvent) -> None:
        """
        Append a ShardEvent to GCS as a JSONL line.

        GCS path: deployments/{deployment_id}/shards/{shard_id}/events.jsonl
        If GCS is unavailable (mock mode / unit tests), logs and returns silently.
        """
        if not self.gcs_client:
            logger.debug("[EVENTS] GCS unavailable — event not persisted: %s", event.event_type)
            return
        try:
            bucket = self.gcs_client.bucket(self._events_bucket_name())
            blob_path = self._events_blob_path(event.deployment_id, event.shard_id)
            blob = bucket.blob(blob_path)

            existing = ""
            with contextlib.suppress(Exception):
                existing = blob.download_as_text()

            new_content = existing + event.to_jsonl() + "\n"
            upload_fn = cast(object, getattr(blob, "upload_from_string", None))
            if callable(upload_fn):
                upload_fn(new_content, content_type="application/x-ndjson")

            logger.debug(
                "[EVENTS] Recorded %s for shard %s in deployment %s",
                event.event_type,
                event.shard_id,
                event.deployment_id,
            )
        except (OSError, ValueError, RuntimeError) as exc:
            logger.warning("[EVENTS] Failed to record event %s: %s", event.event_type, exc)

    def _parse_events_blob(self, blob: object) -> list[ShardEvent]:
        """Parse a single events.jsonl GCS blob into ShardEvent objects."""
        results: list[ShardEvent] = []
        try:
            download_fn = cast(object, getattr(blob, "download_as_text", None))
            if not callable(download_fn):
                return results
            content: str = cast(str, download_fn())
            for line in content.splitlines():
                stripped = line.strip()
                if stripped:
                    results.append(ShardEvent.from_jsonl(stripped))
        except (OSError, ValueError, RuntimeError) as exc:
            blob_name: object = getattr(blob, "name", "<unknown>")
            logger.debug("[EVENTS] Skipping blob %s: %s", blob_name, exc)
        return results

    def get_events(
        self,
        deployment_id: str,
        shard_id: str | None = None,
    ) -> list[ShardEvent]:
        """
        Return all shard events for a deployment, sorted by timestamp ascending.

        Args:
            deployment_id: The deployment to query.
            shard_id: If provided, return only events for that specific shard.
        """
        if not self.gcs_client:
            return []

        events: list[ShardEvent] = []
        try:
            bucket = self.gcs_client.bucket(self._events_bucket_name())

            if shard_id:
                blobs: list[object] = [bucket.blob(self._events_blob_path(deployment_id, shard_id))]
            else:
                prefix = f"deployments/{deployment_id}/shards/"
                raw_blobs = list(bucket.list_blobs(prefix=prefix))
                blobs = [
                    b for b in raw_blobs if str(getattr(b, "name", "")).endswith("events.jsonl")
                ]

            for blob in blobs:
                events.extend(self._parse_events_blob(blob))

        except (OSError, ValueError, RuntimeError) as exc:
            logger.warning("[EVENTS] Failed to retrieve events for %s: %s", deployment_id, exc)

        events.sort(key=lambda e: e.timestamp)
        return events

    def get_vm_events(self, deployment_id: str) -> list[ShardEvent]:
        """Return only VM-level events for a deployment (subset of get_events)."""
        return [e for e in self.get_events(deployment_id) if e.event_type in VM_EVENT_TYPES]


class VersionRegistry:
    """
    Manages service version metadata.

    Stores in GCS:
    - gs://deployment-metadata-{project}/versions/{service}/current.json
    - gs://deployment-metadata-{project}/versions/{service}/history/{timestamp}.json
    """

    def __init__(self, project_id: str | None = None):
        self.project_id: str | None = project_id or cast(str | None, _config.gcp_project_id)
        self.bucket_name = f"deployment-metadata-{self.project_id}"
        self._client = None

    @property
    def client(self):
        if self._client is None and not _config.is_mock_mode():
            try:
                self._client = get_storage_client(project_id=self.project_id)
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Unexpected error during client: %s", e, exc_info=True)
        return self._client

    def register_version(self, version: ServiceVersion) -> bool:
        """Register a new version for a service."""
        if not self.client:
            logger.warning("No GCS client available for version registration")
            return False

        try:
            bucket = self.client.bucket(self.bucket_name)

            # Save as current
            current_blob = bucket.blob(f"versions/{version.service}/current.json")
            upload_fn = cast(object, getattr(current_blob, "upload_from_string", None))
            if callable(upload_fn):
                upload_fn(json.dumps(version.to_dict(), indent=2), content_type="application/json")

            # Save to history
            timestamp = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
            history_blob = bucket.blob(f"versions/{version.service}/history/{timestamp}.json")
            upload_fn2 = cast(object, getattr(history_blob, "upload_from_string", None))
            if callable(upload_fn2):
                upload_fn2(json.dumps(version.to_dict(), indent=2), content_type="application/json")

            logger.info("Registered version %s for %s", version.image_tag, version.service)
            return True
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to register version: %s", e)
            return False

    def get_version_history(self, service: str, limit: int = 10) -> list[ServiceVersion]:
        """Get version history for a service."""
        if not self.client:
            return []

        try:
            bucket = self.client.bucket(self.bucket_name)
            prefix = f"versions/{service}/history/"

            blobs = list(bucket.list_blobs(prefix=prefix))
            blobs.sort(key=lambda b: b.name, reverse=True)

            versions: list[ServiceVersion] = []
            for blob in blobs[:limit]:
                try:
                    data = cast(dict[str, object], json.loads(blob.download_as_text()))
                    versions.append(ServiceVersion.from_dict(data))
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Skipping item during get version history: %s", e)
                    continue

            return versions
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to get version history: %s", e)
            return []
