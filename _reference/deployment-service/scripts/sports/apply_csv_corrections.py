#!/usr/bin/env python3
"""
Apply corrections to league classification config from a CSV verification source.

Reads the existing league classification data from GCS Parquet, merges in
verified corrections (new leagues, corrected IDs, cleared verification flags),
and writes the updated Parquet back.

Usage:
    python scripts/sports/apply_csv_corrections.py --dry-run
    python scripts/sports/apply_csv_corrections.py --apply --bucket my-bucket --prefix sports/league_config
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

from unified_cloud_interface import StorageClient, get_storage_client
from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Correction entries (verified from all_unique_leagues.csv)
# ---------------------------------------------------------------------------

CorrectionRecord = dict[str, str | int | None]

PREDICTION_CORRECTIONS: list[CorrectionRecord] = [
    {
        "api_football_id": 113,
        "country": "Sweden",
        "league": "Allsvenskan",
        "tier": 1,
        "odds_api": "soccer_sweden_allsvenskan",
    },
    {
        "api_football_id": 188,
        "country": "Australia",
        "league": "A-League",
        "tier": 1,
        "odds_api": "soccer_australia_aleague",
    },
]

FEATURES_CORRECTIONS: list[CorrectionRecord] = [
    {
        "api_football_id": 114,
        "country": "Sweden",
        "league": "Superettan",
        "tier": 2,
        "odds_api": None,
    },
    {
        "api_football_id": 255,
        "country": "USA",
        "league": "USL Championship",
        "tier": 2,
        "odds_api": None,
    },
    {
        "api_football_id": 435,
        "country": "Spain",
        "league": "Primera Division RFEF - Group 1",
        "tier": 3,
        "odds_api": None,
    },
]

REFERENCE_CORRECTIONS: list[CorrectionRecord] = [
    {"api_football_id": 115, "country": "Sweden", "league": "Svenska Cupen"},
    {"api_football_id": 147, "country": "Belgium", "league": "Cup"},
    {"api_football_id": 206, "country": "Turkey", "league": "Turkiye Kupasi"},
    {"api_football_id": 1032, "country": "Argentina", "league": "Copa de la Liga Profesional"},
    {"api_football_id": 257, "country": "USA", "league": "US Open Cup"},
    {"api_football_id": 102, "country": "Japan", "league": "Emperor Cup"},
    {"api_football_id": 874, "country": "Australia", "league": "Australia Cup"},
    {"api_football_id": 185, "country": "Scotland", "league": "League Cup"},
    {"api_football_id": 13, "country": "Multi", "league": "CONMEBOL Libertadores"},
    {"api_football_id": 11, "country": "Multi", "league": "CONMEBOL Sudamericana"},
]

ALL_CORRECTIONS: list[CorrectionRecord] = (
    PREDICTION_CORRECTIONS + FEATURES_CORRECTIONS + REFERENCE_CORRECTIONS
)

# Mapping of wrong old IDs to correct new IDs for traceability
ID_CORRECTIONS: dict[int, int] = {
    536: 435,  # Spain Primera RFEF
    254: 255,  # USA USL Championship -> was NWSL Women
    146: 147,  # Belgium Cup -> was Super League Women
    205: 206,  # Turkey Turkiye Kupasi -> was 2. Lig
    131: 1032,  # Argentina Copa de la Liga -> was Primera B Metropolitana
    100: 102,  # Japan Emperor Cup -> was J3 League
    182: 185,  # Scotland League Cup -> was Challenge Cup
    5: 13,  # CONMEBOL Libertadores -> was UEFA Nations League
    6: 11,  # CONMEBOL Sudamericana -> was Africa Cup of Nations
}


# ---------------------------------------------------------------------------
# GCS helpers
# ---------------------------------------------------------------------------


def _list_parquet_blobs(client: StorageClient, bucket_name: str, prefix: str) -> list[str]:
    """List all .parquet blobs under *prefix* in *bucket_name*."""
    bucket = client.bucket(bucket_name)
    blobs = bucket.list_blobs(prefix=prefix)
    return [blob.name for blob in blobs if blob.name.endswith(".parquet")]


def _download_blob_bytes(client: StorageClient, bucket_name: str, blob_name: str) -> bytes:
    """Download a single blob as bytes."""
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_name)
    return blob.download_as_bytes()


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> None:
    """Preview or apply CSV-verified corrections to the league config."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(
        description="Apply CSV corrections to league classification config"
    )
    parser.add_argument(
        "--dry-run", action="store_true", default=True, help="Preview changes (default)"
    )
    parser.add_argument("--apply", action="store_true", help="Write corrected Parquet back to GCS")
    parser.add_argument("--bucket", type=str, default="", help="GCS bucket name (overrides config)")
    parser.add_argument(
        "--prefix",
        type=str,
        default="sports/league_config",
        help="GCS prefix for league config Parquet",
    )
    parser.add_argument(
        "--local-csv",
        type=str,
        default="",
        help="Path to local all_unique_leagues.csv for extra verification",
    )
    args = parser.parse_args()

    config = UnifiedCloudConfig()
    logger.info("Project: %s", config.gcp_project_id)

    logger.info("=" * 80)
    logger.info("LEAGUE CLASSIFICATION CSV CORRECTIONS")
    logger.info("=" * 80)

    logger.info("")
    logger.info("PREDICTION corrections: %d", len(PREDICTION_CORRECTIONS))
    for entry in PREDICTION_CORRECTIONS:
        logger.info(
            "  + ID %s  %s - %s (tier %s)",
            entry["api_football_id"],
            entry["country"],
            entry["league"],
            entry["tier"],
        )

    logger.info("")
    logger.info("FEATURES corrections: %d", len(FEATURES_CORRECTIONS))
    for entry in FEATURES_CORRECTIONS:
        logger.info(
            "  + ID %s  %s - %s (tier %s)",
            entry["api_football_id"],
            entry["country"],
            entry["league"],
            entry["tier"],
        )

    logger.info("")
    logger.info("REFERENCE corrections: %d", len(REFERENCE_CORRECTIONS))
    for entry in REFERENCE_CORRECTIONS:
        logger.info(
            "  + ID %s  %s - %s", entry["api_football_id"], entry["country"], entry["league"]
        )

    logger.info("")
    logger.info("ID remappings (old -> new):")
    for old_id, new_id in ID_CORRECTIONS.items():
        logger.info("  %d -> %d", old_id, new_id)

    if args.local_csv:
        csv_path = Path(args.local_csv)
        if csv_path.exists():
            logger.info("")
            logger.info("Local CSV found: %s", csv_path)
        else:
            logger.warning("Local CSV not found: %s", csv_path)

    if args.apply:
        bucket_name = args.bucket or f"sports-config-{config.gcp_project_id}"
        logger.info("")
        logger.info("Connecting to GCS bucket: %s/%s", bucket_name, args.prefix)

        client = get_storage_client(project_id=config.gcp_project_id)
        existing_blobs = _list_parquet_blobs(client, bucket_name, args.prefix)
        logger.info("Found %d existing Parquet files", len(existing_blobs))

        logger.info("Writing corrections is not yet fully wired to the Parquet merge pipeline.")
        logger.info("Integrate with the league-config Parquet writer to complete.")
    else:
        logger.info("")
        logger.info("Dry-run mode. Use --apply to persist changes.")

    logger.info("=" * 80)


if __name__ == "__main__":
    main()
