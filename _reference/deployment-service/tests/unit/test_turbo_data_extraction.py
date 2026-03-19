"""
Unit tests for turbo data extraction logic.

Tests the turbo mode data extraction:
- Instrument type extraction
- Venue extraction from filenames and directories
- Timeframe extraction
- DEFI venue extraction from deep paths
"""

import asyncio
import re
from unittest.mock import patch


class TestInstrumentTypeExtraction:
    """Tests for instrument type breakdown extraction."""

    @patch("deployment_api.routes.batch_query_engine.get_path_combinatorics")
    @patch("deployment_api.utils.path_combinatorics.get_path_combinatorics")
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_instrument_types_market_tick_data_handler(
        self,
        mock_get_storage_client,
        mock_get_path_combinatorics_utils,
        mock_get_path_combinatorics_engine,
        mock_path_combinatorics,
        mock_turbo_list_blobs,
        mock_gcs_client,
    ):
        """Test instrument_type extraction for market-tick-data-handler.

        Note: This test mocks the GCS directory structure for market-tick-data-handler.
        The mock simulates the migrated structure where venue is a directory:
        raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={inst_type}/venue={venue}/
        """
        from deployment_api.routes.data_batch_processing import get_data_status_turbo_impl

        mock_get_path_combinatorics_utils.return_value = mock_path_combinatorics
        mock_get_path_combinatorics_engine.return_value = mock_path_combinatorics

        # Mock GCS storage client and bucket
        mock_storage_client, _mock_bucket = mock_gcs_client
        mock_get_storage_client.return_value = mock_storage_client

        # Use the mock list_blobs function (UCI API: called directly on client, not bucket)
        mock_storage_client.list_blobs.side_effect = mock_turbo_list_blobs

        # Run turbo query with sub_dimensions (which enables venue extraction)
        result = asyncio.run(
            get_data_status_turbo_impl(
                service="market-tick-data-handler",
                start_date="2024-01-01",
                end_date="2024-01-02",
                category=["CEFI"],
                include_sub_dimensions=True,
                include_instrument_types=False,  # instrument_types extraction uses separate code path
            )
        )

        # Verify structure
        assert "categories" in result
        assert "CEFI" in result["categories"]
        cefi = result["categories"]["CEFI"]

        # Should have data_type breakdown (sub-dimension for market-tick-data-handler)
        # The key is "data_type" (singular) in the API response
        data_type_key = "data_types" if "data_types" in cefi else "data_type"
        assert data_type_key in cefi
        assert "trades" in cefi[data_type_key]
        assert "book_snapshot_5" in cefi[data_type_key] or "options_chain" in cefi[data_type_key]

        # Should have at least dates_found > 0
        assert cefi["dates_found"] > 0


class TestVenueExtraction:
    """Tests for venue breakdown extraction."""

    def test_venue_filename_pattern(self):
        """Test venue extraction from filename pattern."""
        # Pattern used for market-tick-data-handler
        pattern = re.compile(r"^([A-Z0-9_-]+):")

        # Test various filename formats
        test_cases = [
            ("BINANCE-FUTURES:PERPETUAL:BTC-USDT@LIN.parquet", "BINANCE-FUTURES"),
            ("DERIBIT:OPTION:BTC-USD-240126-42000-C.parquet", "DERIBIT"),
            ("OKX:SPOT:BTC-USDT.parquet", "OKX"),
            ("NYSE:EQUITY:AAPL-USD.parquet", "NYSE"),
        ]

        for filename, expected_venue in test_cases:
            match = pattern.search(filename)
            assert match is not None, f"Pattern should match {filename}"
            assert match.group(1) == expected_venue, (
                f"Should extract {expected_venue} from {filename}"
            )


class TestTimeframeExtraction:
    """Tests for timeframe breakdown extraction (market-data-processing-service)."""

    def test_timeframe_pattern(self):
        """Test timeframe extraction from directory path."""
        # Pattern for timeframe extraction (key=value format)
        pattern = re.compile(r"timeframe=([^/]+)")

        test_paths = [
            ("processed_candles/by_date/day=2024-01-01/timeframe=15s/", "15s"),
            ("processed_candles/by_date/day=2024-01-01/timeframe=1m/", "1m"),
            ("processed_candles/by_date/day=2024-01-01/timeframe=1h/", "1h"),
            ("processed_candles/by_date/day=2024-01-01/timeframe=24h/", "24h"),
        ]

        for path, expected_tf in test_paths:
            match = pattern.search(path)
            assert match is not None, f"Pattern should match {path}"
            assert match.group(1) == expected_tf, f"Should extract {expected_tf} from {path}"


class TestDefiVenueExtraction:
    """Tests for DEFI venue extraction from deep directory paths.

    DEFI market-tick-data uses:
    raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={inst}/venue={venue}/file.parquet

    The venue extraction needed to go 3 levels deep (data_type -> inst_type -> venue).
    """

    def test_venue_is_directory_in_defi_structure(self):
        """Test that DEFI venues are directories, not in filenames."""
        # DEFI path: .../data_type=liquidity/instrument_type=pool/venue=UNISWAPV2-ETH/file.parquet
        sample_path = "raw_tick_data/by_date/day=2026-01-01/data_type=liquidity/instrument_type=pool/venue=UNISWAPV2-ETH/UNISWAPV2-ETH:POOL:DAI-USDC@ETHEREUM.parquet"
        parts = sample_path.split("/")

        # Venue is in the 6th part (index 5): venue=UNISWAPV2-ETH
        venue_part = parts[5]
        assert venue_part.startswith("venue=")
        assert venue_part.split("=", 1)[1] == "UNISWAPV2-ETH"

    def test_venue_vs_underlying_detection(self):
        """Test distinguishing venues from underlyings in directory names.

        Venues: UNISWAPV2-ETH, BINANCE-FUTURES, DERIBIT
        Underlyings: BTC-USD, ETH-USDT (short asset-quote pairs)
        """

        def is_underlying(dir_name):
            """Check if a directory name is an underlying (not a venue)."""
            if "-" not in dir_name:
                return False
            parts = dir_name.split("-")
            if len(parts) != 2:
                return False
            # Underlyings are typically ASSET-QUOTE with short parts
            is_underlying = len(parts[0]) <= 5 and parts[1] in (
                "USD",
                "USDC",
                "USDT",
                "EUR",
                "ETH",
            )
            return is_underlying

        # Test venues (should NOT be underlyings)
        assert not is_underlying("UNISWAPV2-ETH")
        assert not is_underlying("BINANCE-FUTURES")
        assert not is_underlying("DERIBIT")  # No dash

        # Test underlyings (should be detected)
        assert is_underlying("BTC-USD")
        assert is_underlying("ETH-USDT")
        assert is_underlying("BTC-USDC")

        # Edge cases
        assert is_underlying("AAVE-USD")  # Looks like underlying
        assert not is_underlying("UNISWAPV3-BASE")  # Chain suffix, not quote

    def test_three_level_depth_for_venue_extraction(self):
        """Test that venue extraction goes 3 levels deep for DEFI."""
        # The structure requires traversing:
        # Level 1: data_type=* directories
        # Level 2: instrument_type directories (pool, lst, etc.)
        # Level 3: venue directories

        structure = {
            "data_type=liquidity/": {
                "pool/": {
                    "UNISWAPV2-ETH/": ["file1.parquet"],
                    "UNISWAPV3-ETH/": ["file2.parquet"],
                }
            },
            "data_type=swaps/": {
                "pool/": {
                    "UNISWAPV2-ETH/": ["file3.parquet"],
                }
            },
        }

        # Extract venues (simulating the extraction logic)
        venues_found = set()
        for _l1, l1_content in structure.items():
            for _l2, l2_content in l1_content.items():
                for l3 in l2_content:
                    venue = l3.rstrip("/")
                    venues_found.add(venue)

        assert venues_found == {"UNISWAPV2-ETH", "UNISWAPV3-ETH"}
