"""Unit tests for pipeline UAT commentary."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from anthropic.types import TextBlock

from deployment_api.commentary.pipeline_uat import (
    PipelineUATRequest,
    PipelineUATResult,
    run_pipeline_uat,
)


def _make_config(enabled: bool = True, api_key: str | None = "sk-test") -> MagicMock:
    config = MagicMock()
    config.pipeline_uat_commentary_enabled = enabled
    config.anthropic_api_key = api_key
    config.pipeline_uat_model = "claude-haiku-4-5-20251001"
    config.pipeline_uat_max_tokens = 800
    config.gcp_project_id = "test-project"
    return config


def _make_request(run_id: str = "run-001") -> PipelineUATRequest:
    return PipelineUATRequest(
        job_name="instruments-pipeline",
        run_id=run_id,
        gcs_manifest_path="gs://instruments-store-test-project/instruments/latest/manifest.json",
        project_id="test-project",
    )


@pytest.mark.asyncio
async def test_run_pipeline_uat_disabled_returns_stub_commentary() -> None:
    """When disabled, commentary must be a stub message — no Anthropic call."""
    config = _make_config(enabled=False)
    request = _make_request()

    with (
        patch("deployment_api.commentary.pipeline_uat.get_storage_client") as mock_storage,
        patch("deployment_api.commentary.pipeline_uat.get_data_sink") as mock_sink,
        patch("deployment_api.commentary.pipeline_uat.anthropic.AsyncAnthropic") as mock_client,
        patch("deployment_api.commentary.pipeline_uat.log_event"),
    ):
        mock_storage.return_value.download_bytes = MagicMock(side_effect=Exception("not available"))
        mock_sink.return_value.write = MagicMock()

        result = await run_pipeline_uat(request, config)

        mock_client.assert_not_called()
        assert "Commentary disabled" in result.commentary


@pytest.mark.asyncio
async def test_run_pipeline_uat_enabled_calls_anthropic() -> None:
    """When enabled + api_key, Anthropic API must be called with pipeline context."""
    config = _make_config(enabled=True, api_key="sk-test")
    request = _make_request()

    mock_text_block = MagicMock(spec=TextBlock)
    mock_text_block.text = (
        "Instruments coverage is at 95%. Feature null rate is within acceptable range."
    )

    mock_message = MagicMock()
    mock_message.content = [mock_text_block]

    mock_client_instance = AsyncMock()
    mock_client_instance.messages.create = AsyncMock(return_value=mock_message)

    with (
        patch("deployment_api.commentary.pipeline_uat.get_storage_client") as mock_storage,
        patch("deployment_api.commentary.pipeline_uat.get_data_sink") as mock_sink,
        patch(
            "deployment_api.commentary.pipeline_uat.anthropic.AsyncAnthropic",
            return_value=mock_client_instance,
        ),
        patch("deployment_api.commentary.pipeline_uat.log_event"),
    ):
        mock_storage.return_value.download_bytes = MagicMock(side_effect=Exception("not available"))
        mock_sink.return_value.write = MagicMock()

        result = await run_pipeline_uat(request, config)

        mock_client_instance.messages.create.assert_called_once()
        assert "Instruments" in result.commentary or "coverage" in result.commentary.lower()


@pytest.mark.asyncio
async def test_run_pipeline_uat_instruments_coverage_gap_in_context() -> None:
    """When instruments manifest shows a coverage gap, context must flag it."""
    config = _make_config(enabled=True, api_key="sk-test")
    request = _make_request()

    instruments_manifest = json.dumps({"count": 850, "expected_count": 1000}).encode()

    captured_context: list[dict[str, object]] = []

    async def capture_call(**kwargs: object) -> MagicMock:
        messages = kwargs.get("messages", [])
        for msg in messages:
            content = msg.get("content", "")  # type: ignore[union-attr]
            if "instruments_count" in content:
                context = json.loads(content.split("\n", 1)[1])
                captured_context.append(context)
        mock_msg = MagicMock()
        mock_text = MagicMock()
        mock_text.text = "Instruments coverage gap detected."
        mock_msg.content = [mock_text]
        return mock_msg

    mock_client_instance = AsyncMock()
    mock_client_instance.messages.create = AsyncMock(side_effect=capture_call)

    def mock_download(bucket: str, path: str) -> bytes:
        if "instruments" in bucket:
            return instruments_manifest
        raise Exception("not available")

    with (
        patch("deployment_api.commentary.pipeline_uat.get_storage_client") as mock_storage,
        patch("deployment_api.commentary.pipeline_uat.get_data_sink") as mock_sink,
        patch(
            "deployment_api.commentary.pipeline_uat.anthropic.AsyncAnthropic",
            return_value=mock_client_instance,
        ),
        patch("deployment_api.commentary.pipeline_uat.log_event"),
    ):
        mock_storage.return_value.download_bytes = MagicMock(side_effect=mock_download)
        mock_sink.return_value.write = MagicMock()

        result = await run_pipeline_uat(request, config)

    assert result.context_summary["instruments_count"] == 850


@pytest.mark.asyncio
async def test_run_pipeline_uat_anthropic_error_returns_error_commentary() -> None:
    """When Anthropic call fails, result commentary must contain error note — not raise."""
    config = _make_config(enabled=True, api_key="sk-test")
    request = _make_request()

    mock_client_instance = AsyncMock()
    mock_client_instance.messages.create = AsyncMock(side_effect=RuntimeError("rate limit"))

    with (
        patch("deployment_api.commentary.pipeline_uat.get_storage_client") as mock_storage,
        patch("deployment_api.commentary.pipeline_uat.get_data_sink") as mock_sink,
        patch(
            "deployment_api.commentary.pipeline_uat.anthropic.AsyncAnthropic",
            return_value=mock_client_instance,
        ),
        patch("deployment_api.commentary.pipeline_uat.log_event"),
    ):
        mock_storage.return_value.download_bytes = MagicMock(side_effect=Exception("not available"))
        mock_sink.return_value.write = MagicMock()

        result = await run_pipeline_uat(request, config)

    assert "unavailable" in result.commentary.lower() or "error" in result.commentary.lower()


@pytest.mark.asyncio
async def test_run_pipeline_uat_returns_correct_structure() -> None:
    """run_pipeline_uat must return a PipelineUATResult with required fields."""
    config = _make_config(enabled=False)
    request = _make_request("run-xyz-123")

    with (
        patch("deployment_api.commentary.pipeline_uat.get_storage_client") as mock_storage,
        patch("deployment_api.commentary.pipeline_uat.get_data_sink") as mock_sink,
        patch("deployment_api.commentary.pipeline_uat.log_event"),
    ):
        mock_storage.return_value.download_bytes = MagicMock(side_effect=Exception("not available"))
        mock_sink.return_value.write = MagicMock()

        result = await run_pipeline_uat(request, config)

    assert isinstance(result, PipelineUATResult)
    assert result.run_id == "run-xyz-123"
    assert result.job_name == "instruments-pipeline"
    assert result.timestamp != ""
    assert "pipeline-uat" in result.gcs_output_path
