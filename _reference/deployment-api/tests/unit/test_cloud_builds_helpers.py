"""
Unit tests for cloud_builds module pure helper functions.

Tests cover:
- _format_build_info
- _populate_trigger_cache / _get_cached_trigger_id
"""

import time
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import patch

import pytest

from deployment_api.routes.cloud_builds import (
    _format_build_info,
    _get_cached_trigger_id,
    _populate_trigger_cache,
    _trigger_id_cache,
)


class TestFormatBuildInfo:
    """Tests for _format_build_info."""

    def _make_build(
        self,
        status_name="SUCCESS",
        create_time=None,
        finish_time=None,
        substitutions=None,
        log_url="https://log.url",
    ):
        build = SimpleNamespace(
            id="build-123",
            status=SimpleNamespace(name=status_name),
            create_time=create_time,
            finish_time=finish_time,
            substitutions=substitutions,
            log_url=log_url,
        )
        return build

    def test_basic_build(self):
        build = self._make_build()
        result = _format_build_info(build)
        assert result["build_id"] == "build-123"
        assert result["status"] == "SUCCESS"
        assert result["log_url"] == "https://log.url"

    def test_no_create_or_finish_time(self):
        build = self._make_build(create_time=None, finish_time=None)
        result = _format_build_info(build)
        assert result["create_time"] is None
        assert result["finish_time"] is None
        assert result["duration_seconds"] is None

    def test_with_create_and_finish_time(self):
        now = datetime.now(UTC)
        create = now - timedelta(minutes=10)
        finish = now
        build = self._make_build(create_time=create, finish_time=finish)
        result = _format_build_info(build)
        assert result["create_time"] is not None
        assert result["finish_time"] is not None
        assert result["duration_seconds"] == pytest.approx(600.0, abs=5.0)

    def test_with_commit_sha_substitution(self):
        substitutions = {"COMMIT_SHA": "abcdef1234567890", "BRANCH_NAME": "main"}
        build = self._make_build(substitutions=substitutions)
        result = _format_build_info(build)
        assert result["commit_sha"] == "abcdef1"  # truncated to 7 chars
        assert result["branch"] == "main"

    def test_without_substitutions(self):
        build = self._make_build(substitutions=None)
        result = _format_build_info(build)
        assert result["commit_sha"] is None
        assert result["branch"] is None

    def test_empty_commit_sha(self):
        build = self._make_build(substitutions={"COMMIT_SHA": "", "BRANCH_NAME": "main"})
        result = _format_build_info(build)
        assert result["commit_sha"] is None  # empty COMMIT_SHA → falsy → None


class TestTriggerCache:
    """Tests for _populate_trigger_cache and _get_cached_trigger_id."""

    def setup_method(self):
        # Clear cache before each test
        _trigger_id_cache.clear()

    def test_populate_and_get(self):
        triggers = [
            SimpleNamespace(name="trigger-a", id="id-001"),
            SimpleNamespace(name="trigger-b", id="id-002"),
        ]
        _populate_trigger_cache(triggers)
        assert _get_cached_trigger_id("trigger-a") == "id-001"
        assert _get_cached_trigger_id("trigger-b") == "id-002"

    def test_get_nonexistent_returns_none(self):
        triggers = [SimpleNamespace(name="trigger-x", id="id-x")]
        _populate_trigger_cache(triggers)
        assert _get_cached_trigger_id("nonexistent") is None

    def test_expired_cache_returns_none(self):
        triggers = [SimpleNamespace(name="trigger-a", id="id-001")]
        _populate_trigger_cache(triggers)
        # Simulate expired cache by backdating the cache time
        with patch("deployment_api.routes.cloud_builds._trigger_cache_time", time.time() - 7200):
            result = _get_cached_trigger_id("trigger-a")
        assert result is None

    def test_populate_replaces_old_cache(self):
        old_triggers = [SimpleNamespace(name="old-trigger", id="old-id")]
        _populate_trigger_cache(old_triggers)
        new_triggers = [SimpleNamespace(name="new-trigger", id="new-id")]
        _populate_trigger_cache(new_triggers)
        assert _get_cached_trigger_id("old-trigger") is None
        assert _get_cached_trigger_id("new-trigger") == "new-id"

    def test_empty_triggers_clears_cache(self):
        triggers = [SimpleNamespace(name="trigger-a", id="id-001")]
        _populate_trigger_cache(triggers)
        _populate_trigger_cache([])
        assert _get_cached_trigger_id("trigger-a") is None
