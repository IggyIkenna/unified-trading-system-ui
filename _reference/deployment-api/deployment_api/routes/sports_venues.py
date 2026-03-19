"""Sports venue configuration management endpoints for deployment-api."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Path, Query
from pydantic import BaseModel, Field
from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/sports/venues", tags=["sports-venues"])

_cloud_cfg = UnifiedCloudConfig()


class VenueStatusResponse(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    venue_key: str
    display_name: str
    status: str = Field(description="active | disabled | unconfigured")
    has_credentials: bool
    credential_secret_path: str | None = None
    execution_method: str
    venue_category: str


class VenueCredentialUpdate(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    secret_manager_path: str = Field(..., description="Secret Manager secret ID")
    username_key: str = Field(default="username")
    password_key: str = Field(default="password")
    api_key_key: str | None = None


class VenueHealthResponse(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    venue_key: str
    reachable: bool
    login_url_status: int | None = None
    last_checked: str | None = None
    notes: str | None = None


MOCK_VENUES: list[dict[str, object]] = [
    {
        "venue_key": "betfair_ex_uk",
        "display_name": "Betfair Exchange UK",
        "status": "active",
        "has_credentials": True,
        "credential_secret_path": "sports-betfair_ex_uk-credentials",
        "execution_method": "rest_api",
        "venue_category": "exchange",
    },
    {
        "venue_key": "pinnacle",
        "display_name": "Pinnacle",
        "status": "active",
        "has_credentials": True,
        "credential_secret_path": "sports-pinnacle-credentials",
        "execution_method": "rest_api",
        "venue_category": "bookmaker_api",
    },
    {
        "venue_key": "draftkings",
        "display_name": "DraftKings",
        "status": "active",
        "has_credentials": True,
        "credential_secret_path": "sports-draftkings-credentials",
        "execution_method": "browser_automation",
        "venue_category": "scraper",
    },
    {
        "venue_key": "bet365_au",
        "display_name": "bet365 (Australia)",
        "status": "disabled",
        "has_credentials": False,
        "credential_secret_path": None,
        "execution_method": "browser_automation",
        "venue_category": "scraper",
    },
]


@router.get("")
def list_sports_venues(
    status_filter: str | None = Query(None, description="Filter: active | disabled | unconfigured"),
) -> dict[str, object]:
    """List all configured sports venues with their status."""
    if _cloud_cfg.is_mock_mode():
        venues = MOCK_VENUES
        if status_filter:
            venues = [v for v in venues if v["status"] == status_filter]
        return {"venues": venues, "total": len(venues)}
    logger.info("list_sports_venues: filter=%s", status_filter)
    return {"venues": [], "total": 0, "status": "live_not_configured"}


@router.put("/{venue_key}/credentials")
def update_venue_credentials(
    venue_key: str = Path(..., description="Venue identifier"),
    body: VenueCredentialUpdate = ...,
) -> dict[str, object]:
    """Update venue credential reference in Secret Manager."""
    if _cloud_cfg.is_mock_mode():
        return {
            "venue_key": venue_key,
            "status": "updated",
            "secret_manager_path": body.secret_manager_path,
        }
    logger.info("update_venue_credentials: venue=%s path=%s", venue_key, body.secret_manager_path)
    return {"venue_key": venue_key, "status": "live_not_configured"}


@router.get("/{venue_key}/health")
def check_venue_health(
    venue_key: str = Path(..., description="Venue identifier"),
) -> VenueHealthResponse:
    """Health check for venue connectivity (login URL reachable, API responding)."""
    if _cloud_cfg.is_mock_mode():
        return VenueHealthResponse(
            venue_key=venue_key,
            reachable=True,
            login_url_status=200,
            last_checked="2026-03-15T14:00:00Z",
            notes="Mock mode — no real connectivity check",
        )
    logger.info("check_venue_health: venue=%s", venue_key)
    return VenueHealthResponse(
        venue_key=venue_key, reachable=False, notes="Live check not configured"
    )


@router.post("/{venue_key}/enable")
def enable_venue(
    venue_key: str = Path(..., description="Venue identifier"),
) -> dict[str, object]:
    """Enable a sports venue for betting."""
    if _cloud_cfg.is_mock_mode():
        return {
            "venue_key": venue_key,
            "status": "enabled",
            "message": f"{venue_key} enabled for betting",
        }
    logger.info("enable_venue: %s", venue_key)
    return {"venue_key": venue_key, "status": "live_not_configured"}


@router.post("/{venue_key}/disable")
def disable_venue(
    venue_key: str = Path(..., description="Venue identifier"),
) -> dict[str, object]:
    """Disable a sports venue for betting."""
    if _cloud_cfg.is_mock_mode():
        return {"venue_key": venue_key, "status": "disabled", "message": f"{venue_key} disabled"}
    logger.info("disable_venue: %s", venue_key)
    return {"venue_key": venue_key, "status": "live_not_configured"}
