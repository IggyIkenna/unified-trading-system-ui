"""
Cloud-related test fixtures.

Provides mock cloud resources, storage clients, and GCS data
for testing without actual cloud dependencies.
"""

from unittest.mock import MagicMock

import pytest


@pytest.fixture
def mock_gcs_storage_client():
    """Mock Google Cloud Storage client."""
    mock_client = MagicMock()
    mock_bucket = MagicMock()
    mock_client.bucket.return_value = mock_bucket
    return mock_client


@pytest.fixture
def mock_gcs_bucket():
    """Mock GCS bucket for testing."""
    mock_bucket = MagicMock()
    mock_bucket.name = "test-bucket"
    return mock_bucket


@pytest.fixture
def mock_gcs_blob_listing():
    """Mock GCS blob listing for data status tests."""

    def create_mock_list_blobs(prefix, delimiter="/", max_results=None):
        iterator = MagicMock()

        # Mock different path structures based on prefix
        if "day=2024-01" in prefix and prefix.endswith("/"):
            # Venue-level existence check (used by query_specific_prefixes_for_category)
            if "venue=BINANCE-FUTURES/" in prefix:
                blob = MagicMock()
                blob.name = f"{prefix}data.parquet"
                blob.updated = None
                blob.size = 1024
                blob.time_created = None
                iterator.prefixes = []
                iterator.__iter__ = lambda self, _b=blob: iter([_b])
                return iterator
            # Mock date folder structure for market-tick-data-handler
            if "data_type=" not in prefix:
                iterator.prefixes = [
                    f"{prefix}data_type=trades/",
                    f"{prefix}data_type=book_snapshot_5/",
                    f"{prefix}data_type=options_chain/",
                ]
                iterator.__iter__ = lambda self: iter([])
            elif (
                "data_type=trades/" in prefix
                and "instrument_type=" not in prefix.split("data_type=trades/")[1]
            ):
                iterator.prefixes = [
                    f"{prefix}instrument_type=spot/",
                    f"{prefix}instrument_type=perpetuals/",
                ]
                iterator.__iter__ = lambda self: iter([])
            elif "instrument_type=" in prefix:
                iterator.prefixes = [f"{prefix}venue=BINANCE-FUTURES/"]
                iterator.__iter__ = lambda self: iter([])
            else:
                iterator.prefixes = []
                iterator.__iter__ = lambda self: iter([])
        elif "day=2024-01" in prefix:
            # Date folder listing
            iterator.prefixes = [
                f"{prefix.rsplit('day=', 1)[0]}day=2024-01-01/",
                f"{prefix.rsplit('day=', 1)[0]}day=2024-01-02/",
                f"{prefix.rsplit('day=', 1)[0]}day=2024-01-03/",
            ]
            iterator.__iter__ = lambda self: iter([])
        else:
            iterator.prefixes = []
            iterator.__iter__ = lambda self: iter([])

        return iterator

    return create_mock_list_blobs


@pytest.fixture
def mock_cloud_files_gcs_dynamic():
    """Mock cloud file lists for GCS dynamic testing."""
    return {
        "gs://test-configs-cefi/grid_configs/": [
            "gs://test-configs-cefi/grid_configs/btc_momentum.json",
            "gs://test-configs-cefi/grid_configs/eth_mean_reversion.json",
            "gs://test-configs-cefi/grid_configs/ada_arbitrage.json",
        ],
        "gs://test-configs-tradfi/grid_configs/": [
            "gs://test-configs-tradfi/grid_configs/spy_market_making.json",
            "gs://test-configs-tradfi/grid_configs/qqq_momentum.json",
        ],
        "gs://test-configs-defi/grid_configs/": [
            "gs://test-configs-defi/grid_configs/uni_v3_strategy.json",
        ],
    }


@pytest.fixture
def mock_bucket_mapping():
    """Mock bucket mapping for different services and categories."""
    return {
        "instruments-service": {
            "CEFI": "instruments-store-cefi-test-project",
            "TRADFI": "instruments-store-tradfi-test-project",
            "DEFI": "instruments-store-defi-test-project",
        },
        "market-tick-data-handler": {
            "CEFI": "market-data-tick-cefi-test-project",
            "TRADFI": "market-data-tick-tradfi-test-project",
            "DEFI": "market-data-tick-defi-test-project",
        },
        "market-data-processing-service": {
            "CEFI": "market-data-processed-cefi-test-project",
            "TRADFI": "market-data-processed-tradfi-test-project",
            "DEFI": "market-data-processed-defi-test-project",
        },
    }


@pytest.fixture
def mock_gcs_directory_structure():
    """Mock GCS directory structure for different data types."""
    return {
        "raw_tick_data/by_date/day=2024-01-01/": {
            "data_type=trades/": {
                "instrument_type=spot/": {
                    "venue=BINANCE-SPOT/": ["BINANCE-SPOT:SPOT:BTC-USDT.parquet"],
                },
                "instrument_type=perpetuals/": {
                    "venue=BINANCE-FUTURES/": ["BINANCE-FUTURES:PERPETUAL:BTC-USDT@LIN.parquet"],
                },
            },
            "data_type=book_snapshot_5/": {
                "instrument_type=spot/": {
                    "venue=BINANCE-SPOT/": ["BINANCE-SPOT:SPOT:BTC-USDT.parquet"],
                },
            },
            "data_type=options_chain/": {
                "instrument_type=options_chain/": {
                    "venue=DERIBIT/": ["DERIBIT:OPTION:BTC-USD-240126-42000-C.parquet"],
                },
            },
        },
        "processed_candles/by_date/day=2024-01-01/": {
            "timeframe=1m/": {
                "data_type=trades/": {
                    "instrument_type=perpetuals/": {
                        "venue=BINANCE-FUTURES/": ["candles.parquet"],
                    },
                },
            },
            "timeframe=1h/": {
                "data_type=trades/": {
                    "instrument_type=spot/": {
                        "venue=BINANCE-SPOT/": ["candles.parquet"],
                    },
                },
            },
        },
        "instrument_availability/by_date/day=2024-01-01/": {
            "venue=BINANCE-FUTURES/": ["instruments.parquet"],
            "venue=DERIBIT/": ["instruments.parquet"],
        },
    }


@pytest.fixture
def mock_defi_gcs_structure():
    """Mock DEFI GCS structure with deep venue extraction."""
    return {
        "raw_tick_data/by_date/day=2024-01-01/": {
            "data_type=liquidity/": {
                "instrument_type=pool/": {
                    "venue=UNISWAPV2-ETHEREUM/": ["UNISWAPV2-ETHEREUM:POOL:DAI-USDC@ETHEREUM.parquet"],
                    "venue=UNISWAPV3-ETHEREUM/": ["UNISWAPV3-ETHEREUM:POOL:WETH-USDC@ETHEREUM.parquet"],
                },
                "instrument_type=lst/": {
                    "venue=LIDO-ETH/": ["LIDO-ETH:LST:stETH@ETHEREUM.parquet"],
                },
            },
            "data_type=swaps/": {
                "instrument_type=pool/": {
                    "venue=UNISWAPV2-ETHEREUM/": ["UNISWAPV2-ETHEREUM:POOL:DAI-USDC@ETHEREUM.parquet"],
                    "venue=UNISWAPV3-ETHEREUM/": ["UNISWAPV3-ETHEREUM:POOL:WETH-USDC@ETHEREUM.parquet"],
                },
            },
        },
    }


@pytest.fixture
def mock_file_count_data():
    """Mock file count data for testing include_file_counts feature."""
    return {
        "2024-01-01": {
            "data_types": {
                "trades": {
                    "instrument_types": {
                        "perpetuals": {
                            "venues": {
                                "BINANCE-FUTURES": 150,
                                "DERIBIT": 75,
                            }
                        },
                        "spot": {
                            "venues": {
                                "BINANCE-SPOT": 200,
                            }
                        },
                    },
                    "total_files": 425,
                },
                "book_snapshot_5": {
                    "instrument_types": {
                        "perpetuals": {
                            "venues": {
                                "BINANCE-FUTURES": 100,
                            }
                        }
                    },
                    "total_files": 100,
                },
            },
            "total_files": 525,
        },
        "2024-01-02": {
            "data_types": {
                "trades": {
                    "instrument_types": {
                        "perpetuals": {
                            "venues": {
                                "BINANCE-FUTURES": 175,
                                "DERIBIT": 80,
                            }
                        }
                    },
                    "total_files": 255,
                },
            },
            "total_files": 255,
        },
    }


@pytest.fixture
def mock_cloud_run_client():
    """Mock Google Cloud Run client."""
    mock_client = MagicMock()
    mock_client.create_job.return_value = {"name": "projects/test/jobs/test-job"}
    mock_client.run_job.return_value = {"name": "projects/test/executions/test-exec"}
    mock_client.get_execution.return_value = {"status": {"state": "SUCCEEDED"}}
    return mock_client


@pytest.fixture
def mock_cloud_compute_client():
    """Mock Google Cloud Compute client."""
    mock_client = MagicMock()
    mock_client.instances.return_value.insert.return_value.execute.return_value = {
        "name": "test-operation"
    }
    return mock_client


@pytest.fixture
def mock_gcp_project_config():
    """Mock GCP project configuration."""
    return {
        "project_id": "test-project",
        "region": "us-central1",
        "zone": "us-central1-a",
        "service_account": "test-service@test-project.iam.gserviceaccount.com",
        "network": "projects/test-project/global/networks/default",
    }
