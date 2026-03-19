"""
Shared fixtures for turbo data status tests.

This module contains common fixtures and utilities used across
all the split turbo test files.
"""

from datetime import UTC, datetime
from unittest.mock import MagicMock

import pytest


@pytest.fixture
def mock_gcs_client():
    """Mock GCS storage client for turbo tests."""
    mock_storage_client = MagicMock()
    mock_bucket = MagicMock()
    mock_storage_client.bucket.return_value = mock_bucket
    return mock_storage_client, mock_bucket


@pytest.fixture
def mock_turbo_list_blobs():
    """Mock list_blobs method for market-tick-data-handler structure.

    Handles both hierarchical directory scanning (old code path) and
    direct venue-level existence checks (new query_specific_prefixes path).
    """

    def mock_list_blobs(bucket_name_arg, prefix=None, max_results=None, delimiter=None):
        # UCI StorageClient API: list_blobs(bucket_name, prefix=..., max_results=..., delimiter=...)
        # Returns an iterable of blobs with .name, .size, .updated attributes.
        # The production code (list_objects → _list_objects_api) calls:
        #   list(client.list_blobs(bucket_name, prefix=prefix, ...))
        # and checks if the result is non-empty to determine data presence.

        if prefix is None:
            return []

        if "day=2024-01" in prefix and prefix.endswith("/"):
            # Direct existence check at venue level: return a mock blob
            if "venue=BINANCE-FUTURES/" in prefix:
                blob = MagicMock()
                blob.name = f"{prefix}data.parquet"
                blob.updated = None
                blob.size = 1024
                blob.time_created = None
                return [blob]

        return []

    return mock_list_blobs


@pytest.fixture
def sample_category_result():
    """Sample category result for completion calculation tests."""
    return {
        "dates_found": 30,
        "dates_expected": 30,
        "completion_pct": 100.0,
        "venues": {
            "BINANCE-FUTURES": {
                "dates_found": 30,
                "dates_expected_venue": 30,
                "completion_pct": 100.0,
                "is_expected": True,
                "is_available": True,
            },
            "DERIBIT": {
                "dates_found": 25,
                "dates_expected_venue": 30,
                "completion_pct": 83.3,
                "is_expected": True,
                "is_available": True,
            },
        },
    }


@pytest.fixture
def sample_venue_breakdown_uniswap():
    """Sample venue breakdown for UNISWAP testing dimension-weighted completion."""
    return {
        "dates_found": 30,  # Raw union (old calculation)
        "dates_expected_venue": 30,
        "data_types": {
            "liquidity": {
                "dates_found": 30,
                "dates_expected": 30,
                "completion_pct": 100.0,
                "is_expected": True,
                "is_available": True,
            },
            "swaps": {
                "dates_found": 2,
                "dates_expected": 30,
                "completion_pct": 6.7,
                "is_expected": True,
                "is_available": True,
            },
        },
        "_dim_weighted_found": 32,  # 30 + 2
        "_dim_weighted_expected": 60,  # 30 + 30
        "completion_pct": 53.3,  # Fixed calculation
        "is_expected": True,
    }


@pytest.fixture
def sample_date_range():
    """Sample date range for turbo response tests."""
    return {
        "start": "2024-01-01",
        "end": "2024-01-02",
        "days": 2,
    }


def create_filter_dates_function():
    """Create the category start date filtering function used in tests."""

    def filter_dates_by_category_start(all_dates: set, category_start: str) -> set:
        """Filter dates to only include those on or after category_start."""
        if not category_start:
            return all_dates
        start_dt = datetime.strptime(category_start, "%Y-%m-%d").replace(tzinfo=UTC)
        return {
            d for d in all_dates if datetime.strptime(d, "%Y-%m-%d").replace(tzinfo=UTC) >= start_dt
        }

    return filter_dates_by_category_start


def create_completion_calculator():
    """Create completion percentage calculator."""

    def calculate_completion_pct(found: int, expected: int) -> float:
        """Calculate completion percentage."""
        if expected > 0:
            return round((found / expected) * 100, 1)
        return 0.0

    return calculate_completion_pct


def create_exclude_dates_filter():
    """Create exclude_dates filtering function for deploy tests."""

    def filter_shards_by_exclude_dates(shards, exclude_dates):
        """Filter shards by exclude_dates for deploy missing."""
        if not exclude_dates:
            return shards

        exclude_sets = {cat: set(dates) for cat, dates in exclude_dates.items()}
        filtered = []

        for shard in shards:
            dims = shard.get("dimensions", {})
            cat = dims.get("category", "")
            date_val = dims.get("date", {})

            date_str = (
                date_val.get("start", "")
                if isinstance(date_val, dict)
                else str(date_val)
                if date_val
                else ""
            )

            # Skip if this category+date is in exclude_dates
            if cat in exclude_sets and date_str in exclude_sets[cat]:
                continue

            filtered.append(shard)

        return filtered

    return filter_shards_by_exclude_dates
