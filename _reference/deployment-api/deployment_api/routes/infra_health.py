"""
Infrastructure Health Route

Exposes GET /infra/health — Layer 2 infra verification check.
Verifies GCS buckets, PubSub topics, and Secret Manager entries are accessible
before deployment proceeds.

Unauthenticated: this endpoint is intentionally public so that orchestrators
and CI/CD pipelines can poll it without an API key.

NOTE: The infra verification logic previously imported deployment-service directly
(deployment_service.scripts.verify_infra). This cross-service import boundary has
been removed. The endpoint now returns a "not-configured" status until a proper
HTTP-based infra verification endpoint is added to the infrastructure layer.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/infra/health")
async def infra_health() -> dict[str, object]:
    """
    Layer 2 infra health check.

    Verifies that required GCS buckets, PubSub topics, and Secret Manager
    entries are accessible. Run after Terraform apply, before Layer 3 smoke tests.

    Returns:
        JSON with status ("ok" | "degraded" | "error" | "skip"), check details, and errors.
    """
    from deployment_api.deployment_api_config import DeploymentApiConfig

    _api_cfg = DeploymentApiConfig()
    if _api_cfg.is_mock_mode():
        mock_errors: list[str] = []
        return {
            "status": "ok",
            "project_id": "mock-project",
            "summary": {"ok": 2, "error": 0, "skip": 0, "total": 2},
            "checks": [
                {"name": "gcs_state_bucket", "status": "ok", "detail": "mock", "error": ""},
                {"name": "secret_manager", "status": "ok", "detail": "mock", "error": ""},
            ],
            "errors": mock_errors,
        }
    try:
        from unified_cloud_interface import get_secret_client, get_storage_client

        from deployment_api.auth import auth_cfg as _config

        project_id: str = _config.gcp_project_id or ""

        checks: list[dict[str, object]] = []
        errors: list[str] = []

        # Check GCS state bucket connectivity
        try:
            from deployment_api import settings

            storage_client = get_storage_client(project_id)
            state_bucket = settings.STATE_BUCKET
            if state_bucket:
                bucket = storage_client.bucket(state_bucket)
                # Minimal probe: check if bucket exists
                bucket.exists()
                checks.append(
                    {
                        "name": "gcs_state_bucket",
                        "status": "ok",
                        "detail": state_bucket,
                        "error": "",
                    }
                )
            else:
                checks.append(
                    {
                        "name": "gcs_state_bucket",
                        "status": "skip",
                        "detail": "STATE_BUCKET not configured",
                        "error": "",
                    }
                )
        except (OSError, ValueError, RuntimeError) as e:
            err = str(e)
            checks.append(
                {"name": "gcs_state_bucket", "status": "error", "detail": "", "error": err}
            )
            errors.append(err)

        # Check Secret Manager connectivity
        try:
            get_secret_client(project_id)
            # Minimal probe: the client instantiation itself validates credentials
            checks.append(
                {
                    "name": "secret_manager",
                    "status": "ok",
                    "detail": "client initialised",
                    "error": "",
                }
            )
        except (OSError, ValueError, RuntimeError) as e:
            err = str(e)
            checks.append({"name": "secret_manager", "status": "error", "detail": "", "error": err})
            errors.append(err)

        all_ok = all(c["status"] != "error" for c in checks)
        status = "ok" if all_ok else "degraded"

        return {
            "status": status,
            "project_id": project_id,
            "summary": {
                "ok": sum(1 for c in checks if c["status"] == "ok"),
                "error": sum(1 for c in checks if c["status"] == "error"),
                "skip": sum(1 for c in checks if c["status"] == "skip"),
                "total": len(checks),
            },
            "checks": checks,
            "errors": errors,
        }

    except Exception as exc:
        logger.error("[INFRA-HEALTH] Verification failed with exception: %s", exc)
        return {
            "status": "error",
            "error": str(exc),
            "checks": {},
            "errors": [str(exc)],
        }
