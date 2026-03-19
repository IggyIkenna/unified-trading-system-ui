#!/usr/bin/env python3
"""
One-off script to terminate orphan VMs (GCS has SUCCESS/FAILED but VM still RUNNING).

Run from deployment-service with .env.local loaded:
  cd deployment-service
  source .env.local 2>/dev/null || true
  python scripts/cleanup-orphan-vms.py

Options:
  --service NAME    Only check deployments for this service (e.g. market-tick-data-handler)
  --dry-run         Show what would be terminated without deleting
"""

import argparse
import json
import logging
import os
import sys

# Add repo root for imports
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from deployment_service.config.config_validator import ConfigurationError, ValidationUtils

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    parser = argparse.ArgumentParser(description="Terminate orphan VMs")
    parser.add_argument("--service", help="Only this service (e.g. market-tick-data-handler)")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually terminate")
    parser.add_argument("--limit", type=int, default=0, help="Max deployments to check (0=all)")
    args = parser.parse_args()

    from api.settings import (
        DEPLOYMENT_ENV,
        GCP_PROJECT_ID,
        STATE_BUCKET,
    )
    from unified_cloud_interface import get_compute_engine_client, get_storage_client

    base_prefix = f"deployments.{DEPLOYMENT_ENV}/"
    from deployment.orchestrator import DeploymentOrchestrator

    # List deployment state files (narrow prefix when --service given)
    list_prefix = f"{base_prefix}{args.service}-" if args.service else base_prefix
    client = get_storage_client(project_id=GCP_PROJECT_ID)
    bucket = client.bucket(STATE_BUCKET)
    deployment_ids = []
    for blob in bucket.list_blobs(prefix=list_prefix):
        if blob.name.endswith("state.json"):
            parts = blob.name.split("/")
            if len(parts) >= 2:
                deployment_ids.append(parts[1])
        if args.limit and len(deployment_ids) >= args.limit:
            break

    if not deployment_ids:
        logger.info("No deployments found")
        return 0

    prefix = base_prefix
    if args.service:
        logger.info(
            "Checking %s %s deployment(s) for orphan VMs...", len(deployment_ids), args.service
        )
    else:
        logger.info("Checking %s deployment(s) for orphan VMs...", len(deployment_ids))
    terminated = 0

    ce_client = get_compute_engine_client(project_id=GCP_PROJECT_ID)

    for deployment_id in deployment_ids:
        try:
            state_blob = bucket.blob(f"{prefix}{deployment_id}/state.json")
            state = json.loads(state_blob.download_as_text())
            # Skip non-running
            if state.get("status") not in ("pending", "running"):
                continue
            if args.service and state.get("service") != args.service:
                continue
            config = state.get("config") or {}
            shards = state.get("shards", [])
            compute_type = state.get("compute_type", "vm")
            service_name = state.get("service", "")

            if compute_type != "vm" or not service_name:
                continue

            # Build shard_statuses from GCS
            status_prefix = f"{prefix}{deployment_id}/"
            status_blobs = [
                b
                for b in bucket.list_blobs(prefix=status_prefix)
                if "/status" in b.name and not b.name.endswith("/state.json")
            ]
            shard_statuses = {}
            for b in status_blobs:
                parts = b.name.split("/")
                if len(parts) < 3:
                    continue
                shard_id = parts[2]
                try:
                    content = b.download_as_text().strip()
                    status_part = content.split(":")[0]
                    if status_part == "SUCCESS":
                        shard_statuses[shard_id] = "succeeded"
                    elif status_part in ("FAILED", "ZOMBIE"):
                        shard_statuses[shard_id] = "failed"
                except (OSError, ValueError, RuntimeError) as e:
                    logger.warning("Unexpected error during operation: %s", e, exc_info=True)
                    pass

            # Get vm_map
            vm_map = {}
            try:
                instances = ce_client.aggregated_list_instances(
                    GCP_PROJECT_ID, f"name:{service_name}-*"
                )
                for inst in instances:
                    vm_map[inst["name"]] = inst["status"]
            except (OSError, ValueError, RuntimeError) as e:
                logger.warning("  %s: aggregatedList failed: %s", deployment_id, e)
                continue

            # Find and terminate orphans
            for shard in shards:
                shard_id = shard.get("shard_id")
                job_id = shard.get("job_id")
                if not job_id or not shard_id:
                    continue
                st = shard_statuses.get(shard_id)
                if not st or st not in ("succeeded", "failed"):
                    continue
                if vm_map.get(job_id) == "RUNNING":
                    try:
                        orch = DeploymentOrchestrator(
                            project_id=GCP_PROJECT_ID,
                            region=config.get("region") or "asia-northeast1",
                            service_account_email=config.get("service_account_email", ""),
                            state_bucket=STATE_BUCKET,
                            state_prefix=f"deployments.{DEPLOYMENT_ENV}",
                        )
                        try:
                            job_name = ValidationUtils.get_required(
                                config, "job_name", "VM backend for orphan cleanup"
                            )
                        except ConfigurationError as e:
                            logger.error(
                                "Configuration error for deployment %s: %s", deployment_id, e
                            )
                            continue

                        backend = orch.get_backend(
                            "vm",
                            job_name=job_name,
                            zone=config.get("zone"),
                        )
                        if backend and hasattr(backend, "cancel_job"):
                            if args.dry_run:
                                logger.info(
                                    "  [DRY-RUN] Would terminate %s (%s/%s, GCS=%s)",
                                    job_id,
                                    deployment_id,
                                    shard_id,
                                    st,
                                )
                                terminated += 1
                            else:
                                backend.cancel_job(job_id)
                                terminated += 1
                                logger.info(
                                    "  Terminated %s (%s/%s, GCS=%s)",
                                    job_id,
                                    deployment_id,
                                    shard_id,
                                    st,
                                )
                    except (OSError, ValueError, RuntimeError) as e:
                        logger.warning("  Failed to terminate %s: %s", job_id, e)

        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("  Error processing %s: %s", deployment_id, e)

    logger.info("Done. Terminated %s orphan VM(s).", terminated)
    return 0


if __name__ == "__main__":
    sys.exit(main())
