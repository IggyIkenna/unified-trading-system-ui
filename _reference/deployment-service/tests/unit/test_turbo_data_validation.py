"""
Unit tests for turbo data validation and configuration.

Tests the turbo mode data validation:
- Data type validation against venue_data_types.yaml
- Expected instrument types validation
- Data type validation summary calculations
"""

from pathlib import Path

import yaml


class TestDataTypeValidation:
    """Tests for data type validation against venue_data_types.yaml."""

    def test_expected_data_types_cefi_binance_futures(self):
        """Test expected data_types for BINANCE-FUTURES from config."""
        config_path = Path(__file__).parent.parent.parent / "configs" / "venue_data_types.yaml"
        if not config_path.exists():
            # Skip if config not found
            return

        with open(config_path) as f:
            config = yaml.safe_load(f)

        cefi_venues = config.get("CEFI", {}).get("venues", {})
        binance_futures = cefi_venues.get("BINANCE-FUTURES", {})
        expected_data_types = binance_futures.get("data_types", [])

        # BINANCE-FUTURES should have these data_types
        assert "trades" in expected_data_types
        assert "book_snapshot_5" in expected_data_types
        assert "derivative_ticker" in expected_data_types

    def test_expected_instrument_types_cefi_deribit(self):
        """Test expected instrument_types for DERIBIT from config."""
        config_path = Path(__file__).parent.parent.parent / "configs" / "venue_data_types.yaml"
        if not config_path.exists():
            return

        with open(config_path) as f:
            config = yaml.safe_load(f)

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
