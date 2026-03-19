#!/usr/bin/env python3
"""
ML Training Dependency Checker (operation + mode)

Pre-flight validation tool for ml-training-service 3-stage pipeline.
Checks if required data/artifacts exist before launching training jobs.
Uses --operation train_phase1|2|3 and --mode batch (per codex cli-standards).

Usage:
    # Stage 1: Check if feature data exists
    python tools/check_ml_dependencies_by_mode.py \\
        --operation train_phase1 --mode batch \\
        --instrument-id BINANCE-FUTURES:PERPETUAL:BTC-USDT \\
        --timeframe 1m \\
        --training-period 2021-03

    # Stage 2: Check if Stage 1 output exists
    python tools/check_ml_dependencies_by_mode.py \\
        --operation train_phase2 --mode batch \\
        --model-id CEFI_BTC_swing-high_LIGHTGBM_1m_V1 \\
        --training-period 2021-03

    # Stage 3: Check if Stage 2 output exists
    python tools/check_ml_dependencies_by_mode.py \\
        --operation train_phase3 --mode batch \\
        --model-id CEFI_BTC_swing-high_LIGHTGBM_1m_V1 \\
        --training-period 2021-03
"""

import argparse
import logging
import sys
from datetime import UTC, datetime, timedelta

from unified_cloud_interface import StorageClient
from unified_config_interface import UnifiedCloudConfig
from unified_trading_library import get_storage_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Training periods are quarters, named by end month (e.g., 2021-03 = Q1 2021)
QUARTERLY_PERIODS = {
    "2021-03": ("2020-01-01", "2021-03-31"),
    "2021-06": ("2020-01-01", "2021-06-30"),
    "2021-09": ("2020-01-01", "2021-09-30"),
    "2021-12": ("2020-01-01", "2021-12-31"),
    "2022-03": ("2020-01-01", "2022-03-31"),
    "2022-06": ("2020-01-01", "2022-06-30"),
    "2022-09": ("2020-01-01", "2022-09-30"),
    "2022-12": ("2020-01-01", "2022-12-31"),
    "2023-03": ("2020-01-01", "2023-03-31"),
    "2023-06": ("2020-01-01", "2023-06-30"),
    "2023-09": ("2020-01-01", "2023-09-30"),
    "2023-12": ("2020-01-01", "2023-12-31"),
    "2024-03": ("2020-01-01", "2024-03-31"),
    "2024-06": ("2020-01-01", "2024-06-30"),
    "2024-09": ("2020-01-01", "2024-09-30"),
    "2024-12": ("2020-01-01", "2024-12-31"),
    "2025-03": ("2020-01-01", "2025-03-31"),
    "2025-06": ("2020-01-01", "2025-06-30"),
    "2025-09": ("2020-01-01", "2025-09-30"),
    "2025-12": ("2020-01-01", "2025-12-31"),
}


def get_category_from_instrument_id(instrument_id: str) -> str:
    """Extract category from instrument ID."""
    if instrument_id.startswith(("BINANCE-SPOT", "BINANCE-FUTURES", "BINANCE", "COINBASE")):
        return "CEFI"
    elif instrument_id.startswith("NASDAQ") or instrument_id.startswith("NYSE"):
        return "TRADFI"
    elif instrument_id.startswith("UNISWAP") or instrument_id.startswith("AAVE"):
        return "DEFI"
    else:
        logger.warning("Unknown category for %s, defaulting to CEFI", instrument_id)
        return "CEFI"


def check_stage1_dependencies(
    storage_client: StorageClient,
    instrument_id: str,
    timeframe: str,
    training_period: str,
    project_id: str,
) -> dict[str, object]:
    """
    Check if feature data exists for Stage 1 (pre-selection).

    Stage 1 requires:
    - Feature data from features-delta-one-service
    - Data for all dates in the training period
    """
    category = get_category_from_instrument_id(instrument_id)
    category_lower = category.lower()

    if training_period not in QUARTERLY_PERIODS:
        return {
            "valid": False,
            "errors": [f"Invalid training period: {training_period}"],
            "warnings": [],
        }

    start_date_str, end_date_str = QUARTERLY_PERIODS[training_period]
    start_date = datetime.strptime(start_date_str, "%Y-%m-%d").replace(tzinfo=UTC)
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").replace(tzinfo=UTC)

    bucket_name = f"features-delta-one-{category_lower}-{project_id}"
    logger.info("Checking feature data in gs://%s/", bucket_name)

    try:
        bucket = storage_client.bucket(bucket_name)
        missing_dates = []
        total_days = 0
        found_days = 0

        current_date = start_date
        while current_date <= end_date:
            date_str = current_date.strftime("%Y-%m-%d")
            total_days += 1

            # Check if data exists for this date
            prefix = f"by_date/day={date_str}/"
            blobs = list(bucket.list_blobs(prefix=prefix, max_results=1))

            if blobs:
                found_days += 1
            else:
                missing_dates.append(date_str)

            current_date += timedelta(days=1)

        missing_pct = (len(missing_dates) / total_days * 100) if total_days > 0 else 0

        result = {
            "valid": missing_pct < 10,  # Allow up to 10% missing (weekends/holidays)
            "errors": [],
            "warnings": [],
            "stats": {
                "bucket": bucket_name,
                "total_days": total_days,
                "found_days": found_days,
                "missing_days": len(missing_dates),
                "missing_pct": missing_pct,
            },
        }

        if missing_pct >= 10:
            result["errors"].append(
                f"Too much missing data: {missing_pct:.1f}% ({len(missing_dates)}/{total_days} days)"
            )
        elif missing_dates:
            result["warnings"].append(
                f"Some missing dates: {missing_pct:.1f}% ({len(missing_dates)}/{total_days} days)"
            )

        return result

    except (OSError, ValueError, RuntimeError) as e:
        return {
            "valid": False,
            "errors": [f"Failed to check bucket {bucket_name}: {e}"],
            "warnings": [],
        }


def check_stage2_dependencies(
    storage_client: StorageClient,
    model_id: str,
    training_period: str,
    project_id: str,
) -> dict[str, object]:
    """
    Check if Stage 1 output exists for Stage 2 (hyperparameter-grid).

    Stage 2 requires:
    - Stage 1 selected_features.json
    """
    bucket_name = f"ml-training-artifacts-{project_id}"
    stage1_path = f"stage1-preselection/model-{model_id}/training-period-{training_period}/selected_features.json"

    logger.info("Checking Stage 1 output: gs://%s/%s", bucket_name, stage1_path)

    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(stage1_path)

        if blob.exists():
            return {
                "valid": True,
                "errors": [],
                "warnings": [],
                "stats": {
                    "bucket": bucket_name,
                    "path": stage1_path,
                    "exists": True,
                },
            }
        else:
            return {
                "valid": False,
                "errors": [f"Stage 1 output not found: {stage1_path}"],
                "warnings": [],
                "stats": {
                    "bucket": bucket_name,
                    "path": stage1_path,
                    "exists": False,
                },
            }

    except (OSError, ValueError, RuntimeError) as e:
        return {
            "valid": False,
            "errors": [f"Failed to check Stage 1 output: {e}"],
            "warnings": [],
        }


def check_stage3_dependencies(
    storage_client: StorageClient,
    model_id: str,
    training_period: str,
    project_id: str,
) -> dict[str, object]:
    """
    Check if Stage 2 output exists for Stage 3 (final-training).

    Stage 3 requires:
    - Stage 2 best_hyperparams.json
    - Stage 1 selected_features.json
    """
    bucket_name = f"ml-training-artifacts-{project_id}"
    stage2_path = f"stage2-hyperparams/model-{model_id}/training-period-{training_period}/best_hyperparams.json"
    stage1_path = f"stage1-preselection/model-{model_id}/training-period-{training_period}/selected_features.json"

    logger.info("Checking Stage 2 output: gs://%s/%s", bucket_name, stage2_path)
    logger.info("Checking Stage 1 output: gs://%s/%s", bucket_name, stage1_path)

    try:
        bucket = storage_client.bucket(bucket_name)

        stage2_blob = bucket.blob(stage2_path)
        stage1_blob = bucket.blob(stage1_path)

        stage2_exists = stage2_blob.exists()
        stage1_exists = stage1_blob.exists()

        errors = []
        if not stage2_exists:
            errors.append(f"Stage 2 output not found: {stage2_path}")
        if not stage1_exists:
            errors.append(f"Stage 1 output not found: {stage1_path}")

        return {
            "valid": stage2_exists and stage1_exists,
            "errors": errors,
            "warnings": [],
            "stats": {
                "bucket": bucket_name,
                "stage2_path": stage2_path,
                "stage2_exists": stage2_exists,
                "stage1_path": stage1_path,
                "stage1_exists": stage1_exists,
            },
        }

    except (OSError, ValueError, RuntimeError) as e:
        return {
            "valid": False,
            "errors": [f"Failed to check Stage 2/1 outputs: {e}"],
            "warnings": [],
        }


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Check ML training dependencies by mode",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Stage 1: Check feature data
    python tools/check_ml_dependencies_by_mode.py \\
        --operation train_phase1 --mode batch \\
        --instrument-id BINANCE-FUTURES:PERPETUAL:BTC-USDT \\
        --timeframe 1m \\
        --training-period 2021-03

    # Stage 2: Check Stage 1 output
    python tools/check_ml_dependencies_by_mode.py \\
        --operation train_phase2 --mode batch \\
        --model-id CEFI_BTC_swing-high_LIGHTGBM_1m_V1 \\
        --training-period 2021-03

    # Stage 3: Check Stage 2 output
    python tools/check_ml_dependencies_by_mode.py \\
        --operation train_phase3 --mode batch \\
        --model-id CEFI_BTC_swing-high_LIGHTGBM_1m_V1 \\
        --training-period 2021-03
        """,
    )

    parser.add_argument(
        "--operation",
        required=True,
        choices=["train_phase1", "train_phase2", "train_phase3"],
        help="Training stage (per codex: --operation train_phase1|2|3)",
    )
    parser.add_argument(
        "--mode",
        required=True,
        choices=["batch", "live"],
        help="Execution mode (batch or live)",
    )

    parser.add_argument(
        "--model-id",
        help="Model ID (required for stage 2 and 3)",
    )

    parser.add_argument(
        "--instrument-id",
        help="Full instrument ID (required for stage 1)",
    )

    parser.add_argument(
        "--timeframe",
        help="Timeframe (required for stage 1)",
    )

    parser.add_argument(
        "--training-period",
        required=True,
        help="Training period (e.g., 2021-03 for Q1 2021)",
    )

    parser.add_argument(
        "--project-id",
        default=None,
        help="GCP project ID (defaults to GCP_PROJECT_ID env var)",
    )

    args = parser.parse_args()

    # Validate operation-specific arguments
    if args.operation == "train_phase1":
        if not args.instrument_id or not args.timeframe:
            parser.error("--instrument-id and --timeframe are required for train_phase1")
    elif args.operation in ["train_phase2", "train_phase3"] and not args.model_id:
        parser.error("--model-id is required for %s", args.operation)

    # Initialize GCS client
    project_id = args.project_id or UnifiedCloudConfig().gcp_project_id
    storage_client = get_storage_client()

    # Check dependencies based on operation
    if args.operation == "train_phase1":
        logger.info("Checking Stage 1 dependencies for %s @ %s", args.instrument_id, args.timeframe)
        result = check_stage1_dependencies(
            storage_client,
            args.instrument_id,
            args.timeframe,
            args.training_period,
            project_id,
        )

    elif args.operation == "train_phase2":
        logger.info("Checking Stage 2 dependencies for model %s", args.model_id)
        result = check_stage2_dependencies(
            storage_client,
            args.model_id,
            args.training_period,
            project_id,
        )

    elif args.operation == "train_phase3":
        logger.info("Checking Stage 3 dependencies for model %s", args.model_id)
        result = check_stage3_dependencies(
            storage_client,
            args.model_id,
            args.training_period,
            project_id,
        )

    # Print results
    print("\n" + "=" * 80)
    print(f"Operation: {args.operation}, Mode: {args.mode}")
    print(f"Training Period: {args.training_period}")
    if args.model_id:
        print(f"Model ID: {args.model_id}")
    if args.instrument_id:
        print(f"Instrument: {args.instrument_id}")
    print("=" * 80)

    if result["valid"]:
        print("\n✅ All dependencies satisfied")
    else:
        print("\n❌ Missing dependencies")

    if result["errors"]:
        print("\nErrors:")
        for error in result["errors"]:
            print(f"  ❌ {error}")

    if result["warnings"]:
        print("\nWarnings:")
        for warning in result["warnings"]:
            print(f"  ⚠️  {warning}")

    if "stats" in result:
        print("\nStats:")
        for key, value in result["stats"].items():
            print(f"  {key}: {value}")

    print("=" * 80 + "\n")

    # Exit with appropriate code
    sys.exit(0 if result["valid"] else 1)


if __name__ == "__main__":
    main()
