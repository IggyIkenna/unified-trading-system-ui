"""
Unit tests for deployment_service.advisor module.

Covers:
- _parse_gib: all valid suffixes, None/empty input, unparseable values
- AdvisorRecommendation: dataclass creation, to_dict serialization
- recommend_deployment_settings: all logic branches
  - date granularity suggestions (no request, >20k shards, 5k–20k, <=5k)
  - concurrency: cloud_run vs vm, explicit request, total_shards bounds
  - Cloud Run warnings: execution cap, skip_venue_sharding, memory limit, CPU limit
  - Cloud Run note appended
  - max_workers note
  - skip_feature_group_sharding note
  - compute_type normalisation / default fallback
"""

from __future__ import annotations

import logging

import pytest

from deployment_service.advisor import (
    CLOUD_RUN_DEFAULT_RUN_JOB_QUOTA_PER_MIN,
    CLOUD_RUN_MAX_CPU,
    CLOUD_RUN_MAX_MEMORY_GIB,
    CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION,
    CLOUD_RUN_SAFE_MAX_CONCURRENT,
    AdvisorRecommendation,
    _parse_gib,
    recommend_deployment_settings,
)

# ---------------------------------------------------------------------------
# _parse_gib
# ---------------------------------------------------------------------------


class TestParseGib:
    """Tests for the internal _parse_gib helper."""

    @pytest.mark.unit
    def test_none_returns_none(self) -> None:
        assert _parse_gib(None) is None

    @pytest.mark.unit
    def test_empty_string_returns_none(self) -> None:
        assert _parse_gib("") is None

    @pytest.mark.unit
    def test_gi_suffix_integer(self) -> None:
        assert _parse_gib("8Gi") == 8

    @pytest.mark.unit
    def test_gi_suffix_lowercase(self) -> None:
        assert _parse_gib("16gi") == 16

    @pytest.mark.unit
    def test_gi_suffix_with_decimal(self) -> None:
        # int(float("4.9")) == 4 — truncation, not rounding
        assert _parse_gib("4.9Gi") == 4

    @pytest.mark.unit
    def test_gib_suffix(self) -> None:
        assert _parse_gib("32GiB") == 32

    @pytest.mark.unit
    def test_gib_suffix_lowercase(self) -> None:
        assert _parse_gib("2gib") == 2

    @pytest.mark.unit
    def test_unknown_suffix_returns_none(self) -> None:
        # "2GB" has no recognised suffix → None
        assert _parse_gib("2GB") is None

    @pytest.mark.unit
    def test_plain_number_returns_none(self) -> None:
        assert _parse_gib("8") is None

    @pytest.mark.unit
    def test_invalid_gi_value_returns_none(self, caplog: pytest.LogCaptureFixture) -> None:
        with caplog.at_level(logging.WARNING, logger="deployment_service.advisor"):
            result = _parse_gib("notanumberGi")
        assert result is None
        assert "Could not parse memory value" in caplog.text

    @pytest.mark.unit
    def test_invalid_gib_value_returns_none(self, caplog: pytest.LogCaptureFixture) -> None:
        with caplog.at_level(logging.WARNING, logger="deployment_service.advisor"):
            result = _parse_gib("??GiB")
        assert result is None
        assert "Could not parse memory value" in caplog.text

    @pytest.mark.unit
    def test_whitespace_stripped(self) -> None:
        assert _parse_gib("  4Gi  ") == 4

    @pytest.mark.unit
    def test_max_cloud_run_limit(self) -> None:
        assert _parse_gib("32Gi") == CLOUD_RUN_MAX_MEMORY_GIB


# ---------------------------------------------------------------------------
# AdvisorRecommendation
# ---------------------------------------------------------------------------


class TestAdvisorRecommendation:
    """Tests for the AdvisorRecommendation dataclass."""

    @pytest.mark.unit
    def test_defaults(self) -> None:
        rec = AdvisorRecommendation()
        assert rec.recommended_date_granularity is None
        assert rec.recommended_max_concurrent is None
        assert rec.warnings == []
        assert rec.notes == []

    @pytest.mark.unit
    def test_to_dict_keys(self) -> None:
        rec = AdvisorRecommendation(
            recommended_date_granularity="weekly",
            recommended_max_concurrent=500,
            warnings=["w1"],
            notes=["n1"],
        )
        d = rec.to_dict()
        assert d["recommended_date_granularity"] == "weekly"
        assert d["recommended_max_concurrent"] == 500
        assert d["warnings"] == ["w1"]
        assert d["notes"] == ["n1"]

    @pytest.mark.unit
    def test_to_dict_returns_dict(self) -> None:
        rec = AdvisorRecommendation()
        assert isinstance(rec.to_dict(), dict)

    @pytest.mark.unit
    def test_warnings_list_is_independent_per_instance(self) -> None:
        rec_a = AdvisorRecommendation()
        rec_b = AdvisorRecommendation()
        rec_a.warnings.append("x")
        assert rec_b.warnings == []


# ---------------------------------------------------------------------------
# recommend_deployment_settings — helper
# ---------------------------------------------------------------------------


def _call(
    *,
    service: str = "test-svc",
    compute_type: str = "vm",
    total_shards: int = 100,
    requested_date_granularity: str | None = None,
    requested_max_concurrent: int | None = None,
    max_workers: int | None = None,
    skip_venue_sharding: bool = False,
    skip_feature_group_sharding: bool = False,
    compute_config: dict[str, object] | None = None,
) -> dict[str, object]:
    """Thin wrapper so tests only need to supply overrides."""
    return recommend_deployment_settings(
        service=service,
        compute_type=compute_type,
        total_shards=total_shards,
        requested_date_granularity=requested_date_granularity,
        requested_max_concurrent=requested_max_concurrent,
        max_workers=max_workers,
        skip_venue_sharding=skip_venue_sharding,
        skip_feature_group_sharding=skip_feature_group_sharding,
        compute_config=compute_config,
    )


# ---------------------------------------------------------------------------
# recommend_deployment_settings — date granularity branch
# ---------------------------------------------------------------------------


class TestRecommendDateGranularity:
    """Tests for the date granularity recommendation logic."""

    @pytest.mark.unit
    def test_no_granularity_suggestion_for_small_shards(self) -> None:
        result = _call(total_shards=1000)
        assert result["recommended_date_granularity"] is None

    @pytest.mark.unit
    def test_no_granularity_suggestion_at_5000_boundary(self) -> None:
        result = _call(total_shards=5000)
        assert result["recommended_date_granularity"] is None

    @pytest.mark.unit
    def test_weekly_suggestion_just_above_5000(self) -> None:
        result = _call(total_shards=5001)
        assert result["recommended_date_granularity"] == "weekly"

    @pytest.mark.unit
    def test_weekly_suggestion_up_to_20000(self) -> None:
        result = _call(total_shards=20000)
        assert result["recommended_date_granularity"] == "weekly"

    @pytest.mark.unit
    def test_monthly_suggestion_just_above_20000(self) -> None:
        result = _call(total_shards=20001)
        assert result["recommended_date_granularity"] == "monthly"

    @pytest.mark.unit
    def test_monthly_suggestion_for_very_large_shards(self) -> None:
        result = _call(total_shards=500_000)
        assert result["recommended_date_granularity"] == "monthly"

    @pytest.mark.unit
    def test_granularity_not_overridden_when_caller_supplies_one(self) -> None:
        # Caller already provided a granularity — advisor must not override it
        result = _call(total_shards=30000, requested_date_granularity="daily")
        assert result["recommended_date_granularity"] is None

    @pytest.mark.unit
    def test_granularity_not_overridden_even_for_small_shards(self) -> None:
        result = _call(total_shards=50, requested_date_granularity="weekly")
        assert result["recommended_date_granularity"] is None


# ---------------------------------------------------------------------------
# recommend_deployment_settings — concurrency branch
# ---------------------------------------------------------------------------


class TestRecommendConcurrency:
    """Tests for the max_concurrent recommendation logic."""

    @pytest.mark.unit
    def test_explicit_requested_concurrent_respected(self) -> None:
        result = _call(requested_max_concurrent=42)
        assert result["recommended_max_concurrent"] == 42

    @pytest.mark.unit
    def test_vm_default_concurrent_is_total_shards_when_small(self) -> None:
        result = _call(compute_type="vm", total_shards=500)
        assert result["recommended_max_concurrent"] == 500

    @pytest.mark.unit
    def test_vm_concurrent_capped_at_2000(self) -> None:
        result = _call(compute_type="vm", total_shards=9999)
        assert result["recommended_max_concurrent"] == 2000

    @pytest.mark.unit
    def test_vm_concurrent_minimum_is_1(self) -> None:
        result = _call(compute_type="vm", total_shards=0)
        assert result["recommended_max_concurrent"] == 1

    @pytest.mark.unit
    def test_cloud_run_concurrent_is_total_when_small(self) -> None:
        result = _call(compute_type="cloud_run", total_shards=300)
        assert result["recommended_max_concurrent"] == 300

    @pytest.mark.unit
    def test_cloud_run_concurrent_capped_at_safe_max(self) -> None:
        result = _call(compute_type="cloud_run", total_shards=9999)
        assert result["recommended_max_concurrent"] == CLOUD_RUN_SAFE_MAX_CONCURRENT

    @pytest.mark.unit
    def test_cloud_run_concurrent_minimum_is_1(self) -> None:
        result = _call(compute_type="cloud_run", total_shards=0)
        assert result["recommended_max_concurrent"] == 1

    @pytest.mark.unit
    def test_explicit_concurrent_overrides_cloud_run_cap(self) -> None:
        result = _call(
            compute_type="cloud_run",
            total_shards=9999,
            requested_max_concurrent=100,
        )
        assert result["recommended_max_concurrent"] == 100

    @pytest.mark.unit
    def test_compute_type_normalised_to_lowercase(self) -> None:
        # "VM" should be treated the same as "vm"
        result = _call(compute_type="VM", total_shards=500)
        assert result["recommended_max_concurrent"] == 500

    @pytest.mark.unit
    def test_unknown_compute_type_falls_back_to_vm_path(self) -> None:
        # Anything that is not "cloud_run" goes through the VM branch (default_max_concurrent)
        result = _call(compute_type="kubernetes", total_shards=9999)
        assert result["recommended_max_concurrent"] == 2000


# ---------------------------------------------------------------------------
# recommend_deployment_settings — Cloud Run warnings
# ---------------------------------------------------------------------------


class TestCloudRunWarnings:
    """Tests for Cloud Run-specific warnings."""

    @pytest.mark.unit
    def test_no_cloud_run_warnings_for_vm(self) -> None:
        result = _call(
            compute_type="vm",
            total_shards=CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION + 1,
        )
        assert result["warnings"] == []

    @pytest.mark.unit
    def test_execution_cap_warning_when_shards_exceed_hard_cap(self) -> None:
        result = _call(
            compute_type="cloud_run",
            total_shards=CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION + 1,
        )
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert any("hard cap" in w for w in warnings)
        assert any(str(CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION) in w for w in warnings)

    @pytest.mark.unit
    def test_no_execution_cap_warning_at_exact_limit(self) -> None:
        result = _call(
            compute_type="cloud_run",
            total_shards=CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION,
        )
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert not any("hard cap" in w for w in warnings)

    @pytest.mark.unit
    def test_skip_venue_sharding_warning_for_cloud_run(self) -> None:
        result = _call(compute_type="cloud_run", skip_venue_sharding=True)
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert any("skip_venue_sharding" in w for w in warnings)

    @pytest.mark.unit
    def test_skip_venue_sharding_no_warning_for_vm(self) -> None:
        result = _call(compute_type="vm", skip_venue_sharding=True)
        assert result["warnings"] == []

    @pytest.mark.unit
    def test_memory_over_limit_warning(self) -> None:
        over_limit = f"{CLOUD_RUN_MAX_MEMORY_GIB + 1}Gi"
        result = _call(
            compute_type="cloud_run",
            compute_config={"memory": over_limit, "cpu": 1},
        )
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert any("max memory" in w for w in warnings)

    @pytest.mark.unit
    def test_memory_at_limit_no_warning(self) -> None:
        at_limit = f"{CLOUD_RUN_MAX_MEMORY_GIB}Gi"
        result = _call(
            compute_type="cloud_run",
            compute_config={"memory": at_limit, "cpu": 1},
        )
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert not any("max memory" in w for w in warnings)

    @pytest.mark.unit
    def test_cpu_over_limit_warning(self) -> None:
        result = _call(
            compute_type="cloud_run",
            compute_config={"cpu": CLOUD_RUN_MAX_CPU + 1},
        )
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert any("max CPU" in w for w in warnings)

    @pytest.mark.unit
    def test_cpu_at_limit_no_warning(self) -> None:
        result = _call(
            compute_type="cloud_run",
            compute_config={"cpu": CLOUD_RUN_MAX_CPU},
        )
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert not any("max CPU" in w for w in warnings)

    @pytest.mark.unit
    def test_invalid_cpu_string_does_not_raise(self, caplog: pytest.LogCaptureFixture) -> None:
        with caplog.at_level(logging.WARNING, logger="deployment_service.advisor"):
            result = _call(
                compute_type="cloud_run",
                compute_config={"cpu": "not-a-number"},
            )
        # cpu_int will be None so no CPU warning emitted
        warnings: list[str] = result["warnings"]  # type: ignore[assignment]
        assert not any("max CPU" in w for w in warnings)
        assert "Could not parse CPU" in caplog.text

    @pytest.mark.unit
    def test_multiple_warnings_accumulate(self) -> None:
        # Trigger both execution-cap and skip_venue_sharding warnings
        result = _call(
            compute_type="cloud_run",
            total_shards=CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION + 100,
            skip_venue_sharding=True,
        )
        assert len(result["warnings"]) >= 2  # type: ignore[arg-type]


# ---------------------------------------------------------------------------
# recommend_deployment_settings — Cloud Run notes
# ---------------------------------------------------------------------------


class TestCloudRunNotes:
    """Tests for Cloud Run-specific informational notes."""

    @pytest.mark.unit
    def test_cloud_run_quota_note_always_present(self) -> None:
        result = _call(compute_type="cloud_run")
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert any(str(CLOUD_RUN_DEFAULT_RUN_JOB_QUOTA_PER_MIN) in n for n in notes)

    @pytest.mark.unit
    def test_vm_has_no_quota_note(self) -> None:
        result = _call(compute_type="vm")
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert not any("run_job" in n for n in notes)


# ---------------------------------------------------------------------------
# recommend_deployment_settings — max_workers note
# ---------------------------------------------------------------------------


class TestMaxWorkersNote:
    """Tests for the high-max_workers vendor pressure note."""

    @pytest.mark.unit
    def test_no_note_when_max_workers_is_none(self) -> None:
        result = _call(compute_type="vm")
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert not any("max_workers" in n for n in notes)

    @pytest.mark.unit
    def test_no_note_when_max_workers_is_8(self) -> None:
        result = _call(compute_type="vm", max_workers=8)
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert not any("max_workers" in n for n in notes)

    @pytest.mark.unit
    def test_note_when_max_workers_is_9(self) -> None:
        result = _call(compute_type="vm", max_workers=9)
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert any("max_workers" in n for n in notes)

    @pytest.mark.unit
    def test_note_when_max_workers_is_very_high(self) -> None:
        result = _call(compute_type="vm", max_workers=64)
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert any("max_workers" in n for n in notes)


# ---------------------------------------------------------------------------
# recommend_deployment_settings — skip_feature_group_sharding note
# ---------------------------------------------------------------------------


class TestSkipFeatureGroupShardingNote:
    """Tests for the skip_feature_group_sharding informational note."""

    @pytest.mark.unit
    def test_note_present_when_flag_true(self) -> None:
        result = _call(skip_feature_group_sharding=True)
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert any("skip_feature_group_sharding" in n for n in notes)

    @pytest.mark.unit
    def test_note_absent_when_flag_false(self) -> None:
        result = _call(skip_feature_group_sharding=False)
        notes: list[str] = result["notes"]  # type: ignore[assignment]
        assert not any("skip_feature_group_sharding" in n for n in notes)


# ---------------------------------------------------------------------------
# recommend_deployment_settings — return type / structure
# ---------------------------------------------------------------------------


class TestReturnStructure:
    """Tests for the shape of the returned dict."""

    @pytest.mark.unit
    def test_returns_dict(self) -> None:
        result = _call()
        assert isinstance(result, dict)

    @pytest.mark.unit
    def test_has_required_keys(self) -> None:
        result = _call()
        assert "recommended_date_granularity" in result
        assert "recommended_max_concurrent" in result
        assert "warnings" in result
        assert "notes" in result

    @pytest.mark.unit
    def test_warnings_is_list(self) -> None:
        result = _call()
        assert isinstance(result["warnings"], list)

    @pytest.mark.unit
    def test_notes_is_list(self) -> None:
        result = _call()
        assert isinstance(result["notes"], list)

    @pytest.mark.unit
    def test_compute_type_none_defaults_to_vm(self) -> None:
        # compute_type is normalised with `or "vm"` so passing empty-string should behave like vm
        result = recommend_deployment_settings(
            service="svc",
            compute_type="",
            total_shards=500,
        )
        assert result["recommended_max_concurrent"] == 500
