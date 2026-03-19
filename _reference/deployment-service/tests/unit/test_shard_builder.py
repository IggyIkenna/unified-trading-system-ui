"""
Unit tests for deployment_service.shard_builder.

Covers:
- build_shard_args: CLI arg construction from shard dimensions
- build_shard_id: unique shard ID generation
- validate_shard_uniqueness: duplicate detection
"""

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.shard_builder import (
    build_shard_args,
    build_shard_id,
    build_storage_env_vars,
    validate_shard_uniqueness,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_shard_dict(dimensions: dict[str, object]) -> dict[str, object]:
    """Create a dict-style shard (no dimensions attribute, relies on dict access)."""
    return {"dimensions": dimensions}


def _make_shard_obj(dimensions: dict[str, object]) -> object:
    """Create an object-style shard with a .dimensions attribute."""

    class _Shard:
        def __init__(self, dims: dict[str, object]) -> None:
            self.dimensions = dims

    return _Shard(dimensions)


def _simple_config(
    cli_args: dict[str, object] | None = None,
    cli_flags: dict[str, object] | None = None,
    cli_defaults: dict[str, object] | None = None,
    cli_optional: list[object] | None = None,
) -> dict[str, object]:
    return {
        "service": "test-service",
        "cli_args": cli_args or {},
        "cli_flags": cli_flags or {},
        "cli_defaults": cli_defaults or {},
        "cli_optional": cli_optional or [],
    }


# ===========================================================================
# build_shard_args — basic dimension handling
# ===========================================================================


class TestBuildShardArgsBasic:
    @pytest.mark.unit
    def test_empty_dimensions_returns_empty(self):
        shard = _make_shard_dict({})
        config = _simple_config()
        result = build_shard_args(shard, config)
        assert result == []

    @pytest.mark.unit
    def test_simple_string_dimension(self):
        shard = _make_shard_dict({"category": "CEFI"})
        config = _simple_config(cli_args={"category": "--category"})
        result = build_shard_args(shard, config)
        assert "--category" in result
        assert "CEFI" in result

    @pytest.mark.unit
    def test_list_dimension_adds_multiple_flags(self):
        shard = _make_shard_dict({"category": ["CEFI", "TRADFI"]})
        config = _simple_config(cli_args={"category": "--category"})
        result = build_shard_args(shard, config)
        assert result.count("--category") == 2
        assert "CEFI" in result
        assert "TRADFI" in result

    @pytest.mark.unit
    def test_dim_with_no_cli_mapping_skipped(self):
        shard = _make_shard_dict({"unknown_dim": "some-value"})
        config = _simple_config(cli_args={})
        result = build_shard_args(shard, config)
        assert result == []

    @pytest.mark.unit
    def test_object_style_shard_dimensions_read(self):
        shard = _make_shard_obj({"category": "TRADFI"})
        config = _simple_config(cli_args={"category": "--category"})
        result = build_shard_args(shard, config)
        assert "--category" in result
        assert "TRADFI" in result


# ===========================================================================
# build_shard_args — date dimension
# ===========================================================================


class TestBuildShardArgsDate:
    @pytest.mark.unit
    def test_date_range_uses_start_end_args(self):
        shard = _make_shard_dict({"date": {"start": "2024-01-01", "end": "2024-01-07"}})
        config = _simple_config(cli_args={"start_date": "--start-date", "end_date": "--end-date"})
        result = build_shard_args(shard, config)
        assert "--start-date" in result
        assert "2024-01-01" in result
        assert "--end-date" in result
        assert "2024-01-07" in result

    @pytest.mark.unit
    def test_single_date_mode(self):
        shard = _make_shard_dict({"date": {"start": "2024-01-15", "end": "2024-01-15"}})
        config = _simple_config(cli_args={"date": "--date"})
        result = build_shard_args(shard, config)
        assert "--date" in result
        assert "2024-01-15" in result

    @pytest.mark.unit
    def test_date_type_none_skipped(self):
        shard = _make_shard_dict({"date": {"type": "none"}})
        config = _simple_config(cli_args={"date": "--date"})
        result = build_shard_args(shard, config)
        assert "--date" not in result

    @pytest.mark.unit
    def test_start_arg_iso_format(self):
        """Services with --start use ISO datetime format."""
        shard = _make_shard_dict({"date": {"start": "2024-03-01", "end": "2024-03-31"}})
        config = _simple_config(cli_args={"start_date": "--start", "end_date": "--end"})
        result = build_shard_args(shard, config)
        assert "2024-03-01T00:00:00Z" in result
        assert "2024-03-31T23:59:59Z" in result


# ===========================================================================
# build_shard_args — boolean flag pattern (--CEFI/--TRADFI style)
# ===========================================================================


class TestBuildShardArgsBooleanFlag:
    @pytest.mark.unit
    def test_boolean_flag_matching(self):
        shard = _make_shard_dict({"category": "CEFI"})
        config = _simple_config(cli_args={"category": "--CEFI/--TRADFI/--DEFI"})
        result = build_shard_args(shard, config)
        assert "--CEFI" in result
        assert "--TRADFI" not in result

    @pytest.mark.unit
    def test_boolean_flag_no_match_adds_nothing(self):
        shard = _make_shard_dict({"category": "ONCHAIN"})
        config = _simple_config(cli_args={"category": "--CEFI/--TRADFI/--DEFI"})
        result = build_shard_args(shard, config)
        assert "--CEFI" not in result
        assert "--TRADFI" not in result
        assert "--DEFI" not in result


# ===========================================================================
# build_shard_args — cli_flags, cli_defaults, extra_options
# ===========================================================================


class TestBuildShardArgsExtras:
    @pytest.mark.unit
    def test_cli_flags_prepended(self):
        shard = _make_shard_dict({})
        config = _simple_config(cli_flags={"mode": "--mode batch"})
        result = build_shard_args(shard, config)
        assert "--mode" in result
        assert "batch" in result

    @pytest.mark.unit
    def test_cli_defaults_appended(self):
        shard = _make_shard_dict({})
        config = _simple_config(cli_defaults={"log-level": "INFO"})
        result = build_shard_args(shard, config)
        assert "--log-level" in result
        assert "INFO" in result

    @pytest.mark.unit
    def test_force_flag_added(self):
        shard = _make_shard_dict({})
        config = _simple_config()
        result = build_shard_args(shard, config, extra_options={"force": True})
        assert "--force" in result

    @pytest.mark.unit
    def test_log_level_override(self):
        shard = _make_shard_dict({})
        config = _simple_config()
        result = build_shard_args(shard, config, extra_options={"log_level": "DEBUG"})
        assert "--log-level" in result
        assert "DEBUG" in result

    @pytest.mark.unit
    def test_max_workers_injected_when_accepted(self):
        shard = _make_shard_dict({})
        config: dict[str, object] = {
            "service": "test-service",
            "cli_args": {},
            "cli_flags": {},
            "cli_defaults": {},
            "cli_optional": [{"name": "max-workers"}],
        }
        result = build_shard_args(shard, config, extra_options={"max_workers": 4})
        assert "--max-workers" in result
        assert "4" in result

    @pytest.mark.unit
    def test_max_workers_ignored_when_not_accepted(self):
        shard = _make_shard_dict({})
        config = _simple_config()  # no cli_optional
        result = build_shard_args(shard, config, extra_options={"max_workers": 4})
        assert "--max-workers" not in result

    @pytest.mark.unit
    def test_extra_args_string_split(self):
        shard = _make_shard_dict({})
        config = _simple_config()
        result = build_shard_args(
            shard, config, extra_options={"extra_args": "--verbose --retry 3"}
        )
        assert "--verbose" in result
        assert "--retry" in result
        assert "3" in result

    @pytest.mark.unit
    def test_extra_args_malformed_falls_back_to_split(self):
        shard = _make_shard_dict({})
        config = _simple_config()
        # unclosed quote — shlex will raise, falls back to .split()
        result = build_shard_args(shard, config, extra_options={"extra_args": "--flag value"})
        assert "--flag" in result

    @pytest.mark.unit
    def test_none_extra_options(self):
        shard = _make_shard_dict({})
        config = _simple_config()
        result = build_shard_args(shard, config, extra_options=None)
        assert result == []


# ===========================================================================
# build_shard_id
# ===========================================================================


class TestBuildShardId:
    @pytest.mark.unit
    def test_basic_string_dimensions(self):
        shard = _make_shard_dict({"category": "CEFI", "venue": "BINANCE"})
        result = build_shard_id(shard, index=0)
        assert "CEFI" in result
        assert "BINANCE" in result

    @pytest.mark.unit
    def test_date_dimension_uses_start(self):
        shard = _make_shard_dict({"date": {"start": "2024-01-15", "end": "2024-01-21"}})
        result = build_shard_id(shard, index=0)
        assert "2024-01-15" in result

    @pytest.mark.unit
    def test_date_type_none_produces_bulk(self):
        shard = _make_shard_dict({"date": {"type": "none"}})
        result = build_shard_id(shard, index=0)
        assert result == "bulk"

    @pytest.mark.unit
    def test_list_dimension_joined(self):
        shard = _make_shard_dict({"tags": ["alpha", "beta"]})
        result = build_shard_id(shard, index=5)
        assert "alpha_beta" in result

    @pytest.mark.unit
    def test_empty_dimensions_fallback_to_index(self):
        shard = _make_shard_dict({})
        result = build_shard_id(shard, index=7)
        assert result == "shard_7"

    @pytest.mark.unit
    def test_object_shard_dimensions_used(self):
        shard = _make_shard_obj({"category": "DEFI"})
        result = build_shard_id(shard, index=0)
        assert "DEFI" in result

    @pytest.mark.unit
    def test_multiple_dimensions_joined_with_underscore(self):
        shard = _make_shard_dict(
            {
                "category": "CEFI",
                "date": {"start": "2024-01-01", "end": "2024-01-07"},
            }
        )
        result = build_shard_id(shard, index=0)
        assert "_" in result
        assert "CEFI" in result
        assert "2024-01-01" in result


# ===========================================================================
# validate_shard_uniqueness
# ===========================================================================


class TestValidateShardUniqueness:
    @pytest.mark.unit
    def test_empty_shards_no_error(self):
        config = _simple_config(cli_args={"category": "--category"})
        # Should not raise
        validate_shard_uniqueness([], config)

    @pytest.mark.unit
    def test_unique_shards_no_error(self):
        shards = [
            _make_shard_dict({"category": "CEFI"}),
            _make_shard_dict({"category": "TRADFI"}),
        ]
        config = _simple_config(cli_args={"category": "--category"})
        # Should not raise
        validate_shard_uniqueness(shards, config)

    @pytest.mark.unit
    def test_duplicate_shards_raises_value_error(self):
        shards = [
            _make_shard_dict({"category": "CEFI"}),
            _make_shard_dict({"category": "CEFI"}),  # duplicate
        ]
        config = _simple_config(cli_args={"category": "--category"})
        with pytest.raises(ValueError, match="DUPLICATE"):
            validate_shard_uniqueness(shards, config)

    @pytest.mark.unit
    def test_error_message_contains_shard_ids(self):
        shards = [
            _make_shard_dict({"category": "CEFI"}),
            _make_shard_dict({"category": "CEFI"}),
        ]
        config = _simple_config(cli_args={"category": "--category"})
        with pytest.raises(ValueError) as exc_info:
            validate_shard_uniqueness(shards, config)
        assert "CEFI" in str(exc_info.value)

    @pytest.mark.unit
    def test_different_extra_options_produce_unique_args(self):
        """Shards with identical dims but different extra_options should not raise."""
        shards = [
            _make_shard_dict({"category": "CEFI"}),
            _make_shard_dict({"category": "TRADFI"}),
        ]
        config = _simple_config(cli_args={"category": "--category"})
        # No duplicate — should pass
        validate_shard_uniqueness(shards, config, extra_options={"force": True})

    @pytest.mark.unit
    def test_single_shard_no_error(self):
        shards = [_make_shard_dict({"category": "CEFI"})]
        config = _simple_config(cli_args={"category": "--category"})
        validate_shard_uniqueness(shards, config)

    @pytest.mark.unit
    def test_three_shards_with_two_duplicates(self):
        shards = [
            _make_shard_dict({"category": "CEFI"}),
            _make_shard_dict({"category": "TRADFI"}),
            _make_shard_dict({"category": "CEFI"}),  # dup of first
        ]
        config = _simple_config(cli_args={"category": "--category"})
        with pytest.raises(ValueError):
            validate_shard_uniqueness(shards, config)


# ===========================================================================
# Edge cases: combined scenarios
# ===========================================================================


class TestShardBuilderEdgeCases:
    @pytest.mark.unit
    def test_category_and_date_in_same_shard(self):
        shard = _make_shard_dict(
            {
                "category": "DEFI",
                "date": {"start": "2024-03-01", "end": "2024-03-07"},
            }
        )
        config = _simple_config(
            cli_args={
                "category": "--category",
                "start_date": "--start-date",
                "end_date": "--end-date",
            }
        )
        result = build_shard_args(shard, config)
        assert "--category" in result
        assert "DEFI" in result
        assert "--start-date" in result
        assert "2024-03-01" in result

    @pytest.mark.unit
    def test_boolean_flag_case_insensitive(self):
        shard = _make_shard_dict({"category": "cefi"})
        config = _simple_config(cli_args={"category": "--CEFI/--TRADFI"})
        result = build_shard_args(shard, config)
        assert "--CEFI" in result

    @pytest.mark.unit
    def test_build_shard_id_consistent_with_multiple_calls(self):
        """Shard ID should be deterministic."""
        shard = _make_shard_dict({"category": "CEFI", "venue": "NYSE"})
        id1 = build_shard_id(shard, index=0)
        id2 = build_shard_id(shard, index=0)
        assert id1 == id2


def test_build_shard_args_shlex_fallback():
    """Test that invalid shlex syntax falls back to simple split (lines 158-160)."""
    from deployment_service.shard_builder import build_shard_args

    shard = {"dimensions": {"date": "2024-01-01"}}
    service_config: dict = {"cli_args": {}, "cli_flags": {}, "cli_defaults": {}}
    # Unclosed quote causes shlex.split to raise ValueError → fallback to .split()
    args = build_shard_args(shard, service_config, extra_options={"extra_args": '--flag "unclosed'})
    # Falls back to split(" "), so args should contain the raw tokens
    assert "--flag" in args


# ---------------------------------------------------------------------------
# build_storage_env_vars
# ---------------------------------------------------------------------------


class TestBuildStorageEnvVars:
    """Tests for build_storage_env_vars — bucket env var injection at shard launch."""

    def _mock_loader(self, bucket_name: str = "test-bucket") -> MagicMock:
        loader = MagicMock()
        loader.get_bucket_name.return_value = bucket_name
        return loader

    @pytest.mark.unit
    def test_known_service_with_category_injects_bucket(self):
        loader = self._mock_loader("features-delta-one-cefi-staging-myproject")
        with patch("deployment_service.shard_builder.ConfigLoader", return_value=loader):
            result = build_storage_env_vars("features-delta-one-service", {"category": "CEFI"})
        assert result == {
            "FEATURES_DELTA_ONE_CEFI_GCS_BUCKET": "features-delta-one-cefi-staging-myproject"
        }
        loader.get_bucket_name.assert_called_once_with("features-delta-one", "CEFI")

    @pytest.mark.unit
    def test_unknown_service_returns_empty_dict(self):
        with patch("deployment_service.shard_builder.ConfigLoader") as mock_cls:
            result = build_storage_env_vars("unknown-service", {"category": "CEFI"})
        mock_cls.assert_not_called()
        assert result == {}

    @pytest.mark.unit
    def test_no_category_dimension_uses_shared_bucket_name(self):
        loader = self._mock_loader("ml-models-store-staging-myproject")
        with patch("deployment_service.shard_builder.ConfigLoader", return_value=loader):
            result = build_storage_env_vars("ml-training-service", {})
        # ml-training-service has two domains; both injected with no category suffix
        assert "ML_MODELS_STORE_GCS_BUCKET" in result
        assert "ML_CONFIGS_STORE_GCS_BUCKET" in result

    @pytest.mark.unit
    def test_empty_bucket_name_from_loader_is_skipped(self):
        loader = self._mock_loader("")
        with patch("deployment_service.shard_builder.ConfigLoader", return_value=loader):
            result = build_storage_env_vars("features-delta-one-service", {"category": "CEFI"})
        assert result == {}

    @pytest.mark.unit
    def test_category_uppercased_in_env_key(self):
        loader = self._mock_loader("strategy-store-tradfi-prod-myproject")
        with patch("deployment_service.shard_builder.ConfigLoader", return_value=loader):
            result = build_storage_env_vars("strategy-service", {"category": "tradfi"})
        assert "STRATEGY_STORE_TRADFI_GCS_BUCKET" in result
        loader.get_bucket_name.assert_called_once_with("strategy-store", "TRADFI")
