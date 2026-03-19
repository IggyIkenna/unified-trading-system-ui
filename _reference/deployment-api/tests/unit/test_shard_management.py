"""
Unit tests for shard_management module.

Tests cover pure helper functions: _status_str, _parse_iso_dt, _shard_has_force,
_extract_date_range, _extract_error_warning_shard_ids, _classify_shard,
and _build_blob_timestamp_map.
"""

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from deployment_api.routes.shard_management import (
    _INFRA_FAILURE_CATEGORIES,
    _classify_shard,
    _extract_date_range,
    _extract_error_warning_shard_ids,
    _parse_iso_dt,
    _shard_has_force,
    _status_str,
)
from deployment_api.routes.shard_management import (
    build_blob_timestamp_map as _build_blob_timestamp_map,
)


class TestStatusStr:
    """Tests for _status_str in shard_management."""

    def test_string_passthrough(self):
        assert _status_str("running") == "running"

    def test_dict_extracts_status(self):
        assert _status_str({"status": "completed"}) == "completed"

    def test_dict_missing_key_returns_unknown(self):
        assert _status_str({}) == "unknown"

    def test_object_with_status_attr(self):
        obj = SimpleNamespace(status="failed")
        assert _status_str(obj) == "failed"

    def test_integer(self):
        result = _status_str(42)
        assert result == "42"


class TestParseIsoDt:
    """Tests for _parse_iso_dt."""

    def test_valid_iso_string(self):
        result = _parse_iso_dt("2024-01-15T10:30:00Z")
        assert result is not None
        assert result.tzinfo is not None
        assert result.year == 2024

    def test_iso_with_offset(self):
        result = _parse_iso_dt("2024-01-15T10:30:00+09:00")
        assert result is not None
        assert result.tzinfo is not None

    def test_naive_datetime_gets_utc(self):
        result = _parse_iso_dt("2024-01-15T10:30:00")
        assert result is not None
        assert result.tzinfo == UTC

    def test_none_returns_none(self):
        assert _parse_iso_dt(None) is None

    def test_empty_string_returns_none(self):
        assert _parse_iso_dt("") is None

    def test_invalid_format_returns_none(self):
        assert _parse_iso_dt("not-a-date") is None


class TestShardHasForce:
    """Tests for _shard_has_force."""

    def test_returns_true_when_force_in_args(self):
        shard = SimpleNamespace(args=["--start-date", "2024-01-01", "--force"])
        assert _shard_has_force(shard) is True

    def test_returns_false_when_no_force(self):
        shard = SimpleNamespace(args=["--start-date", "2024-01-01"])
        assert _shard_has_force(shard) is False

    def test_returns_false_when_no_args_attr(self):
        shard = SimpleNamespace()
        assert _shard_has_force(shard) is False

    def test_returns_false_when_args_is_none(self):
        shard = SimpleNamespace(args=None)
        assert _shard_has_force(shard) is False


class TestExtractDateRange:
    """Tests for _extract_date_range in shard_management."""

    def test_single_date(self):
        start, end = _extract_date_range("2024-01-15")
        assert start == "2024-01-15"
        assert end == "2024-01-15"

    def test_comma_separated(self):
        start, end = _extract_date_range("2024-01-01,2024-01-31")
        assert start == "2024-01-01"
        assert end == "2024-01-31"

    def test_to_separated(self):
        start, end = _extract_date_range("2024-01-01 to 2024-01-31")
        assert start == "2024-01-01"
        assert end == "2024-01-31"

    def test_last_n_days_relative(self):
        start, end = _extract_date_range("last-7-days")
        assert start is not None
        assert end is not None
        today = datetime.now(UTC).strftime("%Y-%m-%d")
        assert end == today

    def test_none_input(self):
        start, end = _extract_date_range(None)
        assert start is None
        assert end is None

    def test_empty_string(self):
        start, end = _extract_date_range("")
        assert start is None
        assert end is None

    def test_invalid_relative(self):
        start, end = _extract_date_range("last-abc-days")
        assert start is None
        assert end is None


class TestExtractErrorWarningShardsIds:
    """Tests for _extract_error_warning_shard_ids."""

    def test_extracts_error_shard_ids(self):
        log_analysis = {
            "errors": [
                {"shard_id": "shard-1", "line": "ERROR something"},
                {"shard_id": "shard-2", "line": "ERROR another"},
            ],
            "warnings": [],
        }
        error_ids, warn_ids = _extract_error_warning_shard_ids(log_analysis)
        assert "shard-1" in error_ids
        assert "shard-2" in error_ids
        assert len(warn_ids) == 0

    def test_extracts_warning_shard_ids(self):
        log_analysis = {
            "errors": [],
            "warnings": [{"shard_id": "shard-3", "line": "WARN something"}],
        }
        error_ids, warn_ids = _extract_error_warning_shard_ids(log_analysis)
        assert len(error_ids) == 0
        assert "shard-3" in warn_ids

    def test_none_returns_empty_sets(self):
        error_ids, warn_ids = _extract_error_warning_shard_ids(None)
        assert len(error_ids) == 0
        assert len(warn_ids) == 0

    def test_missing_shard_id_excluded(self):
        log_analysis = {
            "errors": [{"line": "ERROR no shard_id"}],
            "warnings": [],
        }
        error_ids, _ = _extract_error_warning_shard_ids(log_analysis)
        assert len(error_ids) == 0


class TestClassifyShard:
    """Tests for _classify_shard decision tree."""

    def _make_shard(self, status: str, failure_category: str = "", args: list | None = None):
        return SimpleNamespace(
            status=status,
            failure_category=failure_category,
            args=args or [],
            start_time=None,
            end_time=None,
        )

    def test_pending_is_never_ran(self):
        shard = self._make_shard("pending")
        assert _classify_shard(shard) == "NEVER_RAN"

    def test_cancelled_is_cancelled(self):
        shard = self._make_shard("cancelled")
        assert _classify_shard(shard) == "CANCELLED"

    def test_running_is_still_running(self):
        shard = self._make_shard("running")
        assert _classify_shard(shard) == "STILL_RUNNING"

    def test_failed_with_infra_failure(self):
        for fc in _INFRA_FAILURE_CATEGORIES:
            shard = self._make_shard("failed", failure_category=fc)
            assert _classify_shard(shard) == "INFRA_FAILURE", f"Expected INFRA_FAILURE for {fc}"

    def test_failed_with_timeout(self):
        shard = self._make_shard("failed", failure_category="timeout")
        assert _classify_shard(shard) == "TIMEOUT_FAILURE"

    def test_failed_with_code_failure(self):
        shard = self._make_shard("failed", failure_category="code_failure")
        assert _classify_shard(shard) == "CODE_FAILURE"

    def test_failed_with_unknown_is_vm_died(self):
        shard = self._make_shard("failed", failure_category="")
        assert _classify_shard(shard) == "VM_DIED"

    def test_succeeded_with_log_errors(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, has_log_errors=True) == "COMPLETED_WITH_ERRORS"

    def test_succeeded_with_log_warnings(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, has_log_warnings=True) == "COMPLETED_WITH_WARNINGS"

    def test_succeeded_no_blob_data_is_unverified(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, blob_exists=None) == "UNVERIFIED"

    def test_succeeded_blob_missing_is_data_missing(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, blob_exists=False) == "DATA_MISSING"

    def test_succeeded_blob_exists_no_timestamps_no_force(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, blob_exists=True) == "EXPECTED_SKIP"

    def test_succeeded_blob_exists_no_timestamps_with_force(self):
        shard = self._make_shard("succeeded", args=["--force"])
        assert _classify_shard(shard, blob_exists=True) == "VERIFIED"

    def test_succeeded_blob_verified_timestamp_in_range(self):
        now = datetime.now(UTC)
        shard = SimpleNamespace(
            status="succeeded",
            failure_category="",
            args=[],
            start_time=(now - timedelta(minutes=30)).isoformat(),
            end_time=(now - timedelta(minutes=5)).isoformat(),
        )
        # Blob updated during the job interval
        blob_ts = now - timedelta(minutes=15)
        assert _classify_shard(shard, blob_exists=True, blob_updated=blob_ts) == "VERIFIED"

    def test_succeeded_blob_timestamp_outside_range_no_force(self):
        now = datetime.now(UTC)
        shard = SimpleNamespace(
            status="succeeded",
            failure_category="",
            args=[],
            start_time=(now - timedelta(days=5)).isoformat(),
            end_time=(now - timedelta(days=4)).isoformat(),
        )
        # Blob updated very recently (outside job interval)
        blob_ts = now - timedelta(minutes=1)
        assert _classify_shard(shard, blob_exists=True, blob_updated=blob_ts) == "EXPECTED_SKIP"

    def test_succeeded_blob_timestamp_outside_range_with_force(self):
        now = datetime.now(UTC)
        shard = SimpleNamespace(
            status="succeeded",
            failure_category="",
            args=["--force"],
            start_time=(now - timedelta(days=5)).isoformat(),
            end_time=(now - timedelta(days=4)).isoformat(),
        )
        blob_ts = now - timedelta(minutes=1)
        assert _classify_shard(shard, blob_exists=True, blob_updated=blob_ts) == "DATA_STALE"


class TestClassifyAllShards:
    """Tests for classify_all_shards."""

    def test_classifies_each_shard(self):
        from deployment_api.routes.shard_management import classify_all_shards

        shard1 = SimpleNamespace(
            shard_id="s1",
            status="succeeded",
            failure_category="",
            args=[],
            start_time=None,
            end_time=None,
        )
        shard2 = SimpleNamespace(
            shard_id="s2",
            status="failed",
            failure_category="timeout",
            args=[],
            start_time=None,
            end_time=None,
        )
        state = SimpleNamespace(shards=[shard1, shard2])

        result = classify_all_shards(state, log_analysis=None)
        assert result["s1"] == "UNVERIFIED"  # no blob data
        assert result["s2"] == "TIMEOUT_FAILURE"

    def test_skips_shards_without_ids(self):
        from deployment_api.routes.shard_management import classify_all_shards

        shard = SimpleNamespace(
            shard_id="",
            status="succeeded",
            failure_category="",
            args=[],
            start_time=None,
            end_time=None,
        )
        state = SimpleNamespace(shards=[shard])
        result = classify_all_shards(state, log_analysis=None)
        assert len(result) == 0

    def test_uses_log_analysis_for_errors(self):
        from deployment_api.routes.shard_management import classify_all_shards

        shard = SimpleNamespace(
            shard_id="s1",
            status="succeeded",
            failure_category="",
            args=[],
            start_time=None,
            end_time=None,
        )
        state = SimpleNamespace(shards=[shard])
        log_analysis = {"errors": [{"shard_id": "s1", "line": "ERROR"}], "warnings": []}
        result = classify_all_shards(state, log_analysis=log_analysis)
        assert result["s1"] == "COMPLETED_WITH_ERRORS"


class TestComputeClassificationCounts:
    """Tests for compute_classification_counts."""

    def test_counts_each_classification(self):
        from deployment_api.routes.shard_management import compute_classification_counts

        classifications = {
            "s1": "VERIFIED",
            "s2": "VERIFIED",
            "s3": "DATA_MISSING",
            "s4": "TIMEOUT_FAILURE",
        }
        counts = compute_classification_counts(classifications)
        assert counts["VERIFIED"] == 2
        assert counts["DATA_MISSING"] == 1
        assert counts["TIMEOUT_FAILURE"] == 1

    def test_empty_returns_empty(self):
        from deployment_api.routes.shard_management import compute_classification_counts

        assert compute_classification_counts({}) == {}


class TestBuildExistingDatesSets:
    """Tests for build_existing_dates_sets."""

    def test_extracts_dates_found_list(self):
        from deployment_api.routes.shard_management import build_existing_dates_sets

        turbo_result = {"categories": {"CEFI": {"dates_found_list": ["2024-01-01", "2024-01-02"]}}}
        cat_dates, _venue_dates = build_existing_dates_sets(turbo_result)
        assert "CEFI" in cat_dates
        assert "2024-01-01" in cat_dates["CEFI"]

    def test_extracts_from_venues(self):
        from deployment_api.routes.shard_management import build_existing_dates_sets

        turbo_result = {
            "categories": {
                "CEFI": {
                    "venues": {
                        "BINANCE": {"dates_found_list": ["2024-01-01"]},
                        "COINBASE": {"dates_found_list": ["2024-01-02"]},
                    }
                }
            }
        }
        cat_dates, venue_dates = build_existing_dates_sets(turbo_result)
        assert "BINANCE" in venue_dates["CEFI"]
        assert "2024-01-01" in venue_dates["CEFI"]["BINANCE"]
        assert {"2024-01-01", "2024-01-02"} == cat_dates["CEFI"]

    def test_uses_precomputed_set(self):
        from deployment_api.routes.shard_management import build_existing_dates_sets

        dates_set = {"2024-01-01", "2024-01-15"}
        turbo_result = {"categories": {"CEFI": {"_dates_set": dates_set}}}
        cat_dates, _ = build_existing_dates_sets(turbo_result)
        assert cat_dates["CEFI"] == dates_set

    def test_skips_error_categories(self):
        from deployment_api.routes.shard_management import build_existing_dates_sets

        turbo_result = {"categories": {"CEFI": {"error": "Failed to load data"}}}
        cat_dates, _ = build_existing_dates_sets(turbo_result)
        assert "CEFI" not in cat_dates

    def test_empty_turbo_result(self):
        from deployment_api.routes.shard_management import build_existing_dates_sets

        cat_dates, venue_dates = build_existing_dates_sets({})
        assert cat_dates == {}
        assert venue_dates == {}


class TestBuildBlobTimestampMap:
    """Tests for _build_blob_timestamp_map."""

    def test_extracts_timestamps_from_turbo_result(self):
        turbo_result = {
            "categories": {
                "CEFI": {
                    "_venue_date_blob_timestamps": {
                        "BINANCE": {"2024-01-01": datetime(2024, 1, 1, tzinfo=UTC)}
                    }
                }
            }
        }
        result = _build_blob_timestamp_map(turbo_result)
        assert "CEFI" in result
        assert "BINANCE" in result["CEFI"]

    def test_empty_turbo_result(self):
        result = _build_blob_timestamp_map({})
        assert result == {}

    def test_skips_categories_without_timestamps(self):
        turbo_result = {
            "categories": {
                "CEFI": {"completion_pct": 90.0},  # No timestamp map
            }
        }
        result = _build_blob_timestamp_map(turbo_result)
        assert result == {}

    def test_skips_non_dict_categories(self):
        turbo_result = {
            "categories": {
                "CEFI": "error",  # Not a dict
            }
        }
        result = _build_blob_timestamp_map(turbo_result)
        assert result == {}


class TestGetAllZonesForVmLookup:
    """Tests for get_all_zones_for_vm_lookup."""

    def test_us_central1_primary(self):
        from unittest.mock import patch

        import deployment_api.settings as _settings
        from deployment_api.routes.shard_management import get_all_zones_for_vm_lookup

        with (
            patch.object(_settings, "GCS_REGION", "us-central1"),
            patch.object(_settings, "ALL_FAILOVER_REGIONS", []),
        ):
            zones = get_all_zones_for_vm_lookup("us-central1")
        assert "us-central1-a" in zones
        assert "us-central1-b" in zones
        assert "us-central1-c" in zones

    def test_us_east1_primary(self):
        from unittest.mock import patch

        import deployment_api.settings as _settings
        from deployment_api.routes.shard_management import get_all_zones_for_vm_lookup

        with (
            patch.object(_settings, "GCS_REGION", "us-east1"),
            patch.object(_settings, "ALL_FAILOVER_REGIONS", []),
        ):
            zones = get_all_zones_for_vm_lookup("us-east1")
        assert "us-east1-b" in zones

    def test_no_duplicates(self):
        from unittest.mock import patch

        import deployment_api.settings as _settings
        from deployment_api.routes.shard_management import get_all_zones_for_vm_lookup

        with (
            patch.object(_settings, "GCS_REGION", "us-central1"),
            patch.object(_settings, "ALL_FAILOVER_REGIONS", ["us-central1"]),
        ):
            zones = get_all_zones_for_vm_lookup("us-central1")
        # No duplicates allowed
        assert len(zones) == len(set(zones))

    def test_none_primary_uses_settings(self):
        from unittest.mock import patch

        import deployment_api.settings as _settings
        from deployment_api.routes.shard_management import get_all_zones_for_vm_lookup

        with (
            patch.object(_settings, "GCS_REGION", "us-central1"),
            patch.object(_settings, "ALL_FAILOVER_REGIONS", []),
        ):
            zones = get_all_zones_for_vm_lookup(None)
        assert len(zones) > 0

    def test_unknown_region_returns_empty_primary(self):
        from unittest.mock import patch

        import deployment_api.settings as _settings
        from deployment_api.routes.shard_management import get_all_zones_for_vm_lookup

        with (
            patch.object(_settings, "GCS_REGION", "unknown-region"),
            patch.object(_settings, "ALL_FAILOVER_REGIONS", []),
        ):
            zones = get_all_zones_for_vm_lookup("unknown-region")
        assert zones == []


class TestCategoriesFromStateInShard:
    """Tests for categories_from_state in shard_management."""

    def test_extracts_categories_from_all_shards(self):
        from types import SimpleNamespace

        from deployment_api.routes.shard_management import categories_from_state

        shards = [
            SimpleNamespace(status="succeeded", dimensions={"category": "CEFI"}),
            SimpleNamespace(status="failed", dimensions={"category": "TRADFI"}),
            SimpleNamespace(status="succeeded", dimensions={"category": "CEFI"}),  # duplicate
        ]
        state = SimpleNamespace(shards=shards)
        result = categories_from_state(state)
        assert result is not None
        assert "CEFI" in result
        assert "TRADFI" in result
        assert result.count("CEFI") == 1  # deduped

    def test_returns_none_for_no_categories(self):
        from types import SimpleNamespace

        from deployment_api.routes.shard_management import categories_from_state

        state = SimpleNamespace(shards=[SimpleNamespace(status="pending", dimensions={})])
        result = categories_from_state(state)
        assert result is None

    def test_returns_none_for_empty_state(self):
        from deployment_api.routes.shard_management import categories_from_state

        assert categories_from_state(None) is None


class TestGetStateDateRangeInShard:
    """Tests for get_state_date_range in shard_management."""

    def test_extracts_min_max_dates(self):
        from types import SimpleNamespace

        from deployment_api.routes.shard_management import get_state_date_range

        shards = [
            SimpleNamespace(dimensions={"date": "2024-01-05"}),
            SimpleNamespace(dimensions={"date": "2024-01-10"}),
            SimpleNamespace(dimensions={"date": "2024-01-01"}),
        ]
        state = SimpleNamespace(shards=shards)
        start, end = get_state_date_range(state)
        assert start == "2024-01-01"
        assert end == "2024-01-10"

    def test_empty_shards_returns_none(self):
        from types import SimpleNamespace

        from deployment_api.routes.shard_management import get_state_date_range

        state = SimpleNamespace(shards=[])
        start, end = get_state_date_range(state)
        assert start is None
        assert end is None

    def test_no_shards_attr_returns_none(self):
        from deployment_api.routes.shard_management import get_state_date_range

        assert get_state_date_range(None) == (None, None)


class TestComputeCompletedBreakdown:
    """Tests for compute_completed_breakdown in shard_management."""

    def test_basic_breakdown(self):
        from types import SimpleNamespace

        from deployment_api.routes.shard_management import compute_completed_breakdown

        # shard_management._status_str checks hasattr(status, 'status'), so use a string
        shards = [
            SimpleNamespace(shard_id="s1", status="succeeded"),
            SimpleNamespace(shard_id="s2", status="succeeded"),
            SimpleNamespace(shard_id="s3", status="failed"),
        ]
        state = SimpleNamespace(shards=shards)
        log_analysis = {
            "errors": [{"shard_id": "s1"}],
            "warnings": [],
        }
        result = compute_completed_breakdown(state, log_analysis)
        assert "completed_with_errors" in result
        assert result["completed_with_errors"] == 1
        assert "s1" in result["error_shard_ids"]
        assert "s1" in result["succeeded_ids"] or "s2" in result["succeeded_ids"]

    def test_empty_shards_all_zeros(self):
        from types import SimpleNamespace

        from deployment_api.routes.shard_management import compute_completed_breakdown

        state = SimpleNamespace(shards=[])
        result = compute_completed_breakdown(state, log_analysis=None)
        assert result["completed_with_errors"] == 0
        assert result["completed_with_warnings"] == 0
        assert result["verified_clean"] == 0

    def test_with_existing_dates_verification(self):
        from types import SimpleNamespace

        from deployment_api.routes.shard_management import compute_completed_breakdown

        shards = [
            SimpleNamespace(
                shard_id="s1",
                status="succeeded",
                dimensions={"category": "CEFI", "venue": "BINANCE", "date": "2024-01-01"},
            ),
        ]
        state = SimpleNamespace(shards=shards)
        existing_cat_dates = {"CEFI": {"2024-01-01"}}
        existing_venue_dates = {"CEFI": {"BINANCE": {"2024-01-01"}}}
        result = compute_completed_breakdown(state, None, existing_cat_dates, existing_venue_dates)
        assert result["verified_clean"] == 1
