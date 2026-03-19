"""Unit tests for storage_facade usage (with mocks, no real cloud APIs).

IMPORTANT: These are UNIT TESTS ONLY (no real cloud APIs).
We only verify that storage_facade uses the correct abstraction patterns.
"""

from unittest.mock import MagicMock, patch

from deployment_api.utils.storage_facade import list_objects, object_exists


class TestStorageFacadeUsage:
    """Test that storage_facade functions work correctly with mocks."""

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse")
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted")
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_list_objects_uses_storage_client(self, mock_get_client, mock_mounted, mock_fuse):
        """Verify list_objects uses UCI StorageClient abstraction."""
        mock_fuse.return_value = False
        mock_mounted.return_value = False
        mock_client = MagicMock()
        mock_blob = MagicMock()
        mock_blob.name = "test/file.txt"
        mock_blob.size = 100

        mock_client.list_blobs.return_value = [mock_blob]
        mock_get_client.return_value = mock_client

        result = list_objects("test-bucket", "test/", max_results=10)

        mock_get_client.assert_called_once()
        mock_client.list_blobs.assert_called_once()
        assert len(result) == 1
        assert result[0].name == "test/file.txt"

    @patch("deployment_api.utils.storage_facade._use_gcs_fuse")
    @patch("deployment_api.utils.storage_facade._is_bucket_mounted")
    @patch("deployment_api.utils.storage_client.get_storage_client")
    def test_object_exists_uses_storage_client(self, mock_get_client, mock_mounted, mock_fuse):
        """Verify object_exists uses UCI StorageClient abstraction."""
        mock_fuse.return_value = False
        mock_mounted.return_value = False
        mock_client = MagicMock()
        mock_client.blob_exists.return_value = True
        mock_get_client.return_value = mock_client

        result = object_exists("test-bucket", "test/file.txt")

        mock_get_client.assert_called_once()
        mock_client.blob_exists.assert_called_once_with("test-bucket", "test/file.txt")
        assert result is True
