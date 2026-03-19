"""Sports-specific typed exceptions for the betting vertical."""

__api_version__ = "v1"  # matches provider_api_versions.yaml


class SportsError(Exception):
    """Base error for all sports betting errors."""


class BookmakerUnavailableError(SportsError):
    """Bookmaker API or scrape target is unreachable or returned an error response."""

    def __init__(self, bookmaker_key: str, reason: str) -> None:
        super().__init__(f"Bookmaker {bookmaker_key!r} unavailable: {reason}")
        self.bookmaker_key = bookmaker_key
        self.reason = reason


class BetRejectedError(SportsError):
    """Bookmaker rejected the bet order (price moved, account restricted, etc.)."""

    def __init__(self, order_id: str, reason: str, bookmaker_key: str) -> None:
        super().__init__(f"Bet {order_id!r} rejected by {bookmaker_key!r}: {reason}")
        self.order_id = order_id
        self.reason = reason
        self.bookmaker_key = bookmaker_key


class OddsChangedError(SportsError):
    """Odds changed beyond acceptable slippage before order was placed."""

    def __init__(self, requested: float, available: float) -> None:
        super().__init__(f"Odds changed: requested {requested}, available {available}")
        self.requested = requested
        self.available = available


class MarketClosedError(SportsError):
    """Market has closed or been suspended before order placement."""


class ScraperError(SportsError):
    """Web scraper failed to extract odds (page structure changed, bot detection, etc.)."""

    def __init__(self, bookmaker_key: str, url: str, reason: str) -> None:
        super().__init__(f"Scraper failed for {bookmaker_key!r} at {url!r}: {reason}")
        self.bookmaker_key = bookmaker_key
        self.url = url
        self.reason = reason


class FixtureNotFoundError(SportsError):
    """Fixture ID not found on this bookmaker or data source."""

    def __init__(self, fixture_id: str, bookmaker_key: str) -> None:
        super().__init__(f"Fixture {fixture_id!r} not found at {bookmaker_key!r}")
        self.fixture_id = fixture_id
        self.bookmaker_key = bookmaker_key
