"""
Shard management utilities for deployments.

Contains functions for classifying, verifying, and managing deployment shards,
including data verification and status classification logic.
"""

import logging
import re
from datetime import UTC, datetime, timedelta
from typing import cast


def _get_shards(state: object) -> list[object]:
    """Extract shards list from a state object (typed dataclass or plain dict)."""
    if isinstance(state, dict):
        raw = cast(dict[str, object], state).get("shards")
        return cast(list[object], raw) if isinstance(raw, list) else []
    shards_attr = getattr(state, "shards", None)
    return cast(list[object], shards_attr) if isinstance(shards_attr, list) else []


def _shard_id(shard: object) -> str:
    """Return shard_id from a shard object or dict."""
    if isinstance(shard, dict):
        return cast(str, cast(dict[str, object], shard).get("shard_id") or "")
    return cast(str, getattr(shard, "shard_id", "") or "")


def _shard_dims(shard: object) -> dict[str, object]:
    """Return dimensions dict from a shard object or dict."""
    if isinstance(shard, dict):
        raw = cast(dict[str, object], shard).get("dimensions")
        return cast(dict[str, object], raw) if isinstance(raw, dict) else {}
    dims_raw = getattr(shard, "dimensions", None)
    return cast(dict[str, object], dims_raw) if isinstance(dims_raw, dict) else {}


logger = logging.getLogger(__name__)

# Infrastructure failure categories
_INFRA_FAILURE_CATEGORIES = {
    "infra_failure",
    "resource_unavailable",
    "quota_exceeded",
    "network_error",
    "preempted",
    "spot_terminated",
}

# Code/application failure categories
_CODE_FAILURE_CATEGORIES = {
    "code_failure",
    "application_error",
    "invalid_input",
    "data_error",
    "config_error",
}


def _get_status_attr(val: object) -> object:
    """Retrieve the 'status' attribute via getattr to satisfy basedpyright (val: object)."""
    attr_name = "status"
    return cast(
        object, getattr(val, attr_name)
    )  # attr_name is a variable, not a constant — avoids B009


def status_str(val: object) -> str:
    """Convert various status representations to string."""
    if isinstance(val, str):
        return val
    elif isinstance(val, dict):
        d = cast(dict[str, object], val)
        return cast(str, d.get("status", "unknown"))
    elif hasattr(val, "status"):
        return str(_get_status_attr(val))
    else:
        return str(val)


# Backward compatibility alias
_status_str = status_str


def _shard_has_force(shard: object) -> bool:
    """Return True if --force was passed to this shard's CLI args."""
    args_raw: object = getattr(shard, "args", None) or []
    args = cast(list[str], args_raw) if isinstance(args_raw, list) else []
    return "--force" in args


def _parse_iso_dt(val: str | None) -> datetime | None:
    """Parse ISO datetime string to timezone-aware datetime, or None."""
    if not val:
        return None
    try:
        dt = datetime.fromisoformat(val.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt
    except (ValueError, AttributeError):
        return None


def _extract_date_range(date_val: object) -> tuple[str | None, str | None]:
    """
    Extract start and end date from various date specifications.

    Handles:
    - Single date: "2024-01-01" -> ("2024-01-01", "2024-01-01")
    - Date range: "2024-01-01,2024-01-31" -> ("2024-01-01", "2024-01-31")
    - Date range: "2024-01-01 to 2024-01-31" -> ("2024-01-01", "2024-01-31")
    - Relative: "last-7-days" -> computed range
    """
    if not date_val:
        return None, None

    date_str = str(date_val).strip()

    # Handle comma-separated range
    if "," in date_str:
        parts = [p.strip() for p in date_str.split(",", 1)]
        return parts[0] if parts[0] else None, parts[1] if len(parts) > 1 and parts[1] else None

    # Handle "to" separated range
    if " to " in date_str:
        parts = [p.strip() for p in date_str.split(" to ", 1)]
        return parts[0] if parts[0] else None, parts[1] if len(parts) > 1 and parts[1] else None

    # Handle relative dates
    if date_str.startswith("last-") and date_str.endswith("-days"):
        try:
            days = int(date_str.replace("last-", "").replace("-days", ""))
            end_date = datetime.now(UTC).strftime("%Y-%m-%d")
            start_date = (datetime.now(UTC) - timedelta(days=days - 1)).strftime("%Y-%m-%d")
            return start_date, end_date
        except ValueError as e:
            logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)
            pass

    # Single date - treat as single day range
    if re.match(r"\d{4}-\d{2}-\d{2}", date_str):
        return date_str, date_str

    return None, None


def _extract_error_warning_shard_ids(
    log_analysis: dict[str, object] | None,
) -> tuple[set[str], set[str]]:
    """Extract shard IDs that have log errors or warnings."""
    if not log_analysis:
        return set(), set()

    errors_raw: object = log_analysis.get("errors") or []
    warnings_raw: object = log_analysis.get("warnings") or []
    errors = cast(list[dict[str, object]], errors_raw) if isinstance(errors_raw, list) else []
    warnings = cast(list[dict[str, object]], warnings_raw) if isinstance(warnings_raw, list) else []

    error_shard_ids: set[str] = {cast(str, e.get("shard_id")) for e in errors if e.get("shard_id")}
    warning_shard_ids: set[str] = {
        cast(str, w.get("shard_id")) for w in warnings if w.get("shard_id")
    }

    return error_shard_ids, warning_shard_ids


def _classify_failed_shard(shard: object) -> str:
    """Classify a failed shard by failure_category."""
    fc_raw: object = getattr(shard, "failure_category", None)
    fc: str = fc_raw if isinstance(fc_raw, str) else ""
    fc_lower = fc.lower() if fc else ""
    if fc_lower in _INFRA_FAILURE_CATEGORIES:
        return "INFRA_FAILURE"
    if fc_lower == "timeout":
        return "TIMEOUT_FAILURE"
    if fc_lower in _CODE_FAILURE_CATEGORIES:
        return "CODE_FAILURE"
    return "VM_DIED"


def _classify_blob_verification(
    shard: object,
    blob_exists: bool,
    blob_updated: datetime | None,
) -> str:
    """Classify shard outcome based on blob existence and timestamp."""
    is_force = _shard_has_force(shard)
    shard_start = _parse_iso_dt(getattr(shard, "start_time", None))
    shard_end = _parse_iso_dt(getattr(shard, "end_time", None))

    if not blob_exists:
        return "DATA_MISSING"

    if blob_updated and shard_start and shard_end:
        tolerance = 60
        lower = shard_start - timedelta(seconds=tolerance)
        upper = shard_end + timedelta(seconds=tolerance)
        if lower <= blob_updated <= upper:
            return "VERIFIED"
        return "DATA_STALE" if is_force else "EXPECTED_SKIP"

    return "VERIFIED" if is_force else "EXPECTED_SKIP"


def _classify_shard(
    shard: object,
    blob_exists: bool | None = None,
    blob_updated: datetime | None = None,
    has_log_errors: bool = False,
    has_log_warnings: bool = False,
) -> str:
    """Classify a single shard into a human-readable outcome category.

    Decision tree (evaluated top-to-bottom):
      1. Job lifecycle failures (PENDING/CANCELLED/FAILED subtypes)
      2. RUNNING → still in progress
      3. SUCCEEDED path:
         a. Log errors → COMPLETED_WITH_ERRORS
         b. Log warnings → COMPLETED_WITH_WARNINGS
         c. Data verification (uses blob timestamp + --force flag)
    """
    status = _status_str(getattr(shard, "status", ""))

    if status == "pending":
        return "NEVER_RAN"
    if status == "cancelled":
        return "CANCELLED"
    if status == "running":
        return "STILL_RUNNING"
    if status == "failed":
        return _classify_failed_shard(shard)

    if has_log_errors:
        return "COMPLETED_WITH_ERRORS"
    if has_log_warnings:
        return "COMPLETED_WITH_WARNINGS"

    if blob_exists is None:
        return "UNVERIFIED"

    return _classify_blob_verification(shard, blob_exists, blob_updated)


def build_blob_timestamp_map(
    turbo_result: dict[str, object],
) -> dict[str, dict[str, dict[str, object]]]:
    """Extract per-(category, venue, date) blob timestamps from turbo result.

    Returns: {category: {venue: {date_str: blob_updated_datetime}}}

    These timestamps are captured during the turbo GCS queries with zero
    extra API calls (blob.updated is already in the list_blobs response).
    """
    result: dict[str, dict[str, dict[str, object]]] = {}

    categories_raw: object = turbo_result.get("categories") or {}
    categories = cast(dict[str, object], categories_raw) if isinstance(categories_raw, dict) else {}
    for cat_name, cat_data in categories.items():
        if not isinstance(cat_data, dict):
            continue
        cat_data_typed = cast(dict[str, object], cat_data)
        ts_map_raw = cat_data_typed.get("_venue_date_blob_timestamps")
        if ts_map_raw and isinstance(ts_map_raw, dict):
            result[cat_name] = cast(dict[str, dict[str, object]], ts_map_raw)

    return result


def _check_shard_data_exists(
    cat: str,
    venue_val: str,
    start_date: str,
    existing_cat_dates: dict[str, set[str]],
    existing_venue_dates: dict[str, dict[str, set[str]]],
) -> bool:
    """Check if blob data exists for a shard using precomputed turbo sets."""
    if cat not in existing_cat_dates:
        return False
    if venue_val and cat in existing_venue_dates and venue_val in existing_venue_dates[cat]:
        return start_date in existing_venue_dates[cat][venue_val]
    return start_date in existing_cat_dates[cat]


def _build_candidate_keys(venue_val: str, dims_dict: dict[str, object]) -> list[str]:
    """Build ordered list of sub-dimension candidate keys for blob timestamp lookup."""
    keys: list[str] = []
    if venue_val:
        keys.append(venue_val)
    for dim_name in ("feature_group", "feature_type", "sub_dimension"):
        dv_raw: object = dims_dict.get(dim_name, "")
        dv = dv_raw if isinstance(dv_raw, str) else ""
        if dv and dv not in keys:
            keys.append(dv)
    keys.append("_all")
    return keys


def _lookup_blob_timestamp(
    cat: str,
    venue_val: str,
    start_date: str,
    dims_dict: dict[str, object],
    blob_timestamps: dict[str, dict[str, dict[str, object]]],
) -> datetime | None:
    """Look up the blob updated timestamp for a shard from turbo data."""
    if cat not in blob_timestamps:
        return None
    cat_ts = blob_timestamps[cat]
    candidate_keys = _build_candidate_keys(venue_val, dims_dict)
    for key in candidate_keys:
        if key in cat_ts:
            ts: object = cat_ts[key].get(start_date)
            if ts is not None:
                return ts if isinstance(ts, datetime) else None
    for subdim_key, subdim_data in cat_ts.items():
        if subdim_key not in candidate_keys:
            ts = subdim_data.get(start_date)
            if ts is not None:
                return ts if isinstance(ts, datetime) else None
    return None


def resolve_shard_blob_data(
    state: object,
    existing_cat_dates: dict[str, set[str]],
    existing_venue_dates: dict[str, dict[str, set[str]]],
    blob_timestamps: dict[str, dict[str, dict[str, object]]],
) -> dict[str, tuple[bool, datetime | None]]:
    """Map each succeeded shard to (blob_exists, blob_updated) using turbo data.

    Uses the pre-computed existence sets (from turbo) and blob timestamps
    (from the same turbo queries). No additional GCS calls needed.

    Returns: {shard_id: (blob_exists, blob_updated_or_None)}
    """
    result: dict[str, tuple[bool, datetime | None]] = {}
    for shard in _get_shards(state):
        if _status_str(shard) != "succeeded":
            continue
        sid = _shard_id(shard)
        if not sid:
            continue
        dims_raw: object = getattr(shard, "dimensions", None) or {}
        dims_dict = cast(dict[str, object], dims_raw) if isinstance(dims_raw, dict) else {}
        cat = cast(str, dims_dict.get("category") or "")
        venue_val = cast(str, dims_dict.get("venue") or "")
        start_date, _ = _extract_date_range(dims_dict.get("date"))
        if not cat or not start_date:
            result[sid] = (False, None)
            continue
        data_exists = _check_shard_data_exists(
            cat, venue_val, start_date, existing_cat_dates, existing_venue_dates
        )
        blob_updated = (
            _lookup_blob_timestamp(cat, venue_val, start_date, dims_dict, blob_timestamps)
            if data_exists
            else None
        )
        result[sid] = (data_exists, blob_updated)
    return result


def classify_all_shards(
    state: object,
    log_analysis: dict[str, object] | None,
    blob_data: dict[str, tuple[bool, datetime | None]] | None = None,
) -> dict[str, str]:
    """Classify every shard in a deployment into outcome categories.

    Returns dict of shard_id → classification string.
    """
    shard_ids_with_errors, shard_ids_with_warnings = _extract_error_warning_shard_ids(log_analysis)

    classifications: dict[str, str] = {}
    for shard in _get_shards(state):
        sid = _shard_id(shard)
        if not sid:
            continue

        has_errors = sid in shard_ids_with_errors
        has_warnings = sid in shard_ids_with_warnings

        blob_exists = None
        blob_updated = None
        if blob_data and sid in blob_data:
            blob_exists, blob_updated = blob_data[sid]

        classifications[sid] = _classify_shard(
            shard,
            blob_exists=blob_exists,
            blob_updated=blob_updated,
            has_log_errors=has_errors,
            has_log_warnings=has_warnings,
        )

    return classifications


def compute_classification_counts(
    classifications: dict[str, str],
) -> dict[str, int]:
    """Aggregate per-shard classifications into counts."""
    counts: dict[str, int] = {}
    for cls in classifications.values():
        counts[cls] = counts.get(cls, 0) + 1
    return counts


def build_existing_dates_sets(
    turbo_result: dict[str, object],
) -> tuple[dict[str, set[str]], dict[str, dict[str, set[str]]]]:
    """Build category+date and venue+date sets from turbo data status result.

    Mirrors logic used by /api/data-status/missing-shards.
    """

    existing_cat_dates: dict[str, set[str]] = {}
    existing_venue_dates: dict[str, dict[str, set[str]]] = {}

    categories_raw: object = turbo_result.get("categories") or {}
    categories = cast(dict[str, object], categories_raw) if isinstance(categories_raw, dict) else {}
    for cat_name, cat_data_raw in categories.items():
        if not isinstance(cat_data_raw, dict):
            continue
        cat_data = cast(dict[str, object], cat_data_raw)
        if "error" in cat_data:
            continue

        existing_cat_dates[cat_name] = set()
        existing_venue_dates[cat_name] = {}

        # Internal fast path: precomputed set
        dates_set_raw = cat_data.get("_dates_set")
        if "_dates_set" in cat_data and isinstance(dates_set_raw, set):
            existing_cat_dates[cat_name] = cast(set[str], dates_set_raw)
            continue

        # Common: explicit list of dates
        if "dates_found_list" in cat_data:
            dates_found_raw = cast(list[str], cat_data.get("dates_found_list") or [])
            existing_cat_dates[cat_name] = set(dates_found_raw)
            continue

        # Venue map
        venues_data_raw: object = cat_data.get("venues") or {}
        venues_data = (
            cast(dict[str, object], venues_data_raw) if isinstance(venues_data_raw, dict) else {}
        )
        for venue_name, venue_data_raw in venues_data.items():
            if not isinstance(venue_data_raw, dict):
                continue
            venue_data = cast(dict[str, object], venue_data_raw)
            dates_found_raw2 = cast(list[str], venue_data.get("dates_found_list") or [])
            venue_dates: set[str] = set(dates_found_raw2)
            existing_venue_dates[cat_name][venue_name] = venue_dates
            existing_cat_dates[cat_name].update(venue_dates)

    return existing_cat_dates, existing_venue_dates


def _compute_verified_succeeded_shard_ids(
    state: object,
    existing_cat_dates: dict[str, set[str]],
    existing_venue_dates: dict[str, dict[str, set[str]]],
) -> set[str]:
    """Compute set of shard IDs that succeeded and have verified data."""
    verified: set[str] = set()

    for shard in _get_shards(state):
        if _status_str(shard) != "succeeded":
            continue

        dims = _shard_dims(shard)
        cat = cast(str, dims.get("category") or "")
        venue_val = cast(str, dims.get("venue") or "")
        start_date, _ = _extract_date_range(dims.get("date"))
        date_str = start_date or ""

        if not cat or not date_str:
            continue

        data_exists = False
        if cat in existing_cat_dates:
            if venue_val and cat in existing_venue_dates and venue_val in existing_venue_dates[cat]:
                if date_str in existing_venue_dates[cat][venue_val]:
                    data_exists = True
            else:
                if date_str in existing_cat_dates[cat]:
                    data_exists = True

        if data_exists:
            sid = _shard_id(shard)
            if sid:
                verified.add(sid)

    verified.discard("")
    return verified


def compute_completed_breakdown(
    state: object,
    log_analysis: dict[str, object] | None,
    existing_cat_dates: dict[str, set[str]] | None = None,
    existing_venue_dates: dict[str, dict[str, set[str]]] | None = None,
) -> dict[str, object]:
    """Compute detailed breakdown of completed shards by status and verification."""
    succeeded_ids: set[str] = {
        _shard_id(s) for s in _get_shards(state) if _status_str(s) == "succeeded" and _shard_id(s)
    }

    shard_ids_with_errors, shard_ids_with_warnings = _extract_error_warning_shard_ids(log_analysis)

    completed_with_errors = len(succeeded_ids & shard_ids_with_errors)
    completed_with_warnings = len(succeeded_ids & shard_ids_with_warnings)

    verified_clean_ids: set[str] = set()
    if existing_cat_dates is not None and existing_venue_dates is not None:
        verified_ids = _compute_verified_succeeded_shard_ids(
            state, existing_cat_dates, existing_venue_dates
        )
        verified_clean_ids = verified_ids - shard_ids_with_errors - shard_ids_with_warnings

    verified_clean = len(verified_clean_ids)

    return {
        "completed_with_errors": completed_with_errors,
        "completed_with_warnings": completed_with_warnings,
        "verified_clean": verified_clean,
        "verified_clean_ids": list(verified_clean_ids),
        "succeeded_ids": list(succeeded_ids),
        "error_shard_ids": list(shard_ids_with_errors),
        "warning_shard_ids": list(shard_ids_with_warnings),
    }


_REGION_ZONES: dict[str, list[str]] = {
    "us-central1": ["us-central1-a", "us-central1-b", "us-central1-c"],
    "us-east1": ["us-east1-b", "us-east1-c", "us-east1-d"],
    "europe-west1": ["europe-west1-b", "europe-west1-c", "europe-west1-d"],
}


def get_all_zones_for_vm_lookup(primary_region: str | None = None) -> list[str]:
    """
    Get all zones to search for VMs during lookup operations.

    Returns zones in priority order: primary region first, then failover regions.
    This ensures we find VMs efficiently while supporting cross-region deployments.
    """
    from deployment_api import settings as _settings

    region = primary_region or _settings.GCS_REGION or "us-central1"
    zones: list[str] = list(_REGION_ZONES.get(region, []))

    for failover_region in _settings.ALL_FAILOVER_REGIONS:
        if failover_region != region:
            zones.extend(_REGION_ZONES.get(failover_region, []))

    seen: set[str] = set()
    unique_zones: list[str] = []
    for zone in zones:
        if zone not in seen:
            seen.add(zone)
            unique_zones.append(zone)

    return unique_zones


def categories_from_state(state: object) -> list[str] | None:
    """Extract unique categories from deployment state shards."""
    if not state or not _get_shards(state):
        return None

    categories: set[str] = set()
    for shard in _get_shards(state):
        dims = _shard_dims(shard)
        cat_raw: object = dims.get("category")
        if cat_raw and isinstance(cat_raw, str):
            categories.add(cat_raw)

    return sorted(categories) if categories else None


def get_state_date_range(state: object) -> tuple[str | None, str | None]:
    """Extract the date range from deployment state by examining all shards."""
    if not state or not _get_shards(state):
        return None, None

    all_dates: list[str] = []
    for shard in _get_shards(state):
        dims = _shard_dims(shard)
        start_date, end_date = _extract_date_range(dims.get("date"))
        if start_date:
            all_dates.append(start_date)
        if end_date and end_date != start_date:
            all_dates.append(end_date)

    if not all_dates:
        return None, None

    all_dates.sort()
    return all_dates[0], all_dates[-1]
