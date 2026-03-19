"""
Execution Services Data Status

Functions for checking execution services data status and missing shards.
"""

import asyncio
import logging
import re
from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from typing import cast

logger = logging.getLogger(__name__)

# Module-level type aliases for execution service status structures
type _ConfigEntry = dict[str, str | bool | list[str]]
type _TimeframeMap = defaultdict[str, list[_ConfigEntry]]
type _ModeMap = defaultdict[str, _TimeframeMap]
type _BreakdownEntry = dict[str, int | list[str]]

_ALGO_RE = re.compile(
    r"^([A-Z_]+?)_(?:horizon|profile|display|clip|urgency|num_|participation|lambda|sigma|passive)"
)


def _parse_gs_path(gs_path: str) -> tuple[str, str, str] | None:
    """Parse gs://bucket/prefix into (bucket_name, config_prefix, version) or None on error."""
    if not gs_path.startswith("gs://"):  # noqa: gs-uri
        return None
    path_parts = gs_path[5:].split("/", 1)
    bucket_name = path_parts[0]
    config_prefix = path_parts[1] if len(path_parts) > 1 else ""
    if config_prefix and not config_prefix.endswith("/"):
        config_prefix += "/"
    version_match = re.search(r"/([Vv]\d+)/?$", config_prefix)
    version = version_match.group(1) if version_match else "V1"
    return bucket_name, config_prefix, version


def _extract_algo_name(config_file: str) -> str:
    """Extract algo name from a config filename."""
    m = _ALGO_RE.match(config_file)
    return m.group(1) if m else config_file.split("_")[0]


def _list_exec_configs(
    bucket_name: str,
    config_prefix: str,
    version: str,
    *,
    strategy_filter: str | None = None,
    mode_filter: str | None = None,
    timeframe_filter: str | None = None,
    algo_filter: str | None = None,
    include_gs_prefix: bool = False,
) -> list[dict[str, str]]:
    """List all execution config JSON files under bucket/config_prefix."""
    from deployment_api.utils.storage_facade import list_objects

    configs: list[dict[str, str]] = []
    config_objs = list_objects(bucket_name, config_prefix, max_results=10000)
    for obj in config_objs:
        if not obj.name.endswith(".json"):
            continue
        rel_path = (
            obj.name[len(config_prefix) :] if obj.name.startswith(config_prefix) else obj.name
        )
        parts = rel_path.split("/")
        if len(parts) < 4:
            continue
        cfg_strategy, cfg_mode, cfg_timeframe = parts[0], parts[1], parts[2]
        config_file = parts[3] if len(parts) > 3 else parts[-1]
        if strategy_filter and cfg_strategy != strategy_filter:
            continue
        if mode_filter and cfg_mode != mode_filter:
            continue
        if timeframe_filter and cfg_timeframe != timeframe_filter:
            continue
        algo_name = _extract_algo_name(config_file)
        if algo_filter and algo_name != algo_filter:
            continue
        result_strategy_id = f"{cfg_strategy}_{cfg_mode}_{cfg_timeframe}_{version}"
        path = f"gs://{bucket_name}/{obj.name}" if include_gs_prefix else obj.name  # noqa: gs-uri
        configs.append(
            {
                "path": path,
                "strategy": cfg_strategy,
                "mode": cfg_mode,
                "timeframe": cfg_timeframe,
                "config_file": config_file,
                "algo_name": algo_name,
                "result_strategy_id": result_strategy_id,
            }
        )
    return configs


def _collect_result_strategy_ids(
    bucket_name: str,
    filter_start: date | None,
    filter_end: date | None,
) -> tuple[set[str], defaultdict[str, set[str]]]:
    """Scan results/ prefix and return (existing_ids, dates_by_strategy)."""
    from deployment_api.utils.storage_facade import list_prefixes

    existing_ids: set[str] = set()
    dates_by_strategy: defaultdict[str, set[str]] = defaultdict(set)
    for date_prefix in list_prefixes(bucket_name, "results/"):
        date_match = re.search(r"results/(\d{4}-\d{2}-\d{2})/", date_prefix)
        if not date_match:
            continue
        date_str = date_match.group(1)
        result_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=UTC).date()
        if filter_start and result_date < filter_start:
            continue
        if filter_end and result_date > filter_end:
            continue
        for strategy_prefix in list_prefixes(bucket_name, date_prefix):
            m = re.search(r"results/\d{4}-\d{2}-\d{2}/([^/]+)/", strategy_prefix)
            if m:
                sid = m.group(1)
                existing_ids.add(sid)
                dates_by_strategy[sid].add(date_str)
    return existing_ids, dates_by_strategy


def _build_breakdown_summary(
    breakdown: "defaultdict[str, _BreakdownEntry]",
) -> dict[str, object]:
    """Convert a breakdown defaultdict to a summary dict with completion %."""
    result: dict[str, object] = {}
    for name, data in sorted(breakdown.items()):
        total_ = cast(int, data["total"])
        with_results_ = cast(int, data["with_results"])
        missing_ = cast(list[str], data["missing"])
        result[name] = {
            "total": total_,
            "with_results": with_results_,
            "missing_count": total_ - with_results_,
            "completion_pct": (round(with_results_ / total_ * 100, 1) if total_ > 0 else 0),
            "missing_samples": missing_[:5],
        }
    return result


def _build_hierarchy_from_configs(
    configs: list[dict[str, str]],
    existing_ids: set[str],
    dates_by_strategy: defaultdict[str, set[str]],
) -> defaultdict[str, _ModeMap]:
    """Build strategy->mode->timeframe->configs hierarchy from config list."""
    hierarchy: defaultdict[str, _ModeMap] = defaultdict(
        lambda: defaultdict(lambda: defaultdict(list))  # pyright: ignore[reportReturnType]  # nested defaultdict factory
    )
    for config in configs:
        result_strategy_id = config["result_strategy_id"]
        has_results = result_strategy_id in existing_ids
        result_dates = sorted(dates_by_strategy.get(result_strategy_id, set()))
        entry: _ConfigEntry = {
            "config_file": config["config_file"],
            "algo_name": config["algo_name"],
            "result_strategy_id": result_strategy_id,
            "has_results": has_results,
            "result_dates": result_dates,
        }
        hierarchy[config["strategy"]][config["mode"]][config["timeframe"]].append(entry)
    return hierarchy


def _make_breakdown_entry() -> _BreakdownEntry:
    return {"total": 0, "with_results": 0, "missing": []}


type _SummarizeResult = tuple[
    list[dict[str, object]], int, int, dict[str, object], dict[str, object], dict[str, object]
]


def _summarize_hierarchy(
    hierarchy: defaultdict[str, _ModeMap],
) -> _SummarizeResult:
    """Flatten the hierarchy into strategies list + breakdown dicts."""
    strategies: list[dict[str, object]] = []
    total_configs = 0
    total_with_results = 0
    breakdown_by_mode: defaultdict[str, _BreakdownEntry] = defaultdict(_make_breakdown_entry)
    breakdown_by_timeframe: defaultdict[str, _BreakdownEntry] = defaultdict(_make_breakdown_entry)
    breakdown_by_algo: defaultdict[str, _BreakdownEntry] = defaultdict(_make_breakdown_entry)

    for strategy_name in sorted(hierarchy.keys()):
        modes_data = hierarchy[strategy_name]
        strategy_configs = 0
        strategy_with_results = 0
        strategy_result_dates: set[str] = set()
        modes: list[dict[str, object]] = []

        for mode_name in sorted(modes_data.keys()):
            timeframes_data = modes_data[mode_name]
            mode_configs = 0
            mode_with_results = 0
            timeframes: list[dict[str, object]] = []

            for timeframe_name in sorted(timeframes_data.keys()):
                configs_list = timeframes_data[timeframe_name]
                tf_total = len(configs_list)
                tf_with_results = sum(1 for c in configs_list if bool(c.get("has_results")))
                tf_missing = [c for c in configs_list if not c.get("has_results")]
                for c in configs_list:
                    dates_val = c.get("result_dates")
                    if isinstance(dates_val, list):
                        strategy_result_dates.update(str(d) for d in dates_val)
                timeframes.append(
                    {
                        "timeframe": timeframe_name,
                        "total": tf_total,
                        "with_results": tf_with_results,
                        "completion_pct": (
                            round(tf_with_results / tf_total * 100, 1) if tf_total > 0 else 0
                        ),
                        "missing_configs": [
                            {
                                "config_file": c.get("config_file") or "",
                                "algo_name": c.get("algo_name") or "",
                            }
                            for c in tf_missing
                        ],
                        "configs": configs_list,
                    }
                )
                mode_configs += tf_total
                mode_with_results += tf_with_results
                tf_entry = breakdown_by_timeframe[timeframe_name]
                tf_entry["total"] = cast(int, tf_entry["total"]) + tf_total
                tf_entry["with_results"] = cast(int, tf_entry["with_results"]) + tf_with_results
                cast(list[str], tf_entry["missing"]).extend(
                    f"{strategy_name}/{mode_name}/{c.get('config_file') or ''}" for c in tf_missing
                )
                for c in configs_list:
                    algo_key = str(c.get("algo_name") or "")
                    algo_entry = breakdown_by_algo[algo_key]
                    algo_entry["total"] = cast(int, algo_entry["total"]) + 1
                    if c.get("has_results"):
                        algo_entry["with_results"] = cast(int, algo_entry["with_results"]) + 1
                    else:
                        p = f"{strategy_name}/{mode_name}/{timeframe_name}"
                        cast(list[str], algo_entry["missing"]).append(
                            f"{p}/{c.get('config_file') or ''}"
                        )

            modes.append(
                {
                    "mode": mode_name,
                    "total": mode_configs,
                    "with_results": mode_with_results,
                    "completion_pct": (
                        round(mode_with_results / mode_configs * 100, 1) if mode_configs > 0 else 0
                    ),
                    "timeframes": timeframes,
                }
            )
            strategy_configs += mode_configs
            strategy_with_results += mode_with_results
            mode_entry = breakdown_by_mode[mode_name]
            mode_entry["total"] = cast(int, mode_entry["total"]) + mode_configs
            mode_entry["with_results"] = cast(int, mode_entry["with_results"]) + mode_with_results

        strategies.append(
            {
                "strategy": strategy_name,
                "total": strategy_configs,
                "with_results": strategy_with_results,
                "completion_pct": (
                    round(strategy_with_results / strategy_configs * 100, 1)
                    if strategy_configs > 0
                    else 0
                ),
                "result_dates": sorted(strategy_result_dates),
                "result_date_count": len(strategy_result_dates),
                "modes": modes,
            }
        )
        total_configs += strategy_configs
        total_with_results += strategy_with_results

    return (
        strategies,
        total_configs,
        total_with_results,
        _build_breakdown_summary(breakdown_by_mode),
        _build_breakdown_summary(breakdown_by_timeframe),
        _build_breakdown_summary(breakdown_by_algo),
    )


async def get_execution_service_data_status(
    config_path: str,
    start_date: str | None = None,
    end_date: str | None = None,
) -> dict[str, object]:
    """
    Get execution-service data status by checking configs vs results.

    Turbo-compatible: Uses fast GCS directory listing.
    Caching: Results cached for 60s (configurable via DATA_STATUS_CACHE_TTL_SECONDS).

    Logic:
    - Configs: configs/{version}/{strategy}/{mode}/{timeframe}/{config_file}.json
    - Results: results/{any_date}/{strategy}_{mode}_{timeframe}_{version}/...

    For each config, checks if corresponding results directory exists.
    Groups hierarchically: strategy -> mode -> timeframe -> configs

    This enables diagnostic drilling:
    - Which strategies are failing?
    - Within a strategy, which modes (SCE vs HUF)?
    - Within a mode, which timeframes (5M vs 15M)?
    - Finally, which specific config files (algo params) are missing?

    Args:
        config_path: Cloud path to configs (e.g., gs://execution-store.../configs/V1)
        start_date: Optional start date filter (YYYY-MM-DD) for results check
        end_date: Optional end date filter (YYYY-MM-DD) for results check
    """
    from deployment_api.utils.data_status_cache import (
        get_exec_cached_result,
        set_exec_cached_result,
    )

    # Check cache first
    cached = get_exec_cached_result(config_path, start_date, end_date)
    if cached is not None:
        return cached

    def _get_status_sync() -> dict[str, object]:
        try:
            parsed = _parse_gs_path(config_path)
            if parsed is None:
                return {"error": "config_path must start with gs://"}
            bucket_name, config_prefix, version = parsed

            configs = _list_exec_configs(bucket_name, config_prefix, version)
            logger.info("Found %s configs under %s", len(configs), config_path)

            filter_start = (
                datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC).date()
                if start_date
                else None
            )
            filter_end = (
                datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=UTC).date()
                if end_date
                else None
            )
            existing_ids, dates_by_strategy = _collect_result_strategy_ids(
                bucket_name, filter_start, filter_end
            )
            logger.info("Found %s unique result strategy_ids", len(existing_ids))

            hierarchy = _build_hierarchy_from_configs(configs, existing_ids, dates_by_strategy)
            strategies, total_configs, total_with_results, bd_mode, bd_tf, bd_algo = (
                _summarize_hierarchy(hierarchy)
            )

            return {
                "config_path": config_path,
                "version": version,
                "total_configs": total_configs,
                "configs_with_results": total_with_results,
                "missing_count": total_configs - total_with_results,
                "completion_pct": (
                    round(total_with_results / total_configs * 100, 1) if total_configs > 0 else 0
                ),
                "strategy_count": len(strategies),
                "strategies": strategies,
                "breakdown_by_mode": bd_mode,
                "breakdown_by_timeframe": bd_tf,
                "breakdown_by_algo": bd_algo,
                "date_filter": (
                    {"start": start_date, "end": end_date} if start_date or end_date else None
                ),
            }
        except (OSError, ValueError, RuntimeError) as e:
            logger.exception("Error getting execution-service data status: %s", e)
            return {"error": str(e)[:200]}

    result = cast(dict[str, object], cast(object, await asyncio.to_thread(_get_status_sync)))

    # Cache successful results (not errors)
    if "error" not in result:
        set_exec_cached_result(config_path, start_date, end_date, result)

    return result


def _list_missing_configs_filtered(
    bucket_name: str,
    config_prefix: str,
    version: str,
    strategy: str | None,
    mode: str | None,
    timeframe: str | None,
    algo: str | None,
) -> list[dict[str, str]]:
    """List execution config JSON files under bucket/config_prefix, applying all filters."""
    from deployment_api.utils.storage_facade import list_objects

    configs: list[dict[str, str]] = []
    config_objs = list_objects(bucket_name, config_prefix, max_results=10000)

    for obj in config_objs:
        if not obj.name.endswith(".json"):
            continue
        rel_path = (
            obj.name[len(config_prefix) :] if obj.name.startswith(config_prefix) else obj.name
        )
        parts = rel_path.split("/")
        if len(parts) < 4:
            continue
        cfg_strategy, cfg_mode, cfg_timeframe = parts[0], parts[1], parts[2]
        config_file = parts[3] if len(parts) > 3 else parts[-1]

        if strategy and cfg_strategy != strategy:
            continue
        if mode and cfg_mode != mode:
            continue
        if timeframe and cfg_timeframe != timeframe:
            continue

        algo_match = re.match(
            r"^([A-Z_]+?)_(?:horizon|profile|display|clip|urgency|num_|participation|lambda|sigma|passive)",
            config_file,
        )
        algo_name = algo_match.group(1) if algo_match else config_file.split("_")[0]

        if algo and algo_name != algo:
            continue

        result_strategy_id = f"{cfg_strategy}_{cfg_mode}_{cfg_timeframe}_{version}"
        configs.append(
            {
                "path": f"gs://{bucket_name}/{obj.name}",  # noqa: gs-uri
                "strategy": cfg_strategy,
                "mode": cfg_mode,
                "timeframe": cfg_timeframe,
                "config_file": config_file,
                "algo_name": algo_name,
                "result_strategy_id": result_strategy_id,
            }
        )

    return configs


def _collect_result_dates_in_range(
    bucket_name: str,
    filter_start: date,
    filter_end: date,
) -> defaultdict[str, set[str]]:
    """Scan results/ and return dates per strategy_id within [filter_start, filter_end]."""
    from deployment_api.utils.storage_facade import list_prefixes

    result_dates_by_strategy: defaultdict[str, set[str]] = defaultdict(set)
    for date_prefix in list_prefixes(bucket_name, "results/"):
        date_match = re.search(r"results/(\d{4}-\d{2}-\d{2})/", date_prefix)
        if not date_match:
            continue
        date_str = date_match.group(1)
        result_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=UTC).date()
        if result_date < filter_start or result_date > filter_end:
            continue
        for strategy_prefix in list_prefixes(bucket_name, date_prefix):
            strategy_match = re.search(r"results/\d{4}-\d{2}-\d{2}/([^/]+)/", strategy_prefix)
            if strategy_match:
                result_dates_by_strategy[strategy_match.group(1)].add(date_str)

    return result_dates_by_strategy


def _build_missing_shards_result(
    configs: list[dict[str, str]],
    result_dates_by_strategy: defaultdict[str, set[str]],
    all_expected_dates: set[str],
    config_path: str,
    start_date: str,
    end_date: str,
    strategy: str | None,
    mode: str | None,
    timeframe: str | None,
    algo: str | None,
) -> dict[str, object]:
    """Build the missing-shards response dict from configs and result date sets."""
    missing_shards: list[dict[str, str]] = []
    breakdown_by_strategy: defaultdict[str, int] = defaultdict(int)
    breakdown_by_mode: defaultdict[str, int] = defaultdict(int)
    breakdown_by_timeframe: defaultdict[str, int] = defaultdict(int)
    breakdown_by_algo: defaultdict[str, int] = defaultdict(int)
    breakdown_by_date: defaultdict[str, int] = defaultdict(int)

    for config in configs:
        result_strategy_id = config["result_strategy_id"]
        existing_dates = result_dates_by_strategy.get(result_strategy_id, set())
        missing_dates = all_expected_dates - existing_dates
        for date_str in sorted(missing_dates):
            missing_shards.append(
                {
                    "config_gcs": config["path"],
                    "date": date_str,
                    "strategy": config["strategy"],
                    "mode": config["mode"],
                    "timeframe": config["timeframe"],
                    "algo": config["algo_name"],
                }
            )
            breakdown_by_strategy[config["strategy"]] += 1
            breakdown_by_mode[config["mode"]] += 1
            breakdown_by_timeframe[config["timeframe"]] += 1
            breakdown_by_algo[config["algo_name"]] += 1
            breakdown_by_date[date_str] += 1

    logger.info("[EXEC-MISSING] Calculated %s missing shards", len(missing_shards))

    return {
        "missing_shards": missing_shards,
        "total_missing": len(missing_shards),
        "total_configs": len(configs),
        "total_dates": len(all_expected_dates),
        "breakdown": {
            "by_strategy": dict(sorted(breakdown_by_strategy.items())),
            "by_mode": dict(sorted(breakdown_by_mode.items())),
            "by_timeframe": dict(sorted(breakdown_by_timeframe.items())),
            "by_algo": dict(sorted(breakdown_by_algo.items())),
            "by_date": dict(sorted(breakdown_by_date.items())),
        },
        "filters": {
            "config_path": config_path,
            "start_date": start_date,
            "end_date": end_date,
            "strategy": strategy,
            "mode": mode,
            "timeframe": timeframe,
            "algo": algo,
        },
    }


def _calculate_missing_shards_sync(
    config_path: str,
    start_date: str,
    end_date: str,
    strategy: str | None,
    mode: str | None,
    timeframe: str | None,
    algo: str | None,
) -> dict[str, object]:
    """Synchronous core of calculate_execution_missing_shards (runs in thread pool)."""
    try:
        if not config_path.startswith("gs://"):  # noqa: gs-uri
            return {"error": "config_path must start with gs://"}

        path_parts = config_path[5:].split("/", 1)
        bucket_name = path_parts[0]
        config_prefix = path_parts[1] if len(path_parts) > 1 else ""
        if config_prefix and not config_prefix.endswith("/"):
            config_prefix += "/"

        version_match = re.search(r"/([Vv]\d+)/?$", config_prefix)
        version = version_match.group(1) if version_match else "V1"

        filter_start = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC).date()
        filter_end = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=UTC).date()
        all_expected_dates: set[str] = set()
        current = filter_start
        while current <= filter_end:
            all_expected_dates.add(current.strftime("%Y-%m-%d"))
            current += timedelta(days=1)

        configs = _list_missing_configs_filtered(
            bucket_name, config_prefix, version, strategy, mode, timeframe, algo
        )
        logger.info("[EXEC-MISSING] Found %s configs after filters", len(configs))

        result_dates_by_strategy = _collect_result_dates_in_range(
            bucket_name, filter_start, filter_end
        )

        return _build_missing_shards_result(
            configs=configs,
            result_dates_by_strategy=result_dates_by_strategy,
            all_expected_dates=all_expected_dates,
            config_path=config_path,
            start_date=start_date,
            end_date=end_date,
            strategy=strategy,
            mode=mode,
            timeframe=timeframe,
            algo=algo,
        )

    except (OSError, ValueError, RuntimeError) as e:
        logger.exception("Error calculating execution missing shards: %s", e)
        return {"error": str(e)[:200]}


async def calculate_execution_missing_shards(
    config_path: str,
    start_date: str,
    end_date: str,
    strategy: str | None = None,
    mode: str | None = None,
    timeframe: str | None = None,
    algo: str | None = None,
) -> dict[str, object]:
    """
    Calculate missing config x date shards for execution-service.

    For each config, finds dates without results within the specified range.
    Returns missing shards that need to be deployed.

    Args:
        config_path: GCS config path (e.g., gs://execution-store.../configs/V1)
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        strategy: Optional filter by strategy name
        mode: Optional filter by mode (SCE/HUF)
        timeframe: Optional filter by timeframe (5M, 15M, etc.)
        algo: Optional filter by algorithm name
    """
    return cast(
        dict[str, object],
        cast(
            object,
            await asyncio.to_thread(
                _calculate_missing_shards_sync,
                config_path,
                start_date,
                end_date,
                strategy,
                mode,
                timeframe,
                algo,
            ),
        ),
    )
