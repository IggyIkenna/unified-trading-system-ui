"""
Unit tests for deployment_service.backends.aws.AWSBatchBackend.

The aws.py module imports botocore at the top level and calls boto3 during
__init__. We patch _ensure_boto3 (so no real AWS call) and inject a mock
client directly onto the backend instance.

Coverage targets:
- AWSBatchBackend.__init__: initialisation, default and custom queue
- backend_type property
- deploy_shard: success with job_definition set, memory Gi conversion, memory Mi
  conversion, numeric memory, dynamic job definition registration (no job_definition),
  with and without labels, ClientError → FAILED JobInfo
- _register_job_definition: success path, memory Gi/Mi conversions, ClientError re-raise
- get_status: RUNNING / SUCCEEDED / FAILED / PENDING / not-found / ClientError,
  with and without timestamps
- _map_batch_status: all known states + unknown fallback
- get_status_batch: empty list, single batch, >100 jobs chunking, FAILED job,
  timestamps present, ClientError per-batch error
- cancel_job: success, ClientError → False
- get_logs_url: URL format
- deploy_shards: small (≤ parallelism) → sequential, large (> parallelism) → concurrent
"""

from unittest.mock import MagicMock, patch

import pytest
from botocore.exceptions import ClientError

from deployment_service.backends.aws import AWSBatchBackend
from deployment_service.backends.base import JobStatus

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ACCOUNT_ID = "123456789012"
REGION = "us-east-1"
JOB_QUEUE = "test-job-queue"
JOB_DEF = "arn:aws:batch:us-east-1:123456789012:job-definition/my-def:1"
DOCKER_IMAGE = "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-image:latest"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_client_error(code: str = "AccessDenied", message: str = "test error") -> ClientError:
    return ClientError(
        error_response={"Error": {"Code": code, "Message": message}},
        operation_name="TestOp",
    )


def _make_backend(
    job_queue: str | None = JOB_QUEUE,
    job_definition: str | None = JOB_DEF,
) -> tuple[AWSBatchBackend, MagicMock]:
    """Return (backend, mock_client) with boto3 patched out."""
    mock_client = MagicMock()
    mock_logs_client = MagicMock()

    mock_boto3 = MagicMock()
    mock_boto3.client.side_effect = lambda svc, region_name: (
        mock_client if svc == "batch" else mock_logs_client
    )

    with patch("deployment_service.backends.aws._ensure_boto3", return_value=mock_boto3):
        backend = AWSBatchBackend(
            project_id=ACCOUNT_ID,
            region=REGION,
            job_queue=job_queue,
            job_definition=job_definition,
        )

    return backend, mock_client


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestAWSBatchBackendInit:
    def test_backend_type(self) -> None:
        backend, _ = _make_backend()
        assert backend.backend_type == "aws_batch"

    def test_default_job_queue_used_when_none(self) -> None:
        backend, _ = _make_backend(job_queue=None)
        assert backend._job_queue == "unified-trading-job-queue"

    def test_custom_job_queue_stored(self) -> None:
        backend, _ = _make_backend(job_queue="my-queue")
        assert backend._job_queue == "my-queue"

    def test_account_id_stored(self) -> None:
        backend, _ = _make_backend()
        assert backend._account_id == ACCOUNT_ID

    def test_region_stored(self) -> None:
        backend, _ = _make_backend()
        assert backend.region == REGION

    def test_job_definition_stored(self) -> None:
        backend, _ = _make_backend(job_definition=JOB_DEF)
        assert backend._job_definition == JOB_DEF

    def test_no_job_definition_stored_as_none(self) -> None:
        backend, _ = _make_backend(job_definition=None)
        assert backend._job_definition is None


# ---------------------------------------------------------------------------
# deploy_shard — success paths
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestDeployShardSuccess:
    def test_submit_with_job_definition_returns_pending(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "job-abc-123", "jobName": "shard0-xyz"}

        result = backend.deploy_shard(
            shard_id="shard0",
            docker_image=DOCKER_IMAGE,
            args=["--mode", "train"],
            environment_variables={"ENV": "prod"},
            compute_config={"vcpu": "2", "memory": "4096"},
            labels={"team": "ml"},
        )

        assert result.status == JobStatus.PENDING
        assert result.job_id == "job-abc-123"
        assert result.shard_id == "shard0"
        assert result.start_time is not None
        assert result.metadata["docker_image"] == DOCKER_IMAGE
        mock_client.submit_job.assert_called_once()

    def test_submit_includes_job_definition_from_field(self) -> None:
        backend, mock_client = _make_backend(job_definition=JOB_DEF)
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        assert call_kwargs["jobDefinition"] == JOB_DEF

    def test_memory_gi_converted_to_mb(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={"memory": "4Gi"},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        resource_reqs = call_kwargs["containerOverrides"]["resourceRequirements"]
        mem_req = next(r for r in resource_reqs if r["type"] == "MEMORY")
        assert mem_req["value"] == "4096"

    def test_memory_mi_passed_as_is(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={"memory": "2048Mi"},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        resource_reqs = call_kwargs["containerOverrides"]["resourceRequirements"]
        mem_req = next(r for r in resource_reqs if r["type"] == "MEMORY")
        assert mem_req["value"] == "2048"

    def test_numeric_memory_passed_directly(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={"memory": 8192},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        resource_reqs = call_kwargs["containerOverrides"]["resourceRequirements"]
        mem_req = next(r for r in resource_reqs if r["type"] == "MEMORY")
        assert mem_req["value"] == "8192"

    def test_vcpu_resource_requirement_included(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={"vcpu": "4"},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        resource_reqs = call_kwargs["containerOverrides"]["resourceRequirements"]
        vcpu_req = next(r for r in resource_reqs if r["type"] == "VCPU")
        assert vcpu_req["value"] == "4"

    def test_empty_compute_config_no_resource_requirements(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        assert "resourceRequirements" not in call_kwargs["containerOverrides"]

    def test_labels_added_as_tags(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        labels = {"env": "prod", "team": "ml"}
        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={},
            labels=labels,
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        assert call_kwargs["tags"] == labels

    def test_empty_labels_no_tags_key(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        assert "tags" not in call_kwargs

    def test_empty_args_produces_empty_command(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        assert call_kwargs["containerOverrides"]["command"] == []

    def test_env_vars_encoded_in_container_overrides(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(
            shard_id="s1",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={"KEY": "val", "OTHER": "x"},
            compute_config={},
            labels={},
        )

        call_kwargs = mock_client.submit_job.call_args.kwargs
        env = call_kwargs["containerOverrides"]["environment"]
        assert {"name": "KEY", "value": "val"} in env
        assert {"name": "OTHER", "value": "x"} in env


# ---------------------------------------------------------------------------
# deploy_shard — dynamic job definition registration
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestDeployShardDynamicJobDef:
    def test_registers_job_definition_when_not_set(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/auto-def:1"
        }
        mock_client.submit_job.return_value = {"jobId": "j2"}

        result = backend.deploy_shard(
            shard_id="s2",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={"vcpu": "1", "memory": "2048"},
            labels={},
        )

        mock_client.register_job_definition.assert_called_once()
        assert result.status == JobStatus.PENDING
        call_kwargs = mock_client.submit_job.call_args.kwargs
        assert call_kwargs["jobDefinition"] == "arn:aws:batch:::job-definition/auto-def:1"


# ---------------------------------------------------------------------------
# deploy_shard — error path
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestDeployShardError:
    def test_client_error_returns_failed_job_info(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.side_effect = _make_client_error("ValidationError")

        result = backend.deploy_shard(
            shard_id="s-fail",
            docker_image=DOCKER_IMAGE,
            args=[],
            environment_variables={},
            compute_config={},
            labels={},
        )

        assert result.status == JobStatus.FAILED
        assert result.shard_id == "s-fail"
        assert result.job_id == "failed-s-fail"
        assert result.error_message is not None


# ---------------------------------------------------------------------------
# _register_job_definition
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestRegisterJobDefinition:
    def test_success_returns_arn(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        expected_arn = "arn:aws:batch:::job-definition/def:1"
        mock_client.register_job_definition.return_value = {"jobDefinitionArn": expected_arn}

        arn = backend._register_job_definition(
            docker_image=DOCKER_IMAGE,
            compute_config={"vcpu": "2", "memory": "4096"},
            labels={},
        )
        assert arn == expected_arn

    def test_memory_gi_converted_in_registration(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/def:1"
        }

        backend._register_job_definition(
            docker_image=DOCKER_IMAGE,
            compute_config={"memory": "8Gi"},
            labels={},
        )

        call_kwargs = mock_client.register_job_definition.call_args.kwargs
        container_props = call_kwargs["containerProperties"]
        mem_req = next(r for r in container_props["resourceRequirements"] if r["type"] == "MEMORY")
        assert mem_req["value"] == "8192"

    def test_memory_mi_converted_in_registration(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/def:1"
        }

        backend._register_job_definition(
            docker_image=DOCKER_IMAGE,
            compute_config={"memory": "1024Mi"},
            labels={},
        )

        call_kwargs = mock_client.register_job_definition.call_args.kwargs
        container_props = call_kwargs["containerProperties"]
        mem_req = next(r for r in container_props["resourceRequirements"] if r["type"] == "MEMORY")
        assert mem_req["value"] == "1024"

    def test_client_error_is_reraised(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.side_effect = _make_client_error("ThrottlingException")

        with pytest.raises(ClientError):
            backend._register_job_definition(
                docker_image=DOCKER_IMAGE,
                compute_config={},
                labels={},
            )

    def test_role_arn_includes_account_id(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/def:1"
        }

        backend._register_job_definition(DOCKER_IMAGE, {}, {})

        call_kwargs = mock_client.register_job_definition.call_args.kwargs
        exec_role = call_kwargs["containerProperties"]["executionRoleArn"]
        assert ACCOUNT_ID in exec_role

    def test_platform_capabilities_set_to_fargate(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/def:1"
        }

        backend._register_job_definition(DOCKER_IMAGE, {}, {})

        call_kwargs = mock_client.register_job_definition.call_args.kwargs
        assert call_kwargs["platformCapabilities"] == ["FARGATE"]


# ---------------------------------------------------------------------------
# get_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetStatus:
    def test_running_status(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [{"jobId": "j1", "jobName": "s1", "status": "RUNNING"}]
        }

        result = backend.get_status("j1")
        assert result.status == JobStatus.RUNNING
        assert result.job_id == "j1"

    def test_succeeded_status(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [
                {
                    "jobId": "j1",
                    "jobName": "s1",
                    "status": "SUCCEEDED",
                    "startedAt": 1_700_000_000_000,
                    "stoppedAt": 1_700_000_060_000,
                }
            ]
        }

        result = backend.get_status("j1")
        assert result.status == JobStatus.SUCCEEDED
        assert result.start_time is not None
        assert result.end_time is not None

    def test_failed_status_includes_reason(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [
                {
                    "jobId": "j1",
                    "jobName": "s1",
                    "status": "FAILED",
                    "statusReason": "Container exited with code 1",
                }
            ]
        }

        result = backend.get_status("j1")
        assert result.status == JobStatus.FAILED
        assert result.error_message == "Container exited with code 1"

    def test_pending_status(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [{"jobId": "j1", "jobName": "s1", "status": "PENDING"}]
        }

        result = backend.get_status("j1")
        assert result.status == JobStatus.PENDING

    def test_submitted_maps_to_pending(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [{"jobId": "j1", "jobName": "s1", "status": "SUBMITTED"}]
        }
        result = backend.get_status("j1")
        assert result.status == JobStatus.PENDING

    def test_not_found_returns_unknown(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {"jobs": []}

        result = backend.get_status("j-missing")
        assert result.status == JobStatus.UNKNOWN
        assert result.error_message == "Job not found"

    def test_client_error_returns_unknown(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.side_effect = _make_client_error()

        result = backend.get_status("j-error")
        assert result.status == JobStatus.UNKNOWN
        assert result.error_message is not None

    def test_logs_url_included(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [{"jobId": "j1", "jobName": "s1", "status": "RUNNING"}]
        }

        result = backend.get_status("j1")
        assert result.logs_url is not None
        assert REGION in result.logs_url

    def test_no_timestamps_when_not_in_response(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [{"jobId": "j1", "jobName": "s1", "status": "RUNNING"}]
        }
        result = backend.get_status("j1")
        assert result.start_time is None
        assert result.end_time is None


# ---------------------------------------------------------------------------
# _map_batch_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestMapBatchStatus:
    def test_submitted_maps_pending(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("SUBMITTED") == JobStatus.PENDING

    def test_pending_maps_pending(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("PENDING") == JobStatus.PENDING

    def test_runnable_maps_pending(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("RUNNABLE") == JobStatus.PENDING

    def test_starting_maps_running(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("STARTING") == JobStatus.RUNNING

    def test_running_maps_running(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("RUNNING") == JobStatus.RUNNING

    def test_succeeded_maps_succeeded(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("SUCCEEDED") == JobStatus.SUCCEEDED

    def test_failed_maps_failed(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("FAILED") == JobStatus.FAILED

    def test_unknown_state_maps_unknown(self) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status("SOMETHING_ELSE") == JobStatus.UNKNOWN


# ---------------------------------------------------------------------------
# get_status_batch
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetStatusBatch:
    def test_empty_list_returns_empty_dict(self) -> None:
        backend, mock_client = _make_backend()
        result = backend.get_status_batch([])
        assert result == {}
        mock_client.describe_jobs.assert_not_called()

    def test_single_batch_returned(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [
                {"jobId": "j1", "jobName": "s1", "status": "RUNNING"},
                {"jobId": "j2", "jobName": "s2", "status": "SUCCEEDED"},
            ]
        }

        result = backend.get_status_batch(["j1", "j2"])
        assert len(result) == 2
        assert result["j1"].status == JobStatus.RUNNING
        assert result["j2"].status == JobStatus.SUCCEEDED

    def test_failed_job_includes_error_message(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [
                {
                    "jobId": "j1",
                    "jobName": "s1",
                    "status": "FAILED",
                    "statusReason": "OOMKilled",
                }
            ]
        }

        result = backend.get_status_batch(["j1"])
        assert result["j1"].status == JobStatus.FAILED
        assert result["j1"].error_message == "OOMKilled"

    def test_timestamps_parsed_when_present(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [
                {
                    "jobId": "j1",
                    "jobName": "s1",
                    "status": "SUCCEEDED",
                    "startedAt": 1_700_000_000_000,
                    "stoppedAt": 1_700_000_120_000,
                }
            ]
        }

        result = backend.get_status_batch(["j1"])
        assert result["j1"].start_time is not None
        assert result["j1"].end_time is not None

    def test_chunking_over_100_jobs(self) -> None:
        """Jobs are chunked into batches of 100 for describe_jobs calls."""
        backend, mock_client = _make_backend()
        job_ids = [f"j{i}" for i in range(150)]
        mock_client.describe_jobs.return_value = {"jobs": []}

        backend.get_status_batch(job_ids)

        assert mock_client.describe_jobs.call_count == 2
        first_call_ids = mock_client.describe_jobs.call_args_list[0].kwargs["jobs"]
        assert len(first_call_ids) == 100
        second_call_ids = mock_client.describe_jobs.call_args_list[1].kwargs["jobs"]
        assert len(second_call_ids) == 50

    def test_client_error_returns_unknown_for_batch(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.side_effect = _make_client_error()

        result = backend.get_status_batch(["j1", "j2"])
        assert result["j1"].status == JobStatus.UNKNOWN
        assert result["j2"].status == JobStatus.UNKNOWN

    def test_empty_jobs_list_in_response(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {"jobs": []}

        result = backend.get_status_batch(["j1"])
        assert result == {}


# ---------------------------------------------------------------------------
# cancel_job
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestCancelJob:
    def test_cancel_success_returns_true(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.terminate_job.return_value = {}

        result = backend.cancel_job("j1")
        assert result is True
        mock_client.terminate_job.assert_called_once_with(
            jobId="j1", reason="Cancelled by deployment CLI"
        )

    def test_client_error_returns_false(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.terminate_job.side_effect = _make_client_error()

        result = backend.cancel_job("j1")
        assert result is False


# ---------------------------------------------------------------------------
# get_logs_url
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetLogsUrl:
    def test_url_contains_region_and_job_id(self) -> None:
        backend, _ = _make_backend()
        url = backend.get_logs_url("my-job-123")
        assert REGION in url
        assert "my-job-123" in url
        assert "cloudwatch" in url


# ---------------------------------------------------------------------------
# deploy_shards
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestDeployShards:
    def test_small_batch_delegates_to_super(self) -> None:
        """≤ parallelism shards → sequential super().deploy_shards()."""
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        shards = [{"shard_id": f"s{i}"} for i in range(3)]
        results = backend.deploy_shards(
            shards=shards,
            docker_image=DOCKER_IMAGE,
            environment_variables={},
            compute_config={},
            labels={},
            parallelism=10,
        )

        assert len(results) == 3

    def test_large_batch_uses_thread_pool(self) -> None:
        """More shards than parallelism → ThreadPoolExecutor path."""
        backend, mock_client = _make_backend()

        def _submit(**kwargs: object) -> dict[str, str]:
            shard_id = str(kwargs.get("jobName", "unknown"))
            return {"jobId": f"job-{shard_id}"}

        mock_client.submit_job.side_effect = _submit

        shards = [{"shard_id": f"s{i}"} for i in range(15)]
        results = backend.deploy_shards(
            shards=shards,
            docker_image=DOCKER_IMAGE,
            environment_variables={},
            compute_config={},
            labels={},
            parallelism=5,
        )

        assert len(results) == 15

    def test_empty_shards_returns_empty_list(self) -> None:
        backend, mock_client = _make_backend()
        results = backend.deploy_shards(
            shards=[],
            docker_image=DOCKER_IMAGE,
            environment_variables={},
            compute_config={},
            labels={},
        )
        assert results == []
