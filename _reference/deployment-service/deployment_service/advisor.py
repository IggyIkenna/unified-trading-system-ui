"""
Deployment advisor helpers.

This module is intentionally pure-Python (no cloud SDK imports) so it can be used from:
- API dry-run responses (UI guidance)
- CLI tooling (future)
"""

from __future__ import annotations

import logging
from dataclasses import asdict, dataclass, field

# Cloud Run known hard caps (Feb 2026; verify per project/region)
# - Running executions per project+region: 1000 (hard)
# - Job run requests per minute per region: 180 (default; increaseable)
# - Max memory: 32Gi
# - Max CPU: 8 vCPU
CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION = 1000
CLOUD_RUN_SAFE_MAX_CONCURRENT = 900  # leave headroom under 1000
CLOUD_RUN_DEFAULT_RUN_JOB_QUOTA_PER_MIN = 180
CLOUD_RUN_MAX_MEMORY_GIB = 32
CLOUD_RUN_MAX_CPU = 8

logger = logging.getLogger(__name__)


def _parse_gib(mem: str | None) -> int | None:
    if not mem:
        return None
    s = str(mem).strip().lower()
    if s.endswith("gi"):
        try:
            return int(float(s[:-2]))
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Could not parse memory value %r: %s", mem, e)
            return None
    if s.endswith("gib"):
        try:
            return int(float(s[:-3]))
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Could not parse memory value %r: %s", mem, e)
            return None
    return None


@dataclass
class AdvisorRecommendation:
    recommended_date_granularity: str | None = None
    recommended_max_concurrent: int | None = None
    warnings: list[str] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def recommend_deployment_settings(
    *,
    service: str,
    compute_type: str,
    total_shards: int,
    requested_date_granularity: str | None = None,
    requested_max_concurrent: int | None = None,
    max_workers: int | None = None,
    skip_venue_sharding: bool = False,
    skip_feature_group_sharding: bool = False,
    compute_config: dict[str, object] | None = None,
) -> dict[str, object]:
    """
    Compute conservative recommendations for large backfills.

    This does NOT enforce behavior; it only returns suggestions/warnings.
    """
    warnings: list[str] = []
    notes: list[str] = []

    compute_type = (compute_type or "vm").lower()

    # Date granularity suggestion (only if caller didn't request one)
    recommended_granularity = None
    if not requested_date_granularity:
        if total_shards > 20000:
            recommended_granularity = "monthly"
        elif total_shards > 5000:
            recommended_granularity = "weekly"

    # Concurrency suggestion
    # Default is 2000, hard limit is 2500 (enforced elsewhere)
    default_max_concurrent = 2000
    if requested_max_concurrent is not None:
        recommended_max_concurrent = requested_max_concurrent
    else:
        if compute_type == "cloud_run":
            # Cloud Run has a hard cap of 1000 running executions per region
            recommended_max_concurrent = min(CLOUD_RUN_SAFE_MAX_CONCURRENT, max(1, total_shards))
        else:
            # VM default
            recommended_max_concurrent = min(default_max_concurrent, max(1, total_shards))

    # Cloud Run warnings / constraints
    if compute_type == "cloud_run":
        if total_shards > CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION:
            warnings.append(
                f"Cloud Run has a hard cap of {CLOUD_RUN_MAX_RUNNING_EXECUTIONS_PER_REGION}"
                f" running executions per region."
                f" Use max_concurrent ≤ {CLOUD_RUN_SAFE_MAX_CONCURRENT}"
                f" and expect rolling scheduling."
            )

        if skip_venue_sharding:
            warnings.append(
                "skip_venue_sharding can greatly increase per-shard workload. "
                "For Cloud Run this may OOM unless your Job template is sized"
                " appropriately; consider using VM."
            )

        if compute_config:
            mem_gib = _parse_gib(str(compute_config.get("memory")) if compute_config else None)
            cpu = compute_config.get("cpu")
            try:
                cpu_int = int(str(cpu)) if cpu is not None else None
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Could not parse CPU value %r: %s", cpu, e)
                cpu_int = None

            if mem_gib and mem_gib > CLOUD_RUN_MAX_MEMORY_GIB:
                warnings.append(
                    f"Cloud Run max memory is {CLOUD_RUN_MAX_MEMORY_GIB}Gi,"
                    f" but compute config requests {mem_gib}Gi. "
                    "Ensure the Cloud Run Job template is within limits or switch to VM."
                )
            if cpu_int and cpu_int > CLOUD_RUN_MAX_CPU:
                warnings.append(
                    f"Cloud Run max CPU is {CLOUD_RUN_MAX_CPU},"
                    f" but compute config requests {cpu_int}. "
                    "Ensure the Cloud Run Job template is within limits or switch to VM."
                )

        notes.append(
            f"Cloud Run run_job write quota is typically"
            f" {CLOUD_RUN_DEFAULT_RUN_JOB_QUOTA_PER_MIN}/min/region; "
            "auto-scheduler throttles launch requests (~2--3/sec) to avoid 429s."
        )

    # Vendor/API rate limit notes (generic)
    if max_workers and max_workers > 8:
        notes.append(
            "High container max_workers increases upstream vendor/API pressure. "
            "If you see hanging RUNNING shards, reduce max_workers and/or enable"
            " key rotation via SHARD_INDEX/TOTAL_SHARDS."
        )

    if skip_feature_group_sharding:
        notes.append(
            "skip_feature_group_sharding reduces shard count but increases per-shard work."
        )

    return AdvisorRecommendation(
        recommended_date_granularity=recommended_granularity,
        recommended_max_concurrent=recommended_max_concurrent,
        warnings=warnings,
        notes=notes,
    ).to_dict()
