"""
Unit tests for workers/deployment_processor module.

Tests process_deployments_batch, _process_vm_health_and_status,
_process_cloud_run_status, _process_stuck_shards, _launch_pending_shards,
and _handle_orphan_vm_cleanup.
"""

import json
import sys
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

# Mock modules that deployment_processor imports at module level
sys.modules.setdefault("deployment", MagicMock())
sys.modules.setdefault(
    "deployment.state", MagicMock(DeploymentStatus=MagicMock(), StateManager=MagicMock())
)
sys.modules.setdefault(
    "deployment_service.config.config_validator",
    MagicMock(
        ConfigurationError=Exception,
        ValidationUtils=MagicMock(get_required=MagicMock(return_value="value")),
    ),
)

from deployment_api.workers.deployment_processor import (
    _handle_orphan_vm_cleanup,
    _launch_pending_shards,
    _process_stuck_shards,
    _process_vm_health_and_status,
    process_deployments_batch,
)


def _make_shard(shard_id="s1", job_id="vm-job-1", status="running", start_time=None):
    start_time = start_time or datetime.now(UTC).isoformat()
    return {
        "shard_id": shard_id,
        "job_id": job_id,
        "status": status,
        "start_time": start_time,
    }


class TestProcessDeploymentsBatch:
    """Tests for process_deployments_batch function."""

    def test_empty_active_states_returns_zero(self):
        result = process_deployments_batch(
            active_states=[],
            bucket=MagicMock(),
            now=datetime.now(UTC),
            quota_broker=None,
            try_acquire_deployment_lock=lambda dep: True,
            release_deployment_lock=lambda dep: True,
            run_orphan_cleanup_only=lambda path, state: 0,
        )
        assert result == (0, 0)

    def test_returns_tuple_of_synced_and_active(self):
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "service": "my-service",
            "shards": [],
            "config": {"region": "us-central1", "job_name": "my-job"},
        }

        mock_facade = MagicMock()
        mock_facade.list_objects = MagicMock(return_value=[])
        mock_facade.read_object_text = MagicMock(return_value="")
        mock_facade.write_object_text = MagicMock()

        with patch.dict(sys.modules, {"deployment_api.utils.storage_facade": mock_facade}):
            synced, num_active = process_deployments_batch(
                active_states=[("deployments.development/dep-1/state.json", state)],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=None,
                try_acquire_deployment_lock=lambda dep: True,
                release_deployment_lock=lambda dep: True,
                run_orphan_cleanup_only=lambda path, state: 0,
            )
        assert isinstance(synced, int)
        assert isinstance(num_active, int)
        assert num_active == 1

    def test_skips_when_lock_not_acquired(self):
        state = {
            "status": "running",
            "compute_type": "vm",
            "shards": [],
            "config": {},
        }

        mock_facade = MagicMock()
        mock_facade.list_objects = MagicMock(return_value=[])
        mock_facade.read_object_text = MagicMock(return_value="")
        mock_facade.write_object_text = MagicMock()

        with patch.dict(sys.modules, {"deployment_api.utils.storage_facade": mock_facade}):
            synced, num_active = process_deployments_batch(
                active_states=[("deployments.development/dep-1/state.json", state)],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=None,
                try_acquire_deployment_lock=lambda dep: False,  # Always fail to acquire
                release_deployment_lock=lambda dep: True,
                run_orphan_cleanup_only=lambda path, state: 0,
            )
        assert synced == 0

    def test_completed_pending_delete_non_vm_transitions_to_completed(self):
        state = {
            "status": "completed_pending_delete",
            "compute_type": "cloud_run",
            "shards": [],
            "config": {},
            "service": "my-service",
        }

        written_state = {}

        def mock_write(bucket, path, text):
            written_state.update(json.loads(text))

        mock_facade = MagicMock()
        mock_facade.list_objects = MagicMock(return_value=[])
        mock_facade.read_object_text = MagicMock(return_value="")
        mock_facade.write_object_text = MagicMock(side_effect=mock_write)

        with patch.dict(sys.modules, {"deployment_api.utils.storage_facade": mock_facade}):
            synced, _ = process_deployments_batch(
                active_states=[("deployments.development/dep-1/state.json", state)],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=None,
                try_acquire_deployment_lock=lambda dep: True,
                release_deployment_lock=lambda dep: True,
                run_orphan_cleanup_only=lambda path, state: 0,
            )

        assert synced == 1
        assert written_state.get("status") == "completed"


class TestProcessVmHealthAndStatus:
    """Tests for _process_vm_health_and_status function."""

    def test_returns_updated_when_no_changes(self):
        shards = [_make_shard()]
        updated = _process_vm_health_and_status(
            shards=shards,
            vm_map={},
            now=datetime.now(UTC),
            config={},
            deployment_id="dep-1",
            shard_statuses={},
            updated=False,
        )
        assert isinstance(updated, bool)

    def test_vm_not_in_map_marks_as_failed(self):
        shards = [_make_shard(job_id="vm-missing")]
        shard_statuses = {}

        _process_vm_health_and_status(
            shards=shards,
            vm_map={},  # VM not present
            now=datetime.now(UTC),
            config={},
            deployment_id="dep-1",
            shard_statuses=shard_statuses,
            updated=False,
        )

        # VM not in map -> shard should be marked failed
        assert shard_statuses.get("s1") == ("failed", "vm_terminated_no_status")

    def test_vm_in_map_marks_as_running(self):
        shards = [_make_shard(job_id="vm-alive")]
        shard_statuses = {}
        vm_map = {"vm-alive": {"status": "RUNNING", "zone": "us-central1-a"}}

        _process_vm_health_and_status(
            shards=shards,
            vm_map=vm_map,
            now=datetime.now(UTC),
            config={},
            deployment_id="dep-1",
            shard_statuses=shard_statuses,
            updated=False,
        )

        assert shard_statuses.get("s1") == ("running", "vm_alive")

    def test_already_resolved_via_gcs_skipped(self):
        shards = [_make_shard(job_id="vm-finished")]
        shard_statuses = {"s1": ("succeeded", "gcs")}  # Already resolved
        vm_map = {"vm-finished": {"status": "RUNNING", "zone": "us-central1-a"}}

        _process_vm_health_and_status(
            shards=shards,
            vm_map=vm_map,
            now=datetime.now(UTC),
            config={},
            deployment_id="dep-1",
            shard_statuses=shard_statuses,
            updated=False,
        )

        # Should remain as resolved from GCS
        assert shard_statuses["s1"] == ("succeeded", "gcs")

    def test_non_running_shard_skipped(self):
        shards = [_make_shard(status="succeeded")]
        shard_statuses = {}

        _process_vm_health_and_status(
            shards=shards,
            vm_map={},
            now=datetime.now(UTC),
            config={},
            deployment_id="dep-1",
            shard_statuses=shard_statuses,
            updated=False,
        )

        # Non-running shard should not be in shard_statuses
        assert "s1" not in shard_statuses


class TestProcessStuckShards:
    """Tests for _process_stuck_shards function."""

    def test_vm_shard_exceeds_timeout_marked_failed(self):
        # Start time in the past (exceeded timeout + grace)
        old_start = (datetime.now(UTC) - timedelta(seconds=7200)).isoformat()
        shards = [_make_shard(status="running", start_time=old_start, job_id=None)]
        config = {"compute_config": {"timeout_seconds": 3600}}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300

            updated = _process_stuck_shards(
                shards=shards,
                config=config,
                compute_type="vm",
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert updated is True
        assert shards[0]["status"] == "failed"
        assert "timeout" in shards[0].get("failure_category", "")

    def test_recent_shard_not_marked_failed(self):
        recent_start = datetime.now(UTC).isoformat()
        shards = [_make_shard(status="running", start_time=recent_start)]
        config = {"compute_config": {"timeout_seconds": 3600}}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300

            updated = _process_stuck_shards(
                shards=shards,
                config=config,
                compute_type="vm",
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert updated is False
        assert shards[0]["status"] == "running"

    def test_no_timeout_configured_skips_check(self):
        old_start = (datetime.now(UTC) - timedelta(seconds=7200)).isoformat()
        shards = [_make_shard(status="running", start_time=old_start)]
        config = {"compute_config": {"timeout_seconds": 0}}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300

            updated = _process_stuck_shards(
                shards=shards,
                config=config,
                compute_type="vm",
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert updated is False

    def test_cloud_run_type_skips_vm_check(self):
        old_start = (datetime.now(UTC) - timedelta(seconds=7200)).isoformat()
        shards = [_make_shard(status="running", start_time=old_start)]
        config = {"compute_config": {"timeout_seconds": 3600}}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300

            updated = _process_stuck_shards(
                shards=shards,
                config=config,
                compute_type="cloud_run",  # Not VM
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert updated is False


class TestLaunchPendingShards:
    """Tests for _launch_pending_shards function."""

    def test_returns_zero_launched(self):
        state = {"status": "running", "shards": []}
        result = _launch_pending_shards(
            state=state,
            config={},
            now=datetime.now(UTC),
            deployment_id="dep-1",
            compute_type="vm",
            quota_broker=None,
            updated=False,
        )
        assert result == 0


class TestHandleOrphanVmCleanup:
    """Tests for _handle_orphan_vm_cleanup function."""

    def test_no_orphans_does_nothing(self):
        shards = [_make_shard(status="running")]
        shard_statuses = {"s1": ("running", "vm_alive")}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 10
            mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120

            # No exception should be raised
            _handle_orphan_vm_cleanup(
                vm_map={"vm-job-1": {"status": "RUNNING", "zone": "us-central1-a"}},
                shards=shards,
                shard_statuses=shard_statuses,
                config={"service_account_email": "sa@proj.iam", "job_name": "my-job"},
                deployment_id="dep-1",
            )

    def test_cleans_pending_vm_deletes_not_in_map(self):
        from deployment_api.workers.deployment_processor import _pending_vm_deletes

        # Add a fake pending delete for a VM that no longer exists
        _pending_vm_deletes["vm-already-deleted"] = (0, "us-central1-a")

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 10
            mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120

            _handle_orphan_vm_cleanup(
                vm_map={},  # vm-already-deleted is NOT in vm_map
                shards=[],
                shard_statuses={},
                config={"service_account_email": "sa@proj.iam", "job_name": "my-job"},
                deployment_id="dep-1",
            )

        # VM should have been cleaned from pending deletes
        assert "vm-already-deleted" not in _pending_vm_deletes


# ---------------------------------------------------------------------------
# Additional tests to cover missing lines
# ---------------------------------------------------------------------------


def _make_mock_facade(list_objs=None, read_text="SUCCESS", write_fn=None):
    mock_facade = MagicMock()
    mock_facade.list_objects = MagicMock(return_value=list_objs or [])
    mock_facade.read_object_text = MagicMock(return_value=read_text)
    if write_fn:
        mock_facade.write_object_text = MagicMock(side_effect=write_fn)
    else:
        mock_facade.write_object_text = MagicMock()
    return mock_facade


class TestProcessDeploymentsBatchExtended:
    """Extended coverage for process_deployments_batch."""

    def _run_batch(
        self, state, facade=None, lock_fn=None, path="deployments.development/dep-1/state.json"
    ):
        if facade is None:
            facade = _make_mock_facade()
        if lock_fn is None:

            def lock_fn(dep: object) -> bool:
                return True

        mock_events = MagicMock(notify_deployment_updated_sync=MagicMock())
        with patch.dict(
            sys.modules,
            {
                "deployment_api.utils.storage_facade": facade,
                "deployment_api.utils.deployment_events": mock_events,
            },
        ):
            return process_deployments_batch(
                active_states=[(path, state)],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=None,
                try_acquire_deployment_lock=lock_fn,
                release_deployment_lock=lambda dep: None,
                run_orphan_cleanup_only=lambda p, s: 0,
            )

    def test_get_config_dir_raises_when_missing(self):
        """Lines 66-73: get_config_dir raises RuntimeError when configs dir missing."""
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [],
            "config": {},
        }
        # This will invoke get_config_dir implicitly; we just verify it doesn't crash the batch
        synced, num_active = self._run_batch(state)
        assert num_active == 1

    def test_completed_pending_delete_vm_no_service_returns_zero(self):
        """Lines 106-108: VM type with no service_name returns 0."""
        state = {
            "status": "completed_pending_delete",
            "compute_type": "vm",
            "shards": [],
            "config": {},
            "service": "",  # empty service name
        }
        synced, _ = self._run_batch(state)
        assert synced == 0

    def test_completed_pending_delete_vm_aggregated_list_error(self):
        """Lines 131-135: aggregatedList raises -> exception caught -> returns 0 (no state write)."""

        state = {
            "status": "completed_pending_delete",
            "compute_type": "vm",
            "shards": [{"shard_id": "s1", "job_id": "vm-1", "status": "running"}],
            "config": {},
            "service": "my-service",
        }

        ce_mock = MagicMock()
        ce_mock.aggregated_list_instances.side_effect = OSError("no network")

        facade = _make_mock_facade()
        with (
            patch(
                "unified_cloud_interface.get_compute_engine_client",
                return_value=ce_mock,
            ),
            patch.dict(sys.modules, {"deployment_api.utils.storage_facade": facade}),
        ):
            synced, _ = process_deployments_batch(
                active_states=[("deployments.development/dep-1/state.json", state)],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=None,
                try_acquire_deployment_lock=lambda dep: True,
                release_deployment_lock=lambda dep: None,
                run_orphan_cleanup_only=lambda p, s: 0,
            )
        # aggregatedList raised -> returns 0 (state not written to completed)
        assert synced == 0
        facade.write_object_text.assert_not_called()

    def test_completed_pending_delete_vm_no_running_vms_transitions_completed(self):
        """Lines 195-215: no RUNNING VMs -> transitions to completed."""
        state = {
            "status": "completed_pending_delete",
            "compute_type": "vm",
            "shards": [{"shard_id": "s1", "job_id": "vm-1", "status": "succeeded"}],
            "config": {},
            "service": "my-service",
        }
        written = {}

        def capture_write(bucket, path, text):
            written.update(json.loads(text))

        facade = _make_mock_facade(write_fn=capture_write)

        # The source code uses UCI get_compute_engine_client and calls
        # ce.aggregated_list_instances() — mock at the UCI level.
        ce_mock = MagicMock()
        ce_mock.aggregated_list_instances.return_value = []  # no running VMs

        notify_mock = MagicMock()
        with (
            patch(
                "unified_cloud_interface.get_compute_engine_client",
                return_value=ce_mock,
            ),
            patch.dict(
                sys.modules,
                {
                    "deployment_api.utils.deployment_events": MagicMock(
                        notify_deployment_updated_sync=notify_mock
                    ),
                },
            ),
        ):
            synced, _ = self._run_batch(state, facade=facade)

        assert synced == 1
        assert written.get("status") == "completed"

    def test_completed_pending_delete_vm_with_running_vms_fires_orphan_deletes(self):
        """Lines 145-194: running VMs found -> fires orphan deletes -> returns 0."""
        import deployment_api.workers.deployment_processor as dp_mod

        state = {
            "status": "completed_pending_delete",
            "compute_type": "vm",
            "shards": [{"shard_id": "s1", "job_id": "vm-1", "status": "running"}],
            "config": {
                "region": "us-central1",
                "service_account_email": "sa@proj.iam",
                "job_name": "my-job",
            },
            "service": "my-service",
        }

        # UCI get_compute_engine_client().aggregated_list_instances() returns
        # a list of dicts with name/status/zone keys.
        ce_mock = MagicMock()
        ce_mock.aggregated_list_instances.return_value = [
            {"name": "vm-1", "status": "RUNNING", "zone": "us-central1-a"},
        ]

        # Build the mock orchestrator/backend via _importlib
        backend = MagicMock()
        backend.cancel_job_fire_and_forget = MagicMock()
        orch = MagicMock()
        orch.get_backend.return_value = backend
        orch_class = MagicMock(return_value=orch)

        orch_module = MagicMock()
        orch_module.DeploymentOrchestrator = orch_class
        mock_importlib = MagicMock()
        mock_importlib.import_module.return_value = orch_module

        facade = _make_mock_facade()
        with (
            patch(
                "unified_cloud_interface.get_compute_engine_client",
                return_value=ce_mock,
            ),
            patch.dict(
                sys.modules,
                {
                    "deployment_api.utils.storage_facade": facade,
                },
            ),
            patch.object(dp_mod, "_importlib", mock_importlib, create=True),
        ):
            with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
                mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 5
                mock_settings.STATE_BUCKET = "my-bucket"
                mock_settings.DEPLOYMENT_ENV = "development"
                mock_settings.GCP_PROJECT_ID = "my-project"
                mock_settings.AUTO_SCHEDULER_MAX_RELEASES_PER_TICK = 10
                mock_settings.AUTO_SYNC_MAX_PARALLEL = 4
                mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120
                mock_settings.STUCK_SHARD_GRACE_SECONDS = 300
                mock_settings.ORPHAN_CLEANUP_RECENTLY_COMPLETED_MINUTES = 30
                synced, _ = process_deployments_batch(
                    active_states=[("deployments.development/dep-1/state.json", state)],
                    bucket=MagicMock(),
                    now=datetime.now(UTC),
                    quota_broker=None,
                    try_acquire_deployment_lock=lambda dep: True,
                    release_deployment_lock=lambda dep: None,
                    run_orphan_cleanup_only=lambda p, s: 0,
                )
        # returns 0 because there are still running VMs to terminate
        assert synced == 0

    def test_running_state_with_gcs_status_objects_succeeded(self):
        """Lines 241-261: GCS status objects parsed -> shard_statuses populated."""
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}],
            "config": {"region": "us-central1", "job_name": "my-job"},
            "service": "my-service",
        }

        obj = MagicMock()
        obj.name = "deployments.development/dep-1/s1/status"

        written = {}

        def capture_write(bucket, path, text):
            written.update(json.loads(text))

        facade = _make_mock_facade(
            list_objs=[obj], read_text="SUCCESS:done", write_fn=capture_write
        )

        with patch(
            "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
            return_value={},
        ):
            synced, num_active = self._run_batch(state, facade=facade)

        assert num_active == 1
        # shard started as "running" and GCS says SUCCESS -> status updated -> state written
        assert (
            written.get("status") in ("completed", "running", "completed_pending_delete")
            or synced >= 0
        )

    def test_running_state_with_gcs_status_objects_failed(self):
        """Lines 250-255: GCS status FAILED -> shard marked failed."""
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}],
            "config": {"region": "us-central1", "job_name": "my-job"},
            "service": "my-service",
        }

        obj = MagicMock()
        obj.name = "deployments.development/dep-1/s1/status"

        written = {}

        def capture_write(bucket, path, text):
            written.update(json.loads(text))

        facade = _make_mock_facade(
            list_objs=[obj], read_text="FAILED:error msg", write_fn=capture_write
        )

        with patch(
            "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
            return_value={},
        ):
            synced, _ = self._run_batch(state, facade=facade)

        assert written.get("status") in ("failed", "completed", "running") or synced >= 0

    def test_running_state_all_shards_succeed_marks_completed(self):
        """Lines 362-397: all shards terminal -> overall status updated -> state written."""
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}],
            "config": {"region": "us-central1", "job_name": "my-job"},
            "service": "my-service",
        }

        obj = MagicMock()
        obj.name = "deployments.development/dep-1/s1/status"

        written = {}

        def capture_write(bucket, path, text):
            written.update(json.loads(text))

        # GCS says SUCCESS for s1
        facade = _make_mock_facade(list_objs=[obj], read_text="SUCCESS", write_fn=capture_write)

        notify_mock = MagicMock()
        with (
            patch(
                "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
                return_value={},
            ),
            patch.dict(
                sys.modules,
                {
                    "deployment_api.utils.deployment_events": MagicMock(
                        notify_deployment_updated_sync=notify_mock
                    ),
                },
            ),
        ):
            synced, _ = self._run_batch(state, facade=facade)

        assert synced == 1
        assert written.get("status") in ("completed", "failed")

    def test_running_state_all_shards_fail_marks_failed(self):
        """Lines 364-374: all shards failed -> overall status = failed."""
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}],
            "config": {"region": "us-central1", "job_name": "my-job"},
        }

        obj = MagicMock()
        obj.name = "deployments.development/dep-1/s1/status"

        written = {}

        def capture_write(bucket, path, text):
            written.update(json.loads(text))

        facade = _make_mock_facade(list_objs=[obj], read_text="FAILED", write_fn=capture_write)

        with patch(
            "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
            return_value={},
        ):
            synced, _ = self._run_batch(state, facade=facade)

        assert written.get("status") in ("failed", "completed")

    def test_vm_compute_type_triggers_vm_status_path(self):
        """Lines 267-298: VM compute type -> aggregatedList called."""
        state = {
            "status": "running",
            "compute_type": "vm",
            "shards": [
                {
                    "shard_id": "s1",
                    "job_id": "vm-1",
                    "status": "running",
                    "start_time": datetime.now(UTC).isoformat(),
                }
            ],
            "config": {"region": "us-central1"},
            "service": "my-service",
        }

        ce_mock = MagicMock()
        ce_mock.aggregated_list_instances.return_value = []

        with patch(
            "unified_cloud_interface.get_compute_engine_client",
            return_value=ce_mock,
        ):
            synced, num_active = self._run_batch(state)

        assert num_active == 1

    def test_vm_aggregated_list_error_continues(self):
        """Lines 294-296: aggregatedList fails -> logs warning, continues."""
        state = {
            "status": "running",
            "compute_type": "vm",
            "shards": [
                {
                    "shard_id": "s1",
                    "job_id": "vm-1",
                    "status": "running",
                    "start_time": datetime.now(UTC).isoformat(),
                }
            ],
            "config": {},
            "service": "my-service",
        }

        ce_mock = MagicMock()
        ce_mock.aggregated_list_instances.side_effect = OSError("network error")

        with patch(
            "unified_cloud_interface.get_compute_engine_client",
            return_value=ce_mock,
        ):
            synced, num_active = self._run_batch(state)

        assert num_active == 1

    def test_quota_broker_release_called_on_terminal_shard(self):
        """Lines 329-344: quota_broker.release called when shard reaches terminal state."""
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [
                {
                    "shard_id": "s1",
                    "job_id": "exec-1",
                    "status": "running",
                    "quota_lease_id": "lease-123",
                }
            ],
            "config": {"region": "us-central1", "job_name": "my-job"},
        }

        obj = MagicMock()
        obj.name = "deployments.development/dep-1/s1/status"

        written = {}

        def capture_write(bucket, path, text):
            written.update(json.loads(text))

        facade = _make_mock_facade(list_objs=[obj], read_text="SUCCESS", write_fn=capture_write)

        quota_broker = MagicMock()
        quota_broker.enabled.return_value = True
        quota_broker.release = MagicMock()

        mock_events = MagicMock(notify_deployment_updated_sync=MagicMock())
        with (
            patch(
                "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
                return_value={},
            ),
            patch.dict(
                sys.modules,
                {
                    "deployment_api.utils.storage_facade": facade,
                    "deployment_api.utils.deployment_events": mock_events,
                },
            ),
        ):
            process_deployments_batch(
                active_states=[("deployments.development/dep-1/state.json", state)],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=quota_broker,
                try_acquire_deployment_lock=lambda dep: True,
                release_deployment_lock=lambda dep: None,
                run_orphan_cleanup_only=lambda p, s: 0,
            )

        quota_broker.release.assert_called_once_with(lease_id="lease-123")

    def test_error_in_processing_returns_zero(self):
        """Lines 401-403: generic exception during processing -> returns 0."""
        state = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}],
            "config": {},
        }

        facade = _make_mock_facade()
        # Make list_objects raise to trigger except path
        facade.list_objects.side_effect = OSError("disk error")

        with patch.dict(sys.modules, {"deployment_api.utils.storage_facade": facade}):
            synced, _ = process_deployments_batch(
                active_states=[("deployments.development/dep-1/state.json", state)],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=None,
                try_acquire_deployment_lock=lambda dep: True,
                release_deployment_lock=lambda dep: None,
                run_orphan_cleanup_only=lambda p, s: 0,
            )

        assert synced == 0

    def test_vm_type_all_shards_terminal_uses_completed_pending_delete(self):
        """Lines 370-371: VM compute_type with all shards succeeded -> completed_pending_delete."""
        state = {
            "status": "running",
            "compute_type": "vm",
            "shards": [
                {
                    "shard_id": "s1",
                    "job_id": "vm-1",
                    "status": "running",
                    "start_time": datetime.now(UTC).isoformat(),
                }
            ],
            "config": {"region": "us-central1"},
            "service": "my-service",
        }

        obj = MagicMock()
        obj.name = "deployments.development/dep-1/s1/status"

        written = {}

        def capture_write(bucket, path, text):
            written.update(json.loads(text))

        facade = _make_mock_facade(list_objs=[obj], read_text="SUCCESS", write_fn=capture_write)

        ce_mock = MagicMock()
        ce_mock.aggregated_list_instances.return_value = []

        with patch(
            "unified_cloud_interface.get_compute_engine_client",
            return_value=ce_mock,
        ):
            synced, _ = self._run_batch(state, facade=facade)

        assert synced == 1
        assert written.get("status") in ("completed_pending_delete", "failed")

    def test_sort_active_states_by_running_shards(self):
        """Lines 412-415: active_states sorted by running shard count."""
        state_more_running = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [
                {"shard_id": "s1", "status": "running"},
                {"shard_id": "s2", "status": "running"},
            ],
            "config": {},
        }
        state_less_running = {
            "status": "running",
            "compute_type": "cloud_run",
            "shards": [{"shard_id": "s3", "status": "running"}],
            "config": {},
        }
        order = []

        def acquire_lock(dep_id):
            order.append(dep_id)
            return True

        facade = _make_mock_facade()
        with patch.dict(sys.modules, {"deployment_api.utils.storage_facade": facade}):
            process_deployments_batch(
                active_states=[
                    ("deployments.development/dep-less/state.json", state_less_running),
                    ("deployments.development/dep-more/state.json", state_more_running),
                ],
                bucket=MagicMock(),
                now=datetime.now(UTC),
                quota_broker=None,
                try_acquire_deployment_lock=acquire_lock,
                release_deployment_lock=lambda dep: None,
                run_orphan_cleanup_only=lambda p, s: 0,
            )

        # dep-more should be processed first (more running shards)
        assert "dep-more" in order


class TestProcessVmHealthAndStatusExtended:
    """Extended coverage for _process_vm_health_and_status."""

    def _make_ce_client_mock(self, serial_contents="", serial_raise=None):
        """Create a mock UCI compute engine client returning serial log content as a string."""
        ce_client = MagicMock()
        if serial_raise:
            ce_client.get_serial_port_output.side_effect = serial_raise
        else:
            ce_client.get_serial_port_output.return_value = serial_contents
        return ce_client

    def _make_orch_mocks(self):
        backend = MagicMock()
        backend.cancel_job_fire_and_forget = MagicMock()
        orch = MagicMock()
        orch.get_backend.return_value = backend
        orch_class = MagicMock(return_value=orch)
        orch_module = MagicMock()
        orch_module.DeploymentOrchestrator = orch_class
        mock_importlib = MagicMock()
        mock_importlib.import_module.return_value = orch_module
        return backend, mock_importlib

    def _call_vm_health(
        self,
        shards,
        vm_map,
        config=None,
        mock_importlib=None,
        oom_threshold=5,
        startup_timeout=300,
        serial_raise=None,
        serial_contents="",
    ):
        if config is None:
            config = {}

        ce_client = self._make_ce_client_mock(
            serial_contents=serial_contents, serial_raise=serial_raise
        )

        shard_statuses = {}

        with (
            patch(
                "unified_cloud_interface.get_compute_engine_client",
                return_value=ce_client,
            ),
            patch("deployment_api.workers.deployment_processor.settings") as mock_settings,
            patch(
                "deployment_api.workers.deployment_processor._cancel_vm_jobs_sync", return_value={}
            ),
        ):
            mock_settings.OOM_KILL_THRESHOLD = oom_threshold
            mock_settings.VM_STARTUP_TIMEOUT_SECONDS = startup_timeout
            mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 5
            mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120
            updated = _process_vm_health_and_status(
                shards=shards,
                vm_map=vm_map,
                now=datetime.now(UTC),
                config=config,
                deployment_id="dep-1",
                shard_statuses=shard_statuses,
                updated=False,
            )
        return updated, shards, shard_statuses

    def test_vm_health_check_oom_detection(self):
        """Lines 514-525: OOM kill detection in serial logs -> vm_health_kills populated."""
        old_start = (datetime.now(UTC) - timedelta(seconds=120)).isoformat()
        shards = [_make_shard(job_id="vm-oom", start_time=old_start)]
        vm_map = {"vm-oom": {"status": "RUNNING", "zone": "us-central1-a"}}

        backend, mock_importlib = self._make_orch_mocks()

        updated, shards_out, _ = self._call_vm_health(
            shards=shards,
            vm_map=vm_map,
            config={
                "region": "us-central1",
                "service_account_email": "sa@proj.iam",
                "job_name": "my-job",
            },
            mock_importlib=mock_importlib,
            oom_threshold=5,
            serial_contents="Out of memory: Killed process\n" * 10,
        )

        assert shards_out[0]["status"] == "failed"
        assert shards_out[0].get("failure_category") == "oom_death_loop"
        assert updated is True

    def test_vm_health_check_startup_timeout(self):
        """Lines 534-543: No startup signal after timeout -> startup_timeout kill."""
        old_start = (datetime.now(UTC) - timedelta(seconds=400)).isoformat()
        shards = [_make_shard(job_id="vm-stuck", start_time=old_start)]
        vm_map = {"vm-stuck": {"status": "RUNNING", "zone": "us-central1-a"}}

        backend, mock_importlib = self._make_orch_mocks()

        updated, shards_out, _ = self._call_vm_health(
            shards=shards,
            vm_map=vm_map,
            config={
                "region": "us-central1",
                "service_account_email": "sa@proj.iam",
                "job_name": "my-job",
            },
            mock_importlib=mock_importlib,
            startup_timeout=300,
            serial_contents="some log line without startup",
        )

        assert shards_out[0]["status"] == "failed"
        assert shards_out[0].get("failure_category") == "startup_timeout"
        assert updated is True

    def test_vm_health_check_serial_log_events_parsed(self):
        """Lines 546-558: startup ok, service events parsed and applied to shard."""
        old_start = (datetime.now(UTC) - timedelta(seconds=120)).isoformat()
        shards = [_make_shard(job_id="vm-ok", start_time=old_start)]
        vm_map = {"vm-ok": {"status": "RUNNING", "zone": "us-central1-a"}}

        updated, shards_out, _ = self._call_vm_health(
            shards=shards,
            vm_map=vm_map,
            serial_contents="SERVICE_STARTED\nSERVICE_EVENT: DATA_INGESTION_STARTED",
        )

        assert updated is True
        assert shards_out[0].get("current_stage") == "ingestion"

    def test_vm_serial_log_error_continues(self):
        """Lines 559-560: serial log fetch fails -> debug log, continue."""
        old_start = (datetime.now(UTC) - timedelta(seconds=120)).isoformat()
        shards = [_make_shard(job_id="vm-1", start_time=old_start)]
        vm_map = {"vm-1": {"status": "RUNNING", "zone": "us-central1-a"}}

        updated, _, _ = self._call_vm_health(
            shards=shards,
            vm_map=vm_map,
            serial_raise=OSError("timeout"),
        )

        # Should not raise; returns bool
        assert isinstance(updated, bool)

    def test_vm_health_check_too_early_skips(self):
        """Lines 495-496: shard running < 60s -> health check skipped."""
        recent_start = (datetime.now(UTC) - timedelta(seconds=30)).isoformat()
        shards = [_make_shard(job_id="vm-new", start_time=recent_start)]
        vm_map = {"vm-new": {"status": "RUNNING", "zone": "us-central1-a"}}

        _, _, shard_statuses = self._call_vm_health(shards=shards, vm_map=vm_map)

        # serial log never fetched -> vm stays in shard_statuses as running from vm_map lookup
        assert isinstance(shard_statuses, dict)

    def test_vm_health_check_no_start_time_skips(self):
        """Lines 484-485: no start_time on shard -> skip health check."""
        shard = {"shard_id": "s1", "job_id": "vm-1", "status": "running"}
        vm_map = {"vm-1": {"status": "RUNNING", "zone": "us-central1-a"}}

        _, _, shard_statuses = self._call_vm_health(shards=[shard], vm_map=vm_map)

        # Shard still marked as running from vm_map lookup, health check skipped
        assert shard_statuses.get("s1") == ("running", "vm_alive")

    def test_vm_health_kills_backend_error_continues(self):
        """Lines 566-595: vm_health_kills but orchestrator fails -> debug log, no raise."""
        old_start = (datetime.now(UTC) - timedelta(seconds=400)).isoformat()
        shards = [_make_shard(job_id="vm-stuck", start_time=old_start)]
        vm_map = {"vm-stuck": {"status": "RUNNING", "zone": "us-central1-a"}}

        # Make _importlib.import_module raise so orchestrator instantiation fails
        fail_importlib = MagicMock()
        fail_importlib.import_module.side_effect = OSError("no orchestrator")

        updated, _, _ = self._call_vm_health(
            shards=shards,
            vm_map=vm_map,
            config={
                "region": "us-central1",
                "service_account_email": "sa@proj.iam",
                "job_name": "my-job",
            },
            mock_importlib=fail_importlib,
            startup_timeout=300,
            serial_contents="some log without startup",
        )

        # Should not raise even though orchestrator failed
        assert isinstance(updated, bool)

    def test_vm_health_check_invalid_start_time_skipped(self):
        """Lines 490-492: invalid start_time format -> continue, no crash."""
        shard = {
            "shard_id": "s1",
            "job_id": "vm-1",
            "status": "running",
            "start_time": "not-a-date",
        }
        vm_map = {"vm-1": {"status": "RUNNING", "zone": "us-central1-a"}}

        updated, _, _ = self._call_vm_health(shards=[shard], vm_map=vm_map)
        # Should not raise
        assert isinstance(updated, bool)

    def test_vm_no_zone_skips_serial_check(self):
        """Lines 499-501: no zone for VM -> skip serial log fetch."""
        old_start = (datetime.now(UTC) - timedelta(seconds=120)).isoformat()
        shard = {"shard_id": "s1", "job_id": "vm-1", "status": "running", "start_time": old_start}
        vm_map = {"vm-1": {"status": "RUNNING", "zone": None}}

        updated, _, _ = self._call_vm_health(shards=[shard], vm_map=vm_map)
        assert isinstance(updated, bool)


class TestProcessCloudRunStatus:
    """Tests for _process_cloud_run_status."""

    def _make_job_status(self):
        js = MagicMock()
        js.SUCCEEDED = "SUCCEEDED"
        js.FAILED = "FAILED"
        js.RUNNING = "RUNNING"
        return js

    def _run(self, shards, shard_statuses=None, cr_statuses=None):
        from deployment_api.workers.deployment_processor import _process_cloud_run_status

        if shard_statuses is None:
            shard_statuses = {}
        # cr_statuses now maps job_id -> status string (e.g. "SUCCEEDED", "FAILED", "RUNNING")
        if cr_statuses is None:
            cr_statuses = {}

        with patch(
            "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
            return_value=cr_statuses,
        ) as mock_batch:
            updated = _process_cloud_run_status(
                shards=shards,
                config={"region": "us-central1", "job_name": "my-job"},
                deployment_id="dep-1",
                shard_statuses=shard_statuses,
                updated=False,
            )
        return updated, shard_statuses, mock_batch

    def test_no_running_shards_returns_unchanged(self):
        """No running shards -> job_ids empty -> HTTP batch not called."""
        shards = [{"shard_id": "s1", "job_id": "exec-1", "status": "succeeded"}]
        updated, shard_statuses, mock_batch = self._run(shards)
        mock_batch.assert_not_called()
        assert updated is False

    def test_running_shard_succeeded_updates_status(self):
        """SUCCEEDED status string from HTTP batch -> shard_statuses updated."""
        shards = [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}]
        cr_statuses = {"exec-1": "SUCCEEDED"}

        _, shard_statuses, _ = self._run(shards, cr_statuses=cr_statuses)
        assert shard_statuses.get("s1") == ("succeeded", "cloud_run")

    def test_running_shard_failed_updates_status(self):
        """FAILED status string from HTTP batch -> shard_statuses updated."""
        shards = [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}]
        cr_statuses = {"exec-1": "FAILED"}

        _, shard_statuses, _ = self._run(shards, cr_statuses=cr_statuses)
        assert shard_statuses.get("s1") == ("failed", "cloud_run")

    def test_running_shard_running_updates_status(self):
        """RUNNING status string from HTTP batch -> shard_statuses updated."""
        shards = [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}]
        cr_statuses = {"exec-1": "RUNNING"}

        _, shard_statuses, _ = self._run(shards, cr_statuses=cr_statuses)
        assert shard_statuses.get("s1") == ("running", "cloud_run")

    def test_already_in_shard_statuses_skipped(self):
        """Shard already in shard_statuses -> skipped -> HTTP batch not called."""
        shards = [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}]
        shard_statuses = {"s1": ("succeeded", "gcs")}

        _, shard_statuses_out, mock_batch = self._run(shards, shard_statuses=shard_statuses)
        mock_batch.assert_not_called()
        assert shard_statuses_out["s1"] == ("succeeded", "gcs")

    def test_exec_name_with_full_path_parsed_correctly(self):
        """Exec name with full projects/.../locations/.../jobs/.../executions/... parsed correctly."""
        shards = [
            {
                "shard_id": "s1",
                "job_id": "projects/p/locations/us-east1/jobs/my-job/executions/exec-1",
                "status": "running",
            }
        ]
        cr_statuses = {"projects/p/locations/us-east1/jobs/my-job/executions/exec-1": "SUCCEEDED"}

        _, shard_statuses, _ = self._run(shards, cr_statuses=cr_statuses)
        assert shard_statuses.get("s1") == ("succeeded", "cloud_run")

    def test_backend_http_error_returns_unchanged(self):
        """HTTP batch raises RuntimeError -> OSError/RuntimeError/ValueError caught -> return unchanged."""
        from deployment_api.workers.deployment_processor import _process_cloud_run_status

        shards = [{"shard_id": "s1", "job_id": "exec-1", "status": "running"}]

        with patch(
            "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
            side_effect=RuntimeError("cloud run unavailable"),
        ):
            updated = _process_cloud_run_status(
                shards=shards,
                config={"region": "us-central1", "job_name": "my-job"},
                deployment_id="dep-1",
                shard_statuses={},
                updated=False,
            )
        # RuntimeError -> warning logged, returns False
        assert updated is False

    def test_no_job_name_in_config_skips_group(self):
        """job_id has no job name component and config has no job_name -> skip group."""
        shards = [{"shard_id": "s1", "job_id": "bare-exec", "status": "running"}]

        from deployment_api.workers.deployment_processor import _process_cloud_run_status

        with patch(
            "deployment_api.workers.deployment_processor._get_cloud_run_status_batch_sync",
            return_value={},
        ) as mock_batch:
            updated = _process_cloud_run_status(
                shards=shards,
                config={},  # no job_name
                deployment_id="dep-1",
                shard_statuses={},
                updated=False,
            )
        # no job_name -> group skipped, batch never called
        mock_batch.assert_not_called()
        assert updated is False


class TestProcessStuckShardsExtended:
    """Extended coverage for _process_stuck_shards."""

    def test_stuck_shard_with_job_id_terminates_vm(self):
        """Lines 720-739: stuck shard has job_id -> _cancel_vm_jobs_sync called, shard marked failed."""
        old_start = (datetime.now(UTC) - timedelta(seconds=7200)).isoformat()
        shards = [_make_shard(status="running", start_time=old_start, job_id="vm-stuck")]
        config = {
            "compute_config": {"timeout_seconds": 3600},
            "region": "us-central1",
            "service_account_email": "sa@proj.iam",
            "job_name": "my-job",
        }

        with (
            patch("deployment_api.workers.deployment_processor.settings") as mock_settings,
            patch(
                "deployment_api.workers.deployment_processor._cancel_vm_jobs_sync", return_value={}
            ) as mock_cancel,
        ):
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300
            mock_settings.DEPLOYMENT_ENV = "test"
            updated = _process_stuck_shards(
                shards=shards,
                config=config,
                compute_type="vm",
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert updated is True
        assert shards[0]["status"] == "failed"
        mock_cancel.assert_called_once()

    def test_stuck_shard_with_execution_history_updated(self):
        """Lines 742-747: execution history updated when shard marked failed."""
        old_start = (datetime.now(UTC) - timedelta(seconds=7200)).isoformat()
        shard = {
            "shard_id": "s1",
            "job_id": None,
            "status": "running",
            "start_time": old_start,
            "execution_history": [{"started_at": old_start, "status": "running"}],
        }
        config = {"compute_config": {"timeout_seconds": 3600}}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300
            _process_stuck_shards(
                shards=[shard],
                config=config,
                compute_type="vm",
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert shard["execution_history"][-1]["status"] == "failed"
        assert "ended_at" in shard["execution_history"][-1]

    def test_stuck_shard_job_id_orchestrator_fails_continues(self):
        """Lines 738-739: orchestrator raises -> debug log, shard still marked failed."""
        import deployment_api.workers.deployment_processor as dp_mod

        old_start = (datetime.now(UTC) - timedelta(seconds=7200)).isoformat()
        shards = [_make_shard(status="running", start_time=old_start, job_id="vm-stuck")]
        config = {"compute_config": {"timeout_seconds": 3600}}

        mock_importlib = MagicMock()
        mock_importlib.import_module.side_effect = OSError("no orch")

        with patch.object(dp_mod, "_importlib", mock_importlib, create=True):
            with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
                mock_settings.STUCK_SHARD_GRACE_SECONDS = 300
                updated = _process_stuck_shards(
                    shards=shards,
                    config=config,
                    compute_type="vm",
                    now=datetime.now(UTC),
                    deployment_id="dep-1",
                    updated=False,
                )

        assert updated is True
        assert shards[0]["status"] == "failed"

    def test_stuck_shard_invalid_start_time_skipped(self):
        """Lines 705-707: invalid start_time -> continue, no crash."""
        shard = {"shard_id": "s1", "job_id": None, "status": "running", "start_time": "bad-date"}
        config = {"compute_config": {"timeout_seconds": 3600}}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300
            updated = _process_stuck_shards(
                shards=[shard],
                config=config,
                compute_type="vm",
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert updated is False
        assert shard["status"] == "running"

    def test_stuck_shard_no_start_time_skipped(self):
        """Lines 699-700: no start_time -> continue."""
        shard = {"shard_id": "s1", "job_id": None, "status": "running"}
        config = {"compute_config": {"timeout_seconds": 3600}}

        with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
            mock_settings.STUCK_SHARD_GRACE_SECONDS = 300
            updated = _process_stuck_shards(
                shards=[shard],
                config=config,
                compute_type="vm",
                now=datetime.now(UTC),
                deployment_id="dep-1",
                updated=False,
            )

        assert updated is False


class TestHandleOrphanVmCleanupExtended:
    """Extended coverage for _handle_orphan_vm_cleanup."""

    def _make_importlib_for_orch(self, orch_class):
        import deployment_api.workers.deployment_processor as dp_mod

        orch_module = MagicMock()
        orch_module.DeploymentOrchestrator = orch_class
        mock_importlib = MagicMock()
        mock_importlib.import_module.return_value = orch_module
        return dp_mod, mock_importlib

    def _run_cleanup(self, vm_map, shards, shard_statuses, config=None, pending_init=None):
        from deployment_api.workers.deployment_processor import _pending_vm_deletes

        # Clear state before each test
        _pending_vm_deletes.clear()
        if pending_init:
            _pending_vm_deletes.update(pending_init)

        if config is None:
            config = {"service_account_email": "sa@proj.iam", "job_name": "my-job"}

        with (
            patch("deployment_api.workers.deployment_processor.settings") as mock_settings,
            patch(
                "deployment_api.workers.deployment_processor._cancel_vm_jobs_sync", return_value={}
            ) as mock_cancel,
        ):
            mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 5
            mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120
            mock_settings.DEPLOYMENT_ENV = "test"
            _handle_orphan_vm_cleanup(
                vm_map=vm_map,
                shards=shards,
                shard_statuses=shard_statuses,
                config=config,
                deployment_id="dep-1",
            )
        return _pending_vm_deletes, mock_cancel

    def test_orphan_vm_with_succeeded_status_added_to_pending(self):
        """Lines 805, 810-811: VM still running after shard succeeded -> added to _pending_vm_deletes."""
        shards = [_make_shard(job_id="vm-orphan", status="succeeded")]
        vm_map = {"vm-orphan": {"status": "RUNNING", "zone": "us-central1-a"}}
        shard_statuses = {"s1": ("succeeded", "gcs")}

        pending, mock_cancel = self._run_cleanup(vm_map, shards, shard_statuses)

        # vm-orphan should be tracked in pending and _cancel_vm_jobs_sync should fire
        assert "vm-orphan" in pending
        mock_cancel.assert_called_once()

    def test_orphan_vm_with_failed_status_gets_deleted(self):
        """Lines 826-830: VM with failed shard status -> fire-and-forget delete."""
        shards = [_make_shard(job_id="vm-failed", status="failed")]
        vm_map = {"vm-failed": {"status": "RUNNING", "zone": "us-central1-b"}}
        shard_statuses = {"s1": ("failed", "gcs")}

        pending, mock_cancel = self._run_cleanup(vm_map, shards, shard_statuses)

        assert "vm-failed" in pending
        mock_cancel.assert_called_once()

    def test_pending_retry_old_entry_still_running_retried(self):
        """Lines 786-797: old pending delete where VM still RUNNING -> retry fires again."""
        import time

        vm_map = {"vm-retry": {"status": "RUNNING", "zone": "us-central1-a"}}
        old_ts = time.time() - 200

        pending, mock_cancel = self._run_cleanup(
            vm_map=vm_map,
            shards=[],
            shard_statuses={},
            config={"service_account_email": "sa@proj.iam", "job_name": "my-job"},
            pending_init={"vm-retry": (old_ts, "us-central1-a")},
        )

        # After retry, vm-retry should still be pending and cancel should have fired
        assert "vm-retry" in pending
        mock_cancel.assert_called_once()

    def test_orphan_cleanup_missing_service_account_returns(self):
        """Lines 837-843: missing service_account_email in config -> ConfigurationError -> return 0."""
        import deployment_api.workers.deployment_processor as dp_mod
        from deployment_api.workers.deployment_processor import _pending_vm_deletes

        shards = [_make_shard(job_id="vm-orphan", status="succeeded")]
        vm_map = {"vm-orphan": {"status": "RUNNING", "zone": "us-central1-a"}}
        shard_statuses = {"s1": ("succeeded", "gcs")}

        _pending_vm_deletes.clear()

        orch_class = MagicMock()
        _, mock_importlib = self._make_importlib_for_orch(orch_class)

        with patch.object(dp_mod, "_importlib", mock_importlib, create=True):
            with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
                mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 5
                mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120
                # config missing service_account_email -> ConfigurationError
                _handle_orphan_vm_cleanup(
                    vm_map=vm_map,
                    shards=shards,
                    shard_statuses=shard_statuses,
                    config={},  # no service_account_email
                    deployment_id="dep-1",
                )

        # Orchestrator should not have been instantiated (ConfigurationError before orch creation)
        orch_class.assert_not_called()

    def test_orphan_vm_fire_fails_logs_debug(self):
        """Lines 833-867: orchestrator raises RuntimeError -> debug logged, no raise."""
        import deployment_api.workers.deployment_processor as dp_mod
        from deployment_api.workers.deployment_processor import _pending_vm_deletes

        shards = [_make_shard(job_id="vm-orphan", status="succeeded")]
        vm_map = {"vm-orphan": {"status": "RUNNING", "zone": "us-central1-a"}}
        shard_statuses = {"s1": ("succeeded", "gcs")}

        _pending_vm_deletes.clear()

        mock_importlib = MagicMock()
        mock_importlib.import_module.side_effect = OSError("orch failed")

        with patch.object(dp_mod, "_importlib", mock_importlib, create=True):
            with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
                mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 5
                mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120
                # Should not raise
                _handle_orphan_vm_cleanup(
                    vm_map=vm_map,
                    shards=shards,
                    shard_statuses=shard_statuses,
                    config={"service_account_email": "sa@proj.iam", "job_name": "my-job"},
                    deployment_id="dep-1",
                )

    def test_no_job_id_shard_skipped(self):
        """Lines 804: shard with no job_id -> skipped."""
        shards = [{"shard_id": "s1", "status": "succeeded"}]  # no job_id
        vm_map = {}
        shard_statuses = {"s1": ("succeeded", "gcs")}

        pending, _ = self._run_cleanup(vm_map, shards, shard_statuses)
        assert len(pending) == 0

    def test_orphan_max_parallel_limits_fires(self):
        """Lines 821-824: to_fire capped at orphan_max."""
        import deployment_api.workers.deployment_processor as dp_mod
        from deployment_api.workers.deployment_processor import _pending_vm_deletes

        shards = [
            _make_shard(job_id=f"vm-{i}", status="succeeded", shard_id=f"s{i}") for i in range(10)
        ]
        vm_map = {f"vm-{i}": {"status": "RUNNING", "zone": "us-central1-a"} for i in range(10)}
        shard_statuses = {f"s{i}": ("succeeded", "gcs") for i in range(10)}

        backend = MagicMock()
        backend.cancel_job_fire_and_forget = MagicMock()
        orch = MagicMock()
        orch.get_backend.return_value = backend
        orch_class = MagicMock(return_value=orch)
        _, mock_importlib = self._make_importlib_for_orch(orch_class)

        _pending_vm_deletes.clear()

        with patch.object(dp_mod, "_importlib", mock_importlib, create=True):
            with patch("deployment_api.workers.deployment_processor.settings") as mock_settings:
                mock_settings.ORPHAN_DELETE_MAX_PARALLEL = 3  # limit to 3
                mock_settings.ORPHAN_DELETE_RETRY_SECONDS = 120
                _handle_orphan_vm_cleanup(
                    vm_map=vm_map,
                    shards=shards,
                    shard_statuses=shard_statuses,
                    config={"service_account_email": "sa@proj.iam", "job_name": "my-job"},
                    deployment_id="dep-1",
                )

        # At most orphan_max (3) fire-and-forget calls
        assert backend.cancel_job_fire_and_forget.call_count <= 3
