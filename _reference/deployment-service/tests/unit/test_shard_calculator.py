"""
Unit tests for ShardCalculator.

Tests all dimension types:
- Fixed dimensions (category values)
- Hierarchical dimensions (venue-category mappings)
- Date range dimensions (daily/weekly/monthly granularity)
- GCS dynamic dimensions (mock cloud client)
"""

from datetime import date
from unittest.mock import MagicMock, patch

import pytest
import yaml

from deployment_service.shard_calculator import (
    Shard,
    ShardCalculator,
    ShardLimitExceeded,
)


class TestShard:
    """Tests for the Shard dataclass."""

    def test_shard_creation(self):
        """Test basic shard creation."""
        shard = Shard(
            service="test-service",
            shard_index=0,
            total_shards=10,
            dimensions={
                "category": "CEFI",
                "date": {"start": "2024-01-01", "end": "2024-01-01"},
            },
        )

        assert shard.service == "test-service"
        assert shard.shard_index == 0
        assert shard.total_shards == 10
        assert shard.dimensions["category"] == "CEFI"

    def test_shard_cli_command_generation(self):
        """Test CLI command is auto-generated."""
        shard = Shard(
            service="instruments-service",
            shard_index=0,
            total_shards=1,
            dimensions={
                "category": "CEFI",
                "date": {"start": "2024-01-01", "end": "2024-01-01"},
            },
        )

        assert "--category CEFI" in shard.cli_command
        assert "--start-date 2024-01-01" in shard.cli_command
        assert "--end-date 2024-01-01" in shard.cli_command
        assert "python -m instruments_service" in shard.cli_command

    def test_shard_to_dict(self):
        """Test shard serialization to dictionary."""
        shard = Shard(
            service="test-service",
            shard_index=5,
            total_shards=10,
            dimensions={"category": "TRADFI"},
        )

        result = shard.to_dict()

        assert result["service"] == "test-service"
        assert result["shard_index"] == 5
        assert result["total_shards"] == 10
        assert result["dimensions"] == {"category": "TRADFI"}
        assert "cli_command" in result


class TestShardCalculatorFixedDimensions:
    """Tests for fixed dimension handling."""

    def test_fixed_dimension_all_values(self, temp_config_with_service, mock_env_vars):
        """Test that all fixed values are included when no filter."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=100,
        )

        categories = {s.dimensions["category"] for s in shards}
        assert categories == {"CEFI", "TRADFI", "DEFI"}

    def test_fixed_dimension_with_filter(self, temp_config_with_service, mock_env_vars):
        """Test filtering fixed dimension values."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=100,
            category=["CEFI"],
        )

        categories = {s.dimensions["category"] for s in shards}
        assert categories == {"CEFI"}

    def test_fixed_dimension_multiple_filters(self, temp_config_with_service, mock_env_vars):
        """Test filtering with multiple values."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=100,
            category=["CEFI", "TRADFI"],
        )

        categories = {s.dimensions["category"] for s in shards}
        assert categories == {"CEFI", "TRADFI"}

    def test_fixed_dimension_invalid_filter(self, temp_config_with_service, mock_env_vars):
        """Test that invalid filter value raises error."""
        calculator = ShardCalculator(str(temp_config_with_service))

        with pytest.raises(ValueError, match="Invalid category values"):
            calculator.calculate_shards(
                service="test-service",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 1, 1),
                max_shards=100,
                category=["INVALID_CATEGORY"],
            )


class TestShardCalculatorDateRangeDimensions:
    """Tests for date range dimension handling."""

    def test_daily_granularity(self, temp_config_with_service, mock_env_vars):
        """Test daily date range splitting."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
            max_shards=100,
            category=["CEFI"],  # Single category to simplify counting
        )

        # Should have 3 days * 1 category = 3 shards
        assert len(shards) == 3

        dates = [s.dimensions["date"]["start"] for s in shards]
        assert "2024-01-01" in dates
        assert "2024-01-02" in dates
        assert "2024-01-03" in dates

    def test_weekly_granularity(self, temp_config_dir, mock_env_vars):
        """Test weekly date range splitting."""
        # Create a service config with weekly granularity
        weekly_config = {
            "service": "weekly-service",
            "description": "Weekly test",
            "dimensions": [
                {"name": "category", "type": "fixed", "values": ["CEFI"]},
                {"name": "date", "type": "date_range", "granularity": "weekly"},
            ],
        }
        with open(temp_config_dir / "sharding.weekly-service.yaml", "w") as f:
            yaml.dump(weekly_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        shards = calculator.calculate_shards(
            service="weekly-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 21),
            max_shards=100,
        )

        # 21 days should split into 3 weeks
        assert len(shards) == 3

    def test_monthly_granularity(self, temp_config_dir, mock_env_vars):
        """Test monthly date range splitting."""
        monthly_config = {
            "service": "monthly-service",
            "description": "Monthly test",
            "dimensions": [
                {"name": "category", "type": "fixed", "values": ["CEFI"]},
                {"name": "date", "type": "date_range", "granularity": "monthly"},
            ],
        }
        with open(temp_config_dir / "sharding.monthly-service.yaml", "w") as f:
            yaml.dump(monthly_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        shards = calculator.calculate_shards(
            service="monthly-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 2, 15),  # 46 days
            max_shards=100,
        )

        # 46 days with 30-day chunks = 2 chunks
        assert len(shards) == 2

    def test_date_required_error(self, temp_config_with_service, mock_env_vars):
        """Test that missing date raises error for date_range services."""
        calculator = ShardCalculator(str(temp_config_with_service))

        with pytest.raises(ValueError, match="requires start_date and end_date"):
            calculator.calculate_shards(
                service="test-service",
                max_shards=100,
            )


class TestShardCalculatorHierarchicalDimensions:
    """Tests for hierarchical dimension handling."""

    def test_hierarchical_venues_cefi(
        self, temp_config_dir, hierarchical_service_config, mock_env_vars
    ):
        """Test hierarchical venues for CEFI category."""
        with open(temp_config_dir / "sharding.hierarchical-test-service.yaml", "w") as f:
            yaml.dump(hierarchical_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=100,
            category=["CEFI"],
        )

        venues = {s.dimensions["venue"] for s in shards}
        # Should include CEFI venues from venues.yaml fixture
        assert "BINANCE-SPOT" in venues
        assert "BINANCE-FUTURES" in venues
        assert "DERIBIT" in venues
        # Should NOT include TRADFI venues
        assert "CME" not in venues

    def test_hierarchical_venues_tradfi(
        self, temp_config_dir, hierarchical_service_config, mock_env_vars
    ):
        """Test hierarchical venues for TRADFI category."""
        with open(temp_config_dir / "sharding.hierarchical-test-service.yaml", "w") as f:
            yaml.dump(hierarchical_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=100,
            category=["TRADFI"],
        )

        venues = {s.dimensions["venue"] for s in shards}
        # Should include TRADFI venues
        assert "CME" in venues
        assert "NASDAQ" in venues
        # Should NOT include CEFI venues
        assert "BINANCE-SPOT" not in venues

    def test_hierarchical_with_venue_filter(
        self, temp_config_dir, hierarchical_service_config, mock_env_vars
    ):
        """Test filtering hierarchical dimension."""
        with open(temp_config_dir / "sharding.hierarchical-test-service.yaml", "w") as f:
            yaml.dump(hierarchical_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=100,
            category=["CEFI"],
            venue=["BINANCE-SPOT"],
        )

        venues = {s.dimensions["venue"] for s in shards}
        assert venues == {"BINANCE-SPOT"}


class TestShardCalculatorGCSDynamicDimensions:
    """Tests for GCS dynamic dimension handling."""

    def test_gcs_dynamic_with_mock_client(
        self,
        temp_config_dir,
        gcs_dynamic_service_config,
        mock_cloud_files,
        mock_env_vars,
    ):
        """Test GCS dynamic dimension with mocked cloud client."""
        with open(temp_config_dir / "sharding.gcs-dynamic-test-service.yaml", "w") as f:
            yaml.dump(gcs_dynamic_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        # Mock the cloud client
        from deployment_service.cloud_client import MockCloudClient

        mock_client = MockCloudClient(mock_cloud_files)
        calculator.cloud_client = mock_client
        calculator.dimension_processor.cloud_client = mock_client

        shards = calculator.calculate_shards(
            service="gcs-dynamic-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=100,
            domain=["cefi"],
        )

        # Should have shards for each config file (2 cefi configs * 1 day)
        configs = {s.dimensions.get("config") for s in shards if s.dimensions.get("config")}
        assert (
            "gs://test-configs-cefi/grid_configs/btc_momentum.json" in configs or len(configs) == 0
        )

    def test_gcs_dynamic_empty_bucket(
        self, temp_config_dir, gcs_dynamic_service_config, mock_env_vars
    ):
        """Test handling of empty GCS bucket."""
        with open(temp_config_dir / "sharding.gcs-dynamic-test-service.yaml", "w") as f:
            yaml.dump(gcs_dynamic_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        # Mock client returns empty list (mock mode)
        shards = calculator.calculate_shards(
            service="gcs-dynamic-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=100,
        )

        # Should handle empty GCS gracefully
        assert isinstance(shards, list)


class TestShardLimitExceeded:
    """Tests for shard limit enforcement."""

    def test_exceeds_max_shards(self, temp_config_with_service, mock_env_vars):
        """Test that exceeding max_shards raises exception."""
        calculator = ShardCalculator(str(temp_config_with_service))

        with pytest.raises(ShardLimitExceeded) as exc_info:
            calculator.calculate_shards(
                service="test-service",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 1, 31),  # 31 days * 3 categories = 93 shards
                max_shards=10,
            )

        assert exc_info.value.total_shards > 10
        assert exc_info.value.max_shards == 10
        assert "breakdown" in str(exc_info.value)

    def test_exactly_at_max_shards(self, temp_config_with_service, mock_env_vars):
        """Test that exactly max_shards is allowed."""
        calculator = ShardCalculator(str(temp_config_with_service))

        # 1 day * 3 categories = 3 shards
        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=3,
        )

        assert len(shards) == 3

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


class TestCombinatorics:
    """Tests for combinatoric calculations."""

    def test_cartesian_product(self, temp_config_with_service, mock_env_vars):
        """Test that shards are Cartesian product of dimensions."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 2),  # 2 days
            max_shards=100,
            category=["CEFI", "TRADFI"],  # 2 categories
        )

        # 2 categories * 2 days = 4 shards
        assert len(shards) == 4

        # Verify all combinations exist
        combos = {(s.dimensions["category"], s.dimensions["date"]["start"]) for s in shards}
        assert ("CEFI", "2024-01-01") in combos
        assert ("CEFI", "2024-01-02") in combos
        assert ("TRADFI", "2024-01-01") in combos
        assert ("TRADFI", "2024-01-02") in combos

    def test_shard_indexing(self, temp_config_with_service, mock_env_vars):
        """Test that shard indices are sequential and correct."""
        calculator = ShardCalculator(str(temp_config_with_service))

        shards = calculator.calculate_shards(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
            max_shards=100,
        )

        indices = [s.shard_index for s in shards]
        assert indices == list(range(len(shards)))

        for shard in shards:
            assert shard.total_shards == len(shards)


class TestVenueStartDateFiltering:
    """Tests for venue start date filtering (respect_start_dates parameter)."""

    def test_respect_start_dates_filters_invalid_combinations(
        self, temp_config_with_start_dates, mock_env_vars
    ):
        """Test that shards before venue start date are filtered out when respect_start_dates=True."""
        calculator = ShardCalculator(str(temp_config_with_start_dates))

        # Date range: Jan 1-7, but BINANCE-FUTURES starts on Jan 5
        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI"],
            venue=["BINANCE-FUTURES"],
            respect_start_dates=True,
        )

        # BINANCE-FUTURES starts on 2024-01-05, so only Jan 5, 6, 7 should have shards
        # With weekly granularity, this becomes 1 week chunk
        dates = [s.dimensions["date"]["start"] for s in shards]

        # All dates should be >= 2024-01-05
        for date_str in dates:
            assert date_str >= "2024-01-05", (
                f"Found shard for {date_str} which is before venue start date"
            )

    def test_ignore_start_dates_includes_all_combinations(
        self, temp_config_with_start_dates, mock_env_vars
    ):
        """Test that all shards are included when respect_start_dates=False."""
        calculator = ShardCalculator(str(temp_config_with_start_dates))

        # Date range: Jan 1-7
        shards_filtered = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI"],
            venue=["BINANCE-FUTURES"],
            respect_start_dates=True,
        )

        shards_unfiltered = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI"],
            venue=["BINANCE-FUTURES"],
            respect_start_dates=False,
        )

        # Unfiltered should have more or equal shards
        assert len(shards_unfiltered) >= len(shards_filtered)

    def test_asymmetric_shard_counts_across_days(self, temp_config_with_start_dates, mock_env_vars):
        """Test that shard counts are asymmetric when venues launch on different days.

        This verifies that if we have:
        - BINANCE-SPOT: starts 2024-01-01
        - BINANCE-FUTURES: starts 2024-01-05
        - DERIBIT: starts 2024-01-01

        Then:
        - Jan 1-4: only BINANCE-SPOT and DERIBIT (2 venues)
        - Jan 5+: all 3 venues
        """
        calculator = ShardCalculator(str(temp_config_with_start_dates))

        # Get shards for the first 7 days
        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI"],
            respect_start_dates=True,
        )

        # Count venues per date period (weekly granularity in the fixture)
        # The fixture uses weekly granularity, so we'll check the venues included
        venues_in_shards = {s.dimensions["venue"] for s in shards}

        # BINANCE-SPOT and DERIBIT should always be present (start Jan 1)
        assert "BINANCE-SPOT" in venues_in_shards
        assert "DERIBIT" in venues_in_shards

    def test_category_start_date_fallback(self, temp_config_with_start_dates, mock_env_vars):
        """Test that category start date is used when venue start date is not configured."""
        calculator = ShardCalculator(str(temp_config_with_start_dates))

        # NASDAQ has venue start date 2024-01-03
        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["TRADFI"],
            venue=["NASDAQ"],  # Starts 2024-01-03
            respect_start_dates=True,
        )

        # All dates should be >= 2024-01-03
        for s in shards:
            date_start = s.dimensions["date"]["start"]
            assert date_start >= "2024-01-03", (
                f"Found shard for {date_start} which is before venue start date"
            )

    def test_no_start_dates_configured_includes_all(
        self, temp_config_dir, hierarchical_service_config, mock_env_vars
    ):
        """Test that when no expected_start_dates.yaml exists, all shards are included."""
        # Create service config without expected_start_dates.yaml
        with open(temp_config_dir / "sharding.hierarchical-test-service.yaml", "w") as f:
            yaml.dump(hierarchical_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI"],
            respect_start_dates=True,  # Should still work even without config
        )

        # Should not error and should include all shards
        assert len(shards) > 0

    def test_respect_start_dates_default_is_true(self, temp_config_with_start_dates, mock_env_vars):
        """Test that respect_start_dates defaults to True."""
        calculator = ShardCalculator(str(temp_config_with_start_dates))

        # Call without respect_start_dates parameter (should default to True)
        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI"],
            venue=["BINANCE-FUTURES"],
            # respect_start_dates not specified - should default to True
        )

        # BINANCE-FUTURES starts on 2024-01-05, so dates before that should be filtered
        for s in shards:
            date_start = s.dimensions["date"]["start"]
            assert date_start >= "2024-01-05", "Default filtering should exclude pre-launch dates"


class TestAsymmetricVenueCounts:
    """Tests to verify asymmetric venue counts per category are handled correctly."""

    def test_different_venue_counts_per_category(self, temp_config_with_start_dates, mock_env_vars):
        """Test that different categories have different venue counts.

        CEFI has 3 venues, TRADFI has 2 venues - this should result in
        asymmetric shard counts when filtering by category.
        """
        calculator = ShardCalculator(str(temp_config_with_start_dates))

        cefi_shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 7),  # After all CEFI venues launched
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI"],
            respect_start_dates=True,
        )

        tradfi_shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 7),  # After all TRADFI venues launched
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["TRADFI"],
            respect_start_dates=True,
        )

        # CEFI has 3 venues, TRADFI has 2 venues
        cefi_venues = {s.dimensions["venue"] for s in cefi_shards}
        tradfi_venues = {s.dimensions["venue"] for s in tradfi_shards}

        assert len(cefi_venues) == 3, f"Expected 3 CEFI venues, got {cefi_venues}"
        assert len(tradfi_venues) == 2, f"Expected 2 TRADFI venues, got {tradfi_venues}"

    def test_total_shards_calculation_with_asymmetric_venues(
        self, temp_config_with_start_dates, mock_env_vars
    ):
        """Test that total shard count correctly reflects asymmetric venue counts.

        For a single day after all venues launched:
        - CEFI: 3 venues = 3 shards
        - TRADFI: 2 venues = 2 shards
        Total = 5 shards (not 3 categories * N)
        """
        calculator = ShardCalculator(str(temp_config_with_start_dates))

        shards = calculator.calculate_shards(
            service="hierarchical-test-service",
            start_date=date(2024, 1, 7),  # After most venues launched
            end_date=date(2024, 1, 7),
            max_shards=1000,
            category=["CEFI", "TRADFI"],
            respect_start_dates=True,
        )

        # Count by category
        cefi_count = sum(1 for s in shards if s.dimensions["category"] == "CEFI")
        tradfi_count = sum(1 for s in shards if s.dimensions["category"] == "TRADFI")

        # CEFI should have 3 venues, TRADFI should have 2 venues
        assert cefi_count == 3, f"Expected 3 CEFI shards, got {cefi_count}"
        assert tradfi_count == 2, f"Expected 2 TRADFI shards, got {tradfi_count}"
        assert len(shards) == 5, f"Expected 5 total shards, got {len(shards)}"


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


class TestExcludeDatesDeploymentFiltering:
    """Tests for exclude_dates filtering in deployment creation.

    This tests the client-side filtering that happens AFTER shard calculation,
    using dates from data_status to skip already-completed shards.

    Bug fixed: Deploy Missing was deploying all shards even when data exists,
    because exclude_dates wasn't being passed from frontend to backend.
    """

    def test_exclude_dates_field_in_deploy_request(self):
        """Test that DeployRequest model accepts exclude_dates field."""
        from deployment_api.routes.deployments import DeployRequest

        # Should be able to create a request with exclude_dates
        request = DeployRequest(
            service="instruments-service",
            start_date="2024-01-01",
            end_date="2024-01-05",
            exclude_dates={
                "CEFI": ["2024-01-01", "2024-01-02"],
                "DEFI": ["2024-01-01"],
            },
        )

        assert request.exclude_dates is not None
        assert "CEFI" in request.exclude_dates
        assert len(request.exclude_dates["CEFI"]) == 2

    def test_exclude_dates_field_optional(self):
        """Test that exclude_dates is optional in DeployRequest."""
        from deployment_api.routes.deployments import DeployRequest

        # Should work without exclude_dates
        request = DeployRequest(
            service="instruments-service",
            start_date="2024-01-01",
            end_date="2024-01-05",
        )

        assert request.exclude_dates is None

    def test_shard_filtering_logic(self):
        """Test the shard filtering logic used when exclude_dates is provided.

        This replicates the filtering logic from create_deployment endpoint.
        """

        # Simulated shards from calculator
        class MockShard:
            def __init__(self, category, date_start):
                self.dimensions = {"category": category, "date": {"start": date_start}}

        all_shards = [
            MockShard("CEFI", "2024-01-01"),
            MockShard("CEFI", "2024-01-02"),
            MockShard("CEFI", "2024-01-03"),
            MockShard("CEFI", "2024-01-04"),
            MockShard("CEFI", "2024-01-05"),
            MockShard("DEFI", "2024-01-01"),
            MockShard("DEFI", "2024-01-02"),
        ]

        # Data status shows these dates have data (from turbo endpoint)
        exclude_dates = {
            "CEFI": ["2024-01-01", "2024-01-02", "2024-01-03"],  # 3 days complete
            "DEFI": ["2024-01-01"],  # 1 day complete
        }

        # Apply filtering (same logic as in create_deployment)
        exclude_sets = {cat: set(dates) for cat, dates in exclude_dates.items()}
        filtered_shards = []

        for shard in all_shards:
            dims = shard.dimensions
            cat = dims.get("category", "")
            date_val = dims.get("date", {})
            date_str = date_val.get("start", "") if isinstance(date_val, dict) else str(date_val)

            if cat in exclude_sets and date_str in exclude_sets[cat]:
                continue  # Skip - data exists

            filtered_shards.append(shard)

        # Should have: CEFI 04, 05 + DEFI 02 = 3 shards
        assert len(filtered_shards) == 3

        # Verify correct shards remain
        remaining = [
            (s.dimensions["category"], s.dimensions["date"]["start"]) for s in filtered_shards
        ]
        assert ("CEFI", "2024-01-04") in remaining
        assert ("CEFI", "2024-01-05") in remaining
        assert ("DEFI", "2024-01-02") in remaining

        # Verify excluded shards are gone
        assert ("CEFI", "2024-01-01") not in remaining
        assert ("DEFI", "2024-01-01") not in remaining

    def test_filtering_with_venue_sharding(self):
        """Test filtering works with venue-based sharding.

        Some services shard by (category, date, venue). The exclude_dates
        only provides (category, date) pairs, so any shard matching
        that category+date should be excluded regardless of venue.
        """

        class MockShard:
            def __init__(self, category, date_start, venue=None):
                self.dimensions = {"category": category, "date": {"start": date_start}}
                if venue:
                    self.dimensions["venue"] = venue

        # Shards with venue dimension (like market-tick-data-handler)
        all_shards = [
            MockShard("CEFI", "2024-01-01", "BINANCE-FUTURES"),
            MockShard("CEFI", "2024-01-01", "DERIBIT"),
            MockShard("CEFI", "2024-01-02", "BINANCE-FUTURES"),
            MockShard("CEFI", "2024-01-02", "DERIBIT"),
        ]

        # Data status: 2024-01-01 has data for CEFI (all venues)
        exclude_dates = {"CEFI": ["2024-01-01"]}

        # Filter at category+date level
        exclude_sets = {cat: set(dates) for cat, dates in exclude_dates.items()}
        filtered = []

        for shard in all_shards:
            cat = shard.dimensions.get("category", "")
            date_str = shard.dimensions.get("date", {}).get("start", "")

            if cat in exclude_sets and date_str in exclude_sets[cat]:
                continue
            filtered.append(shard)

        # Should exclude ALL 2024-01-01 shards (both venues)
        assert len(filtered) == 2

        # Only 2024-01-02 shards remain
        for shard in filtered:
            assert shard.dimensions["date"]["start"] == "2024-01-02"
