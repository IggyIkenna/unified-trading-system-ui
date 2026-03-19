"""
Query Client - Advanced cloud storage querying and analytics.

Handles complex querying operations like date checking, venue analysis,
bucket indexing, and parallel scanning operations.

Extracted from deployment-service.
"""

import fnmatch
import logging
import re
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime
from typing import cast

from .storage_client import BucketStats, StorageClient

logger = logging.getLogger(__name__)


@dataclass
class BucketIndex:
    """In-memory index of a bucket scan for fast filtering."""

    bucket_name: str
    prefix: str
    blobs: list[dict[str, object]] = field(default_factory=list)
    dates_found: set[str] = field(default_factory=set)
    scan_time_ms: float = 0

    def filter_by_date(self, date_str: str) -> list[dict[str, object]]:
        """Filter blobs by date (extracted from path, key=value format)."""
        return [b for b in self.blobs if f"day={date_str}" in str(b["name"])]

    def filter_by_pattern(self, pattern: str) -> list[dict[str, object]]:
        """Filter blobs by glob pattern."""
        if pattern == "*":
            return self.blobs
        return [b for b in self.blobs if fnmatch.fnmatch(str(b["name"]), f"*{pattern}")]

    def get_stats(self) -> BucketStats:
        """Get statistics from the index."""
        if not self.blobs:
            return BucketStats(file_count=0, total_size_bytes=0)
        total_size = sum(cast(int, b.get("size", 0)) for b in self.blobs)
        created_times: list[datetime] = [
            cast(datetime, b["created"]) for b in self.blobs if b.get("created")
        ]
        updated_times: list[datetime] = [
            cast(datetime, b["updated"]) for b in self.blobs if b.get("updated")
        ]
        return BucketStats(
            file_count=len(self.blobs),
            total_size_bytes=total_size,
            oldest_file_time=min(created_times) if created_times else None,
            newest_file_time=max(created_times) if created_times else None,
            oldest_update_time=min(updated_times) if updated_times else None,
            newest_update_time=max(updated_times) if updated_times else None,
        )


class QueryClient:
    """Advanced cloud storage query client for complex operations."""

    def __init__(self, storage_client: StorageClient):
        self.storage = storage_client

    def scan_bucket_index(
        self,
        bucket_name: str,
        prefix: str,
        max_results: int = 50000,
        file_filter: Callable[[str], bool] | None = None,
    ) -> BucketIndex:
        """Build an in-memory index of all files in a bucket prefix."""
        start_time = time.time()
        storage_client = self.storage.client
        if self.storage.mock_mode or storage_client is None:
            return BucketIndex(bucket_name=bucket_name, prefix=prefix)
        try:
            bucket = storage_client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=prefix, max_results=max_results)
            index_blobs: list[dict[str, object]] = []
            dates_found: set[str] = set()
            for blob in blobs:
                if file_filter and not file_filter(blob.name):
                    continue
                if "day=" in blob.name:
                    match = re.search(r"day=(\d{4}-\d{2}-\d{2})", blob.name)
                    if match:
                        dates_found.add(match.group(1))
                blob_updated = cast(datetime | None, getattr(blob, "updated", None))
                blob_created = cast(datetime | None, getattr(blob, "time_created", None))
                index_blobs.append(
                    {
                        "name": blob.name,
                        "size": blob.size or 0,
                        "updated": blob_updated,
                        "created": blob_created,
                    }
                )
            scan_time_ms = (time.time() - start_time) * 1000
            return BucketIndex(
                bucket_name=bucket_name,
                prefix=prefix,
                blobs=index_blobs,
                dates_found=dates_found,
                scan_time_ms=scan_time_ms,
            )
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error building bucket index: %s", e)
            return BucketIndex(bucket_name=bucket_name, prefix=prefix)

    def check_dates_exist(
        self, bucket_name: str, prefix: str, dates: list[str], file_pattern: str = "*.parquet"
    ) -> dict[str, bool]:
        """Check if specific dates exist in a bucket using a full bucket scan."""
        index = self.scan_bucket_index(bucket_name, prefix)
        results: dict[str, bool] = {}
        for date_str in dates:
            matching_files = index.filter_by_date(date_str)
            if file_pattern != "*":
                matching_files = [
                    f for f in matching_files if fnmatch.fnmatch(str(f["name"]), f"*{file_pattern}")
                ]
            results[date_str] = len(matching_files) > 0
        return results

    def get_date_stats(
        self,
        bucket_name: str,
        prefix: str,
        dates: list[str],
        file_pattern: str = "*.parquet",
    ) -> dict[str, dict[str, int]]:
        """Get file count statistics for specific dates."""
        index = self.scan_bucket_index(bucket_name, prefix)
        results: dict[str, dict[str, int]] = {}
        for date_str in dates:
            matching_files = index.filter_by_date(date_str)
            if file_pattern != "*":
                matching_files = [
                    f for f in matching_files if fnmatch.fnmatch(str(f["name"]), f"*{file_pattern}")
                ]
            total_size = sum(cast(int, f.get("size") or 0) for f in matching_files)
            results[date_str] = {"file_count": len(matching_files), "total_size": total_size}
        return results

    def check_dates_exist_fast(
        self,
        bucket_name: str,
        prefix_template: str,
        dates: list[str],
        file_pattern: str = "*.parquet",
        max_workers: int = 20,
    ) -> dict[str, dict[str, bool | int]]:
        """Fast check if specific dates exist by querying each date prefix directly."""
        storage_client = self.storage.client
        if self.storage.mock_mode or storage_client is None:
            return {d: {"exists": False, "file_count": 0} for d in dates}

        def check_one_date(date_str: str) -> tuple[str, dict[str, object]]:
            try:
                prefix = prefix_template.format(date=date_str)
                bucket = storage_client.bucket(bucket_name)
                blobs = list(bucket.list_blobs(prefix=prefix, max_results=500))
                if file_pattern and file_pattern != "*":
                    blobs = [b for b in blobs if b.name.endswith(".parquet")]
                return date_str, {"exists": len(blobs) > 0, "file_count": len(blobs)}
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Error checking date %s: %s", date_str, e)
                return date_str, {"exists": False, "file_count": 0}

        results: dict[str, dict[str, bool | int]] = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(check_one_date, d): d for d in dates}
            for future in as_completed(futures):
                date_str, result = future.result()
                results[date_str] = cast(dict[str, bool | int], result)
        return results

    def check_venue_in_dates_fast(
        self,
        bucket_name: str,
        prefix_template: str,
        venue: str,
        dates: list[str],
        max_workers: int = 20,
    ) -> dict[str, dict[str, object]]:
        """Check if a specific venue has data for given dates."""
        storage_client = self.storage.client
        if self.storage.mock_mode or storage_client is None:
            return {d: {"exists": False, "file_count": 0} for d in dates}

        def check_one(date_str: str) -> tuple[str, dict[str, object]]:
            try:
                prefix = prefix_template.format(date=date_str)
                bucket = storage_client.bucket(bucket_name)
                blobs = list(bucket.list_blobs(prefix=prefix, max_results=500))
                venue_blobs = [b for b in blobs if venue.lower() in b.name.lower()]
                return date_str, {"exists": len(venue_blobs) > 0, "file_count": len(venue_blobs)}
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Error checking venue %s for date %s: %s", venue, date_str, e)
                return date_str, {"exists": False, "file_count": 0}

        results: dict[str, dict[str, object]] = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(check_one, d): d for d in dates}
            for future in as_completed(futures):
                date_str, result = future.result()
                results[date_str] = result
        return results

    def check_venue_data_types_detailed(
        self,
        bucket_name: str,
        prefix_template: str,
        venue: str,
        dates: list[str],
        max_workers: int = 15,
    ) -> dict[str, dict[str, dict[str, object]]]:
        """Check what data types a venue has for given dates."""
        storage_client = self.storage.client
        if self.storage.mock_mode or storage_client is None:
            return {}

        def check_one(date_str: str) -> tuple[str, dict[str, dict[str, object]]]:
            try:
                prefix = prefix_template.format(date=date_str)
                bucket = storage_client.bucket(bucket_name)
                blobs = list(bucket.list_blobs(prefix=prefix, max_results=1000))
                venue_blobs = [b for b in blobs if venue.lower() in b.name.lower()]
                data_types: dict[str, dict[str, object]] = {}
                for b in venue_blobs:
                    # Extract data_type from path like data_type=trades/
                    dt_match = re.search(r"data_type=([^/]+)", b.name)
                    dt = dt_match.group(1) if dt_match else "unknown"
                    if dt not in data_types:
                        data_types[dt] = {"file_count": 0, "total_size": 0}
                    data_types[dt]["file_count"] = cast(int, data_types[dt]["file_count"]) + 1
                    data_types[dt]["total_size"] = cast(int, data_types[dt]["total_size"]) + (
                        b.size or 0
                    )
                return date_str, data_types
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning(
                    "Error checking data types for venue %s date %s: %s", venue, date_str, e
                )
                return date_str, {}

        results: dict[str, dict[str, dict[str, object]]] = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(check_one, d): d for d in dates}
            for future in as_completed(futures):
                date_str, result = future.result()
                results[date_str] = result
        return results

    def check_venue_dates_fast(
        self,
        bucket_name: str,
        prefix_template: str,
        venues: list[str],
        dates: list[str],
        max_workers: int = 25,
    ) -> dict[str, dict[str, dict[str, object]]]:
        """Fast check if specific venues have data for specific dates."""
        storage_client = self.storage.client
        if self.storage.mock_mode or storage_client is None:
            return {}

        def check_one(venue: str, date_str: str) -> tuple[str, str, dict[str, object]]:
            try:
                prefix = prefix_template.format(date=date_str)
                bucket = storage_client.bucket(bucket_name)
                blobs = list(bucket.list_blobs(prefix=prefix, max_results=500))
                venue_blobs = [b for b in blobs if venue.lower() in b.name.lower()]
                return (
                    venue,
                    date_str,
                    {"exists": len(venue_blobs) > 0, "file_count": len(venue_blobs)},
                )
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("Error checking venue %s date %s: %s", venue, date_str, e)
                return venue, date_str, {"exists": False, "file_count": 0}

        results: dict[str, dict[str, dict[str, object]]] = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(check_one, v, d): (v, d) for v in venues for d in dates}
            for future in as_completed(futures):
                venue, date_str, result = future.result()
                if venue not in results:
                    results[venue] = {}
                results[venue][date_str] = result
        return results

    def parallel_scan_buckets(
        self, bucket_paths: list[str], max_workers: int = 10, max_results_per_bucket: int = 10000
    ) -> dict[str, BucketIndex]:
        """Scan multiple bucket paths in parallel."""

        def scan_one(path: str) -> tuple[str, BucketIndex]:
            try:
                parts = path.split("/", 1)
                bucket_name = parts[0]
                prefix = parts[1] if len(parts) > 1 else ""
                index = self.scan_bucket_index(bucket_name, prefix, max_results_per_bucket)
                return path, index
            except (OSError, ValueError, RuntimeError) as e:
                logger.error("Error scanning %s: %s", path, e)
                bucket_name = path.split("/")[0]
                return path, BucketIndex(bucket_name=bucket_name, prefix="")

        results: dict[str, BucketIndex] = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(scan_one, path): path for path in bucket_paths}
            for future in as_completed(futures):
                path, index = future.result()
                results[path] = index
        return results
