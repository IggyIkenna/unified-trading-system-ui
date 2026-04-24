from enum import StrEnum


class MarketCategory(StrEnum):
    """Canonical market categories used across all services.

    Note: UAC VENUE_CATEGORY_MAP uses lowercase values ("cefi", "tradfi").
    This enum uses UPPERCASE to match service conventions.
    Use .lower() when comparing with VENUE_CATEGORY_MAP.
    """

    CEFI = "CEFI"
    TRADFI = "TRADFI"
    DEFI = "DEFI"
    SPORTS = "SPORTS"
    PREDICTION = "PREDICTION"
