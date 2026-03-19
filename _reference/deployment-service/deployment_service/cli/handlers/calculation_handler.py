"""Calculation command handlers."""

import json
import logging
from datetime import UTC, datetime
from typing import cast

import click

from ...services.deployment_service import DeploymentService
from ...shard_calculator import ShardCalculator, ShardLimitExceeded

logger = logging.getLogger(__name__)


class CalculationHandler:
    """Handler for shard calculation CLI commands."""

    def __init__(self, ctx: click.Context):
        """Initialize calculation handler.

        Args:
            ctx: Click context with configuration
        """
        self.ctx = ctx
        ctx_obj = cast("dict[str, object]", ctx.obj)
        self.config_dir = cast("str | None", ctx_obj.get("config_dir"))
        self.deployment_service = DeploymentService(self.config_dir)

    def handle_calculate(
        self,
        service: str,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        venue: str | None = None,
        category: str | None = None,
        max_shards: int | None = None,
        output: str = "table",
        dry_run: bool = True,
    ) -> None:
        """Handle calculate command.

        Args:
            service: Service name to calculate shards for
            start_date: Start date for calculation
            end_date: End date for calculation
            venue: Venue filter
            category: Category filter
            max_shards: Maximum number of shards
            output: Output format (table, json, commands)
            dry_run: Whether this is a dry run
        """
        try:
            # Validate service
            self.deployment_service.validate_service(service)

            # Get shard calculator
            calculator = self.deployment_service.shard_calculator

            # Perform calculation
            shards, summary = self._calculate_shards(
                calculator, service, start_date, end_date, venue, category, max_shards
            )

            # Output results
            self._output_results(shards, summary, output, dry_run)

        except ShardLimitExceeded as e:
            logger.error("Shard limit exceeded: %s", e)
            raise click.ClickException(str(e)) from e
        except (ValueError, KeyError, TypeError) as e:
            logger.error("Invalid calculation parameters: %s", e)
            raise click.ClickException(f"Invalid calculation parameters: {e}") from e
        except OSError as e:
            logger.error("File system error during calculation: %s", e)
            raise click.ClickException(f"File system error: {e}") from e
        except RuntimeError as e:
            logger.exception("Unexpected error during calculation: %s", e)
            raise click.ClickException(f"Calculation failed: {e}") from e

    def _calculate_shards(
        self,
        calculator: ShardCalculator,
        service: str,
        start_date: datetime | None,
        end_date: datetime | None,
        venue: str | None,
        category: str | None,
        max_shards: int | None,
    ) -> tuple[list[dict[str, object]], dict[str, object]]:
        """Calculate shards using the shard calculator.

        Args:
            calculator: Shard calculator instance
            service: Service name
            start_date: Start date
            end_date: End date
            venue: Venue filter
            category: Category filter
            max_shards: Maximum shards

        Returns:
            Tuple of (shards list, summary dict)
        """
        # Build calculation parameters
        params = {
            "service": service,
            "start_date": start_date,
            "end_date": end_date,
            "venue": venue,
            "category": category,
            "max_shards": max_shards,
        }

        # Remove None values
        params = {k: v for k, v in params.items() if v is not None}

        # Perform calculation
        result = calculator.calculate(**params)

        # Extract shards and summary
        shards = result.get("shards") or []
        summary = result.get("summary") or {}

        return shards, summary

    def _output_results(
        self,
        shards: list[dict[str, object]],
        summary: dict[str, object],
        output_format: str,
        dry_run: bool,
    ) -> None:
        """Output calculation results in requested format.

        Args:
            shards: List of calculated shards
            summary: Summary information
            output_format: Output format (table, json, commands)
            dry_run: Whether this is a dry run
        """
        if output_format == "table":
            self._output_table(shards, summary, dry_run)
        elif output_format == "json":
            self._output_json(shards, summary)
        elif output_format == "commands":
            self._output_commands(shards, summary)
        else:
            raise click.ClickException(f"Unknown output format: {output_format}")

    def _output_table(
        self, shards: list[dict[str, object]], summary: dict[str, object], dry_run: bool
    ) -> None:
        """Output results in table format.

        Args:
            shards: Shard list
            summary: Summary info
            dry_run: Dry run flag
        """
        if not shards:
            click.echo("No shards calculated")
            return

        # Display summary
        click.echo("Shard Calculation Summary:")
        click.echo(f"  Total shards: {len(shards)}")
        click.echo(f"  Service: {summary.get('service', 'unknown')}")
        if summary.get("date_range"):
            click.echo(f"  Date range: {summary['date_range']}")
        if summary.get("venue"):
            click.echo(f"  Venue: {summary['venue']}")
        if summary.get("category"):
            click.echo(f"  Category: {summary['category']}")

        click.echo()

        # Display table header
        click.echo(f"{'Shard ID':<30} {'Date':<12} {'Venue':<15} {'Status':<10}")
        click.echo("-" * 67)

        # Display shard rows
        for shard in shards:
            shard_id = cast(str, shard.get("shard_id", "unknown"))
            date = cast(str, shard.get("date", "unknown"))
            venue = cast(str, shard.get("venue", "unknown"))
            status = "pending" if dry_run else cast(str, shard.get("status", "unknown"))

            # Truncate long values
            if len(shard_id) > 30:
                shard_id = shard_id[:27] + "..."
            if len(venue) > 15:
                venue = venue[:12] + "..."

            click.echo(f"{shard_id:<30} {date:<12} {venue:<15} {status:<10}")

        if dry_run:
            click.echo(f"\nDRY RUN: {len(shards)} shards would be created")

    def _output_json(self, shards: list[dict[str, object]], summary: dict[str, object]) -> None:
        """Output results in JSON format.

        Args:
            shards: Shard list
            summary: Summary info
        """
        output = {"summary": summary, "shards": shards, "timestamp": datetime.now(UTC).isoformat()}

        click.echo(json.dumps(output, indent=2))

    def _output_commands(self, shards: list[dict[str, object]], summary: dict[str, object]) -> None:
        """Output deployment commands for each shard.

        Args:
            shards: Shard list
            summary: Summary info
        """
        service = summary.get("service", "unknown")

        click.echo(f"# Deployment commands for {service}")
        click.echo(f"# Total shards: {len(shards)}")
        click.echo()

        for shard in shards:
            shard_id = shard.get("shard_id", "unknown")
            args = shard.get("args") or {}

            # Build command
            cmd_parts = [f"deploy --service {service}"]

            for key, value in args.items():
                cmd_parts.append(f"--{key} {value}")

            command = " ".join(cmd_parts)
            click.echo(f"# Shard: {shard_id}")
            click.echo(command)
            click.echo()

    def handle_list_services(self) -> None:
        """Handle list-services command."""
        try:
            services = self.deployment_service.list_available_services()

            if not services:
                click.echo("No services found")
                return

            click.echo("Available services:")
            for service in services:
                click.echo(f"  {service}")

        except (ValueError, KeyError) as e:
            logger.error("Invalid service configuration: %s", e)
            raise click.ClickException(f"Invalid service configuration: {e}") from e
        except OSError as e:
            logger.error("File system error while listing services: %s", e)
            raise click.ClickException(f"File system error: {e}") from e
        except RuntimeError as e:
            logger.exception("Unexpected error listing services: %s", e)
            raise click.ClickException(f"Failed to list services: {e}") from e

    def handle_service_info(self, service: str) -> None:
        """Handle service info command.

        Args:
            service: Service name to get info for
        """
        try:
            info = self.deployment_service.get_service_info(service)

            click.echo(f"Service: {service}")

            # Display service configuration
            config = info.get("config") or {}
            if config:
                click.echo("Configuration:")
                click.echo(json.dumps(config, indent=2))

            # Display metadata
            metadata = info.get("metadata") or {}
            if metadata:
                click.echo("Metadata:")
                for key, value in metadata.items():
                    click.echo(f"  {key}: {value}")

            # Display venues
            venues = self.deployment_service.get_venues_for_service(service)
            if venues:
                click.echo(f"Venues: {', '.join(venues)}")

        except (ValueError, KeyError) as e:
            logger.error("Invalid service name or configuration: %s", e)
            raise click.ClickException(f"Invalid service: {e}") from e
        except OSError as e:
            logger.error("File system error while getting service info: %s", e)
            raise click.ClickException(f"File system error: {e}") from e
        except RuntimeError as e:
            logger.exception("Unexpected error getting service info: %s", e)
            raise click.ClickException(f"Failed to get service info: {e}") from e

    def handle_venues(self) -> None:
        """Handle venues command."""
        try:
            services = self.deployment_service.list_available_services()

            if not services:
                click.echo("No services found")
                return

            click.echo("Venues by service:")

            for service in services:
                try:
                    venues = self.deployment_service.get_venues_for_service(service)
                    if venues:
                        click.echo(f"  {service}: {', '.join(venues)}")
                    else:
                        click.echo(f"  {service}: no venues configured")
                except (ValueError, KeyError) as e:
                    logger.warning("Invalid venue configuration for %s: %s", service, e)
                    click.echo(f"  {service}: invalid venue configuration")
                except OSError as e:
                    logger.warning("File system error retrieving venues for %s: %s", service, e)
                    click.echo(f"  {service}: file system error")
                except RuntimeError as e:
                    logger.warning("Unexpected error retrieving venues for %s: %s", service, e)
                    click.echo(f"  {service}: error retrieving venues")

        except (ValueError, KeyError) as e:
            logger.error("Invalid venue configuration: %s", e)
            raise click.ClickException(f"Invalid venue configuration: {e}") from e
        except OSError as e:
            logger.error("File system error while listing venues: %s", e)
            raise click.ClickException(f"File system error: {e}") from e
        except RuntimeError as e:
            logger.exception("Unexpected error listing venues: %s", e)
            raise click.ClickException(f"Failed to list venues: {e}") from e
