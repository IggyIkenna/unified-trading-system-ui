"""Secret Rotation Cloud Function — PCI DSS §8.3.9 compliance.

Triggered daily by Cloud Scheduler. Scans all exchange API keys in Secret
Manager and flags any that have not been rotated within the policy window.

Rotation windows (configurable via env vars):
  - TRADE_KEY_MAX_AGE_DAYS     Trade/execution keys — default 90 days
  - DATA_KEY_MAX_AGE_DAYS      Data vendor keys — default 180 days
  - WARN_BEFORE_DAYS           Warn this many days before expiry — default 14

Labels convention: each Secret Manager secret should carry:
  labels:
    key_category: trade | data | infra
    last_rotated: YYYY-MM-DD   (set by this function or manually on rotation)
    service: <owning-service>

The function:
1. Lists all secrets in the project tagged with key_category
2. Checks days since last_rotated label
3. Publishes a PCI_KEY_ROTATION_REQUIRED event for overdue keys
4. Logs a SECRET_ROTATION_ALERT event per unified-trading-codex lifecycle events
5. Returns a JSON summary for Cloud Logging

Deployment:
  gcloud functions deploy rotate-exchange-keys \\
    --gen2 --runtime python313 --trigger-http \\
    --entry-point rotate_exchange_keys \\
    --region us-central1 \\
    --service-account secret-rotator@PROJECT.iam.gserviceaccount.com \\
    --set-env-vars PROJECT_ID=PROJECT,ALERT_TOPIC=secret-rotation-alerts

IAM required:
  secretmanager.secrets.list
  secretmanager.secrets.get
  secretmanager.secrets.update    (to write last_rotated label on rotation)
  pubsub.topics.publish
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, date, datetime

import flask
import functions_framework
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from unified_cloud_interface import get_pubsub_client, get_secret_client
from unified_events_interface import log_event, setup_events

logger = logging.getLogger(__name__)


class _RotationConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")

    trade_key_max_age_days: int = Field(default=90, validation_alias="TRADE_KEY_MAX_AGE_DAYS")
    data_key_max_age_days: int = Field(default=180, validation_alias="DATA_KEY_MAX_AGE_DAYS")
    warn_before_days: int = Field(default=14, validation_alias="WARN_BEFORE_DAYS")
    project_id: str = Field(default="", validation_alias="PROJECT_ID")
    alert_topic: str = Field(default="secret-rotation-alerts", validation_alias="ALERT_TOPIC")


_config = _RotationConfig()
_TRADE_MAX_DAYS = _config.trade_key_max_age_days
_DATA_MAX_DAYS = _config.data_key_max_age_days
_WARN_BEFORE = _config.warn_before_days
_PROJECT_ID = _config.project_id
_ALERT_TOPIC = _config.alert_topic

# Exchange keys that require mandatory 90-day rotation (PCI DSS §8.3.9)
# Data vendor / read-only keys are lower risk → 180-day window
_TRADE_KEY_PATTERNS = frozenset(
    [
        "binance-api-key",
        "binance-api-secret",
        "bybit-api-key",
        "bybit-api-secret",
        "deribit-api-key",
        "deribit-api-secret",
        "kraken-api-key",
        "kraken-api-secret",
        "okx-api-key",
        "okx-api-secret",
        "coinbase-api-key",
        "coinbase-api-secret",
        "betfair-session-token",
        "kalshi-api-key",
        "bloxroute-api-key",
    ]
)

_DATA_KEY_PATTERNS = frozenset(
    [
        "tardis-api-key",
        "databento-api-key",
        "glassnode-api-key",
        "thegraph-api-key",
        "alchemy-api-key",
        "coinglass-api-key",
        "arkham-api-key",
        "odds-api-key",
        "pinnacle-api-key",
        "aws-hyperliquid-s3",
    ]
)


def _max_age_days(secret_name: str, category_label: str | None) -> int:
    """Return max rotation age in days for a secret."""
    if category_label == "trade":
        return _TRADE_MAX_DAYS
    if category_label == "data":
        return _DATA_MAX_DAYS
    # Infer from name if label missing
    name_lower = secret_name.lower()
    for pattern in _TRADE_KEY_PATTERNS:
        if pattern in name_lower:
            return _TRADE_MAX_DAYS
    for pattern in _DATA_KEY_PATTERNS:
        if pattern in name_lower:
            return _DATA_MAX_DAYS
    return _TRADE_MAX_DAYS  # conservative default


def _days_since_rotation(labels: dict[str, str]) -> int | None:
    """Return days since last_rotated label, or None if label absent."""
    last_rotated_str = labels.get("last_rotated")
    if not last_rotated_str:
        return None
    try:
        last_rotated = date.fromisoformat(last_rotated_str)
        return (date.today() - last_rotated).days
    except ValueError:
        logger.warning("Invalid last_rotated label value: %s", last_rotated_str)
        return None


def _publish_alert(pubsub_client, topic: str, payload: dict[str, object]) -> None:
    """Publish rotation alert to PubSub topic (non-blocking on failure)."""
    try:
        data = json.dumps(payload).encode("utf-8")
        pubsub_client.publish(topic, data)
    except (OSError, RuntimeError, ValueError) as e:
        logger.warning("Failed to publish rotation alert: %s", e)


@functions_framework.http
def rotate_exchange_keys(request: flask.Request) -> flask.Response:
    """Cloud Function entry point — HTTP trigger (called by Cloud Scheduler)."""
    if not _PROJECT_ID:
        return flask.make_response(json.dumps({"error": "PROJECT_ID not set"}), 500)

    setup_events(service_name="rotate-exchange-keys", mode="batch", sink=None)

    sm_client = get_secret_client(provider="gcp", project_id=_PROJECT_ID)
    pubsub_client = get_pubsub_client(provider="gcp", project_id=_PROJECT_ID)
    today = date.today()

    overdue: list[dict[str, object]] = []
    warning: list[dict[str, object]] = []
    unknown_age: list[str] = []
    ok_count = 0
    scanned = 0

    for secret_name in sm_client.list_secrets():
        # Only process known exchange/api key secrets
        all_patterns = _TRADE_KEY_PATTERNS | _DATA_KEY_PATTERNS
        if not any(p in secret_name for p in all_patterns):
            continue

        scanned += 1
        metadata = sm_client.get_secret_metadata(secret_name)
        log_event(
            "SECRET_ACCESSED",
            details={
                "secret_name": secret_name,
                "service": "rotate-exchange-keys",
                "accessor": "rotate_exchange_keys",
                "project": _PROJECT_ID,
            },
        )
        labels: dict[str, str] = (metadata.labels or {}) if metadata else {}
        category = labels.get("key_category")
        max_age = _max_age_days(secret_name, category)
        days_old = _days_since_rotation(labels)

        if days_old is None:
            # No rotation date tracked — flag for manual inspection
            unknown_age.append(secret_name)
            _publish_alert(
                pubsub_client,
                _ALERT_TOPIC,
                {
                    "event_type": "SECRET_ROTATION_UNKNOWN_AGE",
                    "secret": secret_name,
                    "project": _PROJECT_ID,
                    "timestamp": today.isoformat(),
                    "message": (
                        f"Secret {secret_name!r} has no last_rotated label."
                        " Add label or rotate immediately."
                    ),
                    "severity": "WARNING",
                },
            )
            continue

        if days_old >= max_age:
            record = {
                "secret": secret_name,
                "days_old": days_old,
                "max_age_days": max_age,
                "category": category or "inferred",
                "overdue_by_days": days_old - max_age,
            }
            overdue.append(record)
            logger.warning(
                "SECRET_ROTATION_REQUIRED: %s is %d days old (max %d)",
                secret_name,
                days_old,
                max_age,
            )
            _publish_alert(
                pubsub_client,
                _ALERT_TOPIC,
                {
                    "event_type": "SECRET_ROTATION_REQUIRED",
                    "severity": "ERROR",
                    "timestamp": today.isoformat(),
                    **record,
                },
            )
        elif days_old >= (max_age - _WARN_BEFORE):
            days_until_due = max_age - days_old
            record = {
                "secret": secret_name,
                "days_old": days_old,
                "max_age_days": max_age,
                "days_until_due": days_until_due,
                "category": category or "inferred",
            }
            warning.append(record)
            logger.info("SECRET_ROTATION_WARNING: %s due in %d days", secret_name, days_until_due)
            _publish_alert(
                pubsub_client,
                _ALERT_TOPIC,
                {
                    "event_type": "SECRET_ROTATION_WARNING",
                    "severity": "WARNING",
                    "timestamp": today.isoformat(),
                    **record,
                },
            )
        else:
            ok_count += 1

    summary = {
        "timestamp": datetime.now(UTC).isoformat(),
        "project": _PROJECT_ID,
        "scanned": scanned,
        "ok": ok_count,
        "warning": len(warning),
        "overdue": len(overdue),
        "unknown_age": len(unknown_age),
        "overdue_secrets": overdue,
        "warning_secrets": warning,
        "unknown_age_secrets": unknown_age,
    }

    logger.info(
        "SECRET_ROTATION_SCAN_COMPLETE: scanned=%d ok=%d warning=%d overdue=%d unknown=%d",
        scanned,
        ok_count,
        len(warning),
        len(overdue),
        len(unknown_age),
    )

    status_code = 200 if not overdue else 207  # 207 Multi-Status signals partial issues
    return flask.make_response(json.dumps(summary), status_code)
