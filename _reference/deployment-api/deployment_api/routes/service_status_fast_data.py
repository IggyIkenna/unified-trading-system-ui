"""
Fast Data Status Functions

Optimized functions for quickly getting data timestamps using date-partitioned lookups.
"""

import asyncio
import logging
import re
from collections.abc import Sequence
from datetime import UTC, datetime
from typing import cast

logger = logging.getLogger(__name__)

# Service to GCS bucket mapping (imported from checkers module for consistency)
from .service_status_checkers import SERVICE_OUTPUT_BUCKETS

_PREFIXES_TO_TRY = [
    "raw_tick_data/by_date/",  # market-tick-data-handler
    "instruments/",  # instruments-service
    "",  # root level
]


def _obj_updated(obj: object) -> datetime:
    """Return the updated timestamp of a GCS-like object, or datetime.min."""
    ts_raw: object = getattr(obj, "updated", None) if hasattr(obj, "updated") else None
    ts: datetime | None = cast("datetime | None", ts_raw) if ts_raw is not None else None
    # GCS blobs expose .updated as an attribute, not a dict key; use vars() fallback
    if ts is None:
        ts = cast("datetime | None", vars(obj).get("updated") if hasattr(obj, "__dict__") else None)
    return ts if ts is not None else datetime.min.replace(tzinfo=UTC)


def _latest_ts_from_objects(objs: Sequence[object]) -> "datetime | None":
    """Return the most recent updated timestamp from a list of GCS objects."""
    if not objs:
        return None
    latest_obj = max(objs, key=_obj_updated)
    ts = _obj_updated(latest_obj)
    return ts if ts != datetime.min.replace(tzinfo=UTC) else None


def _find_latest_ts_for_bucket(bucket_name: str) -> "datetime | None":
    """Scan a single bucket for the most recent data timestamp."""
    from deployment_api.utils.storage_facade import list_objects, list_prefixes

    for prefix in _PREFIXES_TO_TRY:
        prefixes_found = list_prefixes(bucket_name, prefix)
        date_prefixes = [p for p in prefixes_found if re.search(r"day=\d{4}-\d{2}-\d{2}", p)]
        if date_prefixes:
            date_prefixes.sort(reverse=True)
            recent_objs = list_objects(bucket_name, date_prefixes[0], max_results=10)
            return _latest_ts_from_objects(recent_objs)
        objs = list_objects(bucket_name, prefix, max_results=500)
        if objs:
            return _latest_ts_from_objects(objs)
    return None


def _get_timestamps_sync(service: str) -> dict[str, object]:
    """Scan all buckets for a service and return latest timestamps by category."""
    try:
        buckets = SERVICE_OUTPUT_BUCKETS.get(service, {})
        if not buckets:
            empty_cat: dict[str, object] = {}
            return {"latest": None, "by_category": empty_cat}

        results: dict[str, dict[str, object]] = {}
        for category, bucket_name in buckets.items():
            try:
                ts = _find_latest_ts_for_bucket(bucket_name)
                results[category] = {"timestamp": ts.isoformat() if ts else None}
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Error checking %s/%s: %s", category, bucket_name, e)
                results[category] = {"error": str(e)[:50]}

        valid_timestamps: list[datetime] = []
        for _r in results.values():
            _ts: object = _r.get("timestamp")
            if _ts and isinstance(_ts, str):
                valid_timestamps.append(datetime.fromisoformat(_ts))

        return {
            "by_category": results,
            "latest": (max(valid_timestamps).isoformat() if valid_timestamps else None),
        }
    except (OSError, ValueError, RuntimeError) as e:
        return {"error": str(e)[:100]}


async def get_latest_data_timestamp_fast(service: str) -> dict[str, object] | None:
    """
    FAST version: Get most recent data timestamp by checking latest date folder.

    For date-partitioned data (day=YYYY-MM-DD), lists date folders and checks
    the most recent one for actual file timestamps. Uses storage facade (FUSE).
    """
    return cast(
        dict[str, object] | None,
        cast(object, await asyncio.to_thread(_get_timestamps_sync, service)),
    )
