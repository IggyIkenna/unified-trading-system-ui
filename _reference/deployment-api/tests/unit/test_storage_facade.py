"""
Unit tests for storage_facade module.

Tests cover ObjectInfo, _fuse_path, get_gcs_fuse_status, and storage
operations via mocked GCS client. Also covers FUSE paths, read/write
operations, delete, list_prefixes, and list_blobs_compat.
"""

from datetime import UTC, datetime
from pathlib import Path
from unittest.mock import MagicMock, patch

from deployment_api.utils.storage_facade import (
    GCS_FUSE_MOUNT_BASE,
    ObjectInfo,
    _fuse_path,
    _is_bucket_mounted,
    _use_gcs_fuse,
    delete_object,
    get_gcs_fuse_status,
    get_storage_client_and_bucket,
    list_blobs_compat,
    list_objects,
    list_prefixes,
    object_exists,
    read_object_bytes,
    read_object_text,
    write_object_bytes,
    write_object_text,
)


class TestObjectInfo:
    """Tests for ObjectInfo dataclass."""

    def test_basic_creation(self):
        obj = ObjectInfo(name="test/path/file.parquet")
        assert obj.name == "test/path/file.parquet"
        assert obj.updated is None
        assert obj.size is None

    def test_time_created_defaults_to_updated(self):
        now = datetime.now(UTC)
        obj = ObjectInfo(name="test.parquet", updated=now)
        assert obj.time_created == now

    def test_time_created_explicit(self):
        created = datetime(2024, 1, 1, tzinfo=UTC)
        updated = datetime(2024, 2, 1, tzinfo=UTC)
        obj = ObjectInfo(name="test.parquet", updated=updated, time_created=created)
        assert obj.time_created == created

    def test_size_stored(self):
        obj = ObjectInfo(name="file.parquet", size=12345)
        assert obj.size == 12345


class TestFusePath:
    """Tests for _fuse_path helper."""

    def test_bucket_only(self):
        path = _fuse_path("my-bucket")
        assert path == Path(GCS_FUSE_MOUNT_BASE) / "my-bucket"

    def test_bucket_with_object(self):
        path = _fuse_path("my-bucket", "some/path/file.txt")
        assert str(path).endswith("my-bucket/some/path/file.txt")

    def test_leading_slash_in_object_stripped(self):
        path = _fuse_path("my-bucket", "/some/path/file.txt")
        assert str(path).endswith("my-bucket/some/path/file.txt")
        # Shouldn't have double slash
        assert "//" not in str(path)


class TestUseGcsFuse:
    """Tests for _use_gcs_fuse."""

    @patch("deployment_api.utils.storage_facade.DEPLOYMENT_ENV", "production")
    def test_production_env_returns_true(self):
        assert _use_gcs_fuse() is True

    @patch("deployment_api.utils.storage_facade.DEPLOYMENT_ENV", "development")
    def test_development_env_returns_false(self):
        assert _use_gcs_fuse() is False

    @patch("deployment_api.utils.storage_facade.DEPLOYMENT_ENV", "staging")
    def test_staging_env_returns_false(self):
        assert _use_gcs_fuse() is False


class TestIsBucketMounted:
    """Tests for _is_bucket_mounted."""

    @patch("deployment_api.utils.storage_facade._fuse_path")
    def test_returns_true_when_dir_exists(self, mock_path_fn):
        mock_path = MagicMock()
        mock_path.exists.return_value = True
        mock_path.is_dir.return_value = True
        mock_path_fn.return_value = mock_path
        assert _is_bucket_mounted("my-bucket") is True

    @patch("deployment_api.utils.storage_facade._fuse_path")
    def test_returns_false_when_not_exists(self, mock_path_fn):
        mock_path = MagicMock()
        mock_path.exists.return_value = False
        mock_path_fn.return_value = mock_path
        assert _is_bucket_mounted("my-bucket") is False

    @patch("deployment_api.utils.storage_facade._fuse_path")
    def test_returns_false_when_not_dir(self, mock_path_fn):
        mock_path = MagicMock()
        mock_path.exists.return_value = True
        mock_path.is_dir.return_value = False
        mock_path_fn.return_value = mock_path
        assert _is_bucket_mounted("my-bucket") is False


class TestGetGcsFuseStatus:
    """Tests for get_gcs_fuse_status."""

    @patch("deployment_api.utils.storage_facade.DEPLOYMENT_ENV", "development")
    def test_development_returns_inactive(self):
        status = get_gcs_fuse_status()
        assert status["active"] is False
        assert status["env"] == "development"

    @patch("deployment_api.utils.storage_facade.DEPLOYMENT_ENV", "production")
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=False)
    @patch("deployment_api.utils.storage_facade.STATE_BUCKET", "my-state-bucket")
    def test_production_without_mount_inactive(self, mock_mounted):
        status = get_gcs_fuse_status()
        assert status["active"] is False
        assert "production but mount missing" in status["reason"]

    @patch("deployment_api.utils.storage_facade.DEPLOYMENT_ENV", "production")
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    @patch("deployment_api.utils.storage_facade.STATE_BUCKET", "my-state-bucket")
    def test_production_with_mount_active(self, mock_mounted):
        status = get_gcs_fuse_status()
        assert status["active"] is True
        assert "production + mount exists" in status["reason"]


class TestListObjectsViaApi:
    """Tests for list_objects using GCS API (non-FUSE path)."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_returns_object_info_list(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_blob = MagicMock()
        mock_blob.name = "prefix/file.parquet"
        mock_blob.size = 1024
        mock_client.list_blobs.return_value = [mock_blob]
        mock_client_fn.return_value = mock_client

        results = list_objects("test-bucket", "prefix/")
        assert len(results) == 1
        assert results[0].name == "prefix/file.parquet"
        assert results[0].size == 1024

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_empty_bucket_returns_empty_list(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_client.list_blobs.return_value = []
        mock_client_fn.return_value = mock_client

        results = list_objects("test-bucket", "nonexistent/")
        assert results == []


class TestObjectExistsViaApi:
    """Tests for object_exists using GCS API."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_exists_when_blob_exists(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_client.blob_exists.return_value = True
        mock_client_fn.return_value = mock_client

        assert object_exists("test-bucket", "path/file.parquet") is True

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_does_not_exist(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_client.blob_exists.return_value = False
        mock_client_fn.return_value = mock_client

        assert object_exists("test-bucket", "path/missing.parquet") is False


class TestListObjectsFuse:
    """Tests for list_objects using FUSE filesystem."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_path_not_exists_returns_empty(self, mock_mounted, mock_fuse):
        with patch("deployment_api.utils.storage_facade._fuse_path") as mock_fp:
            mock_path = MagicMock()
            mock_path.exists.return_value = False
            mock_fp.return_value = mock_path
            result = list_objects("test-bucket", "nonexistent/")
        assert result == []

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_single_file_returns_object_info(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        bucket_dir.mkdir()
        test_file = bucket_dir / "prefix" / "file.json"
        test_file.parent.mkdir(parents=True)
        test_file.write_text("content")

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = list_objects("test-bucket", "prefix/file.json")

        assert len(result) == 1
        assert "file.json" in result[0].name

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_directory_lists_all_files(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        prefix_dir = bucket_dir / "prefix"
        prefix_dir.mkdir(parents=True)
        (prefix_dir / "file1.json").write_text("a")
        (prefix_dir / "file2.json").write_text("b")

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = list_objects("test-bucket", "prefix")

        assert len(result) == 2

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_max_results_limits_output(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        prefix_dir = bucket_dir / "prefix"
        prefix_dir.mkdir(parents=True)
        for i in range(10):
            (prefix_dir / f"file{i}.json").write_text("x")

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = list_objects("test-bucket", "prefix", max_results=3)

        assert len(result) <= 3

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_fuse_error_falls_back_to_api(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_blob = MagicMock()
        mock_blob.name = "prefix/file.json"
        mock_blob.size = 100
        mock_client.list_blobs.return_value = [mock_blob]
        mock_client_fn.return_value = mock_client

        with patch(
            "deployment_api.utils.storage_facade._fuse_path", side_effect=OSError("fuse broke")
        ):
            result = list_objects("test-bucket", "prefix/")

        assert len(result) == 1


class TestObjectExistsFuse:
    """Tests for object_exists using FUSE filesystem."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_file_exists(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        bucket_dir.mkdir()
        test_file = bucket_dir / "obj.json"
        test_file.write_text("data")

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = object_exists("test-bucket", "obj.json")

        assert result is True

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_file_not_exists(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        bucket_dir.mkdir()

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = object_exists("test-bucket", "missing.json")

        assert result is False

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_fuse_error_falls_back_to_api(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_client.blob_exists.return_value = True
        mock_client_fn.return_value = mock_client

        with patch(
            "deployment_api.utils.storage_facade._fuse_path", side_effect=OSError("fuse broke")
        ):
            result = object_exists("test-bucket", "obj.json")

        assert result is True


class TestListPrefixes:
    """Tests for list_prefixes function."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_api_path_returns_prefixes(self, mock_client_fn, mock_fuse):
        mock_client = MagicMock()
        # Return blobs with names that have child prefixes
        mock_blob1 = MagicMock()
        mock_blob1.name = "prefix/folder1/file.json"
        mock_blob2 = MagicMock()
        mock_blob2.name = "prefix/folder2/file.json"
        mock_client.list_blobs.return_value = [mock_blob1, mock_blob2]
        mock_client_fn.return_value = mock_client

        result = list_prefixes("test-bucket", "prefix/")
        assert "prefix/folder1/" in result

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_path_returns_subdirectories(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        prefix_dir = bucket_dir / "prefix"
        prefix_dir.mkdir(parents=True)
        (prefix_dir / "folder1").mkdir()
        (prefix_dir / "folder2").mkdir()
        (prefix_dir / "file.json").write_text("x")

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = list_prefixes("test-bucket", "prefix")

        assert len(result) == 2
        assert all("folder" in r for r in result)

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_fuse_error_falls_back_to_api(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_blob = MagicMock()
        mock_blob.name = "prefix/child/file.txt"
        mock_client.list_blobs.return_value = [mock_blob]
        mock_client_fn.return_value = mock_client

        with patch(
            "deployment_api.utils.storage_facade._fuse_path", side_effect=OSError("fuse error")
        ):
            result = list_prefixes("test-bucket", "prefix/")

        assert "prefix/child/" in result

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_nonexistent_path_returns_empty(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        bucket_dir.mkdir()

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = list_prefixes("test-bucket", "nonexistent/prefix")

        assert result == []


class TestReadObjectBytes:
    """Tests for read_object_bytes function."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_api_path_reads_bytes(self, mock_client_fn, mock_fuse):
        mock_client = MagicMock()
        mock_client.download_bytes.return_value = b"hello world"
        mock_client_fn.return_value = mock_client

        result = read_object_bytes("test-bucket", "path/file.json")
        assert result == b"hello world"
        mock_client.download_bytes.assert_called_once_with("test-bucket", "path/file.json")

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_reads_file(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        bucket_dir.mkdir()
        test_file = bucket_dir / "file.json"
        test_file.write_bytes(b"fuse content")

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            result = read_object_bytes("test-bucket", "file.json")

        assert result == b"fuse content"

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_fuse_read_error_falls_back_to_api(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_client.download_bytes.return_value = b"api content"
        mock_client_fn.return_value = mock_client

        with patch(
            "deployment_api.utils.storage_facade._fuse_path", side_effect=OSError("fuse error")
        ):
            result = read_object_bytes("test-bucket", "file.json")

        assert result == b"api content"


class TestReadObjectText:
    """Tests for read_object_text function."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_decodes_utf8(self, mock_client_fn, mock_fuse):
        mock_client = MagicMock()
        mock_client.download_bytes.return_value = b"hello text"
        mock_client_fn.return_value = mock_client

        result = read_object_text("test-bucket", "file.txt")
        assert result == "hello text"


class TestWriteObjectBytes:
    """Tests for write_object_bytes function."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_api_path_uploads(self, mock_client_fn, mock_fuse):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        write_object_bytes("test-bucket", "path/file.json", b"data")
        mock_client.upload_bytes.assert_called_once_with("test-bucket", "path/file.json", b"data")

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    def test_fuse_writes_file(self, mock_mounted, mock_fuse, tmp_path):
        bucket_dir = tmp_path / "test-bucket"
        bucket_dir.mkdir()

        with patch("deployment_api.utils.storage_facade.GCS_FUSE_MOUNT_BASE", str(tmp_path)):
            write_object_bytes("test-bucket", "subdir/file.json", b"fuse data")

        written = (bucket_dir / "subdir" / "file.json").read_bytes()
        assert written == b"fuse data"

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=True)
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted", return_value=True)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_fuse_write_error_falls_back_to_api(self, mock_client_fn, mock_mounted, mock_fuse):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        with patch(
            "deployment_api.utils.storage_facade._fuse_path", side_effect=OSError("fuse error")
        ):
            write_object_bytes("test-bucket", "file.json", b"data")

        mock_client.upload_bytes.assert_called_once_with("test-bucket", "file.json", b"data")


class TestWriteObjectText:
    """Tests for write_object_text function."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_encodes_and_writes(self, mock_client_fn, mock_fuse):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        write_object_text("test-bucket", "file.txt", "hello text")
        mock_client.upload_bytes.assert_called_once_with("test-bucket", "file.txt", b"hello text")


class TestDeleteObject:
    """Tests for delete_object function."""

    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_deletes_existing_blob(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client.blob_exists.return_value = True
        mock_client_fn.return_value = mock_client

        delete_object("test-bucket", "file.json")
        mock_client.delete_blob.assert_called_once_with("test-bucket", "file.json")

    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_skips_delete_when_not_exists(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client.blob_exists.return_value = False
        mock_client_fn.return_value = mock_client

        delete_object("test-bucket", "missing.json")
        mock_client.delete_blob.assert_not_called()


class TestListBlobsCompat:
    """Tests for list_blobs_compat function."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse", return_value=False)
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_yields_object_info(self, mock_client_fn, mock_fuse):
        mock_client = MagicMock()
        mock_blob = MagicMock()
        mock_blob.name = "prefix/file.json"
        mock_blob.size = 100
        mock_client.list_blobs.return_value = [mock_blob]
        mock_client_fn.return_value = mock_client

        results = list(list_blobs_compat("test-bucket", "prefix/"))
        assert len(results) == 1
        assert isinstance(results[0], ObjectInfo)


class TestGetStorageClientAndBucket:
    """Tests for get_storage_client_and_bucket function."""

    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_returns_client_and_bucket_name(self, mock_client_fn):
        mock_client = MagicMock()
        mock_client_fn.return_value = mock_client

        client, bucket = get_storage_client_and_bucket("test-bucket")
        assert client is mock_client
        # UCI returns bucket name as string, not a bucket object
        assert bucket == "test-bucket"
