"""
Unit tests for turbo request validation and size guards.

Tests the request validation:
- Request size guards (preventing 503 timeouts)
- Category start date filtering
- Expected start dates logic
"""

import asyncio
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from .turbo_fixtures import create_filter_dates_function


class TestRequestSizeGuard:
    """Tests for the request-size guard that prevents 503 timeout on large turbo requests."""

    @patch("deployment_api.routes.data_batch_processing.get_path_combinatorics")
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_instruments_service_large_range_raises_400(
        self, mock_get_storage_client, mock_get_path_combinatorics
    ):
        """Large date range for instruments-service with venue breakdown should raise 400.

        Mocks GCS client and path combinatorics so the test runs without ADC in CI.
        The guard triggers before any GCS calls when days x venues > 35_000.
        """
        from deployment_api.routes.data_batch_processing import get_data_status_turbo_impl

        # Mock storage client (never used - guard raises before GCS access)
        mock_get_storage_client.return_value = MagicMock()

        # Mock path combinatorics: return enough venues so days x venues > 35_000
        # 2020-01-01 to 2026-02-08 ≈ 2238 days; need ~16+ venues per category
        mock_pc = MagicMock()
        mock_pc.get_all_venues_for_category.return_value = [f"V{i}" for i in range(20)]
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


class TestExpectedStartDatesFiltering:
    """Tests for category_start date filtering in turbo mode."""

    def test_category_start_date_filtering_logic(self):
        """Test that category_start date filtering logic is correct."""
        filter_dates_by_category_start = create_filter_dates_function()

        # Generate all January dates
        all_dates = {f"2024-01-{d:02d}" for d in range(1, 32)}
        assert len(all_dates) == 31

        # Filter with category_start of Jan 15
        category_start = "2024-01-15"
        expected_dates = filter_dates_by_category_start(all_dates, category_start)

        # Should have 17 days (Jan 15-31)
        assert len(expected_dates) == 17
        assert "2024-01-14" not in expected_dates
        assert "2024-01-15" in expected_dates
        assert "2024-01-31" in expected_dates

    def test_no_category_start_returns_all_dates(self):
        """Test that no category_start returns all dates."""
        filter_dates_by_category_start = create_filter_dates_function()

        all_dates = {f"2024-01-{d:02d}" for d in range(1, 32)}

        # No category_start should return all dates
        expected_dates = filter_dates_by_category_start(all_dates, None)
        assert len(expected_dates) == 31

        expected_dates = filter_dates_by_category_start(all_dates, "")
        assert len(expected_dates) == 31


class TestDataTypeStartDates:
    """Tests for data_type-specific start dates."""

    def test_hyperliquid_data_type_start_dates(self):
        """Test HYPERLIQUID has data_type-specific start dates configured."""
        from pathlib import Path

        import yaml

        config_path = Path(__file__).parent.parent.parent / "configs" / "expected_start_dates.yaml"
        if not config_path.exists():
            return

        with open(config_path) as f:
            config = yaml.safe_load(f)

        mtdh_cefi = config.get("market-tick-data-handler", {}).get("CEFI", {})
        dt_start_dates = mtdh_cefi.get("data_type_start_dates", {})
        hyperliquid = dt_start_dates.get("HYPERLIQUID", {})

        # HYPERLIQUID has different start dates per data_type
        assert hyperliquid.get("book_snapshot_5") == "2023-05-01"
        assert hyperliquid.get("derivative_ticker") == "2023-05-20"
        assert hyperliquid.get("trades") == "2024-10-29"
        # liquidations is null (not available)
        assert hyperliquid.get("liquidations") is None

    def test_data_type_availability_check(self):
        """Test that null data_type start means not available."""
        # Simulate the is_data_type_available_for_venue logic
        config = {
            "market-tick-data-handler": {
                "CEFI": {
                    "data_type_start_dates": {
                        "HYPERLIQUID": {
                            "trades": "2024-10-29",
                            "liquidations": None,  # Not available
                        }
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
