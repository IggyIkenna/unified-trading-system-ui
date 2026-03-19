"""Maintenance command handlers."""

import logging
import subprocess
from datetime import UTC, datetime
from typing import cast

import click

from ...services.deployment_service import DeploymentService
from ...services.status_service import StatusService

logger = logging.getLogger(__name__)


class MaintenanceHandler:
    """Handler for maintenance and cleanup CLI commands."""

    def __init__(self, ctx: click.Context):
        """Initialize maintenance handler.

        Args:
            ctx: Click context with configuration
        """
        self.ctx = ctx
        ctx_obj = cast("dict[str, object]", ctx.obj)
        self.config_dir = cast("str | None", ctx_obj.get("config_dir"))
        self.project_id = cast("str | None", ctx_obj.get("project_id"))
        self.cloud_provider = cast(str, ctx_obj.get("cloud", "gcp"))

        # Initialize services
        self.deployment_service = DeploymentService(self.config_dir)
        self.status_service = StatusService(self.project_id)

    def handle_cleanup_gcs(
        self, state_bucket: str, dry_run: bool = True, older_than_days: int = 30
    ) -> None:
        """Handle GCS cleanup command.

        Args:
            state_bucket: State bucket to clean
            dry_run: Whether to perform dry run
            older_than_days: Clean files older than this many days
        """
        try:
            if not self.project_id:
                raise click.ClickException("Project ID required for GCS cleanup")

            click.echo(f"Cleaning up GCS bucket: {state_bucket}")
            click.echo(f"Removing files older than {older_than_days} days")

            if dry_run:
                click.echo("DRY RUN - No files will be deleted")

            # Get files to clean
            files_to_delete = self._find_old_files(state_bucket, older_than_days)

            if not files_to_delete:
                click.echo("No files found for cleanup")
                return

            click.echo(f"Found {len(files_to_delete)} files for cleanup")

            if dry_run:
                self._show_cleanup_preview(files_to_delete)
            else:
                self._perform_cleanup(state_bucket, files_to_delete)

        except (OSError, ValueError, RuntimeError) as e:
            raise click.ClickException(f"GCS cleanup failed: {e}") from e

    def _find_old_files(self, bucket: str, older_than_days: int) -> list[str]:
        """Find old files in GCS bucket.

        Args:
            bucket: GCS bucket name
            older_than_days: Age threshold in days

        Returns:
            List of file paths to delete
        """
        try:
            # Use gsutil to list old files
            cmd = ["gsutil", "ls", "-l", "-b", f"gs://{bucket}/**"]  # noqa: gs-uri — CLI maintenance handler invokes gsutil directly for bucket ops

            result = subprocess.run(cmd, capture_output=True, text=True, check=True)

            files_to_delete = []
            cutoff_date = datetime.now(UTC).timestamp() - (older_than_days * 24 * 60 * 60)

            for line in result.stdout.split("\n"):
                if line.strip() and not line.startswith("TOTAL"):
                    parts = line.split()
                    if len(parts) >= 3:
                        # Parse file date
                        date_str = parts[1] + " " + parts[2]
                        try:
                            file_date = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S").timestamp()

                            if file_date < cutoff_date:
                                file_path = parts[-1]  # Last part is the file path
                                files_to_delete.append(file_path)
                        except ValueError as e:
                            logger.debug("Skipping item due to %s: %s", type(e).__name__, e)
                            continue

            return files_to_delete

        except subprocess.CalledProcessError as e:
            logger.error("Failed to list GCS files: %s", e)
            return []

    def _show_cleanup_preview(self, files: list[str]) -> None:
        """Show cleanup preview.

        Args:
            files: Files that would be deleted
        """
        click.echo("Files that would be deleted:")
        for file_path in files[:10]:  # Show first 10
            click.echo(f"  {file_path}")

        if len(files) > 10:
            click.echo(f"  ... and {len(files) - 10} more files")

    def _perform_cleanup(self, bucket: str, files: list[str]) -> None:
        """Perform actual cleanup.

        Args:
            bucket: Bucket name
            files: Files to delete
        """
        deleted_count = 0
        failed_count = 0

        for file_path in files:
            try:
                cmd = ["gsutil", "rm", file_path]
                subprocess.run(cmd, check=True, capture_output=True)
                deleted_count += 1

                if deleted_count % 10 == 0:
                    click.echo(f"Deleted {deleted_count}/{len(files)} files")

            except subprocess.CalledProcessError as e:
                logger.error("Failed to delete %s: %s", file_path, e)
                failed_count += 1

        click.echo(f"Cleanup completed: {deleted_count} deleted, {failed_count} failed")

    def handle_fix_stale(self, deployment_id: str | None = None, auto_fix: bool = False) -> None:
        """Handle fix stale deployments command.

        Args:
            deployment_id: Specific deployment to fix
            auto_fix: Automatically fix without confirmation
        """
        try:
            if deployment_id:
                self._fix_single_deployment(deployment_id, auto_fix)
            else:
                self._fix_all_stale_deployments(auto_fix)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Fix stale failed: %s", e)
            raise click.ClickException(f"Fix stale failed: {e}") from e

    def _fix_single_deployment(self, deployment_id: str, auto_fix: bool) -> None:
        """Fix a single stale deployment.

        Args:
            deployment_id: Deployment ID
            auto_fix: Auto-fix flag
        """
        status = self.status_service.get_deployment_status(deployment_id)
        current_status = status.get("status", "unknown")

        if current_status not in ("stale", "stuck", "zombie"):
            click.echo(f"Deployment {deployment_id} is not stale (status: {current_status})")
            return

        if not auto_fix and not click.confirm(f"Fix stale deployment {deployment_id}?"):
            return

        # Perform fix
        click.echo(f"Fixing stale deployment {deployment_id}...")

        # This would contain actual fix logic
        success = self._perform_stale_fix(deployment_id)

        if success:
            click.echo(f"Successfully fixed deployment {deployment_id}")
        else:
            click.echo(f"Failed to fix deployment {deployment_id}")

    def _fix_all_stale_deployments(self, auto_fix: bool) -> None:
        """Fix all stale deployments.

        Args:
            auto_fix: Auto-fix flag
        """
        # Get stale deployments
        stale_deployments = self.status_service.list_deployments(status_filter="stale")

        if not stale_deployments:
            click.echo("No stale deployments found")
            return

        click.echo(f"Found {len(stale_deployments)} stale deployments")

        if not auto_fix and not click.confirm(
            f"Fix all {len(stale_deployments)} stale deployments?"
        ):
            return

        fixed_count = 0
        failed_count = 0

        for deployment in stale_deployments:
            deployment_id = cast(str, deployment.get("deployment_id") or "")
            try:
                success = self._perform_stale_fix(deployment_id)
                if success:
                    fixed_count += 1
                else:
                    failed_count += 1
            except (OSError, ValueError, RuntimeError) as e:
                logger.error("Failed to fix %s: %s", deployment_id, e)
                failed_count += 1

        click.echo(f"Fixed {fixed_count} deployments, {failed_count} failed")

    def _perform_stale_fix(self, deployment_id: str) -> bool:
        """Perform the actual stale fix.

        Args:
            deployment_id: Deployment ID

        Returns:
            True if successful
        """
        # Placeholder for actual fix logic
        logger.info("Fixing stale deployment %s", deployment_id)
        return True

    def handle_validate_buckets(
        self, service: str, categories: tuple[str, ...] = (), fix_issues: bool = False
    ) -> None:
        """Handle bucket validation command.

        Args:
            service: Service to validate buckets for
            categories: Categories to validate
            fix_issues: Whether to fix found issues
        """
        try:
            # Validate service
            self.deployment_service.validate_service(service)

            click.echo(f"Validating buckets for service: {service}")

            if categories:
                click.echo(f"Categories: {', '.join(categories)}")

            # Get service configuration
            service_info = self.deployment_service.get_service_info(service)
            config = service_info.get("config") or {}

            # Find bucket configurations
            bucket_configs = self._extract_bucket_configs(
                cast("dict[str, object]", config), categories
            )

            if not bucket_configs:
                click.echo("No bucket configurations found")
                return

            # Validate each bucket
            issues_found = []

            for bucket_name, bucket_config in bucket_configs.items():
                issues = self._validate_single_bucket(bucket_name, bucket_config)
                issues_found.extend(issues)

            # Report results
            if not issues_found:
                click.echo("All bucket validations passed!")
            else:
                click.echo(f"Found {len(issues_found)} bucket issues:")
                for issue in issues_found:
                    click.echo(f"  - {issue}")

                if fix_issues:
                    self._fix_bucket_issues(issues_found)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Bucket validation failed: %s", e)
            raise click.ClickException(f"Bucket validation failed: {e}") from e

    def _extract_bucket_configs(
        self, config: dict[str, object], categories: tuple[str, ...]
    ) -> dict[str, dict[str, object]]:
        """Extract bucket configurations from service config.

        Args:
            config: Service configuration
            categories: Category filters

        Returns:
            Dictionary of bucket configurations
        """
        bucket_configs = {}

        # Look for bucket-related configuration
        for key, value in config.items():
            if "bucket" in key.lower():
                bucket_configs[key] = {"name": value, "type": "generic"}

        # Add category-specific buckets if specified
        if categories:
            for category in categories:
                bucket_key = f"{category}_bucket"
                if bucket_key in config:
                    bucket_configs[bucket_key] = {
                        "name": config[bucket_key],
                        "type": "category",
                        "category": category,
                    }

        return bucket_configs

    def _validate_single_bucket(
        self, bucket_name: str, bucket_config: dict[str, object]
    ) -> list[str]:
        """Validate a single bucket.

        Args:
            bucket_name: Bucket name
            bucket_config: Bucket configuration

        Returns:
            List of validation issues
        """
        issues = []

        try:
            bucket_name_val = cast(str, bucket_config["name"])
            # Check if bucket exists
            if not self._bucket_exists(bucket_name_val):
                issues.append(f"Bucket does not exist: {bucket_name_val}")

            # Check bucket permissions
            if not self._check_bucket_permissions(bucket_name_val):
                issues.append(f"Insufficient permissions for bucket: {bucket_name_val}")

            # Check bucket naming convention
            naming_issues = self._check_bucket_naming(bucket_name_val)
            issues.extend(naming_issues)

        except (OSError, ValueError, RuntimeError) as e:
            issues.append(f"Error validating bucket {bucket_name}: {e}")

        return issues

    def _bucket_exists(self, bucket_name: str) -> bool:
        """Check if bucket exists.

        Args:
            bucket_name: Bucket name

        Returns:
            True if bucket exists
        """
        try:
            if self.cloud_provider == "gcp":
                cmd = ["gsutil", "ls", "-b", f"gs://{bucket_name}"]  # noqa: gs-uri — CLI maintenance handler invokes gsutil directly for bucket ops
            else:
                cmd = ["aws", "s3", "ls", f"s3://{bucket_name}"]  # noqa: gs-uri — CLI maintenance handler invokes aws s3 directly for bucket ops

            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0

        except (OSError, ValueError, RuntimeError):
            return False

    def _check_bucket_permissions(self, bucket_name: str) -> bool:
        """Check bucket permissions.

        Args:
            bucket_name: Bucket name

        Returns:
            True if permissions are adequate
        """
        try:
            if self.cloud_provider == "gcp":
                cmd = ["gsutil", "ls", f"gs://{bucket_name}"]  # noqa: gs-uri — CLI maintenance handler invokes gsutil directly for bucket ops
            else:
                cmd = ["aws", "s3", "ls", f"s3://{bucket_name}"]  # noqa: gs-uri — CLI maintenance handler invokes aws s3 directly for bucket ops

            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0

        except (OSError, ValueError, RuntimeError):
            return False

    def _check_bucket_naming(self, bucket_name: str) -> list[str]:
        """Check bucket naming convention.

        Args:
            bucket_name: Bucket name

        Returns:
            List of naming issues
        """
        issues = []

        # Check basic naming rules
        if not bucket_name:
            issues.append("Bucket name is empty")
        elif len(bucket_name) < 3:
            issues.append("Bucket name too short")
        elif len(bucket_name) > 63:
            issues.append("Bucket name too long")

        # Check for invalid characters
        if not bucket_name.replace("-", "").replace("_", "").replace(".", "").isalnum():
            issues.append("Bucket name contains invalid characters")

        return issues

    def _fix_bucket_issues(self, issues: list[str]) -> None:
        """Fix bucket issues.

        Args:
            issues: List of issues to fix
        """
        click.echo("Attempting to fix bucket issues...")

        for issue in issues:
            if "does not exist" in issue:
                # Extract bucket name and create bucket
                bucket_name = issue.split(":")[-1].strip()
                self._create_bucket(bucket_name)
            elif "permissions" in issue:
                click.echo(f"Cannot auto-fix permission issue: {issue}")
            else:
                click.echo(f"Cannot auto-fix issue: {issue}")

    def _create_bucket(self, bucket_name: str) -> None:
        """Create a new bucket.

        Args:
            bucket_name: Name of bucket to create
        """
        try:
            if self.cloud_provider == "gcp":
                cmd = ["gsutil", "mb", f"gs://{bucket_name}"]  # noqa: gs-uri — CLI maintenance handler invokes gsutil directly for bucket creation
            else:
                cmd = ["aws", "s3", "mb", f"s3://{bucket_name}"]  # noqa: gs-uri — CLI maintenance handler invokes aws s3 directly for bucket creation

            subprocess.run(cmd, check=True, capture_output=True)
            click.echo(f"Created bucket: {bucket_name}")

        except subprocess.CalledProcessError as e:
            click.echo(f"Failed to create bucket {bucket_name}: {e}")

    def handle_retry_failed(
        self, deployment_id: str, shard_id: str | None = None, max_retries: int = 3
    ) -> None:
        """Handle retry failed command.

        Args:
            deployment_id: Deployment ID to retry
            shard_id: Specific shard to retry
            max_retries: Maximum retry attempts
        """
        try:
            click.echo(f"Retrying failed deployment: {deployment_id}")

            if shard_id:
                click.echo(f"Retrying specific shard: {shard_id}")
                self._retry_single_shard(deployment_id, shard_id, max_retries)
            else:
                self._retry_all_failed_shards(deployment_id, max_retries)

        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Retry failed: %s", e)
            raise click.ClickException(f"Retry failed: {e}") from e

    def _retry_single_shard(self, deployment_id: str, shard_id: str, max_retries: int) -> None:
        """Retry a single failed shard.

        Args:
            deployment_id: Deployment ID
            shard_id: Shard ID
            max_retries: Max retries
        """
        for attempt in range(max_retries):
            click.echo(f"Retry attempt {attempt + 1}/{max_retries} for shard {shard_id}")

            success = self._perform_shard_retry(deployment_id, shard_id)

            if success:
                click.echo(f"Successfully retried shard {shard_id}")
                return

            click.echo(f"Retry {attempt + 1} failed for shard {shard_id}")

        click.echo(f"All retries exhausted for shard {shard_id}")

    def _retry_all_failed_shards(self, deployment_id: str, max_retries: int) -> None:
        """Retry all failed shards in a deployment.

        Args:
            deployment_id: Deployment ID
            max_retries: Max retries
        """
        # Get failed shards
        status = self.status_service.get_deployment_status(deployment_id)
        shards = cast("list[dict[str, object]]", status.get("shards") or [])
        failed_shards = [s for s in shards if s.get("status") == "failed"]

        if not failed_shards:
            click.echo("No failed shards found")
            return

        click.echo(f"Retrying {len(failed_shards)} failed shards")

        success_count = 0
        for shard in failed_shards:
            shard_id = cast(str, shard.get("shard_id") or "")

            for _attempt in range(max_retries):
                success = self._perform_shard_retry(deployment_id, shard_id)
                if success:
                    success_count += 1
                    break

        click.echo(f"Successfully retried {success_count}/{len(failed_shards)} shards")

    def _perform_shard_retry(self, deployment_id: str, shard_id: str) -> bool:
        """Perform actual shard retry.

        Args:
            deployment_id: Deployment ID
            shard_id: Shard ID

        Returns:
            True if successful
        """
        # Placeholder for actual retry logic
        logger.info("Retrying shard %s in deployment %s", shard_id, deployment_id)
        return True
