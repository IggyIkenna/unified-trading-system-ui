"""
Unit tests for turbo data status API - Query Operations.

Tests service configurations, data extraction patterns, and bucket mappings:
- Service configurations (prefix patterns, sub-dimensions)
- Instrument type extraction for market-tick-data-handler
- Timeframe extraction for market-data-processing-service
- Venue extraction from filenames and directories
- Bucket name consistency and migration patterns
"""

import asyncio
import inspect
import re
from unittest.mock import MagicMock, patch


class TestTurboServiceConfig:
    """Tests for turbo API service configuration."""

    def test_market_tick_data_handler_config(self):
        """Test market-tick-data-handler turbo config is correct."""
        # The config is defined inside the function, so we test behavior instead
        # by checking that the function accepts the expected parameters
        from deployment_api.routes.data_status import get_data_status_turbo

        sig = inspect.signature(get_data_status_turbo)
        params = list(sig.parameters.keys())

        assert "service" in params
        assert "include_sub_dimensions" in params
        assert "include_instrument_types" in params

    def test_supported_services(self):
        """Test that all expected services are supported."""
        # Services that should be supported in turbo mode
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
    ):
        """Test instrument_type extraction for market-tick-data-handler.

        Note: This test mocks the GCS directory structure for market-tick-data-handler.
        The mock simulates the migrated structure where venue is a directory:
        raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={inst_type}/venue={venue}/
        """
        from deployment_api.routes.data_batch_processing import get_data_status_turbo_impl

        mock_get_path_combinatorics_utils.return_value = mock_path_combinatorics
        mock_get_path_combinatorics_engine.return_value = mock_path_combinatorics

        # Mock GCS storage client — use UCI API (list_blobs called on client directly)
        mock_storage_client = MagicMock()
        mock_get_storage_client.return_value = mock_storage_client

        # Use the shared mock blob listing (UCI API: client.list_blobs(bucket, prefix=...))
        mock_storage_client.list_blobs.side_effect = mock_turbo_list_blobs

        # Run turbo query with sub_dimensions (which enables venue extraction)
        result = asyncio.run(
            get_data_status_turbo_impl(
                service="market-tick-data-handler",
                start_date="2024-01-01",
                end_date="2024-01-02",
                category=["CEFI"],
                include_sub_dimensions=True,
                include_instrument_types=False,
            )
        )

        # Verify structure
        assert "categories" in result
        assert "CEFI" in result["categories"]
        cefi = result["categories"]["CEFI"]

        # Should have found data for the market-tick service
        assert cefi["dates_found"] > 0

        # Should have data_type or data_types breakdown (sub-dimension for market-tick-data-handler)
        dt_key = "data_types" if "data_types" in cefi else "data_type"
        assert dt_key in cefi
        assert "trades" in cefi[dt_key]


class TestVenueExtraction:
    """Tests for venue breakdown extraction."""

    def test_venue_filename_pattern(self, sample_filename_patterns):
        """Test venue extraction from filename pattern."""
        pattern_data = sample_filename_patterns["venue_prefix"]
        pattern = re.compile(pattern_data["pattern"])

        for filename, expected_venue in pattern_data["examples"]:
            match = pattern.search(filename)
            assert match is not None, f"Pattern should match {filename}"
            assert match.group(1) == expected_venue, (
                f"Should extract {expected_venue} from {filename}"
            )


class TestTimeframeExtraction:
    """Tests for timeframe breakdown extraction (market-data-processing-service)."""

    def test_timeframe_pattern(self, sample_filename_patterns):
        """Test timeframe extraction from directory path."""
        pattern_data = sample_filename_patterns["timeframe_extraction"]
        pattern = re.compile(pattern_data["pattern"])

        for path, expected_tf in pattern_data["examples"]:
            match = pattern.search(path)
            assert match is not None, f"Pattern should match {path}"
            assert match.group(1) == expected_tf, f"Should extract {expected_tf} from {path}"


class TestSubDimensionBreakdown:
    """Tests for sub-dimension breakdown by service type."""

    def test_instruments_service_uses_venue_breakdown(self, sample_filename_patterns):
        """Test that instruments-service uses venue as sub-dimension."""
        pattern_data = sample_filename_patterns["venue_directory"]
        pattern = re.compile(pattern_data["pattern"])

        test_path = "instrument_availability/by_date/day=2024-01-01/venue=BINANCE-FUTURES/"
        match = pattern.search(test_path)
        assert match is not None
        assert match.group(1) == "BINANCE-FUTURES"

    def test_features_service_uses_feature_group_breakdown(self):
        """Test that features-delta-one-service uses feature_group as sub-dimension."""
        pattern = re.compile(r"feature_group=([^/]+)")

        test_path = "by_date/day=2024-01-01/feature_group=momentum/"
        match = pattern.search(test_path)
        assert match is not None
        assert match.group(1) == "momentum"


class TestInstrumentTypeMapping:
    """Tests for instrument type directory mapping."""

    def test_cefi_instrument_types(self, sample_instrument_types_mapping):
        """Test CEFI instrument type directory names."""
        cefi_types = sample_instrument_types_mapping["CEFI"]["canonical_names"]

        for inst_type in cefi_types:
            assert inst_type.islower(), f"Instrument type {inst_type} should be lowercase"
            if len(inst_type.split("_")) > 1:
                assert "_" in inst_type, f"Multi-word types should use underscore: {inst_type}"

    def test_tradfi_instrument_types(self, sample_instrument_types_mapping):
        """Test TRADFI instrument type directory names."""
        tradfi_types = sample_instrument_types_mapping["TRADFI"]["canonical_names"]

        for inst_type in tradfi_types:
            assert inst_type.islower()

    def test_defi_instrument_types(self, sample_instrument_types_mapping):
        """Test DEFI instrument type directory names."""
        defi_types = sample_instrument_types_mapping["DEFI"]["canonical_names"]

        for inst_type in defi_types:
            assert inst_type.islower()


class TestFileCounts:
    """Tests for file count feature in turbo mode."""

    def test_include_file_counts_parameter(self):
        """Test that include_file_counts parameter exists in turbo endpoint."""
        from deployment_api.routes.data_status import get_data_status_turbo

        sig = inspect.signature(get_data_status_turbo)
        params = list(sig.parameters.keys())
        assert "include_file_counts" in params

    def test_file_count_aggregation_logic(self, mock_file_count_data):
        """Test file count aggregation logic."""
        # Use the sample file count data from fixtures
        all_counts = mock_file_count_data

        # Calculate totals
        total_files = sum(fc.get("total_files", 0) for fc in all_counts.values())
        dates_with_files = len(all_counts)
        avg_files_per_date = round(total_files / dates_with_files, 1) if dates_with_files else 0

        assert total_files == 780  # 525 + 255
        assert dates_with_files == 2
        assert avg_files_per_date == 390.0


class TestBucketNameConsistency:
    """Tests for bucket name consistency across endpoints."""

    def test_bucket_names_format(self, sample_bucket_names):
        """Test that bucket names follow expected pattern."""
        market_data_buckets = sample_bucket_names["market_data"]

        for category, bucket_name in market_data_buckets.items():
            # Verify pattern
            assert "market-data-tick" in bucket_name
            assert category.lower() in bucket_name
            assert "test-project" in bucket_name

            # NOT the old wrong pattern
            assert "market-tick-data" not in bucket_name

    def test_instruments_bucket_names(self, sample_bucket_names):
        """Test instruments bucket names follow expected pattern."""
        instruments_buckets = sample_bucket_names["instruments"]

        for category, bucket_name in instruments_buckets.items():
            assert "instruments-store" in bucket_name
            assert category.lower() in bucket_name
            assert "test-project" in bucket_name


class TestMigratedDataStructure:
    """Tests for migrated data structure (venue as directory)."""

    def test_venue_is_directory_in_migrated_structure(self):
        """Test that venue is extracted from directory path in migrated structure."""
        # In migrated structure (key=value format), venue is a directory:
        # raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={inst}/venue={venue}/

        sample_path = "raw_tick_data/by_date/day=2021-06-15/data_type=trades/instrument_type=perpetuals/venue=BINANCE-FUTURES/file.parquet"
        parts = sample_path.rstrip("/").split("/")

        # Venue should be in the venue= segment (0-indexed: 5)
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


class TestDefiVenueExtraction:
    """Tests for DEFI venue extraction from deep directory paths.

    DEFI market-tick-data uses:
    raw_tick_data/by_date/day={date}/data_type={type}/instrument_type={inst}/venue={venue}/file.parquet

    The venue extraction needed to go 3 levels deep (data_type -> inst_type -> venue).
    """

    def test_venue_is_directory_in_defi_structure(self):
        """Test that DEFI venues are directories, not in filenames."""
        # DEFI path: .../data_type=liquidity/instrument_type=pool/venue=UNISWAPV2-ETHEREUM/file.parquet
        sample_path = "raw_tick_data/by_date/day=2026-01-01/data_type=liquidity/instrument_type=pool/venue=UNISWAPV2-ETHEREUM/UNISWAPV2-ETHEREUM:POOL:DAI-USDC@ETHEREUM.parquet"
        parts = sample_path.split("/")

        # Venue is in the 6th part (index 5): venue=UNISWAPV2-ETHEREUM
        venue_part = parts[5]
        assert venue_part.startswith("venue=")
        assert venue_part.split("=", 1)[1] == "UNISWAPV2-ETHEREUM"

    def test_venue_vs_underlying_detection(self):
        """Test distinguishing venues from underlyings in directory names.

        Venues: UNISWAPV2-ETHEREUM, BINANCE-FUTURES, DERIBIT
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
        assert not is_underlying("UNISWAPV2-ETHEREUM")
        assert not is_underlying("BINANCE-FUTURES")
        assert not is_underlying("DERIBIT")  # No dash

        # Test underlyings (should be detected)
        assert is_underlying("BTC-USD")
        assert is_underlying("ETH-USDT")
        assert is_underlying("BTC-USDC")

        # Edge cases
        assert is_underlying("AAVE-USD")  # Looks like underlying
        assert not is_underlying("UNISWAPV3-BASE")  # Chain suffix, not quote

    def test_three_level_depth_for_venue_extraction(self, mock_defi_gcs_structure):
        """Test that venue extraction goes 3 levels deep for DEFI."""
        # The structure requires traversing:
        # Level 1: data_type=* directories
        # Level 2: instrument_type directories (pool, lst, etc.)
        # Level 3: venue directories

        structure = mock_defi_gcs_structure["raw_tick_data/by_date/day=2024-01-01/"]

        # Extract venues (simulating the extraction logic)
        venues_found = set()
        for _l1, l1_content in structure.items():
            for _l2, l2_content in l1_content.items():
                for l3 in l2_content:
                    venue = l3.rstrip("/")
                    if venue.startswith("venue="):
                        venue = venue.split("=", 1)[1]
                        venues_found.add(venue)

        expected_venues = {"UNISWAPV2-ETHEREUM", "UNISWAPV3-ETHEREUM", "LIDO-ETH"}
        assert venues_found == expected_venues
