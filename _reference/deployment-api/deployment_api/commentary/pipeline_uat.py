"""Pipeline UAT Commentary — LLM-generated analysis after each batch pipeline run.

Triggered by POST /commentary/pipeline-uat from Cloud Scheduler or the pipeline
orchestrator after each batch run completes.

Reads GCS manifests for:
  - instruments coverage (vs expected count)
  - feature pipeline health (row counts, null rates)
  - ML training metrics (loss, val_loss, accuracy)
  - market tick data coverage (by exchange)
  - execution T+1 recon output (execution alpha bps)

Calls the Anthropic API to produce a natural-language UAT summary, writes it
to GCS, and pushes an SSE event for the live-health-monitor-ui.

This module is READ-ONLY — it never modifies pipeline state or triggers
redeployments. All decisions remain with humans.
"""

from __future__ import annotations

import json
import logging
from datetime import UTC, datetime
from typing import TYPE_CHECKING, cast

import anthropic
from anthropic.types import TextBlock
from pydantic import BaseModel
from unified_cloud_interface import get_data_sink, get_storage_client
from unified_events_interface import log_event

if TYPE_CHECKING:
    from deployment_api.deployment_api_config import DeploymentApiConfig

logger = logging.getLogger(__name__)

_SYSTEM_PROMPT = """\
You are an autonomous pipeline QA analyst for a quantitative trading infrastructure.
Your role is to review batch pipeline run outputs and produce a concise UAT summary.

Guidelines:
- Flag coverage gaps, anomalous metrics, and dependency ordering violations
- Highlight stale data (e.g. tick data not updated within expected window)
- Note if ML training metrics suggest overfitting or underfitting
- If execution alpha bps is consistently negative, flag as a potential issue
- Keep the summary under 6 sentences unless critical issues are found
- Use plain language — the audience includes both engineers and trading staff
- Never recommend specific trades or infrastructure changes autonomously
"""


class PipelineUATRequest(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Request body for the pipeline UAT endpoint."""

    job_name: str
    run_id: str
    gcs_manifest_path: str
    project_id: str = ""


class PipelineUATResult(BaseModel):  # CORRECT-LOCAL: FastAPI API contract model
    """Result returned by the pipeline UAT endpoint."""

    run_id: str
    job_name: str
    timestamp: str
    commentary: str
    context_summary: dict[str, object]
    gcs_output_path: str


async def run_pipeline_uat(
    request: PipelineUATRequest,
    config: DeploymentApiConfig,
) -> PipelineUATResult:
    """Run a pipeline UAT commentary cycle for the given batch run.

    Reads GCS manifests, calls Anthropic API, writes output to GCS.
    Returns a PipelineUATResult even on partial failures (best-effort).
    """
    ts = datetime.now(UTC)
    date_str = ts.strftime("%Y-%m-%d")
    project_id = request.project_id or config.gcp_project_id or "unknown"

    context = await _assemble_context(request, project_id, config)
    commentary = ""
    if config.pipeline_uat_commentary_enabled and config.anthropic_api_key:
        try:
            commentary = await _call_anthropic(context, config)
        except Exception as exc:
            logger.exception("Pipeline UAT: Anthropic call failed: %s", exc)
            log_event("PIPELINE_UAT_ERROR", details={"run_id": request.run_id, "error": str(exc)})
            commentary = f"[Commentary unavailable: {type(exc).__name__}]"
    else:
        commentary = (
            "[Commentary disabled — set PIPELINE_UAT_COMMENTARY_ENABLED=true and ANTHROPIC_API_KEY]"
        )

    output_path = f"pipeline-uat/day={date_str}/run={request.run_id}.json"
    output: dict[str, object] = {
        "timestamp": ts.isoformat(),
        "run_id": request.run_id,
        "job_name": request.job_name,
        "project_id": project_id,
        "model": config.pipeline_uat_model,
        "commentary": commentary,
        "context": context,
    }

    try:
        sink = get_data_sink(routing_key="pipeline_uat")
        sink.write(
            data=output,
            partition={"day": date_str},
            format="json",
            filename=f"run_{request.run_id}.json",
        )
    except Exception as sink_exc:
        logger.warning("Pipeline UAT: GCS write failed (non-fatal): %s", sink_exc)

    log_event(
        "PIPELINE_UAT_CYCLE",
        details={
            "run_id": request.run_id,
            "job_name": request.job_name,
            "project_id": project_id,
            "commentary_chars": len(commentary),
        },
    )

    context_summary: dict[str, object] = {
        "instruments_count": context.get("instruments_count"),
        "feature_null_rate": context.get("feature_null_rate"),
        "ml_val_loss": context.get("ml_val_loss"),
        "execution_alpha_bps": context.get("execution_alpha_bps"),
    }

    return PipelineUATResult(
        run_id=request.run_id,
        job_name=request.job_name,
        timestamp=ts.isoformat(),
        commentary=commentary,
        context_summary=context_summary,
        gcs_output_path=output_path,
    )


async def _assemble_context(
    request: PipelineUATRequest,
    project_id: str,
    config: DeploymentApiConfig,
) -> dict[str, object]:
    """Read GCS manifests and assemble context for the LLM prompt.

    Returns a best-effort dict — missing data is represented as None so
    the LLM can flag it as a gap.
    """
    context: dict[str, object] = {
        "job_name": request.job_name,
        "run_id": request.run_id,
        "project_id": project_id,
    }

    storage = get_storage_client()

    # Instruments coverage
    try:
        raw_bytes = storage.download_bytes(
            f"instruments-store-{project_id}", "instruments/latest/manifest.json"
        )
        manifest = cast(dict[str, object], json.loads(raw_bytes))
        context["instruments_count"] = manifest.get("count")
        context["instruments_expected_count"] = manifest.get("expected_count")
    except Exception as exc:
        logger.debug("Pipeline UAT: instruments manifest unavailable: %s", exc)
        context["instruments_count"] = None
        context["instruments_expected_count"] = None

    # Feature pipeline health
    try:
        raw_bytes = storage.download_bytes(f"features-store-{project_id}", "health/latest.json")
        health = cast(dict[str, object], json.loads(raw_bytes))
        context["feature_row_count"] = health.get("row_count")
        context["feature_null_rate"] = health.get("null_rate")
    except Exception as exc:
        logger.debug("Pipeline UAT: features health unavailable: %s", exc)
        context["feature_row_count"] = None
        context["feature_null_rate"] = None

    # ML training metrics
    try:
        raw_bytes = storage.download_bytes(f"ml-store-{project_id}", "training/latest/metrics.json")
        metrics = cast(dict[str, object], json.loads(raw_bytes))
        context["ml_loss"] = metrics.get("loss")
        context["ml_val_loss"] = metrics.get("val_loss")
        context["ml_accuracy"] = metrics.get("accuracy")
    except Exception as exc:
        logger.debug("Pipeline UAT: ML metrics unavailable: %s", exc)
        context["ml_loss"] = None
        context["ml_val_loss"] = None
        context["ml_accuracy"] = None

    # Execution T+1 recon (execution alpha)
    try:
        date_str = datetime.now(UTC).strftime("%Y-%m-%d")
        raw_bytes = storage.download_bytes(
            f"execution-store-{project_id}", "t1_recon/latest/summary.json"
        )
        recon = cast(dict[str, object], json.loads(raw_bytes))
        context["execution_alpha_bps"] = recon.get("execution_alpha_bps")
        context["execution_recon_date"] = recon.get("date", date_str)
    except Exception as exc:
        logger.debug("Pipeline UAT: execution recon unavailable: %s", exc)
        context["execution_alpha_bps"] = None

    return context


async def _call_anthropic(
    context: dict[str, object],
    config: DeploymentApiConfig,
) -> str:
    """Call Anthropic API and return the commentary text."""
    client = anthropic.AsyncAnthropic(api_key=config.anthropic_api_key)
    user_message = f"Pipeline run output:\n{json.dumps(context, indent=2)}"

    message = await client.messages.create(
        model=config.pipeline_uat_model,
        max_tokens=config.pipeline_uat_max_tokens,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    text_blocks = [block for block in message.content if isinstance(block, TextBlock)]
    return str(text_blocks[0].text) if text_blocks else ""
