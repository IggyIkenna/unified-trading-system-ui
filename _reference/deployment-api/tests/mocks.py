"""
Shared mocks for deployment-service tests.

Provides reusable mock builders for GCS, PathCombinatorics, etc.
"""

from unittest.mock import MagicMock


def make_mock_path_combinatorics():
    """Return a disabled PathCombinatorics mock (forces directory-listing path).

    Use in data_status tests to bypass combinatorics and exercise GCS listing.
    """
    pc = MagicMock()
    pc.get_combinatorics.return_value = []
    pc.has_service_combinatorics.return_value = False
    pc.get_service_prefixes_for_date.return_value = []
    pc.config_loader = MagicMock()
    pc.config_loader.load_service_config.side_effect = Exception("mock")
    return pc
