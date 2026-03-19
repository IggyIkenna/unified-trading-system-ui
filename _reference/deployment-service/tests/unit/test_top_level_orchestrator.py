"""
Unit tests for deployment_service/orchestrator.py — T1Orchestrator.

Covers:
- OrchestratedJob: job_id property, is_terminal, to_dict
- OrchestrationPlan: add_job, get_jobs_by_state, get_ready_jobs (upstream cascade),
  get_jobs_by_service, total/completed/failed/skipped/running/completion_percent, to_dict
- T1Orchestrator.__init__: lazy GCS client, events only initialized once
- T1Orchestrator.gcs_client: mock mode skip, connection error, value error, runtime error
- T1Orchestrator.create_daily_plan: happy path, services filter, ValueError/FileNotFoundError/OSError
  from shard calculator, downstream dependency mapping
- T1Orchestrator.get_execution_tiers: single tier, multi-tier, library services skipped
- T1Orchestrator.propagate_failure: skip downstream recursively, non-existent job_id
- T1Orchestrator.generate_execution_report: all-pending, mixed states
- T1Orchestrator.save_plan: success, no gcs client, ConnectionError, OSError, ValueError, RuntimeError
- T1Orchestrator.load_plan: success, no gcs client, blob not found, ConnectionError, ValueError
- get_cascade_failure_tree: transitive chain
"""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.orchestrator import (
    JobState,
    OrchestratedJob,
    OrchestrationPlan,
    T1Orchestrator,
    get_cascade_failure_tree,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_DATE = "2026-03-08"
_CATEGORY = "CEFI"


def _make_job(
    service: str = "svc-a",
    date: str = _DATE,
    category: str = _CATEGORY,
    shard_id: str = "0",
    state: JobState = JobState.PENDING,
) -> OrchestratedJob:
    job = OrchestratedJob(service=service, date=date, category=category, shard_id=shard_id)
    job.state = state
    return job


def _make_plan(date: str = _DATE, category: str = _CATEGORY) -> OrchestrationPlan:
    return OrchestrationPlan(date=date, category=category)


def _make_orchestrator() -> T1Orchestrator:
    """Return T1Orchestrator with all heavy deps patched."""
    with (
        patch("deployment_service.orchestrator.setup_events"),
        patch("deployment_service.orchestrator.DependencyGraph") as mock_graph_cls,
        patch("deployment_service.orchestrator.DeploymentMonitor"),
    ):
        mock_graph = MagicMock()
        mock_graph.get_execution_order.return_value = []
        mock_graph.config = {"services": {}}
        mock_graph_cls.return_value = mock_graph
        T1Orchestrator._events_initialized = False
        orch = T1Orchestrator(config_dir="configs", project_id="test-project")
    return orch


# ---------------------------------------------------------------------------
# OrchestratedJob
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_orchestrated_job_job_id() -> None:
    job = _make_job(service="svc", date="2026-01-01", category="CEFI", shard_id="3")
    assert job.job_id == "svc:2026-01-01:CEFI:3"


@pytest.mark.unit
def test_orchestrated_job_is_terminal_pending_false() -> None:
    job = _make_job(state=JobState.PENDING)
    assert not job.is_terminal


@pytest.mark.unit
@pytest.mark.parametrize(
    "state",
    [JobState.COMPLETED, JobState.FAILED, JobState.SKIPPED],
)
def test_orchestrated_job_is_terminal_true(state: JobState) -> None:
    job = _make_job(state=state)
    assert job.is_terminal


@pytest.mark.unit
def test_orchestrated_job_to_dict_contains_expected_keys() -> None:
    job = _make_job()
    d = job.to_dict()
    expected = {
        "job_id",
        "service",
        "date",
        "category",
        "shard_id",
        "state",
        "upstream_jobs",
        "downstream_jobs",
        "started_at",
        "completed_at",
        "error_message",
        "dimensions",
    }
    assert expected.issubset(d.keys())
    assert d["state"] == "pending"


@pytest.mark.unit
def test_orchestrated_job_to_dict_started_at_none_when_not_set() -> None:
    job = _make_job()
    assert job.to_dict()["started_at"] is None


@pytest.mark.unit
def test_orchestrated_job_to_dict_started_at_iso_when_set() -> None:
    job = _make_job()
    job.started_at = datetime(2026, 3, 8, 12, 0, 0, tzinfo=UTC)
    d = job.to_dict()
    assert d["started_at"] is not None
    assert "2026-03-08" in str(d["started_at"])


# ---------------------------------------------------------------------------
# OrchestrationPlan
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_plan_add_job_and_get_by_state() -> None:
    plan = _make_plan()
    job = _make_job(state=JobState.PENDING)
    plan.add_job(job)

    pending = plan.get_jobs_by_state(JobState.PENDING)
    assert len(pending) == 1
    assert pending[0] is job


@pytest.mark.unit
def test_plan_total_jobs_counts_all() -> None:
    plan = _make_plan()
    for i in range(4):
        plan.add_job(_make_job(shard_id=str(i)))
    assert plan.total_jobs == 4


@pytest.mark.unit
def test_plan_completion_percent_zero_when_empty() -> None:
    plan = _make_plan()
    assert plan.completion_percent == 0.0


@pytest.mark.unit
def test_plan_completion_percent_all_completed() -> None:
    plan = _make_plan()
    for i in range(5):
        plan.add_job(_make_job(shard_id=str(i), state=JobState.COMPLETED))
    assert plan.completion_percent == 100.0


@pytest.mark.unit
def test_plan_completion_percent_partial() -> None:
    plan = _make_plan()
    plan.add_job(_make_job(shard_id="0", state=JobState.COMPLETED))
    plan.add_job(_make_job(shard_id="1", state=JobState.PENDING))
    plan.add_job(_make_job(shard_id="2", state=JobState.FAILED))
    plan.add_job(_make_job(shard_id="3", state=JobState.SKIPPED))
    # (1 completed + 1 failed + 1 skipped) / 4 = 75%
    assert plan.completion_percent == pytest.approx(75.0)


@pytest.mark.unit
def test_plan_get_ready_jobs_no_upstream() -> None:
    """Jobs with no upstream dependencies should become READY."""
    plan = _make_plan()
    job = _make_job(state=JobState.PENDING)
    plan.add_job(job)

    ready = plan.get_ready_jobs()
    assert len(ready) == 1
    assert ready[0].state == JobState.READY


@pytest.mark.unit
def test_plan_get_ready_jobs_skips_when_upstream_failed() -> None:
    """When upstream has FAILED, downstream should be marked SKIPPED (cascade)."""
    plan = _make_plan()
    upstream = _make_job(service="svc-a", shard_id="0", state=JobState.FAILED)
    plan.add_job(upstream)

    downstream = _make_job(service="svc-b", shard_id="0", state=JobState.PENDING)
    downstream.upstream_jobs = [upstream.job_id]
    plan.add_job(downstream)

    ready = plan.get_ready_jobs()

    # The upstream is FAILED so downstream should be SKIPPED, not READY
    assert downstream.state == JobState.SKIPPED
    assert "svc-a" in str(downstream.error_message)
    # The upstream FAILED job is not in ready list (it's not PENDING)
    ready_ids = [j.job_id for j in ready]
    assert downstream.job_id not in ready_ids


@pytest.mark.unit
def test_plan_get_ready_jobs_waits_when_upstream_running() -> None:
    """When upstream is RUNNING, downstream should remain PENDING."""
    plan = _make_plan()
    upstream = _make_job(service="svc-a", shard_id="0", state=JobState.RUNNING)
    plan.add_job(upstream)

    downstream = _make_job(service="svc-b", shard_id="0", state=JobState.PENDING)
    downstream.upstream_jobs = [upstream.job_id]
    plan.add_job(downstream)

    ready = plan.get_ready_jobs()
    assert downstream.state == JobState.PENDING
    ready_ids = [j.job_id for j in ready]
    assert downstream.job_id not in ready_ids


@pytest.mark.unit
def test_plan_get_ready_jobs_becomes_ready_when_upstream_completed() -> None:
    """When upstream is COMPLETED, downstream becomes READY."""
    plan = _make_plan()
    upstream = _make_job(service="svc-a", shard_id="0", state=JobState.COMPLETED)
    plan.add_job(upstream)

    downstream = _make_job(service="svc-b", shard_id="0", state=JobState.PENDING)
    downstream.upstream_jobs = [upstream.job_id]
    plan.add_job(downstream)

    ready = plan.get_ready_jobs()
    assert downstream.state == JobState.READY
    assert downstream.job_id in [j.job_id for j in ready]


@pytest.mark.unit
def test_plan_get_jobs_by_service() -> None:
    plan = _make_plan()
    job_a0 = _make_job(service="svc-a", shard_id="0")
    job_a1 = _make_job(service="svc-a", shard_id="1")
    job_b0 = _make_job(service="svc-b", shard_id="0")
    plan.add_job(job_a0)
    plan.add_job(job_a1)
    plan.add_job(job_b0)

    result = plan.get_jobs_by_service("svc-a")
    assert len(result) == 2
    assert all(j.service == "svc-a" for j in result)


@pytest.mark.unit
def test_plan_to_dict_structure() -> None:
    plan = _make_plan()
    plan.add_job(_make_job())
    d = plan.to_dict()
    for key in ("date", "category", "created_at", "execution_order", "total_jobs", "jobs"):
        assert key in d


# ---------------------------------------------------------------------------
# T1Orchestrator construction
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_t1_orchestrator_init_stores_config_dir() -> None:
    orch = _make_orchestrator()
    assert orch.config_dir == "configs"
    assert orch.project_id == "test-project"


@pytest.mark.unit
def test_t1_orchestrator_events_initialized_only_once() -> None:
    """setup_events should be called only on the first instance per process run."""
    T1Orchestrator._events_initialized = False
    with (
        patch("deployment_service.orchestrator.setup_events") as mock_setup,
        patch("deployment_service.orchestrator.DependencyGraph"),
        patch("deployment_service.orchestrator.DeploymentMonitor"),
    ):
        T1Orchestrator(config_dir="configs")
        T1Orchestrator(config_dir="configs")

    mock_setup.assert_called_once()


# ---------------------------------------------------------------------------
# T1Orchestrator.gcs_client
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_gcs_client_returns_none_in_mock_mode() -> None:
    orch = _make_orchestrator()
    with patch("deployment_service.orchestrator._config") as mock_cfg:
        mock_cfg.is_mock_mode.return_value = True
        client = orch.gcs_client
    assert client is None


@pytest.mark.unit
def test_gcs_client_connection_error_returns_none() -> None:
    orch = _make_orchestrator()
    with (
        patch("deployment_service.orchestrator._config") as mock_cfg,
        patch(
            "deployment_service.orchestrator.get_storage_client",
            side_effect=ConnectionError("timeout"),
        ),
        patch("deployment_service.orchestrator.log_event"),
    ):
        mock_cfg.is_mock_mode.return_value = False
        orch._gcs_client = None
        client = orch.gcs_client
    assert client is None


@pytest.mark.unit
def test_gcs_client_value_error_returns_none() -> None:
    orch = _make_orchestrator()
    with (
        patch("deployment_service.orchestrator._config") as mock_cfg,
        patch(
            "deployment_service.orchestrator.get_storage_client",
            side_effect=ValueError("bad config"),
        ),
        patch("deployment_service.orchestrator.log_event"),
    ):
        mock_cfg.is_mock_mode.return_value = False
        orch._gcs_client = None
        client = orch.gcs_client
    assert client is None


@pytest.mark.unit
def test_gcs_client_os_error_returns_none() -> None:
    orch = _make_orchestrator()
    with (
        patch("deployment_service.orchestrator._config") as mock_cfg,
        patch(
            "deployment_service.orchestrator.get_storage_client",
            side_effect=OSError("IO error"),
        ),
        patch("deployment_service.orchestrator.log_event"),
    ):
        mock_cfg.is_mock_mode.return_value = False
        orch._gcs_client = None
        client = orch.gcs_client
    assert client is None


# ---------------------------------------------------------------------------
# T1Orchestrator.create_daily_plan
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_create_daily_plan_with_no_services_returns_empty_plan() -> None:
    orch = _make_orchestrator()
    orch.graph.get_execution_order.return_value = []

    with (
        patch("deployment_service.orchestrator.log_event"),
        patch("deployment_service.orchestrator.PROCESSING_LATENCY"),
        patch("deployment_service.orchestrator.RECORDS_PROCESSED") as mock_rp,
    ):
        mock_rp.labels.return_value.inc = MagicMock()
        plan = orch.create_daily_plan(target_date=_DATE, category=_CATEGORY)

    assert plan.total_jobs == 0
    assert plan.date == _DATE
    assert plan.category == _CATEGORY


@pytest.mark.unit
def test_create_daily_plan_filters_to_requested_services() -> None:
    orch = _make_orchestrator()
    orch.graph.get_execution_order.return_value = ["svc-a", "svc-b", "svc-c"]
    orch.graph.get_upstream_services.return_value = []

    mock_shard = MagicMock()
    mock_shard.shard_index = 0
    mock_shard.dimensions = {}

    with (
        patch("deployment_service.orchestrator.ShardCalculator") as mock_calc_cls,
        patch("deployment_service.orchestrator.log_event"),
        patch("deployment_service.orchestrator.PROCESSING_LATENCY"),
        patch("deployment_service.orchestrator.RECORDS_PROCESSED") as mock_rp,
    ):
        mock_rp.labels.return_value.inc = MagicMock()
        mock_calc = MagicMock()
        mock_calc.calculate_shards.return_value = [mock_shard]
        mock_calc_cls.return_value = mock_calc

        plan = orch.create_daily_plan(target_date=_DATE, category=_CATEGORY, services=["svc-a"])

    assert plan.execution_order == ["svc-a"]
    assert plan.total_jobs == 1


@pytest.mark.unit
def test_create_daily_plan_handles_value_error_from_shard_calculator() -> None:
    orch = _make_orchestrator()
    orch.graph.get_execution_order.return_value = ["svc-bad"]
    orch.graph.get_upstream_services.return_value = []

    with (
        patch(
            "deployment_service.orchestrator.ShardCalculator",
            side_effect=ValueError("bad config"),
        ),
        patch("deployment_service.orchestrator.log_event"),
        patch("deployment_service.orchestrator.PROCESSING_LATENCY"),
        patch("deployment_service.orchestrator.RECORDS_PROCESSED") as mock_rp,
    ):
        mock_rp.labels.return_value.inc = MagicMock()
        plan = orch.create_daily_plan(target_date=_DATE, category=_CATEGORY)

    # ValueError logged, no jobs added
    assert plan.total_jobs == 0


@pytest.mark.unit
def test_create_daily_plan_handles_file_not_found_from_shard_calculator() -> None:
    orch = _make_orchestrator()
    orch.graph.get_execution_order.return_value = ["svc-missing"]
    orch.graph.get_upstream_services.return_value = []

    with (
        patch(
            "deployment_service.orchestrator.ShardCalculator",
            side_effect=FileNotFoundError("no config"),
        ),
        patch("deployment_service.orchestrator.log_event"),
        patch("deployment_service.orchestrator.PROCESSING_LATENCY"),
        patch("deployment_service.orchestrator.RECORDS_PROCESSED") as mock_rp,
    ):
        mock_rp.labels.return_value.inc = MagicMock()
        plan = orch.create_daily_plan(target_date=_DATE, category=_CATEGORY)

    assert plan.total_jobs == 0


@pytest.mark.unit
def test_create_daily_plan_os_error_adds_placeholder_job() -> None:
    """OSError from shard calculator creates a single placeholder job."""
    orch = _make_orchestrator()
    orch.graph.get_execution_order.return_value = ["svc-broken"]
    orch.graph.get_upstream_services.return_value = []

    with (
        patch(
            "deployment_service.orchestrator.ShardCalculator",
            side_effect=OSError("io error"),
        ),
        patch("deployment_service.orchestrator.log_event"),
        patch("deployment_service.orchestrator.PROCESSING_LATENCY"),
        patch("deployment_service.orchestrator.RECORDS_PROCESSED") as mock_rp,
    ):
        mock_rp.labels.return_value.inc = MagicMock()
        plan = orch.create_daily_plan(target_date=_DATE, category=_CATEGORY)

    # Placeholder job is added
    assert plan.total_jobs == 1
    placeholder = list(plan.jobs.values())[0]
    assert placeholder.service == "svc-broken"
    assert placeholder.shard_id == "0"


@pytest.mark.unit
def test_create_daily_plan_maps_downstream_dependencies() -> None:
    orch = _make_orchestrator()
    orch.graph.get_execution_order.return_value = ["svc-a", "svc-b"]
    orch.graph.get_upstream_services.side_effect = lambda svc: ["svc-a"] if svc == "svc-b" else []

    mock_shard = MagicMock()
    mock_shard.shard_index = 0
    mock_shard.dimensions = {}

    with (
        patch("deployment_service.orchestrator.ShardCalculator") as mock_calc_cls,
        patch("deployment_service.orchestrator.log_event"),
        patch("deployment_service.orchestrator.PROCESSING_LATENCY"),
        patch("deployment_service.orchestrator.RECORDS_PROCESSED") as mock_rp,
    ):
        mock_rp.labels.return_value.inc = MagicMock()
        mock_calc = MagicMock()
        mock_calc.calculate_shards.return_value = [mock_shard]
        mock_calc_cls.return_value = mock_calc

        plan = orch.create_daily_plan(target_date=_DATE, category=_CATEGORY)

    # svc-a job should have downstream_jobs pointing to svc-b job
    svc_a_jobs = plan.get_jobs_by_service("svc-a")
    svc_b_jobs = plan.get_jobs_by_service("svc-b")
    assert len(svc_a_jobs) == 1
    assert len(svc_b_jobs) == 1
    assert svc_b_jobs[0].job_id in svc_a_jobs[0].downstream_jobs


# ---------------------------------------------------------------------------
# T1Orchestrator.get_execution_tiers
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_get_execution_tiers_single_service_no_upstream() -> None:
    orch = _make_orchestrator()
    orch.graph.get_upstream_services.return_value = []
    orch.graph.config = {"services": {"svc-a": {}}}

    plan = _make_plan()
    plan.execution_order = ["svc-a"]

    tiers = orch.get_execution_tiers(plan)
    assert len(tiers) == 1
    assert "svc-a" in tiers[0]


@pytest.mark.unit
def test_get_execution_tiers_two_tier_dependency() -> None:
    orch = _make_orchestrator()
    orch.graph.get_upstream_services.side_effect = lambda svc: ["svc-a"] if svc == "svc-b" else []
    orch.graph.config = {"services": {"svc-a": {}, "svc-b": {}}}

    plan = _make_plan()
    plan.execution_order = ["svc-a", "svc-b"]

    tiers = orch.get_execution_tiers(plan)
    assert len(tiers) == 2
    assert "svc-a" in tiers[0]
    assert "svc-b" in tiers[1]


@pytest.mark.unit
def test_get_execution_tiers_library_services_skipped_in_tier_calc() -> None:
    orch = _make_orchestrator()
    orch.graph.get_upstream_services.side_effect = lambda svc: ["lib-a"] if svc == "svc-b" else []
    orch.graph.config = {
        "services": {
            "lib-a": {"is_library": True},
            "svc-b": {},
        }
    }

    plan = _make_plan()
    plan.execution_order = ["svc-b"]

    tiers = orch.get_execution_tiers(plan)
    # svc-b has lib-a as upstream, but lib-a is a library — svc-b should still be in tier 0
    assert len(tiers) == 1
    assert "svc-b" in tiers[0]


# ---------------------------------------------------------------------------
# T1Orchestrator.propagate_failure
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_propagate_failure_marks_direct_downstream_skipped() -> None:
    orch = _make_orchestrator()

    plan = _make_plan()
    upstream = _make_job(service="svc-a", shard_id="0", state=JobState.FAILED)
    downstream = _make_job(service="svc-b", shard_id="0", state=JobState.PENDING)
    upstream.downstream_jobs = [downstream.job_id]
    plan.add_job(upstream)
    plan.add_job(downstream)

    with patch("deployment_service.orchestrator.log_event"):
        skipped = orch.propagate_failure(plan, upstream.job_id)

    assert downstream.job_id in skipped
    assert downstream.state == JobState.SKIPPED
    assert "svc-a" in str(downstream.error_message)


@pytest.mark.unit
def test_propagate_failure_recurses_transitively() -> None:
    orch = _make_orchestrator()

    plan = _make_plan()
    j_a = _make_job(service="svc-a", shard_id="0", state=JobState.FAILED)
    j_b = _make_job(service="svc-b", shard_id="0", state=JobState.PENDING)
    j_c = _make_job(service="svc-c", shard_id="0", state=JobState.PENDING)
    j_a.downstream_jobs = [j_b.job_id]
    j_b.downstream_jobs = [j_c.job_id]
    plan.add_job(j_a)
    plan.add_job(j_b)
    plan.add_job(j_c)

    with patch("deployment_service.orchestrator.log_event"):
        skipped = orch.propagate_failure(plan, j_a.job_id)

    assert j_b.state == JobState.SKIPPED
    assert j_c.state == JobState.SKIPPED
    assert j_b.job_id in skipped
    assert j_c.job_id in skipped


@pytest.mark.unit
def test_propagate_failure_nonexistent_job_returns_empty() -> None:
    orch = _make_orchestrator()
    plan = _make_plan()

    with patch("deployment_service.orchestrator.log_event"):
        skipped = orch.propagate_failure(plan, "nonexistent-job-id")

    assert skipped == []


@pytest.mark.unit
def test_propagate_failure_does_not_skip_already_completed() -> None:
    orch = _make_orchestrator()

    plan = _make_plan()
    j_a = _make_job(service="svc-a", shard_id="0", state=JobState.FAILED)
    j_b = _make_job(service="svc-b", shard_id="0", state=JobState.COMPLETED)
    j_a.downstream_jobs = [j_b.job_id]
    plan.add_job(j_a)
    plan.add_job(j_b)

    with patch("deployment_service.orchestrator.log_event"):
        skipped = orch.propagate_failure(plan, j_a.job_id)

    # COMPLETED is not skippable
    assert j_b.state == JobState.COMPLETED
    assert j_b.job_id not in skipped


# ---------------------------------------------------------------------------
# T1Orchestrator.generate_execution_report
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_generate_execution_report_contains_header() -> None:
    orch = _make_orchestrator()
    orch.graph.get_upstream_services.return_value = []
    orch.graph.config = {"services": {}}

    plan = _make_plan()
    plan.execution_order = ["svc-a"]
    plan.add_job(_make_job(service="svc-a", shard_id="0", state=JobState.PENDING))

    report = orch.generate_execution_report(plan)
    assert "T+1 ORCHESTRATION PLAN" in report
    assert _DATE in report
    assert _CATEGORY in report


@pytest.mark.unit
def test_generate_execution_report_shows_summary_counts() -> None:
    orch = _make_orchestrator()
    orch.graph.get_upstream_services.return_value = []
    orch.graph.config = {"services": {}}

    plan = _make_plan()
    plan.execution_order = ["svc-a"]
    plan.add_job(_make_job(service="svc-a", shard_id="0", state=JobState.COMPLETED))
    plan.add_job(_make_job(service="svc-a", shard_id="1", state=JobState.FAILED))

    report = orch.generate_execution_report(plan)
    assert "Total jobs" in report
    assert "Completed" in report
    assert "Failed" in report


# ---------------------------------------------------------------------------
# T1Orchestrator.save_plan
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_save_plan_returns_false_when_no_gcs_client() -> None:
    orch = _make_orchestrator()
    orch._gcs_client = None

    with patch("deployment_service.orchestrator._config") as mock_cfg:
        mock_cfg.is_mock_mode.return_value = True
        result = orch.save_plan(_make_plan())

    assert result is False


@pytest.mark.unit
def test_save_plan_success() -> None:
    orch = _make_orchestrator()

    mock_blob = MagicMock()
    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_gcs = MagicMock()
    mock_gcs.bucket.return_value = mock_bucket
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        result = orch.save_plan(_make_plan())

    assert result is True
    mock_blob.upload_from_string.assert_called_once()


@pytest.mark.unit
def test_save_plan_connection_error_returns_false() -> None:
    orch = _make_orchestrator()

    mock_gcs = MagicMock()
    mock_gcs.bucket.side_effect = ConnectionError("network")
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        result = orch.save_plan(_make_plan())

    assert result is False


@pytest.mark.unit
def test_save_plan_os_error_returns_false() -> None:
    orch = _make_orchestrator()

    mock_gcs = MagicMock()
    mock_gcs.bucket.side_effect = OSError("disk")
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        result = orch.save_plan(_make_plan())

    assert result is False


@pytest.mark.unit
def test_save_plan_value_error_returns_false() -> None:
    orch = _make_orchestrator()

    mock_gcs = MagicMock()
    mock_gcs.bucket.side_effect = ValueError("bad data")
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        result = orch.save_plan(_make_plan())

    assert result is False


@pytest.mark.unit
def test_save_plan_runtime_error_returns_false() -> None:
    orch = _make_orchestrator()

    mock_gcs = MagicMock()
    mock_gcs.bucket.side_effect = RuntimeError("unexpected")
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        result = orch.save_plan(_make_plan())

    assert result is False


# ---------------------------------------------------------------------------
# T1Orchestrator.load_plan
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_load_plan_returns_none_when_no_gcs_client() -> None:
    orch = _make_orchestrator()
    orch._gcs_client = None

    with patch("deployment_service.orchestrator._config") as mock_cfg:
        mock_cfg.is_mock_mode.return_value = True
        result = orch.load_plan(_DATE, _CATEGORY)

    assert result is None


@pytest.mark.unit
def test_load_plan_returns_none_when_blob_not_found() -> None:
    orch = _make_orchestrator()

    mock_blob = MagicMock()
    mock_blob.exists.return_value = False
    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_gcs = MagicMock()
    mock_gcs.bucket.return_value = mock_bucket
    orch._gcs_client = mock_gcs

    result = orch.load_plan(_DATE, _CATEGORY)
    assert result is None


@pytest.mark.unit
def test_load_plan_success_deserializes_plan() -> None:
    import json

    orch = _make_orchestrator()

    plan_data = {
        "date": _DATE,
        "category": _CATEGORY,
        "execution_order": ["svc-a"],
        "jobs": {
            "svc-a:2026-03-08:CEFI:0": {
                "service": "svc-a",
                "date": _DATE,
                "category": _CATEGORY,
                "shard_id": "0",
                "state": "completed",
                "upstream_jobs": [],
                "downstream_jobs": [],
                "error_message": None,
                "dimensions": {},
            }
        },
    }

    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.download_as_text.return_value = json.dumps(plan_data)
    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_gcs = MagicMock()
    mock_gcs.bucket.return_value = mock_bucket
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        plan = orch.load_plan(_DATE, _CATEGORY)

    assert plan is not None
    assert plan.date == _DATE
    assert plan.category == _CATEGORY
    assert plan.total_jobs == 1


@pytest.mark.unit
def test_load_plan_connection_error_returns_none() -> None:
    orch = _make_orchestrator()

    mock_gcs = MagicMock()
    mock_gcs.bucket.side_effect = ConnectionError("network down")
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        result = orch.load_plan(_DATE, _CATEGORY)

    assert result is None


@pytest.mark.unit
def test_load_plan_value_error_returns_none() -> None:
    orch = _make_orchestrator()

    mock_blob = MagicMock()
    mock_blob.exists.return_value = True
    mock_blob.download_as_text.return_value = "{invalid_json}"
    mock_bucket = MagicMock()
    mock_bucket.blob.return_value = mock_blob
    mock_gcs = MagicMock()
    mock_gcs.bucket.return_value = mock_bucket
    orch._gcs_client = mock_gcs

    with patch("deployment_service.orchestrator.log_event"):
        result = orch.load_plan(_DATE, _CATEGORY)

    assert result is None


# ---------------------------------------------------------------------------
# get_cascade_failure_tree
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_get_cascade_failure_tree_direct_downstream() -> None:
    graph = MagicMock()
    graph.get_downstream_services.side_effect = lambda svc: ["svc-b"] if svc == "svc-a" else []

    result = get_cascade_failure_tree(graph, "svc-a")
    assert "svc-b" in result
    assert result["svc-b"] == ["svc-a"]


@pytest.mark.unit
def test_get_cascade_failure_tree_transitive_chain() -> None:
    graph = MagicMock()
    graph.get_downstream_services.side_effect = lambda svc: {
        "svc-a": ["svc-b"],
        "svc-b": ["svc-c"],
        "svc-c": [],
    }.get(svc, [])

    result = get_cascade_failure_tree(graph, "svc-a")
    assert "svc-b" in result
    assert "svc-c" in result
    assert result["svc-c"] == ["svc-a", "svc-b"]


@pytest.mark.unit
def test_get_cascade_failure_tree_no_downstream() -> None:
    graph = MagicMock()
    graph.get_downstream_services.return_value = []

    result = get_cascade_failure_tree(graph, "svc-leaf")
    assert result == {}
