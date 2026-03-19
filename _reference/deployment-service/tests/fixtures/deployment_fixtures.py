"""
Deployment-related test fixtures.

Provides common deployment configurations and test data
used across multiple test files.
"""

from datetime import date

import pytest


@pytest.fixture
def standard_deployment_config():
    """Standard deployment configuration for testing."""
    return {
        "service": "test-service",
        "version": "1.0.0",
        "shards": 4,
        "start_date": "2024-01-01",
        "end_date": "2024-01-03",
        "category": ["CEFI"],
        "max_shards": 100,
        "respect_start_dates": True,
        "skip_existing": False,
    }


@pytest.fixture
def sample_shard_config():
    """Sample shard configuration for testing."""
    return {
        "service": "instruments-service",
        "description": "Sample service for testing",
        "dimensions": [
            {
                "name": "category",
                "type": "fixed",
                "values": ["CEFI", "TRADFI", "DEFI"],
            },
            {
                "name": "date",
                "type": "date_range",
                "granularity": "daily",
            },
        ],
        "cli_args": {
            "category": "--category",
            "start_date": "--start-date",
            "end_date": "--end-date",
        },
        "compute": {
            "vm": {"machine_type": "c2-standard-4", "disk_size_gb": 20},
            "cloud_run": {"memory": "2Gi", "cpu": 1},
        },
    }


@pytest.fixture
def hierarchical_shard_config():
    """Hierarchical shard configuration with venue dimension."""
    return {
        "service": "market-tick-data-handler",
        "description": "Test hierarchical service",
        "dimensions": [
            {
                "name": "category",
                "type": "fixed",
                "values": ["CEFI", "TRADFI"],
            },
            {
                "name": "venue",
                "type": "hierarchical",
                "parent": "category",
            },
            {
                "name": "date",
                "type": "date_range",
                "granularity": "daily",
            },
        ],
        "cli_args": {
            "category": "--category",
            "venue": "--venue",
            "start_date": "--start-date",
            "end_date": "--end-date",
        },
    }


@pytest.fixture
def mock_shard_list():
    """Generate mock shard list for testing."""
    from deployment_service.shard_calculator import Shard

    return [
        Shard(
            service="test-service",
            shard_index=0,
            total_shards=3,
            dimensions={
                "category": "CEFI",
                "date": {"start": "2024-01-01", "end": "2024-01-01"},
            },
        ),
        Shard(
            service="test-service",
            shard_index=1,
            total_shards=3,
            dimensions={
                "category": "TRADFI",
                "date": {"start": "2024-01-01", "end": "2024-01-01"},
            },
        ),
        Shard(
            service="test-service",
            shard_index=2,
            total_shards=3,
            dimensions={
                "category": "DEFI",
                "date": {"start": "2024-01-01", "end": "2024-01-01"},
            },
        ),
    ]


@pytest.fixture
def deployment_request_data():
    """Sample deployment request data."""
    return {
        "service": "instruments-service",
        "start_date": "2024-01-01",
        "end_date": "2024-01-05",
        "category": ["CEFI", "TRADFI"],
        "max_shards": 100,
        "exclude_dates": {
            "CEFI": ["2024-01-01", "2024-01-02"],
            "TRADFI": ["2024-01-01"],
        },
    }


@pytest.fixture
def expected_start_dates_full_config():
    """Complete expected start dates configuration for testing."""
    return {
        "instruments-service": {
            "CEFI": {
                "category_start": "2020-01-01",
                "venues": {
                    "BINANCE-SPOT": "2020-01-01",
                    "BINANCE-FUTURES": "2020-01-01",
                    "DERIBIT": "2020-01-01",
                },
            },
            "TRADFI": {
                "category_start": "2020-01-01",
                "venues": {
                    "CME": "2020-01-01",
                    "NASDAQ": "2020-01-01",
                },
            },
            "DEFI": {
                "category_start": "2021-01-01",
                "venues": {
                    "UNISWAPV2-ETH": "2021-01-01",
                    "UNISWAPV3-ETH": "2021-05-01",
                },
            },
        },
        "market-tick-data-handler": {
            "CEFI": {
                "category_start": "2020-01-01",
                "data_type_start_dates": {
                    "BINANCE-FUTURES": {
                        "trades": "2020-01-01",
                        "book_snapshot_5": "2020-01-01",
                        "derivative_ticker": "2020-01-01",
                    },
                    "HYPERLIQUID": {
                        "trades": "2024-10-29",
                        "book_snapshot_5": "2023-05-01",
                        "derivative_ticker": "2023-05-20",
                        "liquidations": None,  # Not available
                    },
                },
            },
            "TRADFI": {
                "category_start": "2020-01-01",
            },
            "DEFI": {
                "category_start": "2021-01-01",
            },
        },
    }


@pytest.fixture
def mock_deployment_response():
    """Mock deployment API response."""
    return {
        "deployment_id": "deploy-123456",
        "service": "test-service",
        "status": "created",
        "shards_created": 10,
        "shards_filtered": 5,
        "message": "Deployment created successfully",
    }


@pytest.fixture
def shard_limit_test_cases():
    """Test cases for shard limit validation."""
    return [
        {
            "name": "within_limit",
            "start_date": date(2024, 1, 1),
            "end_date": date(2024, 1, 3),
            "max_shards": 10,
            "should_fail": False,
        },
        {
            "name": "exceeds_limit",
            "start_date": date(2024, 1, 1),
            "end_date": date(2024, 1, 31),
            "max_shards": 10,
            "should_fail": True,
        },
        {
            "name": "exactly_at_limit",
            "start_date": date(2024, 1, 1),
            "end_date": date(2024, 1, 1),
            "max_shards": 3,  # 1 day * 3 categories
            "should_fail": False,
        },
    ]


@pytest.fixture
def date_range_test_cases():
    """Test cases for different date range granularities."""
    return [
        {
            "granularity": "daily",
            "start_date": date(2024, 1, 1),
            "end_date": date(2024, 1, 3),
            "expected_periods": 3,
        },
        {
            "granularity": "weekly",
            "start_date": date(2024, 1, 1),
            "end_date": date(2024, 1, 21),
            "expected_periods": 3,
        },
        {
            "granularity": "monthly",
            "start_date": date(2024, 1, 1),
            "end_date": date(2024, 2, 15),
            "expected_periods": 2,
        },
    ]
