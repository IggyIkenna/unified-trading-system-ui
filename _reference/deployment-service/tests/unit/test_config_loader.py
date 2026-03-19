"""
Unit tests for ConfigLoader.

Tests configuration loading and validation for:
- venues.yaml (venue-category mappings)
- sharding.*.yaml (per-service sharding configs)
"""

import pytest
import yaml

from deployment_service.config_loader import ConfigLoader, parse_gcs_path


class TestConfigLoaderInitialization:
    """Tests for ConfigLoader initialization."""

    def test_init_with_valid_dir(self, temp_config_dir):
        """Test initialization with valid config directory."""
        loader = ConfigLoader(str(temp_config_dir))
        assert loader.config_dir.exists()

    def test_init_with_nonexistent_dir(self, tmp_path):
        """Test initialization with non-existent directory."""
        loader = ConfigLoader(str(tmp_path / "nonexistent"))
        # Should not raise immediately - only when loading
        assert not loader.config_dir.exists()


class TestLoadVenuesConfig:
    """Tests for venues.yaml loading."""

    def test_load_venues_config(self, temp_config_dir):
        """Test loading valid venues config."""
        loader = ConfigLoader(str(temp_config_dir))
        config = loader.load_venues_config()

        assert "categories" in config
        assert "CEFI" in config["categories"]
        assert "TRADFI" in config["categories"]
        assert "DEFI" in config["categories"]

    def test_venues_config_has_venues(self, temp_config_dir):
        """Test that each category has venues list."""
        loader = ConfigLoader(str(temp_config_dir))
        config = loader.load_venues_config()

        for _category, cat_config in config["categories"].items():
            assert "venues" in cat_config
            assert isinstance(cat_config["venues"], list)
            assert len(cat_config["venues"]) > 0

    def test_venues_config_caching(self, temp_config_dir):
        """Test that venues config is cached."""
        loader = ConfigLoader(str(temp_config_dir))

        config1 = loader.load_venues_config()
        config2 = loader.load_venues_config()

        assert config1 is config2  # Same object (cached)

    def test_venues_config_missing(self, tmp_path):
        """Test error when venues.yaml is missing."""
        loader = ConfigLoader(str(tmp_path))

        with pytest.raises(FileNotFoundError, match="Config file not found"):
            loader.load_venues_config()

    def test_venues_config_invalid_yaml(self, tmp_path):
        """Test error with invalid YAML."""
        config_dir = tmp_path / "configs"
        config_dir.mkdir()

        with open(config_dir / "venues.yaml", "w") as f:
            f.write("invalid: yaml: content: [")

        loader = ConfigLoader(str(config_dir))

        with pytest.raises(yaml.YAMLError):
            loader.load_venues_config()

    def test_venues_config_missing_categories(self, tmp_path):
        """Test error when categories key is missing."""
        config_dir = tmp_path / "configs"
        config_dir.mkdir()

        with open(config_dir / "venues.yaml", "w") as f:
            yaml.dump({"other_key": {}}, f)

        loader = ConfigLoader(str(config_dir))

        with pytest.raises(ValueError, match="must have 'categories' key"):
            loader.load_venues_config()


class TestLoadServiceConfig:
    """Tests for per-service sharding config loading."""

    def test_load_service_config(self, temp_config_with_service):
        """Test loading valid service config."""
        loader = ConfigLoader(str(temp_config_with_service))
        config = loader.load_service_config("test-service")

        assert config["service"] == "test-service"
        assert "dimensions" in config
        assert len(config["dimensions"]) > 0

    def test_service_config_caching(self, temp_config_with_service):
        """Test that service configs are cached."""
        loader = ConfigLoader(str(temp_config_with_service))

        config1 = loader.load_service_config("test-service")
        config2 = loader.load_service_config("test-service")

        assert config1 is config2

    def test_service_config_missing(self, temp_config_dir):
        """Test error when service config is missing."""
        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(FileNotFoundError, match="Config file not found"):
            loader.load_service_config("nonexistent-service")

    def test_service_config_name_mismatch(self, temp_config_dir):
        """Test error when service name doesn't match filename."""
        bad_config = {
            "service": "wrong-name",
            "dimensions": [{"name": "test", "type": "fixed", "values": ["a"]}],
        }
        with open(temp_config_dir / "sharding.test-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="Service name mismatch"):
            loader.load_service_config("test-service")


class TestServiceConfigValidation:
    """Tests for service config validation."""

    def test_missing_required_keys(self, temp_config_dir):
        """Test validation error for missing required keys."""
        bad_config = {"description": "Missing service and dimensions"}
        with open(temp_config_dir / "sharding.bad-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="missing required key"):
            loader.load_service_config("bad-service")

    def test_dimension_missing_name(self, temp_config_dir):
        """Test validation error for dimension without name."""
        bad_config = {
            "service": "bad-service",
            "dimensions": [{"type": "fixed", "values": ["a"]}],
        }
        with open(temp_config_dir / "sharding.bad-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="missing 'name'"):
            loader.load_service_config("bad-service")

    def test_dimension_missing_type(self, temp_config_dir):
        """Test validation error for dimension without type."""
        bad_config = {
            "service": "bad-service",
            "dimensions": [{"name": "test", "values": ["a"]}],
        }
        with open(temp_config_dir / "sharding.bad-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="missing 'type'"):
            loader.load_service_config("bad-service")

    def test_dimension_invalid_type(self, temp_config_dir):
        """Test validation error for invalid dimension type."""
        bad_config = {
            "service": "bad-service",
            "dimensions": [{"name": "test", "type": "invalid_type", "values": ["a"]}],
        }
        with open(temp_config_dir / "sharding.bad-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="invalid type"):
            loader.load_service_config("bad-service")

    def test_fixed_dimension_missing_values(self, temp_config_dir):
        """Test validation error for fixed dimension without values."""
        bad_config = {
            "service": "bad-service",
            "dimensions": [{"name": "test", "type": "fixed"}],
        }
        with open(temp_config_dir / "sharding.bad-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="must have 'values'"):
            loader.load_service_config("bad-service")

    def test_hierarchical_dimension_missing_parent(self, temp_config_dir):
        """Test validation error for hierarchical dimension without parent."""
        bad_config = {
            "service": "bad-service",
            "dimensions": [{"name": "test", "type": "hierarchical"}],
        }
        with open(temp_config_dir / "sharding.bad-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="must have 'parent'"):
            loader.load_service_config("bad-service")

    def test_date_range_invalid_granularity(self, temp_config_dir):
        """Test validation error for invalid date granularity."""
        bad_config = {
            "service": "bad-service",
            "dimensions": [{"name": "date", "type": "date_range", "granularity": "hourly"}],
        }
        with open(temp_config_dir / "sharding.bad-service.yaml", "w") as f:
            yaml.dump(bad_config, f)

        loader = ConfigLoader(str(temp_config_dir))

        with pytest.raises(ValueError, match="invalid granularity"):
            loader.load_service_config("bad-service")

    def test_date_range_none_granularity(self, temp_config_dir):
        """Test 'none' granularity is accepted (for bulk download services)."""
        config = {
            "service": "bulk-service",
            "dimensions": [
                {"name": "category", "type": "fixed", "values": ["TRADFI"]},
                {"name": "date", "type": "date_range", "granularity": "none"},
            ],
        }
        with open(temp_config_dir / "sharding.bulk-service.yaml", "w") as f:
            yaml.dump(config, f)

        loader = ConfigLoader(str(temp_config_dir))
        loaded = loader.load_service_config("bulk-service")

        # Should load without error
        assert loaded["service"] == "bulk-service"
        date_dim = next(d for d in loaded["dimensions"] if d["name"] == "date")
        assert date_dim["granularity"] == "none"


class TestListAvailableServices:
    """Tests for listing available services."""

    def test_list_services(self, temp_config_with_service):
        """Test listing available services."""
        loader = ConfigLoader(str(temp_config_with_service))
        services = loader.list_available_services()

        assert "test-service" in services

    def test_list_services_empty_dir(self, tmp_path):
        """Test listing services in empty directory."""
        config_dir = tmp_path / "configs"
        config_dir.mkdir()

        loader = ConfigLoader(str(config_dir))
        services = loader.list_available_services()

        assert services == []

    def test_list_services_nonexistent_dir(self, tmp_path):
        """Test listing services in non-existent directory."""
        loader = ConfigLoader(str(tmp_path / "nonexistent"))
        services = loader.list_available_services()

        assert services == []


class TestComputeRecommendation:
    """Tests for compute recommendation retrieval."""

    def test_get_vm_recommendation(self, temp_config_with_service):
        """Test getting VM recommendations."""
        loader = ConfigLoader(str(temp_config_with_service))
        rec = loader.get_compute_recommendation("test-service", "vm")

        assert "machine_type" in rec
        assert "disk_size_gb" in rec

    def test_get_cloud_run_recommendation(self, temp_config_with_service):
        """Test getting Cloud Run recommendations."""
        loader = ConfigLoader(str(temp_config_with_service))
        rec = loader.get_compute_recommendation("test-service", "cloud_run")

        assert "memory" in rec
        assert "cpu" in rec

    def test_get_default_recommendation(self, temp_config_dir):
        """Test default recommendations when not specified in config."""
        minimal_config = {
            "service": "minimal-service",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["A"]}],
        }
        with open(temp_config_dir / "sharding.minimal-service.yaml", "w") as f:
            yaml.dump(minimal_config, f)

        loader = ConfigLoader(str(temp_config_dir))
        vm_rec = loader.get_compute_recommendation("minimal-service", "vm")
        cr_rec = loader.get_compute_recommendation("minimal-service", "cloud_run")

        # Should return defaults (c2-standard-4 is the default VM type)
        assert vm_rec["machine_type"] == "c2-standard-4"
        assert cr_rec["memory"] == "4Gi"


class TestCliArgsMapping:
    """Tests for CLI argument mapping retrieval."""

    def test_get_cli_args_mapping(self, temp_config_with_service):
        """Test getting CLI argument mappings."""
        loader = ConfigLoader(str(temp_config_with_service))
        mapping = loader.get_cli_args_mapping("test-service")

        assert "category" in mapping
        assert mapping["category"] == "--category"

    def test_get_cli_flags(self, temp_config_dir):
        """Test getting CLI flags."""
        config_with_flags = {
            "service": "flagged-service",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["A"]}],
            "cli_flags": {
                "operation": "--operation instrument",
                "mode": "--mode batch",
            },
        }
        with open(temp_config_dir / "sharding.flagged-service.yaml", "w") as f:
            yaml.dump(config_with_flags, f)

        loader = ConfigLoader(str(temp_config_dir))
        flags = loader.get_cli_flags("flagged-service")

        assert "operation" in flags
        assert flags["operation"] == "--operation instrument"
        assert "mode" in flags
        assert flags["mode"] == "--mode batch"


class TestParseGcsPath:
    """Tests for GCS path parsing utility."""

    def test_parse_valid_gcs_path(self):
        """Test parsing valid GCS path."""
        bucket, prefix = parse_gcs_path("gs://my-bucket/some/prefix/path")

        assert bucket == "my-bucket"
        assert prefix == "some/prefix/path"

    def test_parse_gcs_path_no_prefix(self):
        """Test parsing GCS path without prefix."""
        bucket, prefix = parse_gcs_path("gs://my-bucket")

        assert bucket == "my-bucket"
        assert prefix == ""

    def test_parse_gcs_path_with_trailing_slash(self):
        """Test parsing GCS path with trailing slash."""
        bucket, prefix = parse_gcs_path("gs://my-bucket/prefix/")

        assert bucket == "my-bucket"
        assert prefix == "prefix/"

    def test_parse_invalid_gcs_path(self):
        """Test error for invalid GCS path."""
        with pytest.raises(ValueError, match="Invalid GCS path"):
            parse_gcs_path("https://my-bucket/path")

    def test_parse_s3_path_error(self):
        """Test error for S3 path (not supported by this function)."""
        with pytest.raises(ValueError, match="Invalid GCS path"):
            parse_gcs_path("s3://my-bucket/path")


class TestAllServiceConfigs:
    """Tests to verify all 11 service configs can be loaded from the real config dir."""

    @pytest.fixture
    def real_config_dir(self):
        """Get the real configs directory."""
        from pathlib import Path

        # Try to find the real configs directory
        possible_paths = [
            Path(__file__).parent.parent.parent / "configs",
            Path.cwd() / "configs",
        ]

        for path in possible_paths:
            if path.exists() and (path / "venues.yaml").exists():
                return path

        pytest.skip("Real config directory not found")

    def test_load_all_real_service_configs(self, real_config_dir, all_service_configs):
        """Test loading all 11 real service configs."""
        loader = ConfigLoader(str(real_config_dir))

        for service in all_service_configs:
            try:
                config = loader.load_service_config(service)
                assert config["service"] == service
                assert "dimensions" in config
            except FileNotFoundError:
                pytest.skip(f"Service config for {service} not found")

    def test_real_venues_config(self, real_config_dir):
        """Test loading real venues config."""
        loader = ConfigLoader(str(real_config_dir))
        config = loader.load_venues_config()

        assert "CEFI" in config["categories"]
        assert "TRADFI" in config["categories"]
        assert "DEFI" in config["categories"]

        # Verify known venues exist
        cefi_venues = config["categories"]["CEFI"]["venues"]
        assert "BINANCE-SPOT" in cefi_venues
        assert "DERIBIT" in cefi_venues


class TestC2MachineTypeSnapToValid:
    """Tests for C2 machine type snap-to-valid logic (4, 8, 16, 30, 60 vCPUs only in GCP)."""

    @pytest.fixture
    def config_dir_c2_scaling(self, temp_config_dir):
        """Service with c2-standard-16 and base max_workers=8 for scaling tests."""
        service_config = {
            "service": "c2-scale-test",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["CEFI"]}],
            "compute": {
                "vm": {"machine_type": "c2-standard-16", "disk_size_gb": 150},
                "cloud_run": {"memory": "16Gi", "cpu": "4"},
            },
            "cli_optional": [
                {"name": "max-workers", "flag": "--max-workers", "default": 8},
            ],
        }
        with open(temp_config_dir / "sharding.c2-scale-test.yaml", "w") as f:
            yaml.dump(service_config, f)
        return temp_config_dir

    def test_scaled_32_snaps_to_30(self, config_dir_c2_scaling):
        """Scale 16 * 2 = 32 must snap to c2-standard-30 (32 does not exist in GCP)."""
        loader = ConfigLoader(str(config_dir_c2_scaling))
        config = loader.get_scaled_compute_config("c2-scale-test", "vm", max_workers=16)
        assert config["machine_type"] == "c2-standard-30"

    def test_no_scale_unchanged(self, config_dir_c2_scaling):
        """Scale 1.0 leaves c2-standard-16 unchanged."""
        loader = ConfigLoader(str(config_dir_c2_scaling))
        config = loader.get_scaled_compute_config("c2-scale-test", "vm", max_workers=8)
        assert config["machine_type"] == "c2-standard-16"

    def test_scaled_45_snaps_to_nearest_valid(self, config_dir_c2_scaling):
        """Requested vCPU in (30, 60) range snaps to nearest valid."""
        loader = ConfigLoader(str(config_dir_c2_scaling))
        config = loader.get_scaled_compute_config("c2-scale-test", "vm", max_workers=23)
        # 16 * (23/8) = 46 -> snap to 60 (nearest valid)
        assert config["machine_type"] in ("c2-standard-30", "c2-standard-60")

    def test_capped_at_60(self, config_dir_c2_scaling):
        """Scale that would exceed 60 caps at c2-standard-60."""
        loader = ConfigLoader(str(config_dir_c2_scaling))
        config = loader.get_scaled_compute_config("c2-scale-test", "vm", max_workers=64)
        assert config["machine_type"] == "c2-standard-60"
