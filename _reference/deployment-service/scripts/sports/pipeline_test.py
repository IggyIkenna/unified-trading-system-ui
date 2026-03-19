#!/usr/bin/env python3
"""
Feature pipeline test script for sports betting features.

Reads fixture and feature data from GCS Parquet for a given league_id
and season, then validates that the feature pipeline produced the
expected outputs.

The original script delegated to footballbets.features.pipeline_test.main().
This version operates directly against GCS Parquet data using the
unified-domain-client patterns.

Usage:
    python scripts/sports/pipeline_test.py --league-id 39 --season 2023
    python scripts/sports/pipeline_test.py --league-id 39 --season 2023 --fixture-id 12345
    python scripts/sports/pipeline_test.py --league-id 39 --season 2023 --limit 5
    python scripts/sports/pipeline_test.py --league-id 39 --season 2023 --all-fixtures
"""

from __future__ import annotations

import argparse
import logging

from unified_cloud_interface import StorageClient, get_storage_client
from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# GCS data access helpers
# ---------------------------------------------------------------------------


def _list_feature_blobs(
    client: StorageClient,
    bucket_name: str,
    league_id: int,
    season: int,
    prefix: str = "sports/features",
) -> list[str]:
    """List Parquet blobs for a league/season under the features prefix."""
    full_prefix = f"{prefix}/league_id={league_id}/season={season}/"
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=full_prefix)
    return [blob.name for blob in blobs if blob.name.endswith(".parquet")]


def _list_fixture_blobs(
    client: StorageClient,
    bucket_name: str,
    league_id: int,
    season: int,
    prefix: str = "sports/fixtures",
) -> list[str]:
    """List Parquet blobs for fixtures of a league/season."""
    full_prefix = f"{prefix}/league_id={league_id}/season={season}/"
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=full_prefix)
    return [blob.name for blob in blobs if blob.name.endswith(".parquet")]


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------


def validate_pipeline(
    client: StorageClient,
    bucket_name: str,
    league_id: int,
    season: int,
    fixture_id: int | None = None,
    limit: int = 0,
    all_fixtures: bool = False,
) -> bool:
    """Validate that feature pipeline outputs exist for the given parameters.

    Returns True if all checks pass.
    """
    logger.info("=" * 80)
    logger.info("FEATURE PIPELINE VALIDATION")
    logger.info("  League ID: %d", league_id)
    logger.info("  Season:    %d", season)
    if fixture_id is not None:
        logger.info("  Fixture:   %d", fixture_id)
    logger.info("=" * 80)

    # Check fixtures exist
    fixture_blobs = _list_fixture_blobs(client, bucket_name, league_id, season)
    logger.info("")
    logger.info("Fixtures found: %d Parquet files", len(fixture_blobs))

    if not fixture_blobs:
        logger.error("No fixture data found for league=%d season=%d", league_id, season)
        return False

    # Check features exist
    feature_blobs = _list_feature_blobs(client, bucket_name, league_id, season)
    logger.info("Features found: %d Parquet files", len(feature_blobs))

    if not feature_blobs:
        logger.error("No feature data found for league=%d season=%d", league_id, season)
        return False

    # Report coverage
    logger.info("")
    logger.info("Pipeline coverage:")
    logger.info("  Fixture files:  %d", len(fixture_blobs))
    logger.info("  Feature files:  %d", len(feature_blobs))

    if fixture_id is not None:
        matching = [b for b in feature_blobs if f"fixture_id={fixture_id}" in b]
        logger.info("  Fixture %d features: %d files", fixture_id, len(matching))
        if not matching:
            logger.warning("No feature files found for fixture_id=%d", fixture_id)

    if limit > 0:
        logger.info("  Showing first %d fixture blobs:", limit)
        for blob_name in fixture_blobs[:limit]:
            logger.info("    %s", blob_name)

    if all_fixtures:
        logger.info("  All fixture blobs:")
        for blob_name in fixture_blobs:
            logger.info("    %s", blob_name)

    logger.info("")
    logger.info("=" * 80)
    logger.info("VALIDATION COMPLETE")
    logger.info("=" * 80)
    return True


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """Run the feature pipeline test/validation."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Test sports feature pipeline outputs")
    parser.add_argument("--league-id", type=int, required=True, help="API-Football league ID")
    parser.add_argument("--season", type=int, required=True, help="Season year (e.g. 2023)")
    parser.add_argument("--fixture-id", type=int, default=None, help="Specific fixture ID to check")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of fixtures to display")
    parser.add_argument("--all-fixtures", action="store_true", help="Show all fixture blobs")
    parser.add_argument("--bucket", type=str, default="", help="GCS bucket name (overrides config)")
    args = parser.parse_args()

    config = UnifiedCloudConfig()
    bucket_name = args.bucket or f"sports-data-{config.gcp_project_id}"

    logger.info("Connecting to GCS project=%s bucket=%s", config.gcp_project_id, bucket_name)
    client = get_storage_client(project_id=config.gcp_project_id)

    success = validate_pipeline(
        client=client,
        bucket_name=bucket_name,
        league_id=args.league_id,
        season=args.season,
        fixture_id=args.fixture_id,
        limit=args.limit,
        all_fixtures=args.all_fixtures,
    )

    if not success:
        logger.error("Pipeline validation FAILED")
        raise SystemExit(1)

    logger.info("Pipeline validation PASSED")


if __name__ == "__main__":
    main()
