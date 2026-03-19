"""Tests for DeploymentConfig class."""

import os
from unittest.mock import patch

from deployment_service.deployment_config import DeploymentConfig


class TestDeploymentConfig:
    """Test DeploymentConfig functionality."""

    def test_deployment_config_initialization(self):
        """Test DeploymentConfig initializes with default values."""
        config = DeploymentConfig()

        # Test basic attributes exist
        assert hasattr(config, "gcp_project_id")
        assert hasattr(config, "api_port")
        assert hasattr(config, "workers")
        assert hasattr(config, "auto_sync_enabled")

    def test_gcp_project_id_from_env(self):
        """Test GCP project ID reads from environment."""
        with patch.dict(os.environ, {"GCP_PROJECT_ID": "test-project-123"}):
            config = DeploymentConfig()
            assert config.gcp_project_id == "test-project-123"

    def test_api_port_defaults(self):
        """Test API port has sensible defaults."""
        config = DeploymentConfig()
        assert config.api_port == "8000"  # Default value (stored as string)

        with patch.dict(os.environ, {"API_PORT": "9000"}):
            config = DeploymentConfig()
            assert config.api_port == "9000"

    def test_workers_configuration(self):
        """Test workers configuration."""
        config = DeploymentConfig()
        assert config.workers == 4  # Default value

        with patch.dict(os.environ, {"WORKERS": "8"}):
            config = DeploymentConfig()
            assert config.workers == 8

    def test_auto_sync_configuration(self):
        """Test auto-sync configuration."""
        config = DeploymentConfig()

        # Test defaults
        assert config.auto_sync_enabled is True
        assert config.auto_sync_interval_seconds == 60
        assert config.auto_sync_max_parallel == 10

        # Test environment overrides
        with patch.dict(
            os.environ,
            {
                "AUTO_SYNC_ENABLED": "false",
                "AUTO_SYNC_INTERVAL_SECONDS": "120",
                "AUTO_SYNC_MAX_PARALLEL": "5",
            },
        ):
            config = DeploymentConfig()
            assert config.auto_sync_enabled is False
            assert config.auto_sync_interval_seconds == 120
            assert config.auto_sync_max_parallel == 5

    def test_vm_orchestration_config(self):
        """Test VM orchestration configuration."""
        # Clear env vars that .env may override so we test true defaults
        with patch.dict(
            os.environ,
            {
                "VM_LAUNCH_MINI_BATCH_SIZE": "",
                "VM_LAUNCH_MINI_BATCH_DELAY_SECONDS": "",
                "UNKNOWN_STATUS_MAX_POLLS": "",
            },
            clear=False,
        ):
            os.environ.pop("VM_LAUNCH_MINI_BATCH_SIZE", None)
            os.environ.pop("VM_LAUNCH_MINI_BATCH_DELAY_SECONDS", None)
            os.environ.pop("UNKNOWN_STATUS_MAX_POLLS", None)
            config = DeploymentConfig(_env_file=None)

        assert config.vm_launch_mini_batch_size == 200
        assert config.vm_launch_mini_batch_delay_seconds == 3.0
        assert config.unknown_status_max_polls == 10

    def test_performance_tuning_config(self):
        """Test performance tuning configuration."""
        config = DeploymentConfig()

        assert config.gcs_pool_size == 200
        assert config.compute_pool_size == 200
        assert config.compute_pool_maxsize == 200

    def test_cache_configuration(self):
        """Test cache configuration."""
        config = DeploymentConfig()

        assert config.redis_url == "redis://localhost:6379/0"  # Default
        assert config.data_status_cache_ttl_seconds == 1800

        with patch.dict(os.environ, {"REDIS_URL": "redis://localhost:6379"}):
            config = DeploymentConfig()
            assert config.redis_url == "redis://localhost:6379"

    def test_github_configuration(self):
        """Test GitHub configuration."""
        # Clear env vars that .env may override so we test true defaults
        os.environ.pop("GITHUB_TOKEN_SA", None)
        config = DeploymentConfig(_env_file=None)

        assert config.github_org == "IggyIkenna"  # Default
        assert config.github_token_sa == ""  # Default is empty string

        # Test effective_github_token_sa falls back to computed value based on project_id
        assert config.effective_github_token_sa.startswith("github-token-sa@")
        assert ".iam.gserviceaccount.com" in config.effective_github_token_sa

        with patch.dict(os.environ, {"GITHUB_TOKEN_SA": "custom-sa@project.iam"}):
            config = DeploymentConfig(_env_file=None)
            assert config.effective_github_token_sa == "custom-sa@project.iam"

    def test_effective_port_fallback(self):
        """Test effective_port property with fallback logic."""
        # Test default: when api_port is "8000" and no PORT set, returns "8080" (Cloud Run fallback)
        config = DeploymentConfig()
        assert config.effective_port == "8080"

        # Test PORT override
        with patch.dict(os.environ, {"PORT": "3000"}):
            config = DeploymentConfig()
            assert config.effective_port == "3000"

        # Test API_PORT override when PORT not set and api_port != "8000"
        with patch.dict(os.environ, {"API_PORT": "9000"}, clear=True):
            config = DeploymentConfig()
            assert config.effective_port == "9000"

    def test_deployment_region_config(self):
        """Test GCS region configuration (used as deployment region)."""
        config = DeploymentConfig()

        # gcs_region is the regional config field (e.g. "asia-northeast1-c")
        assert config.gcs_region is not None

        with patch.dict(os.environ, {"GCS_REGION": "us-central1-a"}):
            config = DeploymentConfig()
            assert config.gcs_region == "us-central1-a"

    def test_cloud_provider_config(self):
        """Test cloud provider configuration."""
        config = DeploymentConfig()

        assert config.cloud_provider == "gcp"  # Default

        with patch.dict(os.environ, {"CLOUD_PROVIDER": "aws"}):
            config = DeploymentConfig()
            assert config.cloud_provider == "aws"

    def test_enforce_single_region(self):
        """Test enforce single region configuration."""
        config = DeploymentConfig()

        assert config.enforce_single_region is True  # Default

        with patch.dict(os.environ, {"ENFORCE_SINGLE_REGION": "false"}):
            config = DeploymentConfig()
            assert config.enforce_single_region is False

    def test_scheduler_configuration(self):
        """Test auto-scheduler configuration."""
        config = DeploymentConfig()

        assert config.auto_scheduler_max_launch_per_tick == 2000
        assert config.auto_scheduler_batch_size == 200
        assert config.stuck_shard_grace_seconds == 600

        with patch.dict(
            os.environ,
            {"AUTO_SCHEDULER_MAX_LAUNCH_PER_TICK": "5", "AUTO_SCHEDULER_BATCH_SIZE": "50"},
        ):
            config = DeploymentConfig()
            assert config.auto_scheduler_max_launch_per_tick == 5
            assert config.auto_scheduler_batch_size == 50

    def test_boolean_parsing(self):
        """Test boolean environment variable parsing."""
        config = DeploymentConfig()

        # Test various boolean representations
        test_cases = [
            ("true", True),
            ("True", True),
            ("TRUE", True),
            ("1", True),
            ("false", False),
            ("False", False),
            ("FALSE", False),
            ("0", False),
        ]

        for value, expected in test_cases:
            with patch.dict(os.environ, {"AUTO_SYNC_ENABLED": value}):
                config = DeploymentConfig()
                assert config.auto_sync_enabled == expected

    def test_integer_parsing(self):
        """Test integer environment variable parsing."""
        config = DeploymentConfig()

        with patch.dict(os.environ, {"WORKERS": "16"}):
            config = DeploymentConfig()
            assert config.workers == 16
            assert isinstance(config.workers, int)

    def test_config_inheritance(self):
        """Test that DeploymentConfig inherits from UnifiedCloudConfig."""
        config = DeploymentConfig()

        # Check inherited properties
        assert hasattr(config, "gcp_project_id")
        assert hasattr(config, "cloud_provider")

    def test_all_fields_have_defaults(self):
        """Test that all configuration fields have sensible defaults."""
        # This should not raise any exceptions
        config = DeploymentConfig()

        # Verify key fields have non-None defaults
        assert config.api_port is not None
        assert config.workers is not None
        assert config.auto_sync_enabled is not None
        assert config.gcs_region is not None
        assert config.cloud_provider is not None
