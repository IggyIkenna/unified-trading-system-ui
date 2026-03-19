"""
Unit tests for deployment_service/cloud/query_client.py.

Covers:
- BucketIndex.filter_by_date
- BucketIndex.filter_by_pattern
- BucketIndex.get_stats: empty, populated with sizes / dates
- QueryClient.scan_bucket_index: mock_mode / no client returns empty, success path,
  file_filter applied, dates extracted from day= paths, error returns empty
- QueryClient.check_dates_exist: delegates to scan_bucket_index, wildcard / parquet filter
- QueryClient.get_date_stats: file count and total size per date
- QueryClient.check_dates_exist_fast: mock_mode returns defaults, success path,
  per-date error returns {exists: False}
- QueryClient.check_venue_in_dates_fast: mock_mode, venue filter applied
- QueryClient.check_venue_data_types_detailed: mock_mode, data_type extraction from path
- QueryClient.check_venue_dates_fast: mock_mode, multi-venue × multi-date
- QueryClient.parallel_scan_buckets: empty list, success, error path per bucket
"""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import MagicMock

from deployment_service.cloud.query_client import BucketIndex, QueryClient
from deployment_service.cloud.storage_client import StorageClient

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_storage(mock_mode: bool = False) -> MagicMock:
    storage = MagicMock(spec=StorageClient)
    storage.mock_mode = mock_mode
    storage.client = None if mock_mode else MagicMock()
    return storage


def _make_blob(name: str, size: int = 100) -> MagicMock:
    blob = MagicMock()
    blob.name = name
    blob.size = size
    blob.updated = datetime(2024, 1, 10, tzinfo=UTC)
    blob.time_created = datetime(2024, 1, 1, tzinfo=UTC)
    return blob


def _make_bucket(blobs: list) -> MagicMock:
    bucket = MagicMock()
    bucket.list_blobs.return_value = blobs
    return bucket


# ---------------------------------------------------------------------------
# BucketIndex
# ---------------------------------------------------------------------------


class TestBucketIndex:
    def test_filter_by_date_matches(self) -> None:
        idx = BucketIndex(
            bucket_name="my-bucket",
            prefix="data/",
            blobs=[
                {"name": "data/day=2024-01-05/file.parquet", "size": 100},
                {"name": "data/day=2024-01-06/file.parquet", "size": 200},
            ],
        )
        result = idx.filter_by_date("2024-01-05")
        assert len(result) == 1
        assert "day=2024-01-05" in result[0]["name"]

    def test_filter_by_date_no_match(self) -> None:
        idx = BucketIndex(
            bucket_name="my-bucket",
            prefix="",
            blobs=[{"name": "data/day=2024-02-01/file.parquet", "size": 50}],
        )
        result = idx.filter_by_date("2024-01-01")
        assert result == []

    def test_filter_by_pattern_wildcard(self) -> None:
        idx = BucketIndex(
            bucket_name="b",
            prefix="",
            blobs=[
                {"name": "a.parquet", "size": 1},
                {"name": "b.csv", "size": 2},
            ],
        )
        result = idx.filter_by_pattern("*")
        assert len(result) == 2

    def test_filter_by_pattern_specific(self) -> None:
        idx = BucketIndex(
            bucket_name="b",
            prefix="",
            blobs=[
                {"name": "data/a.parquet", "size": 1},
                {"name": "data/b.csv", "size": 2},
            ],
        )
        result = idx.filter_by_pattern("*.parquet")
        assert len(result) == 1

    def test_get_stats_empty(self) -> None:
        idx = BucketIndex(bucket_name="b", prefix="")
        stats = idx.get_stats()
        assert stats.file_count == 0
        assert stats.total_size_bytes == 0

    def test_get_stats_populated(self) -> None:
        now = datetime(2024, 1, 15, tzinfo=UTC)
        early = datetime(2024, 1, 1, tzinfo=UTC)
        idx = BucketIndex(
            bucket_name="b",
            prefix="",
            blobs=[
                {"name": "a.parquet", "size": 100, "created": early, "updated": now},
                {"name": "b.parquet", "size": 200, "created": now, "updated": now},
            ],
        )
        stats = idx.get_stats()
        assert stats.file_count == 2
        assert stats.total_size_bytes == 300
        assert stats.oldest_file_time == early
        assert stats.newest_file_time == now


# ---------------------------------------------------------------------------
# QueryClient.scan_bucket_index
# ---------------------------------------------------------------------------


class TestScanBucketIndex:
    def test_mock_mode_returns_empty_index(self) -> None:
        storage = _make_storage(mock_mode=True)
        qc = QueryClient(storage)
        idx = qc.scan_bucket_index("bucket", "prefix/")
        assert idx.bucket_name == "bucket"
        assert idx.blobs == []

    def test_no_client_returns_empty_index(self) -> None:
        storage = _make_storage(mock_mode=False)
        storage.client = None
        qc = QueryClient(storage)
        idx = qc.scan_bucket_index("bucket", "prefix/")
        assert idx.blobs == []

    def test_success_builds_index(self) -> None:
        storage = _make_storage()
        blobs = [
            _make_blob("prefix/day=2024-01-01/file.parquet"),
            _make_blob("prefix/day=2024-01-02/file.parquet"),
        ]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        idx = qc.scan_bucket_index("bucket", "prefix/")

        assert len(idx.blobs) == 2
        assert "2024-01-01" in idx.dates_found
        assert "2024-01-02" in idx.dates_found

    def test_file_filter_applied(self) -> None:
        storage = _make_storage()
        blobs = [
            _make_blob("prefix/data.parquet"),
            _make_blob("prefix/data.csv"),
        ]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        idx = qc.scan_bucket_index(
            "bucket",
            "prefix/",
            file_filter=lambda name: name.endswith(".parquet"),
        )

        assert len(idx.blobs) == 1
        assert idx.blobs[0]["name"] == "prefix/data.parquet"

    def test_error_returns_empty_index(self) -> None:
        storage = _make_storage()
        storage.client.bucket.side_effect = RuntimeError("GCS error")
        qc = QueryClient(storage)

        idx = qc.scan_bucket_index("bucket", "prefix/")
        assert idx.blobs == []

    def test_scan_time_ms_set(self) -> None:
        storage = _make_storage()
        storage.client.bucket.return_value = _make_bucket([_make_blob("f.parquet")])
        qc = QueryClient(storage)

        idx = qc.scan_bucket_index("bucket", "")
        assert idx.scan_time_ms >= 0


# ---------------------------------------------------------------------------
# QueryClient.check_dates_exist
# ---------------------------------------------------------------------------


class TestCheckDatesExist:
    def test_existing_date_returns_true(self) -> None:
        storage = _make_storage()
        blobs = [_make_blob("p/day=2024-01-05/file.parquet")]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.check_dates_exist("bucket", "p/", ["2024-01-05"])
        assert result["2024-01-05"] is True

    def test_missing_date_returns_false(self) -> None:
        storage = _make_storage()
        storage.client.bucket.return_value = _make_bucket([])
        qc = QueryClient(storage)

        result = qc.check_dates_exist("bucket", "p/", ["2024-01-01"])
        assert result["2024-01-01"] is False

    def test_wildcard_file_pattern_skips_extension_filter(self) -> None:
        storage = _make_storage()
        blobs = [_make_blob("p/day=2024-01-05/file.csv")]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.check_dates_exist("bucket", "p/", ["2024-01-05"], file_pattern="*")
        assert result["2024-01-05"] is True

    def test_parquet_filter_excludes_csv(self) -> None:
        storage = _make_storage()
        blobs = [_make_blob("p/day=2024-01-05/file.csv")]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        # .csv doesn't match *.parquet
        result = qc.check_dates_exist("bucket", "p/", ["2024-01-05"], file_pattern="*.parquet")
        assert result["2024-01-05"] is False


# ---------------------------------------------------------------------------
# QueryClient.get_date_stats
# ---------------------------------------------------------------------------


class TestGetDateStats:
    def test_returns_file_count_and_size(self) -> None:
        storage = _make_storage()
        blobs = [
            _make_blob("p/day=2024-01-05/a.parquet", size=1000),
            _make_blob("p/day=2024-01-05/b.parquet", size=2000),
        ]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.get_date_stats("bucket", "p/", ["2024-01-05"])
        assert result["2024-01-05"]["file_count"] == 2
        assert result["2024-01-05"]["total_size"] == 3000

    def test_missing_date_returns_zeros(self) -> None:
        storage = _make_storage()
        storage.client.bucket.return_value = _make_bucket([])
        qc = QueryClient(storage)

        result = qc.get_date_stats("bucket", "p/", ["2099-01-01"])
        assert result["2099-01-01"]["file_count"] == 0
        assert result["2099-01-01"]["total_size"] == 0


# ---------------------------------------------------------------------------
# QueryClient.check_dates_exist_fast
# ---------------------------------------------------------------------------


class TestCheckDatesExistFast:
    def test_mock_mode_returns_defaults(self) -> None:
        storage = _make_storage(mock_mode=True)
        qc = QueryClient(storage)

        result = qc.check_dates_exist_fast("bucket", "p/{date}/", ["2024-01-01"])
        assert result["2024-01-01"]["exists"] is False
        assert result["2024-01-01"]["file_count"] == 0

    def test_no_client_returns_defaults(self) -> None:
        storage = _make_storage(mock_mode=False)
        storage.client = None
        qc = QueryClient(storage)

        result = qc.check_dates_exist_fast("bucket", "p/{date}/", ["2024-01-01"])
        assert result["2024-01-01"]["exists"] is False

    def test_success_returns_exists_true(self) -> None:
        storage = _make_storage()
        blobs = [_make_blob("p/2024-01-05/file.parquet")]
        bucket_mock = _make_bucket(blobs)
        storage.client.bucket.return_value = bucket_mock
        qc = QueryClient(storage)

        result = qc.check_dates_exist_fast("bucket", "p/{date}/", ["2024-01-05"])
        assert result["2024-01-05"]["exists"] is True
        assert result["2024-01-05"]["file_count"] == 1

    def test_per_date_error_returns_not_exists(self) -> None:
        storage = _make_storage()
        storage.client.bucket.side_effect = RuntimeError("access denied")
        qc = QueryClient(storage)

        result = qc.check_dates_exist_fast("bucket", "p/{date}/", ["2024-01-05"])
        assert result["2024-01-05"]["exists"] is False


# ---------------------------------------------------------------------------
# QueryClient.check_venue_in_dates_fast
# ---------------------------------------------------------------------------


class TestCheckVenueInDatesFast:
    def test_mock_mode_returns_defaults(self) -> None:
        storage = _make_storage(mock_mode=True)
        qc = QueryClient(storage)

        result = qc.check_venue_in_dates_fast("bucket", "p/{date}/", "BINANCE", ["2024-01-01"])
        assert result["2024-01-01"]["exists"] is False

    def test_venue_filter_applied(self) -> None:
        storage = _make_storage()
        blobs = [
            _make_blob("p/2024-01-05/BINANCE-data.parquet"),
            _make_blob("p/2024-01-05/COINBASE-data.parquet"),
        ]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.check_venue_in_dates_fast("bucket", "p/{date}/", "BINANCE", ["2024-01-05"])
        assert result["2024-01-05"]["exists"] is True
        assert result["2024-01-05"]["file_count"] == 1

    def test_venue_not_found(self) -> None:
        storage = _make_storage()
        blobs = [_make_blob("p/2024-01-05/COINBASE-data.parquet")]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.check_venue_in_dates_fast("bucket", "p/{date}/", "BINANCE", ["2024-01-05"])
        assert result["2024-01-05"]["exists"] is False
        assert result["2024-01-05"]["file_count"] == 0


# ---------------------------------------------------------------------------
# QueryClient.check_venue_data_types_detailed
# ---------------------------------------------------------------------------


class TestCheckVenueDataTypesDetailed:
    def test_mock_mode_returns_empty(self) -> None:
        storage = _make_storage(mock_mode=True)
        qc = QueryClient(storage)

        result = qc.check_venue_data_types_detailed(
            "bucket", "p/{date}/", "BINANCE", ["2024-01-01"]
        )
        assert result == {}

    def test_data_type_extracted_from_path(self) -> None:
        storage = _make_storage()
        blobs = [
            _make_blob("p/2024-01-05/BINANCE/data_type=trades/file.parquet", size=500),
            _make_blob("p/2024-01-05/BINANCE/data_type=book_snapshot_5/file.parquet", size=300),
        ]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.check_venue_data_types_detailed(
            "bucket", "p/{date}/", "BINANCE", ["2024-01-05"]
        )
        assert "2024-01-05" in result
        data_types = result["2024-01-05"]
        assert "trades" in data_types
        assert data_types["trades"]["file_count"] == 1
        assert "book_snapshot_5" in data_types

    def test_unknown_data_type_when_no_pattern(self) -> None:
        storage = _make_storage()
        blobs = [_make_blob("p/2024-01-05/BINANCE/some-file.parquet", size=100)]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.check_venue_data_types_detailed(
            "bucket", "p/{date}/", "BINANCE", ["2024-01-05"]
        )
        data_types = result.get("2024-01-05", {})
        # No data_type= in path → classified as 'unknown'
        assert "unknown" in data_types


# ---------------------------------------------------------------------------
# QueryClient.check_venue_dates_fast
# ---------------------------------------------------------------------------


class TestCheckVenueDatesFast:
    def test_mock_mode_returns_empty(self) -> None:
        storage = _make_storage(mock_mode=True)
        qc = QueryClient(storage)

        result = qc.check_venue_dates_fast(
            "bucket", "p/{date}/", ["BINANCE", "CME"], ["2024-01-01"]
        )
        assert result == {}

    def test_multiple_venues_and_dates(self) -> None:
        storage = _make_storage()
        blobs = [
            _make_blob("p/2024-01-05/BINANCE-trades.parquet"),
            _make_blob("p/2024-01-05/CME-trades.parquet"),
        ]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        result = qc.check_venue_dates_fast(
            "bucket", "p/{date}/", ["BINANCE", "CME"], ["2024-01-05"]
        )
        assert "BINANCE" in result
        assert "CME" in result
        assert result["BINANCE"]["2024-01-05"]["exists"] is True
        assert result["CME"]["2024-01-05"]["exists"] is True


# ---------------------------------------------------------------------------
# QueryClient.parallel_scan_buckets
# ---------------------------------------------------------------------------


class TestParallelScanBuckets:
    def test_empty_list_returns_empty(self) -> None:
        storage = _make_storage()
        qc = QueryClient(storage)

        result = qc.parallel_scan_buckets([])
        assert result == {}

    def test_success_scans_all_paths(self) -> None:
        storage = _make_storage()
        blobs = [_make_blob("prefix/file.parquet")]
        storage.client.bucket.return_value = _make_bucket(blobs)
        qc = QueryClient(storage)

        paths = ["my-bucket/prefix/", "other-bucket/data/"]
        result = qc.parallel_scan_buckets(paths)

        assert len(result) == 2
        for path in paths:
            assert path in result

    def test_error_per_bucket_returns_empty_index(self) -> None:
        storage = _make_storage()
        storage.client.bucket.side_effect = RuntimeError("access denied")
        qc = QueryClient(storage)

        result = qc.parallel_scan_buckets(["bad-bucket/prefix/"])
        assert "bad-bucket/prefix/" in result
        assert result["bad-bucket/prefix/"].blobs == []

    def test_bucket_without_prefix(self) -> None:
        storage = _make_storage()
        storage.client.bucket.return_value = _make_bucket([])
        qc = QueryClient(storage)

        result = qc.parallel_scan_buckets(["my-bucket"])
        assert "my-bucket" in result
