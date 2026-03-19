"""
Unit tests for config_loader module.

Covers ConfigLoader class methods including YAML loading, caching,
service listing, and compute configuration retrieval.
"""

import pytest

from deployment_api.config_loader import ConfigLoader


@pytest.fixture()
def config_dir(tmp_path):
    """Create a temporary config directory with sample YAML files."""
    configs = tmp_path / "configs"
    configs.mkdir()

    # Create venues.yaml
    (configs / "venues.yaml").write_text(
        "CEFI:\n  BINANCE: true\n  OKX: true\nDEFI:\n  UNISWAP: true\n"
    )

    # Create sharding config for instruments-service
    (configs / "sharding.instruments-service.yaml").write_text(
        "service: instruments-service\n"
        "dimensions:\n"
        "  - name: category\n"
        "    values: [CEFI, DEFI]\n"
        "compute:\n"
        "  default:\n"
        "    max_workers: 4\n"
        "    machine_type: n1-standard-4\n"
        "  large:\n"
        "    max_workers: 8\n"
        "    machine_type: n1-standard-8\n"
    )

    # Create expected_start_dates.yaml
    (configs / "expected_start_dates.yaml").write_text(
        "instruments-service:\n  CEFI:\n    BINANCE:\n      spot: '2020-01-01'\n"
    )

    return configs


class TestConfigLoaderInit:
    def test_init_sets_config_dir(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        assert loader.config_dir == config_dir

    def test_init_creates_empty_cache(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        assert loader._cache == {}


class TestLoadYamlFile:
    def test_loads_existing_file(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader._load_yaml_file("venues.yaml")
        assert "CEFI" in result

    def test_raises_file_not_found(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        with pytest.raises(FileNotFoundError):
            loader._load_yaml_file("nonexistent.yaml")

    def test_caches_loaded_file(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        loader._load_yaml_file("venues.yaml")
        assert "venues.yaml" in loader._cache

    def test_uses_cache_key(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        loader._load_yaml_file("venues.yaml", cache_key="venues")
        assert "venues" in loader._cache

    def test_returns_cached_value(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        # Pre-populate cache
        loader._cache["venues.yaml"] = {"cached": True}
        result = loader._load_yaml_file("venues.yaml")
        assert result == {"cached": True}


class TestLoadOptionalYamlFile:
    def test_returns_empty_dict_when_missing(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader._load_optional_yaml_file("missing.yaml")
        assert result == {}

    def test_returns_default_when_missing(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader._load_optional_yaml_file("missing.yaml", default={"key": "val"})
        assert result == {"key": "val"}

    def test_loads_existing_optional_file(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader._load_optional_yaml_file("venues.yaml")
        assert "CEFI" in result


class TestLoadVenuesConfig:
    def test_loads_venues(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.load_venues_config()
        assert "CEFI" in result
        assert "DEFI" in result


class TestLoadServiceConfig:
    def test_loads_service_config(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.load_service_config("instruments-service")
        assert "dimensions" in result

    def test_raises_for_unknown_service(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        with pytest.raises(FileNotFoundError):
            loader.load_service_config("unknown-service")


class TestLoadExpectedStartDates:
    def test_loads_expected_dates(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.load_expected_start_dates()
        assert "instruments-service" in result

    def test_returns_empty_when_missing(self, tmp_path):
        loader = ConfigLoader(str(tmp_path / "configs"))
        result = loader.load_expected_start_dates()
        assert result == {}


class TestListAvailableServices:
    def test_lists_services(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        services = loader.list_available_services()
        assert "instruments-service" in services

    def test_returns_empty_when_dir_missing(self, tmp_path):
        loader = ConfigLoader(str(tmp_path / "nonexistent"))
        services = loader.list_available_services()
        assert services == []


class TestGetComputeRecommendation:
    def test_returns_default_config(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.get_compute_recommendation("instruments-service", "default")
        assert result["max_workers"] == 4

    def test_returns_specific_compute_type(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.get_compute_recommendation("instruments-service", "large")
        assert result["max_workers"] == 8

    def test_returns_empty_for_unknown_service(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.get_compute_recommendation("unknown-service", "default")
        assert result == {}

    def test_returns_default_when_type_missing(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.get_compute_recommendation("instruments-service", "nonexistent_type")
        assert result["max_workers"] == 4  # falls back to "default"


class TestGetScaledComputeConfig:
    def test_overrides_max_workers(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.get_scaled_compute_config("instruments-service", "default", max_workers=16)
        assert result["max_workers"] == 16

    def test_no_override_when_none(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.get_scaled_compute_config(
            "instruments-service", "default", max_workers=None
        )
        assert result["max_workers"] == 4

    def test_skip_venue_param_ignored(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        result = loader.get_scaled_compute_config("instruments-service", "default", skip_venue=True)
        assert "max_workers" in result


class TestClearCache:
    def test_clears_cache(self, config_dir):
        loader = ConfigLoader(str(config_dir))
        loader.load_venues_config()
        assert len(loader._cache) > 0
        loader.clear_cache()
        assert loader._cache == {}
