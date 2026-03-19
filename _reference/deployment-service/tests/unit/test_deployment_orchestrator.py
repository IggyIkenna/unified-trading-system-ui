"""
Unit tests for deployment/orchestrator.py — DeploymentOrchestrator.

Covers:
- __init__: attributes set, StateManager created, RateLimiter initialised
- get_backend: delegates to deployment.utils.get_backend with correct args
- deploy (dry_run=True): creates state, calls display_deployment_start, returns early
- deploy (new deployment, parallel): creates state, runs parallel launch + monitor
- deploy (existing deployment_id, state found): reuses existing state
- deploy (existing deployment_id, state NOT found): creates new state
- deploy (rolling launch path): triggered when total > max_concurrent
- deploy (no_wait parallel): returns immediately after launch_shards_parallel
- resume: resets failed shards to pending, calls launch + monitor + display_completion
- resume (deployment not found): raises ValueError
- status: loads state, calls display_progress, returns state
- status (not found): raises ValueError
- cancel: cancels running/pending shards, marks cancelled, saves state
- cancel (not found): raises ValueError
- cancel with rate limiter: acquires rate limit token per shard-with-job_id
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.deployment.orchestrator import DeploymentOrchestrator
from deployment_service.deployment.state import (
    DeploymentState,
    DeploymentStatus,
    ShardState,
    ShardStatus,
)

# ---------------------------------------------------------------------------
# Shared test helpers
# ---------------------------------------------------------------------------

_PROJ = "test-project"
_REGION = "us-central1"
_SA = "svc@test-project.iam.gserviceaccount.com"
_BUCKET = "test-state-bucket"
_PREFIX = "deployments"
_IMAGE = "gcr.io/test-project/svc:latest"
_ENV_VARS: dict[str, str] = {"LOG_LEVEL": "INFO"}
_COMPUTE_CFG: dict[str, object] = {"memory": "2Gi", "cpu": 1}


def _make_orchestrator(api_rate_limit: float = 50.0) -> DeploymentOrchestrator:
    """Return a DeploymentOrchestrator with real internals — callers patch what they need."""
    return DeploymentOrchestrator(
        project_id=_PROJ,
        region=_REGION,
        service_account_email=_SA,
        state_bucket=_BUCKET,
        state_prefix=_PREFIX,
        api_rate_limit=api_rate_limit,
    )


def _basic_state(
    n_shards: int = 3,
    deployment_id: str = "svc-20260308-120000-abc123",
    service: str = "test-svc",
    compute_type: str = "cloud_run",
    status: DeploymentStatus = DeploymentStatus.PENDING,
) -> DeploymentState:
    shards = [ShardState(shard_id=f"s-{i}") for i in range(n_shards)]
    state = DeploymentState(
        deployment_id=deployment_id,
        service=service,
        compute_type=compute_type,
        status=status,
        total_shards=n_shards,
        shards=shards,
        config={
            "docker_image": _IMAGE,
            "compute_config": _COMPUTE_CFG,
            "environment_variables": _ENV_VARS,
            "job_name": None,
            "zone": None,
        },
    )
    return state


def _shards_input(n: int = 3) -> list[dict[str, object]]:
    return [{"shard_id": f"s-{i}", "dimensions": {}, "args": []} for i in range(n)]


# ---------------------------------------------------------------------------
# __init__
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_orchestrator_init_sets_attributes(mock_gsc: MagicMock) -> None:
    """DeploymentOrchestrator should store project_id, region, service_account_email."""
    mock_gsc.return_value = MagicMock()
    orch = _make_orchestrator(api_rate_limit=25.0)

    assert orch.project_id == _PROJ
    assert orch.region == _REGION
    assert orch.service_account_email == _SA
    assert orch.state_manager.bucket_name == _BUCKET
    assert orch.rate_limiter.requests_per_second == 25.0


# ---------------------------------------------------------------------------
# get_backend
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.orchestrator.get_backend")
@patch("deployment_service.deployment.state.get_storage_client")
def test_get_backend_delegates_to_util(mock_gsc: MagicMock, mock_get_backend: MagicMock) -> None:
    mock_gsc.return_value = MagicMock()
    mock_backend = MagicMock()
    mock_get_backend.return_value = mock_backend

    orch = _make_orchestrator()
    result = orch.get_backend("cloud_run", job_name="my-job", zone="us-central1-a")

    assert result is mock_backend
    mock_get_backend.assert_called_once_with(
        compute_type="cloud_run",
        project_id=_PROJ,
        region=_REGION,
        service_account_email=_SA,
        state_bucket=_BUCKET,
        state_prefix=orch.state_manager.prefix,
        job_name="my-job",
        zone="us-central1-a",
    )


# ---------------------------------------------------------------------------
# deploy — dry_run
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_deploy_dry_run_returns_state_without_backend(mock_gsc: MagicMock) -> None:
    """dry_run=True must return state without creating any backend or launching jobs."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_gsc.return_value = mock_client

    orch = _make_orchestrator()

    with (
        patch.object(orch.progress_display, "display_deployment_start") as mock_start,
        patch.object(orch.progress_display, "display_progress") as mock_progress,
        patch("deployment_service.deployment.orchestrator.get_backend") as mock_gb,
    ):
        state = orch.deploy(
            service="test-svc",
            compute_type="cloud_run",
            docker_image=_IMAGE,
            shards=_shards_input(3),
            environment_variables=_ENV_VARS,
            compute_config=_COMPUTE_CFG,
            dry_run=True,
        )

    assert state is not None
    assert state.total_shards == 3
    mock_start.assert_called_once_with(state)
    mock_progress.assert_called_once_with(state)
    mock_gb.assert_not_called()


# ---------------------------------------------------------------------------
# deploy — new deployment (parallel launch, with wait)
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.monitor_shards")
@patch("deployment_service.deployment.orchestrator.launch_shards_parallel")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_deploy_new_parallel_launch(
    mock_get_backend: MagicMock,
    mock_launch: MagicMock,
    mock_monitor: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """Standard deploy path: create state, launch parallel, monitor, display completion."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_gsc.return_value = mock_client
    mock_backend = MagicMock()
    mock_get_backend.return_value = mock_backend

    orch = _make_orchestrator()

    with (
        patch.object(orch.progress_display, "display_deployment_start"),
        patch.object(orch.progress_display, "display_completion") as mock_completion,
    ):
        state = orch.deploy(
            service="test-svc",
            compute_type="cloud_run",
            docker_image=_IMAGE,
            shards=_shards_input(5),
            environment_variables=_ENV_VARS,
            compute_config=_COMPUTE_CFG,
            dry_run=False,
            no_wait=False,
            max_concurrent=2000,
        )

    assert state is not None
    mock_launch.assert_called_once()
    mock_monitor.assert_called_once()
    mock_completion.assert_called_once_with(state)


# ---------------------------------------------------------------------------
# deploy — existing deployment_id, state found
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.monitor_shards")
@patch("deployment_service.deployment.orchestrator.launch_shards_parallel")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_deploy_existing_state_loaded(
    mock_get_backend: MagicMock,
    mock_launch: MagicMock,
    mock_monitor: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """When deployment_id is provided and state exists, it should be reloaded."""
    existing_state = _basic_state(n_shards=2)
    payload = json.dumps(existing_state.to_dict()).encode("utf-8")

    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload
    mock_gsc.return_value = mock_client
    mock_get_backend.return_value = MagicMock()

    orch = _make_orchestrator()
    with (
        patch.object(orch.progress_display, "display_deployment_start"),
        patch.object(orch.progress_display, "display_completion"),
    ):
        returned = orch.deploy(
            service="test-svc",
            compute_type="cloud_run",
            docker_image=_IMAGE,
            shards=_shards_input(2),
            environment_variables=_ENV_VARS,
            compute_config=_COMPUTE_CFG,
            deployment_id=existing_state.deployment_id,
        )

    # Config should be updated in the loaded state
    assert returned.config.get("docker_image") == _IMAGE


# ---------------------------------------------------------------------------
# deploy — existing deployment_id, state NOT found (creates new)
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.monitor_shards")
@patch("deployment_service.deployment.orchestrator.launch_shards_parallel")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_deploy_existing_id_state_not_found_creates_new(
    mock_get_backend: MagicMock,
    mock_launch: MagicMock,
    mock_monitor: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """When deployment_id provided but state not found, a new state is created."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False  # triggers load_state -> None
    mock_gsc.return_value = mock_client
    mock_get_backend.return_value = MagicMock()

    orch = _make_orchestrator()
    with (
        patch.object(orch.progress_display, "display_deployment_start"),
        patch.object(orch.progress_display, "display_completion"),
    ):
        state = orch.deploy(
            service="test-svc",
            compute_type="cloud_run",
            docker_image=_IMAGE,
            shards=_shards_input(2),
            environment_variables=_ENV_VARS,
            compute_config=_COMPUTE_CFG,
            deployment_id="explicit-custom-id",
        )

    assert state.deployment_id == "explicit-custom-id"
    assert state.total_shards == 2


# ---------------------------------------------------------------------------
# deploy — rolling launch (total_shards > max_concurrent)
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.launch_shards_rolling")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_deploy_rolling_launch_when_exceeds_max_concurrent(
    mock_get_backend: MagicMock,
    mock_rolling: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """Rolling launch path is taken when total_shards > max_concurrent."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_gsc.return_value = mock_client
    mock_get_backend.return_value = MagicMock()

    orch = _make_orchestrator()
    with (
        patch.object(orch.progress_display, "display_deployment_start"),
        patch.object(orch.progress_display, "display_completion"),
    ):
        orch.deploy(
            service="test-svc",
            compute_type="vm",
            docker_image=_IMAGE,
            shards=_shards_input(10),
            environment_variables=_ENV_VARS,
            compute_config=_COMPUTE_CFG,
            max_concurrent=5,  # 10 > 5 → rolling
        )

    mock_rolling.assert_called_once()


# ---------------------------------------------------------------------------
# deploy — no_wait parallel path
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.monitor_shards")
@patch("deployment_service.deployment.orchestrator.launch_shards_parallel")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_deploy_no_wait_skips_monitor(
    mock_get_backend: MagicMock,
    mock_launch: MagicMock,
    mock_monitor: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """no_wait=True should skip monitor_shards and return immediately."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_gsc.return_value = mock_client
    mock_get_backend.return_value = MagicMock()

    orch = _make_orchestrator()
    with (
        patch.object(orch.progress_display, "display_deployment_start"),
        patch.object(orch.progress_display, "display_progress"),
    ):
        state = orch.deploy(
            service="test-svc",
            compute_type="cloud_run",
            docker_image=_IMAGE,
            shards=_shards_input(3),
            environment_variables=_ENV_VARS,
            compute_config=_COMPUTE_CFG,
            no_wait=True,
            max_concurrent=2000,
        )

    mock_launch.assert_called_once()
    mock_monitor.assert_not_called()
    assert state is not None


# ---------------------------------------------------------------------------
# resume
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.monitor_shards")
@patch("deployment_service.deployment.orchestrator.launch_shards_parallel")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_resume_resets_failed_shards_and_relaunches(
    mock_get_backend: MagicMock,
    mock_launch: MagicMock,
    mock_monitor: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """resume must reset FAILED shards to PENDING, increment retries, and relaunch."""
    state = _basic_state(n_shards=3, status=DeploymentStatus.FAILED)
    state.shards[0].status = ShardStatus.SUCCEEDED
    state.shards[1].status = ShardStatus.FAILED
    state.shards[2].status = ShardStatus.FAILED
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload
    mock_gsc.return_value = mock_client
    mock_get_backend.return_value = MagicMock()

    orch = _make_orchestrator()
    with (
        patch.object(orch.progress_display, "display_deployment_start"),
        patch.object(orch.progress_display, "display_completion") as mock_completion,
    ):
        returned = orch.resume(state.deployment_id)

    # Failed shards should now be pending with incremented retries
    pending = [s for s in returned.shards if s.status == ShardStatus.PENDING]
    assert len(pending) == 2
    assert all(s.retries == 1 for s in pending)

    mock_launch.assert_called_once()
    mock_monitor.assert_called_once()
    mock_completion.assert_called_once_with(returned)


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_resume_deployment_not_found_raises(mock_gsc: MagicMock) -> None:
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False
    mock_gsc.return_value = mock_client

    orch = _make_orchestrator()
    with pytest.raises(ValueError, match="not found"):
        orch.resume("nonexistent-id")


# ---------------------------------------------------------------------------
# status
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_status_returns_state_and_calls_display(mock_gsc: MagicMock) -> None:
    state = _basic_state(n_shards=2)
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload
    mock_gsc.return_value = mock_client

    orch = _make_orchestrator()
    with patch.object(orch.progress_display, "display_progress") as mock_prog:
        returned = orch.status(state.deployment_id)

    assert returned.deployment_id == state.deployment_id
    mock_prog.assert_called_once_with(returned)


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_status_not_found_raises(mock_gsc: MagicMock) -> None:
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False
    mock_gsc.return_value = mock_client

    orch = _make_orchestrator()
    with pytest.raises(ValueError, match="not found"):
        orch.status("no-such-deploy")


# ---------------------------------------------------------------------------
# cancel
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_cancel_marks_shards_cancelled_and_saves(
    mock_get_backend: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """cancel must mark RUNNING and PENDING shards CANCELLED and save state."""
    state = _basic_state(n_shards=4)
    state.shards[0].status = ShardStatus.RUNNING
    state.shards[0].job_id = "j-0"
    state.shards[1].status = ShardStatus.RUNNING
    state.shards[1].job_id = "j-1"
    state.shards[2].status = ShardStatus.PENDING
    state.shards[3].status = ShardStatus.SUCCEEDED
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload
    mock_gsc.return_value = mock_client

    mock_backend = MagicMock()
    mock_backend.cancel_job.return_value = True
    mock_get_backend.return_value = mock_backend

    orch = _make_orchestrator()
    returned = orch.cancel(state.deployment_id)

    assert returned.status == DeploymentStatus.CANCELLED
    # RUNNING shards → CANCELLED, PENDING shard → CANCELLED, SUCCEEDED unchanged
    statuses = {s.shard_id: s.status for s in returned.shards}
    assert statuses["s-0"] == ShardStatus.CANCELLED
    assert statuses["s-1"] == ShardStatus.CANCELLED
    assert statuses["s-2"] == ShardStatus.CANCELLED
    assert statuses["s-3"] == ShardStatus.SUCCEEDED  # terminal, untouched

    # cancel_job called for shards with job_id
    assert mock_backend.cancel_job.call_count == 2

    # State was saved
    mock_blob.upload_from_string.assert_called()


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_cancel_not_found_raises(mock_gsc: MagicMock) -> None:
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = False
    mock_gsc.return_value = mock_client

    orch = _make_orchestrator()
    with pytest.raises(ValueError, match="not found"):
        orch.cancel("no-such-deploy")


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
@patch("deployment_service.deployment.orchestrator.get_backend")
def test_cancel_rate_limits_per_job(
    mock_get_backend: MagicMock,
    mock_gsc: MagicMock,
) -> None:
    """cancel must call rate_limiter.acquire() for each shard that has a job_id."""
    state = _basic_state(n_shards=3)
    state.shards[0].status = ShardStatus.RUNNING
    state.shards[0].job_id = "j-0"
    state.shards[1].status = ShardStatus.RUNNING
    state.shards[1].job_id = "j-1"
    state.shards[2].status = ShardStatus.PENDING  # no job_id
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload
    mock_gsc.return_value = mock_client

    mock_backend = MagicMock()
    mock_backend.cancel_job.return_value = True
    mock_get_backend.return_value = mock_backend

    orch = _make_orchestrator()
    with patch.object(orch.rate_limiter, "acquire") as mock_acquire:
        orch.cancel(state.deployment_id)

    # acquire should be called exactly for shards with job_id (2 shards)
    assert mock_acquire.call_count == 2
