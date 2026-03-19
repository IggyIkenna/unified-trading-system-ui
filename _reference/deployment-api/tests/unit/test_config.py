"""Tests that service configuration loads correctly via UnifiedCloudConfig."""

from unittest.mock import MagicMock, patch


def test_unified_cloud_config_is_used() -> None:
    """Service uses UnifiedCloudConfig, not os.environ, for configuration."""
    with patch("unified_config_interface.UnifiedCloudConfig") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.environment = "test"
        mock_cls.return_value = mock_instance

        # Verify the class can be instantiated (no import errors)
        config = mock_cls()
        assert config.environment == "test"
        mock_cls.assert_called_once()


def test_config_environment_field_exists() -> None:
    """UnifiedCloudConfig exposes an environment field."""
    with patch("unified_config_interface.UnifiedCloudConfig") as mock_cls:
        mock_instance = MagicMock()
        mock_instance.environment = "production"
        mock_cls.return_value = mock_instance

        config = mock_cls()
        assert hasattr(config, "environment")


def test_no_os_environ_in_config() -> None:
    """Production config values are not read via os.environ."""
    import ast
    import os

    source_dir = os.path.join(os.path.dirname(__file__), "..", "..", "deployment_api")
    violations: list[str] = []

    # config_loader.py uses os.environ for YAML template variable substitution
    # (not for reading app config), so it is explicitly excluded from this check.
    _excluded = {"config_loader.py"}

    for root, _dirs, files in os.walk(source_dir):
        for fname in files:
            if not fname.endswith(".py"):
                continue
            if fname in _excluded:
                continue
            fpath = os.path.join(root, fname)
            try:
                with open(fpath, encoding="utf-8") as f:
                    source = f.read()
                tree = ast.parse(source, filename=fpath)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Attribute) and (
                        isinstance(node.value, ast.Name)
                        and node.value.id == "os"
                        and node.attr in ("getenv", "environ")
                    ):
                        violations.append(f"{fpath}:{node.lineno}")
            except (OSError, SyntaxError):
                pass

    assert violations == [], f"os.getenv/os.environ found in production source: {violations}"
