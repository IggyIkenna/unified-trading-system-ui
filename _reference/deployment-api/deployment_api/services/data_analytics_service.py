"""
Data analytics service for aggregation and caching.

Handles turbo mode caching, cache statistics, and advanced
data aggregation operations for performance optimization.
"""

import json
import logging
from collections.abc import Callable, Coroutine
from datetime import UTC, datetime, timedelta
from typing import Any, TypedDict, cast

logger = logging.getLogger(__name__)


class _CacheStats(TypedDict):
    hits: int
    misses: int
    entries: int
    last_cleared: datetime
    total_size_estimate: int


class DataAnalyticsService:
    """
    Analytics and caching service for data operations.

    This service handles:
    - Turbo mode result caching
    - Cache statistics and management
    - Data aggregation operations
    - Performance optimization features
    """

    def __init__(self):
        """Initialize data analytics service."""
        # In-memory cache for turbo mode results
        self._turbo_cache: dict[str, dict[str, object]] = {}
        self._cache_stats: _CacheStats = {
            "hits": 0,
            "misses": 0,
            "entries": 0,
            "last_cleared": datetime.now(UTC),
            "total_size_estimate": 0,
        }

    def _generate_cache_key(
        self,
        service: str,
        start_date: str,
        end_date: str,
        categories: list[str] | None = None,
        venues: list[str] | None = None,
        **kwargs: object,
    ) -> str:
        """
        Generate a cache key for turbo mode results.

        Args:
            service: Service name
            start_date: Start date
            end_date: End date
            categories: Categories filter
            venues: Venues filter
            **kwargs: Additional parameters

        Returns:
            Cache key string
        """
        key_parts = [
            service,
            start_date,
            end_date,
        ]

        if categories:
            key_parts.append(f"cats:{','.join(sorted(categories))}")
        if venues:
            key_parts.append(f"venues:{','.join(sorted(venues))}")

        # Add other parameters
        for k, v in sorted(kwargs.items()):
            if v is not None:
                key_parts.append(f"{k}:{v}")

        return "|".join(key_parts)

    def get_cached_result(self, cache_key: str) -> dict[str, object] | None:
        """
        Get cached result if available and not expired.

        Args:
            cache_key: Cache key to look up

        Returns:
            Cached result or None if not found/expired
        """
        if cache_key not in self._turbo_cache:
            self._cache_stats["misses"] += 1
            return None

        cached_entry = self._turbo_cache[cache_key]

        # Check if expired (cache TTL: 5 minutes for turbo mode)
        cache_time = cast(str | None, cached_entry.get("cached_at"))
        if not cache_time:
            # Invalid cache entry
            del self._turbo_cache[cache_key]
            self._cache_stats["misses"] += 1
            return None

        cache_dt = datetime.fromisoformat(cache_time)
        if datetime.now(UTC) - cache_dt > timedelta(minutes=5):
            # Expired
            del self._turbo_cache[cache_key]
            self._cache_stats["entries"] = len(self._turbo_cache)
            self._cache_stats["misses"] += 1
            return None

        # Cache hit
        self._cache_stats["hits"] += 1
        return cast(dict[str, object] | None, cached_entry.get("result"))

    def cache_result(self, cache_key: str, result: dict[str, object]) -> None:
        """
        Cache a result with timestamp.

        Args:
            cache_key: Cache key
            result: Result to cache
        """
        cache_entry: dict[str, object] = {
            "result": result,
            "cached_at": datetime.now(UTC).isoformat(),
            "size_estimate": len(json.dumps(result)),
        }

        self._turbo_cache[cache_key] = cache_entry
        self._cache_stats["entries"] = len(self._turbo_cache)

        # Update size estimate
        total_size = sum(
            cast(int, entry.get("size_estimate", 0)) for entry in self._turbo_cache.values()
        )
        self._cache_stats["total_size_estimate"] = total_size

        # Evict old entries if cache gets too large (> 100 entries)
        if len(self._turbo_cache) > 100:
            self._evict_old_entries()

    def _evict_old_entries(self) -> None:
        """Evict oldest cache entries to manage memory."""
        # Sort by cached_at time and remove oldest 20%
        entries_with_time: list[tuple[datetime, str]] = []
        for key, entry in self._turbo_cache.items():
            cached_at = cast(str | None, entry.get("cached_at"))
            if cached_at:
                try:
                    cache_time = datetime.fromisoformat(cached_at)
                    entries_with_time.append((cache_time, key))
                except (ValueError, TypeError):
                    # Invalid timestamp, mark for removal
                    entries_with_time.append((datetime.min, key))

        entries_with_time.sort()

        # Remove oldest 20%
        num_to_remove = max(1, len(entries_with_time) // 5)
        for _, key in entries_with_time[:num_to_remove]:
            if key in self._turbo_cache:
                del self._turbo_cache[key]

        self._cache_stats["entries"] = len(self._turbo_cache)
        logger.info("Evicted %s old cache entries", num_to_remove)

    async def get_data_status_turbo(
        self,
        service: str,
        start_date: str,
        end_date: str,
        from_data_status_service: Callable[  # Callable to get fresh data
            ..., Coroutine[Any, Any, dict[str, object]]
        ],
        categories: list[str] | None = None,
        venues: list[str] | None = None,
    ) -> dict[str, object]:
        """
        Get data status with turbo mode caching.

        Args:
            service: Service name
            start_date: Start date
            end_date: End date
            categories: Categories filter
            venues: Venues filter
            from_data_status_service: Callable to get fresh data

        Returns:
            Data status result (cached or fresh)
        """
        # Generate cache key
        cache_key = self._generate_cache_key(
            service=service,
            start_date=start_date,
            end_date=end_date,
            categories=categories,
            venues=venues,
        )

        # Check cache first
        cached_result = self.get_cached_result(cache_key)
        if cached_result is not None:
            # Add turbo indicator
            cached_result["turbo_mode"] = True
            cached_result["from_cache"] = True
            return cached_result

        # Get fresh data
        fresh_result = await from_data_status_service(
            service=service,
            start_date=start_date,
            end_date=end_date,
            categories=categories,
            venues=venues,
        )

        # Cache the result if successful
        if "error" not in fresh_result:
            fresh_result["turbo_mode"] = True
            fresh_result["from_cache"] = False
            self.cache_result(cache_key, fresh_result)

        return fresh_result

    async def get_cache_stats(self) -> dict[str, object]:
        """
        Get cache statistics.

        Returns:
            Dictionary containing cache statistics
        """
        total_requests = self._cache_stats["hits"] + self._cache_stats["misses"]
        hit_rate = (self._cache_stats["hits"] / total_requests * 100) if total_requests > 0 else 0.0

        return {
            "turbo_cache": {
                "hits": self._cache_stats["hits"],
                "misses": self._cache_stats["misses"],
                "hit_rate": hit_rate,
                "entries": self._cache_stats["entries"],
                "estimated_size_bytes": self._cache_stats["total_size_estimate"],
                "last_cleared": self._cache_stats["last_cleared"].isoformat(),
            },
            "memory_usage": {
                "cache_entries": len(self._turbo_cache),
                "avg_entry_size": (
                    self._cache_stats["total_size_estimate"] // len(self._turbo_cache)
                    if len(self._turbo_cache) > 0
                    else 0
                ),
            },
        }

    async def clear_cache(self) -> dict[str, object]:
        """
        Clear the turbo mode cache.

        Returns:
            Result of cache clearing operation
        """
        entries_cleared = len(self._turbo_cache)
        size_cleared = self._cache_stats["total_size_estimate"]

        self._turbo_cache.clear()
        self._cache_stats["entries"] = 0
        self._cache_stats["total_size_estimate"] = 0
        self._cache_stats["last_cleared"] = datetime.now(UTC)

        return {
            "success": True,
            "entries_cleared": entries_cleared,
            "size_cleared_bytes": size_cleared,
            "cleared_at": self._cache_stats["last_cleared"].isoformat(),
        }

    def _aggregate_dates_data(
        self,
        dates_data: list[dict[str, object]],
    ) -> tuple[list[dict[str, object]], dict[str, dict[str, int]]]:
        """Aggregate daily completions and per-venue stats from dates data."""
        daily_completions: list[dict[str, object]] = []
        venue_stats: dict[str, dict[str, int]] = {}
        for date_info in dates_data:
            date_str = date_info.get("date")
            venues_info = cast(list[dict[str, object]], date_info.get("venues") or [])
            total_venues = len(venues_info)
            completed_venues = sum(1 for v in venues_info if v.get("status") != "missing")
            completion_rate = (completed_venues / total_venues * 100) if total_venues > 0 else 0
            daily_completions.append(
                {
                    "date": date_str,
                    "completion_rate": completion_rate,
                    "total_venues": total_venues,
                    "completed_venues": completed_venues,
                }
            )
            for venue_info in venues_info:
                venue_name = cast(str, venue_info.get("venue", "unknown"))
                status = cast(str, venue_info.get("status", "unknown"))
                if venue_name not in venue_stats:
                    venue_stats[venue_name] = {"total": 0, "completed": 0, "missing": 0}
                venue_stats[venue_name]["total"] += 1
                if status == "missing":
                    venue_stats[venue_name]["missing"] += 1
                else:
                    venue_stats[venue_name]["completed"] += 1
        return daily_completions, venue_stats

    def _build_venue_reliability(
        self,
        venue_stats: dict[str, dict[str, int]],
    ) -> dict[str, dict[str, object]]:
        """Compute per-venue reliability metrics."""
        venue_reliability: dict[str, dict[str, object]] = {}
        for venue, stats in venue_stats.items():
            if stats["total"] > 0:
                reliability = (stats["completed"] / stats["total"]) * 100
                venue_reliability[venue] = {
                    "reliability_percent": reliability,
                    "total_checks": stats["total"],
                    "successful": stats["completed"],
                    "failed": stats["missing"],
                }
        return venue_reliability

    async def analyze_data_patterns(
        self,
        service: str,
        data_status_result: dict[str, object],
    ) -> dict[str, object]:
        """
        Analyze data patterns from status results.

        Returns analysis of data patterns and trends.
        """
        if "error" in data_status_result:
            return {"error": "Cannot analyze data with errors"}

        patterns: dict[str, object] = {}
        trends: dict[str, object] = {}
        recommendations: list[str] = []
        analysis: dict[str, object] = {
            "service": service,
            "analyzed_at": datetime.now(UTC).isoformat(),
            "patterns": patterns,
            "trends": trends,
            "recommendations": recommendations,
        }

        if "dates" not in data_status_result:
            return analysis

        dates_data = cast(list[dict[str, object]], data_status_result["dates"])
        daily_completions, venue_stats = self._aggregate_dates_data(dates_data)

        completion_rate_stats: dict[str, object] = {}
        if daily_completions:
            completion_rates = [cast(float, d["completion_rate"]) for d in daily_completions]
            completion_rate_stats = {
                "average": sum(completion_rates) / len(completion_rates),
                "minimum": min(completion_rates),
                "maximum": max(completion_rates),
                "variance": self._calculate_variance(completion_rates),
            }
            patterns["completion_rate"] = completion_rate_stats
            trends["completion_trend"] = self._calculate_trend(completion_rates)

        venue_reliability = self._build_venue_reliability(venue_stats)
        patterns["venue_reliability"] = venue_reliability

        if completion_rate_stats and cast(float, completion_rate_stats.get("average", 100)) < 90:
            recommendations.append(
                "Overall completion rate is below 90% - investigate data pipeline issues"
            )

        problematic_venues = [
            venue
            for venue, vstats in venue_reliability.items()
            if cast(float, vstats.get("reliability_percent", 100)) < 80
        ]
        if problematic_venues:
            recommendations.append(
                f"Low reliability venues detected: {', '.join(problematic_venues[:5])}"
            )

        return analysis

    def _calculate_variance(self, values: list[float]) -> float:
        """Calculate variance of a list of values."""
        if len(values) < 2:
            return 0.0
        mean = sum(values) / len(values)
        return sum((x - mean) ** 2 for x in values) / len(values)

    def _calculate_trend(self, values: list[float]) -> str:
        """Calculate simple trend direction."""
        if len(values) < 3:
            return "insufficient_data"

        # Compare first third with last third
        first_third = values[: len(values) // 3]
        last_third = values[-len(values) // 3 :]

        avg_first = sum(first_third) / len(first_third)
        avg_last = sum(last_third) / len(last_third)

        diff = avg_last - avg_first

        if abs(diff) < 2:  # Less than 2% change
            return "stable"
        elif diff > 0:
            return "improving"
        else:
            return "declining"

    async def aggregate_multi_service_status(
        self,
        services: list[str],
        start_date: str,
        end_date: str,
        from_data_status_service: Callable[  # Callable to get data status
            ..., Coroutine[Any, Any, dict[str, object]]
        ],
        categories: list[str] | None = None,
    ) -> dict[str, object]:
        """
        Aggregate data status across multiple services.

        Args:
            services: List of service names
            start_date: Start date
            end_date: End date
            categories: Categories filter
            from_data_status_service: Callable to get service status

        Returns:
            Aggregated status across all services
        """
        service_results: dict[str, dict[str, object]] = {}
        overall_summary: dict[str, object] = {
            "total_services": len(services),
            "successful_services": 0,
            "failed_services": 0,
            "overall_completion_rate": 0.0,
        }
        aggregated: dict[str, object] = {
            "services": services,
            "date_range": {"start": start_date, "end": end_date},
            "categories": categories,
            "aggregated_at": datetime.now(UTC).isoformat(),
            "service_results": service_results,
            "overall_summary": overall_summary,
        }

        service_completion_rates: list[float] = []

        for service in services:
            try:
                result = await from_data_status_service(
                    service=service,
                    start_date=start_date,
                    end_date=end_date,
                    categories=categories,
                )

                if "error" in result:
                    service_results[service] = {
                        "status": "error",
                        "error": result["error"],
                    }
                    overall_summary["failed_services"] = (
                        cast(int, overall_summary["failed_services"]) + 1
                    )
                else:
                    # Calculate service completion rate
                    service_rate = self._extract_completion_rate(result)
                    service_results[service] = {
                        "status": "success",
                        "completion_rate": service_rate,
                        "data": result,
                    }
                    service_completion_rates.append(service_rate)
                    overall_summary["successful_services"] = (
                        cast(int, overall_summary["successful_services"]) + 1
                    )

            except (OSError, ValueError, RuntimeError) as e:
                logger.error("Error getting status for service %s: %s", service, e)
                service_results[service] = {
                    "status": "error",
                    "error": str(e),
                }
                overall_summary["failed_services"] = (
                    cast(int, overall_summary["failed_services"]) + 1
                )

        # Calculate overall completion rate
        if service_completion_rates:
            overall_summary["overall_completion_rate"] = sum(service_completion_rates) / len(
                service_completion_rates
            )

        return aggregated

    def _extract_completion_rate(self, data_status_result: dict[str, object]) -> float:
        """Extract completion rate from a data status result."""
        if "dates" not in data_status_result:
            return 0.0

        total_checks = 0
        completed_checks = 0

        for date_info in cast(list[dict[str, object]], data_status_result["dates"]):
            venues = cast(list[dict[str, object]], date_info.get("venues") or [])
            total_checks += len(venues)
            completed_checks += sum(1 for v in venues if v.get("status") != "missing")

        return (completed_checks / total_checks * 100) if total_checks > 0 else 0.0
