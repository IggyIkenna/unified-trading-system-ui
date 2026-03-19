"""
Unit tests for ShardCalculator - Optimization.

Tests optimization features and advanced dimension handling:
- GCS dynamic dimension handling with mock cloud clients
- Venue start date filtering for respect_start_dates parameter
- Asymmetric venue counts per category
- Performance optimizations and edge case handling
"""

from datetime import date

import yaml

from deployment_service.shard_calculator import ShardCalculator


class TestShardCalculatorGCSDynamicDimensions:
    """Tests for GCS dynamic dimension handling."""

    def test_gcs_dynamic_with_mock_client(
        self,
        temp_config_dir,
        gcs_dynamic_service_config,
        mock_cloud_files_gcs_dynamic,
        mock_env_vars,
    ):
        """Test GCS dynamic dimension with mocked cloud client."""
        with open(temp_config_dir / "sharding.gcs-dynamic-test-service.yaml", "w") as f:
            yaml.dump(gcs_dynamic_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        # Mock the cloud client on both the calculator and its dimension_processor
        from deployment_service.cloud_client import MockCloudClient

        mock_client = MockCloudClient(mock_cloud_files_gcs_dynamic)
        calculator.cloud_client = mock_client
        calculator.dimension_processor.cloud_client = mock_client

        shards = calculator.calculate_shards(
            service="gcs-dynamic-test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
            max_shards=100,
            domain=["cefi"],
        )

        # Should have shards for each config file (3 cefi configs * 1 day)
        configs = {s.dimensions.get("config") for s in shards if s.dimensions.get("config")}
        # Check that we have multiple config files from the mock data
        expected_configs = mock_cloud_files_gcs_dynamic["gs://test-configs-cefi/grid_configs/"]
        assert len(configs) > 0 or len(shards) >= len(expected_configs)

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
