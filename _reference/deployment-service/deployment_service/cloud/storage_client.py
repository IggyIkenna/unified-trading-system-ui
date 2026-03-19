"""
Storage Client - Basic cloud storage operations.

Handles fundamental storage operations like file listing, existence checks,
and metadata retrieval across different cloud providers.

Extracted from deployment-service.
"""

import fnmatch
import logging
from dataclasses import dataclass
from datetime import datetime
from typing import cast

from unified_cloud_interface import StorageClient as _UTLStorageClient
from unified_trading_library import get_storage_client as _get_storage_client

from ..deployment_config import DeploymentConfig

logger = logging.getLogger(__name__)

# Initialize configuration for project ID
_config = DeploymentConfig()


@dataclass
class FileMetadata:
    """Metadata for a cloud storage file."""

    path: str
    size_bytes: int
    created_time: datetime | None = None
    updated_time: datetime | None = None

    def to_dict(self) -> dict[str, object]:
        return {
            "path": self.path,
            "size_bytes": self.size_bytes,
            "created_time": (self.created_time.isoformat() if self.created_time else None),
            "updated_time": (self.updated_time.isoformat() if self.updated_time else None),
        }


@dataclass
class BucketStats:
    """Statistics for a bucket/prefix scan."""

    file_count: int
    total_size_bytes: int
    oldest_file_time: datetime | None = None
    newest_file_time: datetime | None = None
    oldest_update_time: datetime | None = None
    newest_update_time: datetime | None = None

    def to_dict(self) -> dict[str, object]:
        return {
            "file_count": self.file_count,
            "total_size_bytes": self.total_size_bytes,
            "oldest_file_time": (
                self.oldest_file_time.isoformat() if self.oldest_file_time else None
            ),
            "newest_file_time": (
                self.newest_file_time.isoformat() if self.newest_file_time else None
            ),
            "oldest_update_time": (
                self.oldest_update_time.isoformat() if self.oldest_update_time else None
            ),
            "newest_update_time": (
                self.newest_update_time.isoformat() if self.newest_update_time else None
            ),
        }


class StorageClient:
    """Basic cloud storage client for fundamental operations."""

    def __init__(self, project_id: str | None = None, provider: str = "gcs"):
        self.project_id: str | None = project_id or cast(str | None, _config.gcp_project_id)
        self.provider = provider
        self._client: _UTLStorageClient | None = None
        self._mock_mode: bool = _config.is_mock_mode()

    @property
    def mock_mode(self) -> bool:
        """Whether the client is running in mock mode."""
        return self._mock_mode

    @property
    def client(self) -> _UTLStorageClient | None:
        """Lazy-load the cloud client."""
        if self._client is None and not self._mock_mode:
            try:
                self._client = _get_storage_client(project_id=self.project_id)
            except (OSError, ValueError, RuntimeError):
                self._mock_mode = True
        return self._client

    def list_files(self, cloud_path: str, pattern: str = "*", max_results: int = 1000) -> list[str]:
        """List files in a cloud storage path matching a pattern."""
        provider, bucket_name, prefix = self._parse_cloud_path(cloud_path)
        if self._mock_mode or self.client is None:
            return []
        try:
            if provider == "gs":
                return self._list_gcs_files(bucket_name, prefix, pattern, max_results)
            return []
        except (OSError, PermissionError):
            return []

    def _list_gcs_files(
        self, bucket_name: str, prefix: str, pattern: str = "*", max_results: int = 1000
    ) -> list[str]:
        """List files in a GCS bucket."""
        try:
            client = self.client
            if client is None:
                return []
            bucket = client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=prefix, max_results=max_results)
            return [
                f"gs://{bucket_name}/{blob.name}"  # noqa: gs-uri — storage_client.py IS the cloud storage boundary
                for blob in blobs
                if self._matches_pattern(blob.name, pattern)
            ]
        except (OSError, PermissionError):
            return []

    def file_exists(self, cloud_path: str) -> bool:
        """Check if a file exists in cloud storage."""
        provider, bucket_name, blob_name = self._parse_cloud_path(cloud_path)
        client = self.client
        if self._mock_mode or client is None:
            return False
        try:
            if provider == "gs":
                bucket = client.bucket(bucket_name)
                blob = bucket.blob(blob_name)
                return blob.exists()
            return False
        except (OSError, PermissionError):
            return False

    def check_prefix_exists(self, bucket_name: str, prefix: str) -> bool:
        """Check if any files exist with the given prefix."""
        client = self.client
        if self._mock_mode or client is None:
            return False
        try:
            if self.provider == "gcs":
                bucket = client.bucket(bucket_name)
                blobs = bucket.list_blobs(prefix=prefix, max_results=1)
                return any(True for _ in blobs)
            return False
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error checking prefix %s in bucket %s: %s", prefix, bucket_name, e)
            return False

    def count_files(
        self, bucket_name: str, prefix: str, pattern: str = "*", max_scan: int = 10000
    ) -> int:
        """Count files in a bucket/prefix matching a pattern."""
        if self._mock_mode or self.client is None:
            return 0
        try:
            if self.provider == "gcs":
                return self._count_gcs_files(bucket_name, prefix, pattern, max_scan)
            return 0
        except (OSError, PermissionError):
            return 0

    def _count_gcs_files(self, bucket_name: str, prefix: str, pattern: str, max_scan: int) -> int:
        """Count GCS files matching pattern."""
        try:
            client = self.client
            if client is None:
                return 0
            bucket = client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=prefix, max_results=max_scan)
            return sum(1 for blob in blobs if self._matches_pattern(blob.name, pattern))
        except (OSError, PermissionError):
            return 0

    def get_bucket_stats(
        self, bucket_name: str, prefix: str = "", pattern: str = "*", max_scan: int = 10000
    ) -> BucketStats:
        """Get statistics for files in a bucket/prefix."""
        if self._mock_mode or self.client is None:
            return BucketStats(file_count=0, total_size_bytes=0)
        try:
            if self.provider == "gcs":
                return self._get_storage_bucket_stats(bucket_name, prefix, pattern, max_scan)
            return BucketStats(file_count=0, total_size_bytes=0)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error getting bucket stats: %s", e)
            return BucketStats(file_count=0, total_size_bytes=0)

    def _get_storage_bucket_stats(
        self, bucket_name: str, prefix: str, pattern: str, max_scan: int
    ) -> BucketStats:
        """Get GCS bucket statistics."""
        try:
            client = self.client
            if client is None:
                return BucketStats(file_count=0, total_size_bytes=0)
            bucket = client.bucket(bucket_name)
            blobs = bucket.list_blobs(prefix=prefix, max_results=max_scan)
            file_count = 0
            total_size = 0
            created_times: list[datetime] = []
            updated_times: list[datetime] = []
            for blob in blobs:
                if self._matches_pattern(blob.name, pattern):
                    file_count += 1
                    total_size += blob.size or 0
                    blob_created = cast(datetime | None, getattr(blob, "time_created", None))
                    if blob_created:
                        created_times.append(blob_created)
                    blob_updated = cast(datetime | None, getattr(blob, "updated", None))
                    if blob_updated:
                        updated_times.append(blob_updated)
            return BucketStats(
                file_count=file_count,
                total_size_bytes=total_size,
                oldest_file_time=min(created_times) if created_times else None,
                newest_file_time=max(created_times) if created_times else None,
                oldest_update_time=min(updated_times) if updated_times else None,
                newest_update_time=max(updated_times) if updated_times else None,
            )
        except (OSError, ValueError, RuntimeError):
            return BucketStats(file_count=0, total_size_bytes=0)

    def list_files_with_metadata(
        self, cloud_path: str, pattern: str = "*", max_results: int = 1000
    ) -> list[FileMetadata]:
        """List files with metadata in a cloud storage path."""
        provider, bucket_name, prefix = self._parse_cloud_path(cloud_path)
        client = self.client
        if self._mock_mode or client is None:
            return []
        try:
            if provider == "gs":
                bucket = client.bucket(bucket_name)
                blobs = bucket.list_blobs(prefix=prefix, max_results=max_results)
                result: list[FileMetadata] = []
                for blob in blobs:
                    if self._matches_pattern(blob.name, pattern):
                        blob_created = cast(datetime | None, getattr(blob, "time_created", None))
                        blob_updated = cast(datetime | None, getattr(blob, "updated", None))
                        result.append(
                            FileMetadata(
                                path=f"gs://{bucket_name}/{blob.name}",  # noqa: gs-uri — storage_client.py IS the cloud storage boundary
                                size_bytes=blob.size or 0,
                                created_time=blob_created,
                                updated_time=blob_updated,
                            )
                        )
                return result
            return []
        except (OSError, PermissionError):
            return []

    def parse_cloud_path(self, cloud_path: str) -> tuple[str, str, str]:
        """Parse a cloud path into provider, bucket, and prefix/blob."""
        return self._parse_cloud_path(cloud_path)

    def matches_pattern(self, filename: str, pattern: str) -> bool:
        """Check if a filename matches a glob pattern."""
        return self._matches_pattern(filename, pattern)

    def _parse_cloud_path(self, cloud_path: str) -> tuple[str, str, str]:
        """Parse a cloud path into provider, bucket, and prefix/blob."""
        if cloud_path.startswith("gs://"):  # noqa: gs-uri — storage_client.py IS the cloud storage boundary
            provider = "gs"
            path = cloud_path[5:]
        elif cloud_path.startswith("s3://"):  # noqa: gs-uri — storage_client.py IS the cloud storage boundary
            provider = "s3"
            path = cloud_path[5:]
        else:
            raise ValueError(
                f"Invalid cloud path: {cloud_path}. Must start with 'gs://' or 's3://'"
            )
        parts = path.split("/", 1)
        bucket_name = parts[0]
        prefix = parts[1] if len(parts) > 1 else ""
        return provider, bucket_name, prefix

    def _matches_pattern(self, filename: str, pattern: str) -> bool:
        """Check if a filename matches a glob pattern."""
        if "**" in pattern:
            if pattern == "**/*.json":
                return filename.endswith(".json")
            adjusted_pattern = pattern.replace("**/", "*")
            return fnmatch.fnmatch(filename, adjusted_pattern)
        return fnmatch.fnmatch(filename, pattern)
