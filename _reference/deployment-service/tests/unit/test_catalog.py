"""
Unit tests for DataCatalog.

Tests data catalog generation and completion tracking.
"""

from datetime import date

import pytest

from deployment_service.catalog import (
    CatalogEntry,
    DataCatalog,
    ServiceCatalog,
)


class TestCatalogEntry:
    """Tests for CatalogEntry dataclass."""

    def test_entry_creation(self):
        """Test basic entry creation."""
        entry = CatalogEntry(
            service="test-service",
            dimensions={"category": "CEFI", "date": "2024-01-01"},
            file_count=5,
            expected_count=10,
        )

        assert entry.service == "test-service"
        assert entry.file_count == 5
        assert entry.expected_count == 10

    def test_completion_percentage(self):
        """Test completion percentage calculation."""
        entry = CatalogEntry(
            service="test",
            dimensions={},
            file_count=50,
            expected_count=100,
        )

        assert entry.completion_percentage == 50.0

    def test_completion_percentage_over_100(self):
        """Test that completion is capped at 100%."""
        entry = CatalogEntry(
            service="test",
            dimensions={},
            file_count=150,
            expected_count=100,
        )

        assert entry.completion_percentage == 100.0

    def test_completion_percentage_zero_expected(self):
        """Test handling of zero expected count."""
        entry = CatalogEntry(
            service="test",
            dimensions={},
            file_count=0,
            expected_count=0,
        )

        assert entry.completion_percentage == 100.0

    def test_is_complete(self):
        """Test is_complete property."""
        complete = CatalogEntry("test", {}, file_count=10, expected_count=10)
        incomplete = CatalogEntry("test", {}, file_count=5, expected_count=10)

        assert complete.is_complete is True
        assert incomplete.is_complete is False

    def test_to_dict(self):
        """Test serialization to dictionary."""
        entry = CatalogEntry(
            service="test",
            dimensions={"category": "CEFI"},
            file_count=5,
            expected_count=10,
        )

        result = entry.to_dict()

        assert result["service"] == "test"
        assert result["dimensions"] == {"category": "CEFI"}
        assert result["file_count"] == 5
        assert result["completion_percentage"] == 50.0
        assert result["is_complete"] is False


class TestServiceCatalog:
    """Tests for ServiceCatalog dataclass."""

    def test_catalog_creation(self):
        """Test basic catalog creation."""
        catalog = ServiceCatalog(
            service="test-service",
            start_date="2024-01-01",
            end_date="2024-01-31",
        )

        assert catalog.service == "test-service"
        assert catalog.total_entries == 0

    def test_overall_completion(self):
        """Test overall completion calculation."""
        entries = [
            CatalogEntry("test", {"date": "2024-01-01"}, file_count=1, expected_count=1),
            CatalogEntry("test", {"date": "2024-01-02"}, file_count=1, expected_count=1),
            CatalogEntry("test", {"date": "2024-01-03"}, file_count=0, expected_count=1),
            CatalogEntry("test", {"date": "2024-01-04"}, file_count=0, expected_count=1),
        ]

        catalog = ServiceCatalog(
            service="test",
            start_date="2024-01-01",
            end_date="2024-01-04",
            entries=entries,
        )

        assert catalog.total_entries == 4
        assert catalog.complete_entries == 2
        assert catalog.overall_completion == 50.0

    def test_breakdown_by_dimension(self):
        """Test breakdown by dimension."""
        entries = [
            CatalogEntry(
                "test",
                {"category": "CEFI", "date": "2024-01-01"},
                file_count=1,
                expected_count=1,
            ),
            CatalogEntry(
                "test",
                {"category": "CEFI", "date": "2024-01-02"},
                file_count=0,
                expected_count=1,
            ),
            CatalogEntry(
                "test",
                {"category": "TRADFI", "date": "2024-01-01"},
                file_count=1,
                expected_count=1,
            ),
            CatalogEntry(
                "test",
                {"category": "TRADFI", "date": "2024-01-02"},
                file_count=1,
                expected_count=1,
            ),
        ]

        catalog = ServiceCatalog(
            service="test",
            start_date="2024-01-01",
            end_date="2024-01-02",
            entries=entries,
        )

        breakdown = catalog.get_breakdown_by_dimension("category")

        assert breakdown["CEFI"]["total"] == 2
        assert breakdown["CEFI"]["complete"] == 1
        assert breakdown["TRADFI"]["total"] == 2
        assert breakdown["TRADFI"]["complete"] == 2

    def test_to_dict(self):
        """Test serialization to dictionary."""
        entries = [
            CatalogEntry("test", {"date": "2024-01-01"}, file_count=1, expected_count=1),
        ]

        catalog = ServiceCatalog(
            service="test",
            start_date="2024-01-01",
            end_date="2024-01-01",
            entries=entries,
        )

        result = catalog.to_dict()

        assert result["service"] == "test"
        assert result["total_entries"] == 1
        assert result["overall_completion"] == 100.0
        assert len(result["entries"]) == 1


class TestDataCatalog:
    """Tests for DataCatalog class."""

    def test_catalog_creation(self, temp_config_with_service, mock_env_vars):
        """Test catalog instance creation."""
        catalog = DataCatalog(str(temp_config_with_service))

        assert catalog.project_id == "test-project-123"

    def test_catalog_service_mock_mode(self, temp_config_with_service, mock_env_vars):
        """Test cataloging service in mock mode (no GCS)."""
        catalog = DataCatalog(str(temp_config_with_service))

        result = catalog.catalog_service(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
        )

        assert result.service == "test-service"
        assert result.start_date == "2024-01-01"
        assert result.end_date == "2024-01-03"

    def test_catalog_with_category_filter(self, temp_config_with_service, mock_env_vars):
        """Test cataloging with category filter."""
        catalog = DataCatalog(str(temp_config_with_service))

        result = catalog.catalog_service(
            service="test-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 2),
            category=["CEFI"],
        )

        # All entries should be CEFI
        for entry in result.entries:
            if "category" in entry.dimensions:
                assert entry.dimensions["category"] == "CEFI"

    def test_catalog_unknown_service(self, temp_config_dir, mock_env_vars):
        """Test cataloging unknown service."""
        catalog = DataCatalog(str(temp_config_dir))

        result = catalog.catalog_service(
            service="unknown-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
        )

        # Should return empty catalog for unknown service
        assert result.service == "unknown-service"
        assert result.total_entries == 0

    def test_catalog_all_services(self, temp_config_with_service, mock_env_vars):
        """Test cataloging all services."""
        catalog = DataCatalog(str(temp_config_with_service))

        results = catalog.catalog_all_services(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
        )

        assert "test-service" in results

    def test_generate_report_table(self, temp_config_with_service, mock_env_vars):
        """Test report generation in table format."""
        catalog = DataCatalog(str(temp_config_with_service))

        catalogs = catalog.catalog_all_services(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
        )

        report = catalog.generate_report(catalogs, output_format="table")

        assert "DATA CATALOG REPORT" in report
        assert "test-service" in report

    def test_generate_report_json(self, temp_config_with_service, mock_env_vars):
        """Test report generation in JSON format."""
        import json

        catalog = DataCatalog(str(temp_config_with_service))

        catalogs = catalog.catalog_all_services(
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 1),
        )

        report = catalog.generate_report(catalogs, output_format="json")

        # Should be valid JSON
        parsed = json.loads(report)
        assert "test-service" in parsed


class TestDataCatalogIntegration:
    """Integration tests for DataCatalog with real configs."""

    @pytest.fixture
    def real_config_dir(self):
        """Get the real configs directory."""
        from pathlib import Path

        possible_paths = [
            Path(__file__).parent.parent.parent / "configs",
            Path.cwd() / "configs",
        ]

        for path in possible_paths:
            if path.exists() and (path / "venues.yaml").exists():
                return path

        pytest.skip("Real config directory not found")

    def test_catalog_real_service(self, real_config_dir, mock_env_vars):
        """Test cataloging a real service config."""
        catalog = DataCatalog(str(real_config_dir))

        result = catalog.catalog_service(
            service="instruments-service",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 1, 3),
            category=["CEFI"],
        )

        assert result.service == "instruments-service"
        # Should have entries (3 days * 1 category = 3)
        # Note: actual count depends on service config
        assert result.total_entries > 0
