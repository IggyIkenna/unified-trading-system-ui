"""
Unit tests for deployment/state.py.

Covers:
- FailureCategory.from_error_message — all keyword paths + unknown fallback
- ExecutionAttempt.to_dict / from_dict round-trip
- ShardState.add_execution_attempt — attempt numbering, history append
- ShardState.complete_current_attempt — status, failure category, zone/region tracking
- ShardState.to_dict / from_dict round-trip (including execution_history)
- DeploymentState shard property filters (pending / running / succeeded / failed)
- DeploymentState.progress_percent — zero total, partial, full
- DeploymentState.to_dict / from_dict round-trip
- StateManager.generate_deployment_id — format check
- StateManager._get_state_path — path construction
- StateManager.__init__ — prefix auto-append for env suffix
- StateManager.save_state — calls get_storage_client, uploads JSON
- StateManager.save_state — retries on OSError and raises on exhaustion
- StateManager.load_state — returns None when blob not found
- StateManager.load_state — returns DeploymentState on success
- StateManager.create_deployment — creates shards, calls save_state
- StateManager.update_shard_status — not found raises ValueError
- StateManager.update_shard_status — RUNNING sets start_time, FAILED sets end_time
- StateManager.update_shard_status — all-succeeded flips deployment to COMPLETED
- StateManager.force_status — PENDING shard cannot be forced to SUCCEEDED
- StateManager.force_status — RUNNING shard with no job_id cannot be SUCCEEDED
- StateManager.force_status — CANCELLED target marks shards CANCELLED with reason
- StateManager.force_status — invalid target status raises ValueError
"""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.deployment.state import (
    DeploymentState,
    DeploymentStatus,
    ExecutionAttempt,
    FailureCategory,
    ShardState,
    ShardStatus,
    StateManager,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_BUCKET = "test-state-bucket"
_PROJECT = "test-project"
_DEPLOY_ENV = "development"  # default from DeploymentConfig


def _sm(prefix: str = "deployments") -> StateManager:
    """Return a StateManager; caller must mock get_storage_client separately."""
    return StateManager(bucket_name=_BUCKET, prefix=prefix, project_id=_PROJECT)


def _basic_state(n_shards: int = 3) -> DeploymentState:
    shards = [ShardState(shard_id=f"s-{i}") for i in range(n_shards)]
    return DeploymentState(
        deployment_id="svc-20260308-120000-abc123",
        service="svc",
        compute_type="cloud_run",
        total_shards=n_shards,
        shards=shards,
    )


def _storage_mock() -> tuple[MagicMock, MagicMock, MagicMock]:
    """Return (mock_client, mock_bucket, mock_blob)."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_blob = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    mock_bucket.blob.return_value = mock_blob
    return mock_client, mock_bucket, mock_blob


# ---------------------------------------------------------------------------
# FailureCategory.from_error_message
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.parametrize(
    "message, expected",
    [
        ("", FailureCategory.UNKNOWN),
        ("zone_resource_pool_exhausted in us-central1", FailureCategory.ZONE_EXHAUSTION),
        ("zone exhausted — no capacity", FailureCategory.ZONE_EXHAUSTION),
        ("in_use_addresses quota exceeded", FailureCategory.IP_QUOTA),
        ("ip quota reached", FailureCategory.IP_QUOTA),
        ("cpus quota exceeded in region", FailureCategory.CPU_QUOTA),
        ("ssd quota exceeded", FailureCategory.SSD_QUOTA),
        ("instance preempted by GCP", FailureCategory.PREEMPTION),
        ("request timed out after 600s", FailureCategory.TIMEOUT),
        ("timed out waiting for response", FailureCategory.TIMEOUT),
        ("permission denied for service account", FailureCategory.AUTH_ERROR),
        ("unauthorized access", FailureCategory.AUTH_ERROR),
        ("forbidden resource", FailureCategory.AUTH_ERROR),
        ("network error: connection refused", FailureCategory.NETWORK_ERROR),
        ("connection reset by peer", FailureCategory.NETWORK_ERROR),
        ("container exited with code 1", FailureCategory.APPLICATION_ERROR),
    ],
)
def test_failure_category_from_error_message(message: str, expected: FailureCategory) -> None:
    assert FailureCategory.from_error_message(message) == expected


# ---------------------------------------------------------------------------
# ExecutionAttempt round-trip
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_execution_attempt_to_dict_from_dict_roundtrip() -> None:
    ea = ExecutionAttempt(
        attempt=2,
        zone="us-central1-a",
        region="us-central1",
        started_at="2026-03-08T12:00:00+00:00",
        ended_at="2026-03-08T12:05:00+00:00",
        status="succeeded",
        failure_reason=None,
        failure_category=None,
        job_id="job-xyz",
    )
    restored = ExecutionAttempt.from_dict(ea.to_dict())
    assert restored.attempt == ea.attempt
    assert restored.zone == ea.zone
    assert restored.region == ea.region
    assert restored.status == ea.status
    assert restored.job_id == ea.job_id


# ---------------------------------------------------------------------------
# ShardState.add_execution_attempt
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_add_execution_attempt_first() -> None:
    shard = ShardState(shard_id="s1")
    attempt = shard.add_execution_attempt(zone="us-central1-a", region="us-central1", job_id="j1")
    assert attempt.attempt == 1
    assert attempt.zone == "us-central1-a"
    assert attempt.job_id == "j1"
    assert attempt.status == "running"
    assert len(shard.execution_history) == 1


@pytest.mark.unit
def test_add_execution_attempt_increments_number() -> None:
    shard = ShardState(shard_id="s1")
    shard.add_execution_attempt(zone="us-central1-a")
    second = shard.add_execution_attempt(zone="us-east1-b")
    assert second.attempt == 2
    assert len(shard.execution_history) == 2


# ---------------------------------------------------------------------------
# ShardState.complete_current_attempt
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_complete_current_attempt_no_history() -> None:
    """complete_current_attempt should be a no-op if history is empty."""
    shard = ShardState(shard_id="s1")
    # Should not raise
    shard.complete_current_attempt(status="succeeded")


@pytest.mark.unit
def test_complete_current_attempt_success_sets_final_zone() -> None:
    shard = ShardState(shard_id="s1")
    shard.add_execution_attempt(zone="us-central1-a", region="us-central1")
    shard.complete_current_attempt(status="succeeded")
    assert shard.final_zone == "us-central1-a"
    assert shard.final_region == "us-central1"


@pytest.mark.unit
def test_complete_current_attempt_failure_sets_category() -> None:
    shard = ShardState(shard_id="s1")
    shard.add_execution_attempt(zone="us-central1-a")
    shard.complete_current_attempt(status="failed", failure_reason="zone_resource_pool_exhausted")
    assert shard.failure_category == FailureCategory.ZONE_EXHAUSTION.value


@pytest.mark.unit
def test_complete_current_attempt_zone_switch_incremented() -> None:
    shard = ShardState(shard_id="s1")
    shard.add_execution_attempt(zone="us-central1-a", region="us-central1")
    shard.complete_current_attempt(status="failed", failure_reason="zone exhausted")
    shard.add_execution_attempt(zone="us-east1-b", region="us-east1")
    shard.complete_current_attempt(status="succeeded")
    assert shard.zone_switches == 1
    assert shard.region_switches == 1


# ---------------------------------------------------------------------------
# ShardState round-trip
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_shard_state_to_dict_from_dict_roundtrip() -> None:
    shard = ShardState(
        shard_id="s1",
        status=ShardStatus.FAILED,
        job_id="job-1",
        start_time="2026-03-08T12:00:00+00:00",
        end_time="2026-03-08T13:00:00+00:00",
        error_message="something went wrong",
        retries=2,
        dimensions={"category": "CEFI", "venue": "BINANCE-SPOT"},
        args=["--start-date", "2026-01-01"],
        failure_category="timeout",
    )
    restored = ShardState.from_dict(shard.to_dict())
    assert restored.shard_id == shard.shard_id
    assert restored.status == shard.status
    assert restored.job_id == shard.job_id
    assert restored.error_message == shard.error_message
    assert restored.retries == shard.retries
    assert restored.dimensions == shard.dimensions
    assert restored.args == shard.args
    assert restored.failure_category == shard.failure_category


# ---------------------------------------------------------------------------
# DeploymentState properties
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_deployment_state_pending_shards_filter() -> None:
    state = _basic_state(n_shards=4)
    state.shards[0].status = ShardStatus.RUNNING
    state.shards[1].status = ShardStatus.SUCCEEDED
    pending = state.pending_shards
    assert len(pending) == 2
    assert all(s.status == ShardStatus.PENDING for s in pending)


@pytest.mark.unit
def test_deployment_state_running_shards_filter() -> None:
    state = _basic_state(n_shards=4)
    state.shards[0].status = ShardStatus.RUNNING
    state.shards[2].status = ShardStatus.RUNNING
    assert len(state.running_shards) == 2


@pytest.mark.unit
def test_deployment_state_succeeded_shards_filter() -> None:
    state = _basic_state(n_shards=3)
    state.shards[0].status = ShardStatus.SUCCEEDED
    assert len(state.succeeded_shards) == 1


@pytest.mark.unit
def test_deployment_state_failed_shards_filter() -> None:
    state = _basic_state(n_shards=3)
    state.shards[1].status = ShardStatus.FAILED
    assert len(state.failed_shards) == 1


@pytest.mark.unit
def test_deployment_state_progress_percent_zero_total() -> None:
    state = _basic_state(n_shards=0)
    state.total_shards = 0
    assert state.progress_percent == 0.0


@pytest.mark.unit
def test_deployment_state_progress_percent_partial() -> None:
    state = _basic_state(n_shards=4)
    state.shards[0].status = ShardStatus.SUCCEEDED
    state.shards[1].status = ShardStatus.FAILED
    assert state.progress_percent == pytest.approx(50.0)


@pytest.mark.unit
def test_deployment_state_progress_percent_full() -> None:
    state = _basic_state(n_shards=2)
    for s in state.shards:
        s.status = ShardStatus.SUCCEEDED
    assert state.progress_percent == pytest.approx(100.0)


# ---------------------------------------------------------------------------
# DeploymentState round-trip
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_deployment_state_to_dict_from_dict_roundtrip() -> None:
    state = _basic_state(n_shards=2)
    state.shards[0].status = ShardStatus.SUCCEEDED
    state.shards[1].status = ShardStatus.FAILED
    state.tag = "my-tag"
    state.deployment_mode = "batch"

    restored = DeploymentState.from_dict(state.to_dict())
    assert restored.deployment_id == state.deployment_id
    assert restored.service == state.service
    assert restored.compute_type == state.compute_type
    assert restored.status == state.status
    assert restored.total_shards == state.total_shards
    assert restored.tag == state.tag
    assert len(restored.shards) == 2
    assert restored.shards[0].status == ShardStatus.SUCCEEDED
    assert restored.shards[1].status == ShardStatus.FAILED


# ---------------------------------------------------------------------------
# StateManager.__init__ — prefix env suffix auto-append
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_state_manager_prefix_auto_appends_env() -> None:
    sm = _sm(prefix="deployments")
    # The DEPLOYMENT_ENV is 'development' by default (from DeploymentConfig)
    assert sm.prefix.endswith(f".{sm.prefix.split('.')[-1]}")
    assert "deployments" in sm.prefix


@pytest.mark.unit
def test_state_manager_prefix_no_double_append() -> None:
    """If the prefix already ends with .{env}, it should not be appended again."""
    from deployment_service.deployment.state import DEPLOYMENT_ENV

    sm = _sm(prefix=f"deployments.{DEPLOYMENT_ENV}")
    assert sm.prefix == f"deployments.{DEPLOYMENT_ENV}"


# ---------------------------------------------------------------------------
# StateManager.generate_deployment_id
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_generate_deployment_id_format() -> None:
    sm = _sm()
    dep_id = sm.generate_deployment_id("my-service")
    parts = dep_id.split("-")
    # my-service-YYYYMMDD-HHMMSS-<6hex>
    assert dep_id.startswith("my-service-")
    # At minimum 4 dash-separated parts when service has no dashes
    assert len(parts) >= 4


@pytest.mark.unit
def test_generate_deployment_id_unique() -> None:
    sm = _sm()
    ids = {sm.generate_deployment_id("svc") for _ in range(10)}
    # All should be unique (the uuid4 suffix guarantees this)
    assert len(ids) == 10


# ---------------------------------------------------------------------------
# StateManager._get_state_path
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_get_state_path_construction() -> None:
    from deployment_service.deployment.state import DEPLOYMENT_ENV

    sm = StateManager(bucket_name=_BUCKET, prefix="deployments", project_id=_PROJECT)
    path = sm._get_state_path("abc-123")
    assert path == f"deployments.{DEPLOYMENT_ENV}/abc-123/state.json"


# ---------------------------------------------------------------------------
# StateManager.save_state
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_save_state_uploads_json(mock_get_storage: MagicMock) -> None:
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client

    sm = _sm()
    state = _basic_state(n_shards=1)
    sm.save_state(state)

    mock_get_storage.assert_called_once_with(project_id=_PROJECT)
    mock_blob.upload_from_string.assert_called_once()
    # The first positional arg should be valid JSON
    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    parsed = json.loads(upload_arg)
    assert parsed["deployment_id"] == state.deployment_id


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_save_state_retries_on_os_error(mock_get_storage: MagicMock) -> None:
    """save_state should retry up to retry_on_conflict times and succeed on last try."""
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    # Fail twice, succeed on third
    mock_blob.upload_from_string.side_effect = [OSError("transient"), OSError("transient"), None]

    sm = _sm()
    state = _basic_state(n_shards=1)
    # Should not raise — succeeds on 3rd attempt
    with patch("deployment_service.deployment.state.time.sleep"):
        sm.save_state(state, retry_on_conflict=3)

    assert mock_blob.upload_from_string.call_count == 3


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_save_state_raises_after_exhausting_retries(mock_get_storage: MagicMock) -> None:
    """save_state should raise after all retries are exhausted."""
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.upload_from_string.side_effect = OSError("always fails")

    sm = _sm()
    state = _basic_state(n_shards=1)
    with patch("deployment_service.deployment.state.time.sleep"), pytest.raises(OSError):
        sm.save_state(state, retry_on_conflict=2)


# ---------------------------------------------------------------------------
# StateManager.load_state
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_load_state_returns_none_when_blob_not_found(mock_get_storage: MagicMock) -> None:
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = False

    sm = _sm()
    result = sm.load_state("nonexistent-deploy")
    assert result is None


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_load_state_returns_deployment_state(mock_get_storage: MagicMock) -> None:
    state = _basic_state(n_shards=2)
    state.shards[0].status = ShardStatus.SUCCEEDED
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    loaded = sm.load_state(state.deployment_id)
    assert loaded is not None
    assert loaded.deployment_id == state.deployment_id
    assert loaded.shards[0].status == ShardStatus.SUCCEEDED


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_load_state_returns_none_on_invalid_json(mock_get_storage: MagicMock) -> None:
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = b"not-valid-json"

    sm = _sm()
    result = sm.load_state("some-deploy")
    assert result is None


# ---------------------------------------------------------------------------
# StateManager.create_deployment
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_create_deployment_returns_state_with_shards(mock_get_storage: MagicMock) -> None:
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client

    sm = _sm()
    shards_input = [
        {"shard_id": "s-0", "dimensions": {"category": "CEFI"}, "args": ["--cat", "CEFI"]},
        {"shard_id": "s-1", "dimensions": {"category": "TRADFI"}, "args": ["--cat", "TRADFI"]},
    ]
    state = sm.create_deployment(
        service="test-svc",
        compute_type="cloud_run",
        shards=shards_input,
        start_date="2026-01-01",
        end_date="2026-03-01",
        config={"extra": "value"},
        tag="integration-test",
    )

    assert state.service == "test-svc"
    assert state.total_shards == 2
    assert len(state.shards) == 2
    assert state.shards[0].shard_id == "s-0"
    assert state.shards[0].dimensions == {"category": "CEFI"}
    assert state.tag == "integration-test"
    # save_state was called
    mock_blob.upload_from_string.assert_called_once()


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_create_deployment_with_explicit_id(mock_get_storage: MagicMock) -> None:
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client

    sm = _sm()
    state = sm.create_deployment(
        service="test-svc",
        compute_type="vm",
        shards=[{"shard_id": "s-0"}],
        deployment_id="explicit-id-abc",
    )
    assert state.deployment_id == "explicit-id-abc"


# ---------------------------------------------------------------------------
# StateManager.update_shard_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_update_shard_status_not_found_raises(mock_get_storage: MagicMock) -> None:
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = False  # load_state returns None

    sm = _sm()
    with pytest.raises(ValueError, match="not found"):
        sm.update_shard_status("missing-deploy", "s-0", ShardStatus.RUNNING)


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_update_shard_status_running_sets_start_time(mock_get_storage: MagicMock) -> None:
    state = _basic_state(n_shards=2)
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    sm.update_shard_status(state.deployment_id, "s-0", ShardStatus.RUNNING, job_id="j-99")

    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    saved = json.loads(upload_arg)
    s0 = next(s for s in saved["shards"] if s["shard_id"] == "s-0")
    assert s0["status"] == "running"
    assert s0["start_time"] is not None
    assert s0["job_id"] == "j-99"


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_update_shard_status_failed_sets_end_time_and_error(mock_get_storage: MagicMock) -> None:
    state = _basic_state(n_shards=2)
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    sm.update_shard_status(
        state.deployment_id,
        "s-1",
        ShardStatus.FAILED,
        error_message="OOM killed",
    )

    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    saved = json.loads(upload_arg)
    s1 = next(s for s in saved["shards"] if s["shard_id"] == "s-1")
    assert s1["status"] == "failed"
    assert s1["end_time"] is not None
    assert s1["error_message"] == "OOM killed"


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_update_shard_status_all_succeeded_completes_deployment(
    mock_get_storage: MagicMock,
) -> None:
    state = _basic_state(n_shards=2)
    state.shards[0].status = ShardStatus.SUCCEEDED
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    sm.update_shard_status(state.deployment_id, "s-1", ShardStatus.SUCCEEDED)

    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    saved = json.loads(upload_arg)
    assert saved["status"] == DeploymentStatus.COMPLETED.value


# ---------------------------------------------------------------------------
# StateManager.force_status
# ---------------------------------------------------------------------------


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_force_status_not_found_raises(mock_get_storage: MagicMock) -> None:
    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = False

    sm = _sm()
    with pytest.raises(ValueError, match="not found"):
        sm.force_status("missing", DeploymentStatus.CANCELLED)


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_force_status_invalid_target_status_raises(mock_get_storage: MagicMock) -> None:
    """force_status with a non-terminal target (e.g., RUNNING) should raise ValueError."""
    state = _basic_state(n_shards=1)
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    with pytest.raises(ValueError, match="terminal status"):
        sm.force_status(state.deployment_id, DeploymentStatus.RUNNING)


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_force_status_pending_shard_cannot_become_succeeded(
    mock_get_storage: MagicMock,
) -> None:
    """PENDING shards must never be marked SUCCEEDED — they never ran."""
    state = _basic_state(n_shards=2)
    # Both shards are PENDING
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    sm.force_status(state.deployment_id, DeploymentStatus.COMPLETED)

    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    saved = json.loads(upload_arg)
    for s in saved["shards"]:
        # PENDING shards should be marked FAILED, not SUCCEEDED
        assert s["status"] == ShardStatus.FAILED.value


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_force_status_running_without_job_id_becomes_failed(
    mock_get_storage: MagicMock,
) -> None:
    """RUNNING shard with no job_id cannot be reliably marked as SUCCEEDED."""
    state = _basic_state(n_shards=1)
    state.shards[0].status = ShardStatus.RUNNING
    state.shards[0].job_id = None
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    sm.force_status(state.deployment_id, DeploymentStatus.COMPLETED)

    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    saved = json.loads(upload_arg)
    assert saved["shards"][0]["status"] == ShardStatus.FAILED.value


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_force_status_cancelled_marks_shards_with_reason(mock_get_storage: MagicMock) -> None:
    state = _basic_state(n_shards=3)
    state.shards[0].status = ShardStatus.RUNNING
    state.shards[0].job_id = "j-1"
    # shards[1] and [2] remain PENDING
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    sm.force_status(
        state.deployment_id,
        DeploymentStatus.CANCELLED,
        reason="Manual cancel from ops",
    )

    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    saved = json.loads(upload_arg)
    assert saved["status"] == DeploymentStatus.CANCELLED.value
    for s in saved["shards"]:
        assert s["status"] == ShardStatus.CANCELLED.value
        assert s["end_time"] is not None


@pytest.mark.unit
@patch("deployment_service.deployment.state.get_storage_client")
def test_force_status_already_terminal_shards_unchanged(mock_get_storage: MagicMock) -> None:
    """Shards already in SUCCEEDED/FAILED/CANCELLED should not be updated."""
    state = _basic_state(n_shards=3)
    state.shards[0].status = ShardStatus.SUCCEEDED
    state.shards[1].status = ShardStatus.FAILED
    state.shards[2].status = ShardStatus.PENDING  # only this one changes
    payload = json.dumps(state.to_dict()).encode("utf-8")

    mock_client, mock_bucket, mock_blob = _storage_mock()
    mock_get_storage.return_value = mock_client
    mock_blob.exists.return_value = True
    mock_blob.download_as_string.return_value = payload

    sm = _sm()
    sm.force_status(state.deployment_id, DeploymentStatus.CANCELLED)

    upload_arg: str = mock_blob.upload_from_string.call_args[0][0]
    saved = json.loads(upload_arg)
    # SUCCEEDED and FAILED shards should remain unchanged
    assert saved["shards"][0]["status"] == ShardStatus.SUCCEEDED.value
    assert saved["shards"][1]["status"] == ShardStatus.FAILED.value
    # PENDING shard gets cancelled
    assert saved["shards"][2]["status"] == ShardStatus.CANCELLED.value
