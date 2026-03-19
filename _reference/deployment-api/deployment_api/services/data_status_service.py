"""
Data status business logic service.

Handles core data status operations including CLI integration,
missing shards calculation, and status aggregation.
"""

import asyncio
import json
import logging
import sys
from typing import cast

from deployment_api.settings import gcp_project_id as _pid
from deployment_api.utils.storage_facade import list_objects

logger = logging.getLogger(__name__)


class DataStatusService:
    """
    Business logic service for data status operations.

    This service handles:
    - CLI wrapper for data status commands
    - Missing shards calculation
    - Data completeness validation
    - Cross-service status aggregation
    """

    def __init__(self, project_id: str | None = None):
        """Initialize data status service."""
        self.project_id = project_id or _pid

    def build_bucket_name(self, prefix: str, category: str) -> str:
        """Build a GCS bucket name: {prefix}-{category_lower}-{project_id}."""
        return f"{prefix}-{category.lower()}-{self.project_id}"

    def _build_cli_cmd(
        self,
        service: str,
        start_date: str,
        end_date: str,
        categories: list[str] | None,
        venues: list[str] | None,
        show_missing: bool,
        check_venues: bool,
        check_data_types: bool,
        check_feature_groups: bool,
        check_timeframes: bool,
        mode: str,
    ) -> list[str]:
        """Build the data-status CLI command list."""
        cmd = [
            sys.executable,
            "-m",
            "deployment_service",
            "data-status",
            "-s",
            service,
            "--start-date",
            start_date,
            "--end-date",
            end_date,
            "--output",
            "json",
            "--mode",
            mode,
        ]
        for cat in categories or []:
            cmd.extend(["-c", cat])
        for venue in venues or []:
            cmd.extend(["-v", venue])
        if show_missing:
            cmd.append("--show-missing")
        if check_venues:
            cmd.append("--check-venues")
        elif check_feature_groups:
            cmd.append("--check-feature-groups")
        elif check_timeframes:
            cmd.append("--check-timeframes")
        elif service in ["market-tick-data-handler", "market-data-processing-service"]:
            cmd.append("--fast")
        if check_data_types:
            cmd.append("--check-data-types")
        return cmd

    async def run_data_status_cli(
        self,
        service: str,
        start_date: str,
        end_date: str,
        categories: list[str] | None = None,
        venues: list[str] | None = None,
        show_missing: bool = False,
        check_venues: bool = False,
        check_data_types: bool = False,
        check_feature_groups: bool = False,
        check_timeframes: bool = False,
        mode: str = "batch",
    ) -> dict[str, object]:
        """
        Run data-status CLI command and return parsed JSON output.

        Returns parsed JSON output from CLI command.
        """
        cmd = self._build_cli_cmd(
            service,
            start_date,
            end_date,
            categories,
            venues,
            show_missing,
            check_venues,
            check_data_types,
            check_feature_groups,
            check_timeframes,
            mode,
        )
        logger.info("Running CLI: %s", " ".join(cmd))

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=None,
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                error_msg = f"CLI command failed with code {process.returncode}: {stderr.decode()}"
                logger.error(error_msg)
                return {"error": error_msg, "stderr": stderr.decode()}

            try:
                result = cast(dict[str, object], json.loads(stdout.decode()))
                return result
            except json.JSONDecodeError as e:
                logger.error("Failed to parse CLI JSON output: %s", e)
                return {"error": f"Invalid JSON output: {e}", "raw_output": stdout.decode()}

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error running CLI command: %s", e)
            return {"error": str(e)}

    def _tally_missing_venues(
        self,
        date_info: dict[str, object],
        missing_by_venue: dict[str, int],
        missing_by_category: dict[str, int],
    ) -> int:
        """Count missing venues in a date entry and update tallies in-place."""
        missing_count = 0
        venues_raw: object = date_info.get("venues")
        if not (venues_raw and isinstance(venues_raw, list)):
            return 0
        for venue_info_raw in cast(list[object], venues_raw):
            if not isinstance(venue_info_raw, dict):
                continue
            venue_info = cast(dict[str, object], venue_info_raw)
            venue_name_raw: object = venue_info.get("venue")
            venue_name = venue_name_raw if isinstance(venue_name_raw, str) else ""
            if venue_info.get("status") == "missing":
                missing_count += 1
                missing_by_venue[venue_name] = missing_by_venue.get(venue_name, 0) + 1
                cat_raw: object = venue_info.get("category", "unknown")
                category = cat_raw if isinstance(cat_raw, str) else "unknown"
                missing_by_category[category] = missing_by_category.get(category, 0) + 1
        return missing_count

    async def calculate_missing_shards(
        self,
        service: str,
        start_date: str,
        end_date: str,
        categories: list[str] | None = None,
        venues: list[str] | None = None,
        mode: str = "batch",
    ) -> dict[str, object]:
        """
        Calculate missing shards for a service over a date range.

        Returns dictionary containing missing shards analysis.
        """
        try:
            result = await self.run_data_status_cli(
                service=service,
                start_date=start_date,
                end_date=end_date,
                categories=categories,
                venues=venues,
                show_missing=True,
                mode=mode,
            )
            if "error" in result:
                return result

            missing_by_date: dict[str, int] = {}
            missing_by_venue: dict[str, int] = {}
            missing_by_category: dict[str, int] = {}
            total_missing = 0

            dates_raw: object = result.get("dates")
            if dates_raw and isinstance(dates_raw, list):
                for date_info_raw in cast(list[object], dates_raw):
                    if not isinstance(date_info_raw, dict):
                        continue
                    date_info = cast(dict[str, object], date_info_raw)
                    date_str_raw: object = date_info.get("date")
                    date_str = date_str_raw if isinstance(date_str_raw, str) else ""
                    missing_count = self._tally_missing_venues(
                        date_info, missing_by_venue, missing_by_category
                    )
                    if missing_count > 0 and date_str:
                        missing_by_date[date_str] = missing_count
                        total_missing += missing_count

            missing_analysis: dict[str, object] = {
                "service": service,
                "date_range": {"start": start_date, "end": end_date},
                "total_missing": total_missing,
                "missing_by_date": missing_by_date,
                "missing_by_venue": missing_by_venue,
                "missing_by_category": missing_by_category,
                "summary": {
                    "total_days_checked": (
                        len(cast(list[object], dates_raw)) if isinstance(dates_raw, list) else 0
                    ),
                    "days_with_missing": len(missing_by_date),
                    "venues_with_missing": len(missing_by_venue),
                    "categories_with_missing": len(missing_by_category),
                    "completion_rate": self._calculate_completion_rate(result),
                },
            }
            return missing_analysis

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error calculating missing shards: %s", e)
            return {"error": str(e)}

    def _calculate_completion_rate(self, data_status_result: dict[str, object]) -> float:
        """
        Calculate completion rate from data status result.

        Args:
            data_status_result: Result from data status CLI

        Returns:
            Completion rate as percentage (0.0-100.0)
        """
        if "dates" not in data_status_result:
            return 0.0

        total_checks = 0
        completed_checks = 0

        dates_raw: object = data_status_result.get("dates")
        if not isinstance(dates_raw, list):
            return 0.0

        for date_info_raw in cast(list[object], dates_raw):
            if not isinstance(date_info_raw, dict):
                continue
            date_info = cast(dict[str, object], date_info_raw)
            venues_raw: object = date_info.get("venues")
            if not isinstance(venues_raw, list):
                continue
            for venue_info_raw in cast(list[object], venues_raw):
                if not isinstance(venue_info_raw, dict):
                    continue
                venue_info = cast(dict[str, object], venue_info_raw)
                total_checks += 1
                if venue_info.get("status") != "missing":
                    completed_checks += 1

        if total_checks == 0:
            return 0.0

        return (completed_checks / total_checks) * 100.0

    async def get_last_updated_info(
        self,
        service: str,
        categories: list[str] | None = None,
    ) -> dict[str, object]:
        """
        Get last updated information for a service.

        Args:
            service: Service name to check
            categories: Optional list of categories to filter

        Returns:
            Dictionary containing last updated information
        """
        # Service to bucket prefix mapping
        bucket_prefixes = {
            "market-tick-data-handler": "market-data",
            "market-data-processing-service": "processed-market-data",
            "instruments-service": "instruments",
            "features-equity-service": "features-equity",
            "features-derivatives-service": "features-derivatives",
            "features-defi-service": "features-defi",
        }

        prefix = bucket_prefixes.get(service)
        if not prefix:
            return {"error": f"Unknown service: {service}"}

        # Default categories if none specified
        if not categories:
            categories = ["cefi", "tradfi", "defi"]

        categories_info: dict[str, object] = {}
        last_updated_info: dict[str, object] = {
            "service": service,
            "categories": categories_info,
            "overall_last_updated": None,
        }

        for category in categories:
            try:
                bucket_name = self.build_bucket_name(prefix, category)

                # Check if bucket has any recent activity
                # Use the most recent object in the bucket as proxy
                objects = list_objects(bucket_name, "", max_results=10)

                if objects:
                    # Get the most recently created object
                    # This is a simplified approach - in production you might want
                    # to check specific paths or use bucket metadata
                    categories_info[category] = {
                        "status": "active",
                        "object_count": len(objects),
                        "sample_paths": objects[:5],  # First 5 as examples
                    }
                else:
                    categories_info[category] = {
                        "status": "empty",
                        "object_count": 0,
                    }

            except (OSError, ValueError, RuntimeError) as e:
                logger.debug("Error checking category %s: %s", category, e)
                categories_info[category] = {
                    "status": "error",
                    "error": str(e),
                }

        return last_updated_info

    async def validate_data_completeness(
        self,
        service: str,
        date: str,
        categories: list[str] | None = None,
        venues: list[str] | None = None,
    ) -> dict[str, object]:
        """
        Validate data completeness for a specific date.

        Args:
            service: Service name to validate
            date: Date in YYYY-MM-DD format
            categories: Optional list of categories to check
            venues: Optional list of venues to check

        Returns:
            Validation result with completeness details
        """
        # Get data status for single day
        result = await self.run_data_status_cli(
            service=service,
            start_date=date,
            end_date=date,
            categories=categories,
            venues=venues,
            show_missing=True,
        )

        if "error" in result:
            return result

        # Analyze completeness
        missing_venues: list[str] = []
        validation_errors: list[object] = []
        is_complete = True
        total_venues = 0
        completed_venues = 0

        dates_val: object = result.get("dates")
        if dates_val and isinstance(dates_val, list):
            dates_list = cast(list[object], dates_val)
            if dates_list and isinstance(dates_list[0], dict):
                date_data = cast(dict[str, object], dates_list[0])  # Single date

                venues_val: object = date_data.get("venues")
                if venues_val and isinstance(venues_val, list):
                    venues_list = cast(list[object], venues_val)
                    total_venues = len(venues_list)

                    for venue_info_raw in venues_list:
                        if not isinstance(venue_info_raw, dict):
                            continue
                        venue_info = cast(dict[str, object], venue_info_raw)
                        vname_raw: object = venue_info.get("venue", "unknown")
                        venue_name = vname_raw if isinstance(vname_raw, str) else "unknown"
                        status_raw: object = venue_info.get("status")
                        status = status_raw if isinstance(status_raw, str) else ""

                        if status == "missing":
                            is_complete = False
                            missing_venues.append(venue_name)
                        elif status == "error":
                            err_raw: object = venue_info.get("error", "Unknown error")
                            validation_errors.append(
                                {
                                    "venue": venue_name,
                                    "error": err_raw
                                    if isinstance(err_raw, str)
                                    else "Unknown error",
                                }
                            )
                        else:
                            completed_venues += 1

        completion_rate = (completed_venues / total_venues * 100) if total_venues > 0 else 0.0

        validation: dict[str, object] = {
            "service": service,
            "date": date,
            "is_complete": is_complete,
            "total_venues": total_venues,
            "completed_venues": completed_venues,
            "missing_venues": missing_venues,
            "errors": validation_errors,
            "completion_rate": completion_rate,
        }

        return validation
