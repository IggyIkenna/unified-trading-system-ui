"""Stateful mock store for deployment-api.

Initializes MockStateStore with seed data from mock_data.py so that
POST/PUT/DELETE mutations are reflected in subsequent GET responses
when CLOUD_MOCK_MODE=true.

Deployment-api is the most complex API — deployments have a state machine
(pending -> running -> completed/failed/cancelled). The MockStateStore
handles this via update() calls.
"""

from __future__ import annotations

from unified_trading_library import MockStateStore

from deployment_api.mock_data import MOCK_CONFIGS, MOCK_DEPLOYMENTS, MOCK_SERVICES

_store = MockStateStore("deployment-api")


def _ensure_id(items: list[dict[str, object]], id_field: str) -> list[dict[str, object]]:
    """Copy the domain-specific id field to 'id' for MockStateStore keying."""
    return [{**item, "id": item[id_field]} for item in items]


_store.seed("deployments", _ensure_id(MOCK_DEPLOYMENTS, "deployment_id"))
_store.seed("services", _ensure_id(MOCK_SERVICES, "name"))
_store.seed("configs", _ensure_id(MOCK_CONFIGS, "config_id"))


def get_store() -> MockStateStore:
    """Return the module-level MockStateStore singleton."""
    return _store
