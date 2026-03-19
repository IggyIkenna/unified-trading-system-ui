"""
Unit tests for deployment_service/deployment/_worker_rolling.py.

Covers:
- launch_shards_rolling: no_wait=True returns after initial batch
- All shards launch and complete (SUCCEEDED / FAILED / CANCELLED)
- UNKNOWN status increments unknown_polls, eventually marks FAILED
- Quota broker admission: granted / denied (keeps shard pending)
- Quota lease released on shard completion (success, failure, cancel)
- Quota lease released on launch failure
- VM zone distribution (round-robin via _get_zones_for_region)
- Venue overrides applied to compute config
- SHARD_INDEX / TOTAL_SHARDS injected into env vars
- Rolling launch refills slots when running shards finish
- Mini-batch behaviour (mini_batch_size honoured)
- Final DeploymentStatus: COMPLETED when no failures, FAILED when any fail
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends import JobInfo, JobStatus
from deployment_service.deployment._worker_rolling import launch_shards_rolling
from deployment_service.deployment.state import (
    DeploymentState,
    DeploymentStatus,
    ShardState,
    ShardStatus,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_IMAGE = "gcr.io/test/svc:latest"
_ENV: dict[str, str] = {"LOG_LEVEL": "INFO"}
_COMPUTE: dict[str, object] = {"memory": "2Gi", "cpu": "1"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_state(
    n: int = 3,
    service: str = "test-svc",
    dep_id: str = "dep-001",
    shard_status: ShardStatus = ShardStatus.PENDING,
) -> DeploymentState:
    shards = [
        ShardState(shard_id=f"s-{i}", status=shard_status, args=["--arg", str(i)]) for i in range(n)
    ]
    return DeploymentState(
        deployment_id=dep_id,
        service=service,
        compute_type="cloud_run",
        total_shards=n,
        shards=shards,
    )


def _make_backend(
    job_status: JobStatus = JobStatus.RUNNING,
    job_id: str = "job-001",
) -> MagicMock:
    backend = MagicMock(spec=["deploy_shard", "get_status_with_context", "region"])
    backend.region = "us-central1"
    backend.deploy_shard.return_value = JobInfo(job_id=job_id, shard_id="s-0", status=job_status)
    backend.get_status_with_context.return_value = JobInfo(
        job_id=job_id, shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    return backend


def _make_rate_limiter() -> MagicMock:
    rl = MagicMock()
    rl.acquire = MagicMock()
    return rl


def _make_state_manager() -> MagicMock:
    sm = MagicMock()
    sm.save_state = MagicMock()
    return sm


def _make_config(
    mini_batch_size: int = 100,
    mini_batch_delay: float = 0,
    unknown_threshold: int = 3,
) -> MagicMock:
    cfg = MagicMock()
    cfg.vm_launch_mini_batch_size = mini_batch_size
    cfg.vm_launch_mini_batch_delay_seconds = mini_batch_delay
    cfg.unknown_status_max_polls = unknown_threshold
    return cfg


# ---------------------------------------------------------------------------
# Tests: no_wait=True
# ---------------------------------------------------------------------------


def test_no_wait_returns_after_initial_batch() -> None:
    """With no_wait=True the function returns immediately after launching the first wave."""
    state = _make_state(n=3)
    backend = _make_backend()
    sm = _make_state_manager()

    with patch("deployment_service.deployment._worker_rolling._config", _make_config()):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            no_wait=True,
        )

    # All shards should have been attempted
    assert backend.deploy_shard.call_count == 3
    # get_status_with_context must NOT have been called (no monitoring phase)
    backend.get_status_with_context.assert_not_called()
    sm.save_state.assert_called()


# ---------------------------------------------------------------------------
# Tests: all shards succeed
# ---------------------------------------------------------------------------


def test_all_shards_succeed() -> None:
    """All shards launch successfully and complete as SUCCEEDED."""
    state = _make_state(n=3)
    backend = _make_backend(job_status=JobStatus.RUNNING)
    # Status check will immediately return SUCCEEDED
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            poll_interval=0,
        )

    assert state.status == DeploymentStatus.COMPLETED
    assert all(s.status == ShardStatus.SUCCEEDED for s in state.shards)


# ---------------------------------------------------------------------------
# Tests: launch failure → shard marked FAILED
# ---------------------------------------------------------------------------


def test_launch_failure_marks_shard_failed() -> None:
    """When deploy_shard returns None-equivalent failure, shard is marked FAILED."""
    state = _make_state(n=2)
    backend = MagicMock(spec=["deploy_shard", "get_status_with_context", "region"])
    backend.region = "us-central1"
    backend.deploy_shard.return_value = JobInfo(
        job_id="failed-s-0",
        shard_id="s-0",
        status=JobStatus.FAILED,
        error_message="API error",
    )
    backend.get_status_with_context.return_value = JobInfo(
        job_id="failed-s-0", shard_id="s-0", status=JobStatus.FAILED
    )
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            poll_interval=0,
        )

    assert state.status == DeploymentStatus.FAILED
    assert all(s.status == ShardStatus.FAILED for s in state.shards)


# ---------------------------------------------------------------------------
# Tests: CANCELLED status
# ---------------------------------------------------------------------------


def test_running_shard_cancelled_marks_cancelled() -> None:
    """Shard that returns CANCELLED status in the monitoring loop is marked CANCELLED."""
    state = _make_state(n=1)
    backend = _make_backend(job_status=JobStatus.RUNNING)
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.CANCELLED
    )
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            poll_interval=0,
        )

    assert state.shards[0].status == ShardStatus.CANCELLED


# ---------------------------------------------------------------------------
# Tests: UNKNOWN status accumulation → FAILED
# ---------------------------------------------------------------------------


def test_unknown_status_threshold_marks_failed() -> None:
    """Shard UNKNOWN for unknown_threshold polls gets marked FAILED."""
    state = _make_state(n=1)
    backend = _make_backend(job_status=JobStatus.RUNNING)
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.UNKNOWN
    )
    sm = _make_state_manager()

    with (
        patch(
            "deployment_service.deployment._worker_rolling._config",
            _make_config(unknown_threshold=3),
        ),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            poll_interval=0,
        )

    assert state.shards[0].status == ShardStatus.FAILED
    assert state.shards[0].unknown_polls >= 3


# ---------------------------------------------------------------------------
# Tests: UNKNOWN resets on valid status
# ---------------------------------------------------------------------------


def test_unknown_resets_on_valid_response() -> None:
    """unknown_polls is reset to 0 when a non-UNKNOWN status is received."""
    state = _make_state(n=1)
    backend = _make_backend(job_status=JobStatus.RUNNING)
    # First two calls return UNKNOWN, then SUCCEEDED
    backend.get_status_with_context.side_effect = [
        JobInfo(job_id="job-001", shard_id="s-0", status=JobStatus.UNKNOWN),
        JobInfo(job_id="job-001", shard_id="s-0", status=JobStatus.UNKNOWN),
        JobInfo(job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED),
    ]
    sm = _make_state_manager()

    with (
        patch(
            "deployment_service.deployment._worker_rolling._config",
            _make_config(unknown_threshold=5),
        ),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            poll_interval=0,
        )

    assert state.shards[0].status == ShardStatus.SUCCEEDED


# ---------------------------------------------------------------------------
# Tests: SHARD_INDEX and TOTAL_SHARDS injected
# ---------------------------------------------------------------------------


def test_shard_index_and_total_shards_in_env() -> None:
    """SHARD_INDEX and TOTAL_SHARDS are added to environment variables."""
    state = _make_state(n=2)
    backend = _make_backend()
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            no_wait=True,
        )

    # Inspect the env passed on any deploy_shard call
    call_kwargs = backend.deploy_shard.call_args_list
    assert len(call_kwargs) > 0
    for c in call_kwargs:
        # deploy_shard is called with keyword args in the implementation
        env = c.kwargs.get("environment_variables")
        if env is None and len(c.args) >= 5:
            env = c.args[4]
        assert env is not None, f"No environment_variables found in call: {c}"
        assert "SHARD_INDEX" in env
        assert "TOTAL_SHARDS" in env
        assert env["TOTAL_SHARDS"] == "2"


# ---------------------------------------------------------------------------
# Tests: venue overrides applied
# ---------------------------------------------------------------------------


def test_venue_overrides_applied() -> None:
    """Venue-specific compute config is merged into base compute config."""
    state = _make_state(n=1)
    state.shards[0].dimensions = {"venue": "BINANCE"}
    backend = _make_backend()
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()
    overrides = {"BINANCE": {"cloud_run": {"memory": "8Gi"}}}

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            venue_overrides=overrides,
            compute_type="cloud_run",
            no_wait=True,
        )

    call_kwargs = backend.deploy_shard.call_args
    cc = call_kwargs.kwargs.get("compute_config") or {}
    assert cc.get("memory") == "8Gi"


# ---------------------------------------------------------------------------
# Tests: VM zone distribution
# ---------------------------------------------------------------------------


def test_vm_zone_distribution() -> None:
    """With VM compute type, zone is assigned by round-robin via _get_zones_for_region."""
    state = _make_state(n=3)
    backend = MagicMock(
        spec=["deploy_shard", "get_status_with_context", "region", "_get_zones_for_region"]
    )
    backend.region = "us-central1"
    backend.deploy_shard.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.RUNNING
    )
    backend._get_zones_for_region.return_value = [
        "us-central1-a",
        "us-central1-b",
        "us-central1-c",
    ]
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            compute_type="vm",
            no_wait=True,
        )

    zones_used = [
        c.kwargs.get("compute_config", {}).get("zone") for c in backend.deploy_shard.call_args_list
    ]
    assert zones_used[0] == "us-central1-a"
    assert zones_used[1] == "us-central1-b"
    assert zones_used[2] == "us-central1-c"


# ---------------------------------------------------------------------------
# Tests: quota broker denied → shard stays pending
# ---------------------------------------------------------------------------


def test_quota_broker_denied_keeps_shard_pending() -> None:
    """When quota broker denies a shard, it is not launched and remains PENDING."""
    from deployment_service.deployment.quota_broker_client import QuotaBrokerAcquireResult

    state = _make_state(n=1)
    backend = _make_backend()
    sm = _make_state_manager()

    quota_broker = MagicMock()
    quota_broker.enabled.return_value = True
    quota_broker.acquire.return_value = QuotaBrokerAcquireResult(
        granted=False,
        lease_id="",
        reason="quota_full",
        retry_after_seconds=30,
    )

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            quota_broker=quota_broker,
            no_wait=True,
        )

    # deploy_shard must not be called when admission denied
    backend.deploy_shard.assert_not_called()
    assert state.shards[0].quota_denied_reason == "quota_full"


# ---------------------------------------------------------------------------
# Tests: quota broker lease released on success
# ---------------------------------------------------------------------------


def test_quota_lease_released_on_success() -> None:
    """Quota lease is released when a shard succeeds in the monitoring loop."""
    from deployment_service.deployment.quota_broker_client import QuotaBrokerAcquireResult

    state = _make_state(n=1)
    state.shards[0].quota_lease_id = "lease-abc"
    backend = _make_backend(job_status=JobStatus.RUNNING)
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()

    quota_broker = MagicMock()
    quota_broker.enabled.return_value = True
    quota_broker.acquire.return_value = QuotaBrokerAcquireResult(granted=True, lease_id="lease-abc")

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            quota_broker=quota_broker,
            poll_interval=0,
        )

    quota_broker.release.assert_called()


# ---------------------------------------------------------------------------
# Tests: deploy_shard raises → shard marked FAILED, lease released
# ---------------------------------------------------------------------------


def test_deploy_shard_exception_marks_failed_and_releases_lease() -> None:
    """If deploy_shard raises, the shard is marked FAILED and lease is released."""
    from deployment_service.deployment.quota_broker_client import QuotaBrokerAcquireResult

    state = _make_state(n=1)
    backend = MagicMock(spec=["deploy_shard", "get_status_with_context", "region"])
    backend.region = "us-central1"
    backend.deploy_shard.side_effect = RuntimeError("GCP exploded")

    quota_broker = MagicMock()
    quota_broker.enabled.return_value = True
    quota_broker.acquire.return_value = QuotaBrokerAcquireResult(granted=True, lease_id="lease-xyz")
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            quota_broker=quota_broker,
            no_wait=True,
        )

    # Because we raised before setting quota_lease_id on shard, release uses lease_id from local
    # var; the broker should have received a release call (best-effort)
    quota_broker.release.assert_called()


# ---------------------------------------------------------------------------
# Tests: rolling refill (max_concurrent slots)
# ---------------------------------------------------------------------------


def test_rolling_refills_slots_when_shards_finish() -> None:
    """Shards beyond max_concurrent are launched when running shards complete."""
    state = _make_state(n=4)
    backend = _make_backend(job_status=JobStatus.RUNNING)

    call_count = [0]

    def fake_status(*_args: object, **_kwargs: object) -> JobInfo:
        call_count[0] += 1
        # First two calls return SUCCEEDED so slots free up
        if call_count[0] <= 2:
            return JobInfo(job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED)
        return JobInfo(job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED)

    backend.get_status_with_context.side_effect = fake_status
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            max_concurrent=2,
            poll_interval=0,
        )

    # All 4 shards must have been launched
    assert backend.deploy_shard.call_count == 4


# ---------------------------------------------------------------------------
# Tests: mini-batch honoured
# ---------------------------------------------------------------------------


def test_mini_batch_size_splits_initial_batch() -> None:
    """With mini_batch_size=2 and 4 shards the backend gets calls in two batches."""
    state = _make_state(n=4)
    backend = _make_backend()
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()
    sleep_calls: list[float] = []

    with (
        patch(
            "deployment_service.deployment._worker_rolling._config",
            _make_config(mini_batch_size=2, mini_batch_delay=0.01),
        ),
        patch(
            "deployment_service.deployment._worker_rolling.time.sleep",
            side_effect=lambda t: sleep_calls.append(t),
        ),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            no_wait=True,
        )

    # 4 shards in 2 mini-batches → one inter-batch sleep
    assert any(s == pytest.approx(0.01) for s in sleep_calls)
    assert backend.deploy_shard.call_count == 4


# ---------------------------------------------------------------------------
# Tests: final DeploymentStatus
# ---------------------------------------------------------------------------


def test_final_status_completed_when_all_succeed() -> None:
    state = _make_state(n=2)
    backend = _make_backend(job_status=JobStatus.RUNNING)
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            poll_interval=0,
        )

    assert state.status == DeploymentStatus.COMPLETED


def test_final_status_failed_when_any_fail() -> None:
    state = _make_state(n=2)
    backend = _make_backend(job_status=JobStatus.RUNNING)
    backend.get_status_with_context.side_effect = [
        JobInfo(job_id="job-001", shard_id="s-0", status=JobStatus.FAILED),
        JobInfo(job_id="job-002", shard_id="s-1", status=JobStatus.SUCCEEDED),
    ]
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            poll_interval=0,
        )

    assert state.status == DeploymentStatus.FAILED


# ---------------------------------------------------------------------------
# Tests: state_manager.save_state called
# ---------------------------------------------------------------------------


def test_state_saved_after_each_mini_batch() -> None:
    state = _make_state(n=2)
    backend = _make_backend()
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )
    sm = _make_state_manager()

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            no_wait=True,
        )

    assert sm.save_state.call_count >= 1


# ---------------------------------------------------------------------------
# Tests: quota broker acquire with cloud_run TTL override
# ---------------------------------------------------------------------------


def test_quota_broker_cloud_run_ttl_override() -> None:
    """For cloud_run compute type, TTL is capped to [300, 6*3600] seconds."""
    from deployment_service.deployment.quota_broker_client import QuotaBrokerAcquireResult

    state = _make_state(n=1)
    backend = _make_backend()
    sm = _make_state_manager()

    quota_broker = MagicMock()
    quota_broker.enabled.return_value = True
    quota_broker.acquire.return_value = QuotaBrokerAcquireResult(granted=True, lease_id="lease-ttl")
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-001", shard_id="s-0", status=JobStatus.SUCCEEDED
    )

    compute_with_timeout: dict[str, object] = {**_COMPUTE, "timeout_seconds": 7200}

    with (
        patch("deployment_service.deployment._worker_rolling._config", _make_config()),
        patch("deployment_service.deployment._worker_rolling.time.sleep"),
    ):
        launch_shards_rolling(
            state=state,
            backend=backend,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=compute_with_timeout,
            rate_limiter=_make_rate_limiter(),
            state_manager=sm,
            quota_broker=quota_broker,
            compute_type="cloud_run",
            no_wait=True,
        )

    acquire_call = quota_broker.acquire.call_args
    ttl = acquire_call.kwargs.get("ttl_seconds")
    assert ttl is not None
    assert 300 <= ttl <= 6 * 3600
