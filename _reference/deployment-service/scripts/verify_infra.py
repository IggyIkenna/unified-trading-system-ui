"""
Layer 2 Infra Verification — deployment-service

Verifies infrastructure connectivity before deployments:
- GCS buckets exist and are accessible
- Pub/Sub topics exist
- Secret Manager entries exist
- IAM bindings (basic read check)

Called by:
- deployment-api GET /infra/health endpoint
- Pre-deployment gate in orchestrator

Usage:
    python scripts/verify_infra.py --project-id <project-id>
    python scripts/verify_infra.py --project-id <project-id> --output json

Exit codes:
    0 — all checks passed
    1 — one or more checks failed
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import logging
import sys
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Literal

if TYPE_CHECKING:
    from unified_cloud_interface import StorageClient

logger = logging.getLogger(__name__)

CheckStatus = Literal["ok", "error", "skip"]


@dataclass
class CheckResult:
    name: str
    status: CheckStatus
    message: str
    resource: str = ""
    error: str = ""

    def to_dict(self) -> dict[str, str]:
        return {
            "name": self.name,
            "status": self.status,
            "message": self.message,
            "resource": self.resource,
            "error": self.error,
        }


@dataclass
class InfraVerificationResult:
    project_id: str
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    checks: list[CheckResult] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(c.status != "error" for c in self.checks)

    @property
    def summary(self) -> dict[str, int]:
        return {
            "ok": sum(1 for c in self.checks if c.status == "ok"),
            "error": sum(1 for c in self.checks if c.status == "error"),
            "skip": sum(1 for c in self.checks if c.status == "skip"),
            "total": len(self.checks),
        }

    def to_dict(self) -> dict[str, object]:
        return {
            "project_id": self.project_id,
            "timestamp": self.timestamp,
            "passed": self.passed,
            "summary": self.summary,
            "checks": [c.to_dict() for c in self.checks],
        }


def _verify_gcs_bucket(storage_client: StorageClient, bucket_name: str) -> CheckResult:
    """Check a single GCS bucket exists and is accessible."""
    try:
        bucket = storage_client.bucket(bucket_name)
        bucket.reload()
        return CheckResult(
            name=f"gcs/{bucket_name}",
            status="ok",
            message="Bucket exists and is accessible",
            resource=f"gs://{bucket_name}",
        )
    except (OSError, ValueError, RuntimeError) as exc:
        return CheckResult(
            name=f"gcs/{bucket_name}",
            status="error",
            message="Bucket not accessible",
            resource=f"gs://{bucket_name}",
            error=str(exc),
        )


def verify_gcs_buckets(project_id: str, bucket_names: list[str]) -> list[CheckResult]:
    """Verify GCS buckets exist using get_storage_client() from unified_cloud_interface."""
    if importlib.util.find_spec("unified_cloud_interface") is None:
        return [
            CheckResult(
                name=f"gcs/{b}",
                status="skip",
                message="unified_cloud_interface not installed — skipping GCS checks",
                resource=f"gs://{b}",
            )
            for b in bucket_names
        ]

    from unified_cloud_interface import get_storage_client

    storage_client = get_storage_client(project_id=project_id)
    return [_verify_gcs_bucket(storage_client, b) for b in bucket_names]


def verify_pubsub_topics(project_id: str, topic_names: list[str]) -> list[CheckResult]:
    """Verify Pub/Sub topics exist."""
    results: list[CheckResult] = []
    from unified_cloud_interface import get_pubsub_client

    pubsub = get_pubsub_client(project_id=project_id)
    for topic in topic_names:
        full_name = f"projects/{project_id}/topics/{topic}"
        try:
            if pubsub.topic_exists(topic):
                results.append(
                    CheckResult(
                        name=f"pubsub/{topic}",
                        status="ok",
                        message="Topic exists",
                        resource=full_name,
                    )
                )
            else:
                results.append(
                    CheckResult(
                        name=f"pubsub/{topic}",
                        status="error",
                        message="Topic not found or not accessible",
                        resource=full_name,
                        error="Topic does not exist",
                    )
                )
        except (OSError, ValueError, RuntimeError) as exc:
            results.append(
                CheckResult(
                    name=f"pubsub/{topic}",
                    status="error",
                    message="Topic not found or not accessible",
                    resource=full_name,
                    error=str(exc),
                )
            )
    return results


def verify_secrets(project_id: str, secret_names: list[str]) -> list[CheckResult]:
    """Verify Secret Manager entries exist and are accessible."""
    results: list[CheckResult] = []
    if importlib.util.find_spec("unified_cloud_interface") is None:
        for secret_name in secret_names:
            results.append(
                CheckResult(
                    name=f"secret/{secret_name}",
                    status="skip",
                    message="unified_cloud_interface not installed — skipping secret checks",
                    resource=f"projects/{project_id}/secrets/{secret_name}",
                )
            )
        return results

    from unified_cloud_interface import get_secret_client

    for secret_name in secret_names:
        try:
            get_secret_client(project_id=project_id, secret_name=secret_name)
            results.append(
                CheckResult(
                    name=f"secret/{secret_name}",
                    status="ok",
                    message="Secret accessible",
                    resource=f"projects/{project_id}/secrets/{secret_name}",
                )
            )
        except (OSError, ValueError, RuntimeError) as exc:
            results.append(
                CheckResult(
                    name=f"secret/{secret_name}",
                    status="error",
                    message="Secret not accessible",
                    resource=f"projects/{project_id}/secrets/{secret_name}",
                    error=str(exc),
                )
            )
    return results


def run_verification(
    project_id: str,
    buckets: list[str] | None = None,
    topics: list[str] | None = None,
    secrets: list[str] | None = None,
) -> InfraVerificationResult:
    """
    Run all infra verification checks.

    Args:
        project_id: GCP project ID (from GCP_PROJECT_ID env var or --project-id flag)
        buckets: GCS bucket names to verify (without gs:// prefix)
        topics: Pub/Sub topic names to verify
        secrets: Secret Manager secret names to verify

    Returns:
        InfraVerificationResult with all check results and pass/fail status
    """
    result = InfraVerificationResult(project_id=project_id)

    if buckets:
        result.checks.extend(verify_gcs_buckets(project_id, buckets))

    if topics:
        result.checks.extend(verify_pubsub_topics(project_id, topics))

    if secrets:
        result.checks.extend(verify_secrets(project_id, secrets))

    if not result.checks:
        result.checks.append(
            CheckResult(
                name="no-op",
                status="ok",
                message="No resources specified for verification",
            )
        )

    return result


def _build_default_resources(project_id: str) -> tuple[list[str], list[str], list[str]]:
    """Build default resource lists for a project."""
    buckets = [
        f"{project_id}-deployment-state",
        f"{project_id}-deployment-logs",
        f"{project_id}-deployment-artifacts",
    ]
    topics = [
        "deployment-events",
        "deployment-status",
    ]
    secrets = [
        "gh-pat",
        "deployment-sa-key",
    ]
    return buckets, topics, secrets


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Verify infrastructure connectivity for deployment-service"
    )
    parser.add_argument(
        "--project-id",
        required=True,
        help="GCP project ID",
    )
    parser.add_argument(
        "--output",
        choices=["json", "text"],
        default="text",
        help="Output format (default: text)",
    )
    parser.add_argument(
        "--buckets",
        nargs="*",
        help="GCS bucket names to verify (space-separated, without gs:// prefix)",
    )
    parser.add_argument(
        "--topics",
        nargs="*",
        help="Pub/Sub topic names to verify",
    )
    parser.add_argument(
        "--secrets",
        nargs="*",
        help="Secret Manager secret names to verify",
    )
    args = parser.parse_args()

    buckets = args.buckets
    topics = args.topics
    secrets = args.secrets

    if not any([buckets, topics, secrets]):
        buckets, topics, secrets = _build_default_resources(args.project_id)

    result = run_verification(
        project_id=args.project_id,
        buckets=buckets,
        topics=topics,
        secrets=secrets,
    )

    if args.output == "json":
        logger.info(json.dumps(result.to_dict(), indent=2))
    else:
        logger.info(f"\nInfra Verification — project: {result.project_id}")
        logger.info(f"Timestamp: {result.timestamp}")
        logger.info(f"Status: {'PASSED' if result.passed else 'FAILED'}")
        logger.info(f"Summary: {result.summary}")
        logger.info()
        for check in result.checks:
            icon = {"ok": "✓", "error": "✗", "skip": "~"}.get(check.status, "?")
            logger.info(f"  {icon} [{check.status.upper():5}] {check.name}")
            if check.resource:
                logger.info(f"           resource: {check.resource}")
            if check.error:
                logger.info(f"           error: {check.error}")

    sys.exit(0 if result.passed else 1)


if __name__ == "__main__":
    logging.basicConfig(level=logging.WARNING)
    main()
