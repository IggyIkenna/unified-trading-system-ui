"""
Deployment Orchestrator - Main coordination for deploying shards.

Coordinates:
- Backend selection (Cloud Run vs VM)
- Parallel job launching with threading
- State management
- Progress tracking
"""

import logging
from datetime import UTC, datetime
from typing import cast

from deployment_service.backends import ComputeBackend

from .monitoring import monitor_shards
from .progress import ProgressDisplay
from .quota_broker_client import QuotaBrokerClient
from .rate_limiter import RateLimiter
from .state import (
    DeploymentState,
    DeploymentStatus,
    ShardStatus,
    StateManager,
)
from .utils import get_backend, vm_resource_request
from .worker_manager import launch_shards_parallel, launch_shards_rolling

logger = logging.getLogger(__name__)


class DeploymentOrchestrator:
    """
    Orchestrates deployment of shards across compute backends.

    Handles:
    - Creating deployments with state tracking
    - Dispatching all shards at once
    - Monitoring progress and updating state
    - Resuming failed deployments
    """

    def __init__(
        self,
        project_id: str,
        region: str,
        service_account_email: str,
        state_bucket: str,
        state_prefix: str = "deployments",
        api_rate_limit: float = 50.0,
    ):
        """
        Initialize the orchestrator.

        Args:
            project_id: GCP project ID
            region: GCP region
            service_account_email: Service account for jobs/VMs
            state_bucket: GCS bucket for state storage
            state_prefix: Prefix for state files
            api_rate_limit: Max API requests per second (default 50 = 3,000/min).
                Applies to VM create/delete and Cloud Run job operations.
                Provides 50% headroom under 6,000/min Compute Engine quota.
                Conservative limit helps avoid SSL failures and API throttling.
        """
        self.project_id = project_id
        self.region = region
        self.service_account_email = service_account_email

        self.state_manager = StateManager(
            bucket_name=state_bucket,
            prefix=state_prefix,
            project_id=project_id,
        )
        self.progress_display = ProgressDisplay()

        # Rate limiter to prevent hitting GCP API quotas
        # Default: 50/sec = 3,000/min (50% headroom under 6,000/min quota)
        # Conservative limit helps avoid SSL failures when running many parallel operations
        self.rate_limiter = RateLimiter(requests_per_second=api_rate_limit)
        logger.info(
            "[RATE_LIMITER] Initialized at %s requests/sec (%.0f/min)",
            api_rate_limit,
            api_rate_limit * 60,
        )

        # Optional centralized admissions/quota broker (Cloud Run IAM)
        self.quota_broker = QuotaBrokerClient() if QuotaBrokerClient else None

    def get_backend(
        self,
        compute_type: str,
        job_name: str | None = None,
        zone: str | None = None,
    ) -> ComputeBackend:
        """
        Get the appropriate compute backend.

        Args:
            compute_type: 'cloud_run' or 'vm'
            job_name: Cloud Run job name (required for cloud_run)
            zone: GCP zone (for VM backend)

        Returns:
            ComputeBackend instance
        """
        return get_backend(
            compute_type=compute_type,
            project_id=self.project_id,
            region=self.region,
            service_account_email=self.service_account_email,
            state_bucket=self.state_manager.bucket_name,
            state_prefix=self.state_manager.prefix,
            job_name=job_name,
            zone=zone,
        )

    def deploy(
        self,
        service: str,
        compute_type: str,
        docker_image: str,
        shards: list[dict[str, object]],
        environment_variables: dict[str, str],
        compute_config: dict[str, object],
        start_date: str | None = None,
        end_date: str | None = None,
        job_name: str | None = None,
        zone: str | None = None,
        dry_run: bool = False,
        no_wait: bool = False,
        max_workers: int = 50,
        max_concurrent: int = 2000,  # Max simultaneously running VMs/jobs (hard limit: 2500)
        deployment_id: str | None = None,  # Allow passing a pre-generated ID
        venue_overrides: dict[str, dict[str, object]] | None = None,
        tag: str | None = None,  # Human-readable description for this deployment
    ) -> DeploymentState:
        """
        Deploy shards to the specified compute backend.

        Args:
            service: Service name
            compute_type: 'cloud_run' or 'vm'
            docker_image: Docker image URL
            shards: List of shard configurations (with shard_id, dimensions, args)
            environment_variables: Environment variables
            compute_config: Compute-specific configuration
            start_date: Start date of deployment
            end_date: End date of deployment
            job_name: Cloud Run job name (for cloud_run)
            zone: GCP zone (for vm)
            dry_run: If True, don't actually deploy
            no_wait: If True, launch jobs and return immediately without monitoring
            max_workers: Maximum parallel API calls for launching shards
            max_concurrent: Maximum simultaneously running VMs/jobs (default 2000, hard limit 2500).
                           If total shards > max_concurrent, uses rolling launch.
            venue_overrides: Per-venue compute overrides (e.g., COINBASE needs 256GB RAM)
            tag: Human-readable description/annotation for this deployment

        Returns:
            DeploymentState with results
        """
        # Load existing state if deployment_id provided, otherwise create new
        if deployment_id:
            state = self.state_manager.load_state(deployment_id)
            if state:
                logger.info("Loaded existing state for deployment %s", deployment_id)
                # Update config in case it changed
                state.config.update(
                    {
                        "docker_image": docker_image,
                        "compute_config": compute_config,
                        "environment_variables": environment_variables,
                        "job_name": job_name,
                        "zone": zone,
                    }
                )
            else:
                # State doesn't exist, create it
                logger.warning("State not found for %s, creating new", deployment_id)
                state = self.state_manager.create_deployment(
                    service=service,
                    compute_type=compute_type,
                    shards=shards,
                    start_date=start_date,
                    end_date=end_date,
                    config={
                        "docker_image": docker_image,
                        "compute_config": compute_config,
                        "environment_variables": environment_variables,
                        "job_name": job_name,
                        "zone": zone,
                    },
                    deployment_id=deployment_id,
                    tag=tag,
                )
        else:
            # No deployment_id provided, create new state
            state = self.state_manager.create_deployment(
                service=service,
                compute_type=compute_type,
                shards=shards,
                start_date=start_date,
                end_date=end_date,
                config={
                    "docker_image": docker_image,
                    "compute_config": compute_config,
                    "environment_variables": environment_variables,
                    "job_name": job_name,
                    "zone": zone,
                },
                tag=tag,
            )

        if dry_run:
            logger.info("DRY RUN: Would deploy %s shards", len(shards))
            self.progress_display.display_deployment_start(state)
            self.progress_display.display_progress(state)
            return state

        # Get backend
        backend = self.get_backend(compute_type, job_name=job_name, zone=zone)

        # Display start
        self.progress_display.display_deployment_start(state)

        # Update state to running
        state.status = DeploymentStatus.RUNNING
        self.state_manager.save_state(state)

        total_shards = len(state.pending_shards)

        # Check if we need rolling launch (total shards > max_concurrent)
        if total_shards > max_concurrent:
            logger.info(
                "[ROLLING_LAUNCH] %s shards exceeds max_concurrent (%s), using rolling launch",
                total_shards,
                max_concurrent,
            )
            # Use rolling launch to maintain max_concurrent running at any time
            launch_shards_rolling(
                state=state,
                backend=backend,
                docker_image=docker_image,
                environment_variables=environment_variables,
                compute_config=compute_config,
                rate_limiter=self.rate_limiter,
                state_manager=self.state_manager,
                quota_broker=self.quota_broker,
                vm_resource_request_fn=vm_resource_request,
                max_workers=max_workers,
                max_concurrent=max_concurrent,
                venue_overrides=venue_overrides,
                compute_type=compute_type,
                no_wait=no_wait,
            )
        else:
            # Standard parallel launch - all shards at once
            launch_shards_parallel(
                state=state,
                backend=backend,
                docker_image=docker_image,
                environment_variables=environment_variables,
                compute_config=compute_config,
                rate_limiter=self.rate_limiter,
                state_manager=self.state_manager,
                quota_broker=self.quota_broker,
                vm_resource_request_fn=vm_resource_request,
                max_workers=max_workers,
                venue_overrides=venue_overrides,
                compute_type=compute_type,
            )

            if no_wait:
                # Fire and forget - return immediately after launching
                logger.info(
                    "Launched %s shards, returning without waiting", len(state.running_shards)
                )
                self.progress_display.display_progress(state)
                return state

            # Monitor until completion (with automatic retry on failure)
            monitor_shards(
                state=state,
                backend=backend,
                state_manager=self.state_manager,
                progress_display=self.progress_display,
                rate_limiter=self.rate_limiter,
                quota_broker=self.quota_broker,
                vm_resource_request_fn=vm_resource_request,
                docker_image=docker_image,
                environment_variables=environment_variables,
                compute_config=compute_config,
            )

        # Final display
        self.progress_display.display_completion(state)

        return state

    def resume(self, deployment_id: str) -> DeploymentState:
        """
        Resume a failed deployment.

        Args:
            deployment_id: ID of deployment to resume

        Returns:
            Updated DeploymentState
        """
        state = self.state_manager.load_state(deployment_id)
        if not state:
            raise ValueError(f"Deployment {deployment_id} not found")

        # Reset failed shards to pending
        for shard in state.failed_shards:
            shard.status = ShardStatus.PENDING
            shard.error_message = None
            shard.retries += 1

        logger.info(
            "Resuming deployment %s with %s shards", deployment_id, len(state.pending_shards)
        )

        # Get backend
        config = state.config
        backend = self.get_backend(
            state.compute_type,
            job_name=cast(str | None, config.get("job_name")),
            zone=cast(str | None, config.get("zone")),
        )

        # Display start
        self.progress_display.display_deployment_start(state)
        state.status = DeploymentStatus.RUNNING
        self.state_manager.save_state(state)

        # Launch remaining shards
        docker_image = cast(str, config["docker_image"])
        environment_variables = cast(dict[str, str], config.get("environment_variables") or {})
        compute_config = cast(dict[str, object], config.get("compute_config") or {})

        launch_shards_parallel(
            state=state,
            backend=backend,
            docker_image=docker_image,
            environment_variables=environment_variables,
            compute_config=compute_config,
            rate_limiter=self.rate_limiter,
            state_manager=self.state_manager,
            quota_broker=self.quota_broker,
            vm_resource_request_fn=vm_resource_request,
        )

        # Monitor until completion (with automatic retry)
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=self.state_manager,
            progress_display=self.progress_display,
            rate_limiter=self.rate_limiter,
            quota_broker=self.quota_broker,
            vm_resource_request_fn=vm_resource_request,
            docker_image=docker_image,
            environment_variables=environment_variables,
            compute_config=compute_config,
        )

        self.progress_display.display_completion(state)
        return state

    def status(self, deployment_id: str) -> DeploymentState:
        """
        Get status of a deployment.

        Args:
            deployment_id: ID of deployment

        Returns:
            DeploymentState
        """
        state = self.state_manager.load_state(deployment_id)
        if not state:
            raise ValueError(f"Deployment {deployment_id} not found")

        self.progress_display.display_progress(state)
        return state

    def cancel(self, deployment_id: str) -> DeploymentState:
        """
        Cancel a running deployment.

        Args:
            deployment_id: ID of deployment to cancel

        Returns:
            Updated DeploymentState
        """
        state = self.state_manager.load_state(deployment_id)
        if not state:
            raise ValueError(f"Deployment {deployment_id} not found")

        # Get backend
        config = state.config
        backend = self.get_backend(
            state.compute_type,
            job_name=cast(str | None, config.get("job_name")),
            zone=cast(str | None, config.get("zone")),
        )

        # Cancel ALL shards with a job_id (not just running - handles race conditions)
        # Also cancel pending shards that haven't started yet
        # Rate limit delete operations to avoid hitting GCP API quotas
        cancelled_count = 0
        shards_to_cancel = [
            s for s in state.shards if s.status in [ShardStatus.RUNNING, ShardStatus.PENDING]
        ]

        if shards_to_cancel:
            logger.info(
                "Cancelling %s shards (rate limited to %s/sec)...",
                len(shards_to_cancel),
                self.rate_limiter.requests_per_second,
            )

        for shard in shards_to_cancel:
            if shard.job_id:
                # Rate limit to avoid hitting GCP API quotas (delete = write operation)
                self.rate_limiter.acquire()

                # Has a VM - try to delete it
                logger.info(
                    "Cancelling shard %s (status=%s, job_id=%s)",
                    shard.shard_id,
                    shard.status.value,
                    shard.job_id,
                )
                if backend.cancel_job(shard.job_id):
                    cancelled_count += 1
            # Mark as cancelled regardless of whether VM existed
            shard.status = ShardStatus.CANCELLED
            shard.end_time = datetime.now(UTC).isoformat()

        state.status = DeploymentStatus.CANCELLED
        self.state_manager.save_state(state)

        logger.info("Cancelled deployment %s (%s VMs deleted)", deployment_id, cancelled_count)
        return state
