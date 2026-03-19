"""
Unit tests for batch_config_utils module.

Tests cover pure functions for date generation, venue lookups, start dates,
and config loading utilities.
"""

from deployment_api.routes.batch_config_utils import (
    BUCKET_MAPPING,
    SERVICE_CONFIG,
    generate_date_range_and_year_months,
    get_category_start_date,
    get_data_type_start_date,
    get_expected_dates_for_venue,
    get_expected_instrument_types_for_venue,
    get_expected_venues_for_category,
    get_venue_start_date,
    is_data_type_available_for_venue,
    is_venue_expected,
)


class TestGenerateDateRangeAndYearMonths:
    """Tests for generate_date_range_and_year_months."""

    def test_single_day_range(self):
        dates, year_months = generate_date_range_and_year_months("2024-01-15", "2024-01-15")
        assert dates == {"2024-01-15"}
        assert year_months == {"2024-01"}

    def test_multi_day_range(self):
        dates, year_months = generate_date_range_and_year_months("2024-01-28", "2024-02-02")
        assert len(dates) == 6
        assert "2024-01-28" in dates
        assert "2024-02-02" in dates
        assert "2024-01" in year_months
        assert "2024-02" in year_months

    def test_first_day_of_month_only(self):
        dates, _year_months = generate_date_range_and_year_months(
            "2024-01-01", "2024-03-31", first_day_of_month_only=True
        )
        # Only first days of months should be included
        assert all(d.endswith("-01") for d in dates)
        assert len(dates) == 3  # Jan 1, Feb 1, Mar 1

    def test_first_day_filter_excludes_non_first_days(self):
        dates, _ = generate_date_range_and_year_months(
            "2024-01-15", "2024-01-31", first_day_of_month_only=True
        )
        # No first-of-month days in this range
        assert len(dates) == 0

    def test_year_months_deduplication(self):
        _dates, year_months = generate_date_range_and_year_months("2024-01-01", "2024-01-31")
        assert year_months == {"2024-01"}

    def test_full_year_range_year_months(self):
        _, year_months = generate_date_range_and_year_months("2024-01-01", "2024-12-31")
        assert len(year_months) == 12

    def test_all_dates_in_range_included(self):
        dates, _ = generate_date_range_and_year_months("2024-01-01", "2024-01-05")
        expected = {"2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04", "2024-01-05"}
        assert dates == expected


class TestGetExpectedVenuesForCategory:
    """Tests for get_expected_venues_for_category."""

    def test_cefi_category(self):
        venue_config = {
            "CEFI": {"venues": {"BINANCE": {}, "COINBASE": {}}},
            "TRADFI": {"venues": {"NYSE": {}}},
        }
        result = get_expected_venues_for_category(venue_config, "CEFI")
        assert result == {"BINANCE", "COINBASE"}

    def test_missing_category_returns_empty_set(self):
        venue_config = {"CEFI": {"venues": {"BINANCE": {}}}}
        result = get_expected_venues_for_category(venue_config, "DEFI")
        assert result == set()

    def test_category_with_no_venues(self):
        venue_config = {"CEFI": {"venues": {}}}
        result = get_expected_venues_for_category(venue_config, "CEFI")
        assert result == set()

    def test_empty_config(self):
        result = get_expected_venues_for_category({}, "CEFI")
        assert result == set()


class TestIsVenueExpected:
    """Tests for is_venue_expected."""

    def test_venue_is_expected(self):
        venue_config = {"CEFI": {"venues": {"BINANCE": {}}}}
        assert is_venue_expected(venue_config, "CEFI", "BINANCE") is True

    def test_venue_not_expected(self):
        venue_config = {"CEFI": {"venues": {"BINANCE": {}}}}
        assert is_venue_expected(venue_config, "CEFI", "KRAKEN") is False

    def test_unknown_category(self):
        venue_config = {"CEFI": {"venues": {"BINANCE": {}}}}
        assert is_venue_expected(venue_config, "DEFI", "BINANCE") is False


class TestGetExpectedDataTypesForVenue:
    """Tests for get_expected_data_types via venue config."""

    def test_returns_data_types_for_venue(self):
        from deployment_api.routes.batch_config_utils import get_expected_data_types_for_venue

        venue_config = {
            "CEFI": {"venues": {"BINANCE": {"data_types": ["trades", "book_snapshot_5"]}}}
        }
        result = get_expected_data_types_for_venue(venue_config, "CEFI", "BINANCE")
        assert result == ["trades", "book_snapshot_5"]

    def test_missing_venue_returns_empty(self):
        from deployment_api.routes.batch_config_utils import get_expected_data_types_for_venue

        venue_config = {"CEFI": {"venues": {"BINANCE": {"data_types": ["trades"]}}}}
        result = get_expected_data_types_for_venue(venue_config, "CEFI", "KRAKEN")
        assert result == []


class TestGetExpectedInstrumentTypesForVenue:
    """Tests for get_expected_instrument_types_for_venue."""

    def test_returns_instrument_types(self):
        venue_config = {
            "CEFI": {"venues": {"BINANCE": {"instrument_types": ["SPOT_PAIR", "PERPETUAL"]}}}
        }
        result = get_expected_instrument_types_for_venue(venue_config, "CEFI", "BINANCE")
        assert result == ["SPOT_PAIR", "PERPETUAL"]

    def test_missing_venue_returns_empty(self):
        venue_config = {"CEFI": {"venues": {}}}
        result = get_expected_instrument_types_for_venue(venue_config, "CEFI", "BINANCE")
        assert result == []


class TestGetDataTypeStartDate:
    """Tests for get_data_type_start_date."""

    def test_specific_data_type_start_date(self):
        config = {
            "market-tick-data-handler": {
                "CEFI": {
                    "data_type_start_dates": {"BINANCE": {"book_snapshot_5": "2023-06-01"}},
                    "venues": {"BINANCE": "2023-01-01"},
                    "category_start": "2023-01-01",
                }
            }
        }
        result = get_data_type_start_date(
            config, "market-tick-data-handler", "CEFI", "BINANCE", "book_snapshot_5"
        )
        assert result == "2023-06-01"

    def test_falls_back_to_venue_start(self):
        config = {
            "market-tick-data-handler": {
                "CEFI": {
                    "data_type_start_dates": {},
                    "venues": {"BINANCE": "2023-01-01"},
                    "category_start": "2022-01-01",
                }
            }
        }
        result = get_data_type_start_date(
            config, "market-tick-data-handler", "CEFI", "BINANCE", "trades"
        )
        assert result == "2023-01-01"

    def test_falls_back_to_category_start(self):
        config = {
            "market-tick-data-handler": {
                "CEFI": {
                    "venues": {},
                    "category_start": "2022-01-01",
                }
            }
        }
        result = get_data_type_start_date(
            config, "market-tick-data-handler", "CEFI", "UNKNOWN_VENUE", "trades"
        )
        assert result == "2022-01-01"

    def test_missing_service_returns_none(self):
        config = {}
        result = get_data_type_start_date(
            config, "nonexistent-service", "CEFI", "BINANCE", "trades"
        )
        assert result is None

    def test_null_data_type_returns_none(self):
        config = {
            "svc": {
                "CEFI": {
                    "data_type_start_dates": {"BINANCE": {"liquidations": None}},
                    "venues": {"BINANCE": "2023-01-01"},
                }
            }
        }
        result = get_data_type_start_date(config, "svc", "CEFI", "BINANCE", "liquidations")
        assert result is None


class TestIsDataTypeAvailableForVenue:
    """Tests for is_data_type_available_for_venue."""

    def test_explicitly_available(self):
        config = {"svc": {"CEFI": {"data_type_start_dates": {"BINANCE": {"trades": "2023-01-01"}}}}}
        assert is_data_type_available_for_venue(config, "svc", "CEFI", "BINANCE", "trades") is True

    def test_explicitly_not_available_null(self):
        config = {"svc": {"CEFI": {"data_type_start_dates": {"BINANCE": {"liquidations": None}}}}}
        assert (
            is_data_type_available_for_venue(config, "svc", "CEFI", "BINANCE", "liquidations")
            is False
        )

    def test_not_configured_assumes_available(self):
        config = {"svc": {"CEFI": {"data_type_start_dates": {}}}}
        assert is_data_type_available_for_venue(config, "svc", "CEFI", "BINANCE", "trades") is True

    def test_missing_service_assumes_available(self):
        assert (
            is_data_type_available_for_venue({}, "nonexistent", "CEFI", "BINANCE", "trades") is True
        )


class TestGetCategoryStartDate:
    """Tests for get_category_start_date."""

    def test_returns_category_start(self):
        config = {"svc": {"CEFI": {"category_start": "2023-01-01"}}}
        result = get_category_start_date(config, "svc", "CEFI")
        assert result == "2023-01-01"

    def test_missing_category_returns_none(self):
        config = {"svc": {}}
        result = get_category_start_date(config, "svc", "CEFI")
        assert result is None

    def test_missing_service_returns_none(self):
        result = get_category_start_date({}, "svc", "CEFI")
        assert result is None


class TestGetVenueStartDate:
    """Tests for get_venue_start_date."""

    def test_venue_specific_start(self):
        config = {
            "svc": {
                "CEFI": {
                    "venues": {"BINANCE": "2023-03-01"},
                    "category_start": "2023-01-01",
                }
            }
        }
        result = get_venue_start_date(config, "svc", "CEFI", "BINANCE")
        assert result == "2023-03-01"

    def test_falls_back_to_category_start(self):
        config = {
            "svc": {
                "CEFI": {
                    "venues": {},
                    "category_start": "2023-01-01",
                }
            }
        }
        result = get_venue_start_date(config, "svc", "CEFI", "KRAKEN")
        assert result == "2023-01-01"

    def test_missing_config_returns_none(self):
        result = get_venue_start_date({}, "svc", "CEFI", "BINANCE")
        assert result is None


class TestGetExpectedDatesForVenue:
    """Tests for get_expected_dates_for_venue."""

    def test_filters_to_venue_start_date(self):
        all_dates = {"2024-01-01", "2024-01-15", "2024-02-01"}
        config = {
            "svc": {"CEFI": {"venues": {"BINANCE": "2024-01-15"}, "category_start": "2024-01-01"}}
        }
        result = get_expected_dates_for_venue(all_dates, config, "svc", "CEFI", "BINANCE")
        assert "2024-01-01" not in result
        assert "2024-01-15" in result
        assert "2024-02-01" in result

    def test_no_start_date_returns_all_dates(self):
        all_dates = {"2024-01-01", "2024-02-01"}
        result = get_expected_dates_for_venue(all_dates, {}, "svc", "CEFI", "BINANCE")
        assert result == all_dates

    def test_processing_service_uses_upstream_dates(self):
        all_dates = {"2024-01-01", "2024-01-02", "2024-01-03"}
        upstream = {"CEFI": {"BINANCE": {"2024-01-01", "2024-01-03"}}}
        result = get_expected_dates_for_venue(
            all_dates,
            {},
            "market-data-processing-service",
            "CEFI",
            "BINANCE",
            upstream_avail_dates=upstream,
        )
        assert result == {"2024-01-01", "2024-01-03"}

    def test_processing_service_falls_back_to_category_upstream(self):
        all_dates = {"2024-01-01", "2024-01-02"}
        upstream = {"CEFI": {"__category__": {"2024-01-01"}}}
        result = get_expected_dates_for_venue(
            all_dates,
            {},
            "market-data-processing-service",
            "CEFI",
            "VENUE_X",
            upstream_avail_dates=upstream,
        )
        assert result == {"2024-01-01"}


class TestBucketMapping:
    """Tests for BUCKET_MAPPING configuration."""

    def test_instruments_service_has_cefi_bucket(self):
        assert "instruments-service" in BUCKET_MAPPING
        assert "CEFI" in BUCKET_MAPPING["instruments-service"]

    def test_market_tick_data_has_all_categories(self):
        mtd = BUCKET_MAPPING.get("market-tick-data-handler", {})
        assert "CEFI" in mtd
        assert "DEFI" in mtd
        assert "TRADFI" in mtd

    def test_features_calendar_has_cefi_only(self):
        cal = BUCKET_MAPPING.get("features-calendar-service", {})
        assert "CEFI" in cal


class TestServiceConfig:
    """Tests for SERVICE_CONFIG structure."""

    def test_instruments_service_has_required_keys(self):
        assert "instruments-service" in SERVICE_CONFIG
        svc = SERVICE_CONFIG["instruments-service"]
        assert "prefix_template" in svc
        assert "date_pattern" in svc

    def test_market_tick_data_has_sub_dimension(self):
        svc = SERVICE_CONFIG["market-tick-data-handler"]
        assert svc.get("sub_dimension") == "data_type"

    def test_all_services_have_prefix_template(self):
        for svc_name, svc_cfg in SERVICE_CONFIG.items():
            assert "prefix_template" in svc_cfg, f"{svc_name} missing prefix_template"
