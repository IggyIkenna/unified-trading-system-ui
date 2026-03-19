#!/usr/bin/env python3
"""Verify bootstrap: confirm all expected resources exist via UCI.

Checks that required S3/GCS buckets exist and required secrets are accessible
using the unified_cloud_interface factory. Provider is determined by the
CLOUD_PROVIDER environment variable (resolved via UCI's get_cloud_provider()).

Exit codes:
    0 — all checks passed
    1 — one or more checks failed

Usage:
    python scripts/bootstrap/verify_bootstrap.py
    python scripts/bootstrap/verify_bootstrap.py --bucket-prefix my-prefix --env staging
"""

from __future__ import annotations

import argparse
import logging
import sys
from dataclasses import dataclass, field
from typing import Literal, Protocol

from unified_cloud_interface import get_secret_client, get_storage_client

logger = logging.getLogger(__name__)


class _BucketCheckable(Protocol):
    """Protocol for storage clients that support bucket_exists()."""

    def bucket_exists(self, bucket_name: str) -> bool: ...


class _SecretReadable(Protocol):
    """Protocol for secret clients that support get_secret()."""

    def get_secret(self, secret_name: str) -> str | None: ...


# ---------------------------------------------------------------------------
# Required resources
# ---------------------------------------------------------------------------

REQUIRED_BUCKET_SUFFIXES: list[str] = [
    "market-data",
    "models",
    "features",
    "deployment-state",
]

REQUIRED_SECRETS: list[str] = [
    "tardis-api-key",
    "databento-api-key",
]

# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------

CheckStatus = Literal["PASS", "FAIL"]


@dataclass
class ResourceResult:
    resource_type: str
    name: str
    status: CheckStatus
    detail: str = ""


@dataclass
class VerifyReport:
    results: list[ResourceResult] = field(default_factory=list)

    @property
    def passed(self) -> bool:
        return all(r.status == "PASS" for r in self.results)

    def add(self, result: ResourceResult) -> None:
        self.results.append(result)


# ---------------------------------------------------------------------------
# Check helpers
# ---------------------------------------------------------------------------


def _check_bucket(storage_client: _BucketCheckable, bucket_name: str) -> ResourceResult:
    """Return PASS if bucket exists and is accessible, FAIL otherwise."""
    try:
        storage_client.bucket_exists(bucket_name)
        return ResourceResult(
            resource_type="bucket",
            name=bucket_name,
            status="PASS",
        )
    except Exception as exc:
        return ResourceResult(
            resource_type="bucket",
            name=bucket_name,
            status="FAIL",
            detail=str(exc),
        )


def _check_secret(secret_client: _SecretReadable, secret_name: str) -> ResourceResult:
    """Return PASS if secret is accessible, FAIL otherwise."""
    try:
        secret_client.get_secret(secret_name)
        return ResourceResult(
            resource_type="secret",
            name=secret_name,
            status="PASS",
        )
    except Exception as exc:
        return ResourceResult(
            resource_type="secret",
            name=secret_name,
            status="FAIL",
            detail=str(exc),
        )


# ---------------------------------------------------------------------------
# Core verify function
# ---------------------------------------------------------------------------


def verify(
    bucket_prefix: str,
    environment: str,
    required_bucket_suffixes: list[str] | None = None,
    required_secrets: list[str] | None = None,
) -> VerifyReport:
    """Verify all expected bootstrap resources exist via UCI.

    Args:
        bucket_prefix:           Prefix used when creating buckets (e.g. "my-co-trading").
        environment:             Deployment environment: dev | staging | prod.
        required_bucket_suffixes: Bucket suffix names; full name is ``{prefix}-{env}-{suffix}``.
        required_secrets:        Secret names as stored in Secrets Manager / Secret Manager.

    Returns:
        VerifyReport with PASS/FAIL per resource.
    """
    if required_bucket_suffixes is None:
        required_bucket_suffixes = REQUIRED_BUCKET_SUFFIXES
    if required_secrets is None:
        required_secrets = REQUIRED_SECRETS

    report = VerifyReport()
    storage_client = get_storage_client()
    secret_client = get_secret_client()

    for suffix in required_bucket_suffixes:
        bucket_name = f"{bucket_prefix}-{environment}-{suffix}"
        report.add(_check_bucket(storage_client, bucket_name))

    for secret_name in required_secrets:
        report.add(_check_secret(secret_client, secret_name))

    return report


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------


def _print_report(report: VerifyReport) -> None:
    pass_count = sum(1 for r in report.results if r.status == "PASS")
    fail_count = sum(1 for r in report.results if r.status == "FAIL")
    total = len(report.results)

    logger.info(f"\nBootstrap Verification — {pass_count}/{total} passed")
    logger.info("-" * 50)

    for result in report.results:
        label = f"[{result.resource_type:8}]"
        status = result.status
        logger.info(f"  {status}  {label}  {result.name}")
        if result.detail:
            logger.info(f"            {result.detail}")

    logger.info("-" * 50)
    if report.passed:
        logger.info(f"RESULT: PASS  ({pass_count} resources verified)")
    else:
        logger.info(f"RESULT: FAIL  ({fail_count} resource(s) not accessible)")
    logger.info()


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------


def main() -> None:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(
        description="Verify UCI bootstrap resources (buckets + secrets) exist."
    )
    parser.add_argument(
        "--bucket-prefix",
        required=True,
        help="Bucket prefix used during bootstrap (e.g. my-co-trading)",
    )
    parser.add_argument(
        "--env",
        required=True,
        choices=["dev", "staging", "prod"],
        help="Deployment environment",
    )
    args = parser.parse_args()

    report = verify(
        bucket_prefix=args.bucket_prefix,
        environment=args.env,
    )
    _print_report(report)
    sys.exit(0 if report.passed else 1)


if __name__ == "__main__":
    main()
