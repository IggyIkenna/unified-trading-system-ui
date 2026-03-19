"""Tests for deployment-service FastAPI routes (import + error-path coverage)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client():
    from deployment_service.api.app import app

    return TestClient(app, raise_server_exceptions=False)


class TestApiAppImport:
    def test_app_is_fastapi_instance(self):
        from fastapi import FastAPI

        from deployment_service.api.app import app

        assert isinstance(app, FastAPI)

    def test_router_is_included(self):
        from deployment_service.api.app import app

        paths = {r.path for r in app.routes}
        assert "/api/v1/shards/calculate" in paths

    def test_route_state_module_imports(self):
        """Importing the routes module covers module-level code."""
        import deployment_service.api.routes.state as state_mod

        assert state_mod.router is not None

    def test_pydantic_request_models_instantiate(self):
        """Request models can be constructed with minimal valid input."""
        from deployment_service.api.routes.state import (
            CalculateShardsRequest,
            CancelVMJobsRequest,
            CloudRunStatusBatchRequest,
            CreateDeploymentRequest,
            QuotaAcquireRequest,
            QuotaReleaseRequest,
            VMStatusBatchRequest,
        )

        CalculateShardsRequest(service="svc", config_dir="/tmp")
        CreateDeploymentRequest(
            deployment_id="d",
            service="svc",
            region="us-central1",
            compute_type="batch",
            deployment_mode="batch",
            docker_image="img",
            job_name="job",
            compute_config={},
            env_vars={},
            max_concurrent=1,
            shards=[],
        )
        CancelVMJobsRequest(
            deployment_id="d",
            project_id="p",
            region="r",
            service_account_email="sa@iam",
            state_bucket="b",
            state_prefix="s/",
            job_name="j",
            jobs=[],
        )
        VMStatusBatchRequest(project_id="p", zone="z", vm_names=[])
        CloudRunStatusBatchRequest(
            project_id="p", region="r", service_account_email="sa@iam", job_name="j", job_ids=[]
        )
        QuotaAcquireRequest(quota_shape={}, batch_size=1)
        QuotaReleaseRequest(quota_shape={}, batch_size=1)


class TestShardsCalculateRoute:
    def test_returns_500_on_calculator_error(self, client):
        # Patch the source module class (lazy import inside function)
        with patch(
            "deployment_service.shard_calculator.ShardCalculator",
            side_effect=OSError("config not found"),
        ):
            resp = client.post(
                "/api/v1/shards/calculate",
                json={"service": "instruments-service", "config_dir": "/tmp/fake"},
            )
        assert resp.status_code == 500
        assert "config not found" in resp.json()["detail"]

    def test_returns_shards_on_success(self, client):
        mock_calc = MagicMock()
        mock_calc.calculate_shards.return_value = [{"date": "2024-01-01"}]
        with patch(
            "deployment_service.shard_calculator.ShardCalculator",
            return_value=mock_calc,
        ):
            resp = client.post(
                "/api/v1/shards/calculate",
                json={
                    "service": "instruments-service",
                    "config_dir": "/tmp/fake",
                    "start_date": "2024-01-01",
                    "end_date": "2024-01-31",
                    "cloud_config_path": "gs://bucket/config.yaml",
                    "date_granularity_override": "day",
                    "extra_filters": {"category": "cefi"},
                    "skip_existing": True,
                },
            )
        assert resp.status_code == 200
        assert "shards" in resp.json()


class TestDeploymentsRoute:
    def test_create_deployment_500_on_error(self, client):
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            side_effect=OSError("state bucket unavailable"),
        ):
            resp = client.post(
                "/api/v1/deployments",
                json={
                    "deployment_id": "dep-001",
                    "service": "instruments-service",
                    "region": "us-central1",
                    "compute_type": "batch",
                    "deployment_mode": "batch",
                    "docker_image": "gcr.io/test/image:latest",
                    "job_name": "instruments-job",
                    "compute_config": {},
                    "env_vars": {},
                    "max_concurrent": 5,
                    "shards": [],
                },
            )
        assert resp.status_code == 500

    def test_create_deployment_success(self, client):
        mock_sm = MagicMock()
        mock_state = MagicMock()
        mock_state.deployment_id = "dep-001"
        mock_state.status.value = "pending"
        mock_sm.create_deployment.return_value = mock_state
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            return_value=mock_sm,
        ):
            resp = client.post(
                "/api/v1/deployments",
                json={
                    "deployment_id": "dep-001",
                    "service": "instruments-service",
                    "region": "us-central1",
                    "compute_type": "batch",
                    "deployment_mode": "batch",
                    "docker_image": "gcr.io/test/image:latest",
                    "job_name": "instruments-job",
                    "compute_config": {},
                    "env_vars": {},
                    "max_concurrent": 5,
                    "shards": [],
                    "tag": "v1.0",
                    "vm_zone": "us-central1-a",
                },
            )
        assert resp.status_code == 202
        data = resp.json()
        assert data["deployment_id"] == "dep-001"
        assert data["status"] == "pending"


class TestDataStatusRoute:
    def test_data_status_error_returns_500(self, client):
        with patch(
            "deployment_service.catalog.DataCatalog",
            side_effect=OSError("db error"),
        ):
            resp = client.get(
                "/api/v1/data-status",
                params={
                    "service": "instruments-service",
                    "start_date": "2024-01-01",
                    "end_date": "2024-01-31",
                },
            )
        assert resp.status_code == 500

    def test_data_status_success(self, client):
        mock_catalog = MagicMock()
        mock_catalog.catalog_service.return_value.to_dict.return_value = {"completeness": 0.95}
        with patch(
            "deployment_service.catalog.DataCatalog",
            return_value=mock_catalog,
        ):
            resp = client.get(
                "/api/v1/data-status",
                params={
                    "service": "instruments-service",
                    "start_date": "2024-01-01",
                    "end_date": "2024-01-31",
                    "show_missing": True,
                    "check_venues": True,
                },
            )
        assert resp.status_code == 200


class TestVMJobsRoute:
    def test_cancel_vm_jobs_error(self, client):
        with patch(
            "deployment_service.backends.vm.VMBackend",
            side_effect=OSError("gcp error"),
        ):
            resp = client.post(
                "/api/v1/vm-jobs/cancel",
                json={
                    "deployment_id": "dep-001",
                    "project_id": "test-project",
                    "region": "us-central1",
                    "service_account_email": "sa@test.iam.gserviceaccount.com",
                    "state_bucket": "test-bucket",
                    "state_prefix": "state/",
                    "job_name": "test-job",
                    "jobs": [],
                },
            )
        assert resp.status_code == 500

    def test_cancel_vm_jobs_success(self, client):
        mock_backend = MagicMock()
        mock_backend.cancel_jobs.return_value = {"cancelled": 0}
        with patch(
            "deployment_service.backends.vm.VMBackend",
            return_value=mock_backend,
        ):
            resp = client.post(
                "/api/v1/vm-jobs/cancel",
                json={
                    "deployment_id": "dep-001",
                    "project_id": "test-project",
                    "region": "us-central1",
                    "service_account_email": "sa@test.iam.gserviceaccount.com",
                    "state_bucket": "test-bucket",
                    "state_prefix": "state/",
                    "job_name": "test-job",
                    "jobs": [{"job_id": "j1", "name": None}],
                    "fire_and_forget": False,
                },
            )
        assert resp.status_code == 200

    def test_vm_status_batch_error(self, client):
        with patch(
            "deployment_service.backends.vm.VMBackend",
            side_effect=OSError("timeout"),
        ):
            resp = client.post(
                "/api/v1/vm-jobs/status-batch",
                json={"project_id": "test-project", "zone": "us-central1-a", "vm_names": ["vm-1"]},
            )
        assert resp.status_code == 500

    def test_vm_status_batch_success(self, client):
        mock_backend = MagicMock()
        mock_backend.get_vm_status_batch.return_value = {"vm-1": "RUNNING"}
        with patch(
            "deployment_service.backends.vm.VMBackend",
            return_value=mock_backend,
        ):
            resp = client.post(
                "/api/v1/vm-jobs/status-batch",
                json={"project_id": "test-project", "zone": "us-central1-a", "vm_names": ["vm-1"]},
            )
        assert resp.status_code == 200
        assert resp.json()["statuses"]["vm-1"] == "RUNNING"


class TestQuotaRoutes:
    def test_quota_acquire_error(self, client):
        with patch(
            "deployment_service.deployment.quota_broker_client.QuotaBrokerClient",
            side_effect=OSError("quota broker unreachable"),
        ):
            resp = client.post(
                "/api/v1/quota/acquire",
                json={"quota_shape": {"cpu": 8}, "batch_size": 1},
            )
        assert resp.status_code == 500

    def test_quota_acquire_success(self, client):
        mock_client = MagicMock()
        mock_client.try_acquire_batch.return_value = True
        with patch(
            "deployment_service.deployment.quota_broker_client.QuotaBrokerClient",
            return_value=mock_client,
        ):
            resp = client.post(
                "/api/v1/quota/acquire",
                json={"quota_shape": {"cpu": 8}, "batch_size": 1},
            )
        assert resp.status_code == 200
        assert resp.json()["acquired"] is True

    def test_quota_release_success(self, client):
        mock_client = MagicMock()
        with patch(
            "deployment_service.deployment.quota_broker_client.QuotaBrokerClient",
            return_value=mock_client,
        ):
            resp = client.post(
                "/api/v1/quota/release",
                json={"quota_shape": {"cpu": 8}, "batch_size": 1},
            )
        assert resp.status_code == 204

    def test_quota_release_error(self, client):
        mock_client = MagicMock()
        mock_client.release_batch.side_effect = OSError("release failed")
        with patch(
            "deployment_service.deployment.quota_broker_client.QuotaBrokerClient",
            return_value=mock_client,
        ):
            resp = client.post(
                "/api/v1/quota/release",
                json={"quota_shape": {"cpu": 8}, "batch_size": 1},
            )
        assert resp.status_code == 500


class TestDeploymentEventsRoute:
    def test_get_events_error(self, client):
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            side_effect=OSError("storage error"),
        ):
            resp = client.get("/api/v1/deployments/dep-001/events")
        assert resp.status_code == 500

    def test_get_events_success(self, client):
        mock_sm = MagicMock()
        mock_sm.get_events.return_value = []
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            return_value=mock_sm,
        ):
            resp = client.get("/api/v1/deployments/dep-001/events")
        assert resp.status_code == 200
        assert resp.json() == {"events": []}

    def test_get_events_with_shard_filter(self, client):
        mock_sm = MagicMock()
        mock_event = MagicMock()
        mock_event.model_dump.return_value = {"event_type": "START", "shard_id": "s1"}
        mock_sm.get_events.return_value = [mock_event]
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            return_value=mock_sm,
        ):
            resp = client.get("/api/v1/deployments/dep-001/events?shard_id=s1")
        assert resp.status_code == 200


class TestCloudRunStatusBatchRoute:
    def test_cloud_run_status_error(self, client):
        with patch(
            "deployment_service.backends.cloud_run.CloudRunBackend",
            side_effect=OSError("cloud run error"),
        ):
            resp = client.post(
                "/api/v1/cloud-run/status-batch",
                json={
                    "project_id": "test-project",
                    "region": "us-central1",
                    "service_account_email": "sa@iam",
                    "job_name": "test-job",
                    "job_ids": ["job-1"],
                },
            )
        assert resp.status_code == 500

    def test_cloud_run_status_success(self, client):
        mock_backend = MagicMock()
        mock_backend.get_execution_status_batch.return_value = {"job-1": "SUCCEEDED"}
        with patch(
            "deployment_service.backends.cloud_run.CloudRunBackend",
            return_value=mock_backend,
        ):
            resp = client.post(
                "/api/v1/cloud-run/status-batch",
                json={
                    "project_id": "test-project",
                    "region": "us-central1",
                    "service_account_email": "sa@iam",
                    "job_name": "test-job",
                    "job_ids": ["job-1"],
                },
            )
        assert resp.status_code == 200


class TestVMEventsRoute:
    def test_get_vm_events_not_found(self, client):
        mock_sm = MagicMock()
        mock_sm.load_state.return_value = None
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            return_value=mock_sm,
        ):
            resp = client.get("/api/v1/deployments/dep-001/vm-events")
        assert resp.status_code == 404

    def test_get_vm_events_empty(self, client):
        mock_sm = MagicMock()
        mock_state = MagicMock()
        mock_state.shards = []
        mock_sm.load_state.return_value = mock_state
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            return_value=mock_sm,
        ):
            resp = client.get("/api/v1/deployments/dep-001/vm-events")
        assert resp.status_code == 200
        assert resp.json() == {"events": []}

    def test_get_vm_events_with_preemption(self, client):
        mock_sm = MagicMock()
        mock_state = MagicMock()
        mock_attempt = MagicMock()
        mock_attempt.failure_category = "VM_PREEMPTED"
        mock_attempt.failure_reason = "preempted by GCP"
        mock_attempt.ended_at = "2024-01-01T10:00:00Z"
        mock_attempt.started_at = None
        mock_attempt.zone = "us-central1-a"
        mock_attempt.region = "us-central1"
        mock_shard = MagicMock()
        mock_shard.shard_id = "shard-0"
        mock_shard.execution_history = [mock_attempt]
        mock_state.shards = [mock_shard]
        mock_sm.load_state.return_value = mock_state
        with patch(
            "deployment_service.api.routes.state._get_state_manager",
            return_value=mock_sm,
        ):
            resp = client.get("/api/v1/deployments/dep-001/vm-events")
        assert resp.status_code == 200
        events = resp.json()["events"]
        assert len(events) == 1
        assert events[0]["event_type"] == "VM_PREEMPTED"


class TestRollbackRoute:
    def test_rollback_error(self, client):
        with patch(
            "unified_cloud_interface.get_compute_client",
            side_effect=OSError("compute error"),
        ):
            resp = client.post(
                "/api/v1/deployments/dep-001/rollback",
                json={"service": "instruments-service", "region": "us-central1"},
            )
        assert resp.status_code == 500

    def test_rollback_success(self, client):
        mock_compute = MagicMock()
        mock_compute.rollback_service.return_value = {"rolled_back": True}
        with patch(
            "unified_cloud_interface.get_compute_client",
            return_value=mock_compute,
        ):
            resp = client.post(
                "/api/v1/deployments/dep-001/rollback",
                json={
                    "service": "instruments-service",
                    "region": "us-central1",
                    "target_revision": "v42",
                },
            )
        assert resp.status_code == 200
        data = resp.json()
        assert data["deployment_id"] == "dep-001"
        assert data["service"] == "instruments-service"


class TestLiveHealthRoute:
    def test_live_health_error(self, client):
        with patch(
            "unified_cloud_interface.get_compute_client",
            side_effect=OSError("compute error"),
        ):
            resp = client.get(
                "/api/v1/deployments/dep-001/live-health",
                params={"service": "instruments-service", "region": "us-central1"},
            )
        assert resp.status_code == 500

    def test_live_health_no_revisions(self, client):
        mock_compute = MagicMock()
        mock_compute.list_revisions.return_value = []
        with patch(
            "unified_cloud_interface.get_compute_client",
            return_value=mock_compute,
        ):
            resp = client.get(
                "/api/v1/deployments/dep-001/live-health",
                params={"service": "instruments-service", "region": "us-central1"},
            )
        assert resp.status_code == 200
        assert resp.json()["healthy"] is False

    def test_live_health_service_healthy(self, client):
        mock_compute = MagicMock()
        mock_compute.list_revisions.return_value = [
            {
                "create_time": 1704067200.0,
                "conditions": [{"type": "Ready", "state": "CONDITION_SUCCEEDED"}],
            }
        ]
        with patch(
            "unified_cloud_interface.get_compute_client",
            return_value=mock_compute,
        ):
            resp = client.get(
                "/api/v1/deployments/dep-001/live-health",
                params={"service": "instruments-service", "region": "us-central1"},
            )
        assert resp.status_code == 200
        assert resp.json()["healthy"] is True
