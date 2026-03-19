"""
Data query service for file listing and path operations.

Handles GCS bucket operations, file listing, venue filtering,
and instrument availability queries.
"""

import logging
from datetime import UTC, datetime, timedelta
from typing import cast

from deployment_api.settings import gcp_project_id as _pid
from deployment_api.utils.storage_facade import (
    ObjectInfo,
    list_objects,
    list_prefixes,
    object_exists,
)

logger = logging.getLogger(__name__)


class DataQueryService:
    """
    Query service for data operations.

    This service handles:
    - GCS bucket file listing
    - Path-based data queries
    - Venue filtering operations
    - Instrument availability checks
    """

    def __init__(self, project_id: str | None = None):
        """Initialize data query service."""
        self.project_id = project_id or _pid

    def build_bucket_name(self, prefix: str, category: str) -> str:
        """Build a GCS bucket name: {prefix}-{category_lower}-{project_id}."""
        return f"{prefix}-{category.lower()}-{self.project_id}"

    async def list_files_in_path(
        self,
        bucket_name: str,
        path: str = "",
        max_results: int = 100,
        show_dirs: bool = False,
    ) -> dict[str, object]:
        """
        List files in a specific GCS bucket path.

        Args:
            bucket_name: GCS bucket name
            path: Path within bucket (optional)
            max_results: Maximum number of results to return
            show_dirs: Whether to include directory-like prefixes

        Returns:
            Dictionary containing file listing results
        """
        try:
            logger.info("Listing files in %s/%s", bucket_name, path)

            files: list[dict[str, object]] = []
            directories: set[str] = set()
            truncated: bool = False

            # List objects in the path
            objects: list[ObjectInfo] = list_objects(bucket_name, path, max_results=max_results * 2)

            for obj in objects:
                obj_path: str = obj.name
                # Skip the path itself if it matches exactly
                if obj_path == path:
                    continue

                # Extract relative path from the prefix
                if path and not obj_path.startswith(path):
                    continue

                relative_path = obj_path[len(path) :] if path else obj_path
                relative_path = relative_path.lstrip("/")

                # Check if this looks like a directory
                if "/" in relative_path:
                    # Extract directory name
                    dir_name = relative_path.split("/")[0]
                    full_dir_path = f"{path}/{dir_name}".strip("/") if path else dir_name
                    directories.add(full_dir_path)
                else:
                    # It's a file
                    files.append(
                        {
                            "name": relative_path,
                            "full_path": obj_path,
                            "size": None,  # Would need GCS metadata call to get size
                            "type": "file",
                        }
                    )

            # Limit results
            if len(files) > max_results:
                files = files[:max_results]
                truncated = True

            result: dict[str, object] = {
                "bucket": bucket_name,
                "path": path,
                "files": files,
                "directories": [{"name": d, "type": "directory"} for d in sorted(directories)],
                "total_count": len(files) + len(directories),
                "truncated": truncated,
            }

            return result

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error listing files in %s/%s: %s", bucket_name, path, e)
            return {"error": str(e)}

    async def get_venue_filters(self, service: str) -> dict[str, object]:
        """
        Get available venue filters for a service.

        Args:
            service: Service name to get venues for

        Returns:
            Dictionary containing available venues by category
        """
        # Service to bucket mappings
        service_mappings = {
            "market-tick-data-handler": {
                "prefix": "market-data",
                "categories": ["cefi", "tradfi", "defi"],
            },
            "market-data-processing-service": {
                "prefix": "processed-market-data",
                "categories": ["cefi", "tradfi", "defi"],
            },
            "instruments-service": {
                "prefix": "instruments",
                "categories": ["cefi", "tradfi", "defi"],
            },
            "features-equity-service": {
                "prefix": "features-equity",
                "categories": ["tradfi"],
            },
            "features-derivatives-service": {
                "prefix": "features-derivatives",
                "categories": ["cefi"],
            },
            "features-defi-service": {
                "prefix": "features-defi",
                "categories": ["defi"],
            },
        }

        mapping = service_mappings.get(service)
        if not mapping:
            return {"error": f"Unknown service: {service}"}

        categories_result: dict[str, dict[str, object]] = {}
        venue_filters: dict[str, object] = {
            "service": service,
            "categories": categories_result,
        }

        for category in cast(list[str], mapping.get("categories") or []):
            try:
                bucket_name = self.build_bucket_name(
                    cast(str, mapping.get("prefix") or ""), category
                )
                venues: list[str] = []

                # List prefixes to find venue directories
                # Assuming structure: bucket/venue/date/... or bucket/date/venue/...
                prefixes = list_prefixes(bucket_name, "")

                # Extract venue names from prefixes
                for prefix in prefixes[:50]:  # Limit to avoid huge responses
                    # Remove trailing slash
                    clean_prefix = prefix.rstrip("/")

                    # Extract potential venue name
                    # This is heuristic - actual structure may vary
                    parts = clean_prefix.split("/")
                    if parts:
                        venue_name = parts[0]
                        if venue_name and venue_name not in venues:
                            venues.append(venue_name)

                categories_result[category] = {
                    "venues": sorted(venues),
                    "count": len(venues),
                }

            except (OSError, ValueError, RuntimeError) as e:
                logger.debug("Error getting venues for %s: %s", category, e)
                categories_result[category] = {
                    "error": str(e),
                    "venues": [],
                    "count": 0,
                }

        return venue_filters

    async def get_instruments_list(
        self,
        category: str,
        venue: str | None = None,
        instrument_type: str | None = None,
        limit: int = 100,
    ) -> dict[str, object]:
        """
        Get list of instruments for a category.

        Args:
            category: Category (cefi, tradfi, defi)
            venue: Optional venue filter
            instrument_type: Optional instrument type filter
            limit: Maximum number of instruments to return

        Returns:
            Dictionary containing instruments list
        """
        try:
            # Map to instruments bucket
            bucket_name = self.build_bucket_name("instruments", category)

            # Build path based on filters
            path = ""
            if venue:
                path = f"{venue}/"
            if instrument_type:
                # Map instrument type to folder structure
                type_mapping = {
                    "SPOT": "spot_pairs",
                    "PERPETUAL": "perps",
                    "FUTURE": "futures",
                    "OPTION": "options",
                    "EQUITY": "equities",
                    "BOND": "bonds",
                    "ETF": "etfs",
                }
                folder = type_mapping.get(instrument_type.upper())
                if folder:
                    path += f"{folder}/"

            # List files to find instruments
            objects_list: list[ObjectInfo] = list_objects(bucket_name, path, max_results=limit * 2)

            instruments: list[str] = []
            truncated_instr: bool = False
            for obj in objects_list:
                # Extract instrument name from path
                # Assuming structure like: venue/type/instrument_name.parquet
                parts = obj.name.split("/")
                if len(parts) >= 2:
                    filename = parts[-1]
                    # Remove file extension
                    instrument_name = filename.rsplit(".", 1)[0] if "." in filename else filename

                    if instrument_name and instrument_name not in instruments:
                        instruments.append(instrument_name)

                        if len(instruments) >= limit:
                            truncated_instr = True
                            break

            instruments_result: dict[str, object] = {
                "category": category,
                "venue": venue,
                "instrument_type": instrument_type,
                "instruments": sorted(instruments),
                "total_count": len(instruments),
                "truncated": truncated_instr,
            }

            return instruments_result

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error getting instruments list: %s", e)
            return {"error": str(e)}

    def _venue_to_category(self, venue: str) -> str | None:
        """Map a venue name to its market category (CEFI/TRADFI/DEFI), or None."""
        venue_upper = venue.upper()
        if any(k in venue_upper for k in ["BINANCE", "BYBIT", "OKX", "DERIBIT", "BITMEX"]):
            return "CEFI"
        if any(k in venue_upper for k in ["NYSE", "NASDAQ", "CME", "CBOE", "ICE"]):
            return "TRADFI"
        if any(k in venue_upper for k in ["UNISWAP", "AAVE", "CURVE", "BALANCER"]):
            return "DEFI"
        return None

    def _parse_avail_date(self, raw: str, label: str) -> datetime | None:
        """Parse an availability date string to a timezone-aware datetime."""
        try:
            if "T" in raw:
                return datetime.fromisoformat(raw.replace("Z", "+00:00"))
            return datetime.strptime(raw, "%Y-%m-%d").replace(tzinfo=UTC)
        except (ValueError, TypeError):
            logger.warning("Could not parse %s: %s", label, raw)
            return None

    def _default_data_types(self, category: str) -> list[str]:
        """Return default data types for a given market category."""
        defaults: dict[str, list[str]] = {
            "CEFI": ["trades", "book_snapshot_5"],
            "TRADFI": ["trades", "ohlcv_1m", "tbbo"],
            "DEFI": ["swaps", "rate_indices"],
        }
        return defaults.get(category, ["trades"])

    def _check_daily_availability(
        self,
        bucket_name: str,
        venue: str,
        instrument_type: str,
        instrument: str,
        data_types: list[str],
        effective_start: datetime,
        effective_end: datetime,
    ) -> dict[str, dict[str, bool]]:
        """Check data existence for each day in the effective range."""
        daily: dict[str, dict[str, bool]] = {}
        current_dt = effective_start
        while current_dt <= effective_end:
            date_str = current_dt.strftime("%Y-%m-%d")
            daily[date_str] = {}
            for dt in data_types:
                path = f"{venue}/{instrument_type.lower()}/{instrument}/{date_str}/{dt}"
                daily[date_str][dt] = object_exists(bucket_name, path)
            current_dt += timedelta(days=1)
        return daily

    async def get_instrument_availability(
        self,
        venue: str,
        instrument_type: str,
        instrument: str,
        start_date: str,
        end_date: str,
        data_type: str | None = None,
        available_from: str | None = None,
        available_to: str | None = None,
    ) -> dict[str, object]:
        """
        Check instrument availability over a date range.

        Returns dictionary containing availability analysis.
        """
        try:
            category = self._venue_to_category(venue)
            if not category:
                return {"error": f"Could not determine category for venue: {venue}"}

            bucket_name = self.build_bucket_name("market-data", category.lower())

            try:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d").replace(tzinfo=UTC)
                end_dt = datetime.strptime(end_date, "%Y-%m-%d").replace(tzinfo=UTC)
            except ValueError as e:
                return {"error": f"Invalid date format: {e}"}

            avail_from = (
                self._parse_avail_date(available_from, "available_from") if available_from else None
            )
            avail_to = (
                self._parse_avail_date(available_to, "available_to") if available_to else None
            )

            effective_start = max(start_dt, avail_from) if avail_from else start_dt
            effective_end = min(end_dt, avail_to) if avail_to else end_dt

            data_types = [data_type] if data_type else self._default_data_types(category)

            daily_availability = self._check_daily_availability(
                bucket_name,
                venue,
                instrument_type,
                instrument,
                data_types,
                effective_start,
                effective_end,
            )

            total_days = len(daily_availability)
            available_days = sum(1 for d in daily_availability.values() if any(d.values()))

            return {
                "venue": venue,
                "instrument_type": instrument_type,
                "instrument": instrument,
                "date_range": {"start": start_date, "end": end_date},
                "effective_range": {
                    "start": effective_start.strftime("%Y-%m-%d"),
                    "end": effective_end.strftime("%Y-%m-%d"),
                },
                "data_types": data_types,
                "daily_availability": daily_availability,
                "summary": {
                    "total_days": total_days,
                    "available_days": available_days,
                    "missing_days": total_days - available_days,
                    "availability_rate": (
                        available_days / total_days * 100 if total_days > 0 else 0.0
                    ),
                },
            }

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error checking instrument availability: %s", e)
            return {"error": str(e)}
