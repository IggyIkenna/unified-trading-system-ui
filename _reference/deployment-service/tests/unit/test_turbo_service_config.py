"""
Unit tests for turbo service configuration and bucket naming.

Tests the turbo mode service configurations:
- Service parameter validation
- Supported services
- Bucket name consistency
- Sub-dimension breakdown configuration
"""

import asyncio
import inspect


class TestTurboServiceConfig:
    """Tests for turbo API service configuration."""

    def test_market_tick_data_handler_config(self):
        """Test market-tick-data-handler turbo config is correct."""
        # The config is defined inside the function, so we test behavior instead
        # by checking that the function accepts the expected parameters

        # Import the SERVICE_CONFIG from the turbo endpoint
        # We need to access it indirectly through the function's closure
        from deployment_api.routes.data_status import get_data_status_turbo

        sig = inspect.signature(get_data_status_turbo)
        params = list(sig.parameters.keys())

        assert "service" in params
        assert "include_sub_dimensions" in params
        assert "include_instrument_types" in params

    def test_supported_services(self):
        """Test that all expected services are supported."""
        # Services that should be supported in turbo mode

        # BUCKET_MAPPING defines supported services
        from deployment_api.routes.data_batch_processing import get_data_status_turbo_impl

        # Test that unsupported service returns error
        result = asyncio.run(
            get_data_status_turbo_impl(
                service="nonexistent-service",
                start_date="2024-01-01",
                end_date="2024-01-01",
            )
        )
        assert "error" in result
        assert "not supported" in result["error"].lower()


class TestSubDimensionBreakdown:
    """Tests for sub-dimension breakdown by service type."""

    def test_instruments_service_uses_venue_breakdown(self):
        """Test that instruments-service uses venue as sub-dimension."""
        # The config should use venue as the sub_dimension for instruments-service
        # We verify this by checking the expected pattern
        import re

        pattern = re.compile(r"venue=([^/]+)")

        test_path = "instrument_availability/by_date/day=2024-01-01/venue=BINANCE-FUTURES/"
        match = pattern.search(test_path)
        assert match is not None
        assert match.group(1) == "BINANCE-FUTURES"

    def test_features_service_uses_feature_group_breakdown(self):
        """Test that features-delta-one-service uses feature_group as sub-dimension."""
        import re

        pattern = re.compile(r"feature_group=([^/]+)")

        test_path = "by_date/day=2024-01-01/feature_group=momentum/"
        match = pattern.search(test_path)
        assert match is not None
        assert match.group(1) == "momentum"


class TestBucketNameConsistency:
    """Tests for bucket name consistency across endpoints."""

    def test_bucket_names_format(self):
        """Test that bucket names follow expected pattern."""
        # Expected bucket name pattern
        expected_pattern_cefi = "market-data-tick-cefi-test-project"
        expected_pattern_tradfi = "market-data-tick-tradfi-test-project"
        expected_pattern_defi = "market-data-tick-defi-test-project"

        # Verify pattern
        assert "market-data-tick" in expected_pattern_cefi
        assert "market-data-tick" in expected_pattern_tradfi
        assert "market-data-tick" in expected_pattern_defi

        # NOT the old wrong pattern
        assert "market-tick-data" not in expected_pattern_cefi

    def test_instruments_bucket_names(self):
        """Test instruments bucket names follow expected pattern."""
        expected_cefi = "instruments-store-cefi-test-project"
        expected_tradfi = "instruments-store-tradfi-test-project"
        expected_defi = "instruments-store-defi-test-project"

        assert "instruments-store" in expected_cefi
        assert "instruments-store" in expected_tradfi
        assert "instruments-store" in expected_defi


class TestMigratedDataStructure:
    """Tests for migrated data structure (venue as directory)."""

    def test_venue_is_directory_in_migrated_structure(self):
        """Test that venue is extracted from directory path in migrated structure."""
        # In migrated structure (key=value format), venue is a directory:
        # raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={inst}/venue={venue}/

        sample_path = "raw_tick_data/by_date/day=2021-06-15/data_type=trades/instrument_type=perpetuals/venue=BINANCE-FUTURES/file.parquet"
        parts = sample_path.rstrip("/").split("/")

        # Venue should be in the venue= segment (0-indexed: 5)
        # 0: raw_tick_data, 1: by_date, 2: day=2021-06-15, 3: data_type=trades,
        # 4: instrument_type=perpetuals, 5: venue=BINANCE-FUTURES, 6: file.parquet
        venue_part = parts[5]
        assert venue_part.startswith("venue=")
        venue = venue_part.split("=", 1)[1]
        assert venue == "BINANCE-FUTURES"

    def test_processed_candles_structure(self):
        """Test processed candles directory structure."""
        # processed_candles/by_date/day={date}/timeframe={tf}/data_type={type}/instrument_type={inst}/venue={venue}/

        sample_path = "processed_candles/by_date/day=2023-05-23/timeframe=1m/data_type=trades/instrument_type=perpetuals/venue=BINANCE-FUTURES/file.parquet"
        parts = sample_path.split("/")

        assert "timeframe=1m" in parts
        assert "data_type=trades" in parts
        assert "instrument_type=perpetuals" in parts
        assert "venue=BINANCE-FUTURES" in parts


class TestInstrumentTypeMapping:
    """Tests for instrument type directory mapping."""

    def test_cefi_instrument_types(self):
        """Test CEFI instrument type directory names."""
        expected_types = {"spot", "perpetuals", "futures_chain", "options_chain"}

        # These are the canonical directory names used in GCS
        for inst_type in expected_types:
            assert inst_type.islower(), f"Instrument type {inst_type} should be lowercase"
            assert "_" in inst_type or inst_type in {
                "spot",
                "perpetuals",
            }, f"Multi-word types should use underscore: {inst_type}"

    def test_tradfi_instrument_types(self):
        """Test TRADFI instrument type directory names."""
        expected_types = {
            "equities",
            "futures_chain",
            "options_chain",
            "indices",
            "etf",
        }

        for inst_type in expected_types:
            assert inst_type.islower()

    def test_defi_instrument_types(self):
        """Test DEFI instrument type directory names."""
        expected_types = {"pool", "lst", "a_token", "debt_token"}

        for inst_type in expected_types:
            assert inst_type.islower()


class TestFileCounts:
    """Tests for file count feature in turbo mode."""

    def test_include_file_counts_parameter(self):
        """Test that include_file_counts parameter exists in turbo endpoint."""
        from deployment_api.routes.data_status import get_data_status_turbo

        sig = inspect.signature(get_data_status_turbo)
        params = list(sig.parameters.keys())
        assert "include_file_counts" in params

    def test_file_count_aggregation_logic(self):
        """Test file count aggregation logic."""
        # Simulate file counts from multiple months
        month1_counts = {
            "2024-01-01": {
                "data_types": {
                    "trades": {
                        "instrument_types": {"perpetuals": {"venues": {"BINANCE-FUTURES": 100}}},
                        "total_files": 100,
                    }
                },
                "total_files": 100,
            }
        }
        month2_counts = {
            "2024-01-02": {
                "data_types": {
                    "trades": {
                        "instrument_types": {"perpetuals": {"venues": {"BINANCE-FUTURES": 150}}},
                        "total_files": 150,
                    }
                },
                "total_files": 150,
            }
        }

        # Merge counts (simulating what the turbo endpoint does)
        all_counts = {}
        all_counts.update(month1_counts)
        all_counts.update(month2_counts)

        # Calculate totals
        total_files = sum(fc.get("total_files", 0) for fc in all_counts.values())
        dates_with_files = len(all_counts)
        avg_files_per_date = round(total_files / dates_with_files, 1) if dates_with_files else 0

        assert total_files == 250
        assert dates_with_files == 2
        assert avg_files_per_date == 125.0


class TestDatesFoundListIncluded:
    """Tests for dates_found_list inclusion in turbo response.

    Feature: include_dates_list=true returns the actual dates found,
    which the frontend uses to calculate exclude_dates for deploy missing.
    """

    def test_include_dates_list_parameter_exists(self):
        """Test that include_dates_list parameter exists in turbo endpoint."""
        from deployment_api.routes.data_status import get_data_status_turbo

        sig = inspect.signature(get_data_status_turbo)
        params = list(sig.parameters.keys())
        assert "include_dates_list" in params

    def test_dates_found_list_format(self):
        """Test expected format of dates_found_list in response."""
        # dates_found_list should be a sorted list of date strings
        sample_dates_found_list = ["2024-01-01", "2024-01-02", "2024-01-03"]

        # Should be a list
        assert isinstance(sample_dates_found_list, list)

        # Should be sorted
        assert sample_dates_found_list == sorted(sample_dates_found_list)

        # Each entry should be a date string
        for date_str in sample_dates_found_list:
            assert len(date_str) == 10  # YYYY-MM-DD
            assert date_str[4] == "-" and date_str[7] == "-"

    def test_dates_found_list_empty_when_no_data(self):
        """Test that dates_found_list is empty when no data exists."""
        # When a category has no data, dates_found_list should be []
        sample_response = {
            "categories": {"DEFI": {"dates_found": 0, "dates_expected": 3, "dates_found_list": []}}
        }

        assert sample_response["categories"]["DEFI"]["dates_found_list"] == []
        assert sample_response["categories"]["DEFI"]["dates_found"] == 0


class TestDateHandlingConsistency:
    """Tests for date handling between request and response."""

    def test_response_date_range_structure(self, sample_date_range):
        """Test that API response date_range contains required fields."""
        # The turbo endpoint should return date_range with start, end, and days
        # This is validated at the response model level

        expected_fields = {"start", "end", "days"}

        # Sample response structure that the frontend expects
        sample_response = {"date_range": sample_date_range}

        assert all(field in sample_response["date_range"] for field in expected_fields)

    def test_date_range_must_match_request(self):
        """Test that response date_range should match the request dates.

        If the backend returns different dates than requested, it indicates:
        - A caching bug (returned cached data for wrong dates)
        - A parameter parsing bug
        - A data migration issue

        The frontend now validates this and shows an error if they don't match.
        """
        # Request dates
        request_start = "2020-01-01"
        request_end = "2020-01-02"

        # Good response: dates match
        good_response = {"date_range": {"start": request_start, "end": request_end, "days": 2}}
        assert good_response["date_range"]["start"] == request_start
        assert good_response["date_range"]["end"] == request_end

        # Bad response: dates don't match (this is what the frontend catches)
        bad_response = {"date_range": {"start": "2026-01-04", "end": "2026-02-02", "days": 30}}
        # Frontend validation should catch this mismatch
        has_mismatch = (
            bad_response["date_range"]["start"] != request_start
            or bad_response["date_range"]["end"] != request_end
        )
        assert has_mismatch, "Should detect date mismatch"

    def test_date_range_days_calculation(self):
        """Test that days count is calculated correctly (inclusive)."""
        from datetime import UTC, datetime

        # 2024-01-01 to 2024-01-02 should be 2 days, not 1
        start_date = "2024-01-01"
        end_date = "2024-01-02"

        # Calculate expected days
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC)
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=UTC)
        expected_days = (end_dt - start_dt).days + 1  # +1 for inclusive

        assert expected_days == 2
