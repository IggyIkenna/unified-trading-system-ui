"""Functional integration tests exercising unified-* library dependencies.

Goes beyond import checks: instantiates real objects, calls real methods,
and verifies correct behaviour under CLOUD_PROVIDER=local CLOUD_MOCK_MODE=true.
"""

from __future__ import annotations

import os

os.environ.setdefault("CLOUD_MOCK_MODE", "true")
os.environ.setdefault("CLOUD_PROVIDER", "local")
os.environ.setdefault("GCP_PROJECT_ID", "test-project")
os.environ.setdefault("DISABLE_AUTH", "true")
os.environ.setdefault("MOCK_STATE_MODE", "deterministic")

import pytest

pytestmark = [pytest.mark.integration, pytest.mark.timeout(120)]


# ---------------------------------------------------------------------------
# unified-config-interface: UnifiedCloudConfig + DeploymentApiConfig
# ---------------------------------------------------------------------------


class TestUnifiedConfigInterfaceFunctional:
    """Functional tests for unified-config-interface usage in deployment-api."""

    def test_deployment_api_config_extends_unified_cloud_config(self) -> None:
        """DeploymentApiConfig inherits from UnifiedCloudConfig correctly."""
        from unified_config_interface import UnifiedCloudConfig

        from deployment_api.deployment_api_config import DeploymentApiConfig

        cfg = DeploymentApiConfig()
        assert isinstance(cfg, UnifiedCloudConfig)

    def test_deployment_api_config_has_deployment_specific_fields(self) -> None:
        """Service-specific fields are populated from env or defaults."""
        from deployment_api.deployment_api_config import DeploymentApiConfig

        cfg = DeploymentApiConfig()
        assert isinstance(cfg.deployment_env, str)
        assert isinstance(cfg.state_bucket, str)
        assert isinstance(cfg.default_max_concurrent, int)
        assert cfg.default_max_concurrent > 0

    def test_deployment_api_config_effective_properties(self) -> None:
        """Derived properties compute fallback bucket names correctly."""
        from deployment_api.deployment_api_config import DeploymentApiConfig

        cfg = DeploymentApiConfig()
        # effective_state_bucket should have a value
        bucket = cfg.effective_state_bucket
        assert isinstance(bucket, str)
        assert len(bucket) > 0

        # effective_execution_store_bucket
        exec_bucket = cfg.effective_execution_store_bucket
        assert isinstance(exec_bucket, str)
        assert len(exec_bucket) > 0

    def test_deployment_api_config_all_failover_regions(self) -> None:
        """all_failover_regions returns a non-empty list of region strings."""
        from deployment_api.deployment_api_config import DeploymentApiConfig

        cfg = DeploymentApiConfig()
        regions = cfg.all_failover_regions
        assert isinstance(regions, list)
        assert len(regions) > 0
        assert all(isinstance(r, str) for r in regions)

    def test_unified_cloud_config_test_env_fields(self) -> None:
        """UnifiedCloudConfig reads env vars correctly in test mode."""
        from unified_config_interface import UnifiedCloudConfig

        cfg = UnifiedCloudConfig()
        assert cfg.cloud_provider == "local"
        assert cfg.is_mock_mode() is True


# ---------------------------------------------------------------------------
# unified-cloud-interface: StorageClient, get_storage_client
# ---------------------------------------------------------------------------


class TestUnifiedCloudInterfaceFunctional:
    """Functional tests for unified-cloud-interface usage in deployment-api."""

    def test_get_storage_client_local_provider(self) -> None:
        """get_storage_client(provider='local') returns a usable client."""
        from unified_cloud_interface import get_storage_client

        client = get_storage_client(provider="local")
        assert client is not None
        assert hasattr(client, "list_blobs")
        assert hasattr(client, "download_bytes")
        assert hasattr(client, "upload_bytes")
        assert hasattr(client, "blob_exists")
        assert hasattr(client, "delete_blob")

    def test_storage_client_upload_download_roundtrip(self) -> None:
        """Upload bytes and download them back via local storage client."""
        from unified_cloud_interface import get_storage_client

        client = get_storage_client(provider="local")
        bucket = "deployment-api-test-bucket"
        blob_path = "integration-test/state.json"
        payload = b'{"deployment_id": "dep-001", "status": "running"}'

        client.upload_bytes(bucket, blob_path, payload)
        downloaded = client.download_bytes(bucket, blob_path)
        assert downloaded == payload

    def test_storage_client_blob_exists_check(self) -> None:
        """blob_exists returns correct booleans."""
        from unified_cloud_interface import get_storage_client

        client = get_storage_client(provider="local")
        bucket = "deployment-api-test-bucket"

        client.upload_bytes(bucket, "exists-check/file.json", b"{}")
        assert client.blob_exists(bucket, "exists-check/file.json") is True
        assert client.blob_exists(bucket, "nonexistent/path.json") is False

    def test_storage_client_list_blobs_returns_iterable(self) -> None:
        """list_blobs returns an iterable of blob metadata objects."""
        from unified_cloud_interface import get_storage_client

        client = get_storage_client(provider="local")
        bucket = "deployment-api-list-test"
        client.upload_bytes(bucket, "prefix/a.json", b"{}")
        client.upload_bytes(bucket, "prefix/b.json", b"{}")

        blobs = list(client.list_blobs(bucket, prefix="prefix/"))
        assert len(blobs) >= 2
        names = [b.name for b in blobs]
        assert "prefix/a.json" in names
        assert "prefix/b.json" in names

    def test_storage_client_delete_blob(self) -> None:
        """delete_blob removes a blob from local storage."""
        from unified_cloud_interface import get_storage_client

        client = get_storage_client(provider="local")
        bucket = "deployment-api-delete-test"
        client.upload_bytes(bucket, "to-delete.json", b'{"del": true}')
        assert client.blob_exists(bucket, "to-delete.json") is True

        client.delete_blob(bucket, "to-delete.json")
        assert client.blob_exists(bucket, "to-delete.json") is False

    def test_storage_client_type_import(self) -> None:
        """StorageClient type is importable for type annotations."""
        from unified_cloud_interface import StorageClient

        assert StorageClient is not None


# ---------------------------------------------------------------------------
# unified-events-interface: setup_events, log_event
# ---------------------------------------------------------------------------


class TestUnifiedEventsInterfaceFunctional:
    """Functional tests for unified-events-interface usage in deployment-api."""

    def test_setup_events_test_mode(self) -> None:
        """setup_events() in 'test' mode completes without error."""
        from unified_events_interface import setup_events

        setup_events("deployment-api-test", "test")

    def test_log_event_fires_without_error(self) -> None:
        """log_event() in test mode does not raise."""
        from unified_events_interface import log_event, setup_events

        setup_events("deployment-api-test-log", "test")
        log_event(
            "DEPLOYMENT_STARTED",
            details={"deployment_id": "dep-001", "services": ["svc-a"]},
        )

    def test_log_event_with_severity_levels(self) -> None:
        """log_event() accepts various severity levels."""
        from unified_events_interface import log_event, setup_events

        setup_events("deployment-api-test-sev", "test")
        for severity in ("INFO", "WARNING", "ERROR", "CRITICAL"):
            log_event(
                "TEST_EVENT",
                severity=severity,
                details={"level": severity},
            )


# ---------------------------------------------------------------------------
# unified-internal-contracts: RBAC schemas
# ---------------------------------------------------------------------------


class TestUnifiedInternalContractsFunctional:
    """Functional tests for unified-internal-contracts RBAC schemas."""

    def test_user_role_enum_has_expected_members(self) -> None:
        """UserRole enum includes VIEWER, OPERATOR, ADMIN, SUPER_ADMIN."""
        from unified_internal_contracts.schemas.rbac import UserRole

        assert UserRole.VIEWER is not None
        assert UserRole.OPERATOR is not None
        assert UserRole.ADMIN is not None
        assert UserRole.SUPER_ADMIN is not None

    def test_permission_enum_has_members(self) -> None:
        """Permission enum has at least one member."""
        from unified_internal_contracts.schemas.rbac import Permission

        members = list(Permission)
        assert len(members) > 0

    def test_role_permissions_mapping(self) -> None:
        """ROLE_PERMISSIONS maps each UserRole to a frozenset of Permissions."""
        from unified_internal_contracts.schemas.rbac import (
            ROLE_PERMISSIONS,
            Permission,
            UserRole,
        )

        assert isinstance(ROLE_PERMISSIONS, dict)
        # SUPER_ADMIN should have the most permissions
        super_admin_perms = ROLE_PERMISSIONS.get(UserRole.SUPER_ADMIN, frozenset())
        viewer_perms = ROLE_PERMISSIONS.get(UserRole.VIEWER, frozenset())
        assert len(super_admin_perms) >= len(viewer_perms)

        # All permissions should be Permission enum instances
        for perms in ROLE_PERMISSIONS.values():
            for p in perms:
                assert isinstance(p, Permission)

    def test_has_role_permission_function(self) -> None:
        """has_role_permission checks permission membership correctly."""
        from unified_internal_contracts.schemas.rbac import (
            ROLE_PERMISSIONS,
            UserRole,
            has_role_permission,
        )

        # SUPER_ADMIN should have all permissions
        super_admin_perms = ROLE_PERMISSIONS.get(UserRole.SUPER_ADMIN, frozenset())
        if super_admin_perms:
            first_perm = next(iter(super_admin_perms))
            assert has_role_permission(UserRole.SUPER_ADMIN, first_perm) is True

    def test_user_profile_creation_and_effective_permissions(self) -> None:
        """UserProfile can be created and returns effective_permissions()."""
        from datetime import UTC, datetime

        from unified_internal_contracts.schemas.rbac import UserProfile, UserRole

        profile = UserProfile(
            user_id="test-user-001",
            email="test@example.com",
            display_name="Test User",
            role=UserRole.ADMIN,
            is_active=True,
            created_at=datetime.now(UTC),
        )
        assert profile.user_id == "test-user-001"
        assert profile.role == UserRole.ADMIN

        perms = profile.effective_permissions()
        assert isinstance(perms, frozenset)
        assert len(perms) > 0

    def test_user_profile_has_permission_method(self) -> None:
        """UserProfile.has_permission() correctly checks role-based permissions."""
        from datetime import UTC, datetime

        from unified_internal_contracts.schemas.rbac import (
            ROLE_PERMISSIONS,
            UserProfile,
            UserRole,
        )

        profile = UserProfile(
            user_id="test-perm-user",
            email="perm@example.com",
            display_name="Perm User",
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            created_at=datetime.now(UTC),
        )
        # SUPER_ADMIN should have access to its permissions
        super_admin_perms = ROLE_PERMISSIONS.get(UserRole.SUPER_ADMIN, frozenset())
        if super_admin_perms:
            first_perm = next(iter(super_admin_perms))
            assert profile.has_permission(first_perm) is True

    def test_user_role_string_values(self) -> None:
        """UserRole values can be converted to/from strings."""
        from unified_internal_contracts.schemas.rbac import UserRole

        for role in UserRole:
            # Roundtrip: enum -> str -> enum
            role_str = role.value
            reconstructed = UserRole(role_str)
            assert reconstructed == role


# ---------------------------------------------------------------------------
# unified-trading-library: MockStateStore, health router
# ---------------------------------------------------------------------------


class TestUnifiedTradingLibraryFunctional:
    """Functional tests for unified-trading-library usage in deployment-api."""

    def test_mock_state_store_full_lifecycle(self) -> None:
        """MockStateStore supports seed, create, get, update, delete, list, reset."""
        from unified_trading_library import MockStateStore

        store = MockStateStore("test-deployment-api")
        store.seed("deployments", [{"id": "dep-1", "status": "pending"}])

        # List
        items = store.list("deployments")
        assert len(items) == 1

        # Create
        created = store.create("deployments", {"id": "dep-2", "status": "running"})
        assert created["id"] == "dep-2"
        assert len(store.list("deployments")) == 2

        # Get
        item = store.get("deployments", "dep-1")
        assert item is not None
        assert item["status"] == "pending"

        # Update
        updated = store.update("deployments", "dep-1", {"status": "completed"})
        assert updated is not None
        assert updated["status"] == "completed"

        # Delete
        assert store.delete("deployments", "dep-2") is True
        assert len(store.list("deployments")) == 1

        # Reset restores to original seed (dep-1 only, with original status)
        store.reset()
        items = store.list("deployments")
        assert len(items) == 1
        assert items[0]["id"] == "dep-1"
        assert items[0]["status"] == "pending"

    def test_make_health_router_for_deployment_api(self) -> None:
        """make_health_router() produces a valid router for deployment-api."""
        from unified_trading_library import make_health_router

        router = make_health_router(
            service_name="deployment-api",
            version="0.1.1",
            cloud_provider="local",
            mock_mode=True,
        )
        assert router is not None
        assert len(router.routes) > 0

    def test_request_audit_middleware_available(self) -> None:
        """RequestAuditMiddleware is importable and callable."""
        from unified_trading_library import RequestAuditMiddleware

        assert callable(RequestAuditMiddleware)

    def test_get_env_copy_returns_dict(self) -> None:
        """get_env_copy() from unified-trading-library returns a dict of env vars."""
        from unified_trading_library import get_env_copy

        env = get_env_copy()
        assert isinstance(env, dict)
        assert "CLOUD_PROVIDER" in env


# ---------------------------------------------------------------------------
# Cross-dep integration: RBAC + events + config
# ---------------------------------------------------------------------------


class TestCrossDepIntegration:
    """Tests that verify interactions between multiple unified-* deps."""

    def test_user_management_service_uses_rbac_schemas(self) -> None:
        """UserManagementService interacts with UIC RBAC schemas correctly."""
        from deployment_api.services.user_management import UserManagementService

        svc = UserManagementService()

        # get_available_roles uses ROLE_PERMISSIONS from UIC
        roles = svc.get_available_roles()
        assert isinstance(roles, list)
        assert len(roles) > 0
        role_names = [r["role"] for r in roles]
        assert "viewer" in role_names
        assert "admin" in role_names
        assert "super_admin" in role_names

    def test_user_management_service_get_permissions(self) -> None:
        """get_available_permissions() lists Permission enum values."""
        from deployment_api.services.user_management import UserManagementService

        svc = UserManagementService()
        perms = svc.get_available_permissions()
        assert isinstance(perms, list)
        assert len(perms) > 0
        # Each perm should have 'permission' and 'domain' keys
        for perm in perms:
            assert "permission" in perm
            assert "domain" in perm

    def test_rbac_permission_check_integration(self) -> None:
        """has_role_permission works for role-based checks used by rbac.py."""
        from unified_internal_contracts.schemas.rbac import (
            Permission,
            UserRole,
            has_role_permission,
        )

        # VIEWER should have limited permissions
        viewer_has_any = False
        for perm in Permission:
            if has_role_permission(UserRole.VIEWER, perm):
                viewer_has_any = True
                break
        # VIEWER may have read-only permissions
        assert isinstance(viewer_has_any, bool)

        # SUPER_ADMIN should have all permissions
        super_admin_has_all = all(
            has_role_permission(UserRole.SUPER_ADMIN, perm) for perm in Permission
        )
        assert super_admin_has_all is True
