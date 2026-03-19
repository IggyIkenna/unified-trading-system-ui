"""Deployment command handlers."""

import json
import logging
from datetime import UTC, datetime
from typing import cast

import click

from ...services.deployment_service import DeploymentService
from ...services.log_service import LogService
from ...services.status_service import StatusService

logger = logging.getLogger(__name__)


class DeploymentHandler:
    """Handler for deployment-related CLI commands."""

    def __init__(self, ctx: click.Context):
        """Initialize deployment handler.

        Args:
            ctx: Click context with configuration
        """
        self.ctx = ctx
        ctx_obj = cast("dict[str, object]", ctx.obj)
        self.config_dir = cast("str | None", ctx_obj.get("config_dir"))
        self.cloud_provider = cast(str, ctx_obj.get("cloud", "gcp"))

        # Initialize services
        self.deployment_service = DeploymentService(self.config_dir)
        self.status_service = StatusService(cast("str | None", ctx_obj.get("project_id")))
        self.log_service = LogService(cast("str | None", ctx_obj.get("project_id")))

    def handle_deploy(
        self,
        service: str,
        config_override: str | None = None,
        dry_run: bool = False,
        max_concurrent: int = 50,
        **kwargs,
    ) -> None:
        """Handle deployment command.

        Args:
            service: Service name to deploy
            config_override: Override configuration file
            dry_run: Whether to perform dry run
            max_concurrent: Maximum concurrent deployments
            **kwargs: Additional deployment parameters
        """
        try:
            # Validate service
            self.deployment_service.validate_service(service)

            if dry_run:
                self._handle_dry_run_deploy(service, config_override, **kwargs)
            else:
                self._handle_actual_deploy(service, config_override, max_concurrent, **kwargs)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Deployment failed: %s", e)
            raise click.ClickException(f"Deployment failed: {e}") from e

    def _handle_dry_run_deploy(self, service: str, config_override: str | None, **kwargs) -> None:
        """Handle dry run deployment.

        Args:
            service: Service name
            config_override: Config override
            **kwargs: Additional parameters
        """
        click.echo(f"DRY RUN: Would deploy service '{service}'")

        # Show what would be deployed
        service_info = self.deployment_service.get_service_info(service)
        click.echo(f"Service config: {json.dumps(service_info, indent=2)}")

        if config_override:
            click.echo(f"Config override: {config_override}")

        click.echo("Additional parameters:")
        for key, value in kwargs.items():
            click.echo(f"  {key}: {value}")

    def _handle_actual_deploy(
        self, service: str, config_override: str | None, max_concurrent: int, **kwargs
    ) -> None:
        """Handle actual deployment.

        Args:
            service: Service name
            config_override: Config override
            max_concurrent: Max concurrent deployments
            **kwargs: Additional parameters
        """
        click.echo(f"Deploying service '{service}'...")

        # Generate deployment ID
        deployment_id = self._generate_deployment_id(service)

        # Start deployment process
        # This is a placeholder - actual implementation would
        # interface with deployment backends
        click.echo(f"Deployment ID: {deployment_id}")
        click.echo(f"Max concurrent: {max_concurrent}")

        if config_override:
            click.echo(f"Using config override: {config_override}")

        # Monitor deployment progress
        self._monitor_deployment_progress(deployment_id)

    def _generate_deployment_id(self, service: str) -> str:
        """Generate unique deployment ID.

        Args:
            service: Service name

        Returns:
            Unique deployment ID
        """
        timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
        return f"{service}-{timestamp}"

    def _monitor_deployment_progress(self, deployment_id: str) -> None:
        """Monitor deployment progress.

        Args:
            deployment_id: Deployment ID to monitor
        """
        click.echo(f"Monitoring deployment {deployment_id}...")

        # Placeholder for progress monitoring
        # Would typically poll status service
        for i in range(5):
            click.echo(f"  Progress: {(i + 1) * 20}%")

        click.echo("Deployment completed successfully!")

    def handle_resume(self, deployment_id: str, **kwargs) -> None:
        """Handle resume command.

        Args:
            deployment_id: Deployment ID to resume
            **kwargs: Additional parameters
        """
        try:
            status = self.status_service.get_deployment_status(deployment_id)
            current_status = status.get("status", "unknown")

            if current_status == "completed":
                click.echo(f"Deployment {deployment_id} is already completed")
                return

            if current_status == "running":
                click.echo(f"Deployment {deployment_id} is already running")
                return

            click.echo(f"Resuming deployment {deployment_id}...")

            # Resume deployment logic would go here
            self._monitor_deployment_progress(deployment_id)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Resume failed: %s", e)
            raise click.ClickException(f"Resume failed: {e}") from e

    def handle_status(
        self, deployment_id: str | None = None, show_all: bool = False, show_details: bool = False
    ) -> None:
        """Handle status command.

        Args:
            deployment_id: Specific deployment ID to check
            show_all: Show all deployments
            show_details: Show detailed information
        """
        try:
            if deployment_id:
                self.status_service.display_hierarchical_status(deployment_id, show_details)
            elif show_all:
                deployments = self.status_service.list_deployments(limit=100)
                self._display_deployments_table(deployments)
            else:
                # Show recent deployments
                deployments = self.status_service.list_deployments(limit=10)
                self._display_deployments_table(deployments)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Status check failed: %s", e)
            raise click.ClickException(f"Status check failed: {e}") from e

    def _display_deployments_table(self, deployments: list[dict[str, object]]) -> None:
        """Display deployments in table format.

        Args:
            deployments: List of deployment information
        """
        if not deployments:
            click.echo("No deployments found")
            return

        # Header
        click.echo(f"{'Deployment ID':<30} {'Status':<12} {'Created':<20}")
        click.echo("-" * 62)

        # Rows
        for deployment in deployments:
            dep_id = cast(str, deployment.get("deployment_id", "unknown"))
            status = cast(str, deployment.get("status", "unknown"))
            created = cast(str, deployment.get("created_at", "unknown"))

            # Truncate long deployment IDs
            if len(dep_id) > 30:
                dep_id = dep_id[:27] + "..."

            click.echo(f"{dep_id:<30} {status:<12} {created:<20}")

    def handle_cancel(self, deployment_id: str, force: bool = False) -> None:
        """Handle cancel command.

        Args:
            deployment_id: Deployment ID to cancel
            force: Force cancellation
        """
        try:
            if not force and not click.confirm(f"Cancel deployment {deployment_id}?"):
                return

            success = self.status_service.cancel_deployment(deployment_id, force)

            if success:
                click.echo(f"Successfully cancelled deployment {deployment_id}")
            else:
                click.echo(f"Failed to cancel deployment {deployment_id}")

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Cancel failed: %s", e)
            raise click.ClickException(f"Cancel failed: {e}") from e

    def handle_logs(
        self,
        deployment_id: str,
        service: str | None = None,
        shard_id: str | None = None,
        since: str = "1h",
        follow: bool = False,
        lines: int = 100,
    ) -> None:
        """Handle logs command.

        Args:
            deployment_id: Deployment ID
            service: Service filter
            shard_id: Shard filter
            since: Time period
            follow: Follow logs
            lines: Number of lines
        """
        try:
            logs = self.log_service.get_deployment_logs(
                deployment_id, service, shard_id, since, follow, lines
            )

            if not logs and not follow:
                click.echo(f"No logs found for deployment {deployment_id}")
                return

            # Display logs
            for entry in logs:
                formatted = self.log_service.format_log_entry(entry)
                click.echo(formatted)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Log retrieval failed: %s", e)
            raise click.ClickException(f"Log retrieval failed: {e}") from e
