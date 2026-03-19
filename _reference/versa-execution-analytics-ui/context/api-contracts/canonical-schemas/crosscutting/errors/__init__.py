"""Canonical error schemas and venue error classification maps."""

from ._canonical import *  # noqa: F403
from ._canonical import ErrorAction
from ._types import (
    DATABENTO_ERROR_MAP,
    DatabentoError,
    RateLimitResponse,
    VenueErrorClassification,
    WebSocketCloseInfo,
    ve,
)
from .altdata import VENUE_ERRORS_ALTDATA
from .cefi import VENUE_ERRORS_CEFI
from .defi import VENUE_ERRORS_DEFI
from .infra import INFRA_ERRORS
from .onchain_perps import VENUE_ERRORS_ONCHAIN_PERPS
from .sports import VENUE_ERRORS_SPORTS
from .tradfi import VENUE_ERRORS_TRADFI

VENUE_ERROR_MAP: dict[str, list[VenueErrorClassification]] = {
    **VENUE_ERRORS_CEFI,
    **VENUE_ERRORS_ALTDATA,
    **VENUE_ERRORS_DEFI,
    **VENUE_ERRORS_SPORTS,
    **VENUE_ERRORS_TRADFI,
    **VENUE_ERRORS_ONCHAIN_PERPS,
    **INFRA_ERRORS,
}


def classify_venue_error(venue: str, error_code: str) -> VenueErrorClassification | None:
    """Classify a venue error code using normalized VENUE_ERROR_MAP."""
    venue_key = venue.lower()
    classifications = VENUE_ERROR_MAP.get(venue_key, [])
    code_str = str(error_code)
    for c in classifications:
        if c.error_code == code_str:
            return c
    return None


__all__ = [
    "DATABENTO_ERROR_MAP",
    "INFRA_ERRORS",
    "VENUE_ERRORS_ALTDATA",
    "VENUE_ERRORS_CEFI",
    "VENUE_ERRORS_DEFI",
    "VENUE_ERRORS_ONCHAIN_PERPS",
    "VENUE_ERRORS_SPORTS",
    "VENUE_ERRORS_TRADFI",
    "VENUE_ERROR_MAP",
    "DatabentoError",
    "ErrorAction",
    "RateLimitResponse",
    "VenueErrorClassification",
    "WebSocketCloseInfo",
    "classify_venue_error",
    "ve",
]
