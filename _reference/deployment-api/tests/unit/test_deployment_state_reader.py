"""
Unit tests for utils/deployment_state_reader module.

Tests list_deployments: happy path, filtering by service,
error handling, valid/invalid folder names, state parsing,
shard status aggregation, and GCS errors.
"""

import json
from unittest.mock import MagicMock, patch

import deployment_api.utils.deployment_state_reader as dr


def _make_mock_client(prefixes=None, blob_exists=True, content=None):
    """Build a minimal GCS client mock."""
    client = MagicMock()
    bucket = MagicMock()
    client.bucket.return_value = bucket

    list_result = MagicMock()
    list_result.prefixes = prefixes or []
    bucket.list_blobs.return_value = list_result

    blob = MagicMock()
    blob.exists.return_value = blob_exists
    if content is not None:
        blob.download_as_string.return_value = (
            content.encode("utf-8") if isinstance(content, str) else content
        )
    bucket.blob.return_value = blob

    return client


class TestListDeployments:
    """Tests for list_deployments function."""

    def test_returns_empty_on_storage_error(self):
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", side_effect=OSError("no gcs")
        ):
            result = dr.list_deployments("test-bucket")
        assert result == []

    def test_returns_empty_when_no_prefixes(self):
        mock_client = _make_mock_client(prefixes=[])
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")
        assert result == []

    def test_filters_invalid_folder_names(self):
        # Folders without enough dashes are filtered out
        mock_client = _make_mock_client(prefixes=["deployments.development/badfolder/"])
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")
        assert result == []

    def test_filters_d_prefix_folders(self):
        # Folders starting with 'd-' are filtered out
        mock_client = _make_mock_client(prefixes=["deployments.development/d-svc-2026-01-01-abc/"])
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")
        assert result == []

    def test_valid_folder_returns_deployment(self):
        state = {
            "deployment_id": "svc-20260101-120000-abc",
            "service": "my-svc",
            "compute_type": "vm",
            "status": "running",
            "created_at": "2026-01-01T12:00:00Z",
            "shards": [
                {"status": "running"},
                {"status": "succeeded"},
            ],
        }
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=True,
            content=json.dumps(state),
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        assert len(result) == 1
        assert result[0]["deployment_id"] == "svc-20260101-120000-abc"
        assert result[0]["service"] == "my-svc"
        assert result[0]["status"] == "running"

    def test_skips_when_blob_not_exists(self):
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=False,
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        assert result == []

    def test_skips_on_download_error(self):
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=True,
            content=None,
        )
        mock_client.bucket.return_value.blob.return_value.download_as_string.side_effect = OSError(
            "network error"
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        assert result == []

    def test_skips_on_invalid_json(self):
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=True,
            content="not-valid-json",
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        assert result == []

    def test_filters_by_service_name(self):
        state_a = {
            "deployment_id": "svc-a-20260101-120000-abc",
            "service": "svc-a",
            "compute_type": "vm",
            "shards": [],
        }
        state_b = {
            "deployment_id": "svc-b-20260101-120000-def",
            "service": "svc-b",
            "compute_type": "vm",
            "shards": [],
        }
        mock_client = MagicMock()
        bucket = MagicMock()
        mock_client.bucket.return_value = bucket

        list_result = MagicMock()
        list_result.prefixes = [
            "deployments.development/svc-a-20260101-120000-abc/",
            "deployments.development/svc-b-20260101-120000-def/",
        ]
        bucket.list_blobs.return_value = list_result

        def blob_for(name):
            blob = MagicMock()
            blob.exists.return_value = True
            if "svc-a" in name:
                blob.download_as_string.return_value = json.dumps(state_a).encode()
            else:
                blob.download_as_string.return_value = json.dumps(state_b).encode()
            return blob

        bucket.blob.side_effect = blob_for

        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket", service="svc-a")

        assert all(r["service"] == "svc-a" for r in result)

    def test_pending_shards_yield_pending_status(self):
        state = {
            "deployment_id": "svc-20260101-120000-abc",
            "service": "my-svc",
            "compute_type": "vm",
            "shards": [{"status": "pending"}, {"status": "pending"}],
        }
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=True,
            content=json.dumps(state),
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        assert result[0]["status"] == "pending"

    def test_all_failed_shards_yield_failed_status(self):
        state = {
            "deployment_id": "svc-20260101-120000-abc",
            "service": "my-svc",
            "compute_type": "vm",
            "shards": [{"status": "failed"}, {"status": "failed"}],
        }
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=True,
            content=json.dumps(state),
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        assert result[0]["status"] == "failed"

    def test_all_succeeded_shards_yield_completed_status(self):
        state = {
            "deployment_id": "svc-20260101-120000-abc",
            "service": "my-svc",
            "compute_type": "vm",
            "shards": [{"status": "succeeded"}, {"status": "succeeded"}],
        }
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=True,
            content=json.dumps(state),
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        assert result[0]["status"] == "completed"

    def test_respects_limit(self):
        prefixes = [f"deployments.development/svc-2026010{i}-120000-abc{i}/" for i in range(1, 8)]
        states = {
            f"svc-2026010{i}-120000-abc{i}": {
                "deployment_id": f"svc-2026010{i}-120000-abc{i}",
                "service": "svc",
                "compute_type": "vm",
                "shards": [],
            }
            for i in range(1, 8)
        }
        mock_client = MagicMock()
        bucket = MagicMock()
        mock_client.bucket.return_value = bucket

        list_result = MagicMock()
        list_result.prefixes = prefixes
        bucket.list_blobs.return_value = list_result

        def blob_for(name):
            blob = MagicMock()
            blob.exists.return_value = True
            for dep_id, state in states.items():
                if dep_id in name:
                    blob.download_as_string.return_value = json.dumps(state).encode()
                    return blob
            blob.exists.return_value = False
            return blob

        bucket.blob.side_effect = blob_for

        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket", limit=3)

        assert len(result) <= 3

    def test_result_has_expected_fields(self):
        state = {
            "deployment_id": "svc-20260101-120000-abc",
            "service": "my-svc",
            "compute_type": "cloud_run",
            "tag": "v1.2.3",
            "cli_args": "--env prod",
            "created_at": "2026-01-01T12:00:00Z",
            "completed_at": "2026-01-01T13:00:00Z",
            "shards": [{"status": "succeeded"}],
        }
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-20260101-120000-abc/"],
            blob_exists=True,
            content=json.dumps(state),
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket")

        r = result[0]
        assert "deployment_id" in r
        assert "service" in r
        assert "compute_type" in r
        assert "status" in r
        assert "progress" in r
        assert "total_shards" in r
        assert r["tag"] == "v1.2.3"

    def test_service_mismatch_in_json_is_filtered(self):
        # State says service=svc-b but we filtered for svc-a
        state = {
            "deployment_id": "svc-b-20260101-120000-abc",
            "service": "svc-b",
            "compute_type": "vm",
            "shards": [],
        }
        mock_client = _make_mock_client(
            prefixes=["deployments.development/svc-a-20260101-120000-abc/"],
            blob_exists=True,
            content=json.dumps(state),
        )
        with patch(
            "deployment_api.utils.storage_client.get_storage_client", return_value=mock_client
        ):
            result = dr.list_deployments("test-bucket", service="svc-a")

        assert result == []
