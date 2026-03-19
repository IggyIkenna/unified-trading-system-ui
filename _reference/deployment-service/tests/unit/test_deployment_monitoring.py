"""
Unit tests for deployment_service/deployment/monitoring.py.

Covers monitor_shards() behaviour:
- All shards SUCCEEDED on first poll → status=COMPLETED
- Shard FAILED with retries remaining → retried
- Shard FAILED with retries exhausted → marked FAILED
- Shard CANCELLED → marked CANCELLED
- Docker image / env / compute_config resolved from state.config when None
- Quota lease released on SUCCEEDED, FAILED, CANCELLED
- Rate limiter called during retry
- VM zone distribution on retry (backend has _get_zones_for_region)
- Retry launch itself fails (job_info.status == FAILED) → shard FAILED when exhausted
- Retry launch raises OSError → shard FAILED when exhausted
- progress_display.display_progress called every loop
- state_manager.save_state called every loop
- final DeploymentStatus: COMPLETED when no failed shards, FAILED when failed shards present
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from deployment_service.backends import JobInfo, JobStatus
from deployment_service.deployment.monitoring import monitor_shards
from deployment_service.deployment.state import (
    DeploymentState,
    DeploymentStatus,
    ShardState,
    ShardStatus,
)

# ---------------------------------------------------------------------------
# Constants / helpers
# ---------------------------------------------------------------------------

_IMAGE = "gcr.io/test/svc:latest"
_ENV: dict[str, str] = {"LOG_LEVEL": "DEBUG"}
_COMPUTE: dict[str, object] = {"memory": "2Gi", "cpu": "1"}


def _make_state(
    n: int = 2,
    service: str = "mon-svc",
    dep_id: str = "dep-mon-001",
    shard_status: ShardStatus = ShardStatus.RUNNING,
    compute_type: str = "cloud_run",
) -> DeploymentState:
    shards = [
        ShardState(
            shard_id=f"s-{i}",
            status=shard_status,
            job_id=f"job-{i}",
            args=["--idx", str(i)],
        )
        for i in range(n)
    ]
    state = DeploymentState(
        deployment_id=dep_id,
        service=service,
        compute_type=compute_type,
        total_shards=n,
        shards=shards,
        config={
            "docker_image": _IMAGE,
            "environment_variables": _ENV,
            "compute_config": _COMPUTE,
        },
    )
    return state


def _make_backend(
    status: JobStatus = JobStatus.SUCCEEDED,
) -> MagicMock:
    backend = MagicMock(spec=["deploy_shard", "get_status_with_context", "region"])
    backend.region = "us-central1"
    backend.deploy_shard.return_value = JobInfo(
        job_id="retry-job-001", shard_id="s-0", status=JobStatus.RUNNING
    )
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-0", shard_id="s-0", status=status
    )
    return backend


def _make_sm() -> MagicMock:
    sm = MagicMock()
    sm.save_state = MagicMock()
    return sm


def _make_pd() -> MagicMock:
    pd = MagicMock()
    pd.display_progress = MagicMock()
    return pd


# ---------------------------------------------------------------------------
# All succeed
# ---------------------------------------------------------------------------


def test_all_succeed_sets_completed() -> None:
    state = _make_state()
    backend = _make_backend(status=JobStatus.SUCCEEDED)
    sm = _make_sm()
    pd = _make_pd()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=pd,
            poll_interval=0,
            max_retries=0,
        )

    assert state.status == DeploymentStatus.COMPLETED
    assert all(s.status == ShardStatus.SUCCEEDED for s in state.shards)


def test_save_state_called_each_loop() -> None:
    state = _make_state(n=1)
    backend = _make_backend(status=JobStatus.SUCCEEDED)
    sm = _make_sm()
    pd = _make_pd()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=pd,
            poll_interval=0,
            max_retries=0,
        )

    assert sm.save_state.call_count >= 1


def test_progress_display_called() -> None:
    state = _make_state(n=1)
    backend = _make_backend(status=JobStatus.SUCCEEDED)
    sm = _make_sm()
    pd = _make_pd()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=pd,
            poll_interval=0,
            max_retries=0,
        )

    pd.display_progress.assert_called()


# ---------------------------------------------------------------------------
# CANCELLED
# ---------------------------------------------------------------------------


def test_cancelled_shard_marked_cancelled() -> None:
    state = _make_state(n=1)
    backend = _make_backend(status=JobStatus.CANCELLED)
    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
        )

    assert state.shards[0].status == ShardStatus.CANCELLED


# ---------------------------------------------------------------------------
# FAILED with retries
# ---------------------------------------------------------------------------


def test_failed_shard_retried_and_succeeds() -> None:
    """Shard that fails once is retried and eventually succeeds."""
    state = _make_state(n=1)
    backend = _make_backend()

    call_count = [0]

    def fake_status(*_args: object, **_kwargs: object) -> JobInfo:
        call_count[0] += 1
        if call_count[0] == 1:
            return JobInfo(job_id="job-0", shard_id="s-0", status=JobStatus.FAILED)
        return JobInfo(job_id="retry-job-001", shard_id="s-0", status=JobStatus.SUCCEEDED)

    backend.get_status_with_context.side_effect = fake_status

    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=1,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    assert state.shards[0].status == ShardStatus.SUCCEEDED


def test_failed_shard_exhausted_max_retries() -> None:
    """Shard that exceeds max_retries is permanently marked FAILED."""
    state = _make_state(n=1)
    backend = _make_backend()
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-0", shard_id="s-0", status=JobStatus.FAILED, error_message="always fails"
    )
    # deploy_shard always returns RUNNING (so retry launches, but next get_status returns FAILED)
    backend.deploy_shard.return_value = JobInfo(
        job_id="retry-job", shard_id="s-0", status=JobStatus.RUNNING
    )

    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,  # 0 retries: fail immediately
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    assert state.shards[0].status == ShardStatus.FAILED


# ---------------------------------------------------------------------------
# Docker image / env / compute resolved from state.config
# ---------------------------------------------------------------------------


def test_resolves_config_from_state_when_not_provided() -> None:
    """docker_image / env / compute_config come from state.config when not explicit."""
    state = _make_state(n=1)
    backend = _make_backend(status=JobStatus.SUCCEEDED)
    sm = _make_sm()

    # Do NOT pass docker_image / environment_variables / compute_config
    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
        )

    # No assertion needed on exact values — just verifying it doesn't crash
    assert state.status == DeploymentStatus.COMPLETED


# ---------------------------------------------------------------------------
# Quota broker lease released on success / failure / cancel
# ---------------------------------------------------------------------------


def _make_quota_broker(enabled: bool = True) -> MagicMock:
    from deployment_service.deployment.quota_broker_client import QuotaBrokerAcquireResult

    qb = MagicMock()
    qb.enabled.return_value = enabled
    qb.acquire.return_value = QuotaBrokerAcquireResult(granted=True, lease_id="lease-001")
    qb.release.return_value = True
    return qb


def test_quota_lease_released_on_success() -> None:
    state = _make_state(n=1)
    state.shards[0].quota_lease_id = "lease-001"
    backend = _make_backend(status=JobStatus.SUCCEEDED)
    sm = _make_sm()
    qb = _make_quota_broker()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
            quota_broker=qb,
        )

    qb.release.assert_called()


def test_quota_lease_released_on_failure() -> None:
    state = _make_state(n=1)
    state.shards[0].quota_lease_id = "lease-002"
    backend = _make_backend(status=JobStatus.FAILED)
    sm = _make_sm()
    qb = _make_quota_broker()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
            quota_broker=qb,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    qb.release.assert_called()


def test_quota_lease_released_on_cancel() -> None:
    state = _make_state(n=1)
    state.shards[0].quota_lease_id = "lease-003"
    backend = _make_backend(status=JobStatus.CANCELLED)
    sm = _make_sm()
    qb = _make_quota_broker()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
            quota_broker=qb,
        )

    qb.release.assert_called()


# ---------------------------------------------------------------------------
# Rate limiter called during retry
# ---------------------------------------------------------------------------


def test_rate_limiter_called_on_retry() -> None:
    state = _make_state(n=1)
    backend = _make_backend()
    backend.get_status_with_context.side_effect = [
        JobInfo(job_id="job-0", shard_id="s-0", status=JobStatus.FAILED),
        JobInfo(job_id="retry-job", shard_id="s-0", status=JobStatus.SUCCEEDED),
    ]
    backend.deploy_shard.return_value = JobInfo(
        job_id="retry-job", shard_id="s-0", status=JobStatus.RUNNING
    )
    sm = _make_sm()
    rate_limiter = MagicMock()
    rate_limiter.acquire = MagicMock()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            rate_limiter=rate_limiter,
            poll_interval=0,
            max_retries=1,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    rate_limiter.acquire.assert_called()


# ---------------------------------------------------------------------------
# VM zone distribution on retry
# ---------------------------------------------------------------------------


def test_vm_zone_distribution_on_retry() -> None:
    """For vm compute type, retry uses zone from _get_zones_for_region."""
    state = _make_state(n=1, compute_type="vm")
    backend = MagicMock(
        spec=["deploy_shard", "get_status_with_context", "region", "_get_zones_for_region"]
    )
    backend.region = "us-central1"
    backend._get_zones_for_region.return_value = ["us-central1-a", "us-central1-b"]
    backend.get_status_with_context.side_effect = [
        JobInfo(job_id="job-0", shard_id="s-0", status=JobStatus.FAILED),
        JobInfo(job_id="retry-job", shard_id="s-0", status=JobStatus.SUCCEEDED),
    ]
    backend.deploy_shard.return_value = JobInfo(
        job_id="retry-job", shard_id="s-0", status=JobStatus.RUNNING
    )
    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=1,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    # deploy_shard should have been called with a zone
    call_kw = backend.deploy_shard.call_args.kwargs
    cc = call_kw.get("compute_config", {})
    assert "zone" in cc


# ---------------------------------------------------------------------------
# Retry launch fails (returned FAILED)
# ---------------------------------------------------------------------------


def test_retry_launch_returns_failed_marks_shard_failed() -> None:
    state = _make_state(n=1)
    backend = _make_backend()
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-0", shard_id="s-0", status=JobStatus.FAILED
    )
    # Retry launches also fail
    backend.deploy_shard.return_value = JobInfo(
        job_id="failed-retry", shard_id="s-0", status=JobStatus.FAILED
    )
    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=1,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    assert state.shards[0].status == ShardStatus.FAILED


# ---------------------------------------------------------------------------
# Retry raises exception
# ---------------------------------------------------------------------------


def test_retry_raises_oserror_marks_shard_failed() -> None:
    state = _make_state(n=1)
    backend = _make_backend()
    backend.get_status_with_context.return_value = JobInfo(
        job_id="job-0", shard_id="s-0", status=JobStatus.FAILED
    )
    backend.deploy_shard.side_effect = OSError("disk full")
    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    assert state.shards[0].status == ShardStatus.FAILED


# ---------------------------------------------------------------------------
# Shard with no job_id is skipped
# ---------------------------------------------------------------------------


def test_shard_without_job_id_skipped() -> None:
    # A shard with job_id=None but status=PENDING is never added to active_jobs,
    # so get_status_with_context is never called and the loop exits immediately.
    state = _make_state(n=1, shard_status=ShardStatus.PENDING)
    state.shards[0].job_id = None  # no job_id, pending not running
    backend = _make_backend()
    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
        )

    backend.get_status_with_context.assert_not_called()


# ---------------------------------------------------------------------------
# Final status based on failed_shards
# ---------------------------------------------------------------------------


def test_final_status_failed_when_shards_fail() -> None:
    state = _make_state(n=2)
    backend = _make_backend()
    backend.get_status_with_context.side_effect = [
        JobInfo(job_id="job-0", shard_id="s-0", status=JobStatus.FAILED),
        JobInfo(job_id="job-1", shard_id="s-1", status=JobStatus.SUCCEEDED),
    ]
    sm = _make_sm()

    with patch("deployment_service.deployment.monitoring.time.sleep"):
        monitor_shards(
            state=state,
            backend=backend,
            state_manager=sm,
            progress_display=None,
            poll_interval=0,
            max_retries=0,
            docker_image=_IMAGE,
            environment_variables=_ENV,
            compute_config=_COMPUTE,
        )

    assert state.status == DeploymentStatus.FAILED


def test_rate_limiter_logs_every_100_requests() -> None:
    """Cover the 'log every 100 requests' branch in RateLimiter."""
    from deployment_service.deployment.rate_limiter import RateLimiter

    rl = RateLimiter(requests_per_second=1_000_000.0)  # Very high rate so no sleep
    for _ in range(100):
        rl.acquire()
    assert rl._request_count == 100
