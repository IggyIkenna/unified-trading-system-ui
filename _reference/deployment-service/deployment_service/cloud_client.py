"""
Cloud Client - Cloud-agnostic storage operations for dynamic sharding - Unified Interface.

This module provides a cloud-agnostic interface for storage operations,
leveraging unified-trading-library for the underlying implementation.

For full cloud storage functionality, install unified-trading-library:
    pip install git+https://github.com/IggyIkenna/unified-trading-library.git

This enables:
- GCS (Google Cloud Storage)
- S3 (AWS) - planned
- Azure Blob Storage - planned

Performance optimizations:
- Batch blob listing (one API call per bucket, not per date)
- Parallel scanning across buckets with ThreadPoolExecutor
- In-memory index parsing for fast filtering
"""

import logging
from collections.abc import Callable

from .cloud.query_client import BucketIndex, QueryClient
from .cloud.storage_client import BucketStats, FileMetadata, StorageClient

logger = logging.getLogger(__name__)


class CloudClient:
    """
    Cloud-agnostic storage client for listing config files.

    Uses unified-trading-library for the underlying implementation when available,
    with fallback to direct GCS client.

    Usage::

        client = CloudClient()
        files = client.list_files("gs://bucket/prefix", "*.json")  # noqa: gs-uri
    """

    def __init__(self, project_id: str | None = None, provider: str = "gcs"):
        """
        Initialize the cloud client.

        Args:
            project_id: Cloud project ID (defaults to GCP_PROJECT_ID env var)
            provider: Cloud provider ("gcs", "s3", "azure") - currently only GCS supported
        """
        # Initialize underlying clients
        self._storage_client = StorageClient(project_id=project_id, provider=provider)
        self._query_client = QueryClient(self._storage_client)

        # Expose properties from storage client
        self.project_id: str | None = self._storage_client.project_id
        self.provider: str = self._storage_client.provider
        self._mock_mode: bool = self._storage_client.mock_mode

    @property
    def client(self):
        """Lazy-load the cloud client."""
        return self._storage_client.client

    # Basic Storage Operations (delegate to storage client)
    def list_files(
        self,
        cloud_path: str,
        pattern: str = "*",
        max_results: int = 1000,
    ) -> list[str]:
        """
        List files in a cloud storage path matching a pattern.

        Args:
            cloud_path: Cloud path (e.g., "gs://bucket/prefix" or "s3://bucket/prefix")  # noqa: gs-uri
            pattern: Glob pattern to match files (e.g., "*.json", "**/*.json")
            max_results: Maximum number of results to return

        Returns:
            List of full cloud paths
        """
        return self._storage_client.list_files(cloud_path, pattern, max_results)

    def file_exists(self, cloud_path: str) -> bool:
        """
        Check if a file exists in cloud storage.

        Args:
            cloud_path: Full cloud path to the file

        Returns:
            True if file exists, False otherwise
        """
        return self._storage_client.file_exists(cloud_path)

    def check_prefix_exists(self, bucket_name: str, prefix: str) -> bool:
        """
        Check if any files exist with the given prefix.

        Args:
            bucket_name: Cloud bucket name
            prefix: Prefix to check

        Returns:
            True if any files exist with the prefix, False otherwise
        """
        return self._storage_client.check_prefix_exists(bucket_name, prefix)

    def count_files(
        self,
        bucket_name: str,
        prefix: str,
        pattern: str = "*",
        max_scan: int = 10000,
    ) -> int:
        """
        Count files in a bucket/prefix matching a pattern.

        Args:
            bucket_name: Bucket name
            prefix: Prefix to search within
            pattern: Pattern to match (default: all files)
            max_scan: Maximum files to scan (default: 10000)

        Returns:
            Number of matching files
        """
        return self._storage_client.count_files(bucket_name, prefix, pattern, max_scan)

    def get_bucket_stats(
        self,
        bucket_name: str,
        prefix: str = "",
        pattern: str = "*",
        max_scan: int = 10000,
    ) -> BucketStats:
        """
        Get statistics for files in a bucket/prefix.

        Args:
            bucket_name: Bucket name
            prefix: Prefix to search within
            pattern: Pattern to match (default: all files)
            max_scan: Maximum files to scan (default: 10000)

        Returns:
            BucketStats object with file count, size, and time ranges
        """
        return self._storage_client.get_bucket_stats(bucket_name, prefix, pattern, max_scan)

    def list_files_with_metadata(
        self,
        cloud_path: str,
        pattern: str = "*",
        max_results: int = 1000,
    ) -> list[FileMetadata]:
        """
        List files with metadata.

        Args:
            cloud_path: Cloud path (e.g., "gs://bucket/prefix")  # noqa: gs-uri
            pattern: Pattern to match (default: all files)
            max_results: Maximum results to return

        Returns:
            List of FileMetadata objects
        """
        return self._storage_client.list_files_with_metadata(cloud_path, pattern, max_results)

    # Advanced Query Operations (delegate to query client)
    def scan_bucket_index(
        self,
        bucket_name: str,
        prefix: str,
        max_results: int = 50000,
        file_filter: Callable[[str], bool] | None = None,
    ) -> BucketIndex:
        """
        Build an in-memory index of all files in a bucket prefix.

        This is faster than repeated API calls when doing complex filtering
        on the same bucket. The index can then be queried locally.

        Args:
            bucket_name: GCS bucket name
            prefix: Prefix to scan (e.g., "raw_tick_data/by_date/")
            max_results: Maximum files to index (default: 50k)
            file_filter: Optional function to filter files during scan

        Returns:
            BucketIndex with all matching files and metadata
        """
        return self._query_client.scan_bucket_index(bucket_name, prefix, max_results, file_filter)

    def parallel_scan_buckets(
        self,
        bucket_paths: list[str],
        max_workers: int = 10,
        max_results_per_bucket: int = 10000,
    ) -> dict[str, BucketIndex]:
        """
        Scan multiple bucket paths in parallel.

        Args:
            bucket_paths: List of "bucket/prefix" strings
            max_workers: Maximum parallel workers
            max_results_per_bucket: Max results per bucket

        Returns:
            Dict mapping bucket_path -> BucketIndex
        """
        return self._query_client.parallel_scan_buckets(
            bucket_paths, max_workers, max_results_per_bucket
        )

    def check_dates_exist(
        self,
        bucket_name: str,
        prefix: str,
        dates: list[str],
        file_pattern: str = "*.parquet",
    ) -> dict[str, bool]:
        """
        Check if specific dates exist in a bucket using a full bucket scan.

        This is slower than check_dates_exist_fast() but works with any
        bucket structure and provides complete results.

        Args:
            bucket_name: GCS bucket name
            prefix: Bucket prefix to scan
            dates: List of date strings (YYYY-MM-DD) to check
            file_pattern: File pattern to match (default: *.parquet)

        Returns:
            Dict mapping date -> exists (bool)
        """
        return self._query_client.check_dates_exist(bucket_name, prefix, dates, file_pattern)

    def get_date_stats(
        self,
        bucket_name: str,
        prefix: str,
        dates: list[str],
        file_pattern: str = "*.parquet",
    ) -> dict[str, dict[str, int]]:
        """
        Get file count and size statistics for specific dates.

        Args:
            bucket_name: GCS bucket name
            prefix: Bucket prefix to scan
            dates: List of date strings to check
            file_pattern: File pattern to match

        Returns:
            Dict mapping date -> {"file_count": int, "total_size": int}
        """
        return self._query_client.get_date_stats(bucket_name, prefix, dates, file_pattern)

    def check_dates_exist_fast(
        self,
        bucket_name: str,
        prefix_template: str,
        dates: list[str],
        file_pattern: str = "*.parquet",
        max_workers: int = 20,
    ) -> dict[str, dict[str, bool | int]]:
        """
        SUPER FAST: Check if specific dates exist by querying each date prefix directly.

        Instead of scanning ALL files in a bucket prefix (slow for large buckets),
        this queries each specific date prefix directly in parallel.

        For a bucket with 70k files but only checking 8 dates, this is:
        - Old method: 1 API call returning 70k files → 2 minutes
        - New method: 8 parallel API calls → 2-5 seconds

        NOTE: This recursively scans into subfolders (e.g., data_type=trades/spot/)
        to find actual parquet files, not just immediate children.

        Args:
            bucket_name: GCS bucket name
            prefix_template: Template like "raw_tick_data/by_date/day={date}/"
            dates: List of date strings (YYYY-MM-DD) to check
            file_pattern: File pattern to match (default: *.parquet)
            max_workers: Max parallel threads (default: 20)

        Returns:
            Dict mapping date -> {"exists": bool, "file_count": int}
        """
        return self._query_client.check_dates_exist_fast(
            bucket_name, prefix_template, dates, file_pattern, max_workers
        )

    def check_venue_in_dates_fast(
        self,
        bucket_name: str,
        prefix_template: str,
        venue: str,
        dates: list[str],
        max_workers: int = 20,
    ) -> dict[str, dict[str, object]]:
        """
        Check if a specific venue has data for given dates.

        Optimized for speed: queries each date prefix directly in parallel
        instead of scanning the entire bucket.

        Args:
            bucket_name: GCS bucket name
            prefix_template: Template like "raw_tick_data/by_date/day={date}/"
            venue: Venue to search for (case-insensitive)
            dates: List of date strings (YYYY-MM-DD)
            max_workers: Max parallel threads

        Returns:
            Dict mapping date -> {"exists": bool, "file_count": int}
        """
        return self._query_client.check_venue_in_dates_fast(
            bucket_name, prefix_template, venue, dates, max_workers
        )

    def check_venue_data_types_detailed(
        self,
        bucket_name: str,
        prefix_template: str,
        venue: str,
        dates: list[str],
        max_workers: int = 15,
    ) -> dict[str, dict[str, dict[str, object]]]:
        """
        Check what data types a venue has for given dates.

        For each date, returns detailed breakdown by data type
        (e.g., trades, orderbooks, funding).

        Args:
            bucket_name: GCS bucket name
            prefix_template: Template like "raw_tick_data/by_date/day={date}/"
            venue: Venue to analyze
            dates: List of date strings
            max_workers: Max parallel threads

        Returns:
            Dict: {date: {data_type: {"file_count": int, "total_size": int}}}
        """
        return self._query_client.check_venue_data_types_detailed(
            bucket_name, prefix_template, venue, dates, max_workers
        )

    def check_venue_dates_fast(
        self,
        bucket_name: str,
        prefix_template: str,
        venues: list[str],
        dates: list[str],
        max_workers: int = 25,
    ) -> dict[str, dict[str, dict[str, object]]]:
        """
        SUPER FAST: Check if specific venues have data for specific dates.

        Optimized for speed by querying venuexdate combinations directly
        in parallel instead of scanning entire bucket.

        Args:
            bucket_name: GCS bucket name
            prefix_template: Template like "raw_tick_data/by_date/day={date}/"
            venues: List of venue names to check
            dates: List of date strings (YYYY-MM-DD)
            max_workers: Max parallel threads

        Returns:
            Dict: {venue: {date: {"exists": bool, "file_count": int}}}
        """
        return self._query_client.check_venue_dates_fast(
            bucket_name, prefix_template, venues, dates, max_workers
        )

    # Utility methods (exposed from storage client)
    def _parse_cloud_path(self, cloud_path: str) -> tuple[str, str, str]:
        """
        Parse a cloud path into provider, bucket, and prefix/blob.

        Supports:
        - gs://bucket/prefix (Google Cloud Storage)
        - s3://bucket/prefix (AWS S3)
        - azure://container/prefix (Azure Blob Storage)

        Args:
            cloud_path: Cloud storage path

        Returns:
            Tuple of (provider, bucket_name, prefix_or_blob)
        """
        return self._storage_client.parse_cloud_path(cloud_path)

    def _matches_pattern(self, filename: str, pattern: str) -> bool:
        """
        Check if a filename matches a glob pattern.

        Supports:
        - * - matches any characters except /
        - ** - matches any characters including /
        - ? - matches a single character
        """
        return self._storage_client.matches_pattern(filename, pattern)


class MockCloudClient(CloudClient):
    """
    Mock cloud client for testing.

    Returns predefined file lists instead of making real cloud calls.
    """

    def __init__(self, mock_files: dict[str, list[str]] | None = None):
        """
        Initialize mock client with predefined files.

        Args:
            mock_files: Dict mapping cloud paths to lists of files
        """
        super().__init__()
        self._mock_mode = True
        self._mock_files: dict[str, list[str]] = mock_files or {}

    def add_mock_files(self, cloud_path: str, files: list[str]) -> None:
        """Add mock files for a cloud path."""
        provider, bucket, prefix = self._parse_cloud_path(cloud_path)
        key = f"{provider}://{bucket}/{prefix}"
        self._mock_files[key] = files

    def list_files(
        self,
        cloud_path: str,
        pattern: str = "*",
        max_results: int = 1000,
    ) -> list[str]:
        """Return mock files for the given path."""
        provider, bucket, prefix = self._parse_cloud_path(cloud_path)
        key = f"{provider}://{bucket}/{prefix}"

        mock_files: list[str] = []
        for mock_path, files in self._mock_files.items():
            if key.startswith(mock_path) or mock_path.startswith(key):
                mock_files.extend(files)

        result: list[str] = []
        for f in mock_files:
            if self._matches_pattern(f, pattern):
                if f.startswith(("gs://", "s3://", "azure://")):  # noqa: gs-uri — cloud_client.py IS the cloud storage boundary; path prefix checks are required
                    result.append(f)
                else:
                    result.append(f"{provider}://{bucket}/{prefix}/{f}".rstrip("/"))

        return result[:max_results]
