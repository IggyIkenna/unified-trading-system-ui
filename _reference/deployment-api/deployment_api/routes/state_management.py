# --- Completed breakdown helpers (verification/warnings/errors) ---
import json
import logging
import re
from datetime import UTC, datetime, timedelta
from typing import cast

from pydantic import BaseModel, Field

from deployment_api.routes.deployments_helpers import (
    deployment_config as _deployment_config,
)

logger = logging.getLogger(__name__)


def _status_str(val: object) -> str:
    value_attr: object = getattr(val, "value", None)
    return str(value_attr) if value_attr is not None else str(val)


def _extract_severity_and_logger(line: str) -> tuple[str, str | None]:
    """Extract the real severity and logger name from a log line.

    On VMs, ALL Python logs go to stderr, so the serial console / Ops Agent
    tags every line as ERROR regardless of the actual log level.  The raw
    line looks like:
        ERROR{"severity": "INFO", "message": "..."}
    We parse the JSON ``severity`` and ``logger`` fields when present.
    For non-JSON lines we fall back to keyword matching, using word-boundary
    checks to avoid false positives from class names like
    ``GenericErrorHandlingService`` or module paths like ``error_handling``.

    Returns:
        Tuple of (severity, logger_name_or_None)
    """
    logger_name: str | None = None

    # Try to find a JSON object with a severity field
    json_match = re.search(r'\{.*"severity"\s*:', line)
    if json_match:
        try:
            payload = cast(dict[str, object], json.loads(line[json_match.start() :]))
            sev_raw: object = payload.get("severity") or ""
            sev = (str(sev_raw) if isinstance(sev_raw, str) else "").upper()
            logger_raw: object = payload.get("logger")
            logger_name = str(logger_raw) if isinstance(logger_raw, str) else None
            if sev in ("ERROR", "CRITICAL", "FATAL", "ALERT", "EMERGENCY"):
                return "ERROR", logger_name
            elif sev == "WARNING":
                return "WARNING", logger_name
            elif sev in ("INFO", "DEBUG", "NOTICE", "DEFAULT"):
                return sev, logger_name
            # Unknown severity in JSON — treat as INFO
            return "INFO", logger_name
        except (json.JSONDecodeError, ValueError) as e:
            logger.debug("Suppressed %s during operation: %s", type(e).__name__, e)

    # Non-JSON line: fall back to keyword matching with word-boundary checks
    # to avoid false positives from class/module names like
    # "GenericErrorHandlingService", "error_handling.py", etc.
    if re.search(r"\bERROR\b", line) or re.search(r"\bFAILED\b", line, re.IGNORECASE):
        return "ERROR", logger_name
    elif re.search(r"\bWARNING\b", line) or re.search(r"\bWARN\b", line):
        return "WARNING", logger_name
    return "INFO", logger_name


def _extract_date_range(date_val: object) -> tuple[str | None, str | None]:
    if isinstance(date_val, dict):
        date_dict = cast(dict[str, object], date_val)
        start_raw = date_dict.get("start")
        start = str(start_raw) if isinstance(start_raw, str) else None
        end_raw = date_dict.get("end")
        end = str(end_raw) if isinstance(end_raw, str) else start
        return start, end

    if not date_val:
        return None, None

    s = str(date_val)
    return s, s


def _get_state_date_range(state: object) -> tuple[str | None, str | None]:
    cfg_raw = getattr(state, "config", None)
    cfg: dict[str, object] = cast(dict[str, object], cfg_raw) if isinstance(cfg_raw, dict) else {}
    start_raw = cfg.get("start_date")
    end_raw = cfg.get("end_date")
    start_date = str(start_raw) if isinstance(start_raw, str) else None
    end_date = str(end_raw) if isinstance(end_raw, str) else None
    if start_date and end_date:
        return start_date, end_date

    # Fallback: derive from shard dimensions
    starts: list[str] = []
    ends: list[str] = []
    for shard in cast(list[object], getattr(state, "shards", []) or []):
        dims_raw: object = getattr(shard, "dimensions", None) or {}
        dims = cast(dict[str, object], dims_raw) if isinstance(dims_raw, dict) else {}
        s, e = _extract_date_range(dims.get("date"))
        if s:
            starts.append(s)
        if e:
            ends.append(e)

    if not starts or not ends:
        return None, None

    return min(starts), max(ends)


def _extract_error_warning_shard_ids(
    log_analysis: dict[str, object] | None,
) -> tuple[set[str], set[str]]:
    if not log_analysis:
        return set(), set()

    errors_raw = log_analysis.get("errors")
    warnings_raw = log_analysis.get("warnings")
    errors: list[object] = cast(list[object], errors_raw) if isinstance(errors_raw, list) else []
    warnings: list[object] = (
        cast(list[object], warnings_raw) if isinstance(warnings_raw, list) else []
    )

    shard_ids_with_errors: set[str] = set()
    for e in errors:
        if isinstance(e, dict):
            e_dict = cast(dict[str, object], e)
            sid_val = e_dict.get("shard_id")
            if isinstance(sid_val, str) and sid_val:
                shard_ids_with_errors.add(sid_val)

    shard_ids_with_warnings: set[str] = set()
    for w in warnings:
        if isinstance(w, dict):
            w_dict = cast(dict[str, object], w)
            sid_val = w_dict.get("shard_id")
            if isinstance(sid_val, str) and sid_val:
                shard_ids_with_warnings.add(sid_val)

    # Errors take precedence over warnings
    shard_ids_with_warnings -= shard_ids_with_errors

    return shard_ids_with_errors, shard_ids_with_warnings


# ---------------------------------------------------------------------------
# Shard outcome classification
# ---------------------------------------------------------------------------

# Tier 1: Job lifecycle (from shard.status + failure_category)
_INFRA_FAILURE_CATEGORIES = frozenset(
    {
        "zone_exhaustion",
        "ip_quota",
        "cpu_quota",
        "ssd_quota",
        "preemption",
    }
)
_CODE_FAILURE_CATEGORIES = frozenset(
    {
        "application_error",
        "network_error",
        "auth_error",
    }
)


def _shard_has_force(shard: object) -> bool:
    """Return True if --force was passed to this shard's CLI args."""
    args_attr: object = getattr(shard, "args", None)
    args: list[object] = cast(list[object], args_attr) if isinstance(args_attr, list) else []
    return "--force" in args


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
    shard: object,  # type: object (dynamic deployment shard)
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


def _build_blob_timestamp_map(
    turbo_result: dict[str, object],
) -> dict[str, dict[str, dict[str, object]]]:
    """Extract per-(category, venue, date) blob timestamps from turbo result.

    Returns: {category: {venue: {date_str: blob_updated_datetime}}}

    These timestamps are captured during the turbo GCS queries with zero
    extra API calls (blob.updated is already in the list_blobs response).
    """
    result: dict[str, dict[str, dict[str, object]]] = {}

    categories_raw = turbo_result.get("categories")
    categories: dict[str, object] = (
        cast(dict[str, object], categories_raw) if isinstance(categories_raw, dict) else {}
    )
    for cat_name, cat_data in categories.items():
        if not isinstance(cat_data, dict):
            continue
        cat_dict = cast(dict[str, object], cat_data)
        ts_map_raw = cat_dict.get("_venue_date_blob_timestamps")
        if ts_map_raw is not None and isinstance(ts_map_raw, dict):
            result[str(cat_name)] = cast(dict[str, dict[str, object]], ts_map_raw)

    return result


def _check_shard_data_exists(
    cat: str,
    venue_val: str,
    start_date: str,
    existing_cat_dates: dict[str, set[str]],
    existing_venue_dates: dict[str, dict[str, set[str]]],
) -> bool:
    """Check blob data exists for a shard using precomputed turbo sets."""
    if cat not in existing_cat_dates:
        return False
    if venue_val and cat in existing_venue_dates and venue_val in existing_venue_dates[cat]:
        return start_date in existing_venue_dates[cat][venue_val]
    return start_date in existing_cat_dates[cat]


def _lookup_blob_ts(
    cat: str,
    venue_val: str,
    start_date: str,
    dims: dict[str, object],
    blob_timestamps: dict[str, dict[str, dict[str, object]]],
) -> datetime | None:
    """Look up blob timestamp for a shard from turbo data."""
    if cat not in blob_timestamps:
        return None
    cat_ts = blob_timestamps[cat]
    candidate_keys: list[str] = []
    if venue_val:
        candidate_keys.append(venue_val)
    for dim_name in ("feature_group", "feature_type", "sub_dimension"):
        dv_raw: object = dims.get(dim_name, "")
        dv: str = dv_raw if isinstance(dv_raw, str) else ""
        if dv and dv not in candidate_keys:
            candidate_keys.append(dv)
    candidate_keys.append("_all")
    for key in candidate_keys:
        if key in cat_ts:
            ts: object = cat_ts[key].get(start_date)
            if ts is not None:
                return ts if isinstance(ts, datetime) else None
    best: datetime | None = None
    for _v_key, v_dates in cat_ts.items():
        ts = v_dates.get(start_date)
        if ts is not None and isinstance(ts, datetime) and (best is None or ts > best):
            best = ts
    return best


def _resolve_shard_blob_data(
    state: object,
    existing_cat_dates: dict[str, set[str]],
    existing_venue_dates: dict[str, dict[str, set[str]]],
    blob_timestamps: dict[str, dict[str, dict[str, object]]],
) -> dict[str, tuple[bool, datetime | None]]:
    """Map each succeeded shard to (blob_exists, blob_updated) using turbo data.

    Returns: {shard_id: (blob_exists, blob_updated_or_None)}
    """
    result: dict[str, tuple[bool, datetime | None]] = {}
    for shard in cast(list[object], getattr(state, "shards", []) or []):
        if _status_str(getattr(shard, "status", "")) != "succeeded":
            continue
        sid_raw: object = getattr(shard, "shard_id", "")
        if not sid_raw or not isinstance(sid_raw, str):
            continue
        sid: str = sid_raw
        dims_raw: object = getattr(shard, "dimensions", None) or {}
        dims = cast(dict[str, object], dims_raw) if isinstance(dims_raw, dict) else {}
        cat: str = str(dims.get("category")) if isinstance(dims.get("category"), str) else ""
        venue_val: str = str(dims.get("venue")) if isinstance(dims.get("venue"), str) else ""
        start_date, _ = _extract_date_range(dims.get("date"))
        if not cat or not start_date:
            result[sid] = (False, None)
            continue
        data_exists = _check_shard_data_exists(
            cat, venue_val, start_date, existing_cat_dates, existing_venue_dates
        )
        blob_ts = (
            _lookup_blob_ts(cat, venue_val, start_date, dims, blob_timestamps)
            if data_exists
            else None
        )
        result[sid] = (data_exists, blob_ts)
    return result


def _classify_all_shards(
    state: object,
    log_analysis: dict[str, object] | None,
    blob_data: dict[str, tuple[bool, datetime | None]] | None = None,
) -> dict[str, str]:
    """Classify every shard in a deployment into outcome categories.

    Returns dict of shard_id → classification string.
    """
    shard_ids_with_errors, shard_ids_with_warnings = _extract_error_warning_shard_ids(log_analysis)

    classifications: dict[str, str] = {}
    for shard in cast(list[object], getattr(state, "shards", []) or []):
        sid_raw: object = getattr(shard, "shard_id", "")
        if not sid_raw or not isinstance(sid_raw, str):
            continue
        sid: str = sid_raw

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


def _compute_classification_counts(
    classifications: dict[str, str],
) -> dict[str, int]:
    """Aggregate per-shard classifications into counts."""
    counts: dict[str, int] = {}
    for cls in classifications.values():
        counts[cls] = counts.get(cls, 0) + 1
    return counts


def _build_existing_dates_sets(
    turbo_result: dict[str, object],
) -> tuple[dict[str, set[str]], dict[str, dict[str, set[str]]]]:
    """Build category+date and venue+date sets from turbo data status result.

    Mirrors logic used by /api/data-status/missing-shards.
    """

    existing_cat_dates: dict[str, set[str]] = {}
    existing_venue_dates: dict[str, dict[str, set[str]]] = {}

    categories_raw = turbo_result.get("categories")
    categories: dict[str, object] = (
        cast(dict[str, object], categories_raw) if isinstance(categories_raw, dict) else {}
    )
    for cat_name_raw, cat_data_raw in categories.items():
        cat_name = str(cat_name_raw)
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
            dfl_raw = cat_data.get("dates_found_list")
            dfl: list[object] = cast(list[object], dfl_raw) if isinstance(dfl_raw, list) else []
            existing_cat_dates[cat_name] = {str(d) for d in dfl if d}
            continue

        # Venue map
        venues_raw = cat_data.get("venues")
        venues_data: dict[str, object] = (
            cast(dict[str, object], venues_raw) if isinstance(venues_raw, dict) else {}
        )
        for venue_name_raw, venue_data_raw in venues_data.items():
            venue_name = str(venue_name_raw)
            if not isinstance(venue_data_raw, dict):
                continue
            venue_data = cast(dict[str, object], venue_data_raw)
            dfl_raw = venue_data.get("dates_found_list")
            dates_found: list[object] = (
                cast(list[object], dfl_raw) if isinstance(dfl_raw, list) else []
            )
            venue_dates: set[str] = {str(d) for d in dates_found if d}
            existing_venue_dates[cat_name][venue_name] = venue_dates
            existing_cat_dates[cat_name].update(venue_dates)

    return existing_cat_dates, existing_venue_dates


def _compute_verified_succeeded_shard_ids(
    state: object,
    existing_cat_dates: dict[str, set[str]],
    existing_venue_dates: dict[str, dict[str, set[str]]],
) -> set[str]:
    verified: set[str] = set()

    for shard in cast(list[object], getattr(state, "shards", []) or []):
        if _status_str(getattr(shard, "status", "")) != "succeeded":
            continue

        dims_raw2: object = getattr(shard, "dimensions", None) or {}
        dims2 = cast(dict[str, object], dims_raw2) if isinstance(dims_raw2, dict) else {}
        cat_raw2 = dims2.get("category")
        cat2: str = str(cat_raw2) if isinstance(cat_raw2, str) else ""
        venue_raw2 = dims2.get("venue")
        venue_val2: str = str(venue_raw2) if isinstance(venue_raw2, str) else ""
        start_date2, _ = _extract_date_range(dims2.get("date"))
        date_str = start_date2 or ""

        if not cat2 or not date_str:
            continue

        data_exists = False
        if cat2 in existing_cat_dates:
            if (
                venue_val2
                and cat2 in existing_venue_dates
                and venue_val2 in existing_venue_dates[cat2]
            ):
                if date_str in existing_venue_dates[cat2][venue_val2]:
                    data_exists = True
            else:
                if date_str in existing_cat_dates[cat2]:
                    data_exists = True

        if data_exists:
            sid_raw: object = getattr(shard, "shard_id", "")
            if isinstance(sid_raw, str):
                verified.add(sid_raw)

    verified.discard("")
    return verified


def _compute_completed_breakdown(
    state: object,
    log_analysis: dict[str, object] | None,
    existing_cat_dates: dict[str, set[str]] | None = None,
    existing_venue_dates: dict[str, dict[str, set[str]]] | None = None,
) -> dict[str, object]:
    succeeded_ids: set[str] = {
        str(getattr(s, "shard_id", ""))
        for s in cast(list[object], getattr(state, "shards", []) or [])
        if _status_str(getattr(s, "status", "")) == "succeeded"
        and getattr(s, "shard_id", None)
        and isinstance(getattr(s, "shard_id", None), str)
    }

    shard_ids_with_errors, shard_ids_with_warnings = _extract_error_warning_shard_ids(log_analysis)

    completed_with_errors = len(succeeded_ids & shard_ids_with_errors)
    completed_with_warnings = len(succeeded_ids & shard_ids_with_warnings)

    verified_clean_ids: set[str] = set()
    if existing_cat_dates is not None and existing_venue_dates is not None:
        verified_ids: set[str] = _compute_verified_succeeded_shard_ids(
            state, existing_cat_dates, existing_venue_dates
        )
        verified_clean_ids = verified_ids - shard_ids_with_errors - shard_ids_with_warnings

    completed_with_verification = len(succeeded_ids & verified_clean_ids)

    classified = (
        (succeeded_ids & shard_ids_with_errors)
        | (succeeded_ids & shard_ids_with_warnings)
        | (succeeded_ids & verified_clean_ids)
    )
    completed_other = len(succeeded_ids - classified)

    return {
        "completed_with_errors": completed_with_errors,
        "completed_with_warnings": completed_with_warnings,
        "completed_with_verification": completed_with_verification,
        "completed": completed_other,
    }


def _categories_from_state(state: object) -> list[str] | None:
    cats: set[str] = set()
    for s in cast(list[object], getattr(state, "shards", []) or []):
        if _status_str(getattr(s, "status", "")) != "succeeded":
            continue
        dims_raw: object = getattr(s, "dimensions", None) or {}
        dims = cast(dict[str, object], dims_raw) if isinstance(dims_raw, dict) else {}
        cat_raw: object = dims.get("category")
        if cat_raw and isinstance(cat_raw, str):
            cats.add(cat_raw)
    return sorted(cats) or None


# Default cloud settings from deployment config
DEFAULT_PROJECT_ID = _deployment_config.effective_project_id
DEFAULT_REGION = _deployment_config.effective_region
DEFAULT_SERVICE_ACCOUNT = (
    _deployment_config.service_account_email
    or f"instruments-service-cloud-run@{DEFAULT_PROJECT_ID}.iam.gserviceaccount.com"
)
DEFAULT_STATE_BUCKET = _deployment_config.effective_state_bucket

# Deployment concurrency defaults
DEFAULT_MAX_CONCURRENT = _deployment_config.default_max_concurrent
MAX_CONCURRENT_HARD_LIMIT = _deployment_config.max_concurrent_hard_limit


def get_all_zones_for_vm_lookup(primary_region: str | None = None) -> list[str]:
    """Get all zones in the configured region for VM lookup.

    Single-region mode: only GCS_REGION zones. VMs are created within one region
    with zone failover (1a -> 1b -> 1c).

    Args:
        primary_region: Optional; defaults to GCS_REGION from settings

    Returns:
        List of zone names (e.g., ["asia-northeast1-a", "asia-northeast1-b", "asia-northeast1-c"])
    """
    region = primary_region or DEFAULT_REGION
    return [f"{region}-a", f"{region}-b", f"{region}-c"]


# Pydantic models for request/response
class DeployRequest(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Request body for creating a deployment."""

    service: str = Field(..., description="Service name to deploy")
    compute: str = Field("cloud_run", description="Compute mode: cloud_run or vm")
    mode: str = Field(
        "batch",
        description="Deployment mode: 'batch' (one-off jobs) or 'live' (long-running services). "
        "Affects how status refresh checks completion (Jobs API vs Cloud Run Services/revisions).",
    )
    start_date: str | None = Field(
        None,
        description="Start date (YYYY-MM-DD). Optional - defaults to earliest category_start "
        "from expected_start_dates.yaml for the service.",
    )
    end_date: str | None = Field(
        None,
        description="End date (YYYY-MM-DD). Optional for 'none' date granularity services - "
        "defaults to yesterday if not provided.",
    )
    category: list[str] | None = Field(None, description="Categories to deploy")
    venue: list[str] | None = Field(None, description="Venues to deploy")
    folder: list[str] | None = Field(
        None,
        description="Folders/instrument types to deploy (e.g., 'spot', 'perpetuals'). "
        "Passed as --instrument-types CLI arg to filter within each shard.",
    )
    data_type: list[str] | None = Field(
        None,
        description="Data types to deploy (e.g., 'trades', 'book_snapshot_5'). "
        "Passed as --data-types CLI arg to filter within each shard.",
    )
    feature_group: list[str] | None = Field(None, description="Feature groups to deploy")
    timeframe: list[str] | None = Field(None, description="Timeframes to deploy")
    instrument: list[str] | None = Field(None, description="Instruments to deploy")
    target_type: list[str] | None = Field(None, description="Target types to deploy")
    domain: str | None = Field(None, description="Domain for execution services")
    force: bool = Field(False, description="Force overwrite existing data")
    dry_run: bool = Field(True, description="Preview without deploying")
    log_level: str = Field("INFO", description="Log level")
    max_workers: int | None = Field(None, description="Max parallel workers")
    max_threads: int = Field(100, description="Max concurrent threads for launching")
    respect_start_dates: bool = Field(True, description="Filter shards by venue start dates")
    region: str | None = Field(None, description="GCP region (e.g., asia-northeast1)")
    vm_zone: str | None = Field(
        None, description="GCP zone for VM deployments (e.g., asia-northeast1-a)"
    )
    extra_args: str | None = Field(
        None,
        description="Additional CLI args to pass to service (e.g., '--data-types trades')",
    )
    tag: str | None = Field(
        None,
        description=(
            "Human-readable description/annotation for this deployment"
            " (e.g., 'Fixed Curve adapter')"
        ),
    )
    cloud_config_path: str | None = Field(
        None,
        description=(
            "Cloud storage path to config directory (gs://... or s3://...)"
            " for dynamic config discovery"
        ),
    )
    skip_venue_sharding: bool = Field(
        False,
        description="Skip venue as a sharding dimension. All venues in selected categories "
        "will be processed in a single shard per date. Reduces job count significantly "
        "but requires larger machines (auto-scaled based on max_workers).",
    )
    skip_feature_group_sharding: bool = Field(
        False,
        description="Skip feature_group as a sharding dimension. All feature groups "
        "will be processed in a single shard per date. Reduces job count for feature services.",
    )
    date_granularity: str | None = Field(
        None,
        description="Override date granularity (daily, weekly, monthly, none). "
        "This is a runtime override that does not modify the service config. "
        "weekly = 7-day chunks, monthly = 30-day chunks, none = no date sharding "
        "(single shard, no start/end date passed to service). Reduces job count.",
    )
    max_concurrent: int | None = Field(
        None,
        description=(
            "Max simultaneously running jobs/VMs. If total shards exceeds this,"
            " rolling launch is used. Default: 2000. Hard limit: 2500."
        ),
    )
    include_all_shards: bool = Field(
        False,
        description=(
            "If true, dry run response will include all shards (not just first 50)."
            " Use with caution for large deployments."
        ),
    )
    deploy_missing_only: bool = Field(
        False,
        description=(
            "If true, use backend to calculate missing shards"
            " (more accurate than exclude_dates). "
            "This fetches full date lists from GCS to determine what data exists, avoiding the "
            "truncation issue with exclude_dates passed from frontend."
        ),
    )
    first_day_of_month_only: bool = Field(
        False,
        description="If true, only generate shards for the first day of each month. "
        "Useful for TARDIS free tier (no API key required for first day of month).",
    )
    exclude_dates: dict[str, object] | None = Field(
        None,
        description=(
            "Dates to exclude. Supports two formats: "
            "(1) Category-level: {'CEFI': ['2024-01-01', ...]} - excludes all shards"
            " for those category+date combos. "
            "(2) Venue-level: {'CEFI': {'BINANCE-SPOT': ['2024-01-01', ...], 'UPBIT': [...]}} - "
            "excludes only specific category+venue+date combos. "
            "Venue-level format enables precise 'deploy missing' for services with venue sharding."
        ),
    )


class ShardInfo(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Information about a single shard."""

    shard_id: str
    dimensions: dict[str, object]
    cli_args: list[str]


class ShardPreview(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Preview of shards that would be created."""

    service: str
    total_shards: int
    shards: list[ShardInfo]
    summary: dict[str, object]
    cli_command: str
    dry_run: bool = True


class DeploymentResult(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Result of a deployment."""

    deployment_id: str
    service: str
    status: str
    total_shards: int
    compute_mode: str
    started_at: str
    dry_run: bool


class DeploymentSummary(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Summary of a deployment."""

    deployment_id: str
    service: str
    status: str
    total_shards: int
    completed_shards: int
    failed_shards: int
    progress_percentage: float
    started_at: str | None
    compute_mode: str
