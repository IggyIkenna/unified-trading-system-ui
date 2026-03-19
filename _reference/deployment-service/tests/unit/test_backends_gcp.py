"""
Unit tests for deployment_service.backends.gcp.CloudRunBackend.

The gcp module is an independent copy of the Cloud Run backend (same class,
separate module path with independent coverage tracking).

All GCP SDK calls are intercepted by injecting mock clients directly into the
backend instance (bypassing lazy-load properties) so no real network traffic is
generated.

Coverage targets:
- CloudRunBackend.__init__ and properties (backend_type, job_path)
- jobs_client / executions_client lazy-load
- _get_template_env: cache hit, success with env, success with empty env, fetch failure
- _merge_env: template preserved, value overridden, new var appended, secret-backed warning
- _is_quota_exhausted_error: each keyword indicator; non-matching
- deploy_shard: success with metadata name, success via fallback ID,
  template_env=None (args-only override), ResourceExhausted retry then final failure,
  NotFound, generic RuntimeError with quota hint
- get_status: RUNNING, SUCCEEDED (completion_time set), FAILED (failed_count>0 + conditions),
  PENDING, cleaned-up (NOT_FOUND), generic error → UNKNOWN
- get_status_batch: empty list, matched executions (RUNNING/SUCCEEDED/FAILED), not-found fallback,
  list_executions raises
- cancel_job: success, already-gone (NOT_FOUND), error
- get_logs_url: full path, bare ID
"""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends.base import JobInfo, JobStatus
from deployment_service.backends.gcp import CloudRunBackend

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT = "gcp-test-project"
REGION = "us-central1"
SA = "sa@gcp-test.iam.gserviceaccount.com"
JOB = "my-cloud-run-job"
SHARD = "shard-0"
EXEC_NAME = f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB}/executions/exec-001"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_backend() -> CloudRunBackend:
    return CloudRunBackend(
        project_id=PROJECT,
        region=REGION,
        service_account_email=SA,
        job_name=JOB,
    )


def _inject_clients(backend: CloudRunBackend) -> tuple[MagicMock, MagicMock]:
    """Inject mock jobs and executions clients; return (jobs_client, executions_client)."""
    jobs = MagicMock()
    execs = MagicMock()
    backend._jobs_client = jobs
    backend._executions_client = execs
    return jobs, execs


def _make_env_var(name: str, value: str | None = None, has_secret: bool = False) -> MagicMock:
    ev = MagicMock()
    ev.name = name
    ev.value = value
    ev.value_source = MagicMock() if has_secret else None
    return ev


# ---------------------------------------------------------------------------
# Init / Properties
# ---------------------------------------------------------------------------


class TestInitAndProperties:
    def test_backend_type(self) -> None:
        b = _make_backend()
        assert b.backend_type == "cloud_run"

    def test_job_path(self) -> None:
        b = _make_backend()
        assert b.job_path == f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB}"

    def test_lazy_jobs_client_initialised_once(self) -> None:
        b = _make_backend()
        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.JobsClient.return_value = MagicMock()
            c1 = b.jobs_client
            c2 = b.jobs_client
            assert c1 is c2
            mock_run.JobsClient.assert_called_once()

    def test_lazy_executions_client_initialised_once(self) -> None:
        b = _make_backend()
        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.ExecutionsClient.return_value = MagicMock()
            c1 = b.executions_client
            c2 = b.executions_client
            assert c1 is c2
            mock_run.ExecutionsClient.assert_called_once()

    def test_template_env_cache_starts_empty(self) -> None:
        b = _make_backend()
        assert b._template_env_cache == {}


# ---------------------------------------------------------------------------
# _get_template_env
# ---------------------------------------------------------------------------


class TestGetTemplateEnv:
    def test_cache_hit_returns_cached(self) -> None:
        b = _make_backend()
        cached: list[MagicMock] = [MagicMock()]
        b._template_env_cache[REGION] = cached  # type: ignore[assignment]
        result = b._get_template_env()
        assert result is cached

    def test_success_with_env_vars(self) -> None:
        b = _make_backend()
        jobs, _ = _inject_clients(b)

        env_var = _make_env_var("MY_VAR", "my-value")
        container = MagicMock()
        container.env = [env_var]
        execution_template = MagicMock()
        execution_template.containers = [container]
        job_template = MagicMock()
        job_template.template = execution_template
        job = MagicMock()
        job.template = job_template
        jobs.get_job.return_value = job

        result = b._get_template_env()

        assert result is not None
        assert len(result) == 1
        # Also cached
        assert b._template_env_cache[REGION] is result

    def test_success_with_no_containers(self) -> None:
        b = _make_backend()
        jobs, _ = _inject_clients(b)

        job = MagicMock()
        job.template = None
        jobs.get_job.return_value = job

        result = b._get_template_env()
        assert result == []

    def test_fetch_failure_caches_none(self) -> None:
        b = _make_backend()
        jobs, _ = _inject_clients(b)
        jobs.get_job.side_effect = RuntimeError("network error")

        result = b._get_template_env()
        assert result is None
        assert b._template_env_cache[REGION] is None


# ---------------------------------------------------------------------------
# _merge_env
# ---------------------------------------------------------------------------


class TestMergeEnv:
    def test_template_only_preserved(self) -> None:
        b = _make_backend()
        ev = _make_env_var("EXISTING_VAR", "original")
        merged = b._merge_env([ev], {})
        assert len(merged) == 1

    def test_override_replaces_value(self) -> None:
        b = _make_backend()
        ev = _make_env_var("SHARD_INDEX", "0")

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            merged = b._merge_env([ev], {"SHARD_INDEX": "5"})

        assert len(merged) == 1

    def test_new_var_appended(self) -> None:
        b = _make_backend()
        ev = _make_env_var("BASE_VAR", "base")

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            merged = b._merge_env([ev], {"NEW_VAR": "new-value"})

        assert len(merged) == 2

    def test_secret_backed_override_warns(self, caplog: pytest.LogCaptureFixture) -> None:
        b = _make_backend()
        ev = _make_env_var("SECRET_VAR", has_secret=True)

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            import logging

            with caplog.at_level(logging.WARNING, logger="deployment_service.backends.gcp"):
                b._merge_env([ev], {"SECRET_VAR": "override"})

        assert "secret-backed" in caplog.text.lower() or "SECRET_VAR" in caplog.text

    def test_empty_template_only_overrides_added(self) -> None:
        b = _make_backend()

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            merged = b._merge_env([], {"A": "1", "B": "2"})

        assert len(merged) == 2


# ---------------------------------------------------------------------------
# _is_quota_exhausted_error
# ---------------------------------------------------------------------------


class TestIsQuotaExhaustedError:
    @pytest.mark.parametrize(
        "msg",
        [
            "quota exceeded",
            "resource exhausted for region",
            "RunningExecutionsPerProject limit reached",
            "Too many concurrent executions",
            "execution limit hit",
            "limit exceeded",
        ],
    )
    def test_quota_indicators_return_true(self, msg: str) -> None:
        b = _make_backend()
        assert b._is_quota_exhausted_error(RuntimeError(msg)) is True

    def test_normal_error_returns_false(self) -> None:
        b = _make_backend()
        assert b._is_quota_exhausted_error(RuntimeError("connection refused")) is False


# ---------------------------------------------------------------------------
# deploy_shard
# ---------------------------------------------------------------------------


class TestDeployShard:
    def _run_deploy(
        self,
        jobs_client: MagicMock,
        template_env: list | None = None,
    ) -> JobInfo:
        b = _make_backend()
        b._jobs_client = jobs_client
        b._executions_client = MagicMock()
        # Pre-populate template env cache to avoid get_job call
        b._template_env_cache[REGION] = template_env  # type: ignore[assignment]

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.RunJobRequest = MagicMock()
            mock_run.RunJobRequest.Overrides = MagicMock()
            mock_run.RunJobRequest.Overrides.ContainerOverride = MagicMock()
            mock_run.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)

            operation = MagicMock()
            operation.metadata = MagicMock()
            operation.metadata.name = EXEC_NAME
            jobs_client.run_job.return_value = operation

            return b.deploy_shard(
                shard_id=SHARD,
                docker_image="gcr.io/test/img:latest",
                args=["--arg", "val"],
                environment_variables={"K": "V"},
                compute_config={"memory": "2Gi"},
                labels={"service": "svc"},
            )

    def test_success_with_metadata_name(self) -> None:
        jobs = MagicMock()
        result = self._run_deploy(jobs, template_env=[])
        assert result.status == JobStatus.RUNNING
        assert result.job_id == EXEC_NAME
        assert result.shard_id == SHARD

    def test_success_fallback_id_when_no_metadata(self) -> None:
        b = _make_backend()
        b._jobs_client = MagicMock()
        b._executions_client = MagicMock()
        b._template_env_cache[REGION] = []  # type: ignore[assignment]

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.RunJobRequest = MagicMock()
            mock_run.RunJobRequest.Overrides = MagicMock()
            mock_run.RunJobRequest.Overrides.ContainerOverride = MagicMock()
            mock_run.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)

            # Operation with no metadata.name
            operation = MagicMock()
            operation.metadata = None
            b._jobs_client.run_job.return_value = operation

            result = b.deploy_shard(
                shard_id=SHARD,
                docker_image="gcr.io/img:latest",
                args=[],
                environment_variables={},
                compute_config={},
                labels={},
            )

        assert result.status == JobStatus.RUNNING
        assert SHARD in result.job_id

    def test_template_env_none_uses_args_only(self) -> None:
        """When template_env is None, env is not overridden (args-only override)."""
        b = _make_backend()
        b._jobs_client = MagicMock()
        b._executions_client = MagicMock()
        b._template_env_cache[REGION] = None  # fetch failed previously

        container_override_calls: list[dict] = []

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.RunJobRequest = MagicMock()
            mock_run.RunJobRequest.Overrides = MagicMock()

            def capture_co(**kwargs: object) -> MagicMock:
                container_override_calls.append(dict(kwargs))
                return MagicMock()

            mock_run.RunJobRequest.Overrides.ContainerOverride = MagicMock(side_effect=capture_co)

            operation = MagicMock()
            operation.metadata = None
            b._jobs_client.run_job.return_value = operation

            b.deploy_shard(
                shard_id=SHARD,
                docker_image="img",
                args=["--foo"],
                environment_variables={"X": "1"},
                compute_config={},
                labels={},
            )

        # env should NOT be in the kwargs (no env override when template is None)
        assert len(container_override_calls) == 1
        assert "env" not in container_override_calls[0]

    def test_resource_exhausted_retries_and_fails(self) -> None:
        b = _make_backend()
        b._jobs_client = MagicMock()
        b._executions_client = MagicMock()
        b._template_env_cache[REGION] = []  # type: ignore[assignment]

        from deployment_service.backends._gcp_sdk import google_exceptions

        with (
            patch("deployment_service.backends.gcp.run_v2") as mock_run,
            patch("deployment_service.backends.gcp.time.sleep"),
        ):
            mock_run.RunJobRequest = MagicMock()
            mock_run.RunJobRequest.Overrides = MagicMock()
            mock_run.RunJobRequest.Overrides.ContainerOverride = MagicMock()

            b._jobs_client.run_job.side_effect = google_exceptions.ResourceExhausted(
                "quota exceeded"
            )

            result = b.deploy_shard(
                shard_id=SHARD,
                docker_image="img",
                args=[],
                environment_variables={},
                compute_config={},
                labels={},
            )

        assert result.status == JobStatus.FAILED
        assert "retries" in result.error_message or "retry" in (result.error_message or "").lower()

    def test_not_found_returns_failed(self) -> None:
        b = _make_backend()
        b._jobs_client = MagicMock()
        b._executions_client = MagicMock()
        b._template_env_cache[REGION] = []  # type: ignore[assignment]

        from deployment_service.backends._gcp_sdk import google_exceptions

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.RunJobRequest = MagicMock()
            mock_run.RunJobRequest.Overrides = MagicMock()
            mock_run.RunJobRequest.Overrides.ContainerOverride = MagicMock()

            b._jobs_client.run_job.side_effect = google_exceptions.NotFound("job not found")

            result = b.deploy_shard(
                shard_id=SHARD,
                docker_image="img",
                args=[],
                environment_variables={},
                compute_config={},
                labels={},
            )

        assert result.status == JobStatus.FAILED
        assert "not found" in (result.error_message or "").lower()

    def test_generic_error_returns_failed(self) -> None:
        b = _make_backend()
        b._jobs_client = MagicMock()
        b._executions_client = MagicMock()
        b._template_env_cache[REGION] = []  # type: ignore[assignment]

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.RunJobRequest = MagicMock()
            mock_run.RunJobRequest.Overrides = MagicMock()
            mock_run.RunJobRequest.Overrides.ContainerOverride = MagicMock()

            b._jobs_client.run_job.side_effect = RuntimeError("unexpected error")

            result = b.deploy_shard(
                shard_id=SHARD,
                docker_image="img",
                args=[],
                environment_variables={},
                compute_config={},
                labels={},
            )

        assert result.status == JobStatus.FAILED
        assert "unexpected error" in (result.error_message or "")


# ---------------------------------------------------------------------------
# get_status
# ---------------------------------------------------------------------------


class TestGetStatus:
    def _make_execution(
        self,
        *,
        running_count: int = 0,
        succeeded_count: int = 0,
        failed_count: int = 0,
        completion_time: object = None,
        conditions: list | None = None,
        name: str = EXEC_NAME,
    ) -> MagicMock:
        ex = MagicMock()
        ex.name = name
        ex.running_count = running_count
        ex.succeeded_count = succeeded_count
        ex.failed_count = failed_count
        ex.completion_time = completion_time
        ex.start_time = datetime.now(UTC)
        ex.conditions = conditions or []
        return ex

    def test_running_status(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.return_value = self._make_execution(running_count=1)

        result = b.get_status(EXEC_NAME)
        assert result.status == JobStatus.RUNNING

    def test_succeeded_status(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.return_value = self._make_execution(
            completion_time=datetime.now(UTC), succeeded_count=1, failed_count=0
        )

        result = b.get_status(EXEC_NAME)
        assert result.status == JobStatus.SUCCEEDED

    def test_failed_status_with_condition(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)

        condition = MagicMock()
        condition.type_ = "Failed"
        condition.message = "OOM killed"
        execs.get_execution.return_value = self._make_execution(
            completion_time=datetime.now(UTC), failed_count=1, conditions=[condition]
        )

        result = b.get_status(EXEC_NAME)
        assert result.status == JobStatus.FAILED
        assert result.error_message == "OOM killed"

    def test_pending_status(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.return_value = self._make_execution(
            running_count=0, completion_time=None
        )

        result = b.get_status(EXEC_NAME)
        assert result.status == JobStatus.PENDING

    def test_cleaned_up_returns_succeeded(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.side_effect = RuntimeError("does not exist")

        result = b.get_status(EXEC_NAME)
        assert result.status == JobStatus.SUCCEEDED

    def test_cleaned_up_code5_returns_succeeded(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.side_effect = RuntimeError("code: 5")

        result = b.get_status(EXEC_NAME)
        assert result.status == JobStatus.SUCCEEDED

    def test_generic_error_returns_unknown(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.side_effect = RuntimeError("something else")

        result = b.get_status(EXEC_NAME)
        assert result.status == JobStatus.UNKNOWN
        assert "something else" in (result.error_message or "")


# ---------------------------------------------------------------------------
# get_status_batch
# ---------------------------------------------------------------------------


class TestGetStatusBatch:
    def test_empty_list_returns_empty(self) -> None:
        b = _make_backend()
        assert b.get_status_batch([]) == {}

    def test_running_execution_mapped(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)

        ex = MagicMock()
        ex.name = EXEC_NAME
        ex.running_count = 1
        ex.failed_count = 0
        ex.succeeded_count = 0
        ex.completion_time = None
        ex.start_time = datetime.now(UTC)
        ex.conditions = []
        execs.list_executions.return_value = [ex]

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.ListExecutionsRequest = MagicMock()
            results = b.get_status_batch([EXEC_NAME])

        assert EXEC_NAME in results
        assert results[EXEC_NAME].status == JobStatus.RUNNING

    def test_succeeded_execution_mapped(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)

        ex = MagicMock()
        ex.name = EXEC_NAME
        ex.running_count = 0
        ex.failed_count = 0
        ex.succeeded_count = 1
        ex.completion_time = datetime.now(UTC)
        ex.start_time = datetime.now(UTC)
        ex.conditions = []
        execs.list_executions.return_value = [ex]

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.ListExecutionsRequest = MagicMock()
            results = b.get_status_batch([EXEC_NAME])

        assert results[EXEC_NAME].status == JobStatus.SUCCEEDED

    def test_failed_execution_with_condition(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)

        condition = MagicMock()
        condition.type_ = "Failed"
        condition.message = "crash"
        ex = MagicMock()
        ex.name = EXEC_NAME
        ex.running_count = 0
        ex.failed_count = 1
        ex.succeeded_count = 0
        ex.completion_time = datetime.now(UTC)
        ex.start_time = None
        ex.conditions = [condition]
        execs.list_executions.return_value = [ex]

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.ListExecutionsRequest = MagicMock()
            results = b.get_status_batch([EXEC_NAME])

        assert results[EXEC_NAME].status == JobStatus.FAILED
        assert results[EXEC_NAME].error_message == "crash"

    def test_not_found_in_listing_fallback_to_succeeded(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.list_executions.return_value = []  # no executions returned

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.ListExecutionsRequest = MagicMock()
            results = b.get_status_batch([EXEC_NAME])

        assert EXEC_NAME in results
        assert results[EXEC_NAME].status == JobStatus.SUCCEEDED

    def test_list_executions_raises_returns_fallback(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.list_executions.side_effect = RuntimeError("API error")

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.ListExecutionsRequest = MagicMock()
            results = b.get_status_batch([EXEC_NAME])

        # Fallback: all requested IDs should be in results as SUCCEEDED (cleaned up)
        assert EXEC_NAME in results
        assert results[EXEC_NAME].status == JobStatus.SUCCEEDED


# ---------------------------------------------------------------------------
# cancel_job
# ---------------------------------------------------------------------------


class TestCancelJob:
    def test_cancel_success(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.CancelExecutionRequest = MagicMock()
            result = b.cancel_job(EXEC_NAME)

        assert result is True

    def test_cancel_already_gone(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.cancel_execution.side_effect = RuntimeError("does not exist")

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.CancelExecutionRequest = MagicMock()
            result = b.cancel_job(EXEC_NAME)

        assert result is True

    def test_cancel_error_returns_false(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.cancel_execution.side_effect = RuntimeError("permission denied")

        with patch("deployment_service.backends.gcp.run_v2") as mock_run:
            mock_run.CancelExecutionRequest = MagicMock()
            result = b.cancel_job(EXEC_NAME)

        assert result is False


# ---------------------------------------------------------------------------
# get_logs_url
# ---------------------------------------------------------------------------


class TestGetLogsUrl:
    def test_full_path(self) -> None:
        b = _make_backend()
        url = b.get_logs_url(EXEC_NAME)
        assert "exec-001" in url
        assert JOB in url
        assert PROJECT in url

    def test_bare_execution_id(self) -> None:
        b = _make_backend()
        url = b.get_logs_url("exec-bare")
        assert "exec-bare" in url
