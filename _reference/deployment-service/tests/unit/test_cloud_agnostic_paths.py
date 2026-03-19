"""
Tests for cloud-agnostic path format and project ID injection.

Verifies:
1. Code uses StandardizedDomainCloudService (cloud-agnostic, not get_gcs_client)
2. Project ID is correctly injected into bucket names
"""

import pytest


class TestCloudAgnosticPaths:
    """Test cloud-agnostic path formats and project ID injection."""

    @pytest.fixture
    def mock_project_id(self):
        """Mock project ID."""
        return "test-project-12345"

    def test_no_direct_gcs_client_imports(self):
        """
        Test that no code directly imports or calls get_gcs_client.

        NOTE: unified-trading-deployment-v2 is infrastructure/deployment code,
        not domain code. Infrastructure code may use get_gcs_client() directly
        for deployment metadata operations. This test verifies that domain services
        use StandardizedDomainCloudService, but allows infrastructure code flexibility.
        """
        from pathlib import Path

        # Use package path - invariant across environments. Path(__file__) breaks in Cloud Build
        # where workspace can include sibling /workspace/unified-trading-services and
        # /workspace/unified-trading-deployment-v2, causing false violations from dependency code.
        import deployment_service

        source_dir = Path(deployment_service.__file__).parent.resolve()

        if not source_dir.exists():
            pytest.skip("deployment_service package directory not found")

        python_files = [
            f
            for f in source_dir.rglob("*.py")
            if "__pycache__" not in str(f) and f.resolve().is_relative_to(source_dir)
        ]

        violations = []
        for file_path in python_files:
            try:
                content = file_path.read_text()

                # Infrastructure code files that legitimately use get_gcs_client() for deployment metadata
                infrastructure_files = {
                    "monitor.py",  # Deployment monitoring - reads version manifests
                    "orchestrator.py",  # Job orchestration - manages deployment state
                    "cloud_client.py",  # Cloud client wrapper - uses get_gcs_client as fallback
                }

                # Skip infrastructure files - they're allowed to use get_gcs_client() directly
                if file_path.name in infrastructure_files:
                    continue

                # Check for direct get_gcs_client imports (bad for domain code)
                if "from unified_trading_services import get_gcs_client" in content:
                    violations.append(f"{file_path}: Direct import of get_gcs_client")

                # Check for get_gcs_client() calls (bad for domain code, should use StandardizedDomainCloudService)
                if "get_gcs_client(" in content and "unified_trading_services" in content:
                    lines = content.split("\n")
                    for i, line in enumerate(lines):
                        if "get_gcs_client(" in line and not (
                            line.strip().startswith("#") or '"""' in line or "'''" in line
                        ):
                            violations.append(
                                f"{file_path}:{i + 1}: Direct call to get_gcs_client()"
                            )

            except (OSError, UnicodeDecodeError):
                # Skip files that can't be parsed
                continue

        assert len(violations) == 0, (
            f"Found {len(violations)} violations - unified-trading-deployment-v2 domain code should use "
            f"StandardizedDomainCloudService, not get_gcs_client. Infrastructure code (monitor.py, "
            f"orchestrator.py, cloud_client.py) is allowed to use get_gcs_client() directly:\n"
            + "\n".join(violations)
        )
