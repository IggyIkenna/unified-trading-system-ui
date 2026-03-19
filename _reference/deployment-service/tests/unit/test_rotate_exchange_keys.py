"""Unit tests for rotate-exchange-keys Cloud Function."""

from __future__ import annotations

import json
import sys
from datetime import date, timedelta
from pathlib import Path
from unittest.mock import MagicMock, patch

import flask as _flask

# Ensure the Cloud Function's directory is on sys.path so `import main` works
# across all pytest-xdist worker processes regardless of execution order.
_CF_DIR = str(Path(__file__).parent.parent.parent / "functions" / "rotate-exchange-keys")
if _CF_DIR not in sys.path:
    sys.path.insert(0, _CF_DIR)

# Flask app used to provide application context for flask.make_response() calls
# inside the rotate_exchange_keys Cloud Function during unit tests.
_TEST_APP = _flask.Flask(__name__)


def _make_secret(name: str, labels: dict[str, str]) -> tuple[str, MagicMock]:
    """Helper to create a (secret_name, metadata_mock) pair.

    Returns a tuple of (name: str, metadata: MagicMock with .labels) for use
    with the UCI-aware _run_function mock setup.
    """
    metadata = MagicMock()
    metadata.labels = labels
    return name, metadata


class TestMaxAgeDays:
    def test_trade_category_returns_trade_max(self):
        import sys

        sys.path.insert(
            0,
            "/Users/ikennaigboaka/Code/unified-trading-system-repos/deployment-service/functions/rotate-exchange-keys",
        )
        import importlib

        import main as m

        importlib.reload(m)
        assert m._max_age_days("any-secret", "trade") == m._TRADE_MAX_DAYS

    def test_data_category_returns_data_max(self):
        import sys

        sys.path.insert(
            0,
            "/Users/ikennaigboaka/Code/unified-trading-system-repos/deployment-service/functions/rotate-exchange-keys",
        )
        import main as m

        assert m._max_age_days("any-secret", "data") == m._DATA_MAX_DAYS

    def test_infer_trade_from_name(self):
        import main as m

        result = m._max_age_days("binance-api-key", None)
        assert result == m._TRADE_MAX_DAYS

    def test_infer_data_from_name(self):
        import main as m

        result = m._max_age_days("tardis-api-key", None)
        assert result == m._DATA_MAX_DAYS

    def test_conservative_default_for_unknown(self):
        import main as m

        result = m._max_age_days("unknown-key-xyz", None)
        assert result == m._TRADE_MAX_DAYS  # conservative


class TestDaysSinceRotation:
    def test_returns_days_since_date(self):
        import main as m

        last = (date.today() - timedelta(days=30)).isoformat()
        result = m._days_since_rotation({"last_rotated": last})
        assert result == 30

    def test_returns_none_when_label_missing(self):
        import main as m

        result = m._days_since_rotation({})
        assert result is None

    def test_returns_none_for_invalid_date_string(self):
        import main as m

        result = m._days_since_rotation({"last_rotated": "not-a-date"})
        assert result is None


class TestPublishAlert:
    def test_publishes_json_payload(self):
        import main as m

        mock_publisher = MagicMock()
        mock_publisher.publish.return_value = MagicMock()

        payload = {"event_type": "SECRET_ROTATION_REQUIRED", "secret": "binance-api-key"}
        # _publish_alert(pubsub_client, topic, payload) — 3 args (UCI style)
        m._publish_alert(mock_publisher, "secret-rotation-alerts", payload)

        mock_publisher.publish.assert_called_once()
        call_args = mock_publisher.publish.call_args
        # pubsub_client.publish(topic, data) — topic is positional arg 0
        assert call_args[0][0] == "secret-rotation-alerts"
        # data is positional arg 1 — raw bytes
        data = json.loads(call_args[0][1].decode("utf-8"))
        assert data["event_type"] == "SECRET_ROTATION_REQUIRED"

    def test_does_not_raise_on_publish_failure(self):
        import main as m

        mock_publisher = MagicMock()
        mock_publisher.publish.side_effect = OSError("pubsub down")

        # Should not raise
        m._publish_alert(mock_publisher, "secret-rotation-alerts", {"key": "value"})


class TestRotateExchangeKeys:
    def _run_function(
        self,
        secrets: list[tuple[str, MagicMock]],
        env_overrides: dict | None = None,
    ):
        """Run the Cloud Function with mocked UCI dependencies.

        secrets: list of (secret_name, metadata_mock) tuples from _make_secret().
        All UCI clients are replaced with MagicMock via patch.object after reload.
        """
        import sys

        sys.path.insert(
            0,
            "/Users/ikennaigboaka/Code/unified-trading-system-repos/deployment-service/functions/rotate-exchange-keys",
        )

        env = {"PROJECT_ID": "test-project", "ALERT_TOPIC": "secret-rotation-alerts"}
        if env_overrides:
            env.update(env_overrides)

        # Build name→metadata lookup for get_secret_metadata side_effect
        secret_names = [name for name, _ in secrets]
        metadata_map = {name: meta for name, meta in secrets}

        mock_sm = MagicMock()
        mock_sm.list_secrets.return_value = secret_names
        mock_sm.get_secret_metadata.side_effect = lambda name: metadata_map.get(name)

        mock_pub = MagicMock()
        mock_pub.publish.return_value = MagicMock()

        with patch.dict("os.environ", env):
            import importlib

            import main as m

            importlib.reload(m)

            # Patch AFTER reload: reload re-runs `from unified_cloud_interface import ...`
            # and `from unified_events_interface import ...`, which rebinds module-level
            # names, so patches must be applied post-reload.
            with (
                patch.object(m, "get_secret_client", return_value=mock_sm),
                patch.object(m, "get_pubsub_client", return_value=mock_pub),
                patch.object(m, "setup_events"),
                patch.object(m, "log_event"),
            ):
                mock_request = MagicMock()
                with _TEST_APP.app_context():
                    response = m.rotate_exchange_keys(mock_request)
                return response, mock_pub

    def test_returns_500_without_project_id(self):
        import sys

        sys.path.insert(
            0,
            "/Users/ikennaigboaka/Code/unified-trading-system-repos/deployment-service/functions/rotate-exchange-keys",
        )

        with patch.dict("os.environ", {"PROJECT_ID": ""}):
            import importlib

            import main as m

            importlib.reload(m)
            mock_request = MagicMock()
            with _TEST_APP.app_context():
                response = m.rotate_exchange_keys(mock_request)
            assert response.status_code == 500
            body = json.loads(response.get_data())
            assert "error" in body

    def test_ok_secret_not_counted_as_overdue(self):
        last = (date.today() - timedelta(days=10)).isoformat()
        secret = _make_secret("binance-api-key", {"key_category": "trade", "last_rotated": last})
        response, _ = self._run_function([secret])

        body = json.loads(response.get_data())
        assert body["ok"] == 1
        assert body["overdue"] == 0
        assert body["warning"] == 0
        assert response.status_code == 200

    def test_overdue_secret_triggers_alert_and_207(self):
        last = (date.today() - timedelta(days=100)).isoformat()  # > 90 days
        secret = _make_secret("binance-api-key", {"key_category": "trade", "last_rotated": last})
        response, mock_pub = self._run_function([secret])

        body = json.loads(response.get_data())
        assert body["overdue"] == 1
        assert len(body["overdue_secrets"]) == 1
        assert body["overdue_secrets"][0]["secret"] == "binance-api-key"
        assert response.status_code == 207
        mock_pub.publish.assert_called()

    def test_warning_secret_triggers_warning_alert(self):
        last = (date.today() - timedelta(days=80)).isoformat()  # 80 days, warn at 90-14=76
        secret = _make_secret("binance-api-key", {"key_category": "trade", "last_rotated": last})
        response, mock_pub = self._run_function([secret])

        body = json.loads(response.get_data())
        assert body["warning"] == 1
        assert body["overdue"] == 0
        assert response.status_code == 200
        mock_pub.publish.assert_called()

    def test_unknown_age_secret_flagged(self):
        secret = _make_secret("binance-api-key", {"key_category": "trade"})  # no last_rotated
        response, mock_pub = self._run_function([secret])

        body = json.loads(response.get_data())
        assert body["unknown_age"] == 1
        assert "binance-api-key" in body["unknown_age_secrets"]
        mock_pub.publish.assert_called()

    def test_ignores_non_exchange_secrets(self):
        """Secrets not matching any known pattern are skipped."""
        secret = _make_secret("some-internal-config", {"key_category": "infra"})
        response, _ = self._run_function([secret])

        body = json.loads(response.get_data())
        assert body["scanned"] == 0

    def test_data_key_uses_180_day_window(self):
        last = (date.today() - timedelta(days=150)).isoformat()  # < 180 days, still ok
        secret = _make_secret("tardis-api-key", {"key_category": "data", "last_rotated": last})
        response, _ = self._run_function([secret])

        body = json.loads(response.get_data())
        assert body["ok"] == 1
        assert body["overdue"] == 0

    def test_summary_counts_are_correct_multi_secrets(self):
        ok_last = (date.today() - timedelta(days=5)).isoformat()
        overdue_last = (date.today() - timedelta(days=100)).isoformat()
        warn_last = (date.today() - timedelta(days=80)).isoformat()

        secrets = [
            _make_secret("binance-api-key", {"key_category": "trade", "last_rotated": ok_last}),
            _make_secret("bybit-api-key", {"key_category": "trade", "last_rotated": overdue_last}),
            _make_secret("kraken-api-key", {"key_category": "trade", "last_rotated": warn_last}),
            _make_secret("tardis-api-key", {"key_category": "data"}),  # unknown age
        ]
        response, _ = self._run_function(secrets)
        body = json.loads(response.get_data())
        assert body["scanned"] == 4
        assert body["ok"] == 1
        assert body["overdue"] == 1
        assert body["warning"] == 1
        assert body["unknown_age"] == 1
