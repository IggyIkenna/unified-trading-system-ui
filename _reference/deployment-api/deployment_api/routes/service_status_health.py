"""
Service Status Health Check Utilities

Functions for anomaly detection and health assessment.
"""

import logging
from datetime import UTC, datetime, timedelta

logger = logging.getLogger(__name__)


def detect_anomalies(
    data_timestamp: str | None,
    deployment_timestamp: str | None,
    build_timestamp: str | None,
    code_timestamp: str | None,
) -> list[dict[str, str]]:
    """
    Detect temporal anomalies in service status.

    Returns list of detected issues.
    """
    anomalies: list[dict[str, str]] = []
    now = datetime.now(UTC)

    try:
        # Parse timestamps
        data_time = datetime.fromisoformat(data_timestamp) if data_timestamp else None
        deploy_time = datetime.fromisoformat(deployment_timestamp) if deployment_timestamp else None
        build_time = datetime.fromisoformat(build_timestamp) if build_timestamp else None
        code_time = datetime.fromisoformat(code_timestamp) if code_timestamp else None

        # Anomaly 1: Stale data (no update in 24 hours)
        if data_time and (now - data_time) > timedelta(hours=24):
            age_hours = (now - data_time).total_seconds() / 3600
            anomalies.append(
                {
                    "type": "stale_data",
                    "severity": "warning" if age_hours < 48 else "error",
                    "message": f"Data not updated in {age_hours:.1f} hours",
                }
            )

        # Anomaly 2: Deployment ran but data not updated (should update within 1 hour)
        if deploy_time and data_time and (deploy_time - data_time) > timedelta(hours=1):
            anomalies.append(
                {
                    "type": "deployment_without_data",
                    "severity": "warning",
                    "message": (
                        f"Deployment ran"
                        f" {(deploy_time - data_time).total_seconds() / 3600:.1f}h"
                        " after data update"
                    ),
                }
            )

        # Anomaly 3: Code pushed but not built (should build within 30 min)
        if code_time and build_time and (code_time - build_time) > timedelta(minutes=30):
            anomalies.append(
                {
                    "type": "code_not_built",
                    "severity": "warning",
                    "message": (
                        f"Code pushed"
                        f" {(code_time - build_time).total_seconds() / 60:.0f}m"
                        " ago but not built"
                    ),
                }
            )

        # Anomaly 4: Old deployment (no deployment in 7 days)
        if deploy_time and (now - deploy_time) > timedelta(days=7):
            age_days = (now - deploy_time).days
            anomalies.append(
                {
                    "type": "no_recent_deployment",
                    "severity": "info",
                    "message": f"No deployment in {age_days} days",
                }
            )

    except (OSError, ValueError, RuntimeError) as e:
        logger.error("Error detecting anomalies: %s", e)

    return anomalies


def _parse_ts(ts: str) -> datetime:
    """Parse timestamp string to timezone-aware datetime."""
    ts = ts.replace("Z", "+00:00")
    dt = datetime.fromisoformat(ts)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    return dt


def _health_from_deploy_status(deploy_status_lower: str) -> str | None:
    """Map normalized deploy status to health string, or None to fall through."""
    mapping = {
        "completed": "healthy",
        "running": "warning",
        "failed": "error",
        "cancelled": "warning",
        "partial": "warning",
    }
    return mapping.get(deploy_status_lower)


def _apply_anomaly_health(anomalies: list[dict[str, str]]) -> str:
    """Return health downgrade from anomalies, defaulting to 'healthy'."""
    if any(a["severity"] == "error" for a in anomalies):
        return "error"
    if any(a["severity"] == "warning" for a in anomalies):
        return "warning"
    return "healthy"


def _health_from_data_age(data_ts: str) -> str:
    """Compute health string from data timestamp age."""
    try:
        data_time = _parse_ts(data_ts)
        data_age = datetime.now(UTC) - data_time
        if data_age < timedelta(hours=24):
            return "healthy"
        if data_age < timedelta(hours=48):
            return "warning"
        return "stale"
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Error parsing data timestamp: %s", e)
        return "unknown"


def _apply_deploy_health(
    deploy_ts: str, deploy_status: str | None, anomalies: list[dict[str, str]], now: datetime
) -> str:
    """Determine health based on deployment status and age."""
    try:
        deploy_time = _parse_ts(deploy_ts)
        deploy_age = now - deploy_time
        if deploy_age < timedelta(days=7) and deploy_status:
            mapped = _health_from_deploy_status(str(deploy_status).lower())
            if mapped is not None:
                return mapped
        if deploy_age >= timedelta(days=7):
            return _apply_anomaly_health(anomalies)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Error parsing deployment timestamp: %s", e)
    return "healthy"


def determine_service_health(
    data_ts: str | None,
    deploy_ts: str | None,
    deploy_status: str | None,
    build_status: str | None,
    anomalies: list[dict[str, str]],
) -> str:
    """
    Determine overall health status for a service.

    Returns: "healthy", "warning", "error", "stale", "build_failed", or "unknown"
    """
    now = datetime.now(UTC)

    # First+third priority: deployment status + anomaly fallback
    if deploy_ts:
        health = _apply_deploy_health(deploy_ts, deploy_status, anomalies, now)
    else:
        health = _apply_anomaly_health(anomalies)

    # Second priority: Build failures override deployment status
    if build_status == "FAILURE":
        health = "build_failed"

    # Fourth priority: Data freshness fallback (only when no deployment info)
    if health == "healthy" and data_ts and not deploy_ts:
        health = _health_from_data_age(data_ts)

    return health


def determine_overview_health(
    data_ts: str | None,
    deploy_ts: str | None,
    deploy_status: str | None,
    build_status: str | None,
) -> str:
    """
    Determine health for overview display (simplified logic).

    Returns: "healthy", "warning", "error", "stale", "build_failed", or "unknown"
    """
    health = "unknown"
    now = datetime.now(UTC)

    # First check: If there's a recent successful deployment (within 7 days), mark as healthy
    if deploy_ts and deploy_status:
        try:
            deploy_time = _parse_ts(deploy_ts)
            deploy_age = now - deploy_time
            if deploy_age < timedelta(days=7):
                deploy_status_lower = str(deploy_status).lower()
                mapped = _health_from_deploy_status(deploy_status_lower)
                if mapped is not None:
                    health = mapped
            elif data_ts:
                health = _health_from_data_age(data_ts)
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Error parsing deployment timestamp: %s", e)

    # Second check: If no deployment info, check data freshness
    elif data_ts:
        health = _health_from_data_age(data_ts)

    # Third check: Build failures override everything
    if build_status == "FAILURE":
        health = "build_failed"

    return health
