"""
Service Status API Routes

Provides temporal audit trail for services:
- Last data update (GCS file timestamps)
- Last deployment (from state files)
- Last build (Cloud Build API)
- Last code push (GitHub API)
- Anomaly detection (stale data, failed builds)
"""

import asyncio
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import cast

import yaml
from fastapi import APIRouter, FastAPI, HTTPException, Request
from google.auth import (  # pyright: ignore[reportMissingTypeStubs]  # google-auth has no complete stubs
    default,  # pyright: ignore[reportUnknownVariableType]
    impersonated_credentials,
)
from unified_cloud_interface import get_secret_client

from deployment_api.settings import GITHUB_TOKEN_SA
from deployment_api.utils.storage_facade import get_gcs_fuse_status

# Import extracted modules
from .service_status_cache import load_gcs_cache
from .service_status_checkers import (
    get_latest_build,
    get_latest_code_push,
    get_latest_data_timestamp,
    get_latest_deployment,
)
from .service_status_execution import (
    calculate_execution_missing_shards,
    get_execution_service_data_status,
)
from .service_status_fast_data import get_latest_data_timestamp_fast
from .service_status_health import detect_anomalies, determine_overview_health

# Add parent directory to path
sys.path.insert(0, str(__file__).rsplit("/", 3)[0])

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_token_sync() -> str | None:
    """Fetch GitHub token via Secret Manager (supports local impersonation and SA direct)."""
    token_start = time.time()
    try:
        target_sa = GITHUB_TOKEN_SA
        creds_result: tuple[object, object] = default()  # pyright: ignore[reportUnknownMemberType]  # google-auth stubs
        source_credentials: object = creds_result[0]
        logger.info("[PERF] Got default credentials in %.2fs", time.time() - token_start)

        if hasattr(source_credentials, "service_account_email"):
            sa_email: str = str(getattr(source_credentials, "service_account_email", ""))
            if any(
                x in sa_email
                for x in [
                    "github-token-sa@",
                    "compute@developer.gserviceaccount.com",
                    "instruments-service",
                ]
            ):
                logger.info("[PERF] Running as %s, accessing secret directly", sa_email)
                return get_secret_client().get_secret("github-token")

        target_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
        _ = impersonated_credentials.Credentials(
            source_credentials=source_credentials,  # pyright: ignore[reportArgumentType]  # google-auth untyped credentials
            target_principal=target_sa,
            target_scopes=target_scopes,
        )
        logger.info("[PERF] About to access secret (elapsed: %.2fs)", time.time() - token_start)
        secret_value = get_secret_client().get_secret("github-token")
        logger.info("[PERF] Secret accessed in %.2fs total", time.time() - token_start)
        return secret_value
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning(
            "Could not access github-token (took %.2fs): %s", time.time() - token_start, e
        )
        return None


def _read_checklist(config_dir: Path, service: str) -> dict[str, object] | None:
    """Load and summarise the YAML checklist for a service, or return None."""
    checklist_file = f"{config_dir}/checklist.{service}.yaml"
    logger.info("Attempting to load checklist from: %s", checklist_file)
    if not os.path.exists(checklist_file):
        logger.warning("Checklist file not found: %s", checklist_file)
        return None
    try:
        with open(checklist_file) as f:
            checklist_data = cast(dict[str, object], yaml.safe_load(f))
        total_items = 0
        completed_items = 0
        for category in cast(list[dict[str, object]], checklist_data.get("categories") or []):
            for item in cast(list[dict[str, object]], category.get("items") or []):
                total_items += 1
                if item.get("status") == "done":
                    completed_items += 1
        if total_items > 0:
            result: dict[str, object] = {
                "percent": round((completed_items / total_items) * 100, 1),
                "completed": completed_items,
                "total": total_items,
            }
            logger.info("Checklist loaded: %s", result)
            return result
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Could not load checklist for %s: %s", service, e, exc_info=True)
    return None


def _read_build_cache_for_service(service: str) -> tuple[str | None, str | None]:
    """Return (build_ts, build_status) from GCS cache for a service."""
    cache = load_gcs_cache()
    builds_cache_raw: object = cache.get("builds") or {}
    if not isinstance(builds_cache_raw, dict):
        return None, None
    builds_cache = cast(dict[str, object], builds_cache_raw)
    if service not in builds_cache:
        return None, None
    build_info_raw = builds_cache[service]
    if not isinstance(build_info_raw, dict):
        return None, None
    build_info = cast(dict[str, object], build_info_raw)
    bt_raw = build_info.get("timestamp")
    bs_raw = build_info.get("status")
    build_ts = str(bt_raw) if bt_raw is not None else None
    build_status = str(bs_raw) if bs_raw is not None else None
    return build_ts, build_status


async def _get_quota_manager_status(service: str) -> dict[str, object]:
    """Return health dict for the quota-manager service via broker /health."""
    from deployment_api import settings as api_settings

    broker_url = api_settings.QUOTA_BROKER_URL
    if not broker_url:
        return {
            "service": service,
            "health": "unknown",
            "last_data_update": None,
            "last_deployment": None,
            "deployment_status": None,
            "last_build": None,
            "build_status": None,
            "anomaly_count": 0,
        }

    def _check_broker_health() -> bool:
        import http.client
        import urllib.request

        try:
            from google.auth.transport.requests import Request as AuthRequest
            from google.oauth2 import id_token

            token = id_token.fetch_id_token(AuthRequest(), broker_url)  # pyright: ignore[reportUnknownMemberType]  # google-auth stubs
            req = urllib.request.Request(
                f"{broker_url}/health",
                method="GET",
                headers={"Authorization": f"Bearer {token}"},
            )
            with cast(
                http.client.HTTPResponse,
                urllib.request.urlopen(req, timeout=5),  # nosec B310
            ) as resp:
                return resp.status == 200
        except (OSError, ValueError, RuntimeError) as e:
            logger.debug("Quota broker health check failed: %s", e)
            return False

    ok = await asyncio.to_thread(_check_broker_health)
    return {
        "service": service,
        "health": "healthy" if ok else "error",
        "last_data_update": None,
        "last_deployment": None,
        "deployment_status": None,
        "last_build": None,
        "build_status": None,
        "anomaly_count": 0,
    }


async def _get_quick_status(service: str) -> dict[str, object]:
    """Get overview status for a single service (data timestamps + cached deployment info)."""
    if service == "quota-manager":
        return await _get_quota_manager_status(service)
    try:
        data_info, deployment_info = await asyncio.gather(
            get_latest_data_timestamp_fast(service),
            get_latest_deployment(service, use_cache=True),
            return_exceptions=True,
        )

        data_ts: str | None = None
        if isinstance(data_info, dict) and "latest" in data_info:
            data_ts = cast(str | None, data_info["latest"])

        deploy_ts: str | None = None
        deploy_status: str | None = None
        if isinstance(deployment_info, dict) and "timestamp" in deployment_info:
            ts_raw = deployment_info["timestamp"]
            deploy_ts = str(ts_raw) if ts_raw is not None else None
            status_raw = deployment_info.get("status")
            deploy_status = str(status_raw).lower() if status_raw is not None else None

        build_ts, build_status = _read_build_cache_for_service(service)

        health = determine_overview_health(
            data_ts=data_ts,
            deploy_ts=deploy_ts,
            deploy_status=deploy_status,
            build_status=build_status,
        )

        return {
            "service": service,
            "health": health,
            "last_data_update": data_ts,
            "last_deployment": deploy_ts,
            "deployment_status": deploy_status,
            "last_build": build_ts,
            "build_status": build_status,
            "anomaly_count": 0,
        }
    except (OSError, ValueError, RuntimeError) as e:
        return {
            "service": service,
            "health": "error",
            "error": str(e)[:100],
        }


# Allowlist of valid service names derived from workspace-manifest.json repositories.
# This prevents user-supplied service names from being passed unsanitised to
# subprocess (gcloud) arguments.
VALID_SERVICES: frozenset[str] = frozenset(
    {
        "unified-api-contracts",
        "unified-internal-contracts",
        "unified-reference-data-interface",
        "unified-config-interface",
        "unified-events-interface",
        "unified-cloud-interface",
        "unified-trading-library",
        "unified-domain-client",
        "execution-algo-library",
        "matching-engine-library",
        "unified-feature-calculator-library",
        "unified-market-interface",
        "unified-ml-interface",
        "unified-trade-execution-interface",
        "unified-sports-execution-interface",
        "unified-defi-execution-interface",
        "unified-position-interface",
        "instruments-service",
        "market-tick-data-service",
        "market-data-processing-service",
        "features-calendar-service",
        "features-delta-one-service",
        "features-volatility-service",
        "features-onchain-service",
        "features-sports-service",
        "features-multi-timeframe-service",
        "features-cross-instrument-service",
        "ml-training-service",
        "ml-inference-service",
        "strategy-service",
        "execution-service",
        "alerting-service",
        "pnl-attribution-service",
        "position-balance-monitor-service",
        "risk-and-exposure-service",
        "execution-results-api",
        "market-data-api",
        "client-reporting-api",
        "strategy-ui",
        "ibkr-gateway-infra",
        "deployment-service",
        "deployment-api",
        "deployment-ui",
        "system-integration-tests",
        "unified-trading-codex",
        "batch-audit-ui",
        "trading-analytics-ui",
        "live-health-monitor-ui",
        "client-reporting-ui",
        "logs-dashboard-ui",
        "onboarding-ui",
        "settlement-ui",
        "unified-trading-pm",
        "unified-trading-ui-auth",
        "execution-analytics-ui",
        "ml-training-ui",
        "features-commodity-service",
        "trading-agent-service",
        # Additional names used internally by the status dashboard
        "market-tick-data-handler",
        "quota-manager",
    }
)

# Secondary guard: syntactic sanity check (lowercase, digits, hyphens only).
_VALID_SERVICE_NAME_RE = re.compile(r"^[a-z][a-z0-9-]{1,63}$")


@router.get("/{service}/status")
async def get_service_status(service: str, request: Request):
    """
    Get comprehensive status for a service.

    Returns temporal audit trail with timestamps for:
    - Last data update (GCS)
    - Last deployment (state files)
    - Last build (Cloud Build API)
    - Last code push (GitHub API)

    Plus anomaly detection.
    """
    # Validate service name against allowlist before passing to any subprocess.
    if not _VALID_SERVICE_NAME_RE.match(service) or service not in VALID_SERVICES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid service name: {service!r}."
                " Must be a known service from the workspace manifest."
            ),
        )

    start_time = time.time()
    timing = {}

    # Fetch all timestamps with individual timing
    parallel_start = time.time()

    data_start = time.time()
    data_info = await get_latest_data_timestamp(service)
    timing["data_fetch_ms"] = int((time.time() - data_start) * 1000)

    deploy_start = time.time()
    deployment_info = await get_latest_deployment(service)
    timing["deploy_fetch_ms"] = int((time.time() - deploy_start) * 1000)

    build_start = time.time()
    build_info = await get_latest_build(service)
    timing["build_fetch_ms"] = int((time.time() - build_start) * 1000)

    timing["parallel_fetch_ms"] = int((time.time() - parallel_start) * 1000)

    # GitHub requires token - access via Secret Manager API
    github_token = None
    try:
        token_overall_start = time.time()
        github_token = await asyncio.to_thread(_get_token_sync)
        logger.info("[PERF] GitHub token fetch took %.2fs total", time.time() - token_overall_start)
    except (OSError, ValueError, RuntimeError) as e:
        logger.warning("Error accessing github-token: %s", e)

    github_start = time.time()
    code_info = await get_latest_code_push(service, github_token)
    logger.info("[TIMING] GitHub fetch took %.2fs", time.time() - github_start)

    # Extract timestamps
    data_ts = None
    if isinstance(data_info, dict) and "latest" in data_info:
        data_ts = data_info["latest"]

    deploy_ts = None
    if isinstance(deployment_info, dict) and "timestamp" in deployment_info:
        deploy_ts = deployment_info["timestamp"]

    build_ts = None
    build_status = None
    if isinstance(build_info, dict) and "timestamp" in build_info:
        build_ts = build_info["timestamp"]
        build_status = build_info.get("status")

    code_ts = None
    if isinstance(code_info, dict) and "timestamp" in code_info:
        code_ts = code_info["timestamp"]

    # Detect anomalies
    anomalies = detect_anomalies(data_ts, deploy_ts, build_ts, code_ts)

    # Determine overall health using extracted function
    deploy_status = None
    if isinstance(deployment_info, dict):
        deploy_status = deployment_info.get("status")

    from .service_status_health import determine_service_health

    health = determine_service_health(
        data_ts=data_ts,
        deploy_ts=deploy_ts,
        deploy_status=deploy_status,
        build_status=build_status,
        anomalies=anomalies,
    )

    # Fetch checklist status (quick lookup from YAML file)
    config_dir = cast(Path, cast(FastAPI, request.app).state.config_dir)
    checklist_status = _read_checklist(config_dir, service)

    # Data coverage - intentionally skipped (too slow for status page)
    # Use dedicated Data Status tab for detailed coverage info
    data_coverage = None

    timing["total_ms"] = int((time.time() - start_time) * 1000)

    return {
        "service": service,
        "health": health,
        "_timing": timing,  # Debug timing info
        "last_data_update": data_ts,
        "last_deployment": deploy_ts,
        "last_build": build_ts,
        "last_code_push": code_ts,
        "anomalies": anomalies,
        "api": {
            "gcs_fuse": get_gcs_fuse_status(),
        },
        "details": {
            "data": data_info if isinstance(data_info, dict) else None,
            "deployment": (deployment_info if isinstance(deployment_info, dict) else None),
            "build": build_info if isinstance(build_info, dict) else None,
            "code": code_info if isinstance(code_info, dict) else None,
        },
        "checklist_status": checklist_status,
        "data_coverage": data_coverage,
    }


@router.get("/overview")
async def get_services_overview(request: Request):
    """
    Get FAST status overview for all services.

    Returns a lightweight summary - skips slow GitHub/Build lookups.
    For full details, query individual service status.
    """
    from deployment_api.config_loader import ConfigLoader

    config_dir = cast(Path, cast(FastAPI, request.app).state.config_dir)
    loader = ConfigLoader(str(config_dir))

    # Get all services (from sharding configs) and include quota-manager for overview
    services = loader.list_available_services()
    if "quota-manager" not in services:
        services = sorted([*services, "quota-manager"])

    # Fetch all in parallel (fast - only GCS lookups)
    results = await asyncio.gather(*[_get_quick_status(svc) for svc in services])

    return {
        "services": list(results),
        "count": len(results),
        "healthy": sum(1 for s in results if s.get("health") == "healthy"),
        "warnings": sum(1 for s in results if s.get("health") in ["warning", "stale"]),
        "errors": sum(1 for s in results if s.get("health") == "error"),
        "note": "For full status including builds/deployments, query individual services",
    }


@router.get("/execution-service/data-status")
async def get_execution_service_data_status_endpoint(
    request: Request,
    config_path: str,
    start_date: str | None = None,
    end_date: str | None = None,
):
    """Get execution-service data status by checking configs vs results."""

    return await get_execution_service_data_status(config_path, start_date, end_date)


@router.post("/execution-service/missing-shards")
async def calculate_execution_missing_shards_endpoint(
    request: Request,
    config_path: str,
    start_date: str,
    end_date: str,
    strategy: str | None = None,
    mode: str | None = None,
    timeframe: str | None = None,
    algo: str | None = None,
):
    """Calculate missing config x date shards for execution-service."""
    return await calculate_execution_missing_shards(
        config_path, start_date, end_date, strategy, mode, timeframe, algo
    )
