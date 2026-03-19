"""
Unit tests for DependencyGraph.

Tests dependency configuration loading and validation.
"""

from unittest.mock import patch

import pytest
import yaml

from deployment_service.dependencies import (
    DependencyCheck,
    DependencyError,
    DependencyGraph,
    DependencyReport,
)


class TestDependencyCheck:
    """Tests for DependencyCheck dataclass."""

    def test_check_creation(self):
        """Test basic check creation."""
        check = DependencyCheck(
            service="test-service",
            upstream_service="upstream-service",
            required=True,
            passed=True,
            message="Dependency satisfied",
        )

        assert check.service == "test-service"
        assert check.upstream_service == "upstream-service"
        assert check.required is True
        assert check.passed is True

    def test_check_to_dict(self):
        """Test serialization to dictionary."""
        check = DependencyCheck(
            service="test",
            upstream_service="upstream",
            required=True,
            passed=False,
            message="Not found",
            checked_path="gs://bucket/path",
        )

        result = check.to_dict()

        assert result["service"] == "test"
        assert result["upstream_service"] == "upstream"
        assert result["checked_path"] == "gs://bucket/path"


class TestDependencyReport:
    """Tests for DependencyReport dataclass."""

    def test_report_creation(self):
        """Test basic report creation."""
        report = DependencyReport(
            service="test-service",
            all_passed=True,
            required_passed=True,
        )

        assert report.service == "test-service"
        assert report.all_passed is True

    def test_report_with_checks(self):
        """Test report with check results."""
        checks = [
            DependencyCheck("test", "up1", True, True, "OK"),
            DependencyCheck("test", "up2", False, False, "Not found"),
        ]

        report = DependencyReport(
            service="test",
            all_passed=False,
            required_passed=True,
            checks=checks,
        )

        result = report.to_dict()

        assert len(result["checks"]) == 2
        assert result["required_passed"] is True
        assert result["all_passed"] is False


class TestDependencyGraphInit:
    """Tests for DependencyGraph initialization."""

    def test_init_with_config(self, temp_config_dir, mock_env_vars):
        """Test initialization with config directory."""
        # Create a minimal dependencies.yaml
        deps_config = {
            "services": {
                "test-service": {
                    "description": "Test",
                    "upstream": [],
                },
            },
            "execution_order": ["test-service"],
        }
        with open(temp_config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(deps_config, f)

        graph = DependencyGraph(str(temp_config_dir))

        assert "test-service" in graph.config["services"]

    def test_init_missing_config(self, tmp_path, mock_env_vars):
        """Test initialization with missing config."""
        graph = DependencyGraph(str(tmp_path))

        # Should return empty config
        assert graph.config == {"services": {}, "execution_order": []}


class TestDependencyGraphServices:
    """Tests for service dependency queries."""

    @pytest.fixture
    def graph_with_deps(self, temp_config_dir, mock_env_vars):
        """Create a graph with test dependencies."""
        deps_config = {
            "services": {
                "root-service": {
                    "description": "Root service",
                    "upstream": [],
                },
                "mid-service": {
                    "description": "Middle service",
                    "upstream": [
                        {"service": "root-service", "required": True},
                    ],
                },
                "leaf-service": {
                    "description": "Leaf service",
                    "upstream": [
                        {"service": "mid-service", "required": True},
                        {"service": "root-service", "required": False},
                    ],
                },
            },
            "execution_order": ["root-service", "mid-service", "leaf-service"],
        }
        with open(temp_config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(deps_config, f)

        return DependencyGraph(str(temp_config_dir))

    def test_get_service_config(self, graph_with_deps):
        """Test getting service configuration."""
        config = graph_with_deps.get_service_config("root-service")

        assert config["description"] == "Root service"
        assert config["upstream"] == []

    def test_get_service_config_unknown(self, graph_with_deps):
        """Test error for unknown service."""
        with pytest.raises(ValueError, match="Unknown service"):
            graph_with_deps.get_service_config("unknown-service")

    def test_get_upstream_services(self, graph_with_deps):
        """Test getting upstream services."""
        upstream = graph_with_deps.get_upstream_services("leaf-service")

        assert "mid-service" in upstream
        assert "root-service" in upstream

    def test_get_upstream_services_root(self, graph_with_deps):
        """Test getting upstream for root service (none)."""
        upstream = graph_with_deps.get_upstream_services("root-service")

        assert upstream == []

    def test_get_downstream_services(self, graph_with_deps):
        """Test getting downstream services."""
        downstream = graph_with_deps.get_downstream_services("root-service")

        assert "mid-service" in downstream
        assert "leaf-service" in downstream

    def test_get_execution_order(self, graph_with_deps):
        """Test getting execution order."""
        order = graph_with_deps.get_execution_order()

        assert order == ["root-service", "mid-service", "leaf-service"]


class TestDependencyChecking:
    """Tests for dependency validation."""

    @pytest.fixture
    def graph_with_checks(self, temp_config_dir, mock_env_vars):
        """Create a graph with checkable dependencies."""
        deps_config = {
            "services": {
                "upstream-service": {
                    "description": "Upstream",
                    "upstream": [],
                    "outputs": [
                        {
                            "bucket_template": "test-bucket-{project_id}",
                            "path_template": "data/day={date}/",
                        }
                    ],
                },
                "downstream-service": {
                    "description": "Downstream",
                    "upstream": [
                        {
                            "service": "upstream-service",
                            "required": True,
                            "check": {
                                "bucket_template": "test-bucket-{project_id}",
                                "path_template": "data/day={date}/",
                            },
                        },
                    ],
                },
                "optional-deps-service": {
                    "description": "Has optional deps",
                    "upstream": [
                        {
                            "service": "upstream-service",
                            "required": False,
                            "check": {
                                "bucket_template": "test-bucket-{project_id}",
                                "path_template": "optional/day={date}/",
                            },
                        },
                    ],
                },
                "library-user-service": {
                    "description": "Uses library",
                    "upstream": [
                        {
                            "service": "library-service",
                            "required": True,
                            "is_library": True,
                        },
                    ],
                },
            },
            "execution_order": ["upstream-service", "downstream-service"],
        }
        with open(temp_config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(deps_config, f)

        return DependencyGraph(str(temp_config_dir))

    def test_check_no_dependencies(self, graph_with_checks):
        """Test checking service with no dependencies."""
        report = graph_with_checks.check_dependencies(
            service="upstream-service",
            date="2024-01-15",
        )

        assert report.all_passed is True
        assert report.required_passed is True
        assert len(report.checks) == 0

    def test_check_with_dependencies_mock_mode(self, graph_with_checks):
        """Test checking dependencies in mock mode (always fails)."""
        report = graph_with_checks.check_dependencies(
            service="downstream-service",
            date="2024-01-15",
        )

        # In mock mode, GCS checks will fail
        assert len(report.checks) == 1
        assert report.checks[0].upstream_service == "upstream-service"

    def test_check_library_dependency(self, graph_with_checks):
        """Test that library dependencies always pass."""
        report = graph_with_checks.check_dependencies(
            service="library-user-service",
            date="2024-01-15",
        )

        assert len(report.checks) == 1
        assert report.checks[0].passed is True
        assert "Library dependency" in report.checks[0].message

    def test_validate_can_run_no_deps(self, graph_with_checks):
        """Test validation for service with no dependencies."""
        can_run = graph_with_checks.validate_can_run(
            service="upstream-service",
            date="2024-01-15",
        )

        assert can_run is True

    def test_validate_can_run_library_dep(self, graph_with_checks):
        """Test validation with library dependency."""
        can_run = graph_with_checks.validate_can_run(
            service="library-user-service",
            date="2024-01-15",
        )

        assert can_run is True

    def test_live_in_memory_dependency_skips_storage_check(self, temp_config_dir, mock_env_vars):
        """Live + in_memory topology should skip GCS checks for that edge."""
        deps_config = {
            "services": {
                "market-tick-data-service": {"description": "Upstream", "upstream": []},
                "market-data-processing-service": {
                    "description": "Downstream",
                    "upstream": [
                        {
                            "service": "market-tick-data-service",
                            "required": True,
                            "check": {
                                "bucket_template": "test-bucket-{project_id}",
                                "path_template": "raw/day={date}/",
                            },
                        },
                    ],
                },
            },
            "execution_order": ["market-tick-data-service", "market-data-processing-service"],
        }
        with open(temp_config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(deps_config, f)

        runtime_topology = {
            "defaults": {
                "transport_by_mode": {
                    "batch": {"transport": "gcs", "dependency_check": "gcs"},
                    "live": {"transport": "pubsub", "dependency_check": "none"},
                },
                "deployment_profile": "distributed",
            },
            "deployment_profiles": {
                "distributed": {"allowed_transports": ["gcs", "pubsub"]},
                "co_located_vm": {"allowed_transports": ["gcs", "pubsub", "in_memory"]},
            },
            "services": {
                "market-data-processing-service": {
                    "upstream": {
                        "market-tick-data-service": {
                            "live": {
                                "transport": "in_memory",
                                "deployment_profile": "co_located_vm",
                                "dependency_check": "none",
                            }
                        }
                    }
                }
            },
        }
        topology_path = temp_config_dir / "runtime-topology.yaml"
        with open(topology_path, "w") as f:
            yaml.dump(runtime_topology, f)

        with patch.dict("os.environ", {"RUNTIME_TOPOLOGY_PATH": str(topology_path)}):
            graph = DependencyGraph(str(temp_config_dir))
            report = graph.check_dependencies(
                service="market-data-processing-service",
                date="2024-01-15",
                mode="live",
                deployment_profile="co_located_vm",
            )

        assert report.required_passed is True
        assert len(report.checks) == 1
        assert "skipped" in report.checks[0].message.lower()

    def test_invalid_transport_for_profile_fails_fast(self, temp_config_dir, mock_env_vars):
        """Invalid topology (in_memory on distributed profile) should raise."""
        deps_config = {
            "services": {
                "market-tick-data-service": {"description": "Upstream", "upstream": []},
                "market-data-processing-service": {
                    "description": "Downstream",
                    "upstream": [{"service": "market-tick-data-service", "required": True}],
                },
            },
            "execution_order": ["market-tick-data-service", "market-data-processing-service"],
        }
        with open(temp_config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(deps_config, f)

        runtime_topology = {
            "defaults": {
                "transport_by_mode": {
                    "batch": {"transport": "gcs", "dependency_check": "gcs"},
                    "live": {"transport": "pubsub", "dependency_check": "none"},
                },
                "deployment_profile": "distributed",
            },
            "deployment_profiles": {
                "distributed": {"allowed_transports": ["gcs", "pubsub"]},
            },
            "services": {
                "market-data-processing-service": {
                    "upstream": {
                        "market-tick-data-service": {
                            "live": {
                                "transport": "in_memory",
                                "dependency_check": "none",
                            }
                        }
                    }
                }
            },
        }
        topology_path = temp_config_dir / "runtime-topology.yaml"
        with open(topology_path, "w") as f:
            yaml.dump(runtime_topology, f)

        with patch.dict("os.environ", {"RUNTIME_TOPOLOGY_PATH": str(topology_path)}):
            graph = DependencyGraph(str(temp_config_dir))
            with pytest.raises(ValueError, match="not allowed in deployment profile"):
                graph.check_dependencies(
                    service="market-data-processing-service",
                    date="2024-01-15",
                    mode="live",
                    deployment_profile="distributed",
                )


class TestDependencyTree:
    """Tests for dependency tree generation."""

    @pytest.fixture
    def graph_for_tree(self, temp_config_dir, mock_env_vars):
        """Create a graph for tree generation."""
        deps_config = {
            "services": {
                "service-a": {
                    "description": "Service A",
                    "upstream": [],
                },
                "service-b": {
                    "description": "Service B",
                    "upstream": [
                        {"service": "service-a", "required": True},
                    ],
                },
                "service-c": {
                    "description": "Service C",
                    "upstream": [
                        {"service": "service-a", "required": True},
                        {"service": "service-b", "required": False},
                    ],
                },
            },
            "execution_order": ["service-a", "service-b", "service-c"],
        }
        with open(temp_config_dir / "dependencies.yaml", "w") as f:
            yaml.dump(deps_config, f)

        return DependencyGraph(str(temp_config_dir))

    def test_generate_tree_all(self, graph_for_tree):
        """Test generating tree for all services."""
        tree = graph_for_tree.generate_dependency_tree()

        assert "service-a" in tree
        assert "service-b" in tree
        assert "service-c" in tree

    def test_generate_tree_single_service(self, graph_for_tree):
        """Test generating tree for single service."""
        tree = graph_for_tree.generate_dependency_tree("service-b")

        assert "service-b" in tree
        assert "service-a" in tree  # Dependency shown

    def test_generate_mermaid_diagram(self, graph_for_tree):
        """Test generating Mermaid diagram."""
        diagram = graph_for_tree.generate_mermaid_diagram()

        assert "flowchart TD" in diagram
        # Should have edges
        assert "-->" in diagram or "-.->" in diagram


class TestDependencyError:
    """Tests for DependencyError exception."""

    def test_error_message(self):
        """Test error message format."""
        checks = [
            DependencyCheck("svc", "upstream1", True, False, "Not found"),
            DependencyCheck("svc", "upstream2", True, False, "Missing"),
        ]

        report = DependencyReport(
            service="test-service",
            all_passed=False,
            required_passed=False,
            checks=checks,
        )

        error = DependencyError("test-service", report)

        assert "test-service" in str(error)
        assert "upstream1" in str(error)
        assert "upstream2" in str(error)


class TestRealDependencies:
    """Tests with real dependencies.yaml."""

    @pytest.fixture
    def real_config_dir(self):
        """Get the real configs directory."""
        from pathlib import Path

        possible_paths = [
            Path(__file__).parent.parent.parent / "configs",
            Path.cwd() / "configs",
        ]

        for path in possible_paths:
            if path.exists() and (path / "dependencies.yaml").exists():
                return path

        pytest.skip("Real dependencies.yaml not found")

    def test_load_real_config(self, real_config_dir, mock_env_vars):
        """Test loading real dependencies config."""
        graph = DependencyGraph(str(real_config_dir))

        # Should have all 11 services
        services = list(graph.config.get("services", {}).keys())

        assert "instruments-service" in services
        assert "market-tick-data-service" in services

    def test_real_execution_order(self, real_config_dir, mock_env_vars):
        """Test real execution order."""
        graph = DependencyGraph(str(real_config_dir))

        order = graph.get_execution_order()

        # instruments-service should be first (no deps)
        assert order[0] == "instruments-service"

        # risk-and-exposure-service should be last (most deps: position-balance → execution-service → ...)
        assert order[-1] == "risk-and-exposure-service"

    def test_real_upstream_deps(self, real_config_dir, mock_env_vars):
        """Test real upstream dependencies."""
        graph = DependencyGraph(str(real_config_dir))

        # instruments-service should have no upstream
        assert graph.get_upstream_services("instruments-service") == []

        # market-tick-data-service should depend on instruments-service
        mtdh_upstream = graph.get_upstream_services("market-tick-data-service")
        assert "instruments-service" in mtdh_upstream
