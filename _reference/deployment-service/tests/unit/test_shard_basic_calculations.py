"""
Unit tests for ShardCalculator - Basic Calculations.

Tests core shard functionality, fixed dimensions, date ranges, and combinatorics:
- Shard dataclass operations (creation, serialization, CLI commands)
- Fixed dimension handling (filtering, validation)
- Date range dimension handling (daily, weekly, monthly granularity)
- Combinatoric calculations and indexing
"""

from datetime import date

import pytest
import yaml

from deployment_service.shard_calculator import (
    Shard,
    ShardCalculator,
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

    def test_weekly_granularity(self, temp_config_dir, mock_env_vars, date_range_test_cases):
        """Test weekly date range splitting."""
        test_case = next(c for c in date_range_test_cases if c["granularity"] == "weekly")

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
            start_date=test_case["start_date"],
            end_date=test_case["end_date"],
            max_shards=100,
        )

        # Should match expected periods from fixture
        assert len(shards) == test_case["expected_periods"]

    def test_monthly_granularity(self, temp_config_dir, mock_env_vars, date_range_test_cases):
        """Test monthly date range splitting."""
        test_case = next(c for c in date_range_test_cases if c["granularity"] == "monthly")

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
            start_date=test_case["start_date"],
            end_date=test_case["end_date"],
            max_shards=100,
        )

        assert len(shards) == test_case["expected_periods"]

    def test_date_required_error(self, temp_config_with_service, mock_env_vars):
        """Test that missing date raises error for date_range services."""
        calculator = ShardCalculator(str(temp_config_with_service))

        with pytest.raises(ValueError, match="requires start_date and end_date"):
            calculator.calculate_shards(
                service="test-service",
                max_shards=100,
            )


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
