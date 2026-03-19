"""
T+1 Job Orchestrator

Handles:
- Execution ordering based on dependency graph
- Cascade failure propagation (if upstream fails, skip downstream)
- Parallel execution of independent services
- Progress tracking and reporting
"""

import json
import logging
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import cast

from unified_events_interface import log_event, setup_events
from unified_trading_library import get_storage_client

from .dependencies import DependencyGraph
from .deployment_config import DeploymentConfig
from .metrics import PROCESSING_LATENCY, RECORDS_PROCESSED
from .monitor import DeploymentMonitor
from .shard_calculator import ShardCalculator

logger = logging.getLogger(__name__)

# Initialize configuration for project ID
_config = DeploymentConfig()


class JobState(Enum):
    """State of a job in the orchestration pipeline."""

    PENDING = "pending"
    READY = "ready"  # Dependencies met, ready to run
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"  # Skipped due to upstream failure


@dataclass
class OrchestratedJob:
    """A job in the orchestration pipeline."""

    service: str
    date: str
    category: str
    shard_id: str

    state: JobState = JobState.PENDING

    # Upstream/downstream relationships
    upstream_jobs: list[str] = field(default_factory=list)
    downstream_jobs: list[str] = field(default_factory=list)

    # Execution metadata
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None

    # Dimensions for the shard
    dimensions: dict[str, str] = field(default_factory=dict)

    @property
    def job_id(self) -> str:
        """Unique identifier for this job."""
        return f"{self.service}:{self.date}:{self.category}:{self.shard_id}"

    @property
    def is_terminal(self) -> bool:
        return self.state in (JobState.COMPLETED, JobState.FAILED, JobState.SKIPPED)

    def to_dict(self) -> dict[str, object]:
        return {
            "job_id": self.job_id,
            "service": self.service,
            "date": self.date,
            "category": self.category,
            "shard_id": self.shard_id,
            "state": self.state.value,
            "upstream_jobs": self.upstream_jobs,
            "downstream_jobs": self.downstream_jobs,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": (self.completed_at.isoformat() if self.completed_at else None),
            "error_message": self.error_message,
            "dimensions": self.dimensions,
        }


@dataclass
class OrchestrationPlan:
    """Plan for orchestrating a batch of jobs."""

    date: str
    category: str

    # All jobs in the plan
    jobs: dict[str, OrchestratedJob] = field(default_factory=dict)

    # Execution order (services, not individual jobs)
    execution_order: list[str] = field(default_factory=list)

    # Summary
    created_at: datetime = field(default_factory=datetime.now)

    def add_job(self, job: OrchestratedJob):
        """Add a job to the plan."""
        self.jobs[job.job_id] = job

    def get_jobs_by_state(self, state: JobState) -> list[OrchestratedJob]:
        """Get all jobs in a given state."""
        return [j for j in self.jobs.values() if j.state == state]

    def get_ready_jobs(self) -> list[OrchestratedJob]:
        """Get jobs that are ready to run (dependencies met)."""
        ready: list[OrchestratedJob] = []
        for job in self.jobs.values():
            if job.state != JobState.PENDING:
                continue

            # Check all upstream jobs are completed
            upstream_met = True
            for up_id in job.upstream_jobs:
                up_job = self.jobs.get(up_id)
                if up_job:
                    if up_job.state == JobState.FAILED:
                        # Upstream failed - mark this job as skipped
                        job.state = JobState.SKIPPED
                        job.error_message = f"Skipped: upstream {up_job.service} failed"
                        upstream_met = False
                        break
                    elif up_job.state != JobState.COMPLETED:
                        upstream_met = False
                        break

            if upstream_met and job.state == JobState.PENDING:
                job.state = JobState.READY
                ready.append(job)

        return ready

    def get_jobs_by_service(self, service: str) -> list[OrchestratedJob]:
        """Get all jobs for a specific service."""
        return [j for j in self.jobs.values() if j.service == service]

    @property
    def total_jobs(self) -> int:
        return len(self.jobs)

    @property
    def completed_jobs(self) -> int:
        return len(self.get_jobs_by_state(JobState.COMPLETED))

    @property
    def failed_jobs(self) -> int:
        return len(self.get_jobs_by_state(JobState.FAILED))

    @property
    def skipped_jobs(self) -> int:
        return len(self.get_jobs_by_state(JobState.SKIPPED))

    @property
    def running_jobs(self) -> int:
        return len(self.get_jobs_by_state(JobState.RUNNING))

    @property
    def completion_percent(self) -> float:
        if self.total_jobs == 0:
            return 0.0
        terminal = self.completed_jobs + self.failed_jobs + self.skipped_jobs
        return (terminal / self.total_jobs) * 100

    def to_dict(self) -> dict[str, object]:
        return {
            "date": self.date,
            "category": self.category,
            "created_at": self.created_at.isoformat(),
            "execution_order": self.execution_order,
            "total_jobs": self.total_jobs,
            "completed_jobs": self.completed_jobs,
            "failed_jobs": self.failed_jobs,
            "skipped_jobs": self.skipped_jobs,
            "running_jobs": self.running_jobs,
            "completion_percent": self.completion_percent,
            "jobs": {k: v.to_dict() for k, v in self.jobs.items()},
        }


class T1Orchestrator:
    """
    Orchestrates T+1 daily jobs with dependency-aware execution.

    Features:
    - Respects service dependency order
    - Cascade failure: skip downstream if upstream fails
    - Parallel execution within same dependency tier
    - Progress tracking and recovery
    """

    _events_initialized = False

    def __init__(self, config_dir: str = "configs", project_id: str | None = None):
        if not self.__class__._events_initialized:
            # Initialize events lazily to avoid import-time side effects during unit tests.
            setup_events(service_name="deployment-service", mode="batch", sink=None)
            self.__class__._events_initialized = True
        self.config_dir = config_dir
        self.project_id: str | None = project_id or cast(str | None, _config.gcp_project_id)
        self.graph = DependencyGraph(config_dir)
        self.monitor = DeploymentMonitor(config_dir, project_id)
        self._gcs_client = None

    @property
    def gcs_client(self):
        """Lazy-load GCS client."""
        if self._gcs_client is None and not _config.is_mock_mode():
            try:
                self._gcs_client = get_storage_client(project_id=self.project_id)
            except ConnectionError as e:
                log_event(
                    "orchestrator.gcs_client.connection_failed",
                    error_type="connection_error",
                    error_message=str(e),
                    project_id=self.project_id,
                )
            except ValueError as e:
                log_event(
                    "orchestrator.gcs_client.configuration_invalid",
                    error_type="configuration_error",
                    error_message=str(e),
                    project_id=self.project_id,
                )
            except (OSError, RuntimeError) as e:
                log_event(
                    "orchestrator.gcs_client.initialization_failed",
                    error_type="unexpected_error",
                    error_message=str(e),
                    project_id=self.project_id,
                    stack_trace=True,
                )
        return self._gcs_client

    def create_daily_plan(
        self,
        target_date: str,
        category: str,
        services: list[str] | None = None,
    ) -> OrchestrationPlan:
        """
        Create an orchestration plan for T+1 daily jobs.

        Args:
            target_date: Date to process (YYYY-MM-DD)
            category: Category (CEFI/TRADFI/DEFI)
            services: Optional list of services to include (defaults to all)

        Returns:
            OrchestrationPlan with all jobs and dependencies mapped
        """
        log_event(
            "orchestrator.plan.creation.started",
            target_date=target_date,
            category=category,
            requested_services=services,
        )

        _plan_start = time.monotonic()
        plan = OrchestrationPlan(date=target_date, category=category)

        # Get execution order from dependency graph
        execution_order = self.graph.get_execution_order()

        # Filter to requested services if specified
        if services:
            execution_order = [s for s in execution_order if s in services]

        plan.execution_order = execution_order

        # Create jobs for each service
        for service in execution_order:
            # Get service config to determine shards
            try:
                calculator = ShardCalculator(self.config_dir)

                # For T+1, we only need single-day shards
                shards = calculator.calculate_shards(
                    service=service,
                    start_date=datetime.strptime(target_date, "%Y-%m-%d")
                    .replace(tzinfo=UTC)
                    .date(),
                    end_date=datetime.strptime(target_date, "%Y-%m-%d").replace(tzinfo=UTC).date(),
                    max_shards=1000,  # High limit for single day
                    category=[category],
                )

                for shard in shards:
                    job = OrchestratedJob(
                        service=service,
                        date=target_date,
                        category=category,
                        shard_id=str(shard.shard_index),
                        dimensions=cast(dict[str, str], shard.dimensions),
                    )

                    # Map upstream dependencies
                    upstream_services = self.graph.get_upstream_services(service)
                    for up_svc in upstream_services:
                        # Link to all shards of upstream service
                        for up_job in plan.get_jobs_by_service(up_svc):
                            job.upstream_jobs.append(up_job.job_id)

                    plan.add_job(job)

            except (ValueError, KeyError) as e:
                log_event(
                    "orchestrator.shard_calculation.configuration_error",
                    service=service,
                    target_date=target_date,
                    category=category,
                    error_type="configuration_error",
                    error_message=str(e),
                )
            except FileNotFoundError as e:
                log_event(
                    "orchestrator.shard_calculation.file_not_found",
                    service=service,
                    target_date=target_date,
                    category=category,
                    error_type="file_not_found",
                    error_message=str(e),
                )
            except (OSError, RuntimeError) as e:
                log_event(
                    "orchestrator.shard_calculation.failed",
                    service=service,
                    target_date=target_date,
                    category=category,
                    error_type="unexpected_error",
                    error_message=str(e),
                    stack_trace=True,
                )
                # Create a single placeholder job
                job = OrchestratedJob(
                    service=service,
                    date=target_date,
                    category=category,
                    shard_id="0",
                )
                plan.add_job(job)

        # Map downstream dependencies
        for job in plan.jobs.values():
            for other_job in plan.jobs.values():
                if job.job_id in other_job.upstream_jobs:
                    job.downstream_jobs.append(other_job.job_id)

        log_event(
            "orchestrator.plan.creation.completed",
            target_date=target_date,
            category=category,
            total_jobs=plan.total_jobs,
            services_included=len(execution_order),
            execution_tiers=len(self.get_execution_tiers(plan)),
        )

        PROCESSING_LATENCY.observe(time.monotonic() - _plan_start)
        RECORDS_PROCESSED.labels(status="success").inc(plan.total_jobs)

        return plan

    def get_execution_tiers(self, plan: OrchestrationPlan) -> list[list[str]]:
        """
        Get services grouped by execution tier.

        Services in the same tier can run in parallel.
        Each tier must complete before the next can start.

        Returns:
            List of tiers, each tier is a list of services
        """
        tiers: list[list[str]] = []
        seen: set[str] = set()

        for service in plan.execution_order:
            # Check if all upstream services are in previous tiers
            upstream = self.graph.get_upstream_services(service)

            # Find the tier this service belongs to
            tier_idx = 0
            graph_services = cast(
                dict[str, dict[str, object]], self.graph.config.get("services") or {}
            )
            for up in upstream:
                if up not in graph_services:
                    continue
                if graph_services[up].get("is_library"):
                    continue
                # Find which tier the upstream is in
                for i, tier in enumerate(tiers):
                    if up in tier:
                        tier_idx = max(tier_idx, i + 1)

            # Add to appropriate tier
            while len(tiers) <= tier_idx:
                tiers.append([])

            tiers[tier_idx].append(service)
            seen.add(service)

        return tiers

    def propagate_failure(self, plan: OrchestrationPlan, failed_job_id: str) -> list[str]:
        """
        Propagate failure to downstream jobs.

        Returns list of job IDs that were skipped due to the failure.
        """
        skipped: list[str] = []
        failed_job = plan.jobs.get(failed_job_id)

        if not failed_job:
            return skipped

        log_event(
            "orchestrator.failure_propagation.started",
            failed_job_id=failed_job_id,
            failed_service=failed_job.service,
            plan_date=plan.date,
            plan_category=plan.category,
        )

        # Mark all downstream as skipped
        def skip_downstream(job_id: str):
            job = plan.jobs.get(job_id)
            if job and job.state in (JobState.PENDING, JobState.READY):
                job.state = JobState.SKIPPED
                job.error_message = f"Skipped: upstream {failed_job.service} failed"
                skipped.append(job_id)

                # Recursively skip downstream
                for down_id in job.downstream_jobs:
                    skip_downstream(down_id)

        for down_id in failed_job.downstream_jobs:
            skip_downstream(down_id)

        log_event(
            "orchestrator.failure_propagation.completed",
            failed_job_id=failed_job_id,
            failed_service=failed_job.service,
            skipped_job_count=len(skipped),
            skipped_jobs=skipped,
            plan_date=plan.date,
            plan_category=plan.category,
        )

        return skipped

    def generate_execution_report(self, plan: OrchestrationPlan) -> str:
        """Generate a human-readable execution report."""
        lines: list[str] = []

        lines.append("=" * 70)
        lines.append(f"T+1 ORCHESTRATION PLAN: {plan.date} ({plan.category})")
        lines.append("=" * 70)
        lines.append("")

        # Execution tiers
        tiers = self.get_execution_tiers(plan)
        lines.append("EXECUTION TIERS (parallel within tier):")
        lines.append("-" * 40)
        for i, tier in enumerate(tiers):
            tier_status: list[str] = []
            for svc in tier:
                jobs = plan.get_jobs_by_service(svc)
                completed = sum(1 for j in jobs if j.state == JobState.COMPLETED)
                failed = sum(1 for j in jobs if j.state == JobState.FAILED)
                total = len(jobs)

                if failed > 0:
                    status = f"❌ {svc} ({failed} failed)"
                elif completed == total:
                    status = f"✅ {svc} ({total} done)"
                elif completed > 0:
                    status = f"⏳ {svc} ({completed}/{total})"
                else:
                    status = f"📋 {svc} ({total} pending)"

                tier_status.append(status)

            lines.append(f"  Tier {i + 1}: {' → '.join(tier_status)}")
        lines.append("")

        # Dependency flow
        lines.append("DEPENDENCY FLOW:")
        lines.append("-" * 40)
        services_config = cast(
            dict[str, dict[str, object]], self.graph.config.get("services") or {}
        )
        for service in plan.execution_order:
            upstream = self.graph.get_upstream_services(service)
            required_up = [
                u
                for u in upstream
                if cast(
                    list[dict[str, object]], services_config.get(u, {}).get("upstream") or [{}]
                )[0].get("required", True)
                if not services_config.get(u, {}).get("is_library")
            ]

            if required_up:
                lines.append(f"  {service} ← depends on: {', '.join(required_up)}")
            else:
                lines.append(f"  {service} (root - no dependencies)")
        lines.append("")

        # Summary
        lines.append("SUMMARY:")
        lines.append("-" * 40)
        lines.append(f"  Total jobs: {plan.total_jobs}")
        lines.append(f"  Completed: {plan.completed_jobs}")
        lines.append(f"  Failed: {plan.failed_jobs}")
        lines.append(f"  Skipped (cascade): {plan.skipped_jobs}")
        lines.append(f"  Running: {plan.running_jobs}")
        lines.append(f"  Progress: {plan.completion_percent:.1f}%")

        return "\n".join(lines)

    def save_plan(self, plan: OrchestrationPlan) -> bool:
        """Save orchestration plan to GCS."""
        if not self.gcs_client:
            logger.warning("No GCS client available for saving plan")
            return False

        try:
            bucket = self.gcs_client.bucket(f"deployment-orchestration-{self.project_id}")
            blob = bucket.blob(f"plans/{plan.date}/{plan.category}/plan.json")

            upload_fn = cast(object, getattr(blob, "upload_from_string", None))
            if callable(upload_fn):
                upload_fn(json.dumps(plan.to_dict(), indent=2), content_type="application/json")

            log_event(
                "orchestrator.plan.saved",
                date=plan.date,
                category=plan.category,
                project_id=self.project_id,
                total_jobs=plan.total_jobs,
                execution_tiers=len(self.get_execution_tiers(plan)),
            )
            return True
        except ConnectionError as e:
            log_event(
                "orchestrator.plan.save_failed",
                date=plan.date,
                category=plan.category,
                project_id=self.project_id,
                error_type="connection_error",
                error_message=str(e),
            )
            return False
        except OSError as e:
            log_event(
                "orchestrator.plan.save_failed",
                date=plan.date,
                category=plan.category,
                project_id=self.project_id,
                error_type="file_system_error",
                error_message=str(e),
            )
            return False
        except ValueError as e:
            log_event(
                "orchestrator.plan.save_failed",
                date=plan.date,
                category=plan.category,
                project_id=self.project_id,
                error_type="invalid_data",
                error_message=str(e),
            )
            return False
        except RuntimeError as e:
            log_event(
                "orchestrator.plan.save_failed",
                date=plan.date,
                category=plan.category,
                project_id=self.project_id,
                error_type="unexpected_error",
                error_message=str(e),
                stack_trace=True,
            )
            return False

    def load_plan(self, target_date: str, category: str) -> OrchestrationPlan | None:
        """Load an existing orchestration plan from GCS."""
        if not self.gcs_client:
            return None

        try:
            bucket = self.gcs_client.bucket(f"deployment-orchestration-{self.project_id}")
            blob = bucket.blob(f"plans/{target_date}/{category}/plan.json")

            if not blob.exists():
                return None

            data = cast(dict[str, object], json.loads(blob.download_as_text()))

            plan = OrchestrationPlan(
                date=str(data["date"]),
                category=str(data["category"]),
                execution_order=cast(list[str], data["execution_order"]),
            )

            for job_id, job_data in cast(
                dict[str, dict[str, object]], data.get("jobs") or {}
            ).items():
                job = OrchestratedJob(
                    service=str(job_data["service"]),
                    date=str(job_data["date"]),
                    category=str(job_data["category"]),
                    shard_id=str(job_data["shard_id"]),
                    state=JobState(str(job_data["state"])),
                    upstream_jobs=cast(list[str], job_data.get("upstream_jobs") or []),
                    downstream_jobs=cast(list[str], job_data.get("downstream_jobs") or []),
                    error_message=cast(str | None, job_data.get("error_message")),
                    dimensions=cast(dict[str, str], job_data.get("dimensions") or {}),
                )
                plan.jobs[job_id] = job

            return plan
        except ConnectionError as e:
            log_event(
                "orchestrator.plan.load_failed",
                target_date=target_date,
                category=category,
                project_id=self.project_id,
                error_type="connection_error",
                error_message=str(e),
            )
            return None
        except FileNotFoundError:
            log_event(
                "orchestrator.plan.not_found",
                target_date=target_date,
                category=category,
                project_id=self.project_id,
                level="debug",
            )
            return None
        except (ValueError, KeyError) as e:
            log_event(
                "orchestrator.plan.load_failed",
                target_date=target_date,
                category=category,
                project_id=self.project_id,
                error_type="invalid_data_format",
                error_message=str(e),
            )
            return None
        except (OSError, RuntimeError) as e:
            log_event(
                "orchestrator.plan.load_failed",
                target_date=target_date,
                category=category,
                project_id=self.project_id,
                error_type="unexpected_error",
                error_message=str(e),
                stack_trace=True,
            )
            return None


def get_cascade_failure_tree(graph: DependencyGraph, failed_service: str) -> dict[str, list[str]]:
    """
    Get the tree of services that would be skipped if a service fails.

    Returns dict mapping each affected service to the chain of failures that caused it.
    """
    affected = {}

    def trace_downstream(service: str, failure_chain: list[str]):
        downstream = graph.get_downstream_services(service)

        for down in downstream:
            chain = [*failure_chain, service]
            affected[down] = chain
            trace_downstream(down, chain)

    trace_downstream(failed_service, [])
    return affected
