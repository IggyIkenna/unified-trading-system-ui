"""
Unit tests for deployment_service.monitor.

Targets 80%+ coverage by exercising:
- ServiceVersion: dataclass properties, to_dict, from_dict
- DeploymentStatus: properties, to_dict
- ServiceHealthReport: properties, to_dict, status_summary logic
- DeploymentMonitor: get_service_version, get_all_service_versions,
                     get_deployment_status, get_all_service_status,
                     generate_status_report
- VersionRegistry: register_version, get_version_history
"""

import json
from datetime import UTC, datetime
from unittest.mock import MagicMock, patch

import pytest

from deployment_service.monitor import (
    DeploymentMonitor,
    DeploymentStatus,
    ServiceHealthReport,
    ServiceVersion,
    VersionRegistry,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_version(
    service: str = "instruments-service",
    image_tag: str = "v1.2.3",
    git_commit: str = "abcdef1234567",
    git_branch: str = "main",
    project_id: str = "test-project",
) -> ServiceVersion:
    with patch("deployment_service.monitor._config") as mock_cfg:
        mock_cfg.gcp_project_id = project_id
        return ServiceVersion(
            service=service,
            image_tag=image_tag,
            git_commit=git_commit,
            git_branch=git_branch,
            build_date=datetime(2024, 1, 15, 12, 0, 0, tzinfo=UTC),
        )


# ===========================================================================
# ServiceVersion
# ===========================================================================


class TestServiceVersion:
    @pytest.mark.unit
    def test_full_image_name(self):
        v = _make_version()
        assert "gcr.io" in v.full_image_name
        assert "test-project" in v.full_image_name
        assert "instruments-service" in v.full_image_name
        assert "v1.2.3" in v.full_image_name

    @pytest.mark.unit
    def test_short_commit_truncated_to_7(self):
        v = _make_version(git_commit="abcdef1234567890")
        assert v.short_commit == "abcdef1"

    @pytest.mark.unit
    def test_short_commit_empty_string_returns_unknown(self):
        v = _make_version(git_commit="")
        assert v.short_commit == "unknown"

    @pytest.mark.unit
    def test_to_dict_keys(self):
        v = _make_version()
        d = v.to_dict()
        expected_keys = {
            "service",
            "image_tag",
            "full_image_name",
            "git_commit",
            "short_commit",
            "git_branch",
            "build_date",
            "deployed_at",
        }
        assert expected_keys.issubset(d.keys())

    @pytest.mark.unit
    def test_to_dict_deployed_at_none(self):
        v = _make_version()
        d = v.to_dict()
        assert d["deployed_at"] is None

    @pytest.mark.unit
    def test_to_dict_deployed_at_set(self):
        v = _make_version()
        v.deployed_at = datetime(2024, 2, 1, tzinfo=UTC)
        d = v.to_dict()
        assert d["deployed_at"] is not None
        assert "2024-02-01" in str(d["deployed_at"])

    @pytest.mark.unit
    def test_from_dict_round_trip(self):
        v = _make_version()
        d = v.to_dict()
        v2 = ServiceVersion.from_dict(d)
        assert v2.service == v.service
        assert v2.image_tag == v.image_tag
        assert v2.git_commit == v.git_commit
        assert v2.git_branch == v.git_branch

    @pytest.mark.unit
    def test_from_dict_missing_build_date_defaults_to_now(self):
        data: dict[str, object] = {
            "service": "test-svc",
            "image_tag": "v1.0",
            "git_commit": "abc",
            "git_branch": "main",
            "build_date": None,
            "deployed_at": None,
        }
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            v = ServiceVersion.from_dict(data)
        assert v.build_date is not None

    @pytest.mark.unit
    def test_repository_defaults_to_service_name(self):
        v = _make_version(service="market-data-service")
        assert v.repository == "market-data-service"

    @pytest.mark.unit
    def test_custom_registry(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            v = ServiceVersion(
                service="test-svc",
                image_tag="v1.0",
                git_commit="abc",
                git_branch="main",
                build_date=datetime(2024, 1, 1, tzinfo=UTC),
                registry="custom.registry.io",
            )
        assert v.registry == "custom.registry.io"
        assert "custom.registry.io" in v.full_image_name


# ===========================================================================
# DeploymentStatus
# ===========================================================================


class TestDeploymentStatus:
    @pytest.mark.unit
    def test_duration_seconds_none_when_not_started(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="pending")
        assert ds.duration_seconds is None

    @pytest.mark.unit
    def test_duration_seconds_calculated(self):
        ds = DeploymentStatus(
            service="svc",
            shard_id="s0",
            status="completed",
            started_at=datetime(2024, 1, 1, 10, 0, 0, tzinfo=UTC),
            completed_at=datetime(2024, 1, 1, 10, 5, 0, tzinfo=UTC),
        )
        assert ds.duration_seconds == 300.0

    @pytest.mark.unit
    def test_is_terminal_completed(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="completed")
        assert ds.is_terminal is True

    @pytest.mark.unit
    def test_is_terminal_failed(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="failed")
        assert ds.is_terminal is True

    @pytest.mark.unit
    def test_is_terminal_skipped(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="skipped")
        assert ds.is_terminal is True

    @pytest.mark.unit
    def test_is_terminal_running_false(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="running")
        assert ds.is_terminal is False

    @pytest.mark.unit
    def test_is_terminal_pending_false(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="pending")
        assert ds.is_terminal is False

    @pytest.mark.unit
    def test_to_dict_all_keys_present(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="running")
        d = ds.to_dict()
        expected = {
            "service",
            "shard_id",
            "status",
            "dimensions",
            "started_at",
            "completed_at",
            "duration_seconds",
            "error_message",
            "progress_percent",
            "records_processed",
            "records_total",
            "version",
        }
        assert expected.issubset(d.keys())

    @pytest.mark.unit
    def test_to_dict_with_version(self):
        v = _make_version()
        ds = DeploymentStatus(service="svc", shard_id="s0", status="completed", version=v)
        d = ds.to_dict()
        assert d["version"] is not None
        assert d["version"]["service"] == "instruments-service"

    @pytest.mark.unit
    def test_to_dict_version_none(self):
        ds = DeploymentStatus(service="svc", shard_id="s0", status="pending")
        d = ds.to_dict()
        assert d["version"] is None


# ===========================================================================
# ServiceHealthReport
# ===========================================================================


class TestServiceHealthReport:
    @pytest.mark.unit
    def test_completion_percent_zero_when_no_shards(self):
        r = ServiceHealthReport(service="svc", date="2024-01-01", category="CEFI")
        assert r.completion_percent == 0.0

    @pytest.mark.unit
    def test_completion_percent_calculated(self):
        r = ServiceHealthReport(
            service="svc", date="2024-01-01", category="CEFI", total_shards=10, completed=6
        )
        assert r.completion_percent == 60.0

    @pytest.mark.unit
    def test_status_summary_failed(self):
        r = ServiceHealthReport(
            service="svc", date="2024-01-01", category="CEFI", total_shards=5, failed=1
        )
        assert r.status_summary == "failed"

    @pytest.mark.unit
    def test_status_summary_running(self):
        r = ServiceHealthReport(
            service="svc", date="2024-01-01", category="CEFI", total_shards=5, running=2
        )
        assert r.status_summary == "running"

    @pytest.mark.unit
    def test_status_summary_pending(self):
        r = ServiceHealthReport(
            service="svc", date="2024-01-01", category="CEFI", total_shards=5, pending=5
        )
        assert r.status_summary == "pending"

    @pytest.mark.unit
    def test_status_summary_completed(self):
        r = ServiceHealthReport(
            service="svc", date="2024-01-01", category="CEFI", total_shards=3, completed=3
        )
        assert r.status_summary == "completed"

    @pytest.mark.unit
    def test_status_summary_partial(self):
        r = ServiceHealthReport(
            service="svc",
            date="2024-01-01",
            category="CEFI",
            total_shards=5,
            completed=3,
            skipped=1,
        )
        assert r.status_summary == "partial"

    @pytest.mark.unit
    def test_to_dict_keys(self):
        r = ServiceHealthReport(service="svc", date="2024-01-01", category="CEFI")
        d = r.to_dict()
        expected = {
            "service",
            "date",
            "category",
            "status_summary",
            "completion_percent",
            "total_shards",
            "pending",
            "running",
            "completed",
            "failed",
            "skipped",
            "dependencies_met",
            "missing_dependencies",
            "current_version",
        }
        assert expected.issubset(d.keys())

    @pytest.mark.unit
    def test_to_dict_with_version(self):
        v = _make_version()
        r = ServiceHealthReport(
            service="svc", date="2024-01-01", category="CEFI", current_version=v
        )
        d = r.to_dict()
        assert d["current_version"] is not None

    @pytest.mark.unit
    def test_dependencies_met_defaults_true(self):
        r = ServiceHealthReport(service="svc", date="2024-01-01", category="CEFI")
        assert r.dependencies_met is True

    @pytest.mark.unit
    def test_missing_dependencies_default_empty(self):
        r = ServiceHealthReport(service="svc", date="2024-01-01", category="CEFI")
        assert r.missing_dependencies == []


# ===========================================================================
# DeploymentMonitor
# ===========================================================================


class TestDeploymentMonitorGcsClient:
    @pytest.mark.unit
    def test_gcs_client_none_in_mock_mode(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True
            monitor = DeploymentMonitor(project_id="test-project")
            assert monitor.gcs_client is None

    @pytest.mark.unit
    def test_gcs_client_initialized_when_not_mock(self):
        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.get_storage_client") as mock_gsc,
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False
            mock_gsc.return_value = MagicMock()

            monitor = DeploymentMonitor(project_id="test-project")
            client = monitor.gcs_client
            assert client is not None

    @pytest.mark.unit
    def test_gcs_client_error_returns_none(self):
        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch(
                "deployment_service.monitor.get_storage_client",
                side_effect=OSError("network error"),
            ),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            monitor = DeploymentMonitor(project_id="test-project")
            assert monitor.gcs_client is None


class TestDeploymentMonitorGetServiceVersion:
    @pytest.mark.unit
    def test_returns_none_when_no_gcs_client(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True
            monitor = DeploymentMonitor(project_id="test-project")
            result = monitor.get_service_version("instruments-service")
            assert result is None

    @pytest.mark.unit
    def test_returns_cached_version(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True
            monitor = DeploymentMonitor(project_id="test-project")
            v = _make_version()
            monitor._version_cache["instruments-service"] = v
            result = monitor.get_service_version("instruments-service")
            assert result is v

    @pytest.mark.unit
    def test_fetches_version_from_gcs(self):
        v = _make_version()
        version_json = json.dumps(v.to_dict())

        mock_blob = MagicMock()
        mock_blob.exists.return_value = True
        mock_blob.download_as_text.return_value = version_json

        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            with patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs):
                monitor = DeploymentMonitor(project_id="test-project")
                result = monitor.get_service_version("instruments-service")

        assert result is not None
        assert result.service == "instruments-service"

    @pytest.mark.unit
    def test_returns_none_when_blob_does_not_exist(self):
        mock_blob = MagicMock()
        mock_blob.exists.return_value = False

        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = mock_blob

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            with patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs):
                monitor = DeploymentMonitor(project_id="test-project")
                result = monitor.get_service_version("instruments-service")

        assert result is None


class TestDeploymentMonitorGetDeploymentStatus:
    @pytest.mark.unit
    def test_returns_health_report_with_no_gcs(self):
        mock_graph = MagicMock()
        mock_dep_report = MagicMock()
        mock_dep_report.required_passed = True
        mock_dep_report.checks = []
        mock_graph.check_dependencies.return_value = mock_dep_report

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.DependencyGraph", return_value=mock_graph),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True

            monitor = DeploymentMonitor(project_id="test-project")
            report = monitor.get_deployment_status("instruments-service", "2024-01-01", "CEFI")

        assert isinstance(report, ServiceHealthReport)
        assert report.service == "instruments-service"
        assert report.date == "2024-01-01"
        assert report.category == "CEFI"
        assert report.dependencies_met is True

    @pytest.mark.unit
    def test_missing_dependencies_populated(self):
        mock_graph = MagicMock()
        mock_dep_report = MagicMock()
        mock_dep_report.required_passed = False

        failed_check = MagicMock()
        failed_check.upstream_service = "market-tick-data-service"
        failed_check.required = True
        failed_check.passed = False

        mock_dep_report.checks = [failed_check]
        mock_graph.check_dependencies.return_value = mock_dep_report

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.DependencyGraph", return_value=mock_graph),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True

            monitor = DeploymentMonitor(project_id="test-project")
            report = monitor.get_deployment_status(
                "features-delta-one-service", "2024-01-01", "CEFI"
            )

        assert report.dependencies_met is False
        assert "market-tick-data-service" in report.missing_dependencies

    @pytest.mark.unit
    def test_reads_shard_statuses_from_gcs(self):
        mock_graph = MagicMock()
        mock_dep_report = MagicMock()
        mock_dep_report.required_passed = True
        mock_dep_report.checks = []
        mock_graph.check_dependencies.return_value = mock_dep_report

        blob_completed = MagicMock()
        blob_completed.download_as_text.return_value = json.dumps({"status": "completed"})

        blob_failed = MagicMock()
        blob_failed.download_as_text.return_value = json.dumps({"status": "failed"})

        blob_running = MagicMock()
        blob_running.download_as_text.return_value = json.dumps({"status": "running"})

        # Version blob: exists() = False so get_service_version short-circuits
        version_blob = MagicMock()
        version_blob.exists.return_value = False

        mock_bucket = MagicMock()
        # blob() is called for the version lookup; list_blobs for shards
        mock_bucket.blob.return_value = version_blob
        mock_bucket.list_blobs.return_value = [blob_completed, blob_failed, blob_running]

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.DependencyGraph", return_value=mock_graph),
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            monitor = DeploymentMonitor(project_id="test-project")
            report = monitor.get_deployment_status("instruments-service", "2024-01-01", "CEFI")

        assert report.total_shards == 3
        assert report.completed == 1
        assert report.failed == 1
        assert report.running == 1

    @pytest.mark.unit
    def test_skipped_status_counted(self):
        mock_graph = MagicMock()
        mock_dep_report = MagicMock()
        mock_dep_report.required_passed = True
        mock_dep_report.checks = []
        mock_graph.check_dependencies.return_value = mock_dep_report

        blob = MagicMock()
        blob.download_as_text.return_value = json.dumps({"status": "skipped"})

        version_blob = MagicMock()
        version_blob.exists.return_value = False

        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = version_blob
        mock_bucket.list_blobs.return_value = [blob]

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.DependencyGraph", return_value=mock_graph),
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            monitor = DeploymentMonitor(project_id="test-project")
            report = monitor.get_deployment_status("instruments-service", "2024-01-01", "CEFI")

        assert report.skipped == 1

    @pytest.mark.unit
    def test_blob_read_error_counts_as_pending(self):
        mock_graph = MagicMock()
        mock_dep_report = MagicMock()
        mock_dep_report.required_passed = True
        mock_dep_report.checks = []
        mock_graph.check_dependencies.return_value = mock_dep_report

        blob = MagicMock()
        blob.download_as_text.side_effect = OSError("read error")

        version_blob = MagicMock()
        version_blob.exists.return_value = False

        mock_bucket = MagicMock()
        mock_bucket.blob.return_value = version_blob
        mock_bucket.list_blobs.return_value = [blob]

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.DependencyGraph", return_value=mock_graph),
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            monitor = DeploymentMonitor(project_id="test-project")
            report = monitor.get_deployment_status("instruments-service", "2024-01-01", "CEFI")

        # Blob read error → counted as pending
        assert report.pending == 1


class TestDeploymentMonitorGetAllServiceStatus:
    @pytest.mark.unit
    def test_iterates_all_services(self):
        mock_graph = MagicMock()
        mock_dep_report = MagicMock()
        mock_dep_report.required_passed = True
        mock_dep_report.checks = []
        mock_graph.check_dependencies.return_value = mock_dep_report

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.DependencyGraph", return_value=mock_graph),
            patch("deployment_service.monitor.ConfigLoader") as MockCL,
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True

            mock_loader = MagicMock()
            mock_loader.list_available_services.return_value = [
                "instruments-service",
                "market-tick-data-service",
            ]
            MockCL.return_value = mock_loader

            monitor = DeploymentMonitor(project_id="test-project")
            result = monitor.get_all_service_status("2024-01-01", "CEFI")

        assert "instruments-service" in result
        assert "market-tick-data-service" in result


class TestDeploymentMonitorGetAllServiceVersions:
    @pytest.mark.unit
    def test_returns_empty_dict_when_no_versions(self):
        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.ConfigLoader") as MockCL,
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True

            mock_loader = MagicMock()
            mock_loader.list_available_services.return_value = ["instruments-service"]
            MockCL.return_value = mock_loader

            monitor = DeploymentMonitor(project_id="test-project")
            result = monitor.get_all_service_versions()

        assert result == {}


class TestDeploymentMonitorGenerateStatusReport:
    @pytest.mark.unit
    def test_report_contains_header(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        report = monitor.generate_status_report({})
        assert "DEPLOYMENT STATUS REPORT" in report

    @pytest.mark.unit
    def test_report_shows_completed_services(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        r = ServiceHealthReport(
            service="instruments-service",
            date="2024-01-01",
            category="CEFI",
            total_shards=5,
            completed=5,
        )
        report = monitor.generate_status_report({"instruments-service": r})
        assert "COMPLETED" in report
        assert "instruments-service" in report

    @pytest.mark.unit
    def test_report_shows_failed_services(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        r = ServiceHealthReport(
            service="market-data",
            date="2024-01-01",
            category="CEFI",
            total_shards=3,
            failed=2,
        )
        report = monitor.generate_status_report({"market-data": r})
        assert "FAILED" in report

    @pytest.mark.unit
    def test_report_shows_blocked_services(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        r = ServiceHealthReport(
            service="ml-training",
            date="2024-01-01",
            category="CEFI",
            dependencies_met=False,
            missing_dependencies=["features-delta-one-service"],
        )
        report = monitor.generate_status_report({"ml-training": r})
        assert "BLOCKED" in report
        assert "features-delta-one-service" in report

    @pytest.mark.unit
    def test_report_shows_running_services(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        r = ServiceHealthReport(
            service="market-data-processing",
            date="2024-01-01",
            category="CEFI",
            total_shards=10,
            running=5,
            completed=3,
        )
        report = monitor.generate_status_report({"market-data-processing": r})
        assert "RUNNING" in report

    @pytest.mark.unit
    def test_report_shows_pending_services(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        r = ServiceHealthReport(
            service="strategy-service",
            date="2024-01-01",
            category="CEFI",
            total_shards=4,
            pending=4,
        )
        report = monitor.generate_status_report({"strategy-service": r})
        assert "PENDING" in report

    @pytest.mark.unit
    def test_report_summary_line_totals(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        statuses: dict[str, ServiceHealthReport] = {
            "svc-a": ServiceHealthReport(
                service="svc-a", date="2024-01-01", category="CEFI", total_shards=5, completed=5
            ),
            "svc-b": ServiceHealthReport(
                service="svc-b", date="2024-01-01", category="CEFI", total_shards=3, failed=1
            ),
        }
        report = monitor.generate_status_report(statuses)
        assert "Total:" in report
        # 1 completed, 1 failed, 2 total
        assert "1/2" in report

    @pytest.mark.unit
    def test_report_includes_version_short_commit(self):
        v = _make_version(git_commit="deadbeef12345")
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            monitor = DeploymentMonitor(project_id="test-project")

        r = ServiceHealthReport(
            service="instruments-service",
            date="2024-01-01",
            category="CEFI",
            total_shards=2,
            completed=2,
            current_version=v,
        )
        report = monitor.generate_status_report({"instruments-service": r})
        assert "deadbee" in report  # short commit


# ===========================================================================
# VersionRegistry
# ===========================================================================


class TestVersionRegistry:
    @pytest.mark.unit
    def test_client_none_in_mock_mode(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True

            reg = VersionRegistry(project_id="test-project")
            assert reg.client is None

    @pytest.mark.unit
    def test_register_version_returns_false_when_no_client(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True

            reg = VersionRegistry(project_id="test-project")
            v = _make_version()
            result = reg.register_version(v)
            assert result is False

    @pytest.mark.unit
    def test_get_version_history_empty_when_no_client(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = True

            reg = VersionRegistry(project_id="test-project")
            result = reg.get_version_history("instruments-service")
            assert result == []

    @pytest.mark.unit
    def test_register_version_uploads_to_gcs(self):
        v = _make_version()

        mock_current_blob = MagicMock()
        mock_history_blob = MagicMock()

        mock_bucket = MagicMock()
        # First call → current blob, second call → history blob
        mock_bucket.blob.side_effect = [mock_current_blob, mock_history_blob]

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            reg = VersionRegistry(project_id="test-project")
            result = reg.register_version(v)

        assert result is True
        # upload_from_string should have been called on both blobs
        mock_current_blob.upload_from_string.assert_called_once()
        mock_history_blob.upload_from_string.assert_called_once()

    @pytest.mark.unit
    def test_register_version_returns_false_on_error(self):
        mock_gcs = MagicMock()
        mock_gcs.bucket.side_effect = OSError("GCS error")

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            reg = VersionRegistry(project_id="test-project")
            v = _make_version()
            result = reg.register_version(v)

        assert result is False

    @pytest.mark.unit
    def test_get_version_history_returns_sorted_versions(self):
        v = _make_version()
        version_json = json.dumps(v.to_dict())

        blob1 = MagicMock()
        blob1.name = "versions/instruments-service/history/20240115_120000.json"
        blob1.download_as_text.return_value = version_json

        blob2 = MagicMock()
        blob2.name = "versions/instruments-service/history/20240114_120000.json"
        blob2.download_as_text.return_value = version_json

        mock_bucket = MagicMock()
        mock_bucket.list_blobs.return_value = [blob1, blob2]

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            reg = VersionRegistry(project_id="test-project")
            versions = reg.get_version_history("instruments-service", limit=10)

        assert len(versions) == 2
        assert all(isinstance(v, ServiceVersion) for v in versions)

    @pytest.mark.unit
    def test_get_version_history_limits_results(self):
        v = _make_version()
        version_json = json.dumps(v.to_dict())

        blobs = []
        for i in range(5):
            b = MagicMock()
            b.name = f"versions/instruments-service/history/2024010{i}_120000.json"
            b.download_as_text.return_value = version_json
            blobs.append(b)

        mock_bucket = MagicMock()
        mock_bucket.list_blobs.return_value = blobs

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            reg = VersionRegistry(project_id="test-project")
            versions = reg.get_version_history("instruments-service", limit=3)

        assert len(versions) == 3

    @pytest.mark.unit
    def test_get_version_history_skips_corrupt_blobs(self):
        good_blob = MagicMock()
        good_blob.name = "versions/svc/history/20240115_120000.json"
        v = _make_version()
        good_blob.download_as_text.return_value = json.dumps(v.to_dict())

        bad_blob = MagicMock()
        bad_blob.name = "versions/svc/history/20240114_120000.json"
        bad_blob.download_as_text.side_effect = OSError("corrupt")

        mock_bucket = MagicMock()
        mock_bucket.list_blobs.return_value = [good_blob, bad_blob]

        mock_gcs = MagicMock()
        mock_gcs.bucket.return_value = mock_bucket

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            reg = VersionRegistry(project_id="test-project")
            versions = reg.get_version_history("svc", limit=10)

        # Only the good blob should parse
        assert len(versions) == 1

    @pytest.mark.unit
    def test_get_version_history_gcs_error_returns_empty(self):
        mock_gcs = MagicMock()
        mock_gcs.bucket.side_effect = OSError("GCS unavailable")

        with (
            patch("deployment_service.monitor._config") as mock_cfg,
            patch("deployment_service.monitor.get_storage_client", return_value=mock_gcs),
        ):
            mock_cfg.gcp_project_id = "test-project"
            mock_cfg.is_mock_mode.return_value = False

            reg = VersionRegistry(project_id="test-project")
            result = reg.get_version_history("instruments-service")

        assert result == []

    @pytest.mark.unit
    def test_bucket_name_includes_project_id(self):
        with patch("deployment_service.monitor._config") as mock_cfg:
            mock_cfg.gcp_project_id = "my-project-abc"
            reg = VersionRegistry(project_id="my-project-abc")
            assert "my-project-abc" in reg.bucket_name
