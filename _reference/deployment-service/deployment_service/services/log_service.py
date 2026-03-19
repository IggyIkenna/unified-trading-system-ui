"""Log service for handling deployment log operations."""

import json
import logging
import subprocess
from typing import cast

import click

logger = logging.getLogger(__name__)


class LogService:
    """Service for handling deployment log operations."""

    def __init__(self, project_id: str | None = None):
        """Initialize log service.

        Args:
            project_id: GCP project ID for log queries
        """
        self.project_id = project_id

    def get_deployment_logs(
        self,
        deployment_id: str,
        service: str | None = None,
        shard_id: str | None = None,
        since: str = "1h",
        follow: bool = False,
        lines: int = 100,
    ) -> list[dict[str, object]]:
        """Get logs for a deployment.

        Args:
            deployment_id: Deployment ID to get logs for
            service: Filter by service name
            shard_id: Filter by specific shard ID
            since: Time period to query (e.g., '1h', '30m')
            follow: Whether to follow logs in real-time
            lines: Number of log lines to return

        Returns:
            List of log entries
        """
        if not self.project_id:
            raise click.ClickException("Project ID required for log queries")

        try:
            return self._query_cloud_logs(deployment_id, service, shard_id, since, follow, lines)
        except (OSError, ValueError, RuntimeError) as e:
            logger.error("Failed to get logs for deployment %s: %s", deployment_id, e)
            return []

    def _query_cloud_logs(
        self,
        deployment_id: str,
        service: str | None,
        shard_id: str | None,
        since: str,
        follow: bool,
        lines: int,
    ) -> list[dict[str, object]]:
        """Query Cloud Logging for deployment logs.

        Args:
            deployment_id: Deployment ID
            service: Service filter
            shard_id: Shard ID filter
            since: Time period
            follow: Follow logs
            lines: Number of lines

        Returns:
            List of log entries
        """
        # Build gcloud logging command
        cmd = [
            "gcloud",
            "logging",
            "read",
            f'resource.labels.deployment_id=\\"{deployment_id}\\"',
            f"--project={self.project_id}",
            f"--limit={lines}",
            "--format=json",
        ]

        if service:
            cmd.append(f'AND labels.service=\\"{service}\\"')

        if shard_id:
            cmd.append(f'AND labels.shard_id=\\"{shard_id}\\"')

        # Add time filter
        if since:
            cmd.append(f'AND timestamp >= \\"{since}\\"')

        try:
            if follow:
                return self._follow_logs(cmd)
            else:
                return self._get_static_logs(cmd)
        except subprocess.CalledProcessError as e:
            logger.error("gcloud command failed: %s", e)
            return []

    def _get_static_logs(self, cmd: list[str]) -> list[dict[str, object]]:
        """Get static log entries.

        Args:
            cmd: gcloud command

        Returns:
            List of log entries
        """
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)

        if result.stdout:
            return cast(list[dict[str, object]], json.loads(result.stdout))
        return []

    def _follow_logs(self, cmd: list[str]) -> list[dict[str, object]]:
        """Follow logs in real-time.

        Args:
            cmd: gcloud command

        Returns:
            List of log entries (empty for follow mode)
        """
        # Add follow flag
        cmd.append("--follow")

        # Start streaming process
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        try:
            stdout = process.stdout
            if stdout is None:
                return []
            for line in iter(stdout.readline, ""):
                if line.strip():
                    try:
                        log_entry = cast(dict[str, object], json.loads(line))
                        click.echo(self._format_log_entry(log_entry))
                    except json.JSONDecodeError:
                        click.echo(line.strip())
        except KeyboardInterrupt:
            process.terminate()

        return []  # Follow mode doesn't return entries

    def format_log_entry(self, entry: dict[str, object]) -> str:
        """Public wrapper for log entry formatting."""
        return self._format_log_entry(entry)

    def _format_log_entry(self, entry: dict[str, object]) -> str:
        """Format a single log entry for display.

        Args:
            entry: Log entry dictionary

        Returns:
            Formatted log string
        """
        timestamp = entry.get("timestamp") or ""
        severity = entry.get("severity", "INFO")
        message = entry.get("textPayload", entry.get("jsonPayload") or {})

        if isinstance(message, dict):
            message = json.dumps(message, indent=2)

        return f"[{timestamp}] {severity}: {message}"

    def analyze_logs_for_errors(
        self, deployment_id: str, service: str | None = None
    ) -> dict[str, object]:
        """Analyze logs for common errors and patterns.

        Args:
            deployment_id: Deployment ID
            service: Service filter

        Returns:
            Analysis results
        """
        logs = self.get_deployment_logs(deployment_id, service=service, since="24h", lines=1000)

        total_entries: int = len(logs)
        error_count: int = 0
        warning_count: int = 0
        common_errors: dict[str, int] = {}

        error_patterns = [
            "failed",
            "error",
            "exception",
            "timeout",
            "connection refused",
            "out of memory",
            "disk full",
        ]

        for entry in logs:
            severity = str(entry.get("severity") or "").upper()
            message = str(entry.get("textPayload") or entry.get("jsonPayload") or "")

            if severity in ("ERROR", "CRITICAL"):
                error_count += 1

                # Track common error messages
                for pattern in error_patterns:
                    if pattern.lower() in message.lower():
                        if pattern not in common_errors:
                            common_errors[pattern] = 0
                        common_errors[pattern] += 1

            elif severity == "WARNING":
                warning_count += 1

        # Find the most common errors
        top_errors: list[tuple[str, int]] = sorted(
            common_errors.items(), key=lambda x: x[1], reverse=True
        )[:5]

        analysis: dict[str, object] = {
            "total_entries": total_entries,
            "error_count": error_count,
            "warning_count": warning_count,
            "common_errors": common_errors,
            "error_patterns": [],
            "top_errors": top_errors,
        }

        return analysis
