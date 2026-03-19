from enum import StrEnum


class Timeframe(StrEnum):
    """Canonical timeframe definitions used across feature services.

    Note: UAC TIMEFRAMES provides these as a plain list.
    This enum adds type safety + the TIMEFRAME_TO_SECONDS mapping.
    Superset of UCI lookback_constants.py entries — includes 30s, 30m, 1d.
    """

    T15S = "15s"
    T30S = "30s"
    T1M = "1m"
    T5M = "5m"
    T15M = "15m"
    T30M = "30m"
    T1H = "1h"
    T4H = "4h"
    T24H = "24h"
    T1D = "1d"


TIMEFRAME_TO_SECONDS: dict[str, int] = {
    "15s": 15,
    "30s": 30,
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "30m": 1800,
    "1h": 3600,
    "4h": 14400,
    "24h": 86400,
    "1d": 86400,
}
