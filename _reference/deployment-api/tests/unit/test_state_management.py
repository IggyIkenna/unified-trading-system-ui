"""
Extended unit tests for state_management module.

Covers uncovered branches and functions:
- _extract_severity_and_logger (JSON severity path, various levels)
- _classify_shard (blob timestamp branches, force flag, timeout/code failure)
- _parse_iso_dt
- _build_blob_timestamp_map
- _build_existing_dates_sets
- _compute_verified_succeeded_shard_ids
- _compute_classification_counts
- _resolve_shard_blob_data
- _classify_all_shards
- _shard_has_force
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
        # Patch missing attributes so module-level code in state_management can run
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
    _classify_all_shards,
    _classify_shard,
    _compute_classification_counts,
    _compute_verified_succeeded_shard_ids,
    _extract_severity_and_logger,
    _parse_iso_dt,
    _shard_has_force,
)

# ---------------------------------------------------------------------------
# _extract_severity_and_logger (JSON severity path)
# ---------------------------------------------------------------------------


class TestExtractSeverityAndLoggerJsonSeverity:
    """Additional coverage for JSON-severity extraction (lines 46-76)."""

    def test_json_severity_info(self):
        line = json.dumps({"severity": "INFO", "message": "hello"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "INFO"

    def test_json_severity_error(self):
        line = json.dumps({"severity": "ERROR", "message": "bad"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "ERROR"

    def test_json_severity_critical(self):
        line = json.dumps({"severity": "CRITICAL", "message": "fatal"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "ERROR"

    def test_json_severity_fatal(self):
        line = json.dumps({"severity": "FATAL", "message": "dead"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "ERROR"

    def test_json_severity_alert(self):
        line = json.dumps({"severity": "ALERT", "message": "alert"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "ERROR"

    def test_json_severity_emergency(self):
        line = json.dumps({"severity": "EMERGENCY"})
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

    def test_json_severity_notice(self):
        line = json.dumps({"severity": "NOTICE"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "NOTICE"

    def test_json_severity_default(self):
        line = json.dumps({"severity": "DEFAULT"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "DEFAULT"

    def test_json_severity_unknown_treated_as_info(self):
        line = json.dumps({"severity": "CUSTOM_LEVEL"})
        sev, _ = _extract_severity_and_logger(line)
        assert sev == "INFO"

    def test_json_logger_extracted(self):
        line = json.dumps({"severity": "INFO", "logger": "my.module"})
        _, logger_name = _extract_severity_and_logger(line)
        assert logger_name == "my.module"

    def test_non_json_error_keyword(self):
        sev, _ = _extract_severity_and_logger("This is an ERROR in processing")
        assert sev == "ERROR"

    def test_non_json_failed_keyword(self):
        sev, _ = _extract_severity_and_logger("Connection FAILED after retry")
        assert sev == "ERROR"

    def test_non_json_warning_keyword(self):
        sev, _ = _extract_severity_and_logger("WARNING: disk almost full")
        assert sev == "WARNING"

    def test_non_json_warn_keyword(self):
        sev, _ = _extract_severity_and_logger("WARN disk almost full")
        assert sev == "WARNING"

    def test_non_json_info_default(self):
        sev, _ = _extract_severity_and_logger("Normal processing line")
        assert sev == "INFO"

    def test_class_name_false_positive_avoided(self):
        # "GenericErrorHandlingService" should NOT trigger ERROR
        sev, _ = _extract_severity_and_logger("Loading GenericErrorHandlingService")
        assert sev == "INFO"

    def test_json_decode_error_falls_through(self):
        # Malformed JSON with severity key — should fall through to keyword
        line = '{"severity": bad json}'
        sev, _ = _extract_severity_and_logger(line)
        # Falls through to keyword matching; no ERROR/WARNING keyword → INFO
        assert sev in ("INFO", "ERROR", "WARNING")


# ---------------------------------------------------------------------------
# _shard_has_force
# ---------------------------------------------------------------------------


class TestShardHasForce:
    def test_returns_true_when_force_in_args(self):
        shard = SimpleNamespace(args=["--date", "2026-01-01", "--force"])
        assert _shard_has_force(shard) is True

    def test_returns_false_when_no_force(self):
        shard = SimpleNamespace(args=["--date", "2026-01-01"])
        assert _shard_has_force(shard) is False

    def test_returns_false_when_no_args(self):
        shard = SimpleNamespace(args=None)
        assert _shard_has_force(shard) is False

    def test_returns_false_when_no_args_attr(self):
        shard = SimpleNamespace()
        assert _shard_has_force(shard) is False


# ---------------------------------------------------------------------------
# _classify_shard (blob timestamp branches)
# ---------------------------------------------------------------------------


class TestClassifyShardBlobBranches:
    """Covers lines 229-239: DATA_STALE, EXPECTED_SKIP, VERIFIED (no timestamps)."""

    def _make_shard(
        self, status="succeeded", args=None, start_time=None, end_time=None, failure_category=None
    ):
        return SimpleNamespace(
            status=status,
            args=args or [],
            start_time=start_time,
            end_time=end_time,
            failure_category=failure_category,
        )

    def test_blob_exists_ts_in_window_returns_verified(self):
        now = datetime.now(UTC)
        shard = self._make_shard(
            start_time=(now - timedelta(minutes=5)).isoformat(),
            end_time=now.isoformat(),
        )
        blob_updated = now - timedelta(minutes=2)
        result = _classify_shard(shard, blob_exists=True, blob_updated=blob_updated)
        assert result == "VERIFIED"

    def test_blob_exists_ts_outside_window_no_force_returns_expected_skip(self):
        now = datetime.now(UTC)
        shard = self._make_shard(
            start_time=(now - timedelta(hours=2)).isoformat(),
            end_time=(now - timedelta(hours=1)).isoformat(),
        )
        blob_updated = now  # after the end time + tolerance
        result = _classify_shard(shard, blob_exists=True, blob_updated=blob_updated)
        assert result == "EXPECTED_SKIP"

    def test_blob_exists_ts_outside_window_with_force_returns_data_stale(self):
        now = datetime.now(UTC)
        shard = self._make_shard(
            args=["--force"],
            start_time=(now - timedelta(hours=2)).isoformat(),
            end_time=(now - timedelta(hours=1)).isoformat(),
        )
        blob_updated = now  # after the end time + tolerance
        result = _classify_shard(shard, blob_exists=True, blob_updated=blob_updated)
        assert result == "DATA_STALE"

    def test_blob_exists_no_timestamps_no_force_returns_expected_skip(self):
        shard = self._make_shard()
        result = _classify_shard(shard, blob_exists=True, blob_updated=None)
        assert result == "EXPECTED_SKIP"

    def test_blob_exists_no_timestamps_with_force_returns_verified(self):
        shard = self._make_shard(args=["--force"])
        result = _classify_shard(shard, blob_exists=True, blob_updated=None)
        assert result == "VERIFIED"

    def test_blob_not_exists_returns_data_missing(self):
        shard = self._make_shard()
        result = _classify_shard(shard, blob_exists=False)
        assert result == "DATA_MISSING"

    def test_timeout_failure(self):
        shard = self._make_shard(status="failed", failure_category="timeout")
        result = _classify_shard(shard)
        assert result == "TIMEOUT_FAILURE"

    def test_code_failure_application_error(self):
        shard = self._make_shard(status="failed", failure_category="application_error")
        result = _classify_shard(shard)
        assert result == "CODE_FAILURE"

    def test_code_failure_network_error(self):
        shard = self._make_shard(status="failed", failure_category="network_error")
        result = _classify_shard(shard)
        assert result == "CODE_FAILURE"

    def test_code_failure_auth_error(self):
        shard = self._make_shard(status="failed", failure_category="auth_error")
        result = _classify_shard(shard)
        assert result == "CODE_FAILURE"

    def test_infra_failure_zone_exhaustion(self):
        shard = self._make_shard(status="failed", failure_category="zone_exhaustion")
        result = _classify_shard(shard)
        assert result == "INFRA_FAILURE"

    def test_infra_failure_preemption(self):
        shard = self._make_shard(status="failed", failure_category="preemption")
        result = _classify_shard(shard)
        assert result == "INFRA_FAILURE"

    def test_unknown_failure_vm_died(self):
        shard = self._make_shard(status="failed", failure_category="unknown_weird_error")
        result = _classify_shard(shard)
        assert result == "VM_DIED"

    def test_completed_with_log_errors(self):
        shard = self._make_shard()
        result = _classify_shard(shard, has_log_errors=True)
        assert result == "COMPLETED_WITH_ERRORS"

    def test_completed_with_log_warnings(self):
        shard = self._make_shard()
        result = _classify_shard(shard, has_log_warnings=True)
        assert result == "COMPLETED_WITH_WARNINGS"


# ---------------------------------------------------------------------------
# _parse_iso_dt
# ---------------------------------------------------------------------------


class TestParseIsoDt:
    def test_none_returns_none(self):
        assert _parse_iso_dt(None) is None

    def test_empty_string_returns_none(self):
        assert _parse_iso_dt("") is None

    def test_valid_iso_with_z(self):
        result = _parse_iso_dt("2026-01-15T10:00:00Z")
        assert result is not None
        assert result.tzinfo is not None

    def test_valid_iso_with_offset(self):
        result = _parse_iso_dt("2026-01-15T10:00:00+00:00")
        assert result is not None
        assert result.tzinfo is not None

    def test_naive_datetime_gets_utc(self):
        result = _parse_iso_dt("2026-01-15T10:00:00")
        assert result is not None
        assert result.tzinfo == UTC

    def test_invalid_string_returns_none(self):
        result = _parse_iso_dt("not-a-date")
        assert result is None


# ---------------------------------------------------------------------------
# _build_blob_timestamp_map
# ---------------------------------------------------------------------------


class TestBuildBlobTimestampMap:
    def test_empty_result_returns_empty(self):
        result = _build_blob_timestamp_map({})
        assert result == {}

    def test_extracts_venue_date_timestamps(self):
        now = datetime.now(UTC)
        turbo = {
            "categories": {
                "CEFI": {"_venue_date_blob_timestamps": {"BINANCE": {"2026-01-01": now}}}
            }
        }
        result = _build_blob_timestamp_map(turbo)
        assert "CEFI" in result
        assert "BINANCE" in result["CEFI"]
        assert result["CEFI"]["BINANCE"]["2026-01-01"] == now

    def test_skips_non_dict_categories(self):
        turbo = {"categories": {"CEFI": "not_a_dict"}}
        result = _build_blob_timestamp_map(turbo)
        assert result == {}

    def test_skips_categories_without_timestamp_key(self):
        turbo = {"categories": {"CEFI": {"found_dates": {"2026-01-01"}}}}
        result = _build_blob_timestamp_map(turbo)
        assert result == {}

    def test_none_categories(self):
        turbo = {"categories": None}
        result = _build_blob_timestamp_map(turbo)
        assert result == {}


# ---------------------------------------------------------------------------
# _build_existing_dates_sets
# ---------------------------------------------------------------------------


class TestBuildExistingDatesSets:
    def test_empty_turbo_returns_empty(self):
        cat_dates, venue_dates = _build_existing_dates_sets({})
        assert cat_dates == {}
        assert venue_dates == {}

    def test_dates_found_list_path(self):
        turbo = {"categories": {"CEFI": {"dates_found_list": ["2026-01-01", "2026-01-02"]}}}
        cat_dates, _venue_dates = _build_existing_dates_sets(turbo)
        assert "CEFI" in cat_dates
        assert "2026-01-01" in cat_dates["CEFI"]

    def test_dates_set_fast_path(self):
        date_set = {"2026-01-01", "2026-01-15"}
        turbo = {"categories": {"CEFI": {"_dates_set": date_set}}}
        cat_dates, _venue_dates = _build_existing_dates_sets(turbo)
        assert cat_dates["CEFI"] == date_set

    def test_venue_map_path(self):
        turbo = {
            "categories": {
                "CEFI": {
                    "venues": {
                        "BINANCE": {"dates_found_list": ["2026-01-01"]},
                        "OKX": {"dates_found_list": ["2026-01-02"]},
                    }
                }
            }
        }
        cat_dates, venue_dates = _build_existing_dates_sets(turbo)
        assert "2026-01-01" in cat_dates["CEFI"]
        assert "2026-01-02" in cat_dates["CEFI"]
        assert "BINANCE" in venue_dates["CEFI"]

    def test_error_category_skipped(self):
        turbo = {"categories": {"CEFI": {"error": "bucket missing"}}}
        cat_dates, _venue_dates = _build_existing_dates_sets(turbo)
        assert "CEFI" not in cat_dates

    def test_non_dict_venue_data_skipped(self):
        turbo = {
            "categories": {
                "CEFI": {
                    "venues": {
                        "BINANCE": "not_a_dict",
                    }
                }
            }
        }
        cat_dates, venue_dates = _build_existing_dates_sets(turbo)
        # BINANCE is skipped but CEFI category still exists
        assert "CEFI" in cat_dates
        assert "BINANCE" not in venue_dates.get("CEFI", {})


# ---------------------------------------------------------------------------
# _compute_classification_counts
# ---------------------------------------------------------------------------


class TestComputeClassificationCounts:
    def test_counts_single_class(self):
        classifications = {"s1": "VERIFIED", "s2": "VERIFIED"}
        result = _compute_classification_counts(classifications)
        assert result["VERIFIED"] == 2

    def test_counts_multiple_classes(self):
        classifications = {
            "s1": "VERIFIED",
            "s2": "DATA_MISSING",
            "s3": "INFRA_FAILURE",
            "s4": "VERIFIED",
        }
        result = _compute_classification_counts(classifications)
        assert result["VERIFIED"] == 2
        assert result["DATA_MISSING"] == 1
        assert result["INFRA_FAILURE"] == 1

    def test_empty_returns_empty(self):
        result = _compute_classification_counts({})
        assert result == {}


# ---------------------------------------------------------------------------
# _compute_verified_succeeded_shard_ids
# ---------------------------------------------------------------------------


class TestComputeVerifiedSucceededShardIds:
    def _make_shard(
        self, shard_id, status="succeeded", category="CEFI", venue="", date="2026-01-01"
    ):
        dims: dict[str, object] = {"category": category, "date": date}
        if venue:
            dims["venue"] = venue
        return SimpleNamespace(
            shard_id=shard_id,
            status=status,
            dimensions=dims,
        )

    def _make_state(self, shards):
        return SimpleNamespace(shards=shards)

    def test_verified_when_date_in_cat_dates(self):
        shards = [self._make_shard("s1")]
        state = self._make_state(shards)
        cat_dates = {"CEFI": {"2026-01-01"}}
        venue_dates: dict = {}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, venue_dates)
        assert "s1" in result

    def test_not_verified_when_date_missing(self):
        shards = [self._make_shard("s1")]
        state = self._make_state(shards)
        cat_dates = {"CEFI": {"2026-01-02"}}
        venue_dates: dict = {}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, venue_dates)
        assert "s1" not in result

    def test_verified_with_venue_match(self):
        shards = [self._make_shard("s1", venue="BINANCE")]
        state = self._make_state(shards)
        cat_dates = {"CEFI": {"2026-01-01"}}
        venue_dates = {"CEFI": {"BINANCE": {"2026-01-01"}}}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, venue_dates)
        assert "s1" in result

    def test_not_verified_when_venue_not_in_venue_dates_and_date_not_in_cat(self):
        # OKX is not in venue_dates, so it falls back to cat_dates check
        # cat_dates has a different date -> not verified
        shards = [self._make_shard("s1", venue="OKX", date="2026-01-99")]
        state = self._make_state(shards)
        cat_dates = {"CEFI": {"2026-01-01"}}
        venue_dates = {"CEFI": {"BINANCE": {"2026-01-01"}}}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, venue_dates)
        assert "s1" not in result

    def test_non_succeeded_shards_skipped(self):
        shards = [self._make_shard("s1", status="failed")]
        state = self._make_state(shards)
        cat_dates = {"CEFI": {"2026-01-01"}}
        result = _compute_verified_succeeded_shard_ids(state, cat_dates, {})
        assert "s1" not in result

    def test_empty_state_returns_empty(self):
        state = self._make_state([])
        result = _compute_verified_succeeded_shard_ids(state, {}, {})
        assert result == set()


# ---------------------------------------------------------------------------
# _classify_all_shards
# ---------------------------------------------------------------------------


class TestClassifyAllShards:
    def _make_shard(self, shard_id, status="succeeded"):
        return SimpleNamespace(shard_id=shard_id, status=status, args=[], failure_category=None)

    def _make_state(self, shards):
        return SimpleNamespace(shards=shards)

    def test_classifies_single_succeeded_shard_unverified(self):
        shards = [self._make_shard("s1")]
        state = self._make_state(shards)
        result = _classify_all_shards(state, log_analysis=None)
        assert result["s1"] == "UNVERIFIED"

    def test_classifies_pending_shard_as_never_ran(self):
        shards = [self._make_shard("s1", status="pending")]
        state = self._make_state(shards)
        result = _classify_all_shards(state, log_analysis=None)
        assert result["s1"] == "NEVER_RAN"

    def test_classifies_failed_shard_as_vm_died(self):
        shard = SimpleNamespace(shard_id="s1", status="failed", args=[], failure_category=None)
        state = self._make_state([shard])
        result = _classify_all_shards(state, log_analysis=None)
        assert result["s1"] == "VM_DIED"

    def test_with_blob_data_verified(self):
        shards = [self._make_shard("s1")]
        state = self._make_state(shards)
        blob_data = {"s1": (True, None)}
        result = _classify_all_shards(state, log_analysis=None, blob_data=blob_data)
        assert result["s1"] in ("EXPECTED_SKIP", "VERIFIED")

    def test_with_blob_data_missing(self):
        shards = [self._make_shard("s1")]
        state = self._make_state(shards)
        blob_data = {"s1": (False, None)}
        result = _classify_all_shards(state, log_analysis=None, blob_data=blob_data)
        assert result["s1"] == "DATA_MISSING"

    def test_shard_with_log_errors_from_analysis(self):
        shards = [self._make_shard("s1")]
        state = self._make_state(shards)
        log_analysis = {"errors": [{"shard_id": "s1"}], "warnings": []}
        result = _classify_all_shards(state, log_analysis=log_analysis)
        assert result["s1"] == "COMPLETED_WITH_ERRORS"

    def test_skips_shards_without_shard_id(self):
        shard = SimpleNamespace(shard_id="", status="succeeded", args=[])
        state = self._make_state([shard])
        result = _classify_all_shards(state, log_analysis=None)
        assert result == {}
