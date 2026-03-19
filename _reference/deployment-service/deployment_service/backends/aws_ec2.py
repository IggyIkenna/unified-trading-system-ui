"""
AWS EC2 Backend for deployment orchestration.

Equivalent to GCE VMs for GCP. Uses EC2 instances with a container-optimized
AMI (Amazon ECS-optimized AMI) to run Docker containers.
"""

import base64
import concurrent.futures
import importlib.util
import logging
import types
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING, cast

from .base import ComputeBackend, JobInfo, JobStatus

if TYPE_CHECKING:
    import boto3 as _boto3_module

# Deferred botocore — only imported when AWS EC2 is actually used.
if importlib.util.find_spec("botocore") is not None:
    from botocore.exceptions import ClientError
else:
    ClientError = Exception

logger = logging.getLogger(__name__)


def _ensure_boto3() -> "types.ModuleType":
    """Deferred boto3 import — deployment AWS control-plane boundary."""
    if importlib.util.find_spec("boto3") is None:
        raise ImportError(
            "boto3 is required for AWS EC2 functionality. Install with: uv pip install 'deployment-service[aws]'"
        )
    import boto3  # Deferred — deployment AWS control-plane boundary

    return boto3


class AWSEC2Backend(ComputeBackend):
    """
    AWS EC2 backend for VM-based container execution.

    Creates EC2 instances with Amazon ECS-optimized AMI and runs containers.
    Equivalent to GCE VMs with Container-Optimized OS.
    """

    # Amazon Linux 2 ECS-optimized AMI IDs by region (updated periodically)
    # These run Docker out of the box
    ECS_OPTIMIZED_AMI = {
        "us-east-1": "ami-0a699202e5027c10d",
        "us-west-2": "ami-0f1e01f2f52d3de50",
        "eu-west-1": "ami-0b84fd1c50b6c7e1f",
        "ap-northeast-1": "ami-0b2d2e53a4d8f6e92",
    }

    def __init__(
        self,
        project_id: str,  # AWS account ID for compatibility
        region: str,
        service_account_email: str = "",  # Not used (IAM roles)
        subnet_id: str | None = None,
        security_group_id: str | None = None,
        instance_profile_arn: str | None = None,
        key_name: str | None = None,
    ):
        """
        Initialize AWS EC2 backend.

        Args:
            project_id: AWS account ID
            region: AWS region
            service_account_email: Not used (IAM instance profiles)
            subnet_id: VPC subnet ID for instances
            security_group_id: Security group ID
            instance_profile_arn: IAM instance profile ARN
            key_name: EC2 key pair name for SSH access
        """
        super().__init__(project_id, region, service_account_email)

        self._account_id = project_id
        self._subnet_id = subnet_id
        self._security_group_id = security_group_id
        self._instance_profile_arn = instance_profile_arn
        self._key_name = key_name

        # Initialize EC2 client
        # cast: _ensure_boto3() returns ModuleType at runtime; boto3-stubs provide .client()/.resource() overloads
        _boto3 = cast("_boto3_module", _ensure_boto3())
        self._client = _boto3.client("ec2", region_name=region)
        self._resource = _boto3.resource("ec2", region_name=region)
        self._ssm_client = _boto3.client("ssm", region_name=region)

        logger.info("AWS EC2 backend initialized for region: %s", region)

    @property
    def backend_type(self) -> str:
        return "aws_ec2"

    def _get_instance_type(self, compute_config: dict[str, object]) -> str:
        """Map compute config to EC2 instance type."""
        vcpu: float = float(cast(float, compute_config.get("vcpu") or 2))
        memory_raw = compute_config.get("memory") or 4
        memory_gb: float

        if isinstance(memory_raw, str):
            if memory_raw.endswith("Gi"):
                memory_gb = float(int(memory_raw.replace("Gi", "")))
            elif memory_raw.endswith("Mi"):
                memory_gb = int(memory_raw.replace("Mi", "")) / 1024.0
            else:
                memory_gb = float(memory_raw)
        else:
            memory_gb = float(cast(float, memory_raw))

        # Map to appropriate instance type
        if vcpu <= 2 and memory_gb <= 4:
            return "t3.medium"  # 2 vCPU, 4 GB
        elif vcpu <= 2 and memory_gb <= 8:
            return "t3.large"  # 2 vCPU, 8 GB
        elif vcpu <= 4 and memory_gb <= 16:
            return "t3.xlarge"  # 4 vCPU, 16 GB
        elif vcpu <= 8 and memory_gb <= 32:
            return "t3.2xlarge"  # 8 vCPU, 32 GB
        elif vcpu <= 16 and memory_gb <= 64:
            return "m5.4xlarge"  # 16 vCPU, 64 GB
        else:
            return "m5.8xlarge"  # 32 vCPU, 128 GB

    def _get_ami_id(self) -> str:
        """Get the ECS-optimized AMI ID for the region."""
        # Try to get from SSM parameter (always up to date)
        try:
            response = self._ssm_client.get_parameter(
                Name="/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
            )
            return response["Parameter"]["Value"]
        except (OSError, ValueError, RuntimeError):
            # Fallback to hardcoded AMI
            return self.ECS_OPTIMIZED_AMI.get(self.region, self.ECS_OPTIMIZED_AMI["us-east-1"])

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
        Deploy a shard as an EC2 instance running a container.
        """
        try:
            instance_name = f"unified-trading-{shard_id}-{uuid.uuid4().hex[:8]}"
            instance_type = self._get_instance_type(compute_config)
            ami_id = self._get_ami_id()

            # Build environment variables for container
            env_str = " ".join([f'-e {k}="{v}"' for k, v in environment_variables.items()])

            # Build command
            cmd_args = " ".join(args) if args else ""

            # Create startup script (user data)
            startup_script = f"""#!/bin/bash
set -e

# Log startup
echo "Starting unified-trading container job: {shard_id}"

# Install docker if not present (should be on ECS-optimized AMI)
if ! command -v docker &> /dev/null; then
    yum install -y docker
    systemctl start docker
fi

# Login to ECR if using ECR image
if [[ "{docker_image}" == *".dkr.ecr."* ]]; then
    REGION=$(echo "{docker_image}" | cut -d'.' -f4)
    aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $(echo "{docker_image}" | cut -d'/' -f1)
fi

# Pull and run the container
echo "Pulling image: {docker_image}"
docker pull {docker_image}

# CRITICAL: Do NOT add --dns with public DNS servers. Public DNS breaks metadata.google.internal
# on GCP. Aligned with GCP policy for consistency. See tests/unit/test_docker_dns_validation.py
echo "Running container..."
docker run --rm {env_str} {docker_image} {cmd_args}

# Signal completion and shutdown
echo "Job completed, shutting down..."
shutdown -h now
"""

            # Encode user data
            user_data = base64.b64encode(startup_script.encode()).decode()

            # Build instance tags
            tags = [
                {"Key": "Name", "Value": instance_name},
                {"Key": "shard_id", "Value": shard_id},
                {"Key": "Service", "Value": "unified-trading"},
                {"Key": "ManagedBy", "Value": "deployment-cli"},
            ]
            for k, v in labels.items():
                tags.append({"Key": k, "Value": str(v)})

            # Launch parameters
            launch_params = {
                "ImageId": ami_id,
                "InstanceType": instance_type,
                "MinCount": 1,
                "MaxCount": 1,
                "UserData": user_data,
                "TagSpecifications": [
                    {
                        "ResourceType": "instance",
                        "Tags": tags,
                    },
                ],
                "InstanceInitiatedShutdownBehavior": "terminate",
            }

            # Add optional parameters
            if self._subnet_id:
                launch_params["SubnetId"] = self._subnet_id

            if self._security_group_id:
                launch_params["SecurityGroupIds"] = cast(
                    "str | int | list[dict[str, str | list[dict[str, str]]]]",
                    [self._security_group_id],
                )

            if self._instance_profile_arn:
                launch_params["IamInstanceProfile"] = cast(
                    object, {"Arn": self._instance_profile_arn}
                )

            if self._key_name:
                launch_params["KeyName"] = self._key_name

            # Launch the instance
            response = self._client.run_instances(**launch_params)
            instance_id = response["Instances"][0]["InstanceId"]

            logger.info("Launched EC2 instance: %s for shard %s", instance_id, shard_id)

            return JobInfo(
                job_id=instance_id,
                shard_id=shard_id,
                status=JobStatus.PENDING,
                start_time=datetime.now(UTC),
                metadata={
                    "instance_name": instance_name,
                    "instance_type": instance_type,
                    "docker_image": docker_image,
                },
            )

        except ClientError as e:
            logger.error("Failed to launch EC2 instance for shard %s: %s", shard_id, e)
            return JobInfo(
                job_id=f"failed-{shard_id}",
                shard_id=shard_id,
                status=JobStatus.FAILED,
                error_message=str(e),
            )

    def get_status(self, job_id: str) -> JobInfo:
        """Get the current status of an EC2 instance."""
        try:
            response = self._client.describe_instances(InstanceIds=[job_id])

            if not response["Reservations"]:
                return JobInfo(
                    job_id=job_id,
                    shard_id="unknown",
                    status=JobStatus.UNKNOWN,
                    error_message="Instance not found",
                )

            instance = response["Reservations"][0]["Instances"][0]
            status = self._map_instance_state(instance["State"]["Name"])

            # Get shard_id from tags
            shard_id = "unknown"
            for tag in instance.get("Tags") or []:
                if tag["Key"] == "shard_id":
                    shard_id = tag["Value"]
                    break

            # Parse timestamps
            start_time = instance.get("LaunchTime")
            if start_time and not isinstance(start_time, datetime):
                start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))

            return JobInfo(
                job_id=job_id,
                shard_id=shard_id,
                status=status,
                start_time=start_time,
                logs_url=self.get_logs_url(job_id),
            )

        except ClientError as e:
            if "InvalidInstanceID.NotFound" in str(e):
                # Instance terminated and cleaned up - can't verify success, assume FAILED
                # This is safer than assuming success without status confirmation
                return JobInfo(
                    job_id=job_id,
                    shard_id="unknown",
                    status=JobStatus.FAILED,
                    error_message="Instance terminated/deleted without status confirmation",
                )

            logger.error("Failed to get status for instance %s: %s", job_id, e)
            return JobInfo(
                job_id=job_id,
                shard_id="unknown",
                status=JobStatus.UNKNOWN,
                error_message=str(e),
            )

    def _map_instance_state(self, state: str) -> JobStatus:
        """Map EC2 instance state to JobStatus."""
        # IMPORTANT: terminated state should NOT automatically mean success
        # The job may have crashed or been preempted. Without a status file
        # mechanism like GCP VMs have, we treat terminated as UNKNOWN and let
        # the orchestrator handle it (which may mark as failed after timeout).
        state_map = {
            "pending": JobStatus.PENDING,
            "running": JobStatus.RUNNING,
            "shutting-down": JobStatus.RUNNING,
            "terminated": JobStatus.UNKNOWN,  # Can't assume success without verification
            "stopping": JobStatus.RUNNING,
            "stopped": JobStatus.FAILED,  # Stopped without terminating = likely failure
        }
        return state_map.get(state, JobStatus.UNKNOWN)

    def get_status_batch(self, job_ids: list[str]) -> dict[str, JobInfo]:
        """Get status for multiple EC2 instances in a single API call."""
        if not job_ids:
            return {}

        result = {}

        # EC2 describe_instances supports filtering by multiple InstanceIds
        for i in range(0, len(job_ids), 100):
            batch = job_ids[i : i + 100]
            try:
                response = self._client.describe_instances(InstanceIds=batch)

                for reservation in response.get("Reservations") or []:
                    for instance in reservation.get("Instances") or []:
                        instance_id = instance["InstanceId"]
                        status = self._map_instance_state(instance["State"]["Name"])

                        shard_id = "unknown"
                        for tag in instance.get("Tags") or []:
                            if tag["Key"] == "shard_id":
                                shard_id = tag["Value"]
                                break

                        start_time = instance.get("LaunchTime")
                        if start_time and not isinstance(start_time, datetime):
                            start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00"))

                        result[instance_id] = JobInfo(
                            job_id=instance_id,
                            shard_id=shard_id,
                            status=status,
                            start_time=start_time,
                            logs_url=self.get_logs_url(instance_id),
                        )

            except ClientError as e:
                logger.error("Failed to get batch status for instances: %s", e)
                for job_id in batch:
                    result[job_id] = JobInfo(
                        job_id=job_id,
                        shard_id="unknown",
                        status=JobStatus.UNKNOWN,
                        error_message=str(e),
                    )

        return result

    def cancel_job(self, job_id: str) -> bool:
        """Terminate an EC2 instance."""
        try:
            self._client.terminate_instances(InstanceIds=[job_id])
            logger.info("Terminated EC2 instance: %s", job_id)
            return True
        except ClientError as e:
            logger.error("Failed to terminate instance %s: %s", job_id, e)
            return False

    def get_logs_url(self, job_id: str) -> str:
        """Get CloudWatch Logs or Systems Manager URL for an instance."""
        return (
            f"https://{self.region}.console.aws.amazon.com/ec2/v2/home"
            f"?region={self.region}#InstanceDetails:instanceId={job_id}"
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
        """Deploy multiple shards with parallelism."""
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
