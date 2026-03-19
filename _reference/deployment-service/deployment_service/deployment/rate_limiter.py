"""
Rate limiting utility for API calls.

Provides token bucket algorithm for controlling request rates to prevent
hitting GCP API rate limits.
"""

import logging
import threading
import time

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Simple rate limiter using token bucket algorithm.

    Used to prevent hitting GCP API rate limits:
    - Compute Engine "Write requests per region": ~1,200/min default
    - Cloud Run "Job run requests per minute": 180/min default

    Both create AND delete operations count against write quotas.
    """

    def __init__(self, requests_per_second: float = 50.0):
        """
        Initialize rate limiter.

        Args:
            requests_per_second: Maximum requests per second.
                Default 50 = 3,000/min, providing 50% headroom under 6,000/min Compute Engine quota.
                This conservative limit helps avoid SSL connection failures and API throttling
                when running alongside other operations (log fetching, status checks, etc.).
        """
        self.requests_per_second = requests_per_second
        self.min_interval = 1.0 / requests_per_second
        self.lock = threading.Lock()
        self.last_request_time = 0.0
        self._request_count = 0

    def acquire(self):
        """Wait if necessary to respect rate limit."""
        with self.lock:
            now = time.time()
            time_since_last = now - self.last_request_time
            if time_since_last < self.min_interval:
                sleep_time = self.min_interval - time_since_last
                time.sleep(sleep_time)
            self.last_request_time = time.time()
            self._request_count += 1

            # Log every 100 requests for visibility
            if self._request_count % 100 == 0:
                logger.debug(
                    "[RATE_LIMITER] %s API requests made at %s/sec",
                    self._request_count,
                    self.requests_per_second,
                )
