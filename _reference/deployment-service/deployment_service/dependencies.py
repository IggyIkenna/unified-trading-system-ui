"""
Dependencies - Service dependency graph management.

This module provides functionality to:
1. Load and parse dependency configurations
2. Check upstream dependencies before service runs
3. Generate dependency graphs and reports
"""

import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import cast

import yaml

from .cloud_client import CloudClient
from .config.config_validator import ConfigurationError, ValidationUtils
from .config_loader import ConfigLoader
from .deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

_config = DeploymentConfig()


@dataclass
class DependencyCheck:
    """Result of checking a single dependency."""

    service: str
    upstream_service: str
    required: bool
    passed: bool
    message: str
    checked_path: str = ""

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary."""
        return {
            "service": self.service,
            "upstream_service": self.upstream_service,
            "required": self.required,
            "passed": self.passed,
            "message": self.message,
            "checked_path": self.checked_path,
        }


@dataclass
class DependencyReport:
    """Report of all dependency checks for a service."""

    service: str
    all_passed: bool
    required_passed: bool
    checks: list[DependencyCheck] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        """Convert to dictionary."""
        return {
            "service": self.service,
            "all_passed": self.all_passed,
            "required_passed": self.required_passed,
            "checks": [c.to_dict() for c in self.checks],
        }


class DependencyGraph:
    """
    Manages service dependency graph and validation.

    Loads dependency configuration from dependencies.yaml and provides
    methods to check dependencies and generate reports.
    """

    def __init__(
        self,
        config_dir: str = "configs",
        project_id: str | None = None,
    ):
        """
        Initialize the dependency graph.

        Args:
            config_dir: Path to configuration directory
            project_id: GCP project ID for bucket names
        """
        self.config_dir = Path(config_dir)
        _pid = project_id or str(_config.gcp_project_id or "")
        if not _pid:
            raise ValueError("GCP_PROJECT_ID must be set in environment or passed as project_id")
        self.project_id: str = _pid
        self.cloud_client = CloudClient(project_id=project_id)
        self.config_loader = ConfigLoader(str(self.config_dir))
        self._config: dict[str, object] | None = None
        self._runtime_topology: dict[str, object] | None = None

    @property
    def config(self) -> dict[str, object]:
        """Lazy-load dependencies config."""
        if self._config is None:
            self._config = self._load_config()
        return self._config

    @property
    def runtime_topology(self) -> dict[str, object]:
        """Lazy-load runtime-topology.yaml configuration."""
        if self._runtime_topology is None:
            self._runtime_topology = self.config_loader.load_runtime_topology_config()
        return self._runtime_topology

    def _load_config(self) -> dict[str, object]:
        """Load dependencies.yaml configuration."""
        config_path = self.config_dir / "dependencies.yaml"

        if not config_path.exists():
            logger.warning("Dependencies config not found: %s", config_path)
            return {"services": {}, "execution_order": []}

        with open(config_path) as f:
            return cast("dict[str, object]", yaml.safe_load(f))

    def get_service_config(self, service: str) -> dict[str, object]:
        """Get dependency configuration for a service."""
        services = cast("dict[str, dict[str, object]]", self.config.get("services") or {})

        if service not in services:
            raise ValueError(f"Unknown service: {service}")

        return services[service]

    def get_upstream_services(self, service: str) -> list[str]:
        """Get list of upstream service dependencies."""
        config = self.get_service_config(service)
        upstream = cast("list[str | dict[str, object]]", config.get("upstream") or [])

        result: list[str] = []
        for u in upstream:
            if isinstance(u, str):
                result.append(u)
            else:
                result.append(str(u["service"]))
        return result

    def get_downstream_services(self, service: str) -> list[str]:
        """Get list of services that depend on this service."""
        downstream: list[str] = []

        for svc_name, svc_config in cast(
            "dict[str, dict[str, object]]", self.config.get("services") or {}
        ).items():
            if svc_name == service:
                continue

            upstream = cast("list[str | dict[str, object]]", svc_config.get("upstream") or [])
            for u in upstream:
                up_svc: str | None = u if isinstance(u, str) else str(u.get("service") or "")
                if up_svc == service:
                    downstream.append(svc_name)
                    break

        return downstream

    def get_execution_order(self) -> list[str]:
        """Get topologically sorted execution order."""
        return cast("list[str]", self.config.get("execution_order") or [])

    def check_dependencies(
        self,
        service: str,
        date: str,
        category: str | None = None,
        domain: str | None = None,
        mode: str = "batch",
        deployment_profile: str | None = None,
        **template_vars: object,
    ) -> DependencyReport:
        """
        Check all upstream dependencies for a service.

        Args:
            service: Service to check dependencies for
            date: Date to check (YYYY-MM-DD)
            category: Category (CEFI/TRADFI/DEFI) for category-specific checks
            domain: Domain (cefi/tradfi/defi) for domain-specific checks
            **template_vars: Additional template variables

        Returns:
            DependencyReport with check results
        """
        config = self.get_service_config(service)
        upstream = cast("list[str | dict[str, object]]", config.get("upstream") or [])

        if not upstream:
            return DependencyReport(
                service=service,
                all_passed=True,
                required_passed=True,
                checks=[],
            )

        # Build template variables
        vars_dict: dict[str, object] = {
            "date": date,
            "project_id": self.project_id,
            **template_vars,
        }

        if category:
            vars_dict["category"] = category
            vars_dict["category_lower"] = category.lower()

        if domain:
            vars_dict["domain"] = domain
            vars_dict["domain_lower"] = domain.lower()

        checks: list[DependencyCheck] = []
        all_passed = True
        required_passed = True

        for dep in upstream:
            # Support shorthand: upstream: [service-name] or full: [{service: ..., required: ...}]
            dep_config: dict[str, object] = (
                {"service": dep, "required": True} if isinstance(dep, str) else dep
            )
            check = self._check_single_dependency(
                service=service,
                dep_config=dep_config,
                template_vars=vars_dict,
                mode=mode,
                deployment_profile=deployment_profile,
            )
            checks.append(check)

            if not check.passed:
                all_passed = False
                if check.required:
                    required_passed = False

        return DependencyReport(
            service=service,
            all_passed=all_passed,
            required_passed=required_passed,
            checks=checks,
        )

    def _check_single_dependency(
        self,
        service: str,
        dep_config: dict[str, object],
        template_vars: dict[str, object],
        mode: str,
        deployment_profile: str | None,
    ) -> DependencyCheck:
        """Check a single upstream dependency."""
        upstream_service = cast(str, dep_config["service"])
        required = cast(bool, dep_config.get("required", True))
        is_library = cast(bool, dep_config.get("is_library", False))

        # Libraries are always considered "passed"
        if is_library:
            return DependencyCheck(
                service=service,
                upstream_service=upstream_service,
                required=required,
                passed=True,
                message="Library dependency (always available)",
            )

        transport, dependency_check = self._resolve_dependency_transport(
            service=service,
            upstream_service=upstream_service,
            mode=mode,
            deployment_profile=deployment_profile,
        )
        if dependency_check in {"none", "pubsub"}:
            return DependencyCheck(
                service=service,
                upstream_service=upstream_service,
                required=required,
                passed=True,
                message=f"Dependency check skipped ({mode} transport={transport})",
            )

        check_config = cast("dict[str, object] | None", dep_config.get("check"))
        if not check_config:
            return DependencyCheck(
                service=service,
                upstream_service=upstream_service,
                required=required,
                passed=True,
                message="No check configured",
            )

        # Build GCS path
        try:
            bucket_template = str(
                ValidationUtils.get_required(
                    check_config, "bucket_template", f"dependency check for {upstream_service}"
                )
            )
            path_template = str(
                ValidationUtils.get_required(
                    check_config, "path_template", f"dependency check for {upstream_service}"
                )
            )

            str_template_vars = {k: str(v) for k, v in template_vars.items()}
            bucket = bucket_template.format(**str_template_vars)
            path = path_template.format(**str_template_vars)
            gcs_path = f"gs://{bucket}/{path}"  # noqa: gs-uri — dependency check builds GCS path for existence verification
        except ConfigurationError as e:
            return DependencyCheck(
                service=service,
                upstream_service=upstream_service,
                required=required,
                passed=False,
                message=str(e),
            )
        except KeyError as e:
            return DependencyCheck(
                service=service,
                upstream_service=upstream_service,
                required=required,
                passed=False,
                message=f"Missing template variable: {e}",
            )

        # Check if path exists
        if path.endswith("/"):
            # Check prefix has files
            files = self.cloud_client.list_files(gcs_path, "*.parquet", max_results=1)
            passed = len(files) > 0
        else:
            passed = self.cloud_client.file_exists(gcs_path)

        message = "Dependency satisfied" if passed else f"Data not found at {gcs_path}"

        return DependencyCheck(
            service=service,
            upstream_service=upstream_service,
            required=required,
            passed=passed,
            message=message,
            checked_path=gcs_path,
        )

    def _resolve_dependency_transport(
        self,
        service: str,
        upstream_service: str,
        mode: str,
        deployment_profile: str | None,
    ) -> tuple[str, str]:
        """
        Resolve transport and check behavior from runtime-topology.yaml.

        Returns:
            tuple[transport, dependency_check]
            dependency_check is "gcs" or "none"
        """
        topology = self.runtime_topology
        defaults = cast(dict[str, object], topology.get("defaults") or {})
        mode_defaults = cast(dict[str, object], defaults.get("transport_by_mode") or {})
        mode_default = cast(dict[str, object], mode_defaults.get(mode) or {})

        default_transport = str(mode_default.get("transport") or "gcs")
        default_check = str(mode_default.get("dependency_check") or "gcs")
        effective_profile = deployment_profile or str(
            defaults.get("deployment_profile") or "distributed"
        )

        services_cfg = cast(dict[str, object], topology.get("services") or {})
        service_cfg = cast(dict[str, object], services_cfg.get(service) or {})
        upstream_cfg = cast(
            dict[str, object],
            cast(dict[str, object], service_cfg.get("upstream") or {}).get(upstream_service) or {},
        )
        mode_cfg_raw = upstream_cfg.get(mode)
        mode_cfg = cast(dict[str, object], mode_cfg_raw) if isinstance(mode_cfg_raw, dict) else {}

        if "transport" in mode_cfg:
            transport = str(mode_cfg.get("transport") or default_transport)
            dependency_check = str(mode_cfg.get("dependency_check") or default_check)
            profile_for_edge = str(mode_cfg.get("deployment_profile") or effective_profile)
        elif effective_profile in mode_cfg:
            profile_cfg_raw = mode_cfg.get(effective_profile)
            profile_cfg_inner = (
                cast(dict[str, object], profile_cfg_raw)
                if isinstance(profile_cfg_raw, dict)
                else {}
            )
            transport = str(profile_cfg_inner.get("transport") or default_transport)
            dependency_check = str(profile_cfg_inner.get("dependency_check") or default_check)
            profile_for_edge = effective_profile
        else:
            transport = default_transport
            dependency_check = default_check
            profile_for_edge = effective_profile

        profiles_cfg = cast(dict[str, object], topology.get("deployment_profiles") or {})
        profile_cfg_raw2 = profiles_cfg.get(profile_for_edge)
        profile_cfg = (
            cast(dict[str, object], profile_cfg_raw2) if isinstance(profile_cfg_raw2, dict) else {}
        )
        allowed_transports_raw = profile_cfg.get("allowed_transports")
        allowed_transports = (
            cast(list[str], allowed_transports_raw)
            if isinstance(allowed_transports_raw, list)
            else ["gcs", "pubsub"]
        )

        if transport not in allowed_transports:
            raise ValueError(
                f"Invalid runtime topology for {service} <- {upstream_service} ({mode}): "
                f"transport '{transport}' is not allowed in deployment profile '{profile_for_edge}'"
            )

        if dependency_check not in {"gcs", "none", "pubsub"}:
            raise ValueError(
                f"Invalid dependency_check '{dependency_check}'"
                f" for {service} <- {upstream_service} ({mode})"
            )

        return transport, dependency_check

    def validate_can_run(
        self,
        service: str,
        date: str,
        category: str | None = None,
        domain: str | None = None,
        mode: str = "batch",
        deployment_profile: str | None = None,
        fail_on_optional: bool = False,
        **template_vars: object,
    ) -> bool:
        """
        Validate that a service can run (all required dependencies met).

        Args:
            service: Service to validate
            date: Date to check
            category: Optional category filter
            domain: Optional domain filter
            fail_on_optional: Whether to fail on missing optional deps
            **template_vars: Additional template variables

        Returns:
            True if service can run, False otherwise

        Raises:
            DependencyError: If required dependencies are not met
        """
        report = self.check_dependencies(
            service=service,
            date=date,
            category=category,
            domain=domain,
            mode=mode,
            deployment_profile=deployment_profile,
            **template_vars,
        )

        if fail_on_optional:
            return report.all_passed
        else:
            return report.required_passed

    def generate_dependency_tree(
        self,
        service: str | None = None,
        indent: int = 2,
    ) -> str:
        """
        Generate a text-based dependency tree.

        Args:
            service: Service to show tree for (None = all services)
            indent: Indentation per level

        Returns:
            Formatted dependency tree string
        """
        lines: list[str] = []

        services = [service] if service else self.get_execution_order()

        for svc in services:
            lines.append(self._format_service_tree(svc, indent, 0, set()))

        return "\n".join(lines)

    def _format_service_tree(
        self,
        service: str,
        indent: int,
        level: int,
        visited: set[str],
    ) -> str:
        """Format a single service's dependency tree."""
        prefix = " " * (indent * level)

        if service in visited:
            return f"{prefix}{service} (circular reference)"

        visited.add(service)

        try:
            config = self.get_service_config(service)
        except ValueError:
            return f"{prefix}{service} (unknown)"

        lines = [f"{prefix}{service}"]

        upstream = cast("list[dict[str, object]]", config.get("upstream") or [])
        for i, dep in enumerate(upstream):
            dep_service = cast(str, dep["service"])
            required = cast(bool, dep.get("required", True))
            is_library = cast(bool, dep.get("is_library", False))

            marker = "├──" if i < len(upstream) - 1 else "└──"
            req_marker = "*" if required else "?"
            lib_marker = " [lib]" if is_library else ""

            sub_prefix = " " * (indent * level)
            lines.append(f"{sub_prefix}{marker} {req_marker} {dep_service}{lib_marker}")

        return "\n".join(lines)

    def generate_mermaid_diagram(self) -> str:
        """Generate a Mermaid diagram of the dependency graph."""
        lines = ["flowchart TD"]

        # Define subgraphs for each layer
        layers = {
            "DataIO": [
                "instruments-service",
                "market-tick-data-service",
                "market-data-processing-service",
            ],
            "Features": [
                "features-calendar-service",
                "features-delta-one-service",
                "features-volatility-service",
                "features-onchain-service",
            ],
            "ML": ["ml-training-service", "ml-inference-service"],
            "Backtesting": ["strategy-service", "execution-service"],
        }

        for layer_name, services in layers.items():
            lines.append(f"    subgraph {layer_name}")
            for svc in services:
                # Convert service name to valid Mermaid node ID
                node_id = svc.replace("-", "_")
                short_name = (
                    svc.replace("-service", "").replace("market-", "m-").replace("features-", "f-")
                )
                lines.append(f"        {node_id}[{short_name}]")
            lines.append("    end")

        lines.append("")

        # Add edges
        for svc_name, svc_config in cast(
            "dict[str, dict[str, object]]", self.config.get("services") or {}
        ).items():
            source_id = svc_name.replace("-", "_")

            for dep in cast("list[dict[str, object]]", svc_config.get("upstream") or []):
                target_service = cast(str, dep["service"])
                target_id = target_service.replace("-", "_")
                required = cast(bool, dep.get("required", True))

                if required:
                    lines.append(f"    {target_id} --> {source_id}")
                else:
                    lines.append(f"    {target_id} -.-> {source_id}")

        return "\n".join(lines)


class DependencyError(Exception):
    """Raised when required dependencies are not met."""

    def __init__(self, service: str, report: DependencyReport):
        self.service = service
        self.report = report

        failed_required = [c for c in report.checks if c.required and not c.passed]

        message = f"Service {service} has unmet required dependencies:\n"
        for check in failed_required:
            message += f"  - {check.upstream_service}: {check.message}\n"

        super().__init__(message)
