"""
Unit tests for artifact_registry module.

Tests cover _parse_image_url (pure function) and invalidate_image_cache.
The async network functions are tested with mocks.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from deployment_api.utils.artifact_registry import (
    _image_cache,
    _parse_image_url,
    invalidate_image_cache,
)


class TestParseImageUrl:
    """Tests for _parse_image_url."""

    def test_basic_url_with_tag(self):
        url = "asia-northeast1-docker.pkg.dev/my-project/my-repo/my-image:latest"
        result = _parse_image_url(url)
        assert result is not None
        assert result["location"] == "asia-northeast1"
        assert result["project"] == "my-project"
        assert result["repository"] == "my-repo"
        assert result["image"] == "my-image"
        assert result["tag"] == "latest"

    def test_url_with_specific_tag(self):
        url = "us-central1-docker.pkg.dev/proj/repo/svc:v1.2.3"
        result = _parse_image_url(url)
        assert result is not None
        assert result["tag"] == "v1.2.3"
        assert result["location"] == "us-central1"

    def test_url_with_digest(self):
        url = "europe-west1-docker.pkg.dev/proj/repo/svc@sha256:abc123def456abc123def456abc123de"
        result = _parse_image_url(url)
        assert result is not None
        assert result["digest"] is not None
        assert result["digest"].startswith("sha256:")

    def test_url_without_tag_or_digest_defaults_to_latest(self):
        url = "asia-northeast1-docker.pkg.dev/proj/repo/svc"
        result = _parse_image_url(url)
        assert result is not None
        assert result["tag"] == "latest"

    def test_invalid_url_returns_none(self):
        assert _parse_image_url("docker.io/library/ubuntu:20.04") is None
        assert _parse_image_url("not-a-url") is None
        assert _parse_image_url("") is None

    def test_different_regions(self):
        regions = [
            "us-central1",
            "europe-west4",
            "asia-east1",
            "us-east1",
        ]
        for region in regions:
            url = f"{region}-docker.pkg.dev/proj/repo/img:tag"
            result = _parse_image_url(url)
            assert result is not None, f"Failed to parse URL with region {region}"
            assert result["location"] == region


class TestInvalidateImageCache:
    """Tests for invalidate_image_cache."""

    def setup_method(self):
        _image_cache.clear()

    def test_clear_all_when_no_url(self):
        from datetime import UTC, datetime

        _image_cache["url1"] = {"digest": "abc", "_cached_at": datetime.now(UTC)}
        _image_cache["url2"] = {"digest": "def", "_cached_at": datetime.now(UTC)}
        invalidate_image_cache()
        assert len(_image_cache) == 0

    def test_clear_specific_url(self):
        from datetime import UTC, datetime

        _image_cache["url1"] = {"digest": "abc", "_cached_at": datetime.now(UTC)}
        _image_cache["url2"] = {"digest": "def", "_cached_at": datetime.now(UTC)}
        invalidate_image_cache("url1")
        assert "url1" not in _image_cache
        assert "url2" in _image_cache

    def test_clear_nonexistent_url_no_error(self):
        # Should not raise
        invalidate_image_cache("nonexistent-url")

    def test_clear_empty_cache_no_error(self):
        # Should not raise on empty cache
        invalidate_image_cache()


class TestGetAuthToken:
    """Tests for _get_auth_token helper."""

    def test_returns_token_on_success(self):
        from deployment_api.utils import artifact_registry as _ar

        mock_credentials = MagicMock()
        mock_credentials.token = "my-oauth-token"
        with (
            patch.object(_ar, "google") as mock_google,
        ):
            mock_google.auth.default.return_value = (mock_credentials, "project-id")
            mock_google.auth.transport.requests.Request.return_value = MagicMock()
            result = _ar._get_auth_token()
        assert result == "my-oauth-token"

    def test_returns_none_on_oserror(self):
        from deployment_api.utils import artifact_registry as _ar

        with patch.object(_ar, "google") as mock_google:
            mock_google.auth.default.side_effect = OSError("no credentials")
            result = _ar._get_auth_token()
        assert result is None

    def test_returns_none_on_runtime_error(self):
        from deployment_api.utils import artifact_registry as _ar

        with patch.object(_ar, "google") as mock_google:
            mock_google.auth.default.side_effect = RuntimeError("ADC unavailable")
            result = _ar._get_auth_token()
        assert result is None


class TestGetImageInfo:
    """Tests for get_image_info async function."""

    @pytest.mark.asyncio
    async def test_returns_none_for_invalid_url(self):
        from deployment_api.utils.artifact_registry import get_image_info, invalidate_image_cache

        invalidate_image_cache()
        result = await get_image_info("not-a-valid-image-url")
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_none_when_no_auth_token(self):
        from deployment_api.utils import artifact_registry as _ar
        from deployment_api.utils.artifact_registry import get_image_info, invalidate_image_cache

        invalidate_image_cache()
        url = "us-central1-docker.pkg.dev/my-project/my-repo/my-image:latest"
        with patch.object(_ar, "_get_auth_token", return_value=None):
            result = await get_image_info(url)
        assert result is None

    @pytest.mark.asyncio
    async def test_returns_cached_result(self):
        from datetime import UTC, datetime

        from deployment_api.utils import artifact_registry as _ar
        from deployment_api.utils.artifact_registry import get_image_info, invalidate_image_cache

        invalidate_image_cache()
        url = "us-central1-docker.pkg.dev/my-project/my-repo/my-image:latest"
        cached_result = {
            "digest": "sha256:abc123",
            "image_url": url,
            "_cached_at": datetime.now(UTC),
        }
        _ar._image_cache[url] = cached_result

        result = await get_image_info(url)
        assert result is cached_result
        invalidate_image_cache(url)

    @pytest.mark.asyncio
    async def test_returns_none_on_client_error(self):
        import aiohttp

        from deployment_api.utils import artifact_registry as _ar
        from deployment_api.utils.artifact_registry import get_image_info, invalidate_image_cache

        invalidate_image_cache()
        url = "us-central1-docker.pkg.dev/my-project/my-repo/my-image:latest"
        with (
            patch.object(_ar, "_get_auth_token", return_value="token"),
            patch.object(_ar, "aiohttp") as mock_aiohttp,
        ):
            mock_session = MagicMock()
            mock_session.__aenter__ = AsyncMock(
                side_effect=aiohttp.ClientError("connection failed")
            )
            mock_session.__aexit__ = AsyncMock(return_value=False)
            mock_aiohttp.ClientSession.return_value = mock_session
            mock_aiohttp.ClientError = aiohttp.ClientError
            mock_aiohttp.ClientTimeout.return_value = MagicMock()
            result = await get_image_info(url)
        assert result is None
