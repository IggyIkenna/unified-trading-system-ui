"""
Unit tests for deployment_service.backends.cloud_run.CloudRunBackend.

All GCP SDK calls are intercepted by injecting mock clients directly into the
backend instance (bypassing the lazy-load properties) so that no real network
traffic is generated.

Coverage targets:
- CloudRunBackend.__init__ and properties
- _get_template_env: cache hit, success, and error paths
- _merge_env: template-only, override-existing, add-new, secret-backed override warning
- _is_quota_exhausted_error: each indicator keyword
- deploy_shard: success with metadata, success via fallback ID, ResourceExhausted retry +
  final failure, NotFound, generic error with quota hint, template-env=None fallback
- get_status: RUNNING / SUCCEEDED / FAILED / PENDING / not-found / generic error
- get_status_batch: empty list, mixed results, not-found fallback, error path
- cancel_job: success, already-gone, error
- get_logs_url: full path, bare ID
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock, call, patch

import pytest

from deployment_service.backends.base import JobInfo, JobStatus
from deployment_service.backends.cloud_run import CloudRunBackend

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

PROJECT = "test-project"
REGION = "asia-northeast1"
SA = "svc@test.iam.gserviceaccount.com"
JOB_NAME = "my-job"


def _make_backend() -> CloudRunBackend:
    """Return a CloudRunBackend with lazy clients not yet initialised."""
    return CloudRunBackend(
        project_id=PROJECT,
        region=REGION,
        service_account_email=SA,
        job_name=JOB_NAME,
    )


def _inject_clients(
    backend: CloudRunBackend,
) -> tuple[MagicMock, MagicMock]:
    """Inject pre-built MagicMock clients; return (jobs_client, executions_client)."""
    jobs_mock = MagicMock()
    execs_mock = MagicMock()
    backend._jobs_client = jobs_mock
    backend._executions_client = execs_mock
    return jobs_mock, execs_mock


def _make_env_var(name: str, value: str, *, has_value_source: bool = False) -> MagicMock:
    env = MagicMock()
    env.name = name
    env.value = value
    env.value_source = MagicMock() if has_value_source else None
    return env


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def backend() -> CloudRunBackend:
    return _make_backend()


@pytest.fixture()
def backend_with_clients() -> tuple[CloudRunBackend, MagicMock, MagicMock]:
    b = _make_backend()
    jobs, execs = _inject_clients(b)
    return b, jobs, execs


# ---------------------------------------------------------------------------
# __init__ and simple properties
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestCloudRunBackendInit:
    def test_attributes_set_correctly(self, backend: CloudRunBackend) -> None:
        assert backend.project_id == PROJECT
        assert backend.region == REGION
        assert backend.service_account_email == SA
        assert backend.job_name == JOB_NAME

    def test_backend_type(self, backend: CloudRunBackend) -> None:
        assert backend.backend_type == "cloud_run"

    def test_job_path_format(self, backend: CloudRunBackend) -> None:
        expected = f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB_NAME}"
        assert backend.job_path == expected

    def test_clients_start_as_none(self, backend: CloudRunBackend) -> None:
        assert backend._jobs_client is None
        assert backend._executions_client is None

    def test_template_env_cache_starts_empty(self, backend: CloudRunBackend) -> None:
        assert backend._template_env_cache == {}

    def test_lazy_jobs_client_instantiation(self) -> None:
        """jobs_client property creates the client on first access."""
        b = _make_backend()
        mock_client = MagicMock()
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.JobsClient.return_value = mock_client
            client = b.jobs_client
            assert client is mock_client
            # Second access must not re-instantiate
            _ = b.jobs_client
            mock_run_v2.JobsClient.assert_called_once()

    def test_lazy_executions_client_instantiation(self) -> None:
        """executions_client property creates the client on first access."""
        b = _make_backend()
        mock_client = MagicMock()
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ExecutionsClient.return_value = mock_client
            client = b.executions_client
            assert client is mock_client
            _ = b.executions_client
            mock_run_v2.ExecutionsClient.assert_called_once()


# ---------------------------------------------------------------------------
# _get_template_env
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetTemplateEnv:
    def test_cache_hit_returns_cached_value(self, backend: CloudRunBackend) -> None:
        cached: list[MagicMock] = [MagicMock()]
        backend._template_env_cache[REGION] = cached
        jobs, _ = _inject_clients(backend)
        result = backend._get_template_env()
        assert result is cached
        jobs.get_job.assert_not_called()

    def test_success_with_env_vars(self, backend: CloudRunBackend) -> None:
        """Fetches env vars from the first container of the job template."""
        jobs, _ = _inject_clients(backend)
        env_var = _make_env_var("KEY", "val")
        container = MagicMock()
        container.env = [env_var]
        execution_template = MagicMock()
        execution_template.containers = [container]
        job_template = MagicMock()
        job_template.template = execution_template
        job = MagicMock()
        job.template = job_template
        jobs.get_job.return_value = job

        result = backend._get_template_env()

        assert result == [env_var]
        assert backend._template_env_cache[REGION] == [env_var]

    def test_success_with_no_containers(self, backend: CloudRunBackend) -> None:
        """Returns empty list when job has no containers."""
        jobs, _ = _inject_clients(backend)
        execution_template = MagicMock()
        execution_template.containers = []
        job_template = MagicMock()
        job_template.template = execution_template
        job = MagicMock()
        job.template = job_template
        jobs.get_job.return_value = job

        result = backend._get_template_env()

        assert result == []
        assert backend._template_env_cache[REGION] == []

    def test_success_with_no_template(self, backend: CloudRunBackend) -> None:
        """Returns empty list when job.template is None."""
        jobs, _ = _inject_clients(backend)
        job = MagicMock()
        job.template = None
        jobs.get_job.return_value = job

        result = backend._get_template_env()

        assert result == []

    def test_error_caches_none_and_returns_none(self, backend: CloudRunBackend) -> None:
        """On SDK error, returns None and caches None for future calls."""
        jobs, _ = _inject_clients(backend)
        jobs.get_job.side_effect = RuntimeError("connection failed")

        result = backend._get_template_env()

        assert result is None
        assert backend._template_env_cache[REGION] is None

    def test_cached_none_returned_on_second_call(self, backend: CloudRunBackend) -> None:
        """Second call after a failed fetch returns None from cache (no extra API call)."""
        backend._template_env_cache[REGION] = None
        jobs, _ = _inject_clients(backend)

        result = backend._get_template_env()

        assert result is None
        jobs.get_job.assert_not_called()


# ---------------------------------------------------------------------------
# _merge_env
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestMergeEnv:
    def _run(
        self,
        template: list[MagicMock],
        overrides: dict[str, str],
    ) -> list[MagicMock]:
        backend = _make_backend()
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            # Make run_v2.EnvVar return something we can inspect
            mock_run_v2.EnvVar.side_effect = lambda name, value: (name, value)
            return backend._merge_env(template, overrides)

    def test_template_env_preserved_when_no_overrides(self) -> None:
        backend = _make_backend()
        env1 = _make_env_var("A", "1")
        env2 = _make_env_var("B", "2")
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.EnvVar.side_effect = lambda name, value: (name, value)
            result = backend._merge_env([env1, env2], {})
        # env1 and env2 not overridden → returned as-is from template
        assert env1 in result
        assert env2 in result

    def test_overriding_existing_template_var(self) -> None:
        backend = _make_backend()
        env1 = _make_env_var("A", "old")
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.EnvVar.side_effect = lambda name, value: (name, value)
            result = backend._merge_env([env1], {"A": "new"})
        # The original env object is replaced by a new EnvVar("A", "new") tuple
        assert ("A", "new") in result
        assert env1 not in result

    def test_adding_new_var_not_in_template(self) -> None:
        backend = _make_backend()
        env1 = _make_env_var("EXISTING", "val")
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.EnvVar.side_effect = lambda name, value: (name, value)
            result = backend._merge_env([env1], {"NEW_KEY": "new_val"})
        assert ("NEW_KEY", "new_val") in result
        assert env1 in result

    def test_env_var_without_name_is_skipped(self) -> None:
        backend = _make_backend()
        nameless = MagicMock()
        nameless.name = None
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.EnvVar.side_effect = lambda name, value: (name, value)
            result = backend._merge_env([nameless], {"KEY": "val"})
        # nameless skipped; KEY added as new var
        assert nameless not in result
        assert ("KEY", "val") in result

    def test_overriding_secret_backed_var_warns(self, caplog: pytest.LogCaptureFixture) -> None:
        import logging

        backend = _make_backend()
        secret_env = _make_env_var("SECRET_KEY", "old", has_value_source=True)
        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.EnvVar.side_effect = lambda name, value: (name, value)
            with caplog.at_level(logging.WARNING, logger="deployment_service.backends.cloud_run"):
                backend._merge_env([secret_env], {"SECRET_KEY": "plaintext"})
        assert "Overriding secret-backed env var" in caplog.text

    def test_empty_template_and_empty_overrides(self) -> None:
        backend = _make_backend()
        with patch("deployment_service.backends.cloud_run.run_v2"):
            result = backend._merge_env([], {})
        assert result == []


# ---------------------------------------------------------------------------
# _is_quota_exhausted_error
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestIsQuotaExhaustedError:
    @pytest.mark.parametrize(
        "message",
        [
            "quota exceeded",
            "resource exhausted",
            "runningexecutionsperproject limit hit",
            "too many concurrent executions",
            "execution limit reached",
            "limit exceeded",
        ],
    )
    def test_returns_true_for_quota_indicators(self, message: str) -> None:
        backend = _make_backend()
        assert backend._is_quota_exhausted_error(RuntimeError(message)) is True

    def test_returns_false_for_unrelated_error(self) -> None:
        backend = _make_backend()
        assert backend._is_quota_exhausted_error(RuntimeError("permission denied")) is False

    def test_case_insensitive(self) -> None:
        backend = _make_backend()
        assert backend._is_quota_exhausted_error(RuntimeError("QUOTA exceeded")) is True


# ---------------------------------------------------------------------------
# deploy_shard
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestDeployShard:
    """Test CloudRunBackend.deploy_shard across all code paths."""

    _SHARD = "shard-001"
    _IMAGE = "gcr.io/project/image:latest"
    _ARGS = ["--mode", "train"]
    _ENV = {"SHARD_INDEX": "0", "TOTAL": "10"}
    _CONFIG: dict[str, object] = {"memory": "4Gi", "cpu": 2}
    _LABELS: dict[str, str] = {"env": "test"}

    def _call(
        self,
        backend: CloudRunBackend,
        env_vars: dict[str, str] | None = None,
    ) -> JobInfo:
        return backend.deploy_shard(
            shard_id=self._SHARD,
            docker_image=self._IMAGE,
            args=self._ARGS,
            environment_variables=env_vars or self._ENV,
            compute_config=self._CONFIG,
            labels=self._LABELS,
        )

    def test_success_with_metadata_name(self) -> None:
        """deploy_shard returns RUNNING JobInfo when operation has metadata.name."""
        b = _make_backend()
        jobs, _ = _inject_clients(b)

        # Pre-populate template env cache so _get_template_env doesn't call the SDK
        b._template_env_cache[REGION] = []

        operation = MagicMock()
        metadata = MagicMock()
        metadata.name = f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB_NAME}/executions/exec-001"
        operation.metadata = metadata
        jobs.run_job.return_value = operation

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.RunJobRequest.Overrides.ContainerOverride.return_value = MagicMock()
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            mock_run_v2.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            # Restore the injected client (patch replaces run_v2 namespace only)
            b._jobs_client = jobs
            result = self._call(b)

        assert result.status == JobStatus.RUNNING
        assert result.shard_id == self._SHARD
        assert "exec-001" in result.job_id
        assert result.metadata["job_name"] == JOB_NAME
        assert result.metadata["region"] == REGION

    def test_success_fallback_id_when_no_metadata(self) -> None:
        """When operation has no metadata.name, a timestamped fallback ID is used."""
        b = _make_backend()
        jobs, _ = _inject_clients(b)
        b._template_env_cache[REGION] = []  # cached empty

        operation = MagicMock()
        operation.metadata = None
        jobs.run_job.return_value = operation

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.RunJobRequest.Overrides.ContainerOverride.return_value = MagicMock()
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            mock_run_v2.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            b._jobs_client = jobs
            result = self._call(b)

        assert result.status == JobStatus.RUNNING
        assert self._SHARD in result.job_id

    def test_template_env_none_means_no_env_override(self) -> None:
        """If _get_template_env() returns None, args-only ContainerOverride is built."""
        b = _make_backend()
        jobs, _ = _inject_clients(b)
        # Force _get_template_env to return None via cache
        b._template_env_cache[REGION] = None

        operation = MagicMock()
        operation.metadata = None
        jobs.run_job.return_value = operation

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            container_override_cls = mock_run_v2.RunJobRequest.Overrides.ContainerOverride
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            b._jobs_client = jobs
            result = self._call(b)

        # ContainerOverride should have been called with args= but NOT env=
        container_override_cls.assert_called_once()
        kwargs = container_override_cls.call_args.kwargs
        assert "env" not in kwargs
        assert kwargs.get("args") == self._ARGS
        assert result.status == JobStatus.RUNNING

    def test_resource_exhausted_retries_then_fails(self) -> None:
        """ResourceExhausted on all 4 attempts → FAILED JobInfo after final attempt."""
        b = _make_backend()
        jobs, _ = _inject_clients(b)
        b._template_env_cache[REGION] = []

        # Patch google_exceptions.ResourceExhausted to be a real exception subclass
        resource_exhausted_exc = type("ResourceExhausted", (Exception,), {})

        with (
            patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2,
            patch("deployment_service.backends.cloud_run.google_exceptions") as mock_exceptions,
            patch("deployment_service.backends.cloud_run.time.sleep") as mock_sleep,
        ):
            mock_exceptions.ResourceExhausted = resource_exhausted_exc
            mock_exceptions.NotFound = type("NotFound", (Exception,), {})
            mock_run_v2.RunJobRequest.Overrides.ContainerOverride.return_value = MagicMock()
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            mock_run_v2.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            b._jobs_client = jobs

            jobs.run_job.side_effect = resource_exhausted_exc("quota exceeded for testing")

            result = self._call(b)

        assert result.status == JobStatus.FAILED
        assert "Rate limit" in (result.error_message or "")
        # 3 sleeps for retries (attempts 0, 1, 2); attempt 3 is final → no sleep
        assert mock_sleep.call_count == 3
        assert mock_sleep.call_args_list == [call(30), call(60), call(90)]

    def test_resource_exhausted_succeeds_on_retry(self) -> None:
        """ResourceExhausted on first attempt, success on second → RUNNING."""
        b = _make_backend()
        jobs, _ = _inject_clients(b)
        b._template_env_cache[REGION] = []

        resource_exhausted_exc = type("ResourceExhausted", (Exception,), {})

        success_op = MagicMock()
        success_op.metadata = None

        with (
            patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2,
            patch("deployment_service.backends.cloud_run.google_exceptions") as mock_exceptions,
            patch("deployment_service.backends.cloud_run.time.sleep"),
        ):
            mock_exceptions.ResourceExhausted = resource_exhausted_exc
            mock_exceptions.NotFound = type("NotFound", (Exception,), {})
            mock_run_v2.RunJobRequest.Overrides.ContainerOverride.return_value = MagicMock()
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            mock_run_v2.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            b._jobs_client = jobs

            jobs.run_job.side_effect = [
                resource_exhausted_exc("resource exhausted"),
                success_op,
            ]
            result = self._call(b)

        assert result.status == JobStatus.RUNNING

    def test_not_found_returns_failed_immediately(self) -> None:
        """NotFound → FAILED immediately, no retries."""
        b = _make_backend()
        jobs, _ = _inject_clients(b)
        b._template_env_cache[REGION] = []

        not_found_exc = type("NotFound", (Exception,), {})

        with (
            patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2,
            patch("deployment_service.backends.cloud_run.google_exceptions") as mock_exceptions,
            patch("deployment_service.backends.cloud_run.time.sleep") as mock_sleep,
        ):
            mock_exceptions.ResourceExhausted = type("ResourceExhausted", (Exception,), {})
            mock_exceptions.NotFound = not_found_exc
            mock_run_v2.RunJobRequest.Overrides.ContainerOverride.return_value = MagicMock()
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            mock_run_v2.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            b._jobs_client = jobs

            jobs.run_job.side_effect = not_found_exc("job not found")
            result = self._call(b)

        assert result.status == JobStatus.FAILED
        assert JOB_NAME in (result.error_message or "")
        assert REGION in (result.error_message or "")
        mock_sleep.assert_not_called()
        # Only one call, no retry
        jobs.run_job.assert_called_once()

    def test_generic_runtime_error_returns_failed(self) -> None:
        """Unclassified RuntimeError → FAILED with error_message."""
        b = _make_backend()
        jobs, _ = _inject_clients(b)
        b._template_env_cache[REGION] = []

        with (
            patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2,
            patch("deployment_service.backends.cloud_run.google_exceptions") as mock_exceptions,
        ):
            mock_exceptions.ResourceExhausted = type("ResourceExhausted", (Exception,), {})
            mock_exceptions.NotFound = type("NotFound", (Exception,), {})
            mock_run_v2.RunJobRequest.Overrides.ContainerOverride.return_value = MagicMock()
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            mock_run_v2.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            b._jobs_client = jobs

            jobs.run_job.side_effect = RuntimeError("internal server error")
            result = self._call(b)

        assert result.status == JobStatus.FAILED
        assert "internal server error" in (result.error_message or "")

    def test_generic_error_with_quota_hint_logs_warning(
        self, caplog: pytest.LogCaptureFixture
    ) -> None:
        """RuntimeError containing 'quota' triggers quota warning log."""
        import logging

        b = _make_backend()
        jobs, _ = _inject_clients(b)
        b._template_env_cache[REGION] = []

        with (
            patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2,
            patch("deployment_service.backends.cloud_run.google_exceptions") as mock_exceptions,
            caplog.at_level(logging.WARNING, logger="deployment_service.backends.cloud_run"),
        ):
            mock_exceptions.ResourceExhausted = type("ResourceExhausted", (Exception,), {})
            mock_exceptions.NotFound = type("NotFound", (Exception,), {})
            mock_run_v2.RunJobRequest.Overrides.ContainerOverride.return_value = MagicMock()
            mock_run_v2.RunJobRequest.Overrides.return_value = MagicMock()
            mock_run_v2.RunJobRequest.return_value = MagicMock()
            mock_run_v2.EnvVar.side_effect = lambda name, value: MagicMock(name=name, value=value)
            b._jobs_client = jobs
            jobs.run_job.side_effect = RuntimeError("quota limit exceeded")
            result = self._call(b)

        assert result.status == JobStatus.FAILED
        assert "QUOTA_ERROR" in caplog.text


# ---------------------------------------------------------------------------
# get_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetStatus:
    _JOB_ID = f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB_NAME}/executions/exec-42"

    def _make_execution(
        self,
        *,
        completion_time: object = None,
        running_count: int = 0,
        failed_count: int = 0,
        succeeded_count: int = 0,
        conditions: list[MagicMock] | None = None,
        start_time: object = None,
    ) -> MagicMock:
        exec_mock = MagicMock()
        exec_mock.name = self._JOB_ID
        exec_mock.completion_time = completion_time
        exec_mock.running_count = running_count
        exec_mock.failed_count = failed_count
        exec_mock.succeeded_count = succeeded_count
        exec_mock.conditions = conditions or []
        exec_mock.start_time = start_time
        return exec_mock

    def test_running_status(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.return_value = self._make_execution(running_count=1)

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.RUNNING
        assert result.job_id == self._JOB_ID
        assert result.metadata["running_count"] == 1

    def test_succeeded_status(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        now = datetime.now(UTC)
        execs.get_execution.return_value = self._make_execution(
            completion_time=now, failed_count=0, succeeded_count=1
        )

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.SUCCEEDED

    def test_failed_status_with_error_message(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        condition = MagicMock()
        condition.type_ = "Failed"
        condition.message = "OOM killed"
        now = datetime.now(UTC)
        execs.get_execution.return_value = self._make_execution(
            completion_time=now,
            failed_count=1,
            conditions=[condition],
        )

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.FAILED
        assert result.error_message == "OOM killed"

    def test_failed_status_condition_wrong_type_ignored(self) -> None:
        """Only conditions with type_ == 'Failed' contribute the error message."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        condition = MagicMock()
        condition.type_ = "Ready"
        condition.message = "irrelevant"
        now = datetime.now(UTC)
        execs.get_execution.return_value = self._make_execution(
            completion_time=now,
            failed_count=1,
            conditions=[condition],
        )

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.FAILED
        assert result.error_message is None

    def test_pending_status(self) -> None:
        """No completion_time, no running tasks → PENDING."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.return_value = self._make_execution()

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.PENDING

    def test_not_found_returns_succeeded(self) -> None:
        """Execution cleaned up by GCP ('does not exist') is treated as SUCCEEDED."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.side_effect = RuntimeError("execution does not exist")

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.SUCCEEDED
        assert "note" in result.metadata

    def test_not_found_via_code_5(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.side_effect = RuntimeError("code: 5 resource not found")

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.SUCCEEDED

    def test_not_found_via_NOT_FOUND_string(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.side_effect = RuntimeError("NOT_FOUND: no such execution")

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.SUCCEEDED

    def test_generic_error_returns_unknown(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.side_effect = RuntimeError("internal server error")

        result = b.get_status(self._JOB_ID)

        assert result.status == JobStatus.UNKNOWN
        assert "internal server error" in (result.error_message or "")

    def test_logs_url_embedded_in_result(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.get_execution.return_value = self._make_execution(running_count=1)

        result = b.get_status(self._JOB_ID)

        assert result.logs_url is not None
        assert PROJECT in result.logs_url
        assert REGION in result.logs_url

    def test_start_time_and_end_time_passed_through(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        start = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)
        end = datetime(2026, 1, 1, 1, 0, 0, tzinfo=UTC)
        execs.get_execution.return_value = self._make_execution(
            completion_time=end, start_time=start, succeeded_count=1
        )

        result = b.get_status(self._JOB_ID)

        assert result.start_time == start
        assert result.end_time == end


# ---------------------------------------------------------------------------
# get_status_batch
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetStatusBatch:
    _BASE = f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB_NAME}/executions"
    _ID1 = f"{_BASE}/exec-01"
    _ID2 = f"{_BASE}/exec-02"
    _ID3 = f"{_BASE}/exec-03"

    def _make_execution(
        self,
        name: str,
        *,
        completion_time: object = None,
        running_count: int = 0,
        failed_count: int = 0,
        succeeded_count: int = 0,
        conditions: list[MagicMock] | None = None,
        start_time: object = None,
    ) -> MagicMock:
        exc = MagicMock()
        exc.name = name
        exc.completion_time = completion_time
        exc.running_count = running_count
        exc.failed_count = failed_count
        exc.succeeded_count = succeeded_count
        exc.conditions = conditions or []
        exc.start_time = start_time
        return exc

    def test_empty_list_returns_empty_dict(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        with patch("deployment_service.backends.cloud_run.run_v2"):
            result = b.get_status_batch([])
        assert result == {}
        execs.list_executions.assert_not_called()

    def test_running_execution_mapped_correctly(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        exec1 = self._make_execution(self._ID1, running_count=1)
        execs.list_executions.return_value = iter([exec1])

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch([self._ID1])

        assert self._ID1 in result
        assert result[self._ID1].status == JobStatus.RUNNING

    def test_succeeded_execution(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        now = datetime.now(UTC)
        exec1 = self._make_execution(self._ID1, completion_time=now, succeeded_count=1)
        execs.list_executions.return_value = iter([exec1])

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch([self._ID1])

        assert result[self._ID1].status == JobStatus.SUCCEEDED

    def test_failed_execution_with_error_message(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        condition = MagicMock()
        condition.type_ = "Failed"
        condition.message = "exit code 1"
        now = datetime.now(UTC)
        exec1 = self._make_execution(
            self._ID1, completion_time=now, failed_count=1, conditions=[condition]
        )
        execs.list_executions.return_value = iter([exec1])

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch([self._ID1])

        assert result[self._ID1].status == JobStatus.FAILED
        assert result[self._ID1].error_message == "exit code 1"

    def test_pending_execution(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        exec1 = self._make_execution(self._ID1)  # no completion, no running
        execs.list_executions.return_value = iter([exec1])

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch([self._ID1])

        assert result[self._ID1].status == JobStatus.PENDING

    def test_not_found_in_listing_defaults_to_succeeded(self) -> None:
        """A job_id not returned by list_executions is treated as completed and cleaned up."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.list_executions.return_value = iter([])

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch([self._ID1, self._ID2])

        assert result[self._ID1].status == JobStatus.SUCCEEDED
        assert result[self._ID2].status == JobStatus.SUCCEEDED
        assert "note" in result[self._ID1].metadata

    def test_early_exit_when_all_found(self) -> None:
        """Iteration stops as soon as all requested IDs are found."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        exec1 = self._make_execution(self._ID1, running_count=1)
        exec2 = self._make_execution(self._ID2, running_count=1)
        exec3 = self._make_execution(self._ID3, running_count=1)  # not requested

        # Verify that exec3 is yielded after early-exit; result should not contain it
        execs.list_executions.return_value = iter([exec1, exec2, exec3])

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch([self._ID1, self._ID2])

        assert self._ID1 in result
        assert self._ID2 in result
        assert self._ID3 not in result

    def test_listing_error_falls_back_to_succeeded_for_all(self) -> None:
        """If list_executions raises, all requested IDs are returned as SUCCEEDED."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.list_executions.side_effect = RuntimeError("API unavailable")

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch([self._ID1, self._ID2])

        assert result[self._ID1].status == JobStatus.SUCCEEDED
        assert result[self._ID2].status == JobStatus.SUCCEEDED

    def test_job_id_without_slash_gets_unknown_shard_id(self) -> None:
        """A bare (non-path) job_id not found in listing → shard_id='unknown'."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.list_executions.return_value = iter([])

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.ListExecutionsRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.get_status_batch(["bare-id"])

        assert result["bare-id"].shard_id == "unknown"


# ---------------------------------------------------------------------------
# cancel_job
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestCancelJob:
    _JOB_ID = f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB_NAME}/executions/exec-77"

    def test_successful_cancellation(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.cancel_execution.return_value = MagicMock()

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.CancelExecutionRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.cancel_job(self._JOB_ID)

        assert result is True
        execs.cancel_execution.assert_called_once()

    def test_not_found_returns_true(self) -> None:
        """Execution already gone → treated as successful cancellation."""
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.cancel_execution.side_effect = RuntimeError("execution does not exist")

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.CancelExecutionRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.cancel_job(self._JOB_ID)

        assert result is True

    def test_not_found_via_code_5(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.cancel_execution.side_effect = RuntimeError("code: 5")

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.CancelExecutionRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.cancel_job(self._JOB_ID)

        assert result is True

    def test_not_found_via_NOT_FOUND(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.cancel_execution.side_effect = RuntimeError("NOT_FOUND")

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.CancelExecutionRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.cancel_job(self._JOB_ID)

        assert result is True

    def test_generic_error_returns_false(self) -> None:
        b = _make_backend()
        _, execs = _inject_clients(b)
        execs.cancel_execution.side_effect = RuntimeError("permission denied")

        with patch("deployment_service.backends.cloud_run.run_v2") as mock_run_v2:
            mock_run_v2.CancelExecutionRequest.return_value = MagicMock()
            b._executions_client = execs
            result = b.cancel_job(self._JOB_ID)

        assert result is False


# ---------------------------------------------------------------------------
# get_logs_url
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestGetLogsUrl:
    def test_full_path_extracts_execution_id(self) -> None:
        b = _make_backend()
        full_path = f"projects/{PROJECT}/locations/{REGION}/jobs/{JOB_NAME}/executions/exec-99"
        url = b.get_logs_url(full_path)

        assert "exec-99" in url
        assert REGION in url
        assert JOB_NAME in url
        assert PROJECT in url
        assert "https://console.cloud.google.com" in url

    def test_bare_execution_id(self) -> None:
        b = _make_backend()
        url = b.get_logs_url("my-execution-id")

        assert "my-execution-id" in url

    def test_url_format_matches_expected_pattern(self) -> None:
        b = _make_backend()
        url = b.get_logs_url("exec-42")
        expected = (
            f"https://console.cloud.google.com/run/jobs/details/"
            f"{REGION}/{JOB_NAME}/executions/exec-42"
            f"?project={PROJECT}"
        )
        assert url == expected


# ---------------------------------------------------------------------------
# JobInfo dataclass (base.py coverage via cloud_run context)
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestJobInfoDataclass:
    def test_duration_seconds_with_start_and_end(self) -> None:
        start = datetime(2026, 1, 1, 0, 0, 0, tzinfo=UTC)
        end = datetime(2026, 1, 1, 0, 1, 30, tzinfo=UTC)
        info = JobInfo(
            job_id="j1",
            shard_id="s1",
            status=JobStatus.SUCCEEDED,
            start_time=start,
            end_time=end,
        )
        assert info.duration_seconds == 90.0

    def test_duration_seconds_none_when_missing_end(self) -> None:
        info = JobInfo(
            job_id="j1",
            shard_id="s1",
            status=JobStatus.RUNNING,
            start_time=datetime.now(UTC),
        )
        assert info.duration_seconds is None

    def test_to_dict_serialization(self) -> None:
        start = datetime(2026, 1, 1, 12, 0, 0, tzinfo=UTC)
        info = JobInfo(
            job_id="j1",
            shard_id="s1",
            status=JobStatus.FAILED,
            start_time=start,
            error_message="boom",
        )
        d = info.to_dict()
        assert d["job_id"] == "j1"
        assert d["status"] == "failed"
        assert d["error_message"] == "boom"
        assert d["start_time"] == start.isoformat()
        assert d["end_time"] is None
        assert d["duration_seconds"] is None

    def test_to_dict_all_status_values(self) -> None:
        for status in JobStatus:
            info = JobInfo(job_id="x", shard_id="y", status=status)
            d = info.to_dict()
            assert d["status"] == status.value
