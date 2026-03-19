"""
Unit tests for state_management module helpers.

Tests focus on pure helper functions that don't require HTTP requests or
cloud API calls.
"""

import json
import sys
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import MagicMock

# Ensure _deployment_config in deployments_helpers has the needed attributes
# before state_management.py is imported (it accesses these at module level).
if "deployment_api.routes.deployments_helpers" not in sys.modules:
    _dh_mock = MagicMock()
    _dh_mock._deployment_config.effective_project_id = "test-project"
    _dh_mock._deployment_config.effective_region = "us-central1"
    _dh_mock._deployment_config.effective_state_bucket = "test-bucket"
    _dh_mock._deployment_config.service_account_email = "sa@test.iam"
    _dh_mock._deployment_config.default_max_concurrent = 5
    _dh_mock._deployment_config.max_concurrent_hard_limit = 20
    sys.modules["deployment_api.routes.deployments_helpers"] = _dh_mock
else:
    _dh_mod = sys.modules["deployment_api.routes.deployments_helpers"]
    _cfg = getattr(_dh_mod, "_deployment_config", None)
    if _cfg is not None and not isinstance(_cfg, MagicMock):
        if not hasattr(_cfg, "effective_project_id"):
            _cfg.__class__.effective_project_id = property(lambda self: "test-project")
        if not hasattr(_cfg, "effective_region"):
            _cfg.__class__.effective_region = property(lambda self: "us-central1")

# Remove state_management from sys.modules so it's re-imported with the mocked helpers
for _key in list(sys.modules):
    if "state_management" in _key and "test_" not in _key:
        del sys.modules[_key]

from deployment_api.routes.state_management import (
    _build_blob_timestamp_map,
    _build_existing_dates_sets,
    _categories_from_state,
    _classify_all_shards,
    _classify_shard,
    _compute_classification_counts,
    _compute_verified_succeeded_shard_ids,
    _extract_date_range,
    _extract_error_warning_shard_ids,
    _extract_severity_and_logger,
    _get_state_date_range,
    _parse_iso_dt,
    _shard_has_force,
    _status_str,
)


class TestStatusStr:
    """Tests for _status_str in state_management.

    Note: state_management._status_str uses hasattr(val, 'value') for enum-like
    objects, unlike shard_management which checks for .status attribute.
    """

    def test_string_passthrough(self):
        assert _status_str("running") == "running"

    def test_dict_returns_str_repr(self):
        # state_management._status_str does str(val) for dicts (no .status extraction)
        result = _status_str({"status": "failed"})
        assert "status" in result and "failed" in result

    def test_object_with_value_attr(self):
        # Uses .value for enum-like objects
        obj = SimpleNamespace(value="running")
        assert _status_str(obj) == "running"

    def test_object_without_value_attr(self):
        # Falls back to str() for objects without .value
        obj = SimpleNamespace(status="pending")
        result = _status_str(obj)
        assert "pending" in result

    def test_other_type(self):
        assert _status_str(99) == "99"


class TestParseIsoDt:
    """Tests for _parse_iso_dt in state_management."""

    def test_valid_utc(self):
        result = _parse_iso_dt("2024-03-15T12:00:00Z")
        assert result is not None
        assert result.tzinfo is not None

    def test_naive_gets_utc(self):
        result = _parse_iso_dt("2024-03-15T12:00:00")
        assert result is not None
        assert result.tzinfo == UTC

    def test_none_returns_none(self):
        assert _parse_iso_dt(None) is None

    def test_invalid_returns_none(self):
        assert _parse_iso_dt("not-a-date") is None


class TestShardHasForce:
    """Tests for _shard_has_force in state_management."""

    def test_with_force(self):
        shard = SimpleNamespace(args=["--start-date", "2024-01-01", "--force"])
        assert _shard_has_force(shard) is True

    def test_without_force(self):
        shard = SimpleNamespace(args=["--start-date", "2024-01-01"])
        assert _shard_has_force(shard) is False

    def test_no_args(self):
        shard = SimpleNamespace()
        assert _shard_has_force(shard) is False


class TestExtractDateRange:
    """Tests for _extract_date_range in state_management.

    Note: state_management._extract_date_range is simpler than shard_management's:
    - dict input: returns (start, end) from dict keys
    - string: returns (str, str) treating the string as a single date value
    - falsy: returns (None, None)
    """

    def test_single_date_string(self):
        start, end = _extract_date_range("2024-01-15")
        assert start == "2024-01-15"
        assert end == "2024-01-15"

    def test_dict_with_start_and_end(self):
        start, end = _extract_date_range({"start": "2024-01-01", "end": "2024-01-31"})
        assert start == "2024-01-01"
        assert end == "2024-01-31"

    def test_dict_with_only_start(self):
        start, end = _extract_date_range({"start": "2024-01-01"})
        assert start == "2024-01-01"
        assert end == "2024-01-01"  # end defaults to start

    def test_none_returns_none(self):
        start, end = _extract_date_range(None)
        assert start is None
        assert end is None

    def test_empty_string_returns_none(self):
        start, end = _extract_date_range("")
        assert start is None
        assert end is None


class TestGetStateDateRange:
    """Tests for _get_state_date_range."""

    def test_extracts_from_config(self):
        state = SimpleNamespace(
            config={"start_date": "2024-01-01", "end_date": "2024-01-31"},
            shards=[],
        )
        start, end = _get_state_date_range(state)
        assert start == "2024-01-01"
        assert end == "2024-01-31"

    def test_falls_back_to_shards(self):
        state = SimpleNamespace(
            config={},
            shards=[
                SimpleNamespace(dimensions={"date": "2024-01-05"}),
                SimpleNamespace(dimensions={"date": "2024-01-10"}),
            ],
        )
        start, end = _get_state_date_range(state)
        assert start == "2024-01-05"
        assert end == "2024-01-10"

    def test_no_config_no_shards_returns_none(self):
        state = SimpleNamespace(config={}, shards=[])
        start, end = _get_state_date_range(state)
        assert start is None
        assert end is None

    def test_no_config_attr(self):
        state = SimpleNamespace(shards=[])
        start, end = _get_state_date_range(state)
        assert start is None
        assert end is None


class TestExtractErrorWarningShardsFromStateManagement:
    """Tests for _extract_error_warning_shard_ids in state_management."""

    def test_extracts_errors(self):
        log_analysis = {
            "errors": [{"shard_id": "s1"}, {"shard_id": "s2"}],
            "warnings": [],
        }
        err_ids, _warn_ids = _extract_error_warning_shard_ids(log_analysis)
        assert "s1" in err_ids and "s2" in err_ids

    def test_errors_take_precedence_over_warnings(self):
        """Shard in both errors and warnings — counted as error only."""
        log_analysis = {
            "errors": [{"shard_id": "s1"}],
            "warnings": [{"shard_id": "s1"}],
        }
        err_ids, warn_ids = _extract_error_warning_shard_ids(log_analysis)
        assert "s1" in err_ids
        assert "s1" not in warn_ids

    def test_none_returns_empty(self):
        err_ids, warn_ids = _extract_error_warning_shard_ids(None)
        assert err_ids == set()
        assert warn_ids == set()


class TestClassifyShardInStateManagement:
    """Tests for _classify_shard in state_management."""

    def _make_shard(self, status: str, failure_category: str = "", args=None):
        return SimpleNamespace(
            status=status,
            failure_category=failure_category,
            args=args or [],
            start_time=None,
            end_time=None,
        )

    def test_pending(self):
        assert _classify_shard(self._make_shard("pending")) == "NEVER_RAN"

    def test_cancelled(self):
        assert _classify_shard(self._make_shard("cancelled")) == "CANCELLED"

    def test_running(self):
        assert _classify_shard(self._make_shard("running")) == "STILL_RUNNING"

    def test_failed_infra(self):
        shard = self._make_shard("failed", failure_category="zone_exhaustion")
        assert _classify_shard(shard) == "INFRA_FAILURE"

    def test_failed_code(self):
        shard = self._make_shard("failed", failure_category="application_error")
        assert _classify_shard(shard) == "CODE_FAILURE"

    def test_failed_timeout(self):
        shard = self._make_shard("failed", failure_category="timeout")
        assert _classify_shard(shard) == "TIMEOUT_FAILURE"

    def test_failed_unknown(self):
        shard = self._make_shard("failed")
        assert _classify_shard(shard) == "VM_DIED"

    def test_succeeded_with_errors(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, has_log_errors=True) == "COMPLETED_WITH_ERRORS"

    def test_succeeded_with_warnings(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, has_log_warnings=True) == "COMPLETED_WITH_WARNINGS"

    def test_unverified_no_blob_data(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, blob_exists=None) == "UNVERIFIED"

    def test_data_missing(self):
        shard = self._make_shard("succeeded")
        assert _classify_shard(shard, blob_exists=False) == "DATA_MISSING"

    def test_verified(self):
        now = datetime.now(UTC)
        shard = SimpleNamespace(
            status="succeeded",
            failure_category="",
            args=[],
            start_time=(now - timedelta(hours=2)).isoformat(),
            end_time=(now - timedelta(hours=1)).isoformat(),
        )
        blob_ts = now - timedelta(hours=1, minutes=30)
        assert _classify_shard(shard, blob_exists=True, blob_updated=blob_ts) == "VERIFIED"


class TestClassifyAllShardsInStateManagement:
    """Tests for _classify_all_shards in state_management."""

    def test_classifies_multiple_shards(self):
        s1 = SimpleNamespace(
            shard_id="s1",
            status="succeeded",
            failure_category="",
            args=[],
            start_time=None,
            end_time=None,
        )
        s2 = SimpleNamespace(
            shard_id="s2",
            status="pending",
            failure_category="",
            args=[],
            start_time=None,
            end_time=None,
        )
        state = SimpleNamespace(shards=[s1, s2])
        result = _classify_all_shards(state, log_analysis=None)
        assert result["s1"] == "UNVERIFIED"
        assert result["s2"] == "NEVER_RAN"


class TestComputeClassificationCountsInStateManagement:
    """Tests for _compute_classification_counts in state_management."""

    def test_counts(self):
        classifications = {"s1": "VERIFIED", "s2": "VERIFIED", "s3": "DATA_MISSING"}
        counts = _compute_classification_counts(classifications)
        assert counts["VERIFIED"] == 2
        assert counts["DATA_MISSING"] == 1


class TestBuildExistingDatesSetsInStateManagement:
    """Tests for _build_existing_dates_sets in state_management."""

    def test_basic_dates_found_list(self):
        turbo = {"categories": {"CEFI": {"dates_found_list": ["2024-01-01", "2024-01-02"]}}}
        cat_dates, _venue_dates = _build_existing_dates_sets(turbo)
        assert "2024-01-01" in cat_dates["CEFI"]

    def test_empty_result(self):
        cat_dates, _venue_dates = _build_existing_dates_sets({})
        assert cat_dates == {}


class TestBuildBlobTimestampMapInStateManagement:
    """Tests for _build_blob_timestamp_map in state_management."""

    def test_extracts_timestamps(self):
        turbo = {
            "categories": {
                "CEFI": {
                    "_venue_date_blob_timestamps": {
                        "BINANCE": {"2024-01-01": datetime(2024, 1, 1, tzinfo=UTC)}
                    }
                }
            }
        }
        result = _build_blob_timestamp_map(turbo)
        assert "CEFI" in result

    def test_empty_returns_empty(self):
        assert _build_blob_timestamp_map({}) == {}


class TestCategoriesFromState:
    """Tests for _categories_from_state."""

    def test_extracts_categories_from_succeeded_shards(self):
        s1 = SimpleNamespace(status="succeeded", dimensions={"category": "CEFI"})
        s2 = SimpleNamespace(status="succeeded", dimensions={"category": "TRADFI"})
        s3 = SimpleNamespace(status="failed", dimensions={"category": "DEFI"})  # excluded
        state = SimpleNamespace(shards=[s1, s2, s3])
        result = _categories_from_state(state)
        assert result is not None
        assert "CEFI" in result
        assert "TRADFI" in result
        assert "DEFI" not in result

    def test_no_succeeded_shards_returns_none(self):
        s1 = SimpleNamespace(status="pending", dimensions={"category": "CEFI"})
        state = SimpleNamespace(shards=[s1])
        result = _categories_from_state(state)
        assert result is None

    def test_empty_shards_returns_none(self):
        state = SimpleNamespace(shards=[])
        result = _categories_from_state(state)
        assert result is None


class TestExtractSeverityAndLogger:
    """Tests for _extract_severity_and_logger — JSON and plain-text paths."""

    def test_json_severity_info(self):
        line = json.dumps({"severity": "INFO", "message": "hello"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "INFO"

    def test_json_severity_error(self):
        line = json.dumps({"severity": "ERROR", "message": "bad"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "ERROR"

    def test_json_severity_critical_mapped_to_error(self):
        line = json.dumps({"severity": "CRITICAL", "message": "fatal"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "ERROR"

    def test_json_severity_warning(self):
        line = json.dumps({"severity": "WARNING"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "WARNING"

    def test_json_severity_debug(self):
        line = json.dumps({"severity": "DEBUG"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "DEBUG"

    def test_json_logger_extracted(self):
        line = json.dumps({"severity": "INFO", "logger": "my.module"})
        _, logger_name = _extract_severity_and_logger(line)
        assert logger_name == "my.module"

    def test_non_json_error_keyword(self):
        sev, _ = _extract_severity_and_logger("This is an ERROR in processing")
        assert sev == "ERROR"

    def test_non_json_warning_keyword(self):
        sev, _ = _extract_severity_and_logger("WARNING: disk almost full")
        assert sev == "WARNING"

    def test_non_json_info_default(self):
        sev, _ = _extract_severity_and_logger("Normal processing line")
        assert sev == "INFO"


class TestComputeVerifiedSucceededShardIds:
    """Tests for _compute_verified_succeeded_shard_ids."""

    def _make_shard(
        self,
        shard_id: str,
        status: str = "succeeded",
        category: str = "CEFI",
        venue: str = "",
        date: str = "2026-01-01",
    ) -> SimpleNamespace:
        dims: dict[str, object] = {"category": category, "date": date}
        if venue:
            dims["venue"] = venue
        return SimpleNamespace(shard_id=shard_id, status=status, dimensions=dims)

    def _make_state(self, shards: list) -> SimpleNamespace:
        return SimpleNamespace(shards=shards)

    def test_verified_when_date_in_cat_dates(self):
        state = self._make_state([self._make_shard("s1")])
        cat_dates = {"CEFI": {"2026-01-01"}}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, {})
        assert "s1" in result

    def test_not_verified_when_date_missing(self):
        state = self._make_state([self._make_shard("s1")])
        cat_dates = {"CEFI": {"2026-01-02"}}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, {})
        assert "s1" not in result

    def test_verified_with_venue_match(self):
        state = self._make_state([self._make_shard("s1", venue="BINANCE")])
        cat_dates = {"CEFI": {"2026-01-01"}}
        venue_dates = {"CEFI": {"BINANCE": {"2026-01-01"}}}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, venue_dates)
        assert "s1" in result

    def test_non_succeeded_shards_skipped(self):
        state = self._make_state([self._make_shard("s1", status="failed")])
        cat_dates = {"CEFI": {"2026-01-01"}}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, {})
        assert "s1" not in result

    def test_empty_state_returns_empty(self):
        state = self._make_state([])
        result = _compute_verified_succeeded_shard_ids(state, {}, {})
        assert result == set()
