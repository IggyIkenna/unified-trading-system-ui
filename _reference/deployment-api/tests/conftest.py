"""
Pytest configuration and fixtures for deployment-api tests.
"""

import socket

import pytest

from tests.mocks import make_mock_path_combinatorics

_original_connect = socket.socket.connect


def pytest_addoption(parser: pytest.Parser) -> None:
    parser.addoption(
        "--block-network",
        action="store_true",
        default=False,
        help="Block all socket connections to enforce credential-free CI runs.",
    )


def pytest_configure(config: pytest.Config) -> None:
    config.addinivalue_line(
        "markers",
        "allow_network: mark test as allowed to make network calls (opt-out of --block-network)",
    )


def _blocked_connect(self: socket.socket, address: object) -> None:
    raise OSError(f"Network access blocked by --block-network: attempted connection to {address}")


@pytest.fixture(autouse=True)
def _enforce_block_network(request: pytest.FixtureRequest) -> object:
    if not request.config.getoption("--block-network", default=False):
        yield
        return
    if request.node.get_closest_marker("allow_network"):
        yield
        return
    socket.socket.connect = _blocked_connect  # type: ignore[method-assign]
    yield
    socket.socket.connect = _original_connect  # type: ignore[method-assign]


@pytest.fixture
def mock_path_combinatorics():
    """Return a disabled PathCombinatorics mock (forces directory-listing path).

    Use in data_status tests to bypass combinatorics and exercise GCS listing.
    """
    return make_mock_path_combinatorics()
