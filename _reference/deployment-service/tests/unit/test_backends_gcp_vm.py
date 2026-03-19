"""
Unit tests for deployment_service.backends.vm.VMBackend.

The VMBackend is a thin facade: it delegates all heavy lifting to three
service managers (VMConfigManager, VMLifecycleManager, VMMonitoringManager).
We mock those managers at the class level so no GCP SDK code runs.

Coverage targets:
- VMBackend.__init__: zone/zones/default-zone wiring
- VMBackend.backend_type
- deploy_shard: delegates to lifecycle manager
- get_status: delegates to monitoring manager
- get_status_with_context: delegates to monitoring manager with job_context
- cancel_job: delegates to lifecycle manager
- cancel_job_fire_and_forget: delegates to lifecycle manager
- cleanup_zombie_vms: delegates to lifecycle manager
- get_logs_url: delegates to lifecycle manager
- VMLifecycleManager.get_next_zone_round_robin: cyclic zone rotation
- VMLifecycleManager.record_zone_exhaustion: counter increments
"""

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends.base import JobInfo, JobStatus

# Constants
PROJECT = "gcp-project-001"
REGION = "us-central1"
SA = "svc@gcp-project-001.iam.gserviceaccount.com"
ZONES = [f"{REGION}-a", f"{REGION}-b", f"{REGION}-c"]


# ---------------------------------------------------------------------------
# Patch targets: mock the three service managers and their imports so that
# VMBackend can be imported and instantiated without any GCP SDK connectivity.
# ---------------------------------------------------------------------------

_PATCH_CONFIG_MGR = "deployment_service.backends.vm.VMConfigManager"
_PATCH_LIFECYCLE_MGR = "deployment_service.backends.vm.VMLifecycleManager"
_PATCH_MONITORING_MGR = "deployment_service.backends.vm.VMMonitoringManager"


def _make_vm_backend(
    zone: str | None = None,
    zones: list[str] | None = None,
    status_bucket: str | None = "my-status-bucket",
    status_prefix: str = "deployments",
) -> tuple[object, MagicMock, MagicMock, MagicMock]:
    """
    Construct a VMBackend with all three service managers mocked.

    Returns (backend, config_mgr_mock, lifecycle_mgr_mock, monitoring_mgr_mock).
    """
    with (
        patch(_PATCH_CONFIG_MGR) as MockConfigMgr,
        patch(_PATCH_LIFECYCLE_MGR) as MockLifecycleMgr,
        patch(_PATCH_MONITORING_MGR) as MockMonitoringMgr,
    ):
        config_instance = MagicMock()
        # get_zones_for_region and get_zone_suffixes must return real lists so
        # VMBackend.__init__ can build self.zones
        config_instance.get_zones_for_region.return_value = ZONES
        config_instance.get_zone_suffixes.return_value = ["a", "b", "c"]
        MockConfigMgr.return_value = config_instance

        lifecycle_instance = MagicMock()
        MockLifecycleMgr.return_value = lifecycle_instance

        monitoring_instance = MagicMock()
        MockMonitoringMgr.return_value = monitoring_instance

        from deployment_service.backends.vm import VMBackend

        backend = VMBackend(
            project_id=PROJECT,
            region=REGION,
            service_account_email=SA,
            zone=zone,
            zones=zones,
            status_bucket=status_bucket,
            status_prefix=status_prefix,
        )

    return backend, config_instance, lifecycle_instance, monitoring_instance


# ---------------------------------------------------------------------------
# __init__ and properties
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendInit:
    def test_backend_type(self) -> None:
        backend, *_ = _make_vm_backend()
        assert backend.backend_type == "vm"  # type: ignore[attr-defined]

    def test_explicit_zones_list_used_directly(self) -> None:
        custom_zones = ["us-central1-b", "us-central1-c"]
        backend, *_ = _make_vm_backend(zones=custom_zones)
        assert backend.zones == custom_zones  # type: ignore[attr-defined]
        assert backend.zone == "us-central1-b"  # type: ignore[attr-defined]

    def test_explicit_zone_becomes_primary_with_fallbacks(self) -> None:
        """When zone= is given without zones=, the zone list starts with the explicit zone."""
        backend, config_mgr, *_ = _make_vm_backend(zone=f"{REGION}-b")
        config_mgr.get_zone_suffixes.assert_called_once_with(REGION)
        assert backend.zone == f"{REGION}-b"  # type: ignore[attr-defined]
        assert backend.zones[0] == f"{REGION}-b"  # type: ignore[attr-defined]

    def test_default_zones_from_config_manager(self) -> None:
        """When neither zone nor zones given, all region zones are used."""
        backend, config_mgr, *_ = _make_vm_backend()
        config_mgr.get_zones_for_region.assert_called_once_with(REGION)
        assert backend.zones == ZONES  # type: ignore[attr-defined]

    def test_project_region_sa_stored(self) -> None:
        backend, *_ = _make_vm_backend()
        assert backend.project_id == PROJECT  # type: ignore[attr-defined]
        assert backend.region == REGION  # type: ignore[attr-defined]
        assert backend.service_account_email == SA  # type: ignore[attr-defined]

    def test_status_bucket_and_prefix_stored(self) -> None:
        backend, *_ = _make_vm_backend(status_bucket="my-bucket", status_prefix="custom-prefix")
        assert backend.status_bucket == "my-bucket"  # type: ignore[attr-defined]
        assert backend.status_prefix == "custom-prefix"  # type: ignore[attr-defined]

    def test_lifecycle_manager_constructed_with_correct_params(self) -> None:
        with (
            patch(_PATCH_CONFIG_MGR) as MockConfigMgr,
            patch(_PATCH_LIFECYCLE_MGR) as MockLifecycleMgr,
            patch(_PATCH_MONITORING_MGR),
        ):
            cfg = MagicMock()
            cfg.get_zones_for_region.return_value = ZONES
            MockConfigMgr.return_value = cfg
            MockLifecycleMgr.return_value = MagicMock()

            from deployment_service.backends.vm import VMBackend

            VMBackend(
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                status_bucket="bucket-x",
                status_prefix="prefix-y",
            )

        MockLifecycleMgr.assert_called_once_with(
            project_id=PROJECT,
            region=REGION,
            service_account_email=SA,
            zones=ZONES,
            status_bucket="bucket-x",
            status_prefix="prefix-y",
        )

    def test_monitoring_manager_constructed_with_correct_params(self) -> None:
        with (
            patch(_PATCH_CONFIG_MGR) as MockConfigMgr,
            patch(_PATCH_LIFECYCLE_MGR) as MockLifecycleMgr,
            patch(_PATCH_MONITORING_MGR) as MockMonitoringMgr,
        ):
            cfg = MagicMock()
            cfg.get_zones_for_region.return_value = ZONES
            MockConfigMgr.return_value = cfg
            MockLifecycleMgr.return_value = MagicMock()
            MockMonitoringMgr.return_value = MagicMock()

            from deployment_service.backends.vm import VMBackend

            VMBackend(
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                status_bucket="bucket-x",
                status_prefix="prefix-y",
            )

        MockMonitoringMgr.assert_called_once_with(
            project_id=PROJECT,
            zones=ZONES,
            status_bucket="bucket-x",
            status_prefix="prefix-y",
        )


# ---------------------------------------------------------------------------
# deploy_shard delegation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendDeployShard:
    def test_delegates_to_lifecycle_manager(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        expected = JobInfo(job_id="vm-001", shard_id="s0", status=JobStatus.RUNNING)
        lifecycle.deploy_shard.return_value = expected

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            shard_id="s0",
            docker_image="gcr.io/p/img:v1",
            args=["--mode", "train"],
            environment_variables={"KEY": "val"},
            compute_config={"machine_type": "n2-standard-4"},
            labels={"env": "prod"},
        )

        assert result is expected
        lifecycle.deploy_shard.assert_called_once_with(
            shard_id="s0",
            docker_image="gcr.io/p/img:v1",
            args=["--mode", "train"],
            environment_variables={"KEY": "val"},
            compute_config={"machine_type": "n2-standard-4"},
            labels={"env": "prod"},
        )

    def test_returns_failed_job_info_from_lifecycle(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        failed = JobInfo(
            job_id="vm-fail",
            shard_id="s0",
            status=JobStatus.FAILED,
            error_message="quota exceeded",
        )
        lifecycle.deploy_shard.return_value = failed

        result = backend.deploy_shard(  # type: ignore[attr-defined]
            shard_id="s0",
            docker_image="img",
            args=[],
            environment_variables={},
            compute_config={},
            labels={},
        )

        assert result.status == JobStatus.FAILED
        assert result.error_message == "quota exceeded"


# ---------------------------------------------------------------------------
# get_status delegation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendGetStatus:
    def test_delegates_to_monitoring_manager(self) -> None:
        backend, _, lifecycle, monitoring = _make_vm_backend()
        job_ctx = MagicMock()
        lifecycle.job_context = job_ctx
        expected = JobInfo(job_id="vm-001", shard_id="s0", status=JobStatus.SUCCEEDED)
        monitoring.get_status.return_value = expected

        result = backend.get_status("vm-001")  # type: ignore[attr-defined]

        assert result is expected
        monitoring.get_status.assert_called_once_with("vm-001", job_ctx)

    def test_job_context_passed_from_lifecycle_to_monitoring(self) -> None:
        backend, _, lifecycle, monitoring = _make_vm_backend()
        specific_ctx: dict[str, object] = {"vm-001": ("dep-1", "s0", "us-central1-a")}
        lifecycle.job_context = specific_ctx
        monitoring.get_status.return_value = MagicMock()

        backend.get_status("vm-001")  # type: ignore[attr-defined]

        monitoring.get_status.assert_called_once_with("vm-001", specific_ctx)


# ---------------------------------------------------------------------------
# get_status_with_context delegation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendGetStatusWithContext:
    def test_delegates_with_full_context(self) -> None:
        backend, _, lifecycle, monitoring = _make_vm_backend()
        job_ctx = MagicMock()
        lifecycle.job_context = job_ctx
        expected = JobInfo(job_id="vm-001", shard_id="s0", status=JobStatus.SUCCEEDED)
        monitoring.get_status_with_context.return_value = expected

        result = backend.get_status_with_context(  # type: ignore[attr-defined]
            "vm-001",
            deployment_id="dep-42",
            shard_id="shard-0",
        )

        assert result is expected
        monitoring.get_status_with_context.assert_called_once_with(
            job_id="vm-001",
            job_context=job_ctx,
            deployment_id="dep-42",
            shard_id="shard-0",
        )

    def test_delegates_with_no_context(self) -> None:
        backend, _, lifecycle, monitoring = _make_vm_backend()
        lifecycle.job_context = {}
        monitoring.get_status_with_context.return_value = MagicMock()

        backend.get_status_with_context("vm-002")  # type: ignore[attr-defined]

        monitoring.get_status_with_context.assert_called_once_with(
            job_id="vm-002",
            job_context={},
            deployment_id=None,
            shard_id=None,
        )


# ---------------------------------------------------------------------------
# cancel_job delegation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendCancelJob:
    def test_delegates_to_lifecycle_manager(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        lifecycle.cancel_job.return_value = True

        result = backend.cancel_job("vm-001")  # type: ignore[attr-defined]

        assert result is True
        lifecycle.cancel_job.assert_called_once_with("vm-001", None)

    def test_delegates_with_zone(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        lifecycle.cancel_job.return_value = True

        backend.cancel_job("vm-001", zone="us-central1-b")  # type: ignore[attr-defined]

        lifecycle.cancel_job.assert_called_once_with("vm-001", "us-central1-b")

    def test_returns_false_when_lifecycle_returns_false(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        lifecycle.cancel_job.return_value = False

        result = backend.cancel_job("vm-999")  # type: ignore[attr-defined]

        assert result is False


# ---------------------------------------------------------------------------
# cancel_job_fire_and_forget delegation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendCancelJobFireAndForget:
    def test_delegates_to_lifecycle_manager(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()

        backend.cancel_job_fire_and_forget("vm-001")  # type: ignore[attr-defined]

        lifecycle.cancel_job_fire_and_forget.assert_called_once_with("vm-001", None)

    def test_delegates_with_zone(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()

        backend.cancel_job_fire_and_forget(  # type: ignore[attr-defined]
            "vm-001", zone="us-central1-c"
        )

        lifecycle.cancel_job_fire_and_forget.assert_called_once_with("vm-001", "us-central1-c")


# ---------------------------------------------------------------------------
# cleanup_zombie_vms delegation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendCleanupZombieVMs:
    def test_delegates_to_lifecycle_manager(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        lifecycle.cleanup_zombie_vms.return_value = {"vm-001": True, "vm-002": False}

        result = backend.cleanup_zombie_vms(  # type: ignore[attr-defined]
            deployment_id="dep-1",
            shard_ids=["vm-001", "vm-002"],
        )

        assert result == {"vm-001": True, "vm-002": False}
        lifecycle.cleanup_zombie_vms.assert_called_once_with("dep-1", ["vm-001", "vm-002"])


# ---------------------------------------------------------------------------
# get_logs_url delegation
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMBackendGetLogsUrl:
    def test_delegates_to_lifecycle_manager_no_zone(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        lifecycle.get_logs_url.return_value = "https://logs.example.com/vm-001"

        result = backend.get_logs_url("vm-001")  # type: ignore[attr-defined]

        assert result == "https://logs.example.com/vm-001"
        lifecycle.get_logs_url.assert_called_once_with("vm-001", None)

    def test_delegates_with_zone(self) -> None:
        backend, _, lifecycle, _ = _make_vm_backend()
        lifecycle.get_logs_url.return_value = "https://logs.example.com/vm-001"

        backend.get_logs_url("vm-001", zone="us-central1-a")  # type: ignore[attr-defined]

        lifecycle.get_logs_url.assert_called_once_with("vm-001", "us-central1-a")


# ---------------------------------------------------------------------------
# VMLifecycleManager.get_next_zone_round_robin
# (Import the real class; patch get_instances_client so no SDK calls happen)
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMLifecycleManagerZoneRotation:
    """Tests for round-robin zone selection in VMLifecycleManager."""

    def _make_lifecycle_manager(self) -> object:
        with (
            patch(
                "deployment_service.backends.services.vm_lifecycle.get_instances_client"
            ) as mock_get_client,
            patch(
                "deployment_service.backends.services.vm_lifecycle.VMConfigManager"
            ) as MockConfigMgr,
        ):
            mock_get_client.return_value = MagicMock()
            MockConfigMgr.return_value = MagicMock()

            from deployment_service.backends.services.vm_lifecycle import VMLifecycleManager

            mgr = VMLifecycleManager(
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                zones=ZONES,
                status_bucket=None,
            )
        return mgr

    def test_first_zone_returned_on_first_call(self) -> None:
        mgr = self._make_lifecycle_manager()
        assert mgr.get_next_zone_round_robin() == ZONES[0]  # type: ignore[attr-defined]

    def test_round_robin_cycles_through_all_zones(self) -> None:
        mgr = self._make_lifecycle_manager()
        results = [mgr.get_next_zone_round_robin() for _ in range(len(ZONES) * 2)]  # type: ignore[attr-defined]
        # First full cycle
        assert results[:3] == ZONES
        # Second full cycle (wraps around)
        assert results[3:6] == ZONES

    def test_index_increments_on_each_call(self) -> None:
        mgr = self._make_lifecycle_manager()
        mgr.get_next_zone_round_robin()  # type: ignore[attr-defined]
        assert mgr._zone_index == 1  # type: ignore[attr-defined]
        mgr.get_next_zone_round_robin()  # type: ignore[attr-defined]
        assert mgr._zone_index == 2  # type: ignore[attr-defined]

    def test_single_zone_always_returns_same(self) -> None:
        with (
            patch(
                "deployment_service.backends.services.vm_lifecycle.get_instances_client"
            ) as mock_get_client,
            patch(
                "deployment_service.backends.services.vm_lifecycle.VMConfigManager"
            ) as MockConfigMgr,
        ):
            mock_get_client.return_value = MagicMock()
            MockConfigMgr.return_value = MagicMock()

            from deployment_service.backends.services.vm_lifecycle import VMLifecycleManager

            mgr = VMLifecycleManager(
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                zones=["us-central1-a"],
                status_bucket=None,
            )

        for _ in range(5):
            assert mgr.get_next_zone_round_robin() == "us-central1-a"  # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# VMLifecycleManager.record_zone_exhaustion
# ---------------------------------------------------------------------------


@pytest.mark.unit
class TestVMLifecycleManagerZoneExhaustion:
    def _make_lifecycle_manager(self) -> object:
        with (
            patch(
                "deployment_service.backends.services.vm_lifecycle.get_instances_client"
            ) as mock_get_client,
            patch(
                "deployment_service.backends.services.vm_lifecycle.VMConfigManager"
            ) as MockConfigMgr,
        ):
            mock_get_client.return_value = MagicMock()
            MockConfigMgr.return_value = MagicMock()

            from deployment_service.backends.services.vm_lifecycle import VMLifecycleManager

            mgr = VMLifecycleManager(
                project_id=PROJECT,
                region=REGION,
                service_account_email=SA,
                zones=ZONES,
                status_bucket=None,
            )
        return mgr

    def test_initial_counts_are_empty(self) -> None:
        mgr = self._make_lifecycle_manager()
        assert mgr._zone_exhaustion_counts == {}  # type: ignore[attr-defined]

    def test_first_exhaustion_sets_count_to_one(self) -> None:
        mgr = self._make_lifecycle_manager()
        mgr.record_zone_exhaustion("us-central1-a")  # type: ignore[attr-defined]
        assert mgr._zone_exhaustion_counts["us-central1-a"] == 1  # type: ignore[attr-defined]

    def test_multiple_exhaustions_increment_count(self) -> None:
        mgr = self._make_lifecycle_manager()
        for _ in range(3):
            mgr.record_zone_exhaustion("us-central1-a")  # type: ignore[attr-defined]
        assert mgr._zone_exhaustion_counts["us-central1-a"] == 3  # type: ignore[attr-defined]

    def test_different_zones_tracked_independently(self) -> None:
        mgr = self._make_lifecycle_manager()
        mgr.record_zone_exhaustion("us-central1-a")  # type: ignore[attr-defined]
        mgr.record_zone_exhaustion("us-central1-a")  # type: ignore[attr-defined]
        mgr.record_zone_exhaustion("us-central1-b")  # type: ignore[attr-defined]
        assert mgr._zone_exhaustion_counts["us-central1-a"] == 2  # type: ignore[attr-defined]
        assert mgr._zone_exhaustion_counts["us-central1-b"] == 1  # type: ignore[attr-defined]
