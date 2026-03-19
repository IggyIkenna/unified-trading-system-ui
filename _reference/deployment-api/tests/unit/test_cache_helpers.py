"""
Unit tests for cache.py helper functions.

Tests cover serialize/deserialize and cache key generation functions.
"""

import pytest

from deployment_api.utils.cache import (
    build_info_key,
    data_status_key,
    deployment_key,
    deployment_list_key,
    deserialize,
    serialize,
    service_status_key,
    trigger_id_key,
)


class TestSerialize:
    """Tests for serialize function."""

    def test_simple_dict(self):
        result = serialize({"key": "value"})
        import json

        assert json.loads(result) == {"key": "value"}

    def test_list(self):
        result = serialize([1, 2, 3])
        import json

        assert json.loads(result) == [1, 2, 3]

    def test_non_serializable_uses_str(self):
        from datetime import UTC, datetime

        dt = datetime.now(UTC)
        result = serialize({"time": dt})
        import json

        parsed = json.loads(result)
        assert isinstance(parsed["time"], str)  # datetime serialized via str()

    def test_none(self):
        result = serialize(None)
        import json

        assert json.loads(result) is None


class TestDeserialize:
    """Tests for deserialize function."""

    def test_json_string(self):
        import json

        result = deserialize(json.dumps({"key": "value"}))
        assert result == {"key": "value"}

    def test_bytes_input(self):
        import json

        data = json.dumps({"x": 1}).encode("utf-8")
        result = deserialize(data)
        assert result == {"x": 1}

    def test_bytearray_input(self):
        import json

        data = bytearray(json.dumps({"x": 2}).encode("utf-8"))
        result = deserialize(data)
        assert result == {"x": 2}

    def test_invalid_type_raises(self):
        with pytest.raises(TypeError):
            deserialize(42)

    def test_null_json(self):
        result = deserialize("null")
        assert result is None

    def test_list_json(self):
        result = deserialize("[1,2,3]")
        assert result == [1, 2, 3]


class TestCacheKeyFunctions:
    """Tests for cache key generation functions."""

    def test_deployment_key(self):
        key = deployment_key("dep-123")
        assert "dep-123" in key
        assert key == "deployment:dep-123"

    def test_deployment_list_key_default(self):
        key = deployment_list_key()
        assert "all" in key
        assert "20" in key

    def test_deployment_list_key_with_service(self):
        key = deployment_list_key(service="instruments-service")
        assert "instruments-service" in key

    def test_deployment_list_key_with_limit(self):
        key = deployment_list_key(limit=50)
        assert "50" in key

    def test_data_status_key(self):
        key = data_status_key("instruments-service", "2024-01-01", "2024-01-31")
        assert "instruments-service" in key
        assert "2024-01-01" in key
        assert "2024-01-31" in key

    def test_data_status_key_with_categories(self):
        key = data_status_key("svc", "2024-01-01", "2024-01-31", categories="CEFI,TRADFI")
        assert "CEFI,TRADFI" in key

    def test_service_status_key(self):
        key = service_status_key("market-data")
        assert "market-data" in key
        assert key == "service-status:market-data"

    def test_build_info_key(self):
        key = build_info_key("instruments-service")
        assert "instruments-service" in key
        assert key == "build:instruments-service"

    def test_trigger_id_key(self):
        key = trigger_id_key("instruments-service")
        assert "instruments-service" in key
        assert key == "trigger:instruments-service"

    def test_different_services_produce_different_keys(self):
        k1 = service_status_key("service-a")
        k2 = service_status_key("service-b")
        assert k1 != k2
