"""
Unit test configuration - mocks broken UTL imports before any module imports.

unified_trading_library has a broken CloudTarget/StandardizedDomainCloudService
import chain that prevents importing deployment_api.settings. We mock these
at the sys.modules level before any test module is collected.

We also pre-mock deployment_api.services as a proper package-like mock so that
both flat imports (from deployment_api.services import SyncService) and
sub-module imports (deployment_api.services.deployment_manager) work correctly,
regardless of the order tests are collected.
"""

import sys
from types import ModuleType
from unittest.mock import MagicMock


def _ensure_utl_mocked() -> None:
    """No-op: unified_trading_library is now properly installed and importable.

    Previously this function pre-mocked UTL to work around broken import chains
    in deployment_api.settings. The settings module now uses DeploymentApiConfig
    (local to deployment-api), so the UTL mock is no longer needed.
    """


def _ensure_services_mocked() -> None:
    """Pre-mock deployment_api.services as a package-compatible module.

    Both flat imports (from deployment_api.services import SyncService) and
    dotted sub-module imports (from deployment_api.services.deployment_manager
    import DeploymentManager) must work. We achieve this by creating real
    ModuleType objects with MagicMock attributes and registering all sub-modules
    in sys.modules before any test file is collected.

    user_management is loaded as a REAL module (not mocked) because it defines
    Pydantic request/response models used as FastAPI type annotations in routes.
    MagicMock cannot substitute for Pydantic BaseModel subclasses.
    """
    if "deployment_api.services" in sys.modules:
        return

    # Load user_management as a REAL module BEFORE replacing the services package.
    # It defines Pydantic BaseModel subclasses (CreateUserRequest, AssignRoleRequest,
    # UpdateUserRequest) used as FastAPI route parameter types — MagicMock cannot
    # substitute for these.
    import importlib

    real_um = importlib.import_module("deployment_api.services.user_management")

    # Build the top-level services package module (replacing the real one)
    services_mod = ModuleType("deployment_api.services")
    services_mod.__package__ = "deployment_api.services"
    services_mod.__path__ = []  # type: ignore[attr-defined]  # marks it as a package

    # Expose common service classes at the package level
    services_mod.SyncService = MagicMock()  # type: ignore[attr-defined]
    services_mod.DataAnalyticsService = MagicMock()  # type: ignore[attr-defined]
    services_mod.DataQueryService = MagicMock()  # type: ignore[attr-defined]
    services_mod.DataStatusService = MagicMock()  # type: ignore[attr-defined]

    sys.modules["deployment_api.services"] = services_mod

    # Re-register user_management as a real module on the fake services package
    sys.modules["deployment_api.services.user_management"] = real_um
    services_mod.user_management = real_um

    # Sub-module list — only modules that need mocking (circular import breakers).
    # Real modules (sync_service, event_processor, state_manager) are NOT mocked
    # because their tests import and test them directly.
    sub_modules = [
        "data_analytics_service",
        "data_query_service",
        "data_status_service",
        "deployment_manager",
        "deployment_state",
    ]

    for sub in sub_modules:
        full_name = f"deployment_api.services.{sub}"
        if full_name not in sys.modules:
            sub_mod = ModuleType(full_name)
            sub_mod.__package__ = "deployment_api.services"
            # Expose plausible class names on each sub-module via MagicMock
            sub_mod.DeploymentManager = MagicMock()  # type: ignore[attr-defined]
            sub_mod.DeploymentStateManager = MagicMock()  # type: ignore[attr-defined]
            sub_mod.SyncService = MagicMock()  # type: ignore[attr-defined]
            sub_mod.DataAnalyticsService = MagicMock()  # type: ignore[attr-defined]
            sub_mod.DataQueryService = MagicMock()  # type: ignore[attr-defined]
            sub_mod.DataStatusService = MagicMock()  # type: ignore[attr-defined]
            sub_mod.StateManager = MagicMock()  # type: ignore[attr-defined]
            sub_mod.EventProcessor = MagicMock()  # type: ignore[attr-defined]
            sys.modules[full_name] = sub_mod
            # Also set as attribute on the package module
            setattr(services_mod, sub, sub_mod)


def _ensure_external_packages_mocked() -> None:
    """Pre-mock external packages (backends, deployment) as package-compatible modules.

    These packages are not installed in the test environment but are imported at
    module level by some source files. We register proper ModuleType objects (not
    flat MagicMocks) so that dotted sub-module imports work regardless of
    the order in which test files are collected.
    """
    # --- Shared status sentinel objects (created unconditionally) ---
    # These are referenced by both the deployment.state and deployment_service.deployment.state
    # mocks so tests and source code compare the same objects.
    _shared_deployment_status = MagicMock()
    _shared_shard_status = MagicMock()
    _shared_state_manager_cls = MagicMock()

    # --- backends package ---
    if "backends" not in sys.modules:
        backends_mod = ModuleType("backends")
        backends_mod.__package__ = "backends"
        backends_mod.__path__ = []  # type: ignore[attr-defined]
        sys.modules["backends"] = backends_mod

        for sub_name, attrs in {
            "base": {
                "JobStatus": MagicMock(SUCCEEDED="SUCCEEDED", FAILED="FAILED", RUNNING="RUNNING")
            },
            "cloud_run": {"CloudRunBackend": MagicMock()},
            "vm": {"VMBackend": MagicMock()},
        }.items():
            full = f"backends.{sub_name}"
            sub_mod = ModuleType(full)
            sub_mod.__package__ = "backends"
            for attr, val in attrs.items():
                setattr(sub_mod, attr, val)
            sys.modules[full] = sub_mod
            setattr(backends_mod, sub_name, sub_mod)

    # --- deployment package ---
    if "deployment" not in sys.modules:
        dep_pkg = ModuleType("deployment")
        dep_pkg.__package__ = "deployment"
        dep_pkg.__path__ = []  # type: ignore[attr-defined]
        dep_pkg.StateManager = _shared_state_manager_cls  # type: ignore[attr-defined]
        sys.modules["deployment"] = dep_pkg

        for sub_name, attrs in {
            "state": {
                "DeploymentStatus": _shared_deployment_status,
                "StateManager": _shared_state_manager_cls,
                "ShardStatus": _shared_shard_status,
            },
            "orchestrator": {"DeploymentOrchestrator": MagicMock()},
            "quota_broker_client": {"QuotaBrokerClient": MagicMock()},
        }.items():
            full = f"deployment.{sub_name}"
            sub_mod = ModuleType(full)
            sub_mod.__package__ = "deployment"
            for attr, val in attrs.items():
                setattr(sub_mod, attr, val)
            sys.modules[full] = sub_mod
            setattr(dep_pkg, sub_name, sub_mod)

    # --- deployment_service package ---
    if "deployment_service" not in sys.modules:
        ds_pkg = ModuleType("deployment_service")
        ds_pkg.__package__ = "deployment_service"
        ds_pkg.__path__ = []  # type: ignore[attr-defined]
        sys.modules["deployment_service"] = ds_pkg

        _mock_validator = MagicMock(get_required=MagicMock(return_value="value"))

        # Build a realistic DeploymentConfig mock so that settings.py constants
        # resolve to proper types (ints, strs, lists) rather than MagicMocks.
        _mock_config_instance = MagicMock()
        # Core cloud
        _mock_config_instance.gcp_project_id = "test-project"
        _mock_config_instance.gcs_region = "us-central1"
        _mock_config_instance.effective_state_bucket = "test-bucket"
        _mock_config_instance.service_account_email = "sa@test.iam"
        _mock_config_instance.github_org = "test-org"
        _mock_config_instance.effective_github_token_sa = "test-token"
        _mock_config_instance.cloud_provider = "gcp"
        _mock_config_instance.deployment_env = "development"
        # Server
        _mock_config_instance.api_port = 8080
        _mock_config_instance.workers = 1
        _mock_config_instance.effective_port = 8080
        _mock_config_instance.frontend_port = 3000
        _mock_config_instance.cors_allowed_origins = "http://localhost:3000"
        _mock_config_instance.cors_allowed_cloud_run = False
        # Auto-sync
        _mock_config_instance.auto_sync_enabled = True
        _mock_config_instance.auto_sync_interval_seconds = 30
        _mock_config_instance.auto_sync_interval_active = 10
        _mock_config_instance.auto_sync_lock_ttl_seconds = 120
        _mock_config_instance.auto_sync_max_parallel = 4
        # Orphan cleanup
        _mock_config_instance.orphan_delete_max_parallel = 10
        _mock_config_instance.orphan_delete_retry_seconds = 120
        _mock_config_instance.orphan_cleanup_recently_completed_minutes = 30
        # Quota / write
        _mock_config_instance.write_quota_buffer = 0.1
        # Concurrency
        _mock_config_instance.default_max_concurrent = 10
        _mock_config_instance.max_concurrent_hard_limit = 50
        # Auto-scheduler
        _mock_config_instance.auto_scheduler_max_launch_per_tick = 5
        _mock_config_instance.auto_scheduler_max_releases_per_tick = 5
        _mock_config_instance.auto_scheduler_batch_size = 10
        _mock_config_instance.auto_scheduler_inter_batch_delay = 0.1
        _mock_config_instance.auto_scheduler_delete_batch_size = 5
        _mock_config_instance.auto_scheduler_delete_batch_delay_seconds = 0.5
        _mock_config_instance.auto_scheduler_parallel_workers = 2
        _mock_config_instance.auto_scheduler_vm_rate_limit = 2
        # Stuck / OOM
        _mock_config_instance.stuck_shard_grace_seconds = 300
        _mock_config_instance.oom_kill_threshold = 90
        # VM launch
        _mock_config_instance.vm_launch_mini_batch_size = 5
        _mock_config_instance.vm_launch_mini_batch_delay_seconds = 1.0
        _mock_config_instance.unknown_status_max_polls = 3
        # Pool sizes
        _mock_config_instance.gcs_pool_size = 4
        _mock_config_instance.compute_pool_size = 4
        _mock_config_instance.compute_pool_maxsize = 8
        # Cache / redis
        _mock_config_instance.redis_url = "redis://localhost:6379/0"
        _mock_config_instance.gcs_cache_path = "cache/"
        _mock_config_instance.data_status_cache_ttl_seconds = 300
        _mock_config_instance.exec_cache_ttl_seconds = 300
        # Quota broker
        _mock_config_instance.quota_broker_url = ""
        _mock_config_instance.quota_broker_auth_mode = "none"
        _mock_config_instance.quota_broker_timeout_seconds = 5
        _mock_config_instance.broker_max_wait_seconds = 30
        # Misc
        _mock_config_instance.workspace_root = "/tmp/test-workspace"
        _mock_config_instance.is_mock_mode.return_value = False
        _mock_config_instance.enforce_single_region = False
        _mock_config_instance.disable_auth = False
        _mock_config_instance.api_key = "test-api-key"
        _mock_config_instance.enable_cloud_run_origin = False
        _mock_config_instance.log_level = "INFO"
        _DeploymentConfig = MagicMock(return_value=_mock_config_instance)

        for sub_name, attrs in {
            "config": {},
            "config.config_validator": {
                "ConfigurationError": Exception,
                "ValidationUtils": _mock_validator,
            },
            "deployment_config": {"DeploymentConfig": _DeploymentConfig},
            "config_loader": {
                "ConfigLoader": MagicMock(),
                "substitute_env_vars": MagicMock(return_value={}),
            },
            "shard_calculator": {"ShardCalculator": MagicMock()},
            "cloud_client": {"CloudClient": MagicMock()},
            "deployment": {
                "StateManager": _shared_state_manager_cls,
                "DeploymentState": MagicMock(),
                "ShardState": MagicMock(),
                "DeploymentStatus": _shared_deployment_status,
                "ShardStatus": _shared_shard_status,
            },
            "deployment.state": {
                "DeploymentStatus": _shared_deployment_status,
                "StateManager": _shared_state_manager_cls,
                "ShardStatus": _shared_shard_status,
                "DeploymentState": MagicMock(),
                "ShardState": MagicMock(),
            },
            "deployment.orchestrator": {"DeploymentOrchestrator": MagicMock()},
            "deployment.quota_broker_client": {"QuotaBrokerClient": MagicMock()},
        }.items():
            full = f"deployment_service.{sub_name}"
            sub_mod = ModuleType(full)
            sub_mod.__package__ = "deployment_service"
            # Mark sub-packages (like deployment) so they can have their own sub-modules
            if "." not in sub_name:
                sub_mod.__path__ = []  # type: ignore[attr-defined]
            for attr, val in attrs.items():
                setattr(sub_mod, attr, val)
            sys.modules[full] = sub_mod


# Run immediately at import time (before pytest collects tests)
_ensure_utl_mocked()
_ensure_services_mocked()
_ensure_external_packages_mocked()
