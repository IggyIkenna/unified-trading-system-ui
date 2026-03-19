"""
Unit tests for routes/deployments.py route handlers.

Tests call async route handlers directly with mocked state_manager
and deployment_manager instances.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure deployment_api.routes.deployments can be imported cleanly
import deployment_api.routes.deployments as _dep_routes

# Suppress cloud_mock_mode deprecation warnings from fixture save/restore
pytestmark = pytest.mark.filterwarnings("ignore::DeprecationWarning")


@pytest.fixture(autouse=True)
def _disable_mock_mode():
    """Force live code path so patches on state_manager/deployment_manager take effect."""
    original_data_mode = _dep_routes._cfg.data_mode
    original_cloud_mock = _dep_routes._cfg.cloud_mock_mode
    _dep_routes._cfg.data_mode = "real"
    _dep_routes._cfg.cloud_mock_mode = False
    yield
    _dep_routes._cfg.data_mode = original_data_mode
    _dep_routes._cfg.cloud_mock_mode = original_cloud_mock


def _make_request(headers=None):
    req = MagicMock()
    req.headers = headers or {}
    return req


def _make_bg_tasks():
    bg = MagicMock()
    bg.add_task = MagicMock()
    return bg


class TestListDeployments:
    @pytest.mark.asyncio
    async def test_returns_list(self):
        expected = {"deployments": [{"deployment_id": "d1"}], "total": 1}
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.list_deployments.return_value = expected
            result = await _dep_routes.list_deployments(
                limit=50, offset=0, status=None, service=None
            )
        assert result["total"] == 1

    @pytest.mark.asyncio
    async def test_raises_400_on_value_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.list_deployments.side_effect = ValueError("bad param")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.list_deployments(limit=50, offset=0, status=None, service=None)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.list_deployments.side_effect = ConnectionError("timeout")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.list_deployments(limit=50, offset=0, status=None, service=None)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_runtime_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.list_deployments.side_effect = RuntimeError("crash")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.list_deployments(limit=50, offset=0, status=None, service=None)
        assert exc.value.status_code == 500


class TestGetDeploymentStatus:
    @pytest.mark.asyncio
    async def test_returns_status(self):
        expected = {"deployment_id": "dep-1", "status": "running"}
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_status.return_value = expected
            result = await _dep_routes.get_deployment_status("dep-1", detailed=True)
        assert result["status"] == "running"

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_status.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_status("missing", detailed=True)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_status.side_effect = ConnectionError("timeout")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_status("dep-1", detailed=True)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_runtime_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_status.side_effect = RuntimeError("crash")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_status("dep-1", detailed=True)
        assert exc.value.status_code == 500


class TestVerifyDeploymentCompletion:
    @pytest.mark.asyncio
    async def test_returns_verification_result(self):
        expected = {"verified": True, "completion_pct": 100.0}
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.verify_deployment_completion.return_value = expected
            result = await _dep_routes.verify_deployment_completion("dep-1", force=False)
        assert result["verified"] is True

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.verify_deployment_completion.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.verify_deployment_completion("missing", force=False)
        assert exc.value.status_code == 404


class TestCreateDeployment:
    @pytest.mark.asyncio
    async def test_returns_deployment_result(self):
        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        bg_tasks = _make_bg_tasks()
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.create_deployment = AsyncMock(
                return_value={
                    "deployment_id": "dep-new",
                    "status": "running",
                    "total_shards": 5,
                    "cli_command": "python -m service",
                }
            )
            result = await _dep_routes.create_deployment(deploy_request, req, bg_tasks)
        assert result.deployment_id == "dep-new"
        assert result.total_shards == 5

    @pytest.mark.asyncio
    async def test_raises_400_on_value_error(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        bg_tasks = _make_bg_tasks()
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.create_deployment = AsyncMock(side_effect=ValueError("invalid"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.create_deployment(deploy_request, req, bg_tasks)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        bg_tasks = _make_bg_tasks()
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.create_deployment = AsyncMock(side_effect=ConnectionError("cloud down"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.create_deployment(deploy_request, req, bg_tasks)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_runtime_error(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        bg_tasks = _make_bg_tasks()
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.create_deployment = AsyncMock(side_effect=RuntimeError("crash"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.create_deployment(deploy_request, req, bg_tasks)
        assert exc.value.status_code == 500


class TestCancelDeployment:
    @pytest.mark.asyncio
    async def test_returns_cancelled(self):
        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.cancel_deployment.return_value = {"status": "cancelled"}
            result = await _dep_routes.cancel_deployment("dep-1", req)
        assert result["status"] == "cancelled"

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.cancel_deployment.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.cancel_deployment("missing", req)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_raises_500_on_runtime_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.cancel_deployment.side_effect = RuntimeError("crash")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.cancel_deployment("dep-1", req)
        assert exc.value.status_code == 500


class TestResumeDeployment:
    @pytest.mark.asyncio
    async def test_returns_resumed(self):
        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.resume_deployment.return_value = {"status": "running"}
            result = await _dep_routes.resume_deployment("dep-1", req)
        assert result["status"] == "running"

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.resume_deployment.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.resume_deployment("missing", req)
        assert exc.value.status_code == 404


class TestUpdateDeployment:
    @pytest.mark.asyncio
    async def test_returns_updated(self):
        from deployment_api.routes.deployments import UpdateDeploymentRequest

        req = _make_request()
        update_req = UpdateDeploymentRequest(tag="v2.0")
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.update_deployment_tag.return_value = {"status": "updated"}
            result = await _dep_routes.update_deployment("dep-1", update_req, req)
        assert result["status"] == "updated"

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        from deployment_api.routes.deployments import UpdateDeploymentRequest

        req = _make_request()
        update_req = UpdateDeploymentRequest(tag="v2.0")
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.update_deployment_tag.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.update_deployment("missing", update_req, req)
        assert exc.value.status_code == 404


class TestDeleteDeployment:
    @pytest.mark.asyncio
    async def test_returns_deleted(self):
        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.delete_deployment.return_value = {"deleted": True}
            result = await _dep_routes.delete_deployment("dep-1", req)
        assert result["deleted"] is True

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.delete_deployment.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.delete_deployment("missing", req)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_raises_500_on_runtime_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.delete_deployment.side_effect = RuntimeError("crash")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.delete_deployment("dep-1", req)
        assert exc.value.status_code == 500


class TestBulkDeleteDeployments:
    @pytest.mark.asyncio
    async def test_returns_bulk_result(self):
        from deployment_api.routes.deployments import BulkDeleteRequest

        req = _make_request()
        bulk_req = BulkDeleteRequest(deployment_ids=["dep-1", "dep-2"])
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.bulk_delete_deployments.return_value = {"deleted": 2}
            result = await _dep_routes.bulk_delete_deployments(bulk_req, req)
        assert result["deleted"] == 2

    @pytest.mark.asyncio
    async def test_raises_500_on_value_error(self):
        from fastapi import HTTPException

        from deployment_api.routes.deployments import BulkDeleteRequest

        req = _make_request()
        bulk_req = BulkDeleteRequest(deployment_ids=[])
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.bulk_delete_deployments.side_effect = ValueError("empty list")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.bulk_delete_deployments(bulk_req, req)
        assert exc.value.status_code == 500


class TestRefreshDeploymentStatus:
    @pytest.mark.asyncio
    async def test_returns_refreshed(self):
        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.refresh_deployment_status.return_value = {"status": "running", "refreshed": True}
            result = await _dep_routes.refresh_deployment_status("dep-1", req)
        assert result["refreshed"] is True

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.refresh_deployment_status.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.refresh_deployment_status("missing", req)
        assert exc.value.status_code == 404


class TestGetDeploymentLogs:
    @pytest.mark.asyncio
    async def test_returns_logs(self):
        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_logs.return_value = {"logs": ["line1", "line2"]}
            result = await _dep_routes.get_deployment_logs("dep-1", 100, req)
        assert len(result["logs"]) == 2

    @pytest.mark.asyncio
    async def test_raises_404_on_not_found(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_logs.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_logs("missing", 100, req)
        assert exc.value.status_code == 404


class TestGetDeploymentReport:
    @pytest.mark.asyncio
    async def test_returns_report(self):
        req = _make_request()
        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.get_deployment_report.return_value = {"deployment_id": "dep-1", "summary": "OK"}
            result = await _dep_routes.get_deployment_report("dep-1", req)
        assert result["deployment_id"] == "dep-1"

    @pytest.mark.asyncio
    async def test_returns_error_dict_as_is(self):
        req = _make_request()
        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.get_deployment_report.return_value = {"error": "not found"}
            result = await _dep_routes.get_deployment_report("missing", req)
        assert "error" in result

    @pytest.mark.asyncio
    async def test_raises_500_on_runtime_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.get_deployment_report.side_effect = RuntimeError("crash")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_report("dep-1", req)
        assert exc.value.status_code == 500


class TestQuotaInfo:
    @pytest.mark.asyncio
    async def test_returns_quota_info(self):
        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.calculate_quota_requirements = AsyncMock(return_value={"cpu": 4, "memory": "16Gi"})
            result = await _dep_routes.quota_info(deploy_request, req)
        assert result["cpu"] == 4

    @pytest.mark.asyncio
    async def test_raises_400_on_file_not_found(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.calculate_quota_requirements = AsyncMock(side_effect=FileNotFoundError("no config"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.quota_info(deploy_request, req)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_400_on_key_error(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.calculate_quota_requirements = AsyncMock(side_effect=KeyError("missing_key"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.quota_info(deploy_request, req)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_500_on_runtime_error(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.calculate_quota_requirements = AsyncMock(side_effect=RuntimeError("quota failure"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.quota_info(deploy_request, req)
        assert exc.value.status_code == 500


class TestVerifyDeploymentCompletionExtended:
    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.verify_deployment_completion.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.verify_deployment_completion("dep-1", force=False)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_os_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.verify_deployment_completion.side_effect = OSError("io error")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.verify_deployment_completion("dep-1", force=False)
        assert exc.value.status_code == 500


class TestCreateDeploymentExtended:
    @pytest.mark.asyncio
    async def test_raises_400_on_file_not_found(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        bg_tasks = _make_bg_tasks()
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.create_deployment = AsyncMock(side_effect=FileNotFoundError("no config"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.create_deployment(deploy_request, req, bg_tasks)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        bg_tasks = _make_bg_tasks()
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.create_deployment = AsyncMock(side_effect=ConnectionError("cloud down"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.create_deployment(deploy_request, req, bg_tasks)
        assert exc.value.status_code == 503


class TestCancelDeploymentExtended:
    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.cancel_deployment.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.cancel_deployment("dep-1", req)
        assert exc.value.status_code == 503


class TestResumeDeploymentExtended:
    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.resume_deployment.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.resume_deployment("dep-1", req)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_os_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.resume_deployment.side_effect = OSError("io error")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.resume_deployment("dep-1", req)
        assert exc.value.status_code == 500


class TestUpdateDeploymentExtended:
    @pytest.mark.asyncio
    async def test_raises_400_when_no_tag(self):
        from fastapi import HTTPException

        from deployment_api.routes.deployments import UpdateDeploymentRequest

        req = _make_request()
        update_req = UpdateDeploymentRequest(tag=None)
        with patch.object(_dep_routes, "state_manager"), pytest.raises(HTTPException) as exc:
            await _dep_routes.update_deployment("dep-1", update_req, req)
        assert exc.value.status_code == 400

    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        from deployment_api.routes.deployments import UpdateDeploymentRequest

        req = _make_request()
        update_req = UpdateDeploymentRequest(tag="v3.0")
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.update_deployment_tag.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.update_deployment("dep-1", update_req, req)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_os_error(self):
        from fastapi import HTTPException

        from deployment_api.routes.deployments import UpdateDeploymentRequest

        req = _make_request()
        update_req = UpdateDeploymentRequest(tag="v3.0")
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.update_deployment_tag.side_effect = OSError("io error")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.update_deployment("dep-1", update_req, req)
        assert exc.value.status_code == 500


class TestDeleteDeploymentExtended:
    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.delete_deployment.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.delete_deployment("dep-1", req)
        assert exc.value.status_code == 503


class TestBulkDeleteExtended:
    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        from deployment_api.routes.deployments import BulkDeleteRequest

        req = _make_request()
        bulk_req = BulkDeleteRequest(deployment_ids=["dep-1", "dep-2"])
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.bulk_delete_deployments.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.bulk_delete_deployments(bulk_req, req)
        assert exc.value.status_code == 503


class TestRefreshDeploymentStatusExtended:
    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.refresh_deployment_status.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.refresh_deployment_status("dep-1", req)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_os_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.refresh_deployment_status.side_effect = OSError("io error")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.refresh_deployment_status("dep-1", req)
        assert exc.value.status_code == 500


class TestGetDeploymentLogsExtended:
    @pytest.mark.asyncio
    async def test_stream_true_returns_logs(self):
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_logs.return_value = {"logs": ["line1"]}
            result = await _dep_routes.get_deployment_logs("dep-1", stream=True)
        assert "logs" in result

    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_logs.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_logs("dep-1")
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_500_on_os_error(self):
        from fastapi import HTTPException

        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_logs.side_effect = OSError("io error")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_logs("dep-1")
        assert exc.value.status_code == 500


class TestGetDeploymentReportExtended:
    @pytest.mark.asyncio
    async def test_raises_404_on_file_not_found(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.get_deployment_report.side_effect = FileNotFoundError("report missing")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_report("dep-1", req)
        assert exc.value.status_code == 404

    @pytest.mark.asyncio
    async def test_raises_503_on_connection_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.get_deployment_report.side_effect = ConnectionError("cloud down")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_report("dep-1", req)
        assert exc.value.status_code == 503

    @pytest.mark.asyncio
    async def test_raises_404_on_value_error(self):
        from fastapi import HTTPException

        req = _make_request()
        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.get_deployment_report.side_effect = ValueError("not found")
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.get_deployment_report("dep-1", req)
        assert exc.value.status_code == 404


class TestDeployRequestFilters:
    def test_filters_excludes_none_values(self):
        from deployment_api.routes.deployments import DeployRequest

        req = DeployRequest(service="svc", category="CEFI")
        filters = req.filters
        assert "category" in filters
        assert filters["category"] == "CEFI"
        assert "venue" not in filters

    def test_filters_empty_when_all_none(self):
        from deployment_api.routes.deployments import DeployRequest

        req = DeployRequest(service="svc")
        filters = req.filters
        assert isinstance(filters, dict)
        assert len(filters) == 0


class TestQuotaInfoValueError:
    @pytest.mark.asyncio
    async def test_raises_400_on_value_error(self):
        from fastapi import HTTPException

        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        req = _make_request()

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.calculate_quota_requirements = AsyncMock(side_effect=ValueError("invalid param"))
            with pytest.raises(HTTPException) as exc:
                await _dep_routes.quota_info(deploy_request, req)
        assert exc.value.status_code == 400


class TestCreateDeploymentBackgroundTaskRunner:
    @pytest.mark.asyncio
    async def test_background_task_runner_invoked(self):
        deploy_request = MagicMock()
        deploy_request.cloud_config_path = None
        bg_tasks = _make_bg_tasks()
        req = _make_request()

        async def fake_create(req_arg, config_dir, background_task_func, **kwargs):
            background_task_func(req_arg, config_dir, [], "cmd", "dep-id")
            return {
                "deployment_id": "dep-new",
                "status": "running",
                "total_shards": 0,
                "cli_command": "cmd",
            }

        with patch.object(_dep_routes, "deployment_manager") as dm:
            dm.create_deployment = fake_create
            result = await _dep_routes.create_deployment(deploy_request, req, bg_tasks)
        assert result.deployment_id == "dep-new"
        assert bg_tasks.add_task.called


class TestGetDeploymentLogsElseBranch:
    @pytest.mark.asyncio
    async def test_non_stream_returns_logs(self):
        with patch.object(_dep_routes, "state_manager") as sm:
            sm.get_deployment_logs.return_value = {"logs": ["a", "b"]}
            result = await _dep_routes.get_deployment_logs("dep-1", stream=False)
        assert len(result["logs"]) == 2
