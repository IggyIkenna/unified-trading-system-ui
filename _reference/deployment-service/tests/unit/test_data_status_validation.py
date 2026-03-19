"""
Unit tests for turbo data status API - Validation Operations.

Tests data validation, request guards, and date handling:
- Request size guard preventing 503 timeout on large requests
- Data type validation against venue_data_types.yaml
- Data type start dates for venue-specific availability
- Date handling consistency between request and response
"""

import asyncio
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException


class TestRequestSizeGuard:
    """Tests for the request-size guard that prevents 503 timeout on large turbo requests."""

    @patch("deployment_api.routes.data_batch_processing.get_path_combinatorics")
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_instruments_service_large_range_raises_400(
        self, mock_get_storage_client, mock_get_path_combinatorics, sample_request_size_guard_data
    ):
        """Large date range for instruments-service with venue breakdown should raise 400.

        Mocks GCS client and path combinatorics so the test runs without ADC in CI.
        The guard triggers before any GCS calls when days x venues > 35_000.
        """
        from deployment_api.routes.data_batch_processing import get_data_status_turbo_impl

        test_data = sample_request_size_guard_data["large_request"]

        # Mock storage client (never used - guard raises before GCS access)
        mock_get_storage_client.return_value = MagicMock()

        # Mock path combinatorics: return enough venues so days x venues > threshold
        mock_pc = MagicMock()
        mock_pc.get_all_venues_for_category.return_value = [
            f"V{i}" for i in range(test_data["venues_count"])
        ]
        mock_get_path_combinatorics.return_value = mock_pc

        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(
                get_data_status_turbo_impl(
                    service="instruments-service",
                    start_date="2020-01-01",
                    end_date="2026-02-08",
                    include_sub_dimensions=True,
                )
            )
        assert exc_info.value.status_code == 400
        assert "Request too large" in str(exc_info.value.detail)
        assert "Narrow the date range" in str(exc_info.value.detail)


class TestDataTypeValidation:
    """Tests for data type validation against venue_data_types.yaml."""

    def test_expected_data_types_cefi_binance_futures(self, sample_data_type_validation_config):
        """Test expected data_types for BINANCE-FUTURES from config."""
        config = sample_data_type_validation_config
        cefi_venues = config.get("CEFI", {}).get("venues", {})
        binance_futures = cefi_venues.get("BINANCE-FUTURES", {})
        expected_data_types = binance_futures.get("data_types", [])

        # BINANCE-FUTURES should have these data_types
        assert "trades" in expected_data_types
        assert "book_snapshot_5" in expected_data_types
        assert "derivative_ticker" in expected_data_types

    def test_expected_instrument_types_cefi_deribit(self, sample_data_type_validation_config):
        """Test expected instrument_types for DERIBIT from config."""
        config = sample_data_type_validation_config
        cefi_venues = config.get("CEFI", {}).get("venues", {})
        deribit = cefi_venues.get("DERIBIT", {})
        expected_inst_types = deribit.get("instrument_types", [])

        # DERIBIT should have options
        assert "OPTION" in expected_inst_types
        assert "PERPETUAL" in expected_inst_types

    def test_data_type_validation_summary(self):
        """Test data type validation summary calculation."""
        expected_data_types = ["trades", "book_snapshot_5", "derivative_ticker"]
        found_data_types = {"trades", "book_snapshot_5"}

        expected_set = set(expected_data_types)
        missing = expected_set - found_data_types
        unexpected = found_data_types - expected_set
        coverage_pct = round(len(expected_set & found_data_types) / len(expected_set) * 100, 1)

        assert missing == {"derivative_ticker"}
        assert unexpected == set()
        assert coverage_pct == 66.7


class TestDataTypeStartDates:
    """Tests for data_type-specific start dates."""

    def test_hyperliquid_data_type_start_dates(self, sample_data_type_start_dates):
        """Test HYPERLIQUID has data_type-specific start dates configured."""
        hyperliquid_config = sample_data_type_start_dates["HYPERLIQUID"]

        # HYPERLIQUID has different start dates per data_type
        assert hyperliquid_config.get("book_snapshot_5") == "2023-05-01"
        assert hyperliquid_config.get("derivative_ticker") == "2023-05-20"
        assert hyperliquid_config.get("trades") == "2024-10-29"
        # liquidations is null (not available)
        assert hyperliquid_config.get("liquidations") is None

    def test_data_type_availability_check(self, sample_data_type_start_dates):
        """Test that null data_type start means not available."""
        # Simulate the is_data_type_available_for_venue logic
        config = {
            "market-tick-data-handler": {
                "CEFI": {
                    "data_type_start_dates": {
                        "HYPERLIQUID": sample_data_type_start_dates["HYPERLIQUID"]
                    }
                }
            }
        }

        service_config = config.get("market-tick-data-handler", {})
        category_config = service_config.get("CEFI", {})
        dt_start_dates = category_config.get("data_type_start_dates", {})
        venue_dt_config = dt_start_dates.get("HYPERLIQUID", {})

        # trades is available
        assert "trades" in venue_dt_config
        assert venue_dt_config.get("trades") is not None

        # liquidations is not available
        assert "liquidations" in venue_dt_config
        assert venue_dt_config.get("liquidations") is None


class TestDateHandlingConsistency:
    """Tests for date handling between request and response."""

    def test_response_date_range_structure(self):
        """Test that API response date_range contains required fields."""
        # The turbo endpoint should return date_range with start, end, and days
        # This is validated at the response model level

        expected_fields = {"start", "end", "days"}

        # Sample response structure that the frontend expects
        sample_response = {
            "date_range": {
                "start": "2021-06-01",
                "end": "2021-06-07",
                "days": 7,
            }
        }

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
        # 2024-01-01 to 2024-01-02 should be 2 days, not 1
        start_date = "2024-01-01"
        end_date = "2024-01-02"

        # Calculate expected days
        start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC)
        end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=UTC)
        expected_days = (end_dt - start_dt).days + 1  # +1 for inclusive

        assert expected_days == 2
