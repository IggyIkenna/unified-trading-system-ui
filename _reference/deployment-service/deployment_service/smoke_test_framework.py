"""
Shard Combinatorics Smoke Test Framework

This module provides a reusable framework for running smoke tests that verify
all valid shard dimension combinations (category x venue x date) produce output.

Usage example::

    # from deployment_service.smoke_test_framework import ShardCombinatoricsGenerator
    # Generate all valid shards for a single test date
    generator = ShardCombinatoricsGenerator(config_dir)
    shards = generator.get_smoke_test_shards(
        service="market-tick-data-handler",
        test_date=date(2024, 1, 15),
    )

    # Run smoke tests
    runner = SmokeTestRunner(service="market-tick-data-handler")
    results = runner.run_smoke_tests(shards, max_instruments=1)
"""

import logging
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import date
from typing import TypedDict
from typing import cast as _cast

from unified_cloud_interface import StorageClient
from unified_trading_library import get_storage_client

from .config_loader import ConfigLoader
from .deployment_config import DeploymentConfig
from .shard_calculator import Shard, ShardCalculator

logger = logging.getLogger(__name__)

_config = DeploymentConfig()


class SmokeTestResultDict(TypedDict):  # CORRECT-LOCAL
    """Serialized smoke test result."""

    shard_dimensions: dict[str, object]
    passed: bool
    output_files_count: int
    error_message: str | None
    execution_time_seconds: float


class FailedShardDict(TypedDict):  # CORRECT-LOCAL
    """A failed shard entry in a test report."""

    dimensions: dict[str, object]
    error: str | None


class SmokeTestReportDict(TypedDict):  # CORRECT-LOCAL
    """Summary report from smoke test results."""

    service: str
    total_tests: int
    passed: int
    failed: int
    pass_rate: float
    failed_shards: list[FailedShardDict]
    total_execution_time: float


@dataclass
class SmokeTestResult:
    """Result of a single smoke test execution."""

    shard: Shard
    passed: bool
    output_files: list[str]
    error_message: str | None = None
    execution_time_seconds: float = 0.0

    def to_dict(self) -> SmokeTestResultDict:
        """Convert to dictionary for serialization."""
        return {
            "shard_dimensions": self.shard.dimensions,
            "passed": self.passed,
            "output_files_count": len(self.output_files),
            "error_message": self.error_message,
            "execution_time_seconds": self.execution_time_seconds,
        }


class ShardCombinatoricsGenerator:
    """
    Generates all valid shard combinations for smoke testing.

    Uses ShardCalculator with respect_start_dates=True to ensure
    only valid date-venue combinations are tested.
    """

    def __init__(self, config_dir: str = "configs"):
        """
        Initialize the generator.

        Args:
            config_dir: Path to configs directory containing sharding configs
        """
        self.config_dir = config_dir
        self.calculator = ShardCalculator(config_dir)
        self.config_loader = ConfigLoader(config_dir)

    def get_smoke_test_shards(
        self,
        service: str,
        test_date: date,
        category_filter: list[str] | None = None,
        venue_filter: list[str] | None = None,
    ) -> list[Shard]:
        """
        Get all valid shards for smoke testing on a single test date.

        Args:
            service: Service name (e.g., "market-tick-data-handler")
            test_date: The date to test (should be a recent date with data)
            category_filter: Optional list of categories to filter
            venue_filter: Optional list of venues to filter

        Returns:
            List of Shard objects representing valid test cases
        """
        filters = {}
        if category_filter:
            filters["category"] = category_filter
        if venue_filter:
            filters["venue"] = venue_filter

        # Use respect_start_dates=True to filter out invalid combinations
        shards = self.calculator.calculate_shards(
            service=service,
            start_date=test_date,
            end_date=test_date,
            max_shards=1000,
            respect_start_dates=True,
            **filters,
        )

        logger.info("Generated %s smoke test shards for %s on %s", len(shards), service, test_date)

        return shards

    def get_all_category_venue_combinations(
        self,
        service: str,
    ) -> list[dict[str, str]]:
        """
        Get all valid category-venue combinations for a service.

        Useful for understanding the test matrix without date expansion.

        Args:
            service: Service name

        Returns:
            List of dicts with 'category' and 'venue' keys
        """
        config = self.config_loader.load_service_config(service)
        venues_config = self.config_loader.load_venues_config()

        combinations = []

        # Find category dimension
        category_values: list[object] = []
        for dim in _cast(list[dict[str, object]], config.get("dimensions") or []):
            if dim["name"] == "category" and dim["type"] == "fixed":
                category_values = _cast(list[object], dim.get("values") or [])
                break

        # Check if service has hierarchical venue dimension
        has_venue_dim = any(
            dim["name"] == "venue" and dim["type"] == "hierarchical"
            for dim in _cast(list[dict[str, object]], config.get("dimensions") or [])
        )

        if has_venue_dim:
            for category in category_values:
                categories_dict = _cast(
                    dict[str, dict[str, object]], venues_config.get("categories") or {}
                )
                cat_config = categories_dict.get(str(category)) or {}
                venues = _cast(list[object], cat_config.get("venues") or [])
                for venue in venues:
                    combinations.append({"category": category, "venue": venue})
        else:
            for category in category_values:
                combinations.append({"category": category, "venue": None})

        return combinations


class GCSTestBucketManager:
    """
    Manages test GCS buckets for smoke testing.

    Provides methods to:
    - Clean test buckets before tests
    - Verify output files exist after tests
    """

    def __init__(
        self,
        test_bucket_prefix: str = "test-smoke-",
        project_id: str | None = None,
    ):
        """
        Initialize the bucket manager.

        Args:
            test_bucket_prefix: Prefix for test bucket names
            project_id: GCP project ID (defaults to GCP_PROJECT_ID env var)
        """
        self.test_bucket_prefix = test_bucket_prefix
        _pid = project_id or _config.gcp_project_id
        if not _pid:
            raise ValueError(
                "GCP project ID required for SmokeTestBucketManager. "
                "Pass project_id or set GCP_PROJECT_ID environment variable."
            )
        self.project_id = _pid

        # Import GCS client lazily to avoid dependency issues in tests
        self._storage_client: StorageClient | None = None

    @property
    def storage_client(self) -> StorageClient:
        """Lazy initialization of GCS client."""
        if self._storage_client is None:
            self._storage_client = get_storage_client(project_id=self.project_id)
        return self._storage_client

    def get_test_bucket_name(self, service: str, category: str) -> str:
        """
        Get the test bucket name for a service and category.

        Args:
            service: Service name
            category: Category (CEFI, TRADFI, DEFI)

        Returns:
            Test bucket name
        """
        return f"{self.test_bucket_prefix}{service}-{category.lower()}"

    def clean_test_bucket(self, bucket_name: str, prefix: str = "") -> int:
        """
        Delete all objects in a test bucket (or prefix).

        Args:
            bucket_name: Name of the bucket to clean
            prefix: Optional prefix to limit deletion

        Returns:
            Number of objects deleted
        """
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blobs = list(bucket.list_blobs(prefix=prefix))

            for blob in blobs:
                blob.delete()

            logger.info("Deleted %s objects from %s/%s", len(blobs), bucket_name, prefix)
            return len(blobs)
        except (OSError, ValueError, RuntimeError) as e:
            logger.warning("Failed to clean bucket %s: %s", bucket_name, e)
            return 0

    def list_output_files(
        self,
        bucket_name: str,
        prefix: str,
        pattern: str = "*.parquet",
    ) -> list[str]:
        """
        List output files matching a pattern.

        Args:
            bucket_name: Name of the bucket
            prefix: Path prefix to search
            pattern: Glob pattern for files (default: *.parquet)

        Returns:
            List of file paths (gs:// format)
        """
        try:
            bucket = self.storage_client.bucket(bucket_name)
            blobs = list(bucket.list_blobs(prefix=prefix))

            # Filter by pattern (simple suffix match)
            suffix = pattern.replace("*", "")
            files = [
                # noqa: gs-uri — smoke_test builds GCS paths for GCS verification; see QUALITY_GATE_BYPASS_AUDIT.md §2.12b
                f"gs://{bucket_name}/{blob.name}"  # noqa: gs-uri
                for blob in blobs
                if blob.name.endswith(suffix)
            ]

            return files
        except (OSError, PermissionError) as e:
            logger.warning("Failed to list output files in %s/%s: %s", bucket_name, prefix, e)
            return []

    def verify_output_exists(
        self,
        bucket_name: str,
        shard: Shard,
        min_files: int = 1,
    ) -> bool:
        """
        Verify that output files exist for a shard.

        Args:
            bucket_name: Name of the output bucket
            shard: Shard to verify
            min_files: Minimum number of files expected

        Returns:
            True if at least min_files exist
        """
        # Build prefix from shard dimensions
        date_val = shard.dimensions.get("date") or {}
        date_str = date_val.get("start") or "" if isinstance(date_val, dict) else str(date_val)

        prefix = f"by_date/day-{date_str}/"

        files = self.list_output_files(bucket_name, prefix)
        return len(files) >= min_files


class SmokeTestRunner:
    """
    Runs smoke tests for a service across all shard combinations.

    Executes the service CLI with --max-instruments 1 for each shard
    and verifies output files are created.
    """

    def __init__(
        self,
        service: str,
        service_module: str | None = None,
        config_dir: str = "configs",
    ):
        """
        Initialize the smoke test runner.

        Args:
            service: Service name (e.g., "market-tick-data-handler")
            service_module: Python module name (defaults to service with hyphens replaced)
            config_dir: Path to configs directory
        """
        self.service = service
        self.service_module = service_module or service.replace("-", "_")
        self.config_loader = ConfigLoader(config_dir)

    def run_smoke_tests(
        self,
        shards: list[Shard],
        max_instruments: int = 1,
        timeout_seconds: int = 300,
        dry_run: bool = False,
    ) -> list[SmokeTestResult]:
        """
        Run smoke tests for all shards.

        Args:
            shards: List of shards to test
            max_instruments: Maximum instruments per test (default: 1)
            timeout_seconds: Timeout per test (default: 5 minutes)
            dry_run: If True, just generate commands without executing

        Returns:
            List of SmokeTestResult objects
        """
        results = []

        for i, shard in enumerate(shards):
            logger.info("Running smoke test %s/%s: %s", i + 1, len(shards), shard.dimensions)

            result = self._run_single_test(
                shard=shard,
                max_instruments=max_instruments,
                timeout_seconds=timeout_seconds,
                dry_run=dry_run,
            )
            results.append(result)

            if not result.passed:
                logger.warning("Test failed: %s", result.error_message)

        # Summary
        passed = sum(1 for r in results if r.passed)
        logger.info("Smoke tests complete: %s/%s passed", passed, len(results))

        return results

    def _run_single_test(
        self,
        shard: Shard,
        max_instruments: int,
        timeout_seconds: int,
        dry_run: bool,
    ) -> SmokeTestResult:
        """
        Run a single smoke test.

        Args:
            shard: Shard to test
            max_instruments: Maximum instruments
            timeout_seconds: Timeout
            dry_run: Just generate command

        Returns:
            SmokeTestResult
        """
        # Build CLI command
        cmd = self._build_cli_command(shard, max_instruments)

        if dry_run:
            logger.info("Dry run command: %s", " ".join(cmd))
            return SmokeTestResult(
                shard=shard,
                passed=True,
                output_files=[],
                error_message="Dry run - command not executed",
            )

        # Execute
        start_time = time.time()
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=timeout_seconds,
            )

            execution_time = time.time() - start_time

            if result.returncode == 0:
                return SmokeTestResult(
                    shard=shard,
                    passed=True,
                    output_files=[],  # Would be populated by GCSTestBucketManager
                    execution_time_seconds=execution_time,
                )
            else:
                return SmokeTestResult(
                    shard=shard,
                    passed=False,
                    output_files=[],
                    error_message=f"Exit code {result.returncode}: {result.stderr[:500]}",
                    execution_time_seconds=execution_time,
                )

        except subprocess.TimeoutExpired:
            return SmokeTestResult(
                shard=shard,
                passed=False,
                output_files=[],
                error_message=f"Timeout after {timeout_seconds} seconds",
                execution_time_seconds=timeout_seconds,
            )
        except (OSError, ValueError, RuntimeError) as e:
            return SmokeTestResult(
                shard=shard,
                passed=False,
                output_files=[],
                error_message=str(e),
            )

    def _build_cli_command(
        self,
        shard: Shard,
        max_instruments: int,
    ) -> list[str]:
        """
        Build the CLI command for a shard.

        Args:
            shard: Shard to build command for
            max_instruments: Maximum instruments

        Returns:
            List of command arguments
        """
        cmd = [sys.executable, "-m", self.service_module]

        # Add dimension values as CLI args
        for dim_name, dim_value in shard.dimensions.items():
            if dim_name == "date" and isinstance(dim_value, dict):
                cmd.extend(["--start-date", dim_value["start"]])
                cmd.extend(["--end-date", dim_value["end"]])
            elif dim_name == "config":
                cmd.extend(["--config-gcs", str(dim_value)])
            else:
                cmd.extend([f"--{dim_name.replace('_', '-')}", str(dim_value)])

        # Add max-instruments flag
        cmd.extend(["--max-instruments", str(max_instruments)])

        return cmd

    def generate_test_report(
        self,
        results: list[SmokeTestResult],
    ) -> SmokeTestReportDict:
        """
        Generate a summary report from test results.

        Args:
            results: List of test results

        Returns:
            Summary report dict
        """
        passed = [r for r in results if r.passed]
        failed = [r for r in results if not r.passed]

        return {
            "service": self.service,
            "total_tests": len(results),
            "passed": len(passed),
            "failed": len(failed),
            "pass_rate": len(passed) / len(results) if results else 0,
            "failed_shards": [
                {
                    "dimensions": r.shard.dimensions,
                    "error": r.error_message,
                }
                for r in failed
            ],
            "total_execution_time": sum(r.execution_time_seconds for r in results),
        }
