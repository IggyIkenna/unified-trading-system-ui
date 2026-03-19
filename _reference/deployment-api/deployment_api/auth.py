"""API key authentication for deployment-api."""

from __future__ import annotations

import logging

from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader
from unified_config_interface import UnifiedCloudConfig
from unified_events_interface import log_event

logger = logging.getLogger(__name__)

# --- Production guard for DISABLE_AUTH ---
_auth_cfg = UnifiedCloudConfig()
# Public alias so other modules (main.py, infra_health.py) can import without
# triggering basedpyright's reportPrivateUsage diagnostic.
auth_cfg = _auth_cfg
_disable_auth_raw: bool = _auth_cfg.disable_auth
_environment: str = _auth_cfg.environment
if _disable_auth_raw and _environment == "production":
    log_event(
        "AUTH_MISCONFIGURED",
        severity="CRITICAL",
        details={"reason": "DISABLE_AUTH_in_production", "environment": _environment},
    )
    raise RuntimeError(
        "DISABLE_AUTH=true is forbidden in production. "
        "Service refuses to start with auth disabled. "
        "Unset DISABLE_AUTH or set ENVIRONMENT != production."
    )
DISABLE_AUTH: bool = _disable_auth_raw
AUTH_ENVIRONMENT: str = _environment

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
service_token_header = APIKeyHeader(name="X-Service-Token", auto_error=False)


async def verify_api_key(
    api_key: str | None = Security(api_key_header),
) -> str:
    """Validate the X-API-Key header against the API_KEY env var.

    Set DISABLE_AUTH=true for local development (defaults to false).
    """
    if DISABLE_AUTH:
        return "dev-mode"
    if not api_key:
        log_event(
            "AUTH_FAILURE",
            severity="WARNING",
            details={"auth_type": "api_key", "reason": "missing_key"},
        )
        raise HTTPException(status_code=401, detail="Missing API key")
    expected_key = _auth_cfg.api_key
    if not expected_key or api_key != expected_key:
        log_event(
            "AUTH_FAILURE",
            severity="WARNING",
            details={"auth_type": "api_key", "reason": "invalid_key"},
        )
        raise HTTPException(status_code=401, detail="Invalid API key")
    logger.info("Authentication successful: auth_type=api_key")
    return api_key


async def verify_service_token(
    service_token: str | None = Security(service_token_header),
) -> str:
    """Validate X-Service-Token header for service-to-service calls.

    Internal endpoints called by peer services should depend on this function.
    In dev/test mode (DISABLE_AUTH=true) all S2S calls are allowed.
    """
    if DISABLE_AUTH:
        return "dev-mode"
    if not service_token:
        log_event(
            "AUTH_FAILURE",
            severity="WARNING",
            details={"auth_type": "service_token", "reason": "missing_token"},
        )
        raise HTTPException(status_code=401, detail="Missing service token")
    expected_token = getattr(_auth_cfg, "service_token", None)
    if not expected_token or service_token != expected_token:
        log_event(
            "AUTH_FAILURE",
            severity="WARNING",
            details={"auth_type": "service_token", "reason": "invalid_token"},
        )
        raise HTTPException(status_code=403, detail="Invalid service token")
    logger.info("Authentication successful: auth_type=service_token")
    return service_token
