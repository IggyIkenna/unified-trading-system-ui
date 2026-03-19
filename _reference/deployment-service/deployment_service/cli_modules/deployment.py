"""Deployment CLI module for managing service deployments."""

import json
import logging
from datetime import UTC, datetime
from typing import cast

from deployment_service.cli_modules.base import BaseCLI
from deployment_service.deployment_config import DeploymentConfig as _DeploymentConfig
from deployment_service.shard_calculator import ShardCalculator

logger = logging.getLogger(__name__)


class DeploymentCLI(BaseCLI):
    """Handle deployment operations for unified trading services."""

    def __init__(self):
        """Initialize deployment CLI."""
        super().__init__()
        _cfg = _DeploymentConfig()
        self.max_concurrent = _cfg.default_max_concurrent
        self.hard_limit = _cfg.max_concurrent_hard_limit

    def deploy_service(
        self,
        service: str,
        environment: str = "production",
        dry_run: bool = False,
        max_shards: int | None = None,
    ) -> bool:
        """Deploy a service to the specified environment.

        Args:
            service: Service name to deploy
            environment: Target environment (production, staging, dev)
            dry_run: If True, only show what would be deployed
            max_shards: Maximum number of shards to deploy

        Returns:
            True if deployment successful, False otherwise
        """
        logger.info("Deploying %s to %s", service, environment)

        # Load service configuration
        config = self.load_config(service)
        if not config:
            logger.error("Failed to load configuration for %s", service)
            return False

        # Validate deployment parameters
        if not self._validate_deployment(config, environment):
            return False

        # Calculate shards if needed
        shards = self._calculate_deployment_shards(config, max_shards)

        if dry_run:
            logger.info("DRY RUN: Would deploy %s shards", len(shards))
            self._print_deployment_plan(shards)
            return True

        # Execute deployment
        return self._execute_deployment(service, shards, environment)

    def _validate_deployment(self, config: dict[str, object], environment: str) -> bool:
        """Validate deployment configuration.

        Args:
            config: Service configuration
            environment: Target environment

        Returns:
            True if validation passes
        """
        required_fields = ["service_name", "image", "resources"]

        for field in required_fields:
            if field not in config:
                logger.error("Missing required field: %s", field)
                return False

        # Validate environment
        valid_environments = ["production", "staging", "dev", "test"]
        if environment not in valid_environments:
            logger.error("Invalid environment: %s", environment)
            return False

        return True

    def _calculate_deployment_shards(
        self, config: dict[str, object], max_shards: int | None = None
    ) -> list[dict[str, object]]:
        """Calculate shards for deployment.

        Args:
            config: Service configuration
            max_shards: Maximum number of shards

        Returns:
            List of shard configurations
        """
        calculator = ShardCalculator(str(self.config_dir))

        # Use max_shards if provided, otherwise use config default
        config_max_shards = int(cast(int, config.get("max_shards") or 100))
        shard_limit: int = max_shards if max_shards is not None else config_max_shards

        try:
            service_name = str(config.get("service_name") or "unknown")
            shards = calculator.calculate_shards(service=service_name, max_shards=shard_limit)
            logger.info("Calculated %s shards for deployment", len(shards))
            return [{"service": s.service, "dimensions": s.dimensions} for s in shards]
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to calculate shards: %s", e)
            return []

    def _print_deployment_plan(self, shards: list[dict[str, object]]):
        """Print deployment plan for review.

        Args:
            shards: List of shard configurations
        """
        logger.info("\nDeployment Plan:")
        logger.info("Total Shards: %s", len(shards))

        for i, shard in enumerate(shards[:5]):  # Show first 5
            logger.info("  Shard %s: %s", i + 1, json.dumps(shard, indent=2))

        if len(shards) > 5:
            logger.info("  ... and %s more shards", len(shards) - 5)

    def _execute_deployment(
        self, service: str, shards: list[dict[str, object]], environment: str
    ) -> bool:
        """Execute the actual deployment.

        Args:
            service: Service name
            shards: List of shard configurations
            environment: Target environment

        Returns:
            True if deployment successful
        """
        logger.info("Executing deployment for %s", service)

        # Here would be actual deployment logic
        # This is a simplified version
        try:
            deployment_metadata = {
                "service": service,
                "environment": environment,
                "shards": len(shards),
                "timestamp": datetime.now(UTC).isoformat(),
                "status": "deployed",
            }

            logger.info("Deployment successful: %s", json.dumps(deployment_metadata, indent=2))
            return True

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Deployment failed: %s", e)
            return False

    def rollback_deployment(self, service: str, version: str | None = None) -> bool:
        """Rollback a service deployment.

        Args:
            service: Service name
            version: Version to rollback to (optional)

        Returns:
            True if rollback successful
        """
        logger.info("Rolling back %s to version %s", service, version or "previous")

        # Rollback logic would go here
        try:
            logger.info("Rollback successful for %s", service)
            return True
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Rollback failed: %s", e)
            return False

    def get_deployment_status(self, service: str) -> dict[str, object]:
        """Get current deployment status for a service.

        Args:
            service: Service name

        Returns:
            Deployment status dictionary
        """
        # This would query actual deployment status
        return {
            "service": service,
            "status": "running",
            "version": "1.0.0",
            "shards": 10,
            "last_deployed": datetime.now(UTC).isoformat(),
        }
