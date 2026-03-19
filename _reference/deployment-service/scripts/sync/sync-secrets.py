"""
sync-secrets.py — Diff and optionally sync secrets between AWS Secrets Manager and GCP Secret Manager.

Both clouds use their own Secret Manager (no unified secrets manager). This script reads from both
via UCI's secret client, diffs by canonical name, and optionally syncs values in either direction.

Usage:
    # Report differences (default)
    python sync-secrets.py --env dev --gcp-project my-project

    # Sync all: write GCP secrets that are missing/different in AWS
    python sync-secrets.py --env dev --gcp-project my-project --sync --source gcp --dest aws

    # Sync specific secrets only
    python sync-secrets.py --env dev --gcp-project my-project \\
        --sync --source aws --dest gcp --names binance-read-api-key,tardis-api-key

    # Check only — non-zero exit if any diff
    python sync-secrets.py --env dev --gcp-project my-project --check

Exit codes:
    0 — no differences (or sync completed successfully)
    1 — differences found (in --report/--check mode) or sync error
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from dataclasses import dataclass, field
from typing import Literal

logger = logging.getLogger(__name__)

SyncStatus = Literal["match", "aws_only", "gcp_only", "value_mismatch", "error"]


@dataclass
class SecretDiff:
    name: str
    status: SyncStatus
    aws_value: str | None = None
    gcp_value: str | None = None
    error: str = ""


@dataclass
class SyncReport:
    env: str
    diffs: list[SecretDiff] = field(default_factory=list)

    @property
    def mismatches(self) -> list[SecretDiff]:
        return [d for d in self.diffs if d.status != "match"]

    def print_report(self) -> None:
        matches = sum(1 for d in self.diffs if d.status == "match")
        aws_only = [d for d in self.diffs if d.status == "aws_only"]
        gcp_only = [d for d in self.diffs if d.status == "gcp_only"]
        value_mismatch = [d for d in self.diffs if d.status == "value_mismatch"]
        errors = [d for d in self.diffs if d.status == "error"]

        print(f"\n=== Secret Sync Report (env={self.env}) ===")
        print(f"  {matches} secrets match")
        print(f"  {len(aws_only)} secrets in AWS only")
        print(f"  {len(gcp_only)} secrets in GCP only")
        print(f"  {len(value_mismatch)} secrets with value mismatch")
        print(f"  {len(errors)} errors")

        if aws_only:
            print("\n[AWS only — not in GCP]")
            for d in aws_only:
                print(f"  {d.name}")

        if gcp_only:
            print("\n[GCP only — not in AWS]")
            for d in gcp_only:
                print(f"  {d.name}")

        if value_mismatch:
            print("\n[Value mismatch — exists in both but differ]")
            for d in value_mismatch:
                print(f"  {d.name}")

        if errors:
            print("\n[Errors]")
            for d in errors:
                print(f"  {d.name}: {d.error}")


def _aws_secret_path(env: str, name: str) -> str:
    """Build AWS Secrets Manager path: unified-trading/{env}/{name}"""
    return f"unified-trading/{env}/{name}"


def _make_aws_client(env: str, region: str) -> object:
    from unified_cloud_interface.providers.aws import AWSSecretClient  # type: ignore[attr-defined]

    return AWSSecretClient(region=region)


def _make_gcp_client(project_id: str) -> object:
    from unified_cloud_interface.providers.gcp import GCPSecretClient  # type: ignore[attr-defined]

    return GCPSecretClient(project_id=project_id)


def _list_aws_secrets(aws_client: object, env: str) -> dict[str, str]:
    """Return canonical_name -> full_path mapping for all secrets under unified-trading/{env}/"""
    prefix = f"unified-trading/{env}/"
    # list_secrets returns full names (paths)
    full_names: list[str] = aws_client.list_secrets(prefix=prefix)  # type: ignore[attr-defined]
    # strip the prefix to get canonical name
    result: dict[str, str] = {}
    for full in full_names:
        # e.g. "unified-trading/prod/binance-read-api-key" → "binance-read-api-key"
        canonical = full[len(prefix) :] if full.startswith(prefix) else full
        result[canonical] = full
    return result


def _list_gcp_secrets(gcp_client: object, env: str) -> dict[str, str]:
    """Return canonical_name -> gcp_secret_id mapping.

    GCP doesn't use path prefixes — secrets are flat IDs. Convention used
    by deployment-service terraform: just the canonical name (no env prefix for static secrets,
    or "{name}-{env}" for env-scoped). We list ALL and filter by known naming patterns.
    """
    all_names: list[str] = gcp_client.list_secrets()  # type: ignore[attr-defined]
    result: dict[str, str] = {}
    for name in all_names:
        result[name] = name
    return result


def diff_secrets(
    aws_client: object,
    gcp_client: object,
    env: str,
    names: list[str] | None = None,
) -> list[SecretDiff]:
    """Compare secrets between AWS and GCP. If names given, only check those."""
    diffs: list[SecretDiff] = []

    aws_map = _list_aws_secrets(aws_client, env)
    gcp_map = _list_gcp_secrets(gcp_client, env)

    all_canonical = sorted(set(aws_map) | set(gcp_map))
    if names:
        all_canonical = [n for n in all_canonical if n in names]

    for canonical in all_canonical:
        aws_path = aws_map.get(canonical)
        gcp_id = gcp_map.get(canonical)

        try:
            aws_val: str | None = None
            gcp_val: str | None = None

            if aws_path:
                aws_val = aws_client.get_secret(aws_path)  # type: ignore[attr-defined]
            if gcp_id:
                gcp_val = gcp_client.get_secret(gcp_id)  # type: ignore[attr-defined]

            if aws_val is not None and gcp_val is not None:
                status: SyncStatus = "match" if aws_val == gcp_val else "value_mismatch"
            elif aws_val is not None:
                status = "aws_only"
            elif gcp_val is not None:
                status = "gcp_only"
            else:
                # Both listed but both returned None — treat as missing on both sides
                status = "error"

            diffs.append(
                SecretDiff(
                    name=canonical,
                    status=status,
                    aws_value=aws_val,
                    gcp_value=gcp_val,
                )
            )
        except Exception as e:  # noqa: BLE001
            diffs.append(SecretDiff(name=canonical, status="error", error=str(e)))

    return diffs


def sync_secrets(
    aws_client: object,
    gcp_client: object,
    env: str,
    source: Literal["aws", "gcp"],
    dest: Literal["aws", "gcp"],
    diffs: list[SecretDiff],
) -> int:
    """Write missing/different secrets from source → dest. Returns count of secrets written."""
    to_sync = [d for d in diffs if d.status in ("aws_only", "gcp_only", "value_mismatch")]
    written = 0

    for diff in to_sync:
        # Determine which side has the value to copy
        if source == "gcp" and diff.gcp_value is not None:
            value = diff.gcp_value
        elif source == "aws" and diff.aws_value is not None:
            value = diff.aws_value
        else:
            # Secret exists only on the other side — skip (would be a delete, not a sync)
            logger.warning(f"Skipping {diff.name}: not present in source={source}")
            continue

        try:
            if dest == "aws":
                aws_path = _aws_secret_path(env, diff.name)
                # Try update first, then create
                if not aws_client.update_secret(aws_path, value):  # type: ignore[attr-defined]
                    aws_client.create_secret(aws_path, value)  # type: ignore[attr-defined]
                print(f"  [aws] {aws_path}")
            else:  # dest == "gcp"
                if not gcp_client.update_secret(diff.name, value):  # type: ignore[attr-defined]
                    gcp_client.create_secret(diff.name, value)  # type: ignore[attr-defined]
                print(f"   {diff.name}")
            written += 1
        except Exception as e:  # noqa: BLE001
            logger.error(f"Failed to sync {diff.name}: {e}")

    return written


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Diff and sync secrets between AWS Secrets Manager and GCP Secret Manager"
    )
    parser.add_argument(
        "--env", required=True, choices=["dev", "staging", "prod"], help="Environment to operate on"
    )
    parser.add_argument("--gcp-project", required=True, help="GCP project ID")
    parser.add_argument(
        "--aws-region",
        default=os.environ.get("AWS_REGION", "ap-northeast-1"),
        help="AWS region (default: ap-northeast-1)",
    )
    parser.add_argument(
        "--names", default="", help="Comma-separated list of canonical secret names to check/sync"
    )
    parser.add_argument(
        "--sync", action="store_true", help="Sync differences (write source values to dest)"
    )
    parser.add_argument(
        "--source",
        choices=["aws", "gcp"],
        default="aws",
        help="Source of truth for --sync (default: aws)",
    )
    parser.add_argument(
        "--dest",
        choices=["aws", "gcp"],
        default="gcp",
        help="Destination for --sync (default: gcp)",
    )
    parser.add_argument(
        "--check", action="store_true", help="Exit 1 if any differences found (CI gate mode)"
    )
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(levelname)s %(message)s",
    )

    names = [n.strip() for n in args.names.split(",") if n.strip()] if args.names else None

    print(
        f"Connecting to AWS Secrets Manager ({args.aws_region}) and GCP Secret Manager ({args.gcp_project})..."
    )
    try:
        aws_client = _make_aws_client(args.env, args.aws_region)
        gcp_client = _make_gcp_client(args.gcp_project)
    except Exception as e:
        print(f"ERROR: Failed to initialise secret clients: {e}", file=sys.stderr)
        return 1

    print("Diffing secrets...")
    diffs = diff_secrets(aws_client, gcp_client, args.env, names)
    report = SyncReport(env=args.env, diffs=diffs)
    report.print_report()

    if args.sync:
        to_sync = [d for d in diffs if d.status in ("aws_only", "gcp_only", "value_mismatch")]
        if not to_sync:
            print("\nNothing to sync.")
        else:
            print(f"\nSyncing {len(to_sync)} secrets ({args.source} → {args.dest})...")
            written = sync_secrets(aws_client, gcp_client, args.env, args.source, args.dest, diffs)
            print(f"Done: {written}/{len(to_sync)} secrets written.")

    if args.check and report.mismatches:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
