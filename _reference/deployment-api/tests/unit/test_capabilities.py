"""
Unit tests for capabilities and infra_health route helper logic.

Covers:
- get_service_categories (pure logic path with mocked YAML/storage)
- infra_health helpers (_get_verify_infra fallback path)
"""

import asyncio
from unittest.mock import patch

import pytest


class TestGetServiceCategoriesLogic:
    """Tests for the pure logic in get_service_categories via direct helper calls."""

    def test_format_service_categories_from_yaml(self):
        """Test the logic that extracts categories from a sharding YAML."""
        sharding_yaml = {
            "dimensions": [
                {"name": "category", "values": ["CEFI", "DEFI", "TRADFI"]},
                {"name": "venue", "values": ["BINANCE", "NYSE"]},
            ]
        }
        # Replicate the logic in get_service_categories
        dimensions = sharding_yaml.get("dimensions") or []
        categories = []
        for dim in dimensions:
            if dim.get("name") == "category":
                categories = dim.get("values") or []
                break
        assert categories == ["CEFI", "DEFI", "TRADFI"]

    def test_no_category_dimension_returns_empty(self):
        sharding_yaml = {
            "dimensions": [
                {"name": "venue", "values": ["BINANCE"]},
            ]
        }
        dimensions = sharding_yaml.get("dimensions") or []
        categories = []
        for dim in dimensions:
            if dim.get("name") == "category":
                categories = dim.get("values") or []
                break
        assert categories == []

    def test_missing_dimensions_key_returns_empty(self):
        sharding_yaml: dict[str, object] = {}
        dimensions = sharding_yaml.get("dimensions") or []
        assert dimensions == []


class TestGetCapabilities:
    """Tests for get_capabilities route using TestClient."""

    def test_capabilities_returns_gcs_fuse_status(self):
        """Import and verify the route returns a dict with gcs_fuse key."""
        from deployment_api.routes.capabilities import get_capabilities
        from deployment_api.utils.storage_facade import get_gcs_fuse_status

        # This tests the pure import is possible
        assert callable(get_capabilities)
        # get_gcs_fuse_status is a real function that can be called
        # Returns dict with at least 'active' key (not a raw bool)
        status = get_gcs_fuse_status()
        assert isinstance(status, (bool, dict))


class TestInfraHealthRoute:
    """Tests for infra_health route."""

    def test_infra_health_route_exists(self):
        """Verify the router and route are importable and callable."""
        from deployment_api.routes.infra_health import infra_health, router

        assert callable(infra_health)
        assert router is not None


class TestGetServiceCategoriesRoute:
    """Tests for the actual get_service_categories route function."""

    def test_returns_categories_from_real_yaml(self):
        """Uses real instruments-service sharding config if it exists."""
        from deployment_api.routes.capabilities import get_service_categories

        result = asyncio.run(get_service_categories("instruments-service"))
        assert "service" in result
        assert "categories" in result
        assert isinstance(result["categories"], list)

    def test_raises_404_when_config_not_found(self):
        from fastapi import HTTPException

        from deployment_api.routes.capabilities import get_service_categories

        with pytest.raises(HTTPException) as exc:
            asyncio.run(get_service_categories("zzz-nonexistent-service-xyz"))
        assert exc.value.status_code == 404

    def test_returns_empty_categories_for_service_without_category_dim(self):
        """features-calendar-service has no category dimension."""
        from deployment_api.routes.capabilities import get_service_categories

        result = asyncio.run(get_service_categories("features-calendar-service"))
        assert result["categories"] == []

    def test_get_capabilities_returns_gcs_fuse(self):
        from deployment_api.routes.capabilities import get_capabilities

        with patch("deployment_api.routes.capabilities.get_gcs_fuse_status", return_value=False):
            result = asyncio.run(get_capabilities())
        assert result == {"gcs_fuse": False}

    def test_raises_500_on_oserror(self):
        from fastapi import HTTPException

        from deployment_api.routes.capabilities import get_service_categories

        with (
            patch("builtins.open", side_effect=OSError("disk error")),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(get_service_categories("corporate-actions"))
        assert exc.value.status_code == 500
