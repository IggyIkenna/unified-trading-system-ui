"""
sync-configs.py — Diff and optionally sync config files between GCS and S3.

"Config" here means lightweight deployment-time config objects uploaded to cloud storage —
NOT market tick data (which is large and stays in AWS). Think: runtime-topology.yaml,
instrument-config.json, strategy-params, etc.

Source of truth is configurable: GCS (default for GCP-originated config) or S3.
Uses UCI StorageClient for both sides — no direct SDK calls.

Usage:
    # Report differences between GCS and S3 config buckets
    python sync-configs.py --env dev \\
        --gcs-bucket features-calendar-<project-id> \\
        --s3-bucket unified-trading-features-calendar-<account-id> \\
        --prefix configs/

    # Sync: write GCS objects missing/different in S3
    python sync-configs.py --env dev \\
        --gcs-bucket features-calendar-<project-id> \\
        --s3-bucket unified-trading-features-calendar-<account-id> \\
        --prefix configs/ \\
        --sync --source gcs --dest s3

    # Sync specific files
    python sync-configs.py --env dev \\
        --gcs-bucket features-calendar-<project-id> \\
        --s3-bucket unified-trading-features-calendar-<account-id> \\
        --sync --source gcs --dest s3 \\
        --files configs/runtime-topology.yaml,configs/strategy-params.json

Exit codes:
    0 — no differences (or sync completed)
    1 — differences found (in report mode) or sync error
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import os
import sys
from dataclasses import dataclass, field
from typing import Literal

logger = logging.getLogger(__name__)

DiffStatus = Literal["match", "gcs_only", "s3_only", "content_mismatch", "error"]


@dataclass
class BlobDiff:
    path: str
    status: DiffStatus
    gcs_md5: str | None = None
    s3_md5: str | None = None
    size_bytes: int = 0
    error: str = ""


@dataclass
class ConfigReport:
    env: str
    gcs_bucket: str
    s3_bucket: str
    diffs: list[BlobDiff] = field(default_factory=list)

    @property
    def mismatches(self) -> list[BlobDiff]:
        return [d for d in self.diffs if d.status != "match"]

    def print_report(self) -> None:
        matches = sum(1 for d in self.diffs if d.status == "match")
        gcs_only = [d for d in self.diffs if d.status == "gcs_only"]
        s3_only = [d for d in self.diffs if d.status == "s3_only"]
        mismatch = [d for d in self.diffs if d.status == "content_mismatch"]
        errors = [d for d in self.diffs if d.status == "error"]

        print(f"\n=== Config Sync Report (env={self.env}) ===")
        print(f"  GCS: gs://{self.gcs_bucket}")
        print(f"  S3:  s3://{self.s3_bucket}")
        print(f"  {matches} files match")
        print(f"  {len(gcs_only)} files in GCS only")
        print(f"  {len(s3_only)} files in S3 only")
        print(f"  {len(mismatch)} files with content mismatch")
        print(f"  {len(errors)} errors")

        if gcs_only:
            print("\n[GCS only]")
            for d in gcs_only:
                print(f"  {d.path}")

        if s3_only:
            print("\n[S3 only]")
            for d in s3_only:
                print(f"  {d.path}")

        if mismatch:
            print("\n[Content mismatch]")
            for d in mismatch:
                print(f"  {d.path}  (gcs={d.gcs_md5 or '?'[:8]}  s3={d.s3_md5 or '?'[:8]})")

        if errors:
            print("\n[Errors]")
            for d in errors:
                print(f"  {d.path}: {d.error}")


def _md5(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()  # noqa: S324


def _list_blobs(storage_client: object, bucket: str, prefix: str) -> set[str]:
    """Return set of blob paths under prefix."""
    try:
        blobs: list[str] = storage_client.list_blobs(bucket, prefix=prefix)  # type: ignore[attr-defined]
        return set(blobs)
    except Exception as e:  # noqa: BLE001
        logger.error(f"Failed to list {bucket}/{prefix}: {e}")
        return set()


def diff_configs(
    gcs_client: object,
    s3_client: object,
    gcs_bucket: str,
    s3_bucket: str,
    prefix: str,
    files: list[str] | None = None,
) -> list[BlobDiff]:
    """Compare config blobs between GCS and S3 under prefix."""
    diffs: list[BlobDiff] = []

    if files:
        all_paths = set(files)
    else:
        gcs_paths = _list_blobs(gcs_client, gcs_bucket, prefix)
        s3_paths = _list_blobs(s3_client, s3_bucket, prefix)
        all_paths = gcs_paths | s3_paths

    for path in sorted(all_paths):
        try:
            gcs_data: bytes | None = None
            s3_data: bytes | None = None

            if not files or path in (files or []):
                try:
                    gcs_data = gcs_client.download_bytes(gcs_bucket, path)  # type: ignore[attr-defined]
                except (OSError, ValueError):  # noqa: BLE001
                    gcs_data = None
                try:
                    s3_data = s3_client.download_bytes(s3_bucket, path)  # type: ignore[attr-defined]
                except (OSError, ValueError):  # noqa: BLE001
                    s3_data = None

            if gcs_data is not None and s3_data is not None:
                gcs_md5 = _md5(gcs_data)
                s3_md5 = _md5(s3_data)
                status: DiffStatus = "match" if gcs_md5 == s3_md5 else "content_mismatch"
                diffs.append(
                    BlobDiff(
                        path=path,
                        status=status,
                        gcs_md5=gcs_md5,
                        s3_md5=s3_md5,
                        size_bytes=len(gcs_data),
                    )
                )
            elif gcs_data is not None:
                diffs.append(
                    BlobDiff(
                        path=path,
                        status="gcs_only",
                        gcs_md5=_md5(gcs_data),
                        size_bytes=len(gcs_data),
                    )
                )
            elif s3_data is not None:
                diffs.append(
                    BlobDiff(
                        path=path, status="s3_only", s3_md5=_md5(s3_data), size_bytes=len(s3_data)
                    )
                )
        except Exception as e:  # noqa: BLE001
            diffs.append(BlobDiff(path=path, status="error", error=str(e)))

    return diffs


def sync_configs(
    gcs_client: object,
    s3_client: object,
    gcs_bucket: str,
    s3_bucket: str,
    source: Literal["gcs", "s3"],
    dest: Literal["gcs", "s3"],
    diffs: list[BlobDiff],
) -> int:
    """Copy missing/different files from source to dest. Returns count written."""
    to_sync = [d for d in diffs if d.status in ("gcs_only", "s3_only", "content_mismatch")]
    written = 0

    for diff in to_sync:
        # Only sync if source has the file
        if source == "gcs" and diff.gcs_md5 is None:
            logger.warning(f"Skipping {diff.path}: not in GCS (source)")
            continue
        if source == "s3" and diff.s3_md5 is None:
            logger.warning(f"Skipping {diff.path}: not in S3 (source)")
            continue

        try:
            if source == "gcs":
                data = gcs_client.download_bytes(gcs_bucket, diff.path)  # type: ignore[attr-defined]
                dest_client = s3_client
                dest_bucket = s3_bucket
                dest_label = f"s3://{s3_bucket}/{diff.path}"
            else:
                data = s3_client.download_bytes(s3_bucket, diff.path)  # type: ignore[attr-defined]
                dest_client = gcs_client
                dest_bucket = gcs_bucket
                dest_label = f"gs://{gcs_bucket}/{diff.path}"

            dest_client.upload_bytes(dest_bucket, diff.path, data)  # type: ignore[attr-defined]
            print(f"  → {dest_label} ({len(data)} bytes)")
            written += 1
        except Exception as e:  # noqa: BLE001
            logger.error(f"Failed to sync {diff.path}: {e}")

    return written


def main() -> int:
    parser = argparse.ArgumentParser(description="Diff and sync config files between GCS and S3")
    parser.add_argument("--env", required=True, choices=["dev", "staging", "prod"])
    parser.add_argument("--gcs-bucket", required=True, help="GCS bucket name")
    parser.add_argument("--s3-bucket", required=True, help="S3 bucket name")
    parser.add_argument(
        "--prefix", default="configs/", help="Blob prefix/path to compare (default: configs/)"
    )
    parser.add_argument(
        "--files", default="", help="Comma-separated specific file paths to compare"
    )
    parser.add_argument(
        "--sync", action="store_true", help="Write source files to dest for any differences"
    )
    parser.add_argument(
        "--source",
        choices=["gcs", "s3"],
        default="gcs",
        help="Source of truth for --sync (default: gcs)",
    )
    parser.add_argument(
        "--dest", choices=["gcs", "s3"], default="s3", help="Destination for --sync (default: s3)"
    )
    parser.add_argument(
        "--gcp-project",
        default=os.environ.get("GCP_PROJECT_ID", ""),
        help="GCP project ID (default: GCP_PROJECT_ID env var)",
    )
    parser.add_argument("--aws-region", default=os.environ.get("AWS_REGION", "ap-northeast-1"))
    parser.add_argument("--check", action="store_true", help="Exit 1 if any differences found")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(levelname)s %(message)s",
    )

    files = [f.strip() for f in args.files.split(",") if f.strip()] if args.files else None

    print("Connecting to GCS and S3 storage clients...")
    try:
        from unified_cloud_interface.providers.aws import (
            AWSStorageClient,  # type: ignore[attr-defined]
        )
        from unified_cloud_interface.providers.gcp import (
            GCPStorageClient,  # type: ignore[attr-defined]
        )

        gcs_client = GCPStorageClient(project_id=args.gcp_project or None)
        s3_client = AWSStorageClient(region=args.aws_region)
    except Exception as e:
        print(f"ERROR: Failed to initialise storage clients: {e}", file=sys.stderr)
        return 1

    print(f"Diffing configs (prefix={args.prefix!r})...")
    diffs = diff_configs(gcs_client, s3_client, args.gcs_bucket, args.s3_bucket, args.prefix, files)
    report = ConfigReport(
        env=args.env, gcs_bucket=args.gcs_bucket, s3_bucket=args.s3_bucket, diffs=diffs
    )
    report.print_report()

    if args.sync:
        to_sync = [d for d in diffs if d.status in ("gcs_only", "s3_only", "content_mismatch")]
        if not to_sync:
            print("\nNothing to sync.")
        else:
            print(f"\nSyncing {len(to_sync)} files ({args.source} → {args.dest})...")
            written = sync_configs(
                gcs_client,
                s3_client,
                args.gcs_bucket,
                args.s3_bucket,
                args.source,
                args.dest,
                diffs,
            )
            print(f"Done: {written}/{len(to_sync)} files written.")

    if args.check and report.mismatches:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
