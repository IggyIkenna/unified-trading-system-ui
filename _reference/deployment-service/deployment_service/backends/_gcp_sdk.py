"""
GCP SDK imports wrapper — deferred loading via module __getattr__.

Centralizes GCP SDK access so that backend modules import from here
instead of from google.cloud directly. All SDK modules are loaded lazily
on first access so that google.cloud libraries are not imported unless used.

# gcp-sdk-boundary: This module IS the approved GCP SDK boundary for deployment-service.
# All google.cloud imports are isolated here so the rest of the codebase never touches
# the SDK directly. The TYPE_CHECKING imports below are the controlled entry point —
# equivalent to UCI factory.py's config-bootstrap boundary pattern.
# Do NOT add google.cloud imports elsewhere.

TODO(GH-BACKLOG): Replace compute_v1/run_v2 access with UCI CloudComputeClient/
CloudRunClient abstractions when those are added to unified-cloud-interface.
"""

from __future__ import annotations

import importlib
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from google.api_core import exceptions as google_exceptions
    from google.auth import default as google_auth_default
    from google.auth.transport import requests as google_auth_requests
    from google.cloud import (  # noqa: cloud-sdk-direct — _gcp_sdk.py IS the GCP SDK boundary; see QUALITY_GATE_BYPASS_AUDIT.md §2.5
        compute_v1,
        run_v2,
    )
    from google.cloud.compute_v1.services.images import (
        transports as images_transports,
    )
    from google.cloud.compute_v1.services.instances import (
        transports as instances_transports,
    )

__all__ = [
    "google_exceptions",
    "google_auth_default",
    "google_auth_requests",
    "compute_v1",
    "run_v2",
    "images_transports",
    "instances_transports",
]

# Maps exported name → (module_to_import, attribute_name_or_None)
# If attribute_name is None, the module itself is returned.
_DEFERRED: dict[str, tuple[str, str | None]] = {
    "google_exceptions": ("google.api_core.exceptions", None),
    "google_auth_default": ("google.auth", "default"),
    "google_auth_requests": ("google.auth.transport.requests", None),
    "compute_v1": ("google.cloud.compute_v1", None),
    "run_v2": ("google.cloud.run_v2", None),
    "images_transports": ("google.cloud.compute_v1.services.images.transports", None),
    "instances_transports": ("google.cloud.compute_v1.services.instances.transports", None),
}


def __getattr__(name: str) -> object:
    """Deferred GCP SDK loading — deployment compute control-plane boundary."""
    entry = _DEFERRED.get(name)
    if entry is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    module_path, attr = entry
    mod = importlib.import_module(module_path)
    return mod if attr is None else getattr(mod, attr)
