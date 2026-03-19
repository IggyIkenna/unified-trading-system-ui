"""
E2E tests for deployment-service.

Tests:
1. Catalog aggregation across services
2. Dependency graph validation
3. Shard calculator integration
"""

import os
from pathlib import Path

import pytest


@pytest.fixture
def project_id():
    return os.environ.get("GCP_PROJECT_ID", "test-project")


@pytest.fixture
def config_dir():
    """Get configs directory path."""
    return Path(__file__).parent.parent.parent / "configs"


class TestCatalogAggregation:
    """Tests for data catalog aggregation."""

    @pytest.mark.e2e
    def test_catalog_module_import(self):
        """Test catalog module can be imported."""
        from deployment_service.catalog import DataCatalog

        assert DataCatalog is not None

    @pytest.mark.e2e
    def test_catalog_service_configs(self):
        """Test catalog has service configurations."""
        from deployment_service.catalog import SERVICE_GCS_CONFIGS

        assert SERVICE_GCS_CONFIGS is not None
        assert len(SERVICE_GCS_CONFIGS) > 0

    @pytest.mark.e2e
    def test_catalog_class_structure(self):
        """Test DataCatalog class has expected methods."""
        from deployment_service.catalog import DataCatalog

        # Check class has essential methods
        assert hasattr(DataCatalog, "catalog_service")
        assert hasattr(DataCatalog, "catalog_all_services")


class TestDependencyGraph:
    """Tests for dependency graph."""

    @pytest.mark.e2e
    def test_dependencies_module_import(self):
        """Test dependencies module can be imported."""
        from deployment_service.dependencies import DependencyGraph

        assert DependencyGraph is not None

    @pytest.mark.e2e
    def test_dependencies_config_exists(self, config_dir):
        """Test dependencies.yaml config exists."""
        deps_file = config_dir / "dependencies.yaml"
        assert deps_file.exists(), f"dependencies.yaml not found at {deps_file}"

    @pytest.mark.e2e
    def test_dependency_graph_load(self, config_dir):
        """Test dependency graph can be loaded."""
        from deployment_service.dependencies import DependencyGraph

        graph = DependencyGraph(config_dir=str(config_dir))

        # Verify graph was loaded
        assert graph is not None

    @pytest.mark.e2e
    def test_execution_order(self, config_dir):
        """Test execution order is defined."""
        from deployment_service.dependencies import DependencyGraph

        graph = DependencyGraph(config_dir=str(config_dir))
        order = graph.get_execution_order()

        assert order is not None
        assert len(order) > 0
        assert "instruments-service" in order


class TestShardCalculator:
    """Tests for shard calculator."""

    @pytest.mark.e2e
    def test_shard_calculator_import(self):
        """Test shard calculator can be imported."""
        from deployment_service.shard_calculator import ShardCalculator

        assert ShardCalculator is not None

    @pytest.mark.e2e
    def test_sharding_configs_exist(self, config_dir):
        """Test sharding config files exist."""
        sharding_files = list(config_dir.glob("sharding.*.yaml"))

        # Should have at least 10 services
        assert len(sharding_files) >= 10, (
            f"Expected at least 10 sharding configs, found {len(sharding_files)}"
        )


class TestCLI:
    """Tests for CLI interface."""

    @pytest.mark.e2e
    def test_cli_module_import(self):
        """Test CLI module can be imported."""
        import deployment_service.cli

        assert deployment_service.cli is not None

    @pytest.mark.e2e
    def test_config_loader_import(self, config_dir):
        """Test config loader works."""
        from deployment_service.config_loader import ConfigLoader

        loader = ConfigLoader(config_dir=str(config_dir))
        assert loader is not None
