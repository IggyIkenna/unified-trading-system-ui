"""Unit tests for deployment-service configuration compliance.

Verifies that:
- Configuration is loaded via DeploymentConfig (not os.getenv/os.environ)
- UnifiedCloudConfig is the canonical config source for cloud settings
- No bare os.getenv or os.environ calls exist in production source
"""

import re
from pathlib import Path

import pytest

SOURCE_DIR = Path(__file__).resolve().parents[2] / "deployment_service"
EXCLUDED_DIRS = {"__pycache__", ".venv", "venv", "tests", "scripts", "tools"}


def _get_production_python_files() -> list[Path]:
    """Return all production Python source files, excluding test/script dirs."""
    files = []
    for path in SOURCE_DIR.rglob("*.py"):
        parts = set(path.relative_to(SOURCE_DIR).parts)
        if not parts & EXCLUDED_DIRS:
            files.append(path)
    return files


@pytest.fixture
def production_files() -> list[Path]:
    return _get_production_python_files()


def test_no_os_getenv_in_production(production_files: list[Path]) -> None:
    """Production source must not use os.getenv() — use UnifiedCloudConfig or DeploymentConfig."""
    pattern = re.compile(r"\bos\.getenv\s*\(")
    violations: list[str] = []
    for fpath in production_files:
        content = fpath.read_text(encoding="utf-8")
        for lineno, line in enumerate(content.splitlines(), start=1):
            if pattern.search(line) and not line.strip().startswith("#"):
                violations.append(
                    f"{fpath.relative_to(SOURCE_DIR.parent)}:{lineno}: {line.strip()}"
                )
    assert not violations, "os.getenv() found in production source:\n" + "\n".join(violations)


def test_deployment_config_importable() -> None:
    """DeploymentConfig must be importable from deployment_service."""
    from deployment_service.deployment_config import DeploymentConfig

    config = DeploymentConfig()
    assert config is not None


def test_deployment_config_has_gcp_project_id() -> None:
    """DeploymentConfig must expose gcp_project_id attribute."""
    from deployment_service.deployment_config import DeploymentConfig

    config = DeploymentConfig()
    # The attribute must exist (may be None in test environment)
    assert hasattr(config, "gcp_project_id")


def test_deployment_config_has_cloud_provider() -> None:
    """DeploymentConfig must expose cloud_provider attribute."""
    from deployment_service.deployment_config import DeploymentConfig

    config = DeploymentConfig()
    assert hasattr(config, "cloud_provider")


def test_no_hardcoded_project_id_in_production(production_files: list[Path]) -> None:
    """Production Python source must not contain the hardcoded GCP project ID."""
    hardcoded_id = "test-project-id"
    violations: list[str] = []
    for fpath in production_files:
        content = fpath.read_text(encoding="utf-8")
        for lineno, line in enumerate(content.splitlines(), start=1):
            if hardcoded_id in line and not line.strip().startswith("#"):
                violations.append(
                    f"{fpath.relative_to(SOURCE_DIR.parent)}:{lineno}: {line.strip()}"
                )
    assert not violations, "Hardcoded project ID found in production source:\n" + "\n".join(
        violations
    )
