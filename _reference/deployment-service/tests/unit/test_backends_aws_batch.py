"""
Unit tests for deployment_service.backends.aws_batch.AWSBatchBackend.

aws_batch.py has a conditional botocore import (stub when not installed) and
a deferred boto3 import via _ensure_boto3(). We patch _ensure_boto3 and inject
a mock client so no real AWS call is made.

Coverage targets:
- Module-level botocore stub (covered implicitly by import)
- AWSBatchBackend.__init__: default queue, custom queue, client creation
- backend_type property
- deploy_shard: success with job_definition, dynamic registration, memory Gi/Mi,
  vcpu resource requirement, env vars, labels, empty args, ClientError → FAILED
- _register_job_definition: success, Gi/Mi memory conversion, ClientError re-raise,
  default vcpu/memory fallbacks, role ARN format
- get_status: RUNNING/SUCCEEDED/FAILED/PENDING/SUBMITTED/RUNNABLE/STARTING,
  not-found, ClientError, timestamps, statusReason, logs_url
- _map_batch_status: all 7 known states + unknown fallback
- get_status_batch: empty, single batch, >100 jobs chunking, FAILED error_message,
  timestamps, ClientError per batch
- cancel_job: success, ClientError → False
- get_logs_url: URL format check
- deploy_shards: ≤ parallelism → sequential, > parallelism → concurrent thread pool
"""

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends.base import JobInfo, JobStatus

# botocore may or may not be installed; the module handles it transparently
try:
    from botocore.exceptions import ClientError as _BotoCoreClientError
except ImportError:  # pragma: no cover
    _BotoCoreClientError = Exception  # type: ignore[misc,assignment]

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ACCOUNT_ID = "987654321098"
REGION = "us-west-2"
JOB_QUEUE = "batch-test-queue"
JOB_DEF_ARN = "arn:aws:batch:us-west-2:987654321098:job-definition/test-def:1"
IMAGE = "987654321098.dkr.ecr.us-west-2.amazonaws.com/service:sha256-abc"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_client_error(code: str = "ServiceUnavailable") -> _BotoCoreClientError:
    return _BotoCoreClientError(
        error_response={"Error": {"Code": code, "Message": "test"}},
        operation_name="Batch",
    )


def _make_backend(
    job_queue: str | None = JOB_QUEUE,
    job_definition: str | None = JOB_DEF_ARN,
) -> tuple["object", MagicMock]:
    """Return (backend, mock_batch_client)."""
    from deployment_service.backends.aws_batch import AWSBatchBackend

    mock_client = MagicMock()
    mock_logs = MagicMock()
    mock_boto3 = MagicMock()
    mock_boto3.client.side_effect = lambda svc, region_name: (
        mock_client if svc == "batch" else mock_logs
    )

    with patch("deployment_service.backends.aws_batch._ensure_boto3", return_value=mock_boto3):
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
    def test_backend_type_is_aws_batch(self) -> None:
        backend, _ = _make_backend()
        assert backend.backend_type == "aws_batch"  # type: ignore[attr-defined]

    def test_default_job_queue_when_none_given(self) -> None:
        backend, _ = _make_backend(job_queue=None)
        assert backend._job_queue == "unified-trading-job-queue"  # type: ignore[attr-defined]

    def test_custom_job_queue_stored(self) -> None:
        backend, _ = _make_backend(job_queue="custom-queue")
        assert backend._job_queue == "custom-queue"  # type: ignore[attr-defined]

    def test_job_definition_stored(self) -> None:
        backend, _ = _make_backend(job_definition=JOB_DEF_ARN)
        assert backend._job_definition == JOB_DEF_ARN  # type: ignore[attr-defined]

    def test_no_job_definition_is_none(self) -> None:
        backend, _ = _make_backend(job_definition=None)
        assert backend._job_definition is None  # type: ignore[attr-defined]

    def test_region_stored(self) -> None:
        backend, _ = _make_backend()
        assert backend.region == REGION  # type: ignore[attr-defined]

    def test_account_id_stored_as_project_id(self) -> None:
        backend, _ = _make_backend()
        assert backend._account_id == ACCOUNT_ID  # type: ignore[attr-defined]

    def test_boto3_client_called_for_batch_and_logs(self) -> None:
        mock_boto3 = MagicMock()
        mock_boto3.client.return_value = MagicMock()

        with patch("deployment_service.backends.aws_batch._ensure_boto3", return_value=mock_boto3):
            from deployment_service.backends.aws_batch import AWSBatchBackend

            AWSBatchBackend(project_id=ACCOUNT_ID, region=REGION)

        calls = [c[0][0] for c in mock_boto3.client.call_args_list]
        assert "batch" in calls
        assert "logs" in calls


# ---------------------------------------------------------------------------
# deploy_shard — success paths
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchDeployShardSuccess:
    def test_returns_pending_with_job_id(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "batch-job-001"}

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            shard_id="shard-A",
            docker_image=IMAGE,
            args=["--epochs", "10"],
            environment_variables={"MODEL": "v2"},
            compute_config={"vcpu": "2", "memory": "4096"},
            labels={"env": "staging"},
        )

        assert isinstance(result, JobInfo)
        assert result.status == JobStatus.PENDING
        assert result.job_id == "batch-job-001"
        assert result.shard_id == "shard-A"
        assert result.start_time is not None

    def test_job_definition_from_field_passed_to_submit(self) -> None:
        backend, mock_client = _make_backend(job_definition=JOB_DEF_ARN)
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {}, {}
        )

        assert mock_client.submit_job.call_args.kwargs["jobDefinition"] == JOB_DEF_ARN

    def test_memory_gi_converted_to_mb(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {"memory": "2Gi"}, {}
        )

        overrides = mock_client.submit_job.call_args.kwargs["containerOverrides"]
        reqs = overrides["resourceRequirements"]
        mem = next(r for r in reqs if r["type"] == "MEMORY")
        assert mem["value"] == "2048"

    def test_memory_mi_converted(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {"memory": "512Mi"}, {}
        )

        overrides = mock_client.submit_job.call_args.kwargs["containerOverrides"]
        reqs = overrides["resourceRequirements"]
        mem = next(r for r in reqs if r["type"] == "MEMORY")
        assert mem["value"] == "512"

    def test_vcpu_resource_requirement_added(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {"vcpu": "8"}, {}
        )

        overrides = mock_client.submit_job.call_args.kwargs["containerOverrides"]
        vcpu = next(r for r in overrides["resourceRequirements"] if r["type"] == "VCPU")
        assert vcpu["value"] == "8"

    def test_env_vars_serialised_correctly(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {"KEY": "value", "NUM": "42"}, {}, {}
        )

        env = mock_client.submit_job.call_args.kwargs["containerOverrides"]["environment"]
        assert {"name": "KEY", "value": "value"} in env
        assert {"name": "NUM", "value": "42"} in env

    def test_labels_added_as_tags(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {}, {"team": "infra"}
        )

        assert mock_client.submit_job.call_args.kwargs["tags"] == {"team": "infra"}

    def test_no_tags_key_when_labels_empty(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {}, {}
        )

        assert "tags" not in mock_client.submit_job.call_args.kwargs

    def test_empty_args_results_in_empty_command(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {}, {}
        )

        cmd = mock_client.submit_job.call_args.kwargs["containerOverrides"]["command"]
        assert cmd == []

    def test_no_resource_requirements_when_compute_config_empty(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {}, {}
        )

        overrides = mock_client.submit_job.call_args.kwargs["containerOverrides"]
        assert "resourceRequirements" not in overrides

    def test_docker_image_stored_in_metadata(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            "s1", IMAGE, [], {}, {}, {}
        )
        assert result.metadata["docker_image"] == IMAGE


# ---------------------------------------------------------------------------
# deploy_shard — dynamic job definition registration path
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchDeployShardDynamicRegistration:
    def test_registers_when_no_job_definition(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/auto:1"
        }
        mock_client.submit_job.return_value = {"jobId": "j2"}

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            "s2", IMAGE, [], {}, {}, {}
        )

        mock_client.register_job_definition.assert_called_once()
        assert result.status == JobStatus.PENDING
        assert (
            mock_client.submit_job.call_args.kwargs["jobDefinition"]
            == "arn:aws:batch:::job-definition/auto:1"
        )


# ---------------------------------------------------------------------------
# deploy_shard — error path
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchDeployShardError:
    def test_client_error_returns_failed(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.side_effect = _make_client_error("ValidationError")

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            "fail-shard", IMAGE, [], {}, {}, {}
        )

        assert result.status == JobStatus.FAILED
        assert result.shard_id == "fail-shard"
        assert result.job_id == "failed-fail-shard"
        assert result.error_message is not None


# ---------------------------------------------------------------------------
# _register_job_definition
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchRegisterJobDefinition:
    def test_success_returns_arn(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/d:1"
        }

        arn = backend._register_job_definition(IMAGE, {}, {})  # type: ignore[attr-defined]
        assert arn == "arn:aws:batch:::job-definition/d:1"

    def test_default_vcpu_and_memory_used(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/d:1"
        }

        backend._register_job_definition(IMAGE, {}, {})  # type: ignore[attr-defined]

        props = mock_client.register_job_definition.call_args.kwargs["containerProperties"]
        reqs = props["resourceRequirements"]
        vcpu_val = next(r["value"] for r in reqs if r["type"] == "VCPU")
        mem_val = next(r["value"] for r in reqs if r["type"] == "MEMORY")
        assert vcpu_val == "1"  # default vcpu
        assert mem_val == "2048"  # default memory

    def test_memory_gi_converted(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/d:1"
        }

        backend._register_job_definition(IMAGE, {"memory": "4Gi"}, {})  # type: ignore[attr-defined]

        props = mock_client.register_job_definition.call_args.kwargs["containerProperties"]
        mem_val = next(r["value"] for r in props["resourceRequirements"] if r["type"] == "MEMORY")
        assert mem_val == "4096"

    def test_memory_mi_converted(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/d:1"
        }

        backend._register_job_definition(IMAGE, {"memory": "1024Mi"}, {})  # type: ignore[attr-defined]

        props = mock_client.register_job_definition.call_args.kwargs["containerProperties"]
        mem_val = next(r["value"] for r in props["resourceRequirements"] if r["type"] == "MEMORY")
        assert mem_val == "1024"

    def test_client_error_reraised(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.side_effect = _make_client_error("ThrottlingException")

        # The exception should propagate out (not be swallowed)
        with pytest.raises(_BotoCoreClientError):
            backend._register_job_definition(IMAGE, {}, {})  # type: ignore[attr-defined]

    def test_execution_role_includes_account_id(self) -> None:
        backend, mock_client = _make_backend(job_definition=None)
        mock_client.register_job_definition.return_value = {
            "jobDefinitionArn": "arn:aws:batch:::job-definition/d:1"
        }

        backend._register_job_definition(IMAGE, {}, {})  # type: ignore[attr-defined]

        props = mock_client.register_job_definition.call_args.kwargs["containerProperties"]
        assert ACCOUNT_ID in props["executionRoleArn"]


# ---------------------------------------------------------------------------
# get_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchGetStatus:
    def _setup_describe(self, mock_client: MagicMock, status: str, **extra: object) -> None:
        job: dict[str, object] = {"jobId": "j1", "jobName": "shard-1", "status": status}
        job.update(extra)
        mock_client.describe_jobs.return_value = {"jobs": [job]}

    def test_running(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "RUNNING")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.RUNNING

    def test_succeeded_with_timestamps(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(
            mock_client, "SUCCEEDED", startedAt=1_700_000_000_000, stoppedAt=1_700_000_060_000
        )
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.SUCCEEDED
        assert result.start_time is not None
        assert result.end_time is not None

    def test_failed_with_status_reason(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "FAILED", statusReason="Container killed OOM")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.FAILED
        assert result.error_message == "Container killed OOM"

    def test_pending(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "PENDING")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.PENDING

    def test_submitted_maps_to_pending(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "SUBMITTED")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.PENDING

    def test_runnable_maps_to_pending(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "RUNNABLE")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.PENDING

    def test_starting_maps_to_running(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "STARTING")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.RUNNING

    def test_not_found_returns_unknown(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {"jobs": []}
        result = backend.get_status("missing")  # type: ignore[attr-defined]
        assert result.status == JobStatus.UNKNOWN
        assert result.error_message == "Job not found"

    def test_client_error_returns_unknown(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.side_effect = _make_client_error()
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.UNKNOWN

    def test_logs_url_present(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "RUNNING")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.logs_url is not None
        assert REGION in result.logs_url

    def test_no_timestamps_when_absent(self) -> None:
        backend, mock_client = _make_backend()
        self._setup_describe(mock_client, "RUNNING")
        result = backend.get_status("j1")  # type: ignore[attr-defined]
        assert result.start_time is None
        assert result.end_time is None


# ---------------------------------------------------------------------------
# _map_batch_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchMapBatchStatus:
    @pytest.mark.parametrize(
        ("batch_status", "expected"),
        [
            ("SUBMITTED", JobStatus.PENDING),
            ("PENDING", JobStatus.PENDING),
            ("RUNNABLE", JobStatus.PENDING),
            ("STARTING", JobStatus.RUNNING),
            ("RUNNING", JobStatus.RUNNING),
            ("SUCCEEDED", JobStatus.SUCCEEDED),
            ("FAILED", JobStatus.FAILED),
            ("UNKNOWN_STATE", JobStatus.UNKNOWN),
        ],
    )
    def test_status_mapping(self, batch_status: str, expected: JobStatus) -> None:
        backend, _ = _make_backend()
        assert backend._map_batch_status(batch_status) == expected  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# get_status_batch
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchGetStatusBatch:
    def test_empty_returns_empty(self) -> None:
        backend, mock_client = _make_backend()
        assert backend.get_status_batch([]) == {}  # type: ignore[attr-defined]
        mock_client.describe_jobs.assert_not_called()

    def test_single_page_result(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [
                {"jobId": "j1", "jobName": "s1", "status": "RUNNING"},
                {"jobId": "j2", "jobName": "s2", "status": "FAILED", "statusReason": "err"},
            ]
        }

        result = backend.get_status_batch(["j1", "j2"])  # type: ignore[attr-defined]
        assert result["j1"].status == JobStatus.RUNNING
        assert result["j2"].status == JobStatus.FAILED
        assert result["j2"].error_message == "err"

    def test_chunking_100_jobs_per_call(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {"jobs": []}

        backend.get_status_batch([f"j{i}" for i in range(210)])  # type: ignore[attr-defined]

        assert mock_client.describe_jobs.call_count == 3

    def test_timestamps_in_batch_result(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.return_value = {
            "jobs": [
                {
                    "jobId": "j1",
                    "jobName": "s1",
                    "status": "SUCCEEDED",
                    "startedAt": 1_700_000_000_000,
                    "stoppedAt": 1_700_000_300_000,
                }
            ]
        }

        result = backend.get_status_batch(["j1"])  # type: ignore[attr-defined]
        assert result["j1"].start_time is not None
        assert result["j1"].end_time is not None

    def test_client_error_produces_unknown_for_affected_jobs(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.describe_jobs.side_effect = _make_client_error()

        result = backend.get_status_batch(["j1", "j2"])  # type: ignore[attr-defined]
        assert result["j1"].status == JobStatus.UNKNOWN
        assert result["j2"].status == JobStatus.UNKNOWN


# ---------------------------------------------------------------------------
# cancel_job
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchCancelJob:
    def test_success(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.terminate_job.return_value = {}

        assert backend.cancel_job("j1") is True  # type: ignore[attr-defined]
        mock_client.terminate_job.assert_called_once_with(
            jobId="j1", reason="Cancelled by deployment CLI"
        )

    def test_client_error_returns_false(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.terminate_job.side_effect = _make_client_error()

        assert backend.cancel_job("j1") is False  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# get_logs_url
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchGetLogsUrl:
    def test_url_contains_region_and_job_id(self) -> None:
        backend, _ = _make_backend()
        url = backend.get_logs_url("my-job-xyz")  # type: ignore[attr-defined]
        assert REGION in url
        assert "my-job-xyz" in url
        assert "cloudwatch" in url


# ---------------------------------------------------------------------------
# deploy_shards
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestBatchDeployShards:
    def test_small_batch_uses_sequential_path(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j1"}

        shards = [{"shard_id": f"s{i}"} for i in range(5)]
        results = backend.deploy_shards(  # type: ignore[attr-defined]
            shards=shards,
            docker_image=IMAGE,
            environment_variables={},
            compute_config={},
            labels={},
            parallelism=10,
        )
        assert len(results) == 5

    def test_large_batch_uses_thread_pool(self) -> None:
        backend, mock_client = _make_backend()
        mock_client.submit_job.return_value = {"jobId": "j-auto"}

        shards = [{"shard_id": f"s{i}"} for i in range(20)]
        results = backend.deploy_shards(  # type: ignore[attr-defined]
            shards=shards,
            docker_image=IMAGE,
            environment_variables={},
            compute_config={},
            labels={},
            parallelism=5,
        )
        assert len(results) == 20

    def test_empty_shards_returns_empty(self) -> None:
        backend, mock_client = _make_backend()
        results = backend.deploy_shards(  # type: ignore[attr-defined]
            shards=[],
            docker_image=IMAGE,
            environment_variables={},
            compute_config={},
            labels={},
        )
        assert results == []
