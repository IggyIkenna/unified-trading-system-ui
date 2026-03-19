"""
Unit tests for ShardCalculator - Validation.

Tests validation features, limits, and filtering:
- Shard limit enforcement and error handling
- Shard summary generation for reporting
- Skip existing filter functionality
- Error messages and validation logic
"""

from datetime import date
from unittest.mock import MagicMock, patch

import pytest
import yaml

from deployment_service.shard_calculator import (
    ShardCalculator,
    ShardLimitExceeded,
)


class TestShardLimitExceeded:
    """Tests for shard limit enforcement."""

    def test_exceeds_max_shards(
        self, temp_config_with_service, mock_env_vars, shard_limit_test_cases
    ):
        """Test that exceeding max_shards raises exception."""
        calculator = ShardCalculator(str(temp_config_with_service))

        # Find a test case that should fail
        test_case = next(case for case in shard_limit_test_cases if case["should_fail"])

        with pytest.raises(ShardLimitExceeded) as exc_info:
            calculator.calculate_shards(
                service="test-service",
                start_date=test_case["start_date"],
                end_date=test_case["end_date"],
                max_shards=test_case["max_shards"],
            )

        assert exc_info.value.total_shards > test_case["max_shards"]
        assert exc_info.value.max_shards == test_case["max_shards"]
        assert "breakdown" in str(exc_info.value)

    def test_exactly_at_max_shards(
        self, temp_config_with_service, mock_env_vars, shard_limit_test_cases
    ):
        """Test that exactly max_shards is allowed."""
        calculator = ShardCalculator(str(temp_config_with_service))

        # Find a test case that should pass at exactly the limit
        test_case = next(
            case for case in shard_limit_test_cases if case["name"] == "exactly_at_limit"
        )

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=test_case["start_date"],
            end_date=test_case["end_date"],
            max_shards=test_case["max_shards"],
        )

        assert len(shards) == test_case["max_shards"]

    def test_within_limit_passes(
        self, temp_config_with_service, mock_env_vars, shard_limit_test_cases
    ):
        """Test that staying within limit works correctly."""
        calculator = ShardCalculator(str(temp_config_with_service))

        # Find a test case that should pass
        test_case = next(case for case in shard_limit_test_cases if case["name"] == "within_limit")

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=test_case["start_date"],
            end_date=test_case["end_date"],
            max_shards=test_case["max_shards"],
        )

        assert len(shards) < test_case["max_shards"]

    def test_exception_message_includes_breakdown(self, temp_config_with_service, mock_env_vars):
        """Test that exception message includes dimension breakdown."""
        calculator = ShardCalculator(str(temp_config_with_service))

        with pytest.raises(ShardLimitExceeded) as exc_info:
            calculator.calculate_shards(
                service="test-service",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 1, 10),
                max_shards=5,
            )

        error_msg = str(exc_info.value)
        assert "category" in error_msg
        assert "date" in error_msg
        assert "To reduce shards" in error_msg


class TestShardSummary:
    """Tests for shard summary generation."""

    def test_get_shard_summary(self, temp_config_with_service, mock_env_vars):
        """Test summary generation."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
            max_shards=100,
        )

        summary = calculator.get_shard_summary(shards)

        assert summary["service"] == "test-service"
        assert summary["total_shards"] == 9  # 3 days * 3 categories
        assert "category" in summary["breakdown"]
        assert "date" in summary["breakdown"]

    def test_empty_shards_summary(self, temp_config_with_service, mock_env_vars):
        """Test summary for empty shard list."""
        calculator = ShardCalculator(str(temp_config_with_service))

        summary = calculator.get_shard_summary([])

        assert summary["total_shards"] == 0
        assert summary["breakdown"] == {}

    def test_summary_breakdown_accuracy(self, temp_config_with_service, mock_env_vars):
        """Test that summary breakdown accurately reflects actual shards."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 2),
            max_shards=100,
            category=["CEFI", "TRADFI"],  # Only 2 categories
        )

        summary = calculator.get_shard_summary(shards)

        # Should reflect filtered categories (2 not 3)
        assert summary["breakdown"]["category"] == 2
        assert summary["breakdown"]["date"] == 2  # 2 days
        assert summary["total_shards"] == 4  # 2 categories * 2 days


class TestSkipExistingFilter:
    """Tests for the skip_existing functionality that filters out shards with existing data."""

    @pytest.fixture
    def temp_config_for_skip_existing(self, tmp_path):
        """Create a temporary config directory with instruments-service config."""
        config_dir = tmp_path / "configs"
        config_dir.mkdir()

        # Create sharding config for instruments-service
        service_config = {
            "service": "instruments-service",
            "dimensions": [
                {"name": "category", "type": "fixed", "values": ["CEFI", "TRADFI"]},
                {"name": "date", "type": "date_range", "granularity": "daily"},
            ],
            "cli_args": {"category": "--category"},
        }
        with open(config_dir / "sharding.instruments-service.yaml", "w") as f:
            yaml.dump(service_config, f)

        # Create venues config
        venues_config = {
            "categories": {
                "CEFI": {"venues": ["BINANCE-SPOT"]},
                "TRADFI": {"venues": ["NYSE"]},
            }
        }
        with open(config_dir / "venues.yaml", "w") as f:
            yaml.dump(venues_config, f)

        # Create expected_start_dates config
        start_dates_config = {
            "instruments-service": {
                "CEFI": {"category_start": "2020-01-01"},
                "TRADFI": {"category_start": "2020-01-01"},
            }
        }
        with open(config_dir / "expected_start_dates.yaml", "w") as f:
            yaml.dump(start_dates_config, f)

        return config_dir

    def test_skip_existing_false_returns_all_shards(
        self, temp_config_for_skip_existing, mock_env_vars
    ):
        """Test that skip_existing=False returns all shards."""
        calculator = ShardCalculator(str(temp_config_for_skip_existing))

        shards = calculator.calculate_shards(
            service="instruments-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
            max_shards=1000,
            skip_existing=False,
        )

        # Should have 2 categories * 3 days = 6 shards
        assert len(shards) == 6

    @patch("deployment_service.calculators.shard_distribution.get_storage_client")
    def test_skip_existing_true_filters_existing_shards(
        self, mock_get_storage_client, temp_config_for_skip_existing, mock_env_vars
    ):
        """Test that skip_existing=True filters out shards where data exists."""
        # Mock the storage client to simulate some data exists
        mock_client = MagicMock()
        mock_get_storage_client.return_value = mock_client
        mock_bucket = MagicMock()
        mock_client.bucket.return_value = mock_bucket
        mock_blob = MagicMock()
        mock_bucket.blob.return_value = mock_blob

        # Simulate: first 2 shards exist, remaining 4 don't
        mock_blob.exists.side_effect = [True, True, False, False, False, False]

        calculator = ShardCalculator(str(temp_config_for_skip_existing))

        shards = calculator.calculate_shards(
            service="instruments-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
            max_shards=1000,
            skip_existing=True,
        )

        # Should have filtered out shards where data exists
        # With mocked storage, 2 blobs exist so 4 shards should remain
        assert len(shards) == 4

    def test_skip_existing_parameter_in_signature(
        self, temp_config_for_skip_existing, mock_env_vars
    ):
        """Test that skip_existing parameter is accepted by calculate_shards."""
        calculator = ShardCalculator(str(temp_config_for_skip_existing))

        # Should not raise any errors
        shards = calculator.calculate_shards(
            service="instruments-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=1000,
            skip_existing=False,
        )

        assert len(shards) > 0

    @patch("deployment_service.calculators.shard_distribution.get_storage_client")
    def test_skip_existing_with_empty_storage_response(
        self, mock_get_storage_client, temp_config_for_skip_existing, mock_env_vars
    ):
        """Test skip_existing handles storage errors gracefully."""
        # When storage raises an exception, each shard check returns False (not exists)
        # so all shards should be returned
        mock_get_storage_client.side_effect = OSError("Storage unavailable")

        calculator = ShardCalculator(str(temp_config_for_skip_existing))

        shards = calculator.calculate_shards(
            service="instruments-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=1000,
            skip_existing=True,
        )

        # Should fall back to not skipping any shards (storage error = assume doesn't exist)
        assert len(shards) > 0
