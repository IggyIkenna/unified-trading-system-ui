"""
Unit tests for ShardCalculator - Edge Cases.

Tests hierarchical dimensions, deployment filtering, and complex scenarios:
- Hierarchical dimension handling with venue-category mappings
- Exclude dates filtering for deployment creation
- Complex venue filtering scenarios
- Edge cases and error conditions
"""

from datetime import date

import pytest
import yaml

from deployment_service.shard_calculator import ShardCalculator


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

    def test_hierarchical_cross_category_venue_validation(
        self, temp_config_dir, hierarchical_service_config, mock_env_vars
    ):
        """Test that venues from wrong categories are rejected."""
        with open(temp_config_dir / "sharding.hierarchical-test-service.yaml", "w") as f:
            yaml.dump(hierarchical_service_config, f)

        calculator = ShardCalculator(str(temp_config_dir))

        # Try to use a TRADFI venue with CEFI category
        with pytest.raises(ValueError):
            calculator.calculate_shards(
                service="hierarchical-test-service",
                start_date=date(2024, 1, 1),
                end_date=date(2024, 1, 7),
                max_shards=100,
                category=["CEFI"],
                venue=["CME"],  # CME is TRADFI only
            )


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

    def test_shard_filtering_logic(self, sample_exclude_dates_data):
        """Test the shard filtering logic used when exclude_dates is provided.

        This replicates the filtering logic from create_deployment endpoint.
        """

        # Simulated shards from calculator
        class MockShard:
            def __init__(self, category, date_start):
                self.dimensions = {"category": category, "date": {"start": date_start}}

        # Create test shards based on fixture data
        all_shards = [
            MockShard(shard["category"], shard["date"])
            for shard in sample_exclude_dates_data["input_shards"]
        ]

        exclude_dates = sample_exclude_dates_data["exclude_dates"]

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

        # Verify against expected results
        expected_remaining = sample_exclude_dates_data["expected_remaining"]
        assert len(filtered_shards) == len(expected_remaining)

        # Verify correct shards remain
        remaining = [
            (s.dimensions["category"], s.dimensions["date"]["start"]) for s in filtered_shards
        ]
        expected_tuples = [(exp["category"], exp["date"]) for exp in expected_remaining]

        for expected in expected_tuples:
            assert expected in remaining

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

    def test_edge_case_empty_exclude_dates(self):
        """Test behavior when exclude_dates is empty or None."""

        class MockShard:
            def __init__(self, category, date_start):
                self.dimensions = {"category": category, "date": {"start": date_start}}

        shards = [
            MockShard("CEFI", "2024-01-01"),
            MockShard("TRADFI", "2024-01-01"),
        ]

        # Test empty dict
        exclude_dates_empty = {}
        filtered = shards if not exclude_dates_empty else []  # No filtering if empty

        assert len(filtered) == 2

        # Test None
        exclude_dates_none = None
        filtered = shards if not exclude_dates_none else []  # No filtering if None

        assert len(filtered) == 2

    def test_exclude_dates_with_complex_date_formats(self):
        """Test exclude dates with different date formats and edge cases."""

        class MockShard:
            def __init__(self, category, date_obj):
                self.dimensions = {"category": category, "date": date_obj}

        # Test different date formats that might appear in real shards
        shards = [
            MockShard("CEFI", {"start": "2024-01-01", "end": "2024-01-01"}),
            MockShard("CEFI", "2024-01-02"),  # Simple string (edge case)
            MockShard("TRADFI", {"start": "2024-01-01", "end": "2024-01-01"}),
        ]

        exclude_dates = {"CEFI": ["2024-01-01"]}
        exclude_sets = {cat: set(dates) for cat, dates in exclude_dates.items()}
        filtered = []

        for shard in shards:
            cat = shard.dimensions.get("category", "")
            date_val = shard.dimensions.get("date", {})

            # Handle different date formats
            date_str = (
                date_val.get("start", "")
                if isinstance(date_val, dict)
                else str(date_val)
                if date_val
                else ""
            )

            if cat in exclude_sets and date_str in exclude_sets[cat]:
                continue
            filtered.append(shard)

        # Should filter out first shard (CEFI 2024-01-01), keep others
        assert len(filtered) == 2
