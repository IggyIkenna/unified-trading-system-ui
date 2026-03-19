"""
Progress Display - Rich terminal progress display for deployments.

Shows real-time progress with:
- Overall progress bar
- Per-shard status table
- Error summaries
- ETA calculations
"""

import logging
from datetime import UTC, datetime

from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
    TimeElapsedColumn,
    TimeRemainingColumn,
)
from rich.table import Table
from rich.text import Text

logger = logging.getLogger(__name__)

from .state import DeploymentState, ShardState, ShardStatus


def _render_to_str(console: Console, renderable) -> str:
    """Capture Rich renderable to string for logging."""
    with console.capture() as capture:
        console.print(renderable)
    return capture.get()


class ProgressDisplay:
    """
    Rich terminal display for deployment progress.

    Shows:
    - Deployment header with service/compute info
    - Overall progress bar
    - Shard status table (paginated)
    - Error summary
    - ETA based on completed shards
    """

    def __init__(self, console: Console | None = None):
        """
        Initialize the progress display.

        Args:
            console: Rich console (creates one if not provided)
        """
        self.console = console or Console()
        self._start_time: datetime | None = None
        self._completed_times: list[float] = []

    def display_deployment_start(self, state: DeploymentState) -> None:
        """
        Display deployment start information.

        Args:
            state: DeploymentState with deployment info
        """
        self._start_time = datetime.now(UTC)

        panel = Panel(
            f"[bold cyan]Deployment: {state.deployment_id}[/bold cyan]\n"
            f"Service: [green]{state.service}[/green] | "
            f"Compute: [yellow]{state.compute_type}[/yellow]\n"
            f"Date Range: {state.start_date or 'N/A'} to {state.end_date or 'N/A'}\n"
            f"Total Shards: [bold]{state.total_shards}[/bold]",
            title="Deployment Started",
            border_style="cyan",
        )
        logger.info("\n%s", _render_to_str(self.console, panel))

    def display_progress(self, state: DeploymentState, max_rows: int = 15) -> None:
        """
        Display current progress (non-live, for periodic updates).

        Args:
            state: Current DeploymentState
            max_rows: Maximum shard rows to display
        """
        # Progress bar
        progress = self._create_progress_bar()
        progress.add_task(
            "[cyan]Progress",
            total=state.total_shards,
            completed=len(state.succeeded_shards) + len(state.failed_shards),
        )

        logger.info("\n%s", _render_to_str(self.console, progress))

        # Shard table
        table = self._create_shard_table(state.shards, max_rows)
        logger.info("\n%s", _render_to_str(self.console, table))

        # Stats
        self._print_stats(state)

        # Errors
        if state.failed_shards:
            self._print_errors(state.failed_shards)

    def create_live_display(self, state: DeploymentState) -> Live:
        """
        Create a Live display for real-time updates.

        Args:
            state: Initial DeploymentState

        Returns:
            Rich Live context manager
        """
        return Live(
            self._render_full_display(state),
            console=self.console,
            refresh_per_second=1,
        )

    def update_live(self, live: Live, state: DeploymentState) -> None:
        """
        Update a live display with new state.

        Args:
            live: Live display to update
            state: Updated DeploymentState
        """
        live.update(self._render_full_display(state))

    def _render_full_display(self, state: DeploymentState) -> Table:
        """Render the full display as a single renderable."""
        # Main container table (no borders)
        container = Table.grid(padding=(0, 0))

        # Header
        header = Text()
        header.append("Deployment: ", style="bold")
        header.append(f"{state.deployment_id}\n", style="cyan")
        header.append(f"Service: {state.service}", style="green")
        header.append(f" | Compute: {state.compute_type}", style="yellow")
        container.add_row(Panel(header, border_style="cyan"))

        # Progress bar
        progress_text = self._get_progress_text(state)
        container.add_row(progress_text)

        # Shard table (compact)
        shard_table = self._create_shard_table(state.shards, max_rows=10)
        container.add_row(shard_table)

        # Stats line
        stats = self._get_stats_text(state)
        container.add_row(stats)

        # Errors (if any)
        if state.failed_shards:
            error_text = Text()
            error_text.append(
                f"\nErrors: {len(state.failed_shards)} shards failed", style="red bold"
            )
            container.add_row(error_text)

        return container

    def _create_progress_bar(self) -> Progress:
        """Create a progress bar."""
        return Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(bar_width=40),
            TaskProgressColumn(),
            TextColumn("[cyan]{task.completed}/{task.total}[/cyan]"),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=self.console,
        )

    def _get_progress_text(self, state: DeploymentState) -> Text:
        """Get progress as formatted text."""
        completed = len(state.succeeded_shards) + len(state.failed_shards)
        percent = (completed / state.total_shards * 100) if state.total_shards > 0 else 0

        # ASCII progress bar
        bar_width = 40
        filled = int(bar_width * completed / state.total_shards) if state.total_shards > 0 else 0
        bar = "[" + "#" * filled + "-" * (bar_width - filled) + "]"

        text = Text()
        text.append(f"\nProgress: {bar} ", style="cyan")
        text.append(f"{completed}/{state.total_shards} ", style="bold")
        text.append(f"({percent:.1f}%)\n", style="green")

        return text

    def _create_shard_table(self, shards: list[ShardState], max_rows: int = 15) -> Table:
        """Create a table showing shard status."""
        table = Table(title="Shards", box=None, padding=(0, 1))
        table.add_column("Shard", style="cyan", width=25)
        table.add_column("Status", width=12)
        table.add_column("Retries", width=8)
        table.add_column("Duration", width=12)
        table.add_column("Job ID", style="bright_black", width=30)

        # Show running first, then pending, then completed
        sorted_shards = sorted(
            shards,
            key=lambda s: (
                0
                if s.status == ShardStatus.RUNNING
                else (
                    1
                    if s.status == ShardStatus.PENDING
                    else 2
                    if s.status == ShardStatus.FAILED
                    else 3
                )
            ),
        )

        for shard in sorted_shards[:max_rows]:
            status_style = self._get_status_style(shard.status)
            status_icon = self._get_status_icon(shard.status)
            duration = self._format_duration(shard)

            # Show retry count with color indicator
            retry_text = ""
            if shard.retries > 0:
                if shard.status == ShardStatus.SUCCEEDED:
                    retry_text = Text(f"{shard.retries}→OK", style="green")  # Retried and succeeded
                elif shard.status == ShardStatus.FAILED:
                    retry_text = Text(f"{shard.retries}→X", style="red")  # Retried and still failed
                else:
                    retry_text = Text(f"{shard.retries}", style="yellow")  # Still retrying

            table.add_row(
                shard.shard_id[:25],
                Text(f"{status_icon} {shard.status.value}", style=status_style),
                retry_text,
                duration,
                (shard.job_id or "")[:30],
            )

        if len(shards) > max_rows:
            table.add_row(
                f"... and {len(shards) - max_rows} more",
                "",
                "",
                "",
                "",
            )

        return table

    def _get_status_style(self, status: ShardStatus) -> str:
        """Get style for a status."""
        return {
            ShardStatus.PENDING: "bright_black",
            ShardStatus.RUNNING: "yellow",
            ShardStatus.SUCCEEDED: "green",
            ShardStatus.FAILED: "red",
            ShardStatus.CANCELLED: "bright_black",
        }.get(status, "white")

    def _get_status_icon(self, status: ShardStatus) -> str:
        """Get icon for a status."""
        return {
            ShardStatus.PENDING: "...",
            ShardStatus.RUNNING: ">>>",
            ShardStatus.SUCCEEDED: "[OK]",
            ShardStatus.FAILED: "[X]",
            ShardStatus.CANCELLED: "[-]",
        }.get(status, "?")

    def _format_duration(self, shard: ShardState) -> str:
        """Format shard duration."""
        if not shard.start_time:
            return "-"

        start = datetime.fromisoformat(shard.start_time)
        # Ensure timezone-aware for comparison
        if start.tzinfo is None:
            start = start.replace(tzinfo=UTC)

        if shard.end_time:
            end = datetime.fromisoformat(shard.end_time)
            if end.tzinfo is None:
                end = end.replace(tzinfo=UTC)
        else:
            end = datetime.now(UTC)

        duration = end - start
        minutes = int(duration.total_seconds() // 60)
        seconds = int(duration.total_seconds() % 60)

        if minutes > 0:
            return f"{minutes}m {seconds}s"
        return f"{seconds}s"

    def _get_stats_text(self, state: DeploymentState) -> Text:
        """Get stats as formatted text."""
        succeeded = len(state.succeeded_shards)
        failed = len(state.failed_shards)
        running = len(state.running_shards)
        pending = len(state.pending_shards)

        # Count retries
        retried_succeeded = sum(1 for s in state.succeeded_shards if s.retries > 0)
        retried_failed = sum(1 for s in state.failed_shards if s.retries > 0)

        # Calculate ETA
        eta = self._calculate_eta(state)

        text = Text()
        text.append(f"\nSucceeded: {succeeded}", style="green")
        if retried_succeeded > 0:
            text.append(f" ({retried_succeeded} after retry)", style="green")
        text.append(f" | Running: {running}", style="yellow")
        text.append(f" | Pending: {pending}", style="bright_black")
        text.append(f" | Failed: {failed}", style="red" if failed > 0 else "bright_black")
        if retried_failed > 0:
            text.append(f" (after {retried_failed} retries)", style="red")

        if eta:
            text.append(f" | ETA: {eta}", style="cyan")

        text.append("\n")
        return text

    def _print_stats(self, state: DeploymentState) -> None:
        """Print stats line."""
        logger.info("%s", _render_to_str(self.console, self._get_stats_text(state)))

    def _print_errors(self, failed_shards: list[ShardState]) -> None:
        """Print error summary."""
        lines = ["Errors:"]
        for shard in failed_shards[:5]:
            lines.append(f"  {shard.shard_id}: {shard.error_message or 'Unknown error'}")
        if len(failed_shards) > 5:
            lines.append(f"  ... and {len(failed_shards) - 5} more errors")
        logger.info("\n%s", "\n".join(lines))

    def _calculate_eta(self, state: DeploymentState) -> str | None:
        """Calculate estimated time remaining."""
        completed = len(state.succeeded_shards)
        remaining = len(state.pending_shards) + len(state.running_shards)

        if completed == 0 or remaining == 0:
            return None

        # Calculate average duration from completed shards
        durations = []
        for shard in state.succeeded_shards:
            if shard.start_time and shard.end_time:
                start = datetime.fromisoformat(shard.start_time)
                end = datetime.fromisoformat(shard.end_time)
                durations.append((end - start).total_seconds())

        if not durations:
            return None

        avg_duration = sum(durations) / len(durations)

        # All shards run in parallel, so ETA is based on average duration
        # of running shards (they should all finish around the same time)
        eta_seconds = avg_duration

        if eta_seconds < 60:
            return f"{int(eta_seconds)}s"
        elif eta_seconds < 3600:
            return f"{int(eta_seconds // 60)}m"
        else:
            hours = int(eta_seconds // 3600)
            minutes = int((eta_seconds % 3600) // 60)
            return f"{hours}h {minutes}m"

    def display_completion(self, state: DeploymentState) -> None:
        """
        Display deployment completion summary.

        Args:
            state: Final DeploymentState
        """
        succeeded = len(state.succeeded_shards)
        failed = len(state.failed_shards)
        total = state.total_shards

        if failed == 0:
            style = "green"
            title = "Deployment Completed Successfully"
            icon = "[OK]"
        else:
            style = "yellow" if succeeded > 0 else "red"
            title = "Deployment Completed with Errors"
            icon = "[!!]"

        # Calculate total duration
        if self._start_time:
            duration = datetime.now(UTC) - self._start_time
            duration_str = str(duration).split(".")[0]
        else:
            duration_str = "N/A"

        panel = Panel(
            f"[bold]{icon} {title}[/bold]\n\n"
            f"Succeeded: [green]{succeeded}[/green] / {total}\n"
            f"Failed: [red]{failed}[/red] / {total}\n"
            f"Total Duration: {duration_str}",
            border_style=style,
        )
        logger.info("\n%s", _render_to_str(self.console, panel))

        if failed > 0:
            logger.info("To retry failed shards: python deploy.py resume %s", state.deployment_id)
