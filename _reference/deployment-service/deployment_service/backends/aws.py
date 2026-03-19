"""
AWS Batch Backend for deployment orchestration.

Equivalent to Cloud Run Jobs for GCP. AWS Batch handles container job execution
with Fargate compute (serverless) or EC2 compute (managed instances).
"""

import concurrent.futures
import importlib.util
import logging
import types
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, cast

from botocore.exceptions import ClientError

from .base import ComputeBackend, JobInfo, JobStatus

if TYPE_CHECKING:
    import boto3 as _boto3_module

logger = logging.getLogger(__name__)


def _ensure_boto3() -> "types.ModuleType":
    """Deferred boto3 import — deployment AWS control-plane boundary."""
    if importlib.util.find_spec("boto3") is None:
        raise ImportError(
            "boto3 is required for AWS Batch functionality."
            " Install with: uv pip install 'deployment-service[aws]'"
        )
    import boto3  # Deferred — deployment AWS control-plane boundary

    return boto3


class AWSBatchBackend(ComputeBackend):
    """
    AWS Batch backend for container job execution.

    Uses AWS Batch with Fargate compute type for serverless container execution.
    Equivalent to Cloud Run Jobs in GCP.
    """

    def __init__(
        self,
        project_id: str,  # AWS account ID for compatibility
        region: str,
        service_account_email: str = "",  # Not used in AWS (IAM roles)
        job_queue: str | None = None,
        job_definition: str | None = None,
    ):
        """
        Initialize AWS Batch backend.

        Args:
            project_id: AWS account ID (for compatibility with base class)
            region: AWS region (e.g., "us-east-1")
            service_account_email: Not used (IAM roles handle auth in AWS)
            job_queue: AWS Batch job queue ARN or name
            job_definition: Base AWS Batch job definition ARN or name
        """
        super().__init__(project_id, region, service_account_email)

        self._account_id = project_id
        self._job_queue = job_queue or "unified-trading-job-queue"
        self._job_definition = job_definition

        # Initialize Batch client
        # cast: _ensure_boto3() returns ModuleType at runtime;
        # boto3-stubs provide .client() overloads
        _boto3 = cast("_boto3_module", _ensure_boto3())
        self._client = _boto3.client("batch", region_name=region)
        self._logs_client = _boto3.client("logs", region_name=region)

        logger.info("AWS Batch backend initialized for region: %s", region)

    @property
    def backend_type(self) -> str:
        return "aws_batch"

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
        Deploy a shard as an AWS Batch job.

        Args:
            shard_id: Unique identifier for this shard
            docker_image: Docker image URL (ECR)
            args: Command line arguments
            environment_variables: Environment variables
            compute_config: Compute configuration (vcpu, memory)
            labels: Labels/tags for the job
        """
        try:
            # Generate unique job name
            job_name = f"{shard_id}-{uuid.uuid4().hex[:8]}"

            # Build container overrides
            container_overrides = {
                "command": args if args else [],
                "environment": [
                    {"name": k, "value": str(v)} for k, v in environment_variables.items()
                ],
            }

            # Add resource requirements if specified
            if compute_config:
                resource_requirements = []
                if "vcpu" in compute_config:
                    resource_requirements.append(
                        {
                            "type": "VCPU",
                            "value": str(compute_config["vcpu"]),
                        }
                    )
                if "memory" in compute_config:
                    # Convert to MB if in GB
                    memory_mb = compute_config["memory"]
                    if isinstance(memory_mb, str) and memory_mb.endswith("Gi"):
                        memory_mb = int(memory_mb.replace("Gi", "")) * 1024
                    elif isinstance(memory_mb, str) and memory_mb.endswith("Mi"):
                        memory_mb = int(memory_mb.replace("Mi", ""))
                    resource_requirements.append(
                        {
                            "type": "MEMORY",
                            "value": str(memory_mb),
                        }
                    )
                if resource_requirements:
                    container_overrides["resourceRequirements"] = resource_requirements

            # Build job parameters
            submit_params = {
                "jobName": job_name,
                "jobQueue": self._job_queue,
                "containerOverrides": container_overrides,
            }

            # Use job definition or register one dynamically
            if self._job_definition:
                submit_params["jobDefinition"] = self._job_definition
            else:
                # Register a job definition for this image
                job_def = self._register_job_definition(docker_image, compute_config, labels)
                submit_params["jobDefinition"] = job_def

            # Add tags
            if labels:
                submit_params["tags"] = cast(
                    "str | dict[str, list[str] | list[dict[str, str]]]", labels
                )

            # Submit the job
            response = self._client.submit_job(**submit_params)
            job_id = response["jobId"]

            logger.info("Submitted AWS Batch job: %s for shard %s", job_id, shard_id)

            return JobInfo(
                job_id=job_id,
                shard_id=shard_id,
                status=JobStatus.PENDING,
                start_time=datetime.now(UTC),
                metadata={
                    "job_name": job_name,
                    "docker_image": docker_image,
                },
            )

        except ClientError as e:
            logger.error("Failed to submit AWS Batch job for shard %s: %s", shard_id, e)
            return JobInfo(
                job_id=f"failed-{shard_id}",
                shard_id=shard_id,
                status=JobStatus.FAILED,
                error_message=str(e),
            )

    def _register_job_definition(
        self,
        docker_image: str,
        compute_config: dict[str, object],
        labels: dict[str, str],
    ) -> str:
        """Register a job definition for the container."""
        job_def_name = f"unified-trading-{uuid.uuid4().hex[:8]}"

        # Default resource requirements
        vcpu = compute_config.get("vcpu", "1")
        memory = compute_config.get("memory", "2048")

        if isinstance(memory, str):
            if memory.endswith("Gi"):
                memory = int(memory.replace("Gi", "")) * 1024
            elif memory.endswith("Mi"):
                memory = int(memory.replace("Mi", ""))

        try:
            response = self._client.register_job_definition(
                jobDefinitionName=job_def_name,
                type="container",
                platformCapabilities=["FARGATE"],
                containerProperties={
                    "image": docker_image,
                    "resourceRequirements": [
                        {"type": "VCPU", "value": str(vcpu)},
                        {"type": "MEMORY", "value": str(memory)},
                    ],
                    "executionRoleArn": (
                        f"arn:aws:iam::{self._account_id}:role/unified-trading-batch-execution-role"
                    ),
                    "networkConfiguration": {
                        "assignPublicIp": "ENABLED",
                    },
                    "logConfiguration": {
                        "logDriver": "awslogs",
                        "options": {
                            "awslogs-group": "/aws/batch/unified-trading",
                            "awslogs-region": self.region,
                            "awslogs-stream-prefix": job_def_name,
                        },
                    },
                },
                tags=labels,
            )
            return response["jobDefinitionArn"]
        except ClientError as e:
            logger.error("Failed to register job definition: %s", e)
            raise

    def get_status(self, job_id: str) -> JobInfo:
        """Get the current status of a Batch job."""
        try:
            response = self._client.describe_jobs(jobs=[job_id])

            if not response.get("jobs"):
                return JobInfo(
                    job_id=job_id,
                    shard_id="unknown",
                    status=JobStatus.UNKNOWN,
                    error_message="Job not found",
                )

            job = response["jobs"][0]
            status = self._map_batch_status(job["status"])

            # Parse timestamps
            start_time = None
            end_time = None
            if "startedAt" in job:
                start_time = datetime.fromtimestamp(job["startedAt"] / 1000, UTC)
            if "stoppedAt" in job:
                end_time = datetime.fromtimestamp(job["stoppedAt"] / 1000, UTC)

            # Get error message if failed
            error_message = None
            if status == JobStatus.FAILED:
                error_message = job.get("statusReason", "Unknown error")

            return JobInfo(
                job_id=job_id,
                shard_id=job.get("jobName", "unknown"),
                status=status,
                start_time=start_time,
                end_time=end_time,
                error_message=error_message,
                logs_url=self.get_logs_url(job_id),
            )

        except ClientError as e:
            logger.error("Failed to get status for job %s: %s", job_id, e)
            return JobInfo(
                job_id=job_id,
                shard_id="unknown",
                status=JobStatus.UNKNOWN,
                error_message=str(e),
            )

    def _map_batch_status(self, batch_status: str) -> JobStatus:
        """Map AWS Batch status to JobStatus enum."""
        status_map = {
            "SUBMITTED": JobStatus.PENDING,
            "PENDING": JobStatus.PENDING,
            "RUNNABLE": JobStatus.PENDING,
            "STARTING": JobStatus.RUNNING,
            "RUNNING": JobStatus.RUNNING,
            "SUCCEEDED": JobStatus.SUCCEEDED,
            "FAILED": JobStatus.FAILED,
        }
        return status_map.get(batch_status, JobStatus.UNKNOWN)

    def get_status_batch(self, job_ids: list[str]) -> dict[str, JobInfo]:
        """Get status for multiple jobs in a single API call."""
        if not job_ids:
            return {}

        result = {}

        # AWS Batch describe_jobs supports up to 100 jobs per call
        for i in range(0, len(job_ids), 100):
            batch = job_ids[i : i + 100]
            try:
                response = self._client.describe_jobs(jobs=batch)

                for job in response.get("jobs") or []:
                    job_id = job["jobId"]
                    status = self._map_batch_status(job["status"])

                    start_time = None
                    end_time = None
                    if "startedAt" in job:
                        start_time = datetime.fromtimestamp(job["startedAt"] / 1000, UTC)
                    if "stoppedAt" in job:
                        end_time = datetime.fromtimestamp(job["stoppedAt"] / 1000, UTC)

                    error_message = None
                    if status == JobStatus.FAILED:
                        error_message = job.get("statusReason", "Unknown error")

                    result[job_id] = JobInfo(
                        job_id=job_id,
                        shard_id=job.get("jobName", "unknown"),
                        status=status,
                        start_time=start_time,
                        end_time=end_time,
                        error_message=error_message,
                    )

            except ClientError as e:
                logger.error("Failed to get batch status: %s", e)
                for job_id in batch:
                    result[job_id] = JobInfo(
                        job_id=job_id,
                        shard_id="unknown",
                        status=JobStatus.UNKNOWN,
                        error_message=str(e),
                    )

        return result

    def cancel_job(self, job_id: str) -> bool:
        """Cancel a running Batch job."""
        try:
            self._client.terminate_job(
                jobId=job_id,
                reason="Cancelled by deployment CLI",
            )
            logger.info("Cancelled AWS Batch job: %s", job_id)
            return True
        except ClientError as e:
            logger.error("Failed to cancel job %s: %s", job_id, e)
            return False

    def get_logs_url(self, job_id: str) -> str:
        """Get CloudWatch Logs URL for a job."""
        return (
            f"https://{self.region}.console.aws.amazon.com/cloudwatch/home"
            f"?region={self.region}#logsV2:log-groups/log-group/"
            f"%2Faws%2Fbatch%2Funified-trading/log-events/{job_id}"
        )

    def deploy_shards(
        self,
        shards: list[dict[str, object]],
        docker_image: str,
        environment_variables: dict[str, str],
        compute_config: dict[str, object],
        labels: dict[str, str],
        parallelism: int = 10,
    ) -> list[JobInfo]:
        """Deploy multiple shards with parallelism using array jobs."""
        # For small number of shards, use sequential submission
        if len(shards) <= parallelism:
            return super().deploy_shards(
                shards,
                docker_image,
                environment_variables,
                compute_config,
                labels,
                parallelism,
            )

        # For larger deployments, use concurrent submission
        jobs = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=parallelism) as executor:
            futures = []
            for shard in shards:
                future = executor.submit(
                    self.deploy_shard,
                    shard_id=cast(str, shard.get("shard_id", f"shard-{len(futures)}")),
                    docker_image=docker_image,
                    args=cast("list[str]", shard.get("args") or []),
                    environment_variables=environment_variables,
                    compute_config=compute_config,
                    labels=labels,
                )
                futures.append(future)

            for future in concurrent.futures.as_completed(futures):
                jobs.append(future.result())

        return jobs
