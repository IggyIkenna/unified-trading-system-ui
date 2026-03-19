"""Venue error classifications for alternative data providers."""

from __future__ import annotations

from ._types import ErrorAction, VenueErrorClassification, ve

VENUE_ERRORS_ALTDATA: dict[str, list[VenueErrorClassification]] = {
    "glassnode": [
        ve(
            "glassnode",
            "429",
            retry=True,
            reconnect=False,
            action=ErrorAction.RETRY,
            desc="Rate limit exceeded",
        ),
        ve(
            "glassnode",
            "401",
            retry=False,
            reconnect=False,
            action=ErrorAction.FAIL,
            desc="Unauthorized — invalid API key",
        ),
        ve(
            "glassnode",
            "403",
            retry=False,
            reconnect=False,
            action=ErrorAction.FAIL,
            desc="Forbidden — metric requires higher tier",
        ),
        ve(
            "glassnode",
            "400",
            retry=False,
            reconnect=False,
            action=ErrorAction.FAIL,
            desc="Bad request — invalid metric or parameter",
        ),
        ve(
            "glassnode",
            "500",
            retry=True,
            reconnect=False,
            action=ErrorAction.RETRY,
            desc="Internal server error",
        ),
    ],
    "arkham": [
        ve(
            "arkham",
            "429",
            retry=True,
            reconnect=False,
            action=ErrorAction.RETRY,
            desc="Rate limit exceeded",
        ),
        ve(
            "arkham",
            "401",
            retry=False,
            reconnect=False,
            action=ErrorAction.FAIL,
            desc="Unauthorized — invalid API key",
        ),
        ve(
            "arkham",
            "400",
            retry=False,
            reconnect=False,
            action=ErrorAction.FAIL,
            desc="Bad request — invalid address or parameter",
        ),
        ve(
            "arkham",
            "404",
            retry=False,
            reconnect=False,
            action=ErrorAction.FAIL,
            desc="Entity or address not found",
        ),
        ve(
            "arkham",
            "500",
            retry=True,
            reconnect=False,
            action=ErrorAction.RETRY,
            desc="Internal server error",
        ),
    ],
}
