"""Commentary routes — pipeline UAT LLM commentary endpoint.

POST /api/commentary/pipeline-uat
  Accepts a PipelineUATRequest, runs pipeline UAT commentary as a background
  task, and returns 202 Accepted immediately. The result is written to GCS
  and emitted as a log event; callers can poll GCS or subscribe to the
  agent-commentary PubSub topic for results.

Authenticated: requires API key (registered under the authenticated router).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, BackgroundTasks

from deployment_api.commentary.pipeline_uat import PipelineUATRequest, run_pipeline_uat
from deployment_api.deployment_api_config import DeploymentApiConfig

logger = logging.getLogger(__name__)

router = APIRouter()

_config = DeploymentApiConfig()


@router.post("/commentary/pipeline-uat", status_code=202)
async def pipeline_uat_commentary(
    request: PipelineUATRequest,
    background_tasks: BackgroundTasks,
) -> dict[str, object]:
    """Trigger pipeline UAT LLM commentary for a completed batch run.

    Returns 202 Accepted immediately. Commentary is generated asynchronously
    and written to GCS at:
      gs://deployment-store-{project}/pipeline-uat/day={date}/run={run_id}.json

    Args:
        request: PipelineUATRequest with job_name, run_id, gcs_manifest_path.
        background_tasks: FastAPI BackgroundTasks for async execution.

    Returns:
        Accepted response with run_id and status.
    """
    background_tasks.add_task(run_pipeline_uat, request, _config)
    logger.info(
        "Pipeline UAT commentary queued for run_id=%s job=%s",
        request.run_id,
        request.job_name,
    )
    return {
        "status": "accepted",
        "run_id": request.run_id,
        "job_name": request.job_name,
        "message": "Pipeline UAT commentary queued. Results written to GCS.",
    }
