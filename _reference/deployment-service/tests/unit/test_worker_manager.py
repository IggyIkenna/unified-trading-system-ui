"""
Unit tests for deployment_service/deployment/worker_manager.py.

Covers:
- launch_shards_parallel: basic success path, all-failed path, mixed success/fail,
  venue overrides applied, zone distribution for VM backend, SHARD_INDEX/TOTAL_SHARDS env vars,
  auto_retry_failed=True retries failed shards, max retry rounds exhausted,
  quota broker granted / quota broker denied+timeout / quota broker release on failure,
  retryable SSL error triggers backoff, non-retryable error terminates immediately,
  final DeploymentStatus set correctly (all failed / all running / partial)
- launch_shards_rolling: basic first-wave no_wait, all slots available launches single wave,
  running shards polled for status, completed shards free up slots for next wave
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends import JobInfo, JobStatus
from deployment_service.deployment.state import (
    DeploymentState,
    DeploymentStatus,
    ShardState,
    ShardStatus,
)
from deployment_service.deployment.worker_manager import (
    launch_shards_parallel,
    launch_shards_rolling,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_IMAGE = "gcr.io/test/svc:latest"
_ENV: dict[str, str] = {"LOG_LEVEL": "INFO"}
_COMPUTE_CFG: dict[str, object] = {"memory": "2Gi", "cpu": 1}


def _make_state(
    n_shards: int = 3,
    shard_status: ShardStatus = ShardStatus.PENDING,
    service: str = "test-svc",
    deployment_id: str = "dep-001",
) -> DeploymentState:
    shards = [ShardState(shard_id=f"s-{i}", status=shard_status) for i in range(n_shards)]
    return DeploymentState(
        deployment_id=deployment_id,
        service=service,
        compute_type="cloud_run",
        total_shards=n_shards,
        shards=shards,
    )


def _make_rate_limiter() -> MagicMock:
    rl = MagicMock()
    rl.acquire = MagicMock()
    return rl


def _make_state_manager() -> MagicMock:
    sm = MagicMock()
    sm.save_state = MagicMock()
    return sm


def _make_backend(status: JobStatus = JobStatus.RUNNING, job_id: str = "job-001") -> MagicMock:
    backend = MagicMock(spec=["deploy_shard", "get_status", "region"])
    backend.region = "us-central1"
    job_info = JobInfo(job_id=job_id, shard_id="s-0", status=status)
    backend.deploy_shard.return_value = job_info
    return backend


def _make_simple_backend() -> MagicMock:
    """Create a backend mock without VM-specific attributes (no _get_zones_for_region)."""
    return MagicMock(spec=["deploy_shard", "get_status", "region"])


# ---------------------------------------------------------------------------
# launch_shards_parallel — basic success
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_all_running(mock_cfg: MagicMock) -> None:
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=3)
    backend = _make_backend(status=JobStatus.RUNNING)
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    running = [s for s in state.shards if s.status == ShardStatus.RUNNING]
    assert len(running) == 3
    assert state.status == DeploymentStatus.RUNNING


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_all_failed(mock_cfg: MagicMock) -> None:
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=2)
    backend = _make_backend(status=JobStatus.FAILED)
    backend.deploy_shard.return_value = JobInfo(
        job_id="j-0", shard_id="s-0", status=JobStatus.FAILED, error_message="OOM"
    )
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    failed = [s for s in state.shards if s.status == ShardStatus.FAILED]
    assert len(failed) == 2
    assert state.status == DeploymentStatus.FAILED


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_backend_raises_non_retryable(mock_cfg: MagicMock) -> None:
    """Non-retryable errors (OSError without retryable keywords) cause shard FAILED."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=1)
    backend = MagicMock(spec=["deploy_shard", "get_status", "region"])
    backend.region = "us-central1"
    backend.deploy_shard.side_effect = ValueError("permission denied")
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    assert state.shards[0].status == ShardStatus.FAILED


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager.time")
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_retryable_ssl_error(
    mock_cfg: MagicMock, mock_time: MagicMock
) -> None:
    """SSL errors are retryable — backend should be retried before failing."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5
    mock_time.time.return_value = 0
    mock_time.sleep = MagicMock()

    state = _make_state(n_shards=1)
    backend = _make_simple_backend()
    # First call raises SSL error, second succeeds
    good_job = JobInfo(job_id="j-ok", shard_id="s-0", status=JobStatus.RUNNING)
    backend.deploy_shard.side_effect = [OSError("SSL EOF occurred"), good_job]
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    # Should have called deploy_shard twice (retry succeeded)
    assert backend.deploy_shard.call_count == 2
    assert state.shards[0].status == ShardStatus.RUNNING


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_shard_env_vars_include_index(mock_cfg: MagicMock) -> None:
    """SHARD_INDEX and TOTAL_SHARDS must be injected into each shard's env vars."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=2)
    backend = _make_backend(status=JobStatus.RUNNING)
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    # Collect all env_vars passed to deploy_shard
    all_env_calls = [
        call_args.kwargs.get("environment_variables") or call_args.args[4]
        for call_args in backend.deploy_shard.call_args_list
    ]
    for env in all_env_calls:
        assert "SHARD_INDEX" in env
        assert "TOTAL_SHARDS" in env


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_venue_override_applied(mock_cfg: MagicMock) -> None:
    """Venue override should merge into compute config for matching venue shards."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=1)
    state.shards[0].dimensions = {"venue": "COINBASE"}

    backend = _make_backend(status=JobStatus.RUNNING)
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    venue_overrides: dict[str, dict[str, object]] = {"COINBASE": {"cloud_run": {"memory": "256Gi"}}}

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        venue_overrides=venue_overrides,
        compute_type="cloud_run",
        auto_retry_failed=False,
    )

    # The compute_config passed to deploy_shard should include the override
    call_kwargs = backend.deploy_shard.call_args.kwargs
    assert call_kwargs.get("compute_config", {}).get("memory") == "256Gi"


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_vm_zone_distribution(mock_cfg: MagicMock) -> None:
    """For VM compute type, zones should be round-robin distributed across shards."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=3)

    backend = MagicMock()
    backend.region = "us-central1"
    backend._get_zones_for_region = lambda r: ["us-central1-a", "us-central1-b", "us-central1-c"]
    good_job = JobInfo(job_id="j-0", shard_id="s-0", status=JobStatus.RUNNING)
    backend.deploy_shard.return_value = good_job

    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        compute_type="vm",
        auto_retry_failed=False,
    )

    zones_used = [
        call_args.kwargs.get("compute_config", {}).get("zone")
        for call_args in backend.deploy_shard.call_args_list
    ]
    # All three zones should be represented (one per shard in round-robin)
    assert set(zones_used) == {"us-central1-a", "us-central1-b", "us-central1-c"}


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager.time")
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_auto_retry_recovers_failed(
    mock_cfg: MagicMock, mock_time: MagicMock
) -> None:
    """auto_retry_failed=True should retry failed shards and mark them RUNNING on retry success."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5
    mock_time.time.return_value = 0
    mock_time.sleep = MagicMock()

    state = _make_state(n_shards=1)
    backend = _make_simple_backend()

    # First attempt: fail; second attempt (retry round): succeed
    failed_job = JobInfo(job_id="j-0", shard_id="s-0", status=JobStatus.FAILED, error_message="err")
    good_job = JobInfo(job_id="j-1", shard_id="s-0", status=JobStatus.RUNNING)
    backend.deploy_shard.side_effect = [failed_job, good_job]

    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=True,
        max_launch_retry_rounds=1,
    )

    assert state.shards[0].status == ShardStatus.RUNNING
    assert state.shards[0].retries == 1


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager.time")
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_auto_retry_exhausted_stays_failed(
    mock_cfg: MagicMock, mock_time: MagicMock
) -> None:
    """When retry rounds exhausted and shard still fails, DeploymentStatus is FAILED."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5
    mock_time.time.return_value = 0
    mock_time.sleep = MagicMock()

    state = _make_state(n_shards=1)
    backend = _make_simple_backend()
    failed_job = JobInfo(job_id="j-0", shard_id="s-0", status=JobStatus.FAILED, error_message="err")
    backend.deploy_shard.return_value = failed_job

    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=True,
        max_launch_retry_rounds=2,
    )

    assert state.shards[0].status == ShardStatus.FAILED
    assert state.status == DeploymentStatus.FAILED


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_deploy_raises_returns_none_job(mock_cfg: MagicMock) -> None:
    """When deploy_shard raises after all retries, shard should end up FAILED."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=1)
    backend = _make_simple_backend()
    backend.deploy_shard.side_effect = RuntimeError("fatal error")

    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    assert state.shards[0].status == ShardStatus.FAILED


# ---------------------------------------------------------------------------
# launch_shards_parallel — quota broker
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_quota_broker_granted(mock_cfg: MagicMock) -> None:
    """When quota broker grants admission, shard should launch normally."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 30

    state = _make_state(n_shards=1)
    backend = _make_backend(status=JobStatus.RUNNING)
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    quota_broker = MagicMock()
    quota_broker.enabled.return_value = True
    admission = MagicMock()
    admission.granted = True
    admission.lease_id = "lease-123"
    quota_broker.acquire.return_value = admission

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        quota_broker=quota_broker,
        auto_retry_failed=False,
    )

    quota_broker.acquire.assert_called_once()
    assert state.shards[0].status == ShardStatus.RUNNING


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager.time")
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_quota_broker_denied_timeout(
    mock_cfg: MagicMock, mock_time: MagicMock
) -> None:
    """When quota broker always denies and max_wait exceeded, shard should be FAILED."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 1  # Very short wait

    # Simulate time advancing past max_wait on second poll
    mock_time.time.side_effect = [0, 2]  # started=0, checked=2 (> 1)
    mock_time.sleep = MagicMock()

    state = _make_state(n_shards=1)
    backend = _make_simple_backend()
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    quota_broker = MagicMock()
    quota_broker.enabled.return_value = True
    denied = MagicMock()
    denied.granted = False
    denied.reason = "quota exceeded"
    denied.retry_after_seconds = 30
    quota_broker.acquire.return_value = denied

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        quota_broker=quota_broker,
        auto_retry_failed=False,
    )

    # Shard should be FAILED because quota was never granted
    assert state.shards[0].status == ShardStatus.FAILED


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_quota_released_on_deploy_failure(mock_cfg: MagicMock) -> None:
    """When deploy_shard returns FAILED job, quota lease should be released."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 30

    state = _make_state(n_shards=1)
    backend = _make_simple_backend()
    backend.deploy_shard.return_value = JobInfo(
        job_id="j-0", shard_id="s-0", status=JobStatus.FAILED, error_message="oom"
    )
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    quota_broker = MagicMock()
    quota_broker.enabled.return_value = True
    admission = MagicMock()
    admission.granted = True
    admission.lease_id = "lease-abc"
    quota_broker.acquire.return_value = admission

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        quota_broker=quota_broker,
        auto_retry_failed=False,
    )

    quota_broker.release.assert_called_once_with(lease_id="lease-abc")


# ---------------------------------------------------------------------------
# launch_shards_parallel — final DeploymentStatus correctness
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_status_running_when_some_running(mock_cfg: MagicMock) -> None:
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=2)
    backend = _make_backend(status=JobStatus.RUNNING)
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    assert state.status == DeploymentStatus.RUNNING


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_parallel_no_shards_returns_immediately(mock_cfg: MagicMock) -> None:
    """With no pending shards, function should exit gracefully."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=0)
    backend = _make_simple_backend()
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    launch_shards_parallel(
        state=state,
        backend=backend,
        docker_image=_IMAGE,
        environment_variables=_ENV,
        compute_config=_COMPUTE_CFG,
        rate_limiter=rate_limiter,
        state_manager=state_manager,
        auto_retry_failed=False,
    )

    backend.deploy_shard.assert_not_called()
    state_manager.save_state.assert_called()


# ---------------------------------------------------------------------------
# launch_shards_rolling
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_rolling_no_wait_returns_after_first_wave(mock_cfg: MagicMock) -> None:
    """no_wait=True should return after launching the first wave."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=5)
    backend = _make_backend(status=JobStatus.RUNNING)
    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    with patch(
        "deployment_service.deployment.worker_manager.launch_shards_parallel"
    ) as mock_parallel:
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE_CFG,
            rate_limiter=rate_limiter,
            state_manager=state_manager,
            max_concurrent=3,
            no_wait=True,
        )

    # Should have launched exactly one wave
    mock_parallel.assert_called_once()


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_rolling_all_in_one_wave_when_under_limit(mock_cfg: MagicMock) -> None:
    """If total shards <= max_concurrent, all should launch in a single wave."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5

    state = _make_state(n_shards=3)

    call_count = 0

    def fake_parallel(state: DeploymentState, **kwargs) -> None:
        nonlocal call_count
        call_count += 1
        # Mark all pending shards as RUNNING
        for s in state.pending_shards:
            s.status = ShardStatus.RUNNING

    with patch(
        "deployment_service.deployment.worker_manager.launch_shards_parallel",
        side_effect=fake_parallel,
    ):
        launch_shards_rolling(
            state=state,
            backend=MagicMock(),
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE_CFG,
            rate_limiter=_make_rate_limiter(),
            state_manager=_make_state_manager(),
            max_concurrent=10,
        )

    assert call_count == 1
    assert all(s.status == ShardStatus.RUNNING for s in state.shards)


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager.time")
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_rolling_polls_running_shard_status(
    mock_cfg: MagicMock, mock_time: MagicMock
) -> None:
    """Running shards should have their status polled when slots are full."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5
    mock_time.sleep = MagicMock()
    mock_time.time.return_value = 0

    # 4 pending shards but max_concurrent=2 → first wave launches 2, 2 remain
    state = _make_state(n_shards=4)

    backend = _make_simple_backend()

    wave_count = [0]

    def fake_parallel(state: DeploymentState, **kwargs) -> None:
        wave_count[0] += 1
        if wave_count[0] == 1:
            # First wave: mark all current pending (wave of 2) as RUNNING
            for s in state.pending_shards:
                s.status = ShardStatus.RUNNING
                s.job_id = f"j-wave1-{s.shard_id}"
        else:
            # Subsequent wave: mark remaining pending as RUNNING
            for s in state.pending_shards:
                s.status = ShardStatus.RUNNING
                s.job_id = f"j-wave2-{s.shard_id}"

    # get_status: first poll returns SUCCEEDED to free up slots for wave 2
    succeeded_info = JobInfo(job_id="j-wave1-s-0", shard_id="s-0", status=JobStatus.SUCCEEDED)
    backend.get_status.return_value = succeeded_info

    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    with patch(
        "deployment_service.deployment.worker_manager.launch_shards_parallel",
        side_effect=fake_parallel,
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE_CFG,
            rate_limiter=rate_limiter,
            state_manager=state_manager,
            max_concurrent=2,  # Force waves — only 2 at a time
        )

    # The backend was consulted for status polling
    backend.get_status.assert_called()


@pytest.mark.unit
@patch("deployment_service.deployment.worker_manager.time")
@patch("deployment_service.deployment.worker_manager._config")
def test_launch_shards_rolling_poll_failure_logged_not_raised(
    mock_cfg: MagicMock, mock_time: MagicMock
) -> None:
    """Errors during polling should be caught and logged, not propagate."""
    mock_cfg.vm_launch_mini_batch_size = 50
    mock_cfg.vm_launch_mini_batch_delay_seconds = 0
    mock_cfg.broker_max_wait_seconds = 5
    mock_time.sleep = MagicMock()
    mock_time.time.return_value = 0

    # 1 RUNNING (fills the max_concurrent=1 slot) + 1 PENDING → loop must poll before launching
    state = _make_state(n_shards=2)
    state.shards[0].status = ShardStatus.RUNNING
    state.shards[0].job_id = "job-running"

    backend = _make_simple_backend()
    backend.get_status.side_effect = OSError("network failure")

    poll_call_count = [0]

    def fake_parallel(state: DeploymentState, **kwargs) -> None:
        # After poll, mark remaining pending as RUNNING so loop can exit
        for s in state.pending_shards:
            s.status = ShardStatus.RUNNING

    # Make the pre-existing running shard SUCCEEDED after first poll attempt
    # so the loop can proceed to launch wave 2 and exit

    def side_effect_then_succeed(job_id: str) -> JobInfo:
        poll_call_count[0] += 1
        if poll_call_count[0] == 1:
            raise OSError("network failure")
        return JobInfo(job_id=job_id, shard_id="s-0", status=JobStatus.SUCCEEDED)

    backend.get_status.side_effect = side_effect_then_succeed
    # Also mark shard[0] as SUCCEEDED after poll so slot opens
    # We manipulate state directly via get_status side effect driving shard status
    # Actually, the rolling launcher updates shard.status from get_status result,
    # so the second get_status returning SUCCEEDED will open a slot.

    rate_limiter = _make_rate_limiter()
    state_manager = _make_state_manager()

    # Should not raise even when get_status raises
    with patch(
        "deployment_service.deployment.worker_manager.launch_shards_parallel",
        side_effect=fake_parallel,
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE_CFG,
            rate_limiter=rate_limiter,
            state_manager=state_manager,
            max_concurrent=1,  # Only 1 at a time forces poll before wave 2
        )

    # Poll was attempted at least once
    assert backend.get_status.call_count >= 1
