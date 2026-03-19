#!/usr/bin/env python3
"""
Verify The Graph API key and round-robin rotation.

Usage:
  # Dry-run (no deps, shows key mapping):
  python scripts/verify_graph_api_key.py --dry-run
  SHARD_INDEX=1 python scripts/verify_graph_api_key.py --dry-run

  # Full verification (run from instruments-service or market-tick-data-handler):
  cd instruments-service && uv run python ../deployment-service/scripts/verify_graph_api_key.py

Secrets: thegraph-api-key, thegraph-api-key-2 ... thegraph-api-key-9 (9 keys total).
Round-robin: key_number = (SHARD_INDEX % 9) + 1
SHARD_INDEX is injected by deployment-v2 orchestrator when running sharded jobs.
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import logging

from _common import get_graph_secret_name, get_project_id, get_shard_index
from unified_trading_library import TheGraphBaseClient, clear_thegraph_api_key_cache

logger = logging.getLogger(__name__)

_NUM_KEYS = 9  # thegraph-api-key, thegraph-api-key-2 ... thegraph-api-key-9


def main() -> int:
    logging.basicConfig(level=logging.INFO)
    parser = argparse.ArgumentParser(description="Verify The Graph API key and round-robin")
    parser.add_argument("--dry-run", action="store_true", help="Only show which key would be used")
    parser.add_argument("--project-id", default=None, help="GCP project ID (default: from env)")
    args = parser.parse_args()

    shard_index = get_shard_index()
    project_id = args.project_id or get_project_id()
    secret_env = get_graph_secret_name()

    logger.info("=" * 60)
    logger.info("The Graph API Key Verification")
    logger.info("=" * 60)
    logger.info(f"SHARD_INDEX: {shard_index}")
    logger.info(f"GCP_PROJECT_ID: {project_id}")
    logger.info(f"GRAPH_SECRET_NAME / THEGRAPH_SECRET_NAME: {secret_env}")
    logger.info()

    # Round-robin formula (matches UCS TheGraphBaseClient)
    key_number = (shard_index % _NUM_KEYS) + 1
    secret_name = "thegraph-api-key" if key_number == 1 else f"thegraph-api-key-{key_number}"
    logger.info(f"Round-robin: key_number={key_number} → secret={secret_name}")
    logger.info("(9 keys total: thegraph-api-key, thegraph-api-key-2 ... thegraph-api-key-9)")
    logger.info()

    if args.dry_run:
        logger.info("Dry-run: skipping actual API key fetch and query.")
        return 0

    # Full verification: run from instruments-service or market-tick-data-handler
    try:
        clear_thegraph_api_key_cache()
        client = TheGraphBaseClient(project_id=project_id)
        api_key = client.api_key
    except (OSError, ValueError, RuntimeError) as e:
        logger.info(f"❌ Failed to load API key: {e}")
        logger.info("   Ensure GCP auth (gcloud auth application-default login) and secret exists.")
        return 1

    if not api_key:
        logger.info("❌ No API key found. Set THEGRAPH_API_KEY in env or create secret in GCP.")
        return 1

    logger.info(f"✅ API key {key_number} loaded successfully")

    # Minimal GraphQL query to verify key works
    subgraph_id = "Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g"  # AAVE V3
    url = f"https://gateway.thegraph.com/api/{api_key}/subgraphs/id/{subgraph_id}"
    payload = {"query": "{ _meta { block { number } } }"}

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode())
            if "data" in body:
                logger.info("✅ GraphQL query succeeded (key is valid)")
            else:
                logger.info(f"⚠️ Unexpected response: {body}")
    except urllib.error.HTTPError as e:
        logger.info(f"⚠️ Query failed {e.code}: {e.read().decode()[:200]}")
    except (OSError, ValueError, RuntimeError) as e:
        logger.info(f"⚠️ Query failed: {e}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
