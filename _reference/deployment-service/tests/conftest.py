"""
Pytest configuration and fixtures for deployment-service tests.
"""

import contextlib
import json
import os
import subprocess
from pathlib import Path
from unittest.mock import MagicMock

import pytest
import yaml
from google.auth import default as google_auth_default
from google.auth.exceptions import DefaultCredentialsError
from google.oauth2 import service_account

from tests.mocks import make_mock_path_combinatorics


def pytest_addoption(parser: pytest.Parser) -> None:
    """Register --block-network option used by quality-gates.sh.

    pytest-socket (0.7.x) does not expose --block-network; we register it
    here so the QG invocation `pytest --block-network` doesn't fail with
    "unrecognised arguments". The option is a no-op in this repo — network
    isolation is handled by mock_secret_client and CLOUD_MOCK_MODE=true.
    """
    with contextlib.suppress(ValueError):
        parser.addoption(
            "--block-network",
            action="store_true",
            default=False,
            help="Block all socket connections to enforce credential-free CI runs.",
        )


@pytest.fixture(autouse=True)
def mock_secret_client(monkeypatch):
    """Prevent real secret access in all unit tests."""
    mock = MagicMock(return_value="fake-secret-value")
    monkeypatch.setattr("unified_cloud_interface.get_secret_client", lambda *a, **kw: mock)
    return mock


def _cred_file() -> str | None:
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if creds_path and Path(creds_path).exists():
        return creds_path
    return None


def _project_from_gcloud() -> str | None:
    try:
        result = subprocess.run(
            ["gcloud", "config", "get-value", "project"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        val = result.stdout.strip()
        return val if val and val != "(unset)" else None
    except (OSError, ValueError, RuntimeError):
        return None


@pytest.fixture(scope="session")
def gcp_auth_info() -> tuple[object | None, str, str | None]:
    """Smart GCP auth — SA key, ADC, or Cloud Build metadata. Returns (credentials|None, project_id, creds_file|None)."""
    creds_file = _cred_file()
    if creds_file:
        try:
            credentials = service_account.Credentials.from_service_account_file(creds_file)
            with open(creds_file) as f:
                sa_project = json.load(f).get("project_id")
            return credentials, sa_project or "test-project", creds_file
        except (OSError, ValueError, RuntimeError):
            pass

    try:
        credentials, adc_project = google_auth_default()
        project_id = adc_project or os.getenv("GCP_PROJECT_ID") or _project_from_gcloud()
        return credentials, project_id or "test-project", None
    except DefaultCredentialsError:
        pass

    return None, "test-project", None


@pytest.fixture(scope="session")
def gcp_project_id(gcp_auth_info: tuple[object | None, str, str | None]) -> str:
    _, project_id, _ = gcp_auth_info
    return project_id


@pytest.fixture(autouse=True)
def _skip_integration_without_creds(
    request: pytest.FixtureRequest,
    gcp_auth_info: tuple[object | None, str, str | None],
) -> None:
    """Skip @pytest.mark.integration tests when no real GCP credentials available."""
    if "integration" in request.keywords:
        credentials, _, _ = gcp_auth_info
        if credentials is None:
            pytest.skip("No GCP credentials — skipping integration test")


# Import shared fixtures from fixtures modules
pytest_plugins = [
    "tests.fixtures.deployment_fixtures",
    "tests.fixtures.cloud_fixtures",
    "tests.fixtures.data_fixtures",
    "tests.unit.turbo_fixtures",
]


@pytest.fixture
def mock_path_combinatorics():
    """Return a disabled PathCombinatorics mock (forces directory-listing path).

    Use in data_status tests to bypass combinatorics and exercise GCS listing.
    """
    return make_mock_path_combinatorics()


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set mock environment variables for testing and patch module-level config singletons."""
    monkeypatch.setenv("CLOUD_MOCK_MODE", "true")
    monkeypatch.setenv("GCP_PROJECT_ID", "test-project-123")
    # Patch module-level _config singletons that are already initialized at import time
    for mod_path in [
        "deployment_service.cloud.storage_client",
        "deployment_service.cloud_client",
        "deployment_service.catalog",
    ]:
        try:
            mod = __import__(mod_path, fromlist=["_config"])
            monkeypatch.setattr(mod._config, "is_mock_mode", lambda: True)
            monkeypatch.setattr(mod._config, "gcp_project_id", "test-project-123")
        except (ImportError, AttributeError):
            pass
    try:
        import deployment_service.catalog as cat_mod

        monkeypatch.setattr(cat_mod, "_PROJECT_ID", "test-project-123")
    except (ImportError, AttributeError):
        pass


@pytest.fixture
def temp_config_dir(tmp_path):
    """Create a temporary config directory with test configs."""
    config_dir = tmp_path / "configs"
    config_dir.mkdir()

    # Create venues.yaml
    venues_config = {
        "categories": {
            "CEFI": {
                "description": "Test CEFI",
                "venues": ["BINANCE-SPOT", "BINANCE-FUTURES", "DERIBIT"],
                "data_types": ["trades", "book_snapshot_5"],
            },
            "TRADFI": {
                "description": "Test TRADFI",
                "venues": ["CME", "NASDAQ"],
                "data_types": ["trades", "ohlcv_1m"],
            },
            "DEFI": {
                "description": "Test DEFI",
                "venues": ["UNISWAPV3-ETH", "AAVE_V3_ETH"],
                "data_types": ["swaps", "oracle_prices"],
            },
        }
    }

    with open(config_dir / "venues.yaml", "w") as f:
        yaml.dump(venues_config, f)

    return config_dir


@pytest.fixture
def sample_service_config():
    """Return a sample service configuration."""
    return {
        "service": "test-service",
        "description": "Test service for unit tests",
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
def temp_config_with_service(temp_config_dir, sample_service_config):
    """Create a temp config dir with a sample service config."""
    with open(temp_config_dir / "sharding.test-service.yaml", "w") as f:
        yaml.dump(sample_service_config, f)

    return temp_config_dir


@pytest.fixture
def hierarchical_service_config():
    """Return a service config with hierarchical dimensions."""
    return {
        "service": "hierarchical-test-service",
        "description": "Test hierarchical dimensions",
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
                "granularity": "weekly",
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
def gcs_dynamic_service_config():
    """Return a service config with GCS dynamic dimensions."""
    return {
        "service": "gcs-dynamic-test-service",
        "description": "Test GCS dynamic dimensions",
        "dimensions": [
            {
                "name": "domain",
                "type": "fixed",
                "values": ["cefi", "tradfi"],
            },
            {
                "name": "config",
                "type": "gcs_dynamic",
                "gcs_bucket_template": "test-configs-{domain}",
                "gcs_prefix": "grid_configs/",
                "file_pattern": "**/*.json",
            },
            {
                "name": "date",
                "type": "date_range",
                "granularity": "daily",
            },
        ],
        "cli_args": {
            "domain": "--domain",
            "config_path": "--config-gcs",
            "start_date": "--start",
            "end_date": "--end",
        },
    }


@pytest.fixture
def mock_cloud_files():
    """Return mock cloud file lists for testing."""
    return {
        "gs://test-configs-cefi/grid_configs/": [
            "gs://test-configs-cefi/grid_configs/btc_momentum.json",
            "gs://test-configs-cefi/grid_configs/eth_mean_reversion.json",
        ],
        "gs://test-configs-tradfi/grid_configs/": [
            "gs://test-configs-tradfi/grid_configs/spy_market_making.json",
        ],
    }


@pytest.fixture
def all_service_configs():
    """Return configs for all 11 services for comprehensive testing."""
    return [
        "instruments-service",
        "market-tick-data-service",
        "market-data-processing-service",
        "features-delta-one-service",
        "features-volatility-service",
        "features-onchain-service",
        "features-calendar-service",
        "ml-training-service",
        "ml-inference-service",
        "strategy-service",
        "execution-service",
    ]


@pytest.fixture
def expected_start_dates_config():
    """Return expected start dates configuration for testing venue start date filtering."""
    return {
        "hierarchical-test-service": {
            "CEFI": {
                "category_start": "2024-01-01",
                "venues": {
                    "BINANCE-SPOT": "2024-01-01",
                    "BINANCE-FUTURES": "2024-01-05",  # Launches later
                    "DERIBIT": "2024-01-01",
                },
            },
            "TRADFI": {
                "category_start": "2024-01-01",
                "venues": {
                    "CME": "2024-01-01",
                    "NASDAQ": "2024-01-03",  # Launches later
                },
            },
            "DEFI": {
                "category_start": "2024-01-10",  # DEFI launches later
                "venues": {
                    "UNISWAPV3-ETH": "2024-01-10",
                    "AAVE_V3_ETH": "2024-01-15",  # Launches even later
                },
            },
        },
        "test-service": {
            "CEFI": {
                "category_start": "2024-01-01",
            },
            "TRADFI": {
                "category_start": "2024-01-01",
            },
            "DEFI": {
                "category_start": "2024-01-01",
            },
        },
    }


@pytest.fixture
def temp_config_with_start_dates(
    temp_config_dir, hierarchical_service_config, expected_start_dates_config
):
    """Create a temp config dir with service config and expected_start_dates.yaml."""
    # Write the service config
    with open(temp_config_dir / "sharding.hierarchical-test-service.yaml", "w") as f:
        yaml.dump(hierarchical_service_config, f)

    # Write the expected_start_dates.yaml
    with open(temp_config_dir / "expected_start_dates.yaml", "w") as f:
        yaml.dump(expected_start_dates_config, f)

    return temp_config_dir
