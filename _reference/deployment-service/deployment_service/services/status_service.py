"""Status service for handling deployment status operations."""

import logging
from datetime import UTC, datetime
from typing import cast

import click

logger = logging.getLogger(__name__)


class StatusService:
    """Service for handling deployment status operations."""

    def __init__(self, project_id: str | None = None):
        """Initialize status service.

        Args:
            project_id: GCP project ID for status queries
        """
        self.project_id = project_id

    def get_deployment_status(self, deployment_id: str) -> dict[str, object]:
        """Get status of a specific deployment.

        Args:
            deployment_id: Deployment ID to check

        Returns:
            Deployment status information
        """
        try:
            return self._fetch_deployment_status(deployment_id)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to get status for deployment %s: %s", deployment_id, e)
            return {"deployment_id": deployment_id, "status": "unknown", "error": str(e)}

    def _fetch_deployment_status(self, deployment_id: str) -> dict[str, object]:
        """Fetch deployment status from backend.

        Args:
            deployment_id: Deployment ID

        Returns:
            Status information
        """
        # This would typically query the deployment backend
        # For now, return a placeholder structure
        return {
            "deployment_id": deployment_id,
            "status": "running",  # running, completed, failed, cancelled
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
            "shards": self._get_shard_status(deployment_id),
            "summary": {
                "total_shards": 0,
                "completed_shards": 0,
                "failed_shards": 0,
                "running_shards": 0,
            },
        }

    def _get_shard_status(self, deployment_id: str) -> list[dict[str, object]]:
        """Get status of individual shards.

        Args:
            deployment_id: Deployment ID

        Returns:
            List of shard status information
        """
        # Placeholder for shard status
        return []

    def list_deployments(
        self, status_filter: str | None = None, limit: int = 50
    ) -> list[dict[str, object]]:
        """List deployments with optional status filtering.

        Args:
            status_filter: Filter by deployment status
            limit: Maximum number of deployments to return

        Returns:
            List of deployment summaries
        """
        try:
            deployments = self._fetch_deployments_list(limit)

            if status_filter:
                deployments = [
                    d
                    for d in deployments
                    if str(d.get("status") or "").lower() == status_filter.lower()
                ]

            return deployments
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to list deployments: %s", e)
            return []

    def _fetch_deployments_list(self, limit: int) -> list[dict[str, object]]:
        """Fetch list of deployments from backend.

        Args:
            limit: Maximum number to fetch

        Returns:
            List of deployment information
        """
        # Placeholder - would typically query deployment storage
        return []

    def cancel_deployment(self, deployment_id: str, force: bool = False) -> bool:
        """Cancel a running deployment.

        Args:
            deployment_id: Deployment ID to cancel
            force: Force cancellation even if deployment is in progress

        Returns:
            True if cancellation was successful
        """
        try:
            status = self.get_deployment_status(deployment_id)
            current_status = status.get("status") or ""

            if current_status in ("completed", "failed", "cancelled") and not force:
                raise click.ClickException(
                    f"Deployment {deployment_id} is already {current_status}"
                )

            # Perform cancellation
            success = self._cancel_deployment_backend(deployment_id, force)

            if success:
                logger.info("Successfully cancelled deployment %s", deployment_id)
            else:
                logger.error("Failed to cancel deployment %s", deployment_id)

            return success

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Error cancelling deployment %s: %s", deployment_id, e)
            return False

    def _cancel_deployment_backend(self, deployment_id: str, force: bool) -> bool:
        """Cancel deployment in backend system.

        Args:
            deployment_id: Deployment ID
            force: Force cancellation

        Returns:
            True if successful
        """
        # Placeholder for backend cancellation logic
        logger.info("Cancelling deployment %s (force=%s)", deployment_id, force)
        return True

    def display_hierarchical_status(self, deployment_id: str, show_details: bool = False) -> None:
        """Display deployment status in hierarchical format.

        Args:
            deployment_id: Deployment ID
            show_details: Show detailed shard information
        """
        status = self.get_deployment_status(deployment_id)

        click.echo(f"Deployment: {deployment_id}")
        click.echo(f"Status: {status.get('status', 'unknown')}")
        click.echo(f"Created: {status.get('created_at', 'unknown')}")
        click.echo(f"Updated: {status.get('updated_at', 'unknown')}")

        summary = cast(dict[str, object], status.get("summary") or {})
        if summary:
            click.echo("\nShard Summary:")
            click.echo(f"  Total: {summary.get('total_shards', 0)}")
            click.echo(f"  Completed: {summary.get('completed_shards', 0)}")
            click.echo(f"  Failed: {summary.get('failed_shards', 0)}")
            click.echo(f"  Running: {summary.get('running_shards', 0)}")

        if show_details:
            shards = cast(list[dict[str, object]], status.get("shards") or [])
            if shards:
                click.echo("\nShard Details:")
                for shard in shards:
                    shard_id = shard.get("shard_id", "unknown")
                    shard_status = shard.get("status", "unknown")
                    click.echo(f"  {shard_id}: {shard_status}")

    def refresh_deployment_status(self, deployment_id: str) -> dict[str, object]:
        """Refresh and return deployment status.

        Args:
            deployment_id: Deployment ID to refresh

        Returns:
            Updated deployment status
        """
        try:
            # Force refresh from backend
            status = self._force_refresh_status(deployment_id)
            logger.info("Refreshed status for deployment %s", deployment_id)
            return status
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to refresh status for %s: %s", deployment_id, e)
            return self.get_deployment_status(deployment_id)

    def _force_refresh_status(self, deployment_id: str) -> dict[str, object]:
        """Force refresh status from backend.

        Args:
            deployment_id: Deployment ID

        Returns:
            Refreshed status
        """
        # Placeholder for forced refresh logic
        return self._fetch_deployment_status(deployment_id)
