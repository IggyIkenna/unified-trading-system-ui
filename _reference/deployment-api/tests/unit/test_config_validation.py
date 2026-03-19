"""
Unit tests for config_validation module.

Covers ConfigurationError and ValidationUtils.get_required and get_with_default.
"""

import pytest

from deployment_api.utils.config_validation import ConfigurationError, ValidationUtils


class TestConfigurationError:
    def test_is_exception(self):
        err = ConfigurationError("msg")
        assert isinstance(err, Exception)
        assert str(err) == "msg"


class TestGetRequired:
    def test_returns_value_when_present(self):
        config = {"key": "value"}
        result = ValidationUtils.get_required(config, "key")
        assert result == "value"

    def test_raises_when_key_missing(self):
        config = {}
        with pytest.raises(ConfigurationError, match="Missing required"):
            ValidationUtils.get_required(config, "key")

    def test_raises_when_key_missing_with_context(self):
        config = {}
        with pytest.raises(ConfigurationError, match="in my-context"):
            ValidationUtils.get_required(config, "key", context="my-context")

    def test_raises_when_value_is_none(self):
        config = {"key": None}
        with pytest.raises(ConfigurationError, match="cannot be empty"):
            ValidationUtils.get_required(config, "key")

    def test_raises_when_value_is_empty_string(self):
        config = {"key": "   "}
        with pytest.raises(ConfigurationError, match="cannot be empty"):
            ValidationUtils.get_required(config, "key")

    def test_raises_empty_with_context(self):
        config = {"key": ""}
        with pytest.raises(ConfigurationError, match="in service-config"):
            ValidationUtils.get_required(config, "key", context="service-config")

    def test_returns_non_string_value(self):
        config = {"key": 42}
        result = ValidationUtils.get_required(config, "key")
        assert result == 42

    def test_returns_dict_value(self):
        config = {"key": {"nested": "data"}}
        result = ValidationUtils.get_required(config, "key")
        assert result == {"nested": "data"}


class TestGetWithDefault:
    def test_returns_value_when_present(self):
        config = {"key": "value"}
        result = ValidationUtils.get_with_default(config, "key", "default")
        assert result == "value"

    def test_returns_default_when_missing(self):
        config = {}
        result = ValidationUtils.get_with_default(config, "key", "fallback")
        assert result == "fallback"

    def test_returns_default_when_none(self):
        config = {"key": None}
        result = ValidationUtils.get_with_default(config, "key", "fallback")
        assert result == "fallback"

    def test_returns_default_when_empty_string(self):
        config = {"key": "   "}
        result = ValidationUtils.get_with_default(config, "key", "fallback")
        assert result == "fallback"

    def test_warns_on_empty_string_default(self, caplog):
        config = {}
        result = ValidationUtils.get_with_default(config, "key", "")
        assert result == ""

    def test_returns_int_value(self):
        config = {"timeout": 30}
        result = ValidationUtils.get_with_default(config, "timeout", 60)
        assert result == 30

    def test_returns_default_int(self):
        config = {}
        result = ValidationUtils.get_with_default(config, "timeout", 60)
        assert result == 60

    def test_context_param_accepted(self):
        config = {}
        result = ValidationUtils.get_with_default(config, "key", "default", context="svc")
        assert result == "default"
