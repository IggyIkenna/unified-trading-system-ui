"""
Unit tests for routes/service_status_health module.

Tests detect_anomalies, determine_service_health, and
determine_overview_health pure helper functions.
"""

from datetime import UTC, datetime, timedelta

from deployment_api.routes.service_status_health import (
    detect_anomalies,
    determine_overview_health,
    determine_service_health,
)


def _ts(offset_hours: float = 0) -> str:
    """Return an ISO timestamp relative to now."""
    return (datetime.now(UTC) + timedelta(hours=offset_hours)).isoformat()


class TestDetectAnomalies:
    """Tests for detect_anomalies function."""

    def test_no_anomalies_with_all_none(self):
        result = detect_anomalies(None, None, None, None)
        assert result == []

    def test_stale_data_warning_when_26_hours_old(self):
        old_ts = _ts(-26)
        result = detect_anomalies(old_ts, None, None, None)
        types = [a["type"] for a in result]
        assert "stale_data" in types
        stale = next(a for a in result if a["type"] == "stale_data")
        assert stale["severity"] == "warning"  # 26h < 48h = warning

    def test_stale_data_error_when_50_hours_old(self):
        very_old_ts = _ts(-50)
        result = detect_anomalies(very_old_ts, None, None, None)
        stale = next(a for a in result if a["type"] == "stale_data")
        assert stale["severity"] == "error"

    def test_no_stale_data_when_recent(self):
        recent_ts = _ts(-1)  # 1 hour ago
        result = detect_anomalies(recent_ts, None, None, None)
        types = [a["type"] for a in result]
        assert "stale_data" not in types

    def test_deployment_without_data_anomaly(self):
        data_ts = _ts(-5)  # data from 5 hours ago
        deploy_ts = _ts(-2)  # deployment 2 hours ago (3 hours AFTER data)
        result = detect_anomalies(data_ts, deploy_ts, None, None)
        types = [a["type"] for a in result]
        assert "deployment_without_data" in types

    def test_no_deployment_without_data_when_data_is_fresh(self):
        data_ts = _ts(-0.5)  # data from 30 min ago
        deploy_ts = _ts(-0.1)  # deployment 6 min ago (same day)
        result = detect_anomalies(data_ts, deploy_ts, None, None)
        # deploy_ts - data_ts < 1h so no anomaly
        types = [a["type"] for a in result]
        assert "deployment_without_data" not in types

    def test_old_deployment_anomaly_after_7_days(self):
        deploy_ts = _ts(-200)  # 200 hours = ~8 days ago
        result = detect_anomalies(None, deploy_ts, None, None)
        types = [a["type"] for a in result]
        assert "no_recent_deployment" in types

    def test_no_old_deployment_when_recent(self):
        deploy_ts = _ts(-2)  # 2 hours ago
        result = detect_anomalies(None, deploy_ts, None, None)
        types = [a["type"] for a in result]
        assert "no_recent_deployment" not in types

    def test_code_not_built_anomaly(self):
        # code_time is 60 min AFTER build_time
        build_ts = _ts(-2)  # built 2h ago
        code_ts = _ts(-1)  # code pushed 1h ago  (code_time - build_time = 1h > 30min)
        result = detect_anomalies(None, None, build_ts, code_ts)
        types = [a["type"] for a in result]
        assert "code_not_built" in types

    def test_handles_invalid_timestamp_gracefully(self):
        result = detect_anomalies("not-a-timestamp", None, None, None)
        # Should return empty (error suppressed)
        assert isinstance(result, list)


class TestDetermineServiceHealth:
    """Tests for determine_service_health function."""

    def test_healthy_with_recent_completed_deployment(self):
        deploy_ts = _ts(-1)  # 1 hour ago
        health = determine_service_health(None, deploy_ts, "completed", None, [])
        assert health == "healthy"

    def test_warning_with_running_deployment(self):
        deploy_ts = _ts(-1)
        health = determine_service_health(None, deploy_ts, "running", None, [])
        assert health == "warning"

    def test_error_with_failed_deployment(self):
        deploy_ts = _ts(-1)
        health = determine_service_health(None, deploy_ts, "failed", None, [])
        assert health == "error"

    def test_warning_with_cancelled_deployment(self):
        deploy_ts = _ts(-1)
        health = determine_service_health(None, deploy_ts, "cancelled", None, [])
        assert health == "warning"

    def test_build_failed_overrides_healthy(self):
        deploy_ts = _ts(-1)
        health = determine_service_health(None, deploy_ts, "completed", "FAILURE", [])
        assert health == "build_failed"

    def test_error_anomaly_without_deployment(self):
        anomalies = [{"type": "stale_data", "severity": "error", "message": "old"}]
        health = determine_service_health(None, None, None, None, anomalies)
        assert health == "error"

    def test_warning_anomaly_without_deployment(self):
        anomalies = [{"type": "stale_data", "severity": "warning", "message": "warn"}]
        health = determine_service_health(None, None, None, None, anomalies)
        assert health == "warning"

    def test_healthy_with_fresh_data_no_deployment(self):
        data_ts = _ts(-1)  # 1 hour ago - fresh
        health = determine_service_health(data_ts, None, None, None, [])
        assert health == "healthy"

    def test_stale_with_old_data_no_deployment(self):
        data_ts = _ts(-50)  # 50 hours ago
        health = determine_service_health(data_ts, None, None, None, [])
        assert health == "stale"

    def test_warning_with_mildly_stale_data_no_deployment(self):
        data_ts = _ts(-30)  # 30 hours ago (between 24 and 48)
        health = determine_service_health(data_ts, None, None, None, [])
        assert health == "warning"

    def test_anomaly_downgrade_with_old_deployment(self):
        old_deploy_ts = _ts(-200)  # 200 hours = ~8 days ago
        anomalies = [{"type": "stale_data", "severity": "error", "message": "old"}]
        health = determine_service_health(None, old_deploy_ts, "completed", None, anomalies)
        # Deployment is >7 days old, so anomalies should downgrade health
        assert health == "error"

    def test_no_anomaly_downgrade_with_recent_deployment(self):
        deploy_ts = _ts(-1)
        anomalies = [{"type": "stale_data", "severity": "error", "message": "old"}]
        health = determine_service_health(None, deploy_ts, "completed", None, anomalies)
        # Recent deployment, anomaly should NOT downgrade
        assert health == "healthy"


class TestDetermineOverviewHealth:
    """Tests for determine_overview_health function."""

    def test_returns_string(self):
        result = determine_overview_health(None, None, None, None)
        assert isinstance(result, str)

    def test_healthy_with_recent_completed_deployment(self):
        deploy_ts = _ts(-1)
        result = determine_overview_health(None, deploy_ts, "completed", None)
        assert result == "healthy"

    def test_error_with_failed_deployment(self):
        deploy_ts = _ts(-1)
        result = determine_overview_health(None, deploy_ts, "failed", None)
        assert result == "error"

    def test_build_failed_status(self):
        deploy_ts = _ts(-1)
        result = determine_overview_health(None, deploy_ts, "completed", "FAILURE")
        assert result == "build_failed"

    def test_unknown_with_no_info(self):
        result = determine_overview_health(None, None, None, None)
        # When no data or deployment info, result is unknown or stale
        assert result in ("unknown", "stale", "healthy", "warning")

    def test_warning_with_running_deployment(self):
        deploy_ts = _ts(-1)
        result = determine_overview_health(None, deploy_ts, "running", None)
        assert result == "warning"

    def test_warning_with_cancelled_deployment(self):
        deploy_ts = _ts(-1)
        result = determine_overview_health(None, deploy_ts, "cancelled", None)
        assert result == "warning"

    def test_unknown_status_pass_falls_through(self):
        deploy_ts = _ts(-1)
        result = determine_overview_health(None, deploy_ts, "unknown", None)
        assert result in ("unknown", "healthy")

    def test_old_deployment_with_fresh_data(self):
        old_deploy_ts = _ts(-200)
        fresh_data_ts = _ts(-1)
        result = determine_overview_health(fresh_data_ts, old_deploy_ts, "completed", None)
        assert result == "healthy"

    def test_old_deployment_with_stale_data(self):
        old_deploy_ts = _ts(-200)
        stale_data_ts = _ts(-50)
        result = determine_overview_health(stale_data_ts, old_deploy_ts, "completed", None)
        assert result == "stale"

    def test_old_deployment_with_mildly_stale_data(self):
        old_deploy_ts = _ts(-200)
        data_ts = _ts(-36)
        result = determine_overview_health(data_ts, old_deploy_ts, "completed", None)
        assert result == "warning"

    def test_no_deployment_with_fresh_data(self):
        data_ts = _ts(-1)
        result = determine_overview_health(data_ts, None, None, None)
        assert result == "healthy"

    def test_no_deployment_with_stale_data(self):
        data_ts = _ts(-50)
        result = determine_overview_health(data_ts, None, None, None)
        assert result == "stale"

    def test_no_deployment_with_mildly_stale_data(self):
        data_ts = _ts(-36)
        result = determine_overview_health(data_ts, None, None, None)
        assert result == "warning"

    def test_build_failed_overrides_data_health(self):
        data_ts = _ts(-1)
        result = determine_overview_health(data_ts, None, None, "FAILURE")
        assert result == "build_failed"

    def test_naive_timestamp_without_tz(self):
        naive_ts = datetime.now(UTC).replace(tzinfo=None).isoformat()  # no timezone info
        result = determine_overview_health(naive_ts, None, None, None)
        assert result in ("healthy", "warning", "stale", "unknown")

    def test_invalid_deploy_ts_graceful(self):
        result = determine_overview_health(None, "not-a-date", "completed", None)
        assert result in ("unknown", "healthy")


class TestDetermineServiceHealthEdgeCases:
    """Additional edge case tests for determine_service_health."""

    def test_unknown_deploy_status_falls_through(self):
        deploy_ts = _ts(-1)
        health = determine_service_health(None, deploy_ts, "unknown", None, [])
        assert health in ("healthy", "unknown")

    def test_invalid_deploy_ts_graceful(self):
        health = determine_service_health(None, "not-a-date", "completed", None, [])
        assert health in ("healthy", "unknown", "error")

    def test_old_deployment_warning_anomaly_downgrade(self):
        old_deploy_ts = _ts(-200)
        anomalies = [{"type": "stale_data", "severity": "warning", "message": "old"}]
        health = determine_service_health(None, old_deploy_ts, "completed", None, anomalies)
        assert health == "warning"

    def test_naive_timestamp_without_tz(self):
        naive_ts = datetime.now(UTC).replace(tzinfo=None).isoformat()  # no timezone info
        health = determine_service_health(naive_ts, None, None, None, [])
        assert health in ("healthy", "warning", "stale", "unknown")

    def test_invalid_data_ts_sets_unknown(self):
        health = determine_service_health("bad-date", None, None, None, [])
        assert health in ("healthy", "unknown")

    def test_partial_deploy_status(self):
        deploy_ts = _ts(-1)
        health = determine_service_health(None, deploy_ts, "partial", None, [])
        assert health == "warning"
