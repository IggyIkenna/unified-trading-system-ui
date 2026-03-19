"""
Unit tests for deployments_helpers module.

Tests cover pure helper functions for env var building, shard signature extraction,
status string conversion, severity extraction, and date range parsing.
"""

from unittest.mock import MagicMock

from deployment_api.routes.deployments_helpers import (
    _extract_date_range,
    _extract_severity_and_logger,
    _extract_shard_signature,
    _get_verification_cache,
    _maybe_add_direct_gcs,
    _set_verification_cache,
    _status_str,
    build_deploy_env_vars,
    find_duplicate_running_shards,
)


class TestBuildDeployEnvVars:
    """Tests for build_deploy_env_vars."""

    def test_required_fields_present(self):
        env = build_deploy_env_vars("instruments-service", "proj-123", "dep-abc", 4)
        assert env["SERVICE_NAME"] == "instruments-service"
        assert env["PROJECT_ID"] == "proj-123"
        assert env["DEPLOYMENT_ID"] == "dep-abc"
        assert env["MAX_CONCURRENT"] == "4"

    def test_default_deployment_mode(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 2)
        assert env["DEPLOYMENT_MODE"] == "vm"

    def test_custom_deployment_mode(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 2, deployment_mode="cloud-run")
        assert env["DEPLOYMENT_MODE"] == "cloud-run"

    def test_shard_id_optional(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1)
        assert "SHARD_ID" not in env

    def test_shard_id_added_when_provided(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1, shard_id="shard-0")
        assert env["SHARD_ID"] == "shard-0"

    def test_direct_gcs_not_set_by_default(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1)
        assert "ENABLE_DIRECT_GCS" not in env

    def test_direct_gcs_set_when_enabled(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1, enable_direct_gcs=True)
        assert env["ENABLE_DIRECT_GCS"] == "true"

    # ── Runtime topology env vars (Stream 3) ──────────────────────────────────

    def test_runtime_mode_default_is_batch(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1)
        assert env["RUNTIME_MODE"] == "batch"

    def test_runtime_mode_live(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1, deploy_mode="live")
        assert env["RUNTIME_MODE"] == "live"

    def test_cloud_provider_default_is_gcp(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1)
        assert env["CLOUD_PROVIDER"] == "gcp"

    def test_cloud_provider_aws(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1, cloud_provider="aws")
        assert env["CLOUD_PROVIDER"] == "aws"

    def test_operational_mode_not_injected_when_empty(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1, operational_mode="")
        assert "OPERATIONAL_MODE" not in env

    def test_operational_mode_injected_when_set(self):
        env = build_deploy_env_vars("svc", "proj", "dep", 1, operational_mode="train_phase1")
        assert env["OPERATIONAL_MODE"] == "train_phase1"

    def test_operational_mode_execute(self):
        env = build_deploy_env_vars(
            "execution-service", "proj", "dep", 1, operational_mode="execute"
        )
        assert env["OPERATIONAL_MODE"] == "execute"

    def test_all_runtime_topology_vars_together(self):
        env = build_deploy_env_vars(
            "ml-training-service",
            "my-project",
            "dep-001",
            50,
            deployment_mode="vm",
            deploy_mode="batch",
            operational_mode="train_phase2",
            cloud_provider="gcp",
        )
        assert env["RUNTIME_MODE"] == "batch"
        assert env["OPERATIONAL_MODE"] == "train_phase2"
        assert env["CLOUD_PROVIDER"] == "gcp"
        assert env["DEPLOYMENT_MODE"] == "vm"
        assert env["SERVICE_NAME"] == "ml-training-service"


class TestMaybeAddDirectGcs:
    """Tests for _maybe_add_direct_gcs."""

    def test_adds_direct_gcs_for_market_tick(self):
        env: dict[str, str] = {}
        result = _maybe_add_direct_gcs("market-tick-data-handler", env)
        assert result["ENABLE_DIRECT_GCS"] == "true"

    def test_adds_direct_gcs_for_processing(self):
        env: dict[str, str] = {}
        result = _maybe_add_direct_gcs("market-data-processing-service", env)
        assert result["ENABLE_DIRECT_GCS"] == "true"

    def test_adds_direct_gcs_for_features_delta_one(self):
        env: dict[str, str] = {}
        result = _maybe_add_direct_gcs("features-delta-one-service", env)
        assert result["ENABLE_DIRECT_GCS"] == "true"

    def test_does_not_add_for_other_services(self):
        env: dict[str, str] = {}
        result = _maybe_add_direct_gcs("instruments-service", env)
        assert "ENABLE_DIRECT_GCS" not in result

    def test_adds_gcs_config_when_present(self):
        env: dict[str, str] = {}
        config = {"gcs_config": {"bucket_prefix": "test"}}
        result = _maybe_add_direct_gcs("market-tick-data-handler", env, deployment_config=config)
        assert "GCS_BUCKET_PREFIX" in result
        assert result["GCS_BUCKET_PREFIX"] == "test"

    def test_no_gcs_config_no_extra_vars(self):
        env: dict[str, str] = {}
        result = _maybe_add_direct_gcs("market-tick-data-handler", env, deployment_config={})
        assert "ENABLE_DIRECT_GCS" in result
        # No extra GCS_ vars beyond what we set explicitly
        gcs_keys = [k for k in result if k.startswith("GCS_")]
        assert len(gcs_keys) == 0


class TestExtractShardSignature:
    """Tests for _extract_shard_signature."""

    def test_basic_signature_with_dates(self):
        args = ["--start-date", "2024-01-01", "--end-date", "2024-01-31"]
        sig = _extract_shard_signature("instruments-service", args)
        assert sig is not None
        assert "start:2024-01-01" in sig
        assert "end:2024-01-31" in sig
        assert "instruments-service" in sig

    def test_signature_with_category(self):
        args = ["--start-date", "2024-01-01", "--category", "CEFI"]
        sig = _extract_shard_signature("instruments-service", args)
        assert sig is not None
        assert "cat:CEFI" in sig

    def test_signature_with_venue(self):
        args = ["--venue", "BINANCE", "--start-date", "2024-01-01"]
        sig = _extract_shard_signature("instruments-service", args)
        assert sig is not None
        assert "venue:BINANCE" in sig

    def test_empty_args_returns_none(self):
        assert _extract_shard_signature("svc", []) is None

    def test_no_known_flags_returns_none(self):
        # Only service prefix, nothing else
        args = ["--unknown-flag", "value"]
        sig = _extract_shard_signature("svc", args)
        assert sig is None

    def test_none_args_returns_none(self):
        assert _extract_shard_signature("svc", None) is None  # type: ignore[arg-type]


class TestStatusStr:
    """Tests for _status_str."""

    def test_string_passthrough(self):
        assert _status_str("running") == "running"

    def test_dict_extracts_status(self):
        assert _status_str({"status": "completed"}) == "completed"

    def test_dict_missing_status_returns_unknown(self):
        assert _status_str({}) == "unknown"

    def test_object_with_status_attr(self):
        class FakeStatus:
            status = "failed"

        assert _status_str(FakeStatus()) == "failed"

    def test_other_type_stringified(self):
        assert _status_str(42) == "42"


class TestExtractSeverityAndLogger:
    """Tests for _extract_severity_and_logger."""

    def test_python_logging_format(self):
        severity, log_name = _extract_severity_and_logger("ERROR:mymodule:message")
        assert severity == "ERROR"
        assert log_name == "mymodule"

    def test_warning_level(self):
        severity, _ = _extract_severity_and_logger("WARNING:app:something went wrong")
        assert severity == "WARNING"

    def test_json_logging(self):
        import json

        line = json.dumps({"level": "error", "logger": "myservice", "msg": "oops"})
        severity, log_name = _extract_severity_and_logger(line)
        assert severity == "ERROR"
        assert log_name == "myservice"

    def test_json_with_name_field(self):
        import json

        line = json.dumps({"level": "warning", "name": "mymodule"})
        severity, log_name = _extract_severity_and_logger(line)
        assert severity == "WARNING"
        assert log_name == "mymodule"

    def test_severity_alias_warn_in_json(self):
        import json

        # Aliases apply for JSON logging level field
        line = json.dumps({"level": "WARN", "msg": "warn message"})
        severity, _ = _extract_severity_and_logger(line)
        assert severity == "WARNING"

    def test_severity_alias_err_in_json(self):
        import json

        line = json.dumps({"level": "ERR", "msg": "error message"})
        severity, _ = _extract_severity_and_logger(line)
        assert severity == "ERROR"

    def test_severity_alias_fatal_in_json(self):
        import json

        line = json.dumps({"level": "FATAL", "msg": "fatal error"})
        severity, _ = _extract_severity_and_logger(line)
        assert severity == "CRITICAL"

    def test_default_info(self):
        severity, _ = _extract_severity_and_logger("some plain log line")
        assert severity == "INFO"

    def test_invalid_json_does_not_raise(self):
        severity, _ = _extract_severity_and_logger("{invalid json}")
        assert severity == "INFO"


class TestExtractDateRange:
    """Tests for _extract_date_range."""

    def test_single_date(self):
        start, end = _extract_date_range("2024-01-15")
        assert start == "2024-01-15"
        assert end == "2024-01-15"

    def test_comma_separated_range(self):
        start, end = _extract_date_range("2024-01-01,2024-01-31")
        assert start == "2024-01-01"
        assert end == "2024-01-31"

    def test_to_separated_range(self):
        start, end = _extract_date_range("2024-01-01 to 2024-01-31")
        assert start == "2024-01-01"
        assert end == "2024-01-31"

    def test_relative_last_7_days(self):
        start, end = _extract_date_range("last-7-days")
        assert start is not None
        assert end is not None
        # end should be today
        from datetime import UTC, datetime

        today = datetime.now(UTC).strftime("%Y-%m-%d")
        assert end == today

    def test_none_returns_none_none(self):
        start, end = _extract_date_range(None)
        assert start is None
        assert end is None

    def test_empty_string_returns_none(self):
        start, end = _extract_date_range("")
        assert start is None
        assert end is None

    def test_invalid_format_returns_none(self):
        start, end = _extract_date_range("not-a-date")
        assert start is None
        assert end is None

    def test_invalid_relative_format_returns_none(self):
        start, end = _extract_date_range("last-xyz-days")
        assert start is None
        assert end is None


class TestVerificationCache:
    """Tests for _get_verification_cache and _set_verification_cache."""

    def setup_method(self):
        # Clear the cache before each test
        from deployment_api.routes import deployments_helpers

        deployments_helpers._verification_cache.clear()

    def test_miss_returns_none(self):
        assert _get_verification_cache("dep-123") is None

    def test_set_then_get(self):
        data = {"status": "verified", "output_exists": True}
        _set_verification_cache("dep-456", data)
        result = _get_verification_cache("dep-456")
        assert result == data

    def test_expired_returns_none(self):
        import time

        from deployment_api.routes import deployments_helpers

        data = {"status": "old"}
        _set_verification_cache("dep-999", data)
        # Manually set old timestamp
        deployments_helpers._verification_cache["dep-999"]["timestamp"] = time.time() - 400
        result = _get_verification_cache("dep-999")
        assert result is None

    def test_different_ids_independent(self):
        _set_verification_cache("dep-A", {"a": 1})
        _set_verification_cache("dep-B", {"b": 2})
        assert _get_verification_cache("dep-A") == {"a": 1}
        assert _get_verification_cache("dep-B") == {"b": 2}


class TestFindDuplicateRunningShards:
    """Tests for find_duplicate_running_shards."""

    def _make_state_manager(self, active_deployments=None, shards=None):
        sm = MagicMock()
        sm.list_deployments.return_value = active_deployments or []
        sm.get_deployment_shards.return_value = shards or []
        return sm

    def test_returns_empty_list_when_no_active_deployments(self):
        sm = self._make_state_manager(active_deployments=[])
        result = find_duplicate_running_shards(sm, "svc", "dep-1", [["--start-date", "2024-01-01"]])
        assert result == []

    def test_skips_self_deployment(self):
        active = [{"deployment_id": "dep-1", "status": "running"}]
        sm = self._make_state_manager(active_deployments=active)
        shard_args = [["--start-date", "2024-01-01"]]
        result = find_duplicate_running_shards(sm, "svc", "dep-1", shard_args)
        assert result == []

    def test_returns_conflict_when_signatures_match(self):
        active = [{"deployment_id": "dep-2", "status": "running", "started_at": "2024-01-01"}]
        active_shard = {
            "shard_id": "s-1",
            "args": ["--start-date", "2024-01-01", "--end-date", "2024-01-31"],
        }
        sm = self._make_state_manager(active_deployments=active, shards=[active_shard])
        shard_args = [["--start-date", "2024-01-01", "--end-date", "2024-01-31"]]
        result = find_duplicate_running_shards(sm, "instruments-service", "dep-1", shard_args)
        assert len(result) == 1
        assert result[0]["deployment_id"] == "dep-2"

    def test_no_conflict_when_signatures_differ(self):
        active = [{"deployment_id": "dep-2", "status": "running", "started_at": "2024-01-01"}]
        active_shard = {
            "shard_id": "s-1",
            "args": ["--start-date", "2024-02-01", "--end-date", "2024-02-28"],
        }
        sm = self._make_state_manager(active_deployments=active, shards=[active_shard])
        shard_args = [["--start-date", "2024-01-01", "--end-date", "2024-01-31"]]
        result = find_duplicate_running_shards(sm, "instruments-service", "dep-1", shard_args)
        assert result == []

    def test_returns_empty_list_on_exception(self):
        sm = MagicMock()
        sm.list_deployments.side_effect = RuntimeError("connection failed")
        result = find_duplicate_running_shards(sm, "svc", "dep-1", [["--start-date", "2024-01-01"]])
        assert result == []

    def test_no_conflict_when_shard_has_no_matchable_signature(self):
        active = [{"deployment_id": "dep-2", "status": "running", "started_at": "2024-01-01"}]
        active_shard = {"shard_id": "s-1", "args": []}
        sm = self._make_state_manager(active_deployments=active, shards=[active_shard])
        shard_args = [["--start-date", "2024-01-01"]]
        result = find_duplicate_running_shards(sm, "instruments-service", "dep-1", shard_args)
        assert result == []
