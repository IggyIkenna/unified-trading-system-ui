"""
League configuration shim for sports verification scripts.

Re-exports ``LEAGUE_CLASSIFICATION_DATA`` from the canonical source in
``instruments-service``.  Scripts in this directory must be run from the
workspace root (or with instruments-service installed / on PYTHONPATH) so that
``instruments_service`` is importable.
"""

from __future__ import annotations

from instruments_service.sports.league_data_classification import (
    LEAGUE_CLASSIFICATION_DATA,
)

__all__ = ["LEAGUE_CLASSIFICATION_DATA"]
