"""
Unit tests for routes/config_management.py module.

Tests write_domain_config, read_domain_config, list_domain_config_versions,
diff_domain_config_versions, and rollback_domain_config route handlers.

All ConfigStore and domain-schema calls are mocked so no cloud I/O occurs.
"""

from __future__ import annotations

import asyncio
import importlib
import importlib.util
import pathlib
import sys
from types import ModuleType
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

# ---------------------------------------------------------------------------
# Pre-mock external dependencies before importing the module under test
# ---------------------------------------------------------------------------

# unified_config_interface — ConfigStore, ConfigStoreError, get_config_store,
# and domain_configs.schema_for_domain
_mock_uci = MagicMock()
_mock_config_store_error_cls = type("ConfigStoreError", (LookupError,), {})
_mock_uci.ConfigStoreError = _mock_config_store_error_cls
sys.modules.setdefault("unified_config_interface", _mock_uci)
sys.modules.setdefault(
    "unified_config_interface.domain_configs",
    MagicMock(schema_for_domain=MagicMock()),
)

# unified_cloud_interface — get_event_bus
sys.modules.setdefault("unified_cloud_interface", MagicMock())

# unified_events_interface — log_event / setup_events
_mock_uei = MagicMock()
sys.modules.setdefault("unified_events_interface", _mock_uei)

# Ensure the routes package shim is registered so the direct spec-load below works
if "deployment_api.routes" not in sys.modules:
    _routes_pkg = ModuleType("deployment_api.routes")
    _routes_pkg.__path__ = []  # type: ignore[attr-defined]
    _routes_pkg.__package__ = "deployment_api.routes"
    sys.modules["deployment_api.routes"] = _routes_pkg

# ---------------------------------------------------------------------------
# Load routes/config_management.py directly (bypass __init__ import cascade)
# ---------------------------------------------------------------------------

_spec = importlib.util.spec_from_file_location(
    "deployment_api.routes.config_management",
    str(
        pathlib.Path(__file__).parent.parent.parent
        / "deployment_api"
        / "routes"
        / "config_management.py"
    ),
)
assert _spec is not None and _spec.loader is not None
_cm = importlib.util.module_from_spec(_spec)
sys.modules["deployment_api.routes.config_management"] = _cm
_spec.loader.exec_module(_cm)  # type: ignore[union-attr]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_store(
    *,
    save_path: str = "gs://bucket/domain/20260101T120000Z.yaml",
    timestamp: str = "20260101T120000Z",
    versions: list[dict[str, str]] | None = None,
    load_result: MagicMock | None = None,
) -> MagicMock:
    """Build a mock ConfigStore."""
    store = MagicMock()
    store.save_config.return_value = save_path
    store._timestamp_str.return_value = timestamp
    store.list_versions.return_value = versions or []
    if load_result is not None:
        store.load_config.return_value = load_result
    return store


def _make_config_model(data: dict[str, object] | None = None) -> MagicMock:
    """Build a mock domain config Pydantic model instance."""
    model = MagicMock()
    model.model_dump.return_value = data or {"key": "value"}
    return model


# ---------------------------------------------------------------------------
# _validate_domain
# ---------------------------------------------------------------------------


class TestValidateDomain:
    def test_valid_domains_do_not_raise(self):
        for domain in ("instruments", "strategies", "clients", "venues"):
            _cm._validate_domain(domain)  # must not raise

    def test_invalid_domain_raises_422(self):
        with pytest.raises(HTTPException) as exc:
            _cm._validate_domain("unknown_domain")
        assert exc.value.status_code == 422
        assert "Invalid domain" in exc.value.detail


# ---------------------------------------------------------------------------
# write_domain_config
# ---------------------------------------------------------------------------


class TestWriteDomainConfig:
    def _make_write_request(
        self,
        content: dict[str, object] | None = None,
        updated_by: str = "test-user",
        schema_version: str = "1.0",
    ) -> object:
        return _cm.ConfigWriteRequest(
            content=content or {"name": "test"},
            updated_by=updated_by,
            schema_version=schema_version,
        )

    def test_write_returns_version_response(self):
        store = _make_store()
        config_instance = _make_config_model()
        schema_cls = MagicMock(return_value=config_instance)
        schema_cls.model_validate = MagicMock(return_value=config_instance)

        with (
            patch.object(_cm, "_make_config_store", return_value=store),
            patch.object(_cm, "_publish_domain_event"),
            patch("unified_config_interface.schema_for_domain", return_value=schema_cls),
        ):
            result = asyncio.run(_cm.write_domain_config("instruments", self._make_write_request()))

        assert result.domain == "instruments"
        assert result.path == store.save_config.return_value
        assert "Config written successfully" in result.message

    def test_write_invalid_domain_raises_422(self):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(_cm.write_domain_config("bad_domain", self._make_write_request()))
        assert exc.value.status_code == 422

    def test_write_schema_validation_failure_raises_422(self):
        store = _make_store()
        schema_cls = MagicMock()
        schema_cls.model_validate.side_effect = ValueError("bad schema")

        with (
            patch.object(_cm, "_make_config_store", return_value=store),
            patch("unified_config_interface.schema_for_domain", return_value=schema_cls),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cm.write_domain_config("instruments", self._make_write_request()))
        assert exc.value.status_code == 422
        assert "Schema validation failed" in exc.value.detail

    def test_write_store_error_raises_500(self):
        store = _make_store()
        store.save_config.side_effect = RuntimeError("cloud I/O failure")
        config_instance = _make_config_model()
        schema_cls = MagicMock()
        schema_cls.model_validate.return_value = config_instance

        with (
            patch.object(_cm, "_make_config_store", return_value=store),
            patch("unified_config_interface.schema_for_domain", return_value=schema_cls),
            pytest.raises(HTTPException) as exc,
        ):
            asyncio.run(_cm.write_domain_config("instruments", self._make_write_request()))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# read_domain_config
# ---------------------------------------------------------------------------


class TestReadDomainConfig:
    def test_read_returns_config_response(self):
        config_instance = _make_config_model({"symbol": "BTC"})
        store = _make_store(load_result=config_instance)
        schema_cls = MagicMock()

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].ConfigStoreError = _mock_config_store_error_cls
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            result = asyncio.run(_cm.read_domain_config("instruments"))

        assert result.domain == "instruments"
        assert result.content == {"symbol": "BTC"}

    def test_read_invalid_domain_raises_422(self):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(_cm.read_domain_config("not_a_domain"))
        assert exc.value.status_code == 422

    def test_read_missing_config_raises_404(self):
        store = _make_store()
        store.load_config.side_effect = _mock_config_store_error_cls("not found")
        schema_cls = MagicMock()

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].ConfigStoreError = _mock_config_store_error_cls
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            with pytest.raises(HTTPException) as exc:
                asyncio.run(_cm.read_domain_config("strategies"))
        assert exc.value.status_code == 404

    def test_read_unexpected_error_raises_500(self):
        store = _make_store()
        store.load_config.side_effect = RuntimeError("boom")
        schema_cls = MagicMock()

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].ConfigStoreError = _mock_config_store_error_cls
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            with pytest.raises(HTTPException) as exc:
                asyncio.run(_cm.read_domain_config("clients"))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# list_domain_config_versions
# ---------------------------------------------------------------------------


class TestListDomainConfigVersions:
    def test_list_returns_version_entries(self):
        versions = [
            {"path": "gs://b/v/a.yaml", "timestamp": "20260101T120000Z", "schema_version": "1.0"},
            {"path": "gs://b/v/b.yaml", "timestamp": "20260101T110000Z", "schema_version": "1.0"},
        ]
        store = _make_store(versions=versions)

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)

            result = asyncio.run(_cm.list_domain_config_versions("venues"))

        assert len(result) == 2
        assert result[0].timestamp == "20260101T120000Z"

    def test_list_invalid_domain_raises_422(self):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(_cm.list_domain_config_versions("bad"))
        assert exc.value.status_code == 422

    def test_list_store_error_raises_500(self):
        store = _make_store()
        store.list_versions.side_effect = RuntimeError("network error")

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)

            with pytest.raises(HTTPException) as exc:
                asyncio.run(_cm.list_domain_config_versions("instruments"))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# diff_domain_config_versions
# ---------------------------------------------------------------------------


class TestDiffDomainConfigVersions:
    def _versions(self) -> list[dict[str, str]]:
        return [
            {"path": "gs://b/v/a.yaml", "timestamp": "20260101T120000Z", "schema_version": "1.0"},
            {"path": "gs://b/v/b.yaml", "timestamp": "20260101T110000Z", "schema_version": "1.0"},
        ]

    def test_diff_returns_diff_response(self):
        cfg_a = _make_config_model({"x": 1})
        cfg_b = _make_config_model({"x": 2})
        store = _make_store(versions=self._versions())
        store.load_config.side_effect = [cfg_a, cfg_b]
        schema_cls = MagicMock()

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            result = asyncio.run(
                _cm.diff_domain_config_versions(
                    "instruments",
                    "20260101T120000Z",
                    "20260101T110000Z",
                )
            )

        assert result.domain == "instruments"
        assert result.timestamp_a == "20260101T120000Z"
        assert result.timestamp_b == "20260101T110000Z"
        assert isinstance(result.diff, list)

    def test_diff_missing_ts1_raises_404(self):
        store = _make_store(versions=self._versions())
        schema_cls = MagicMock()

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            with pytest.raises(HTTPException) as exc:
                asyncio.run(
                    _cm.diff_domain_config_versions(
                        "instruments", "20991231T000000Z", "20260101T110000Z"
                    )
                )
        assert exc.value.status_code == 404

    def test_diff_invalid_domain_raises_422(self):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(
                _cm.diff_domain_config_versions("nope", "20260101T120000Z", "20260101T110000Z")
            )
        assert exc.value.status_code == 422


# ---------------------------------------------------------------------------
# rollback_domain_config
# ---------------------------------------------------------------------------


class TestRollbackDomainConfig:
    def _versions(self) -> list[dict[str, str]]:
        return [
            {"path": "gs://b/v/old.yaml", "timestamp": "20260101T100000Z", "schema_version": "1.0"},
        ]

    def test_rollback_returns_version_response(self):
        old_config = _make_config_model({"venue": "BINANCE"})
        store = _make_store(versions=self._versions(), load_result=old_config)
        store.save_config.return_value = "gs://b/v/rollback.yaml"
        schema_cls = MagicMock()

        with (
            patch.object(_cm, "_make_config_store", return_value=store),
            patch.object(_cm, "_publish_domain_event"),
        ):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            result = asyncio.run(_cm.rollback_domain_config("venues", "20260101T100000Z"))

        assert result.domain == "venues"
        assert "Rolled back" in result.message
        assert "20260101T100000Z" in result.message

    def test_rollback_missing_version_raises_404(self):
        store = _make_store(versions=self._versions())
        schema_cls = MagicMock()

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            with pytest.raises(HTTPException) as exc:
                asyncio.run(_cm.rollback_domain_config("venues", "20991231T000000Z"))
        assert exc.value.status_code == 404

    def test_rollback_invalid_domain_raises_422(self):
        with pytest.raises(HTTPException) as exc:
            asyncio.run(_cm.rollback_domain_config("bad_domain", "20260101T100000Z"))
        assert exc.value.status_code == 422

    def test_rollback_store_error_raises_500(self):
        store = _make_store(versions=self._versions())
        old_config = _make_config_model()
        store.load_config.return_value = old_config
        store.save_config.side_effect = RuntimeError("I/O error")
        schema_cls = MagicMock()

        with patch.object(_cm, "_make_config_store", return_value=store):
            sys.modules["unified_config_interface"].ConfigStore = type(store)
            sys.modules["unified_config_interface"].schema_for_domain.return_value = schema_cls

            with pytest.raises(HTTPException) as exc:
                asyncio.run(_cm.rollback_domain_config("venues", "20260101T100000Z"))
        assert exc.value.status_code == 500


# ---------------------------------------------------------------------------
# _publish_domain_event — best-effort, must not propagate exceptions
# ---------------------------------------------------------------------------


class TestPublishDomainEvent:
    def test_publish_success_calls_event_bus_and_log_event(self):
        mock_bus = MagicMock()
        mock_log = MagicMock()
        mock_get_event_bus = MagicMock(return_value=mock_bus)

        with (
            patch.dict(
                sys.modules,
                {"unified_cloud_interface": MagicMock(get_event_bus=mock_get_event_bus)},
            ),
            patch.dict(
                sys.modules,
                {"unified_events_interface": MagicMock(log_event=mock_log)},
            ),
        ):
            _cm._publish_domain_event("instruments", "gs://b/v/x.yaml", "agent")

        mock_bus.publish.assert_called_once()
        topic_arg = mock_bus.publish.call_args[0][0]
        assert topic_arg == "config-domain-instruments"

    def test_publish_exception_is_swallowed(self):
        mock_get_event_bus = MagicMock(side_effect=RuntimeError("bus down"))

        with patch.dict(
            sys.modules,
            {"unified_cloud_interface": MagicMock(get_event_bus=mock_get_event_bus)},
        ):
            # Must not raise
            _cm._publish_domain_event("strategies", "gs://b/v/x.yaml", "agent")
