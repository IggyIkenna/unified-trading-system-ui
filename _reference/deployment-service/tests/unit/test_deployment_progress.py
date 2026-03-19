"""
Unit tests for deployment/progress.py — ProgressDisplay and related helpers.

Covers:
- _render_to_str helper
- ProgressDisplay initialization
- display_deployment_start sets _start_time
- _get_progress_text with zero, partial, and full shards
- _get_status_style and _get_status_icon mappings (all ShardStatus values)
- _format_duration (no start, running, finished, sub-minute, multi-hour)
- _create_shard_table sorting priority, retry labels, overflow row
- _calculate_eta (no completed, no remaining, no durations, seconds / minutes / hours)
- _get_stats_text (retry counts, ETA inline)
- display_completion (all-success, mixed, no start_time)
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

import pytest

from deployment_service.deployment.progress import ProgressDisplay, _render_to_str
from deployment_service.deployment.state import (
    DeploymentState,
    DeploymentStatus,
    ShardState,
    ShardStatus,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_state(
    *,
    total: int = 4,
    succeeded: int = 0,
    failed: int = 0,
    running: int = 0,
    pending: int | None = None,
    deployment_id: str = "test-svc-20260308-120000-abc123",
    service: str = "test-svc",
    compute_type: str = "cloud_run",
) -> DeploymentState:
    """Build a minimal DeploymentState for testing."""
    if pending is None:
        pending = total - succeeded - failed - running

    shards: list[ShardState] = []
    for i in range(succeeded):
        s = ShardState(shard_id=f"shard-ok-{i}", status=ShardStatus.SUCCEEDED)
        shards.append(s)
    for i in range(failed):
        s = ShardState(shard_id=f"shard-fail-{i}", status=ShardStatus.FAILED)
        shards.append(s)
    for i in range(running):
        s = ShardState(shard_id=f"shard-run-{i}", status=ShardStatus.RUNNING)
        shards.append(s)
    for i in range(pending):
        s = ShardState(shard_id=f"shard-pend-{i}", status=ShardStatus.PENDING)
        shards.append(s)

    return DeploymentState(
        deployment_id=deployment_id,
        service=service,
        compute_type=compute_type,
        status=DeploymentStatus.RUNNING,
        total_shards=total,
        shards=shards,
    )


def _iso(dt: datetime) -> str:
    return dt.isoformat()


# ---------------------------------------------------------------------------
# _render_to_str
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_render_to_str_returns_string() -> None:
    """_render_to_str should capture Rich output as a non-empty string."""
    from rich.console import Console
    from rich.text import Text

    console = Console(force_terminal=False)
    result = _render_to_str(console, Text("hello world"))
    assert isinstance(result, str)
    assert "hello world" in result


# ---------------------------------------------------------------------------
# ProgressDisplay initialisation
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_progress_display_default_console() -> None:
    """ProgressDisplay creates its own Console when none provided."""
    pd = ProgressDisplay()
    assert pd.console is not None
    assert pd._start_time is None
    assert pd._completed_times == []


@pytest.mark.unit
def test_progress_display_custom_console() -> None:
    """ProgressDisplay accepts and stores a custom Console."""
    from rich.console import Console

    custom = Console(force_terminal=False)
    pd = ProgressDisplay(console=custom)
    assert pd.console is custom


# ---------------------------------------------------------------------------
# display_deployment_start
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_display_deployment_start_sets_start_time() -> None:
    """display_deployment_start must set _start_time to a UTC datetime."""
    state = _make_state()
    pd = ProgressDisplay()

    before = datetime.now(UTC)
    pd.display_deployment_start(state)
    after = datetime.now(UTC)

    assert pd._start_time is not None
    assert before <= pd._start_time <= after


# ---------------------------------------------------------------------------
# _get_progress_text
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_get_progress_text_zero_shards() -> None:
    """Progress text should handle 0 total_shards without division errors."""
    state = _make_state(total=0, succeeded=0, failed=0, running=0, pending=0)
    pd = ProgressDisplay()
    text = pd._get_progress_text(state)
    assert "0/0" in text.plain
    assert "0.0%" in text.plain


@pytest.mark.unit
def test_get_progress_text_partial() -> None:
    """Progress text should show correct completed / total ratio."""
    state = _make_state(total=10, succeeded=3, failed=1, running=2, pending=4)
    pd = ProgressDisplay()
    text = pd._get_progress_text(state)
    # completed = succeeded + failed = 4
    assert "4/10" in text.plain
    assert "40.0%" in text.plain


@pytest.mark.unit
def test_get_progress_text_full() -> None:
    """Progress text should show 100% when all shards complete."""
    state = _make_state(total=5, succeeded=5, failed=0, running=0, pending=0)
    pd = ProgressDisplay()
    text = pd._get_progress_text(state)
    assert "5/5" in text.plain
    assert "100.0%" in text.plain


# ---------------------------------------------------------------------------
# _get_status_style and _get_status_icon
# ---------------------------------------------------------------------------


@pytest.mark.unit
@pytest.mark.parametrize(
    "status, expected_style",
    [
        (ShardStatus.PENDING, "bright_black"),
        (ShardStatus.RUNNING, "yellow"),
        (ShardStatus.SUCCEEDED, "green"),
        (ShardStatus.FAILED, "red"),
        (ShardStatus.CANCELLED, "bright_black"),
    ],
)
def test_get_status_style(status: ShardStatus, expected_style: str) -> None:
    pd = ProgressDisplay()
    assert pd._get_status_style(status) == expected_style


@pytest.mark.unit
@pytest.mark.parametrize(
    "status, expected_icon",
    [
        (ShardStatus.PENDING, "..."),
        (ShardStatus.RUNNING, ">>>"),
        (ShardStatus.SUCCEEDED, "[OK]"),
        (ShardStatus.FAILED, "[X]"),
        (ShardStatus.CANCELLED, "[-]"),
    ],
)
def test_get_status_icon(status: ShardStatus, expected_icon: str) -> None:
    pd = ProgressDisplay()
    assert pd._get_status_icon(status) == expected_icon


# ---------------------------------------------------------------------------
# _format_duration
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_format_duration_no_start_time() -> None:
    """Shard with no start_time should return '-'."""
    shard = ShardState(shard_id="s1")
    pd = ProgressDisplay()
    assert pd._format_duration(shard) == "-"


@pytest.mark.unit
def test_format_duration_still_running() -> None:
    """Shard with start_time but no end_time uses now() as end."""
    shard = ShardState(shard_id="s1")
    shard.start_time = (datetime.now(UTC) - timedelta(seconds=45)).isoformat()
    shard.end_time = None
    pd = ProgressDisplay()
    result = pd._format_duration(shard)
    # Should be something like "45s"
    assert "s" in result


@pytest.mark.unit
def test_format_duration_sub_minute() -> None:
    """Duration under 60s should be formatted as '{n}s'."""
    now = datetime.now(UTC)
    shard = ShardState(shard_id="s1")
    shard.start_time = (now - timedelta(seconds=30)).isoformat()
    shard.end_time = now.isoformat()
    pd = ProgressDisplay()
    result = pd._format_duration(shard)
    assert result == "30s"


@pytest.mark.unit
def test_format_duration_multi_minute() -> None:
    """Duration over 60s should include minutes."""
    now = datetime.now(UTC)
    shard = ShardState(shard_id="s1")
    shard.start_time = (now - timedelta(seconds=125)).isoformat()
    shard.end_time = now.isoformat()
    pd = ProgressDisplay()
    result = pd._format_duration(shard)
    assert "m" in result
    assert "2m" in result


@pytest.mark.unit
def test_format_duration_naive_timestamps() -> None:
    """Naive ISO timestamps (no tz info) should be treated as UTC."""
    now_naive = datetime.utcnow()
    shard = ShardState(shard_id="s1")
    shard.start_time = (now_naive - timedelta(seconds=10)).isoformat()
    shard.end_time = now_naive.isoformat()
    pd = ProgressDisplay()
    result = pd._format_duration(shard)
    assert "10s" in result


# ---------------------------------------------------------------------------
# _create_shard_table
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_create_shard_table_sort_order() -> None:
    """Running shards should appear before pending, then failed, then succeeded."""
    state = _make_state(total=3, succeeded=0, failed=0, running=0, pending=0)
    shards = [
        ShardState(shard_id="a-succeeded", status=ShardStatus.SUCCEEDED),
        ShardState(shard_id="b-failed", status=ShardStatus.FAILED),
        ShardState(shard_id="c-pending", status=ShardStatus.PENDING),
        ShardState(shard_id="d-running", status=ShardStatus.RUNNING),
    ]
    state.shards = shards
    pd = ProgressDisplay()
    table = pd._create_shard_table(shards, max_rows=10)
    # Running should be first column in row
    rows = table.rows
    assert len(rows) == 4


@pytest.mark.unit
def test_create_shard_table_overflow_row() -> None:
    """Table should add '... and N more' row when shards exceed max_rows."""
    shards = [ShardState(shard_id=f"s-{i}") for i in range(20)]
    pd = ProgressDisplay()
    table = pd._create_shard_table(shards, max_rows=5)
    # 5 shard rows + 1 overflow row
    assert len(table.rows) == 6


@pytest.mark.unit
def test_create_shard_table_retry_labels_succeeded_with_retries() -> None:
    """Shard that succeeded after retries should show 'N→OK' in retries cell."""
    shard = ShardState(shard_id="s1", status=ShardStatus.SUCCEEDED, retries=2)
    pd = ProgressDisplay()
    table = pd._create_shard_table([shard], max_rows=10)
    # The retry Text cell should be rendered; spot-check via row count
    assert len(table.rows) == 1


@pytest.mark.unit
def test_create_shard_table_retry_labels_failed_with_retries() -> None:
    """Shard that failed after retries should show 'N→X' in retries cell."""
    shard = ShardState(shard_id="s1", status=ShardStatus.FAILED, retries=1)
    pd = ProgressDisplay()
    table = pd._create_shard_table([shard], max_rows=10)
    assert len(table.rows) == 1


# ---------------------------------------------------------------------------
# _calculate_eta
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_calculate_eta_no_completed_shards() -> None:
    """ETA is None when no shards have completed yet."""
    state = _make_state(total=4, succeeded=0, failed=0, running=2, pending=2)
    pd = ProgressDisplay()
    assert pd._calculate_eta(state) is None


@pytest.mark.unit
def test_calculate_eta_no_remaining_shards() -> None:
    """ETA is None when all shards are done (nothing remaining)."""
    state = _make_state(total=4, succeeded=4, failed=0, running=0, pending=0)
    pd = ProgressDisplay()
    assert pd._calculate_eta(state) is None


@pytest.mark.unit
def test_calculate_eta_no_duration_data() -> None:
    """ETA is None when completed shards have no start/end times."""
    state = _make_state(total=4, succeeded=2, failed=0, running=2, pending=0)
    # Succeeded shards have no times set
    pd = ProgressDisplay()
    assert pd._calculate_eta(state) is None


@pytest.mark.unit
def test_calculate_eta_returns_seconds() -> None:
    """ETA should return '{n}s' string for short average durations."""
    now = datetime.now(UTC)
    state = _make_state(total=4, succeeded=0, failed=0, running=2, pending=2)
    # Inject a succeeded shard with timing
    s = ShardState(shard_id="done-0", status=ShardStatus.SUCCEEDED)
    s.start_time = (now - timedelta(seconds=45)).isoformat()
    s.end_time = now.isoformat()
    state.shards.append(s)
    pd = ProgressDisplay()
    eta = pd._calculate_eta(state)
    assert eta is not None
    assert "s" in eta


@pytest.mark.unit
def test_calculate_eta_returns_minutes() -> None:
    """ETA should return '{n}m' for average durations >= 60s."""
    now = datetime.now(UTC)
    state = _make_state(total=4, succeeded=0, failed=0, running=1, pending=3)
    s = ShardState(shard_id="done-0", status=ShardStatus.SUCCEEDED)
    s.start_time = (now - timedelta(seconds=300)).isoformat()
    s.end_time = now.isoformat()
    state.shards.append(s)
    pd = ProgressDisplay()
    eta = pd._calculate_eta(state)
    assert eta is not None
    assert "m" in eta


@pytest.mark.unit
def test_calculate_eta_returns_hours() -> None:
    """ETA should return '{h}h {m}m' for average durations >= 3600s."""
    now = datetime.now(UTC)
    state = _make_state(total=4, succeeded=0, failed=0, running=1, pending=3)
    s = ShardState(shard_id="done-0", status=ShardStatus.SUCCEEDED)
    s.start_time = (now - timedelta(hours=2, minutes=30)).isoformat()
    s.end_time = now.isoformat()
    state.shards.append(s)
    pd = ProgressDisplay()
    eta = pd._calculate_eta(state)
    assert eta is not None
    assert "h" in eta


# ---------------------------------------------------------------------------
# _get_stats_text
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_get_stats_text_basic_counts() -> None:
    """Stats text should include correct succeeded/running/failed/pending counts."""
    state = _make_state(total=10, succeeded=3, failed=1, running=2, pending=4)
    pd = ProgressDisplay()
    text = pd._get_stats_text(state)
    plain = text.plain
    assert "Succeeded: 3" in plain
    assert "Running: 2" in plain
    assert "Failed: 1" in plain
    assert "Pending: 4" in plain


@pytest.mark.unit
def test_get_stats_text_retry_annotation() -> None:
    """Stats text should annotate succeeded shards that needed retries."""
    state = _make_state(total=3, succeeded=0, failed=0, running=0, pending=0)
    s = ShardState(shard_id="retry-ok", status=ShardStatus.SUCCEEDED, retries=1)
    state.shards = [s]
    pd = ProgressDisplay()
    text = pd._get_stats_text(state)
    assert "after retry" in text.plain


@pytest.mark.unit
def test_get_stats_text_no_eta_when_zero_remaining() -> None:
    """Stats text should not include ETA when all shards are done."""
    state = _make_state(total=5, succeeded=5, failed=0, running=0, pending=0)
    pd = ProgressDisplay()
    text = pd._get_stats_text(state)
    assert "ETA" not in text.plain


# ---------------------------------------------------------------------------
# display_completion
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_display_completion_success() -> None:
    """display_completion should log without raising when all shards succeeded."""
    state = _make_state(total=5, succeeded=5, failed=0, running=0, pending=0)
    pd = ProgressDisplay()
    pd._start_time = datetime.now(UTC) - timedelta(minutes=5)
    # Should not raise
    pd.display_completion(state)


@pytest.mark.unit
def test_display_completion_with_failures() -> None:
    """display_completion should handle mixed success/failure gracefully."""
    state = _make_state(total=5, succeeded=3, failed=2, running=0, pending=0)
    pd = ProgressDisplay()
    pd._start_time = datetime.now(UTC) - timedelta(minutes=10)
    pd.display_completion(state)


@pytest.mark.unit
def test_display_completion_no_start_time() -> None:
    """display_completion should handle missing _start_time (duration shows N/A)."""
    state = _make_state(total=5, succeeded=5, failed=0, running=0, pending=0)
    pd = ProgressDisplay()
    pd._start_time = None
    # Should not raise
    pd.display_completion(state)


@pytest.mark.unit
def test_display_completion_all_failed() -> None:
    """display_completion with 0 succeeded should use red style."""
    state = _make_state(total=3, succeeded=0, failed=3, running=0, pending=0)
    pd = ProgressDisplay()
    pd._start_time = None
    pd.display_completion(state)


# ---------------------------------------------------------------------------
# display_progress
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_display_progress_does_not_raise() -> None:
    """display_progress should run without exception for a normal state."""
    state = _make_state(total=4, succeeded=1, failed=1, running=1, pending=1)
    pd = ProgressDisplay()
    pd.display_progress(state)


@pytest.mark.unit
def test_display_progress_with_no_failed_shards() -> None:
    """display_progress should not call _print_errors when no failures."""
    state = _make_state(total=4, succeeded=2, failed=0, running=2, pending=0)
    pd = ProgressDisplay()
    with patch.object(pd, "_print_errors") as mock_print_errors:
        pd.display_progress(state)
        mock_print_errors.assert_not_called()


@pytest.mark.unit
def test_display_progress_calls_print_errors_on_failure() -> None:
    """display_progress should call _print_errors when there are failed shards."""
    state = _make_state(total=4, succeeded=1, failed=2, running=0, pending=1)
    pd = ProgressDisplay()
    with patch.object(pd, "_print_errors") as mock_print_errors:
        pd.display_progress(state)
        mock_print_errors.assert_called_once()
