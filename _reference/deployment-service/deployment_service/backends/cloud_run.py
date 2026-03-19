"""
Cloud Run Jobs backend.

Triggers Cloud Run Jobs via the Cloud Run API.

Single-region mode: 3 retries with backoff (30s, 60s, 90s) in the configured region.
No region switching (matches GCS bucket, avoids cross-region egress).
"""

import logging
import time
from datetime import UTC, datetime
from typing import cast

from ._gcp_sdk import google_exceptions, run_v2
from .base import ComputeBackend, JobInfo, JobStatus

logger = logging.getLogger(__name__)


class CloudRunBackend(ComputeBackend):
    """
    Cloud Run Jobs backend.

    Triggers existing Cloud Run Jobs with container overrides.

    Single-region mode: 3 retries with backoff in the configured region.
    No region switching (matches GCS bucket, avoids cross-region egress).

    Note: Cloud Run uses managed/shared IPs - no external IP quota needed.
    """

    def __init__(
        self,
        project_id: str,
        region: str,
        service_account_email: str,
        job_name: str,
    ):
        """
        Initialize the Cloud Run backend.

        Args:
            project_id: GCP project ID
            region: GCP region (single region for all executions)
            service_account_email: Service account for the job
            job_name: Name of the Cloud Run Job to trigger
        """
        super().__init__(project_id, region, service_account_email)
        self.job_name = job_name
        self._jobs_client = None
        self._executions_client = None
        # Cache job template env vars so we can safely merge overrides without
        # dropping Secret Manager env vars. None means "fetch failed; don't override env".
        self._template_env_cache: dict[str, list[run_v2.EnvVar] | None] = {}

    @property
    def backend_type(self) -> str:
        return "cloud_run"

    @property
    def jobs_client(self) -> run_v2.JobsClient:
        """Lazy-load the Jobs client."""
        if self._jobs_client is None:
            self._jobs_client = run_v2.JobsClient()
        return self._jobs_client

    @property
    def executions_client(self) -> run_v2.ExecutionsClient:
        """Lazy-load the Executions client."""
        if self._executions_client is None:
            self._executions_client = run_v2.ExecutionsClient()
        return self._executions_client

    @property
    def job_path(self) -> str:
        """Full resource path for the Cloud Run Job in current region."""
        return f"projects/{self.project_id}/locations/{self.region}/jobs/{self.job_name}"

    def _get_template_env(self) -> list[run_v2.EnvVar] | None:
        """
        Fetch and cache the Cloud Run Job template env vars for the current region.

        Returns:
            - List[EnvVar] if fetched successfully (may be empty if job has no env)
            - None if fetch failed (caller should avoid overriding env in that case)
        """
        if self.region in self._template_env_cache:
            return self._template_env_cache[self.region]

        try:
            job = self.jobs_client.get_job(name=self.job_path)
            # Use direct attribute access: run_v2 protobuf stubs have typed fields.
            # job.template: ExecutionTemplate, .template: TaskTemplate,
            # .containers: MutableSequence[Container]
            job_template: run_v2.ExecutionTemplate | None = (
                job.template if hasattr(job, "template") else None
            )
            execution_template: run_v2.TaskTemplate | None = (
                job_template.template
                if job_template and hasattr(job_template, "template")
                else None
            )
            containers: list[run_v2.Container] | None = (
                list(execution_template.containers)
                if execution_template and hasattr(execution_template, "containers")
                else None
            )

            env: list[run_v2.EnvVar] = []
            if containers:
                container = containers[0]
                container_env: list[run_v2.EnvVar] = (
                    list(container.env) if hasattr(container, "env") else []
                )
                if container_env:
                    env = container_env

            self._template_env_cache[self.region] = env
            return env
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning(
                "[CLOUD_RUN_ENV] Failed to fetch job template env for %s: %s", self.job_path, e
            )
            self._template_env_cache[self.region] = None
            return None

    def _merge_env(
        self, template_env: list[run_v2.EnvVar], overrides: dict[str, str]
    ) -> list[run_v2.EnvVar]:
        """
        Merge job template env vars with per-execution overrides.

        The result includes all template env vars (including Secret Manager value_source)
        plus any overrides/additions provided by the caller.
        """
        overrides = overrides or {}

        merged: list[run_v2.EnvVar] = []
        template_names = set()

        # Preserve template ordering; replace values when overridden.
        for env in template_env:
            name: str | None = cast(str | None, getattr(env, "name", None))
            if not name:
                continue
            template_names.add(name)

            if name in overrides:
                # Warn if we're overriding a secret-backed env var.
                value_source = getattr(env, "value_source", None)
                if value_source:
                    logger.warning(
                        "[CLOUD_RUN_ENV] Overriding secret-backed env var '%s'"
                        " for execution overrides",
                        name,
                    )
                merged.append(run_v2.EnvVar(name=name, value=str(overrides[name])))
            else:
                merged.append(env)

        # Append any extra overrides not present in template.
        for name, value in overrides.items():
            if name in template_names:
                continue
            merged.append(run_v2.EnvVar(name=name, value=str(value)))

        return merged

    def _is_quota_exhausted_error(self, error: Exception) -> bool:
        """
        Check if error indicates quota exhaustion that warrants region switch.

        Args:
            error: The exception to check

        Returns:
            True if this is a quota exhaustion error
        """
        error_str = str(error).lower()

        # Cloud Run quota indicators
        quota_indicators = [
            "quota",
            "resource exhausted",
            "runningexecutionsperproject",
            "too many concurrent",
            "execution limit",
            "exceeded",
        ]

        return any(indicator in error_str for indicator in quota_indicators)

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
        Trigger a Cloud Run Job execution for this shard.

        Optimized for bulk launching - single API call, no listing.
        Single-region: 3 retries with backoff, then fail.

        Args:
            shard_id: Unique identifier for this shard
            docker_image: Docker image (not used - job already configured)
            args: Command line arguments to override
            environment_variables: Environment variables to add
            compute_config: Cloud Run specific config (memory, cpu, timeout)
            labels: Labels (added to execution annotations)

        Returns:
            JobInfo with execution ID
        """
        logger.info("Triggering Cloud Run Job for shard %s in region %s", shard_id, self.region)
        logger.debug("Args: %s", args)

        # Build container overrides.
        #
        # Cloud Run Jobs container overrides replace the container spec fields for the execution.
        # If we override env vars without including the template env, we can accidentally drop
        # Secret Manager env vars. To stay safe, we fetch the job template env once per region
        # and merge it with the
        # per-shard env overrides (e.g., SHARD_INDEX / TOTAL_SHARDS).
        template_env = self._get_template_env()
        if template_env is None:
            # Safety fallback: don't override env if we can't fetch the template env.
            container_override = run_v2.RunJobRequest.Overrides.ContainerOverride(
                args=args,
            )
        else:
            merged_env = self._merge_env(template_env, environment_variables)
            container_override = run_v2.RunJobRequest.Overrides.ContainerOverride(
                args=args,
                env=merged_env,
            )

        overrides = run_v2.RunJobRequest.Overrides(
            container_overrides=[container_override],
        )

        # Retry with linear backoff for rate limiting (429 errors)
        # Delays: 30s, 60s, 90s (gives time for quota to reset - 600 req/min)
        retry_delays = [30, 60, 90]
        max_retries = len(retry_delays) + 1

        for attempt in range(max_retries):
            # Build request with current region's job path
            request = run_v2.RunJobRequest(
                name=self.job_path,
                overrides=overrides,
            )

            try:
                # Trigger the job - DON'T call operation.result() as it blocks until completion
                operation = self.jobs_client.run_job(request=request)

                # Extract execution name from operation name
                execution_name = None
                execution_id = None

                # Try to get from operation metadata
                try:
                    if hasattr(operation, "metadata") and operation.metadata:
                        metadata = operation.metadata
                        if hasattr(metadata, "name"):
                            execution_name = metadata.name
                            execution_id = execution_name.split("/")[-1]
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Could not read operation metadata: %s", e)

                # Fallback: use operation name as execution reference
                if not execution_name:
                    execution_id = f"{shard_id}-{datetime.now(UTC).strftime('%H%M%S%f')[:10]}"
                    execution_name = f"{self.job_path}/executions/{execution_id}"

                return JobInfo(
                    job_id=execution_name,
                    shard_id=shard_id,
                    status=JobStatus.RUNNING,
                    start_time=datetime.now(UTC),
                    logs_url=self.get_logs_url(execution_name),
                    metadata={
                        "execution_id": execution_id,
                        "job_name": self.job_name,
                        "region": self.region,
                    },
                )

            except google_exceptions.ResourceExhausted as e:
                # 429 Too Many Requests - rate limit or quota hit
                error_str = str(e)

                if self._is_quota_exhausted_error(e):
                    logger.warning(
                        "[QUOTA_EXHAUSTED] Cloud Run quota exhausted in %s for shard %s: %s",
                        self.region,
                        shard_id,
                        error_str[:100],
                    )

                # Retry with backoff (same region)
                if attempt < len(retry_delays):
                    delay = retry_delays[attempt]
                    logger.warning(
                        "[RATE_LIMITED] Cloud Run rate limited for shard %s,"
                        " retrying in %ss (attempt %s/%s)",
                        shard_id,
                        delay,
                        attempt + 1,
                        max_retries,
                    )
                    time.sleep(delay)
                else:
                    logger.error(
                        "[RATE_LIMIT_EXCEEDED] Failed to trigger job for shard %s"
                        " after %s retries in %s: %s",
                        shard_id,
                        max_retries,
                        self.region,
                        e,
                    )
                    return JobInfo(
                        job_id=f"failed-{shard_id}",
                        shard_id=shard_id,
                        status=JobStatus.FAILED,
                        error_message=(
                            f"Rate limit/quota exceeded after {max_retries} retries"
                            f" in {self.region}"
                        ),
                    )

            except google_exceptions.NotFound:
                logger.error(
                    "[JOB_NOT_FOUND] Cloud Run Job %s not found in %s", self.job_name, self.region
                )
                return JobInfo(
                    job_id=f"failed-{shard_id}",
                    shard_id=shard_id,
                    status=JobStatus.FAILED,
                    error_message=f"Job {self.job_name} not found in {self.region}",
                )

            except (OSError, ValueError, RuntimeError) as e:
                error_str = str(e)

                if self._is_quota_exhausted_error(e):
                    logger.warning(
                        "[QUOTA_ERROR] Cloud Run error in %s for shard %s: %s",
                        self.region,
                        shard_id,
                        error_str[:100],
                    )

                logger.error("Failed to trigger job for shard %s: %s", shard_id, e)
                return JobInfo(
                    job_id=f"failed-{shard_id}",
                    shard_id=shard_id,
                    status=JobStatus.FAILED,
                    error_message=str(e),
                )

        # Should not reach here, but just in case
        return JobInfo(
            job_id=f"failed-{shard_id}",
            shard_id=shard_id,
            status=JobStatus.FAILED,
            error_message="Unknown error",
        )

    def get_status_batch(self, job_ids: list[str]) -> dict[str, JobInfo]:
        """
        Get status for multiple executions in a single API call.

        Uses list_executions to fetch all executions at once, which is much faster
        than calling get_execution for each one (1 API call vs N API calls).

        Args:
            job_ids: List of execution names (full resource paths)

        Returns:
            Dict mapping job_id to JobInfo
        """
        if not job_ids:
            return {}

        results = {}
        job_id_set = set(job_ids)

        try:
            # List all executions for this job (single API call)
            parent = f"projects/{self.project_id}/locations/{self.region}/jobs/{self.job_name}"
            request = run_v2.ListExecutionsRequest(parent=parent, page_size=1000)

            # Paginate through all executions
            for execution in self.executions_client.list_executions(request=request):
                if execution.name not in job_id_set:
                    continue

                # Map Cloud Run status to JobStatus
                if execution.completion_time:
                    status = JobStatus.FAILED if execution.failed_count > 0 else JobStatus.SUCCEEDED
                elif execution.running_count > 0:
                    status = JobStatus.RUNNING
                else:
                    status = JobStatus.PENDING

                # Extract error message if failed
                error_message = None
                if status == JobStatus.FAILED and execution.conditions:
                    for condition in execution.conditions:
                        if condition.type_ == "Failed" and condition.message:
                            error_message = condition.message
                            break

                results[execution.name] = JobInfo(
                    job_id=execution.name,
                    shard_id=execution.name.split("/")[-1],
                    status=status,
                    start_time=cast(
                        "datetime | None", execution.start_time if execution.start_time else None
                    ),
                    end_time=cast(
                        "datetime | None",
                        execution.completion_time if execution.completion_time else None,
                    ),
                    error_message=error_message,
                    logs_url=self.get_logs_url(execution.name),
                    metadata={
                        "running_count": execution.running_count,
                        "succeeded_count": execution.succeeded_count,
                        "failed_count": execution.failed_count,
                    },
                )

                # Early exit if we found all requested job_ids
                if len(results) == len(job_id_set):
                    break

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to list executions: %s", e)
            # Fall back to empty results - caller can use get_status individually

        # For any job_ids not found in listing, mark as SUCCEEDED (completed and cleaned up by GCP)
        for job_id in job_id_set:
            if job_id not in results:
                logger.debug(
                    "Execution %s not found in listing (likely completed and cleaned up)", job_id
                )
                results[job_id] = JobInfo(
                    job_id=job_id,
                    shard_id=job_id.split("/")[-1] if "/" in job_id else "unknown",
                    status=JobStatus.SUCCEEDED,
                    metadata={
                        "note": "Execution no longer exists - likely completed and cleaned up"
                    },
                )

        return results

    def get_status(self, job_id: str) -> JobInfo:
        """
        Get the current status of a Cloud Run execution.

        Args:
            job_id: The execution name (full resource path)

        Returns:
            JobInfo with current status
        """
        try:
            execution = self.executions_client.get_execution(name=job_id)

            # Map Cloud Run status to JobStatus
            if execution.completion_time:
                status = JobStatus.FAILED if execution.failed_count > 0 else JobStatus.SUCCEEDED
            elif execution.running_count > 0:
                status = JobStatus.RUNNING
            else:
                status = JobStatus.PENDING

            # Extract error message if failed
            error_message = None
            if status == JobStatus.FAILED and execution.conditions:
                for condition in execution.conditions:
                    if condition.type_ == "Failed" and condition.message:
                        error_message = condition.message
                        break

            return JobInfo(
                job_id=job_id,
                shard_id=execution.name.split("/")[-1],
                status=status,
                start_time=cast(
                    "datetime | None", execution.start_time if execution.start_time else None
                ),
                end_time=cast(
                    "datetime | None",
                    execution.completion_time if execution.completion_time else None,
                ),
                error_message=error_message,
                logs_url=self.get_logs_url(job_id),
                metadata={
                    "running_count": execution.running_count,
                    "succeeded_count": execution.succeeded_count,
                    "failed_count": execution.failed_count,
                },
            )
        except (OSError, ValueError, RuntimeError) as e:
            error_str = str(e)
            # Check if execution no longer exists (GCP cleans up completed executions)
            # Error code 5 = NOT_FOUND
            if "does not exist" in error_str or "code: 5" in error_str or "NOT_FOUND" in error_str:
                logger.debug(
                    "Execution %s no longer exists (completed and cleaned up by GCP)", job_id
                )
                return JobInfo(
                    job_id=job_id,
                    shard_id=job_id.split("/")[-1] if "/" in job_id else "unknown",
                    status=JobStatus.SUCCEEDED,  # Assume completed if cleaned up
                    metadata={
                        "note": "Execution no longer exists - likely completed and cleaned up"
                    },
                )
            else:
                logger.error("Failed to get execution status: %s", e)
                return JobInfo(
                    job_id=job_id,
                    shard_id="unknown",
                    status=JobStatus.UNKNOWN,
                    error_message=str(e),
                )

    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a Cloud Run execution.

        Args:
            job_id: The execution name

        Returns:
            True if cancellation was successful or execution no longer exists
        """
        try:
            request = run_v2.CancelExecutionRequest(name=job_id)
            self.executions_client.cancel_execution(request=request)
            logger.info("Cancelled execution %s", job_id)
            return True
        except (OSError, ValueError, RuntimeError) as e:
            error_str = str(e)
            # If execution doesn't exist, it's already done - consider it a success
            if "does not exist" in error_str or "code: 5" in error_str or "NOT_FOUND" in error_str:
                logger.debug("Execution %s no longer exists (already completed)", job_id)
                return True
            else:
                logger.error("Failed to cancel execution %s: %s", job_id, e)
                return False

    def get_logs_url(self, job_id: str) -> str:
        """
        Get the Cloud Logging URL for an execution.

        Args:
            job_id: The execution name (full path or just execution ID)

        Returns:
            URL to Cloud Run Jobs execution logs
        """
        execution_id = job_id.split("/")[-1] if "/" in job_id else job_id
        # URL format: /run/jobs/details/{region}/{job_name}/executions/{execution_id}
        return (
            f"https://console.cloud.google.com/run/jobs/details/"
            f"{self.region}/{self.job_name}/executions/{execution_id}"
            f"?project={self.project_id}"
        )
