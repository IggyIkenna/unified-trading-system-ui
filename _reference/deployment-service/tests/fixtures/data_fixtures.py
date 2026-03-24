"""
Data-related test fixtures.

Provides sample data structures, API responses, and test datasets
for testing data status and processing functionality.
"""

import pytest


@pytest.fixture
def sample_turbo_response():
    """Sample turbo API response for testing."""
    return {
        "date_range": {
            "start": "2024-01-01",
            "end": "2024-01-03",
            "days": 3,
        },
        "overall_completion_pct": 87.5,
        "overall_dates_found": 7,
        "overall_dates_expected": 8,
        "overall_dates_found_category": 3,
        "overall_dates_expected_category": 3,
        "total_missing": 1,
        "categories": {
            "CEFI": {
                "dates_found": 2,
                "dates_expected": 3,
                "completion_pct": 66.7,
                "dates_missing": 1,
                "is_expected": True,
                "is_available": True,
                "venues": {
                    "BINANCE-FUTURES": {
                        "dates_found": 2,
                        "dates_expected_venue": 3,
                        "completion_pct": 66.7,
                        "is_expected": True,
                        "is_available": True,
                        "data_types": {
                            "trades": {
                                "dates_found": 2,
                                "dates_expected": 3,
                                "completion_pct": 66.7,
                            },
                            "book_snapshot_5": {
                                "dates_found": 1,
                                "dates_expected": 3,
                                "completion_pct": 33.3,
                            },
                        },
                    },
                    "DERIBIT": {
                        "dates_found": 3,
                        "dates_expected_venue": 3,
                        "completion_pct": 100.0,
                        "is_expected": True,
                        "is_available": True,
                    },
                },
            },
            "TRADFI": {
                "dates_found": 3,
                "dates_expected": 3,
                "completion_pct": 100.0,
                "dates_missing": 0,
                "is_expected": True,
                "is_available": True,
            },
        },
    }


@pytest.fixture
def sample_venue_config():
    """Sample venue configuration for testing."""
    return {
        "categories": {
            "CEFI": {
                "description": "Centralized Finance",
                "venues": [
                    "BINANCE-SPOT",
                    "BINANCE-FUTURES",
                    "DERIBIT",
                    "COINBASE",
                    "HYPERLIQUID",
                ],
                "data_types": [
                    "trades",
                    "book_snapshot_5",
                    "derivative_ticker",
                    "liquidations",
                ],
            },
            "TRADFI": {
                "description": "Traditional Finance",
                "venues": [
                    "CME",
                    "NASDAQ",
                    "NYSE",
                    "CBOE",
                ],
                "data_types": [
                    "trades",
                    "ohlcv_1m",
                    "options_chain",
                ],
            },
            "DEFI": {
                "description": "Decentralized Finance",
                "venues": [
                    "UNISWAPV2-ETHEREUM",
                    "UNISWAPV3-ETHEREUM",
                    "UNISWAPV3-BASE",
                    "AAVEV3_ETHEREUM",
                    "LIDO-ETH",
                ],
                "data_types": [
                    "swaps",
                    "liquidity",
                    "oracle_prices",
                ],
            },
        }
    }


@pytest.fixture
def sample_data_type_validation_config():
    """Sample data type validation configuration."""
    return {
        "CEFI": {
            "venues": {
                "BINANCE-FUTURES": {
                    "data_types": ["trades", "book_snapshot_5", "derivative_ticker"],
                    "instrument_types": ["PERPETUAL", "FUTURE"],
                },
                "DERIBIT": {
                    "data_types": ["trades", "book_snapshot_5", "options_chain"],
                    "instrument_types": ["OPTION", "PERPETUAL"],
                },
                "HYPERLIQUID": {
                    "data_types": ["trades", "book_snapshot_5", "derivative_ticker"],
                    "instrument_types": ["PERPETUAL"],
                },
            }
        },
        "TRADFI": {
            "venues": {
                "CME": {
                    "data_types": ["trades", "ohlcv_1m"],
                    "instrument_types": ["FUTURE", "OPTION"],
                },
                "NASDAQ": {
                    "data_types": ["trades", "ohlcv_1m"],
                    "instrument_types": ["EQUITY"],
                },
            }
        },
        "DEFI": {
            "venues": {
                "UNISWAPV2-ETHEREUM": {
                    "data_types": ["swaps", "liquidity"],
                    "instrument_types": ["pool"],
                },
                "UNISWAPV3-ETHEREUM": {
                    "data_types": ["swaps", "liquidity"],
                    "instrument_types": ["pool"],
                },
                "AAVEV3_ETHEREUM": {
                    "data_types": ["oracle_prices"],
                    "instrument_types": ["a_token", "debt_token"],
                },
            }
        },
    }


@pytest.fixture
def sample_instrument_types_mapping():
    """Sample instrument types mapping by category."""
    return {
        "CEFI": {
            "canonical_names": ["spot", "perpetuals", "futures_chain", "options_chain"],
            "aliases": {
                "SPOT": "spot",
                "PERPETUAL": "perpetuals",
                "FUTURE": "futures_chain",
                "OPTION": "options_chain",
            },
        },
        "TRADFI": {
            "canonical_names": ["equities", "futures_chain", "options_chain", "indices", "etf"],
            "aliases": {
                "EQUITY": "equities",
                "FUTURE": "futures_chain",
                "OPTION": "options_chain",
                "INDEX": "indices",
                "ETF": "etf",
            },
        },
        "DEFI": {
            "canonical_names": ["pool", "lst", "a_token", "debt_token"],
            "aliases": {
                "POOL": "pool",
                "LST": "lst",
                "A_TOKEN": "a_token",
                "DEBT_TOKEN": "debt_token",
            },
        },
    }


@pytest.fixture
def sample_filename_patterns():
    """Sample filename patterns for venue extraction."""
    return {
        "venue_prefix": {
            "pattern": r"^([A-Z0-9_-]+):",
            "examples": [
                ("BINANCE-FUTURES:PERPETUAL:BTC-USDT@LIN.parquet", "BINANCE-FUTURES"),
                ("DERIBIT:OPTION:BTC-USD-240126-42000-C.parquet", "DERIBIT"),
                ("OKX:SPOT:BTC-USDT.parquet", "OKX"),
                ("NYSE:EQUITY:AAPL-USD.parquet", "NYSE"),
            ],
        },
        "timeframe_extraction": {
            "pattern": r"timeframe=([^/]+)",
            "examples": [
                ("processed_candles/by_date/day=2024-01-01/timeframe=15s/", "15s"),
                ("processed_candles/by_date/day=2024-01-01/timeframe=1m/", "1m"),
                ("processed_candles/by_date/day=2024-01-01/timeframe=1h/", "1h"),
                ("processed_candles/by_date/day=2024-01-01/timeframe=24h/", "24h"),
            ],
        },
        "venue_directory": {
            "pattern": r"venue=([^/]+)",
            "examples": [
                (
                    "instrument_availability/by_date/day=2024-01-01/venue=BINANCE-FUTURES/",
                    "BINANCE-FUTURES",
                ),
                ("raw_tick_data/by_date/day=2024-01-01/data_type=trades/venue=DERIBIT/", "DERIBIT"),
            ],
        },
    }


@pytest.fixture
def sample_completion_calculation_data():
    """Sample data for completion calculation tests."""
    return {
        "basic_cases": [
            {"dates_found": 10, "dates_expected": 10, "expected_pct": 100.0},
            {"dates_found": 5, "dates_expected": 10, "expected_pct": 50.0},
            {"dates_found": 0, "dates_expected": 10, "expected_pct": 0.0},
            {"dates_found": 7, "dates_expected": 10, "expected_pct": 70.0},
            {"dates_found": 15, "dates_expected": 17, "expected_pct": 88.2},
        ],
        "edge_cases": [
            {"dates_found": 0, "dates_expected": 0, "expected_pct": 0},  # Avoid division by zero
        ],
    }


@pytest.fixture
def sample_dimension_weighted_data():
    """Sample data for dimension-weighted completion calculations."""
    return {
        "venue_with_data_types": {
            "UNISWAPV3-ETHEREUM": {
                "data_types": {
                    "liquidity": {
                        "dates_found": 30,
                        "dates_expected": 30,
                        "completion_pct": 100.0,
                        "is_expected": True,
                    },
                    "swaps": {
                        "dates_found": 2,
                        "dates_expected": 30,
                        "completion_pct": 6.7,
                        "is_expected": True,
                    },
                },
                "expected_weighted_completion": 53.3,  # (30+2)/(30+30) = 53.3%
            }
        },
        "category_aggregation": {
            "venues": {
                "UNISWAPV2-ETHEREUM": {
                    "dates_found": 30,
                    "dates_expected_venue": 30,
                    "_dim_weighted_found": 60,
                    "_dim_weighted_expected": 60,
                    "is_expected": True,
                },
                "UNISWAPV3-ETHEREUM": {
                    "dates_found": 30,
                    "dates_expected_venue": 30,
                    "_dim_weighted_found": 32,
                    "_dim_weighted_expected": 60,
                    "is_expected": True,
                },
            },
            "expected_category_completion": 76.7,  # (60+32)/(60+60) = 76.7%
        },
    }


@pytest.fixture
def sample_exclude_dates_data():
    """Sample exclude_dates data for deployment filtering."""
    return {
        "input_shards": [
            {"category": "CEFI", "date": "2024-01-01"},
            {"category": "CEFI", "date": "2024-01-02"},
            {"category": "CEFI", "date": "2024-01-03"},
            {"category": "TRADFI", "date": "2024-01-01"},
            {"category": "TRADFI", "date": "2024-01-02"},
            {"category": "DEFI", "date": "2024-01-01"},
        ],
        "exclude_dates": {
            "CEFI": ["2024-01-01", "2024-01-02"],
            "TRADFI": ["2024-01-01"],
        },
        "expected_remaining": [
            {"category": "CEFI", "date": "2024-01-03"},
            {"category": "TRADFI", "date": "2024-01-02"},
            {"category": "DEFI", "date": "2024-01-01"},
        ],
    }


@pytest.fixture
def sample_dates_found_list_data():
    """Sample dates_found_list data for include_dates_list feature."""
    return {
        "CEFI": {
            "dates_found_list": ["2024-01-01", "2024-01-02", "2024-01-05"],
            "dates_found": 3,
            "dates_expected": 7,  # 2024-01-01 to 2024-01-07
            "completion_pct": 42.9,
        },
        "TRADFI": {
            "dates_found_list": ["2024-01-01", "2024-01-02", "2024-01-03", "2024-01-04"],
            "dates_found": 4,
            "dates_expected": 7,
            "completion_pct": 57.1,
        },
        "DEFI": {
            "dates_found_list": [],  # No data
            "dates_found": 0,
            "dates_expected": 7,
            "completion_pct": 0.0,
        },
    }


@pytest.fixture
def sample_request_size_guard_data():
    """Sample data for request size guard testing."""
    return {
        "small_request": {
            "date_range_days": 7,
            "venues_count": 10,
            "total_combinations": 70,
            "should_pass": True,
        },
        "large_request": {
            "date_range_days": 2238,  # 2020-01-01 to 2026-02-08
            "venues_count": 20,
            "total_combinations": 44760,
            "should_pass": False,
            "threshold": 35000,
        },
    }


@pytest.fixture
def sample_data_type_start_dates():
    """Sample data type start dates for HYPERLIQUID testing."""
    return {
        "HYPERLIQUID": {
            "book_snapshot_5": "2023-05-01",
            "derivative_ticker": "2023-05-20",
            "trades": "2024-10-29",
            "liquidations": None,  # Not available
        },
        "BINANCE-FUTURES": {
            "trades": "2020-01-01",
            "book_snapshot_5": "2020-01-01",
            "derivative_ticker": "2020-01-01",
            "liquidations": "2020-01-01",
        },
    }


@pytest.fixture
def sample_bucket_names():
    """Sample bucket names for consistency testing."""
    return {
        "market_data": {
            "CEFI": "market-data-tick-cefi-test-project",
            "TRADFI": "market-data-tick-tradfi-test-project",
            "DEFI": "market-data-tick-defi-test-project",
        },
        "instruments": {
            "CEFI": "instruments-store-cefi-test-project",
            "TRADFI": "instruments-store-tradfi-test-project",
            "DEFI": "instruments-store-defi-test-project",
        },
        "processed_data": {
            "CEFI": "market-data-processed-cefi-test-project",
            "TRADFI": "market-data-processed-tradfi-test-project",
            "DEFI": "market-data-processed-defi-test-project",
        },
    }
