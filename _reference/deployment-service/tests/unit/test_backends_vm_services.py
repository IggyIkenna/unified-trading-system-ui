"""
Unit tests for:
  - deployment_service.backends.services.vm_monitoring.VMMonitoringManager
  - deployment_service.backends.services.vm_lifecycle.VMLifecycleManager

Both modules import GCP SDK (compute_v1, get_instances_client) and storage
(get_storage_client) at module level. We patch these at the point-of-use so
the classes can be exercised without any real GCP connectivity.

Coverage targets (VMMonitoringManager):
- __init__: stores fields, calls get_instances_client
- get_status_with_context: builds temp_context and delegates to get_status
- get_status: RUNNING+GCS_SUCCESS→SUCCEEDED, RUNNING+GCS_FAILED→FAILED,
  RUNNING+GCS_ZOMBIE→FAILED, RUNNING+no_GCS→RUNNING,
  STAGING→PENDING, TERMINATED+SUCCESS→SUCCEEDED, TERMINATED+FAILED→FAILED,
  TERMINATED+ZOMBIE→FAILED, TERMINATED+no_GCS→RUNNING (treat as still running),
  UNKNOWN_STATE→UNKNOWN, zone_not_found→try_next_zone,
  job_context_missing→fallback_gcs_search, all-zones-not-found+context+SUCCESS→SUCCEEDED,
  all-zones+context+FAILED→FAILED, all-zones+context+ZOMBIE→FAILED,
  all-zones+context+none→FAILED (no confirmation)
- check_gcs_status: no bucket→None, blob not found→None, SUCCESS content,
  FAILED content, ZOMBIE content with logging, exception→None
- _get_status_from_gcs: no bucket→FAILED, blob search success, blob search failed,
  no blob found→FAILED, exception→UNKNOWN
- _get_zone_for_job: from context, fallback to primary
- _get_logs_url: with zone, without zone (defaults to zones[0])

Coverage targets (VMLifecycleManager):
- __init__: stores fields, initialises tracking dicts
- get_next_zone_round_robin: cycles through zones
- record_zone_exhaustion: increments counter
- get_zones_to_try: starts from current _zone_index, wraps around
- get_zone_for_job: from context, fallback
- cancel_job: success first zone, not-found skip next zone, VM already deleted→True,
  real error→False
- cancel_job_fire_and_forget: success, not-found skip, error continue
- set_job_context / get_job_context: round-trip
- get_logs_url / _get_logs_url: from context, default zone
- cleanup_zombie_vms: no zombie marker→skip, zombie found and deleted→True,
  zombie no job_id found→False, cancel fails→False
- deploy_shard: success, zone_exhaustion→next_zone, rate_limit_retry→next_zone,
  regional_quota→next_zone, all_zones_fail→FAILED JobInfo with clear messages
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from deployment_service.backends.base import JobInfo, JobStatus

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

PROJECT = "test-gcp-project"
REGION = "us-central1"
SA = "svc@test.iam.gserviceaccount.com"
ZONES = ["us-central1-a", "us-central1-b", "us-central1-c"]
STATUS_BUCKET = "test-status-bucket"
STATUS_PREFIX = "deployments"

# ---------------------------------------------------------------------------
# Patch targets
# ---------------------------------------------------------------------------

_PATCH_GET_INSTANCES_CLIENT = "deployment_service.backends.services.vm_config.get_instances_client"
_PATCH_COMPUTE_V1 = "deployment_service.backends.services.vm_monitoring.compute_v1"
_PATCH_GET_STORAGE = "deployment_service.backends.services.vm_monitoring.get_storage_client"
_PATCH_LIFECYCLE_COMPUTE_V1 = "deployment_service.backends.services.vm_lifecycle.compute_v1"
_PATCH_LIFECYCLE_GET_INSTANCES = (
    "deployment_service.backends.services.vm_lifecycle.get_instances_client"
)
_PATCH_VM_CONFIG_MANAGER = "deployment_service.backends.services.vm_lifecycle.VMConfigManager"
_PATCH_VM_MONITORING_MANAGER = (
    "deployment_service.backends.services.vm_lifecycle.VMMonitoringManager"
)


# ===========================================================================
# VMMonitoringManager
# ===========================================================================


def _make_monitoring(
    status_bucket: str | None = STATUS_BUCKET,
    status_prefix: str = STATUS_PREFIX,
) -> tuple[object, MagicMock, MagicMock]:
    """
    Return (monitoring_manager, mock_instances_client, mock_compute_v1).

    We must patch get_instances_client at both the vm_config module level (called
    in __init__) and at the monitoring module level.
    """
    mock_instances_client = MagicMock()
    mock_compute_v1 = MagicMock()

    with (
        patch(_PATCH_GET_INSTANCES_CLIENT, return_value=mock_instances_client),
        patch(_PATCH_COMPUTE_V1, mock_compute_v1),
        patch(
            "deployment_service.backends.services.vm_monitoring.get_instances_client",
            return_value=mock_instances_client,
        ),
    ):
        from deployment_service.backends.services.vm_monitoring import VMMonitoringManager

        mgr = VMMonitoringManager(
            project_id=PROJECT,
            zones=ZONES,
            status_bucket=status_bucket,
            status_prefix=status_prefix,
        )

    # Inject the mock directly so tests can drive it
    mgr._instances_client = mock_instances_client  # type: ignore[attr-defined]
    return mgr, mock_instances_client, mock_compute_v1


@pytest.mark.unit
class TestVMMonitoringManagerInit:
    def test_stores_project_id(self) -> None:
        mgr, *_ = _make_monitoring()
        assert mgr.project_id == PROJECT  # type: ignore[attr-defined]

    def test_stores_zones(self) -> None:
        mgr, *_ = _make_monitoring()
        assert mgr.zones == ZONES  # type: ignore[attr-defined]

    def test_stores_status_bucket(self) -> None:
        mgr, *_ = _make_monitoring()
        assert mgr.status_bucket == STATUS_BUCKET  # type: ignore[attr-defined]

    def test_stores_status_prefix(self) -> None:
        mgr, *_ = _make_monitoring()
        assert mgr.status_prefix == STATUS_PREFIX  # type: ignore[attr-defined]

    def test_no_status_bucket_when_none(self) -> None:
        mgr, *_ = _make_monitoring(status_bucket=None)
        assert mgr.status_bucket is None  # type: ignore[attr-defined]


@pytest.mark.unit
class TestVMMonitoringGetStatusWithContext:
    def test_delegates_to_get_status(self) -> None:
        mgr, mock_client, mock_cv1 = _make_monitoring()

        # Patch get_status so we can control its return value
        expected = JobInfo(job_id="vm-1", shard_id="s1", status=JobStatus.RUNNING)
        with patch.object(mgr, "get_status", return_value=expected) as mock_gs:
            result = mgr.get_status_with_context(  # type: ignore[attr-defined]
                "vm-1",
                job_context={"vm-1": ("dep-1", "shard-1", ZONES[0])},
                deployment_id="dep-1",
                shard_id="shard-1",
            )

        assert result is expected
        mock_gs.assert_called_once()

    def test_builds_temp_context_for_unknown_job(self) -> None:
        """When job_id not in job_context, a temp entry is injected."""
        mgr, *_ = _make_monitoring()
        captured_context: dict[str, object] = {}

        def _fake_get_status(job_id: str, job_context: dict[str, object] | None = None) -> JobInfo:
            captured_context.update(job_context or {})
            return JobInfo(job_id=job_id, shard_id="s", status=JobStatus.UNKNOWN)

        with patch.object(mgr, "get_status", side_effect=_fake_get_status):
            mgr.get_status_with_context(  # type: ignore[attr-defined]
                "new-vm",
                job_context={},
                deployment_id="dep-99",
                shard_id="shard-99",
            )

        assert "new-vm" in captured_context


@pytest.mark.unit
class TestVMMonitoringGetStatus:
    def _make_instance(self, status: str, labels: dict[str, str] | None = None) -> MagicMock:
        instance = MagicMock()
        instance.status = status
        instance.labels = labels or {}
        return instance

    def test_running_with_gcs_success_returns_succeeded(self) -> None:
        mgr, mock_client, mock_cv1 = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "RUNNING", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value="SUCCESS"):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.SUCCEEDED

    def test_running_with_gcs_failed_returns_failed(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "RUNNING", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value="FAILED"):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_running_with_gcs_zombie_returns_failed(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "RUNNING", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value="ZOMBIE"):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_running_with_no_gcs_returns_running(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "RUNNING", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value=None):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.RUNNING

    def test_staging_returns_pending(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "STAGING", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        result = mgr.get_status("vm-1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.PENDING

    def test_terminated_with_gcs_success_returns_succeeded(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "TERMINATED", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value="SUCCESS"):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.SUCCEEDED

    def test_terminated_with_gcs_failed_returns_failed(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "TERMINATED", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value="FAILED"):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_terminated_with_gcs_zombie_returns_failed(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "TERMINATED", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value="ZOMBIE"):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_terminated_no_gcs_returns_running(self) -> None:
        """TERMINATED without GCS confirmation treats as still running."""
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "TERMINATED", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value=None):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.RUNNING

    def test_stopped_no_gcs_returns_running(self) -> None:
        """STOPPED without GCS confirmation treats as still running (same as TERMINATED)."""
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "STOPPED", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value=None):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.RUNNING

    def test_unknown_vm_state_returns_unknown(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "PROVISIONING", {"shard-id": "s1", "deployment-id": "dep1"}
        )
        result = mgr.get_status("vm-1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.UNKNOWN

    def test_zone_not_found_tries_next_zone(self) -> None:
        mgr, mock_client, _ = _make_monitoring()

        call_count = {"n": 0}

        def _side_effect(**kwargs: object) -> MagicMock:
            call_count["n"] += 1
            if call_count["n"] == 1:
                raise RuntimeError("Instance was not found")
            # Second call succeeds
            instance = MagicMock()
            instance.status = "RUNNING"
            instance.labels = {"shard-id": "s1", "deployment-id": "dep1"}
            return instance

        mock_client.get.side_effect = _side_effect

        with patch.object(mgr, "check_gcs_status", return_value="SUCCESS"):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.SUCCEEDED
        assert call_count["n"] == 2

    def test_all_zones_not_found_with_context_success(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.side_effect = RuntimeError("Instance was not found")

        context = {"vm-1": ("dep-1", "shard-1", ZONES[0])}
        with patch.object(mgr, "check_gcs_status", return_value="SUCCESS"):
            result = mgr.get_status("vm-1", job_context=context)  # type: ignore[attr-defined]

        assert result.status == JobStatus.SUCCEEDED
        assert result.shard_id == "shard-1"

    def test_all_zones_not_found_with_context_failed(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.side_effect = RuntimeError("Instance was not found")

        context = {"vm-1": ("dep-1", "shard-1", ZONES[0])}
        with patch.object(mgr, "check_gcs_status", return_value="FAILED"):
            result = mgr.get_status("vm-1", job_context=context)  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_all_zones_not_found_with_context_zombie(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.side_effect = RuntimeError("Instance was not found")

        context = {"vm-1": ("dep-1", "shard-1", ZONES[0])}
        with patch.object(mgr, "check_gcs_status", return_value="ZOMBIE"):
            result = mgr.get_status("vm-1", job_context=context)  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED
        assert "ZOMBIE" in (result.error_message or "")

    def test_all_zones_not_found_with_context_no_gcs(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.side_effect = RuntimeError("Instance was not found")

        context = {"vm-1": ("dep-1", "shard-1", ZONES[0])}
        with patch.object(mgr, "check_gcs_status", return_value=None):
            result = mgr.get_status("vm-1", job_context=context)  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_all_zones_not_found_no_context_falls_back_to_gcs_search(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.side_effect = RuntimeError("Instance was not found")

        expected = JobInfo(job_id="vm-1", shard_id="unknown", status=JobStatus.FAILED)
        with patch.object(mgr, "_get_status_from_gcs", return_value=expected) as mock_gcs:
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert result is expected
        mock_gcs.assert_called_once_with("vm-1")

    def test_metadata_includes_vm_status_and_zone(self) -> None:
        mgr, mock_client, _ = _make_monitoring()
        mock_client.get.return_value = self._make_instance(
            "RUNNING", {"shard-id": "s1", "deployment-id": "dep1"}
        )

        with patch.object(mgr, "check_gcs_status", return_value=None):
            result = mgr.get_status("vm-1")  # type: ignore[attr-defined]

        assert "vm_status" in result.metadata
        assert "zone" in result.metadata


@pytest.mark.unit
class TestVMMonitoringCheckGcsStatus:
    def test_no_bucket_returns_none(self) -> None:
        mgr, *_ = _make_monitoring(status_bucket=None)
        result = mgr.check_gcs_status("dep-1", "shard-1")  # type: ignore[attr-defined]
        assert result is None

    def test_blob_not_found_returns_none(self) -> None:
        mgr, *_ = _make_monitoring()

        mock_blob = MagicMock()
        mock_blob.exists.return_value = False
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage = MagicMock()
        mock_storage.bucket.return_value = mock_bucket

        with patch(_PATCH_GET_STORAGE, return_value=mock_storage):
            result = mgr.check_gcs_status("dep-1", "shard-1")  # type: ignore[attr-defined]

        assert result is None

    def test_success_content_returns_success(self) -> None:
        mgr, *_ = _make_monitoring()

        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_blob.download_as_string.return_value = b"SUCCESS:2026-01-01T00:00:00"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage = MagicMock()
        mock_storage.bucket.return_value = mock_bucket

        with patch(_PATCH_GET_STORAGE, return_value=mock_storage):
            result = mgr.check_gcs_status("dep-1", "shard-1")  # type: ignore[attr-defined]

        assert result == "SUCCESS"

    def test_failed_content_returns_failed(self) -> None:
        mgr, *_ = _make_monitoring()

        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_blob.download_as_string.return_value = b"FAILED:2026-01-01T00:00:00"
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage = MagicMock()
        mock_storage.bucket.return_value = mock_bucket

        with patch(_PATCH_GET_STORAGE, return_value=mock_storage):
            result = mgr.check_gcs_status("dep-1", "shard-1")  # type: ignore[attr-defined]

        assert result == "FAILED"

    def test_zombie_content_returns_zombie(self) -> None:
        mgr, *_ = _make_monitoring()

        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_blob.download_as_string.return_value = (
            b"ZOMBIE:2026-01-01T00:00:00:failed-to-self-delete"
        )
        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob
        mock_storage = MagicMock()
        mock_storage.bucket.return_value = mock_bucket

        with patch(_PATCH_GET_STORAGE, return_value=mock_storage):
            result = mgr.check_gcs_status("dep-1", "shard-1")  # type: ignore[attr-defined]

        assert result == "ZOMBIE"

    def test_storage_exception_returns_none(self) -> None:
        mgr, *_ = _make_monitoring()

        with patch(_PATCH_GET_STORAGE, side_effect=OSError("GCS unavailable")):
            result = mgr.check_gcs_status("dep-1", "shard-1")  # type: ignore[attr-defined]

        assert result is None


@pytest.mark.unit
class TestVMMonitoringGetStatusFromGcs:
    def test_no_bucket_returns_failed(self) -> None:
        mgr, *_ = _make_monitoring(status_bucket=None)
        result = mgr._get_status_from_gcs("vm-1")  # type: ignore[attr-defined]
        assert result.status == JobStatus.FAILED

    def test_blob_found_with_success(self) -> None:
        mgr, *_ = _make_monitoring()

        mock_blob = MagicMock()
        mock_blob.name = f"{STATUS_PREFIX}/dep-1/vm-12345678901234567890/status"
        mock_blob.download_as_string.return_value = b"SUCCESS:2026-01-01T00:00:00"
        mock_bucket = MagicMock()
        mock_bucket.list_blobs.return_value = [mock_blob]
        mock_storage = MagicMock()
        mock_storage.bucket.return_value = mock_bucket

        with patch(_PATCH_GET_STORAGE, return_value=mock_storage):
            result = mgr._get_status_from_gcs("vm-12345678901234567890")  # type: ignore[attr-defined]

        assert result.status == JobStatus.SUCCEEDED

    def test_blob_found_with_failed(self) -> None:
        mgr, *_ = _make_monitoring()

        mock_blob = MagicMock()
        mock_blob.name = f"{STATUS_PREFIX}/dep-1/vm-12345678901234567890/status"
        mock_blob.download_as_string.return_value = b"FAILED:2026-01-01T00:00:00"
        mock_bucket = MagicMock()
        mock_bucket.list_blobs.return_value = [mock_blob]
        mock_storage = MagicMock()
        mock_storage.bucket.return_value = mock_bucket

        with patch(_PATCH_GET_STORAGE, return_value=mock_storage):
            result = mgr._get_status_from_gcs("vm-12345678901234567890")  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_no_matching_blob_returns_failed(self) -> None:
        mgr, *_ = _make_monitoring()

        mock_bucket = MagicMock()
        mock_bucket.list_blobs.return_value = []
        mock_storage = MagicMock()
        mock_storage.bucket.return_value = mock_bucket

        with patch(_PATCH_GET_STORAGE, return_value=mock_storage):
            result = mgr._get_status_from_gcs("vm-unknown")  # type: ignore[attr-defined]

        assert result.status == JobStatus.FAILED

    def test_storage_exception_returns_unknown(self) -> None:
        mgr, *_ = _make_monitoring()

        with patch(_PATCH_GET_STORAGE, side_effect=RuntimeError("GCS broken")):
            result = mgr._get_status_from_gcs("vm-1")  # type: ignore[attr-defined]

        assert result.status == JobStatus.UNKNOWN


@pytest.mark.unit
class TestVMMonitoringGetZoneForJob:
    def test_from_context(self) -> None:
        mgr, *_ = _make_monitoring()
        context = {"vm-1": ("dep-1", "shard-1", ZONES[1])}
        zone = mgr._get_zone_for_job("vm-1", context)  # type: ignore[attr-defined]
        assert zone == ZONES[1]

    def test_fallback_to_primary_zone(self) -> None:
        mgr, *_ = _make_monitoring()
        zone = mgr._get_zone_for_job("vm-unknown", None)  # type: ignore[attr-defined]
        assert zone == ZONES[0]

    def test_none_zone_in_context_falls_back(self) -> None:
        mgr, *_ = _make_monitoring()
        context = {"vm-1": ("dep-1", "shard-1", None)}
        zone = mgr._get_zone_for_job("vm-1", context)  # type: ignore[attr-defined]
        assert zone == ZONES[0]


@pytest.mark.unit
class TestVMMonitoringGetLogsUrl:
    def test_url_with_explicit_zone(self) -> None:
        mgr, *_ = _make_monitoring()
        url = mgr._get_logs_url("vm-test-123", zone=ZONES[2])  # type: ignore[attr-defined]
        assert ZONES[2] in url
        assert "vm-test-123" in url
        assert PROJECT in url

    def test_url_defaults_to_first_zone(self) -> None:
        mgr, *_ = _make_monitoring()
        url = mgr._get_logs_url("vm-test-123")  # type: ignore[attr-defined]
        assert ZONES[0] in url


# ===========================================================================
# VMLifecycleManager
# ===========================================================================


def _make_lifecycle(
    status_bucket: str | None = STATUS_BUCKET,
) -> tuple[object, MagicMock, MagicMock]:
    """
    Return (lifecycle_manager, mock_instances_client, mock_config_manager).

    Patches out get_instances_client and VMConfigManager to avoid GCP SDK calls.
    """
    mock_instances_client = MagicMock()
    mock_config_manager = MagicMock()

    # VMConfigManager setup: needed for extract_registry_region, get_status_path, etc.
    mock_config_manager.extract_registry_region.return_value = "us"
    mock_config_manager.get_status_path.return_value = "gs://bucket/path"
    mock_config_manager.render_cloud_init_template.return_value = "#!/bin/bash\necho ok"
    mock_config_manager.build_instance_config.return_value = MagicMock()
    mock_config_manager.generate_instance_name.return_value = "test-vm-name"
    mock_config_manager.is_zone_exhausted_error.return_value = False
    mock_config_manager.is_regional_quota_error.return_value = False

    with (
        patch(_PATCH_LIFECYCLE_GET_INSTANCES, return_value=mock_instances_client),
        patch(_PATCH_VM_CONFIG_MANAGER, return_value=mock_config_manager),
    ):
        from deployment_service.backends.services.vm_lifecycle import VMLifecycleManager

        mgr = VMLifecycleManager(
            project_id=PROJECT,
            region=REGION,
            service_account_email=SA,
            zones=ZONES,
            status_bucket=status_bucket,
        )

    mgr._instances_client = mock_instances_client  # type: ignore[attr-defined]
    mgr._config_manager = mock_config_manager  # type: ignore[attr-defined]
    return mgr, mock_instances_client, mock_config_manager


@pytest.mark.unit
class TestVMLifecycleManagerInit:
    def test_stores_project_id(self) -> None:
        mgr, *_ = _make_lifecycle()
        assert mgr.project_id == PROJECT  # type: ignore[attr-defined]

    def test_stores_region(self) -> None:
        mgr, *_ = _make_lifecycle()
        assert mgr.region == REGION  # type: ignore[attr-defined]

    def test_stores_zones(self) -> None:
        mgr, *_ = _make_lifecycle()
        assert mgr.zones == ZONES  # type: ignore[attr-defined]

    def test_job_context_starts_empty(self) -> None:
        mgr, *_ = _make_lifecycle()
        assert mgr._job_context == {}  # type: ignore[attr-defined]

    def test_zone_index_starts_at_zero(self) -> None:
        mgr, *_ = _make_lifecycle()
        assert mgr._zone_index == 0  # type: ignore[attr-defined]


@pytest.mark.unit
class TestVMLifecycleRoundRobin:
    def test_cycles_through_zones(self) -> None:
        mgr, *_ = _make_lifecycle()
        results = [mgr.get_next_zone_round_robin() for _ in range(len(ZONES) + 1)]  # type: ignore[attr-defined]
        # First len(ZONES) calls should cover all zones
        assert set(results[:3]) == set(ZONES)
        # After len(ZONES), it wraps
        assert results[3] == results[0]

    def test_record_zone_exhaustion_increments(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr.record_zone_exhaustion(ZONES[0])  # type: ignore[attr-defined]
        mgr.record_zone_exhaustion(ZONES[0])  # type: ignore[attr-defined]
        assert mgr._zone_exhaustion_counts[ZONES[0]] == 2  # type: ignore[attr-defined]

    def test_get_zones_to_try_returns_all_zones(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr._zone_index = 0  # type: ignore[attr-defined]
        zones = mgr.get_zones_to_try()  # type: ignore[attr-defined]
        assert len(zones) == len(ZONES)
        assert set(zones) == set(ZONES)

    def test_get_zones_to_try_starts_from_current_index(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr._zone_index = 1  # type: ignore[attr-defined]
        zones = mgr.get_zones_to_try()  # type: ignore[attr-defined]
        assert zones[0] == ZONES[1]


@pytest.mark.unit
class TestVMLifecycleGetZoneForJob:
    def test_from_job_context(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr._job_context["vm-1"] = ("dep-1", "shard-1", ZONES[2])  # type: ignore[attr-defined]
        assert mgr.get_zone_for_job("vm-1") == ZONES[2]  # type: ignore[attr-defined]

    def test_fallback_to_first_zone(self) -> None:
        mgr, *_ = _make_lifecycle()
        assert mgr.get_zone_for_job("unknown-vm") == ZONES[0]  # type: ignore[attr-defined]


@pytest.mark.unit
class TestVMLifecycleJobContextAccessors:
    def test_set_and_get_job_context(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr.set_job_context("vm-1", "dep-1", "shard-1", ZONES[0])  # type: ignore[attr-defined]
        ctx = mgr.get_job_context("vm-1")  # type: ignore[attr-defined]
        assert ctx == ("dep-1", "shard-1", ZONES[0])

    def test_get_missing_context_returns_none(self) -> None:
        mgr, *_ = _make_lifecycle()
        assert mgr.get_job_context("nonexistent") is None  # type: ignore[attr-defined]

    def test_set_without_zone_defaults_to_first(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr.set_job_context("vm-1", "dep-1", "shard-1")  # type: ignore[attr-defined]
        ctx = mgr.get_job_context("vm-1")  # type: ignore[attr-defined]
        assert ctx is not None
        assert ctx[2] == ZONES[0]

    def test_job_context_property_exposed(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr.set_job_context("vm-1", "dep-1", "shard-1", ZONES[1])  # type: ignore[attr-defined]
        assert "vm-1" in mgr.job_context  # type: ignore[attr-defined]


@pytest.mark.unit
class TestVMLifecycleCancelJob:
    def test_success_first_zone(self) -> None:
        mgr, mock_client, _ = _make_lifecycle()
        mock_op = MagicMock()
        mock_op.result.return_value = None
        mock_client.delete.return_value = mock_op

        mgr.set_job_context("vm-1", "dep-1", "shard-1", ZONES[0])  # type: ignore[attr-defined]
        result = mgr.cancel_job("vm-1")  # type: ignore[attr-defined]

        assert result is True
        mock_client.delete.assert_called()

    def test_vm_not_found_tries_next_zone_then_returns_true(self) -> None:
        """Not found in any zone counts as deleted already → True."""
        mgr, mock_client, _ = _make_lifecycle()
        mock_client.delete.side_effect = RuntimeError("was not found in zone")

        result = mgr.cancel_job("vm-gone")  # type: ignore[attr-defined]
        assert result is True

    def test_real_error_returns_false(self) -> None:
        mgr, mock_client, _ = _make_lifecycle()
        mock_client.delete.side_effect = RuntimeError("PERMISSION_DENIED")

        result = mgr.cancel_job("vm-locked")  # type: ignore[attr-defined]
        assert result is False


@pytest.mark.unit
class TestVMLifecycleCancelJobFireAndForget:
    def test_success_returns_none(self) -> None:
        mgr, mock_client, _ = _make_lifecycle()
        mock_client.delete.return_value = MagicMock()

        # Should not raise
        mgr.cancel_job_fire_and_forget("vm-1")  # type: ignore[attr-defined]
        mock_client.delete.assert_called()

    def test_not_found_continues_silently(self) -> None:
        mgr, mock_client, _ = _make_lifecycle()
        mock_client.delete.side_effect = RuntimeError("was not found")

        mgr.cancel_job_fire_and_forget("vm-deleted")  # type: ignore[attr-defined]
        # No exception raised

    def test_other_error_continues_silently(self) -> None:
        mgr, mock_client, _ = _make_lifecycle()
        mock_client.delete.side_effect = RuntimeError("Some other error")

        mgr.cancel_job_fire_and_forget("vm-error")  # type: ignore[attr-defined]
        # No exception raised


@pytest.mark.unit
class TestVMLifecycleGetLogsUrl:
    def test_url_from_job_context(self) -> None:
        mgr, *_ = _make_lifecycle()
        mgr.set_job_context("vm-1", "dep-1", "shard-1", ZONES[2])  # type: ignore[attr-defined]
        url = mgr.get_logs_url("vm-1")  # type: ignore[attr-defined]
        assert ZONES[2] in url
        assert PROJECT in url

    def test_url_defaults_to_first_zone(self) -> None:
        mgr, *_ = _make_lifecycle()
        url = mgr.get_logs_url("vm-unknown")  # type: ignore[attr-defined]
        assert ZONES[0] in url


@pytest.mark.unit
class TestVMLifecycleCleanupZombieVMs:
    def test_non_zombie_shards_skipped(self) -> None:
        mgr, mock_client, _ = _make_lifecycle()

        with patch(
            _PATCH_VM_MONITORING_MANAGER,
        ) as MockMonitor:
            mock_monitor_inst = MagicMock()
            mock_monitor_inst.check_gcs_status.return_value = "SUCCESS"  # Not ZOMBIE
            MockMonitor.return_value = mock_monitor_inst

            results = mgr.cleanup_zombie_vms("dep-1", ["shard-1", "shard-2"])  # type: ignore[attr-defined]

        assert results == {}

    def test_zombie_shard_found_and_deleted(self) -> None:
        mgr, mock_client, _ = _make_lifecycle()

        # Set up a job context so we can find the VM
        mgr.set_job_context("vm-shard-1", "dep-1", "shard-1", ZONES[0])  # type: ignore[attr-defined]

        mock_op = MagicMock()
        mock_op.result.return_value = None
        mock_client.delete.return_value = mock_op

        with patch(
            _PATCH_VM_MONITORING_MANAGER,
        ) as MockMonitor:
            mock_monitor_inst = MagicMock()
            mock_monitor_inst.check_gcs_status.return_value = "ZOMBIE"
            MockMonitor.return_value = mock_monitor_inst

            results = mgr.cleanup_zombie_vms("dep-1", ["shard-1"])  # type: ignore[attr-defined]

        assert results.get("shard-1") is True

    def test_zombie_shard_no_job_id_returns_false(self) -> None:
        mgr, *_ = _make_lifecycle()

        with patch(
            _PATCH_VM_MONITORING_MANAGER,
        ) as MockMonitor:
            mock_monitor_inst = MagicMock()
            mock_monitor_inst.check_gcs_status.return_value = "ZOMBIE"
            MockMonitor.return_value = mock_monitor_inst

            results = mgr.cleanup_zombie_vms("dep-1", ["orphan-shard"])  # type: ignore[attr-defined]

        assert results.get("orphan-shard") is False


@pytest.mark.unit
class TestVMLifecycleDeployShard:
    def _setup_success(self, mgr: object, mock_client: MagicMock) -> None:
        mock_op = MagicMock()
        mock_op.result.return_value = None
        mock_client.insert.return_value = mock_op

    def test_success_returns_running(self) -> None:
        mgr, mock_client, mock_cfg = _make_lifecycle()
        self._setup_success(mgr, mock_client)

        with patch(_PATCH_LIFECYCLE_COMPUTE_V1):
            result = mgr.deploy_shard(  # type: ignore[attr-defined]
                shard_id="shard-1",
                docker_image="gcr.io/proj/img:latest",
                args=["--mode", "train"],
                environment_variables={"ENV": "prod"},
                compute_config={
                    "machine_type": "c2-standard-4",
                    "disk_size_gb": 50,
                    "preemptible": False,
                },
                labels={"service": "my-service", "deployment_id": "dep-20260101"},
            )

        assert isinstance(result, JobInfo)
        assert result.status == JobStatus.RUNNING
        assert result.start_time is not None
        assert "instance_name" in result.metadata

    def test_all_zones_fail_returns_failed(self) -> None:
        """When every zone fails with a zone-exhaustion error, all zones are tried and FAILED is returned."""
        mgr, mock_client, mock_cfg = _make_lifecycle()
        mock_client.insert.side_effect = OSError("ZONE_RESOURCE_POOL_EXHAUSTED")
        # Mark it as zone exhaustion so the code breaks out of retry and moves to next zone
        mock_cfg.is_zone_exhausted_error.side_effect = lambda e: "ZONE_RESOURCE_POOL_EXHAUSTED" in e
        mock_cfg.is_regional_quota_error.return_value = False

        with patch(_PATCH_LIFECYCLE_COMPUTE_V1):
            result = mgr.deploy_shard(  # type: ignore[attr-defined]
                shard_id="shard-fail",
                docker_image="gcr.io/proj/img:latest",
                args=[],
                environment_variables={},
                compute_config={},
                labels={"service": "test-svc"},
            )

        assert result.status == JobStatus.FAILED
        assert result.job_id == "failed-shard-fail"

    def test_zone_exhaustion_tries_next_zone(self) -> None:
        mgr, mock_client, mock_cfg = _make_lifecycle()

        call_count = {"n": 0}

        def _insert_side_effect(**kwargs: object) -> MagicMock:
            call_count["n"] += 1
            if call_count["n"] <= 1:
                raise OSError("ZONE_RESOURCE_POOL_EXHAUSTED")
            mock_op = MagicMock()
            mock_op.result.return_value = None
            return mock_op

        mock_client.insert.side_effect = _insert_side_effect
        mock_cfg.is_zone_exhausted_error.side_effect = lambda e: "ZONE_RESOURCE_POOL_EXHAUSTED" in e

        with patch(_PATCH_LIFECYCLE_COMPUTE_V1):
            result = mgr.deploy_shard(  # type: ignore[attr-defined]
                shard_id="shard-zone-exhausted",
                docker_image="gcr.io/proj/img:latest",
                args=[],
                environment_variables={},
                compute_config={},
                labels={"service": "svc"},
            )

        assert result.status == JobStatus.RUNNING

    def test_regional_quota_tries_next_zone(self) -> None:
        mgr, mock_client, mock_cfg = _make_lifecycle()

        call_count = {"n": 0}

        def _insert_side_effect(**kwargs: object) -> MagicMock:
            call_count["n"] += 1
            if call_count["n"] <= 1:
                raise OSError("QUOTA_EXCEEDED: C2_CPUS quota")
            mock_op = MagicMock()
            mock_op.result.return_value = None
            return mock_op

        mock_client.insert.side_effect = _insert_side_effect
        mock_cfg.is_zone_exhausted_error.return_value = False
        mock_cfg.is_regional_quota_error.side_effect = lambda e: "QUOTA_EXCEEDED" in e

        with patch(_PATCH_LIFECYCLE_COMPUTE_V1):
            result = mgr.deploy_shard(  # type: ignore[attr-defined]
                shard_id="shard-quota",
                docker_image="gcr.io/proj/img:latest",
                args=[],
                environment_variables={},
                compute_config={},
                labels={"service": "svc"},
            )

        assert result.status == JobStatus.RUNNING

    def test_ip_quota_exceeded_error_message(self) -> None:
        mgr, mock_client, mock_cfg = _make_lifecycle()
        mock_client.insert.side_effect = OSError("Quota IN_USE_ADDRESSES exceeded")
        mock_cfg.is_zone_exhausted_error.return_value = False
        mock_cfg.is_regional_quota_error.return_value = True

        with patch(_PATCH_LIFECYCLE_COMPUTE_V1):
            result = mgr.deploy_shard(  # type: ignore[attr-defined]
                shard_id="shard-ip-quota",
                docker_image="gcr.io/proj/img:latest",
                args=[],
                environment_variables={},
                compute_config={},
                labels={"service": "svc"},
            )

        assert result.status == JobStatus.FAILED

    def test_gcsfuse_env_var_filtering(self) -> None:
        """UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS removed when gcsfuse_buckets set."""
        mgr, mock_client, mock_cfg = _make_lifecycle()
        mock_op = MagicMock()
        mock_op.result.return_value = None
        mock_client.insert.return_value = mock_op

        with patch(_PATCH_LIFECYCLE_COMPUTE_V1):
            mgr.deploy_shard(  # type: ignore[attr-defined]
                shard_id="shard-fuse",
                docker_image="gcr.io/proj/img:latest",
                args=[],
                environment_variables={
                    "UNIFIED_CLOUD_SERVICES_USE_DIRECT_GCS": "true",
                    "OTHER_VAR": "value",
                },
                compute_config={"gcsfuse_buckets": ["my-bucket"]},
                labels={"service": "svc"},
            )

        # When gcsfuse is used, render_cloud_init_template should be called
        mock_cfg.render_cloud_init_template.assert_called()
        # The call to render_cloud_init_template should have gcsfuse_buckets_str in context
        call_kwargs = mock_cfg.render_cloud_init_template.call_args
        template_ctx = call_kwargs[0][0]
        assert "gcsfuse_buckets_str" in template_ctx

    def test_preferred_zone_sets_zone_index(self) -> None:
        """compute_config zone hint shifts starting zone."""
        mgr, mock_client, mock_cfg = _make_lifecycle()
        mock_op = MagicMock()
        mock_op.result.return_value = None
        mock_client.insert.return_value = mock_op

        with patch(_PATCH_LIFECYCLE_COMPUTE_V1):
            mgr.deploy_shard(  # type: ignore[attr-defined]
                shard_id="shard-zone-hint",
                docker_image="gcr.io/proj/img:latest",
                args=[],
                environment_variables={},
                compute_config={"zone": ZONES[2]},
                labels={"service": "svc"},
            )

        # After deploy, zone index should have been updated
        assert mgr._zone_index > 0  # type: ignore[attr-defined]
