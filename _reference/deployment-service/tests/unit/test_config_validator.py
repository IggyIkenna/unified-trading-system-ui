"""Tests for ConfigValidator and ValidationUtils."""

import pytest

from deployment_service.config.config_validator import (
    ConfigurationError,
    ConfigValidator,
    ValidationUtils,
)


class TestValidationUtils:
    """Test ValidationUtils functionality."""

    def test_get_required_with_value(self):
        """Test get_required with valid value."""
        config = {"key": "value"}
        result = ValidationUtils.get_required(config, "key")
        assert result == "value"

    def test_get_required_missing_key(self):
        """Test get_required raises for missing key."""
        config = {}
        with pytest.raises(ConfigurationError) as exc:
            ValidationUtils.get_required(config, "missing_key")
        assert "missing_key" in str(exc.value)

    def test_get_required_empty_string(self):
        """Test get_required raises for empty string."""
        config = {"key": ""}
        with pytest.raises(ConfigurationError) as exc:
            ValidationUtils.get_required(config, "key")
        assert "'key'" in str(exc.value)
        assert "cannot be empty" in str(exc.value)

    def test_get_required_none_value(self):
        """Test get_required raises for None value."""
        config = {"key": None}
        with pytest.raises(ConfigurationError) as exc:
            ValidationUtils.get_required(config, "key")
        # None is treated the same as empty
        assert "'key'" in str(exc.value)

    def test_get_required_env_with_value(self):
        """Test get_required with a dict containing the key works the same way."""
        config = {"TEST_VAR": "test_value"}
        result = ValidationUtils.get_required(config, "TEST_VAR")
        assert result == "test_value"

    def test_get_required_env_missing(self):
        """Test get_required raises for missing key."""
        config = {}
        with pytest.raises(ConfigurationError) as exc:
            ValidationUtils.get_required(config, "MISSING_VAR")
        assert "MISSING_VAR" in str(exc.value)

    def test_get_required_env_empty(self):
        """Test get_required raises for empty value."""
        config = {"EMPTY_VAR": ""}
        with pytest.raises(ConfigurationError) as exc:
            ValidationUtils.get_required(config, "EMPTY_VAR")
        assert "cannot be empty" in str(exc.value)

    def test_get_with_default(self):
        """Test get_with_default returns value when present."""
        config = {"key": "value"}
        result = ValidationUtils.get_with_default(config, "key", "default")
        assert result == "value"

    def test_get_with_default_missing(self):
        """Test get_with_default returns default when missing."""
        config = {}
        result = ValidationUtils.get_with_default(config, "missing", "default")
        assert result == "default"

    def test_get_with_default_empty_string(self):
        """Test get_with_default returns default for empty string."""
        config = {"key": ""}
        result = ValidationUtils.get_with_default(config, "key", "default")
        assert result == "default"

    def test_get_with_default_none(self):
        """Test get_with_default returns default for None."""
        config = {"key": None}
        result = ValidationUtils.get_with_default(config, "key", "default")
        assert result == "default"

    def test_get_env_with_default(self):
        """Test get_with_default returns value when set."""
        config = {"TEST_VAR": "test_value"}
        result = ValidationUtils.get_with_default(config, "TEST_VAR", "default")
        assert result == "test_value"

    def test_get_env_with_default_missing(self):
        """Test get_with_default returns default when missing."""
        config = {}
        result = ValidationUtils.get_with_default(config, "MISSING", "default")
        assert result == "default"

    def test_get_env_with_default_empty(self):
        """Test get_with_default returns default for empty."""
        config = {"EMPTY": ""}
        result = ValidationUtils.get_with_default(config, "EMPTY", "default")
        assert result == "default"


class TestConfigValidator:
    """Test ConfigValidator functionality."""

    @pytest.fixture
    def validator(self):
        """Create a ConfigValidator instance."""
        return ConfigValidator()

    def test_validate_sharding_valid(self, validator):
        """Test validate_service_config with valid config."""
        config = {
            "service": "test-svc",
            "dimensions": [
                {"name": "date", "type": "date_range"},
                {"name": "venue", "type": "fixed", "values": ["A"]},
            ],
        }
        # Should not raise
        validator.validate_service_config(config, "test-svc")
        assert True, "Validation passed without raising"

    def test_validate_sharding_missing_dimensions(self, validator):
        """Test validate_service_config raises for missing dimensions."""
        config = {"service": "test-svc"}
        with pytest.raises(ValueError) as exc:
            validator.validate_service_config(config, "test-svc")
        assert "dimensions" in str(exc.value)

    def test_validate_sharding_invalid_max_shards(self, validator):
        """Test validate_service_config raises for invalid dimension type."""
        config = {
            "service": "test-svc",
            "dimensions": [{"name": "date", "type": "invalid_type"}],
        }
        with pytest.raises(ValueError):
            validator.validate_service_config(config, "test-svc")

    def test_validate_sharding_invalid_dimensions_type(self, validator):
        """Test validate_service_config with non-list dimensions."""
        config = {
            "service": "test-svc",
            "dimensions": "not-a-list",
        }
        with pytest.raises((ValueError, TypeError, AttributeError)):
            validator.validate_service_config(config, "test-svc")

    def test_validate_deployment_valid(self, validator):
        """Test validate_venues_config with valid config."""
        config = {
            "categories": {
                "CEFI": {"venues": ["BINANCE-SPOT"]},
                "TRADFI": {"venues": ["NYSE"]},
            }
        }
        # Should not raise
        validator.validate_venues_config(config)
        assert True, "Validation passed without raising"

    def test_validate_deployment_missing_service(self, validator):
        """Test validate_venues_config raises for missing categories."""
        config = {}
        with pytest.raises(ValueError) as exc:
            validator.validate_venues_config(config)
        assert "categories" in str(exc.value)

    def test_validate_deployment_invalid_backend(self, validator):
        """Test validate_venues_config with invalid structure."""
        config = {
            "categories": {
                "CEFI": {"no_venues_key": []},
            }
        }
        with pytest.raises(ValueError):
            validator.validate_venues_config(config)

    def test_validate_bucket_valid(self, validator):
        """Test validate_cloud_providers_config with valid config."""
        config = {
            "gcp": {"container_registry": {"url_pattern": "gcr.io/{project}"}},
        }
        # Should not raise
        validator.validate_cloud_providers_config(config)
        assert True, "Validation passed without raising"

    def test_validate_bucket_missing_name(self, validator):
        """Test validate_cloud_providers_config with invalid provider type."""
        config = {"gcp": "not-a-dict"}
        with pytest.raises(ValueError) as exc:
            validator.validate_cloud_providers_config(config)
        assert "gcp" in str(exc.value)

    def test_validate_bucket_invalid_name(self, validator):
        """Test validate_cloud_providers_config with invalid aws config."""
        config = {"aws": 12345}
        with pytest.raises(ValueError):
            validator.validate_cloud_providers_config(config)

    def test_validate_docker_valid(self, validator):
        """Test validate_expected_start_dates_config with valid config."""
        config = {
            "instruments-service": {
                "CEFI": {
                    "category_start": "2021-01-01",
                    "venues": {"BINANCE-SPOT": "2021-01-01"},
                }
            }
        }
        # Should not raise
        validator.validate_expected_start_dates_config(config)
        assert True, "Validation passed without raising"

    def test_validate_docker_missing_image(self, validator):
        """Test validate_service_config raises for missing required key."""
        config = {}
        with pytest.raises(ValueError) as exc:
            validator.validate_service_config(config, "svc")
        assert "service" in str(exc.value)

    def test_validate_docker_invalid_image_format(self, validator):
        """Test validate_service_config raises for dimension missing name."""
        config = {
            "service": "svc",
            "dimensions": [{"type": "fixed", "values": ["a"]}],
        }
        with pytest.raises(ValueError):
            validator.validate_service_config(config, "svc")

    def test_validate_comprehensive(self, validator):
        """Test comprehensive validation of complex config."""
        venues_config = {
            "categories": {
                "CEFI": {"venues": ["BINANCE-SPOT"]},
            }
        }
        service_config = {
            "service": "test-svc",
            "dimensions": [{"name": "category", "type": "fixed", "values": ["CEFI"]}],
        }

        # Validate each section - should not raise
        validator.validate_venues_config(venues_config)
        validator.validate_service_config(service_config, "test-svc")
        assert True, "Validation passed without raising"


class TestConfigurationError:
    """Test ConfigurationError exception."""

    def test_configuration_error_message(self):
        """Test ConfigurationError preserves message."""
        error = ConfigurationError("Test error message")
        assert str(error) == "Test error message"

    def test_configuration_error_inheritance(self):
        """Test ConfigurationError inherits from Exception."""
        error = ConfigurationError("Test")
        assert isinstance(error, Exception)
