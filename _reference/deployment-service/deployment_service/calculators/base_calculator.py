"""
Base classes and interfaces for shard calculation.

This module contains the fundamental data structures and exception classes
used throughout the shard calculation system.
"""

import logging
from dataclasses import dataclass
from typing import cast

logger = logging.getLogger(__name__)


class ShardLimitExceeded(Exception):
    """Raised when calculated shards exceed the max_shards limit."""

    def __init__(
        self,
        total_shards: int,
        max_shards: int,
        service: str,
        breakdown: dict[str, int],
    ):
        self.total_shards = total_shards
        self.max_shards = max_shards
        self.service = service
        self.breakdown = breakdown

        message = (
            f"\n{'=' * 60}\n"
            f"SHARD LIMIT EXCEEDED for {service}\n"
            f"{'=' * 60}\n"
            f"Total shards: {total_shards}\n"
            f"Max allowed:  {max_shards}\n"
            f"\nDimension breakdown:\n"
        )
        for dim, count in breakdown.items():
            message += f"  - {dim}: {count} values\n"

        message += (
            f"\nTo reduce shards, try:\n"
            f"  1. Reduce date range (--start-date / --end-date)\n"
            f"  2. Filter by category (--category CEFI)\n"
            f"  3. Filter by venue (--venue BINANCE-FUTURES)\n"
            f"  4. Increase granularity in config (daily -> weekly)\n"
            f"  5. Increase --max-shards if quota allows\n"
            f"{'=' * 60}"
        )
        super().__init__(message)


@dataclass
class Shard:
    """Represents a single deployment shard with its dimension values."""

    service: str
    shard_index: int
    total_shards: int
    dimensions: dict[str, object]
    cli_args_config: dict[str, str] | None = None  # CLI args mapping from service config
    cli_command: str = ""

    def __post_init__(self):
        """Generate CLI command from dimensions."""
        if not self.cli_command:
            self.cli_command = self._generate_cli_command()

    def _generate_cli_command(self) -> str:
        """Generate the CLI command for this shard."""
        # Base command
        parts = [f"python -m {self.service.replace('-', '_')}"]

        cli_args = self.cli_args_config or {}

        # Add dimension values as CLI args
        for dim_name, dim_value in self.dimensions.items():
            if dim_name == "date" and isinstance(dim_value, dict):
                # "none" granularity: no date args at all
                # (service fetches all data without date filter)
                dim_value_str = cast(dict[str, str], dim_value)
                if dim_value_str.get("type") == "none":
                    continue

                # Date range - check for custom mappings
                start_arg = cli_args.get("start_date", "--start-date")
                end_arg = cli_args.get("end_date", "--end-date")

                # Check if service needs ISO datetime format (has --start/--end style args)
                if start_arg == "--start":
                    # Convert to ISO datetime format for services like execution-service
                    start_val = f"{dim_value_str['start']}T00:00:00Z"
                    end_val = f"{dim_value_str['end']}T23:59:59Z"
                else:
                    start_val = dim_value_str["start"]
                    end_val = dim_value_str["end"]

                parts.append(f"{start_arg} {start_val}")
                parts.append(f"{end_arg} {end_val}")
            elif dim_name in cli_args:
                # Use mapped CLI arg name
                arg_name = cli_args[dim_name]
                parts.append(f"{arg_name} {dim_value}")
            else:
                # Default: convert dimension name to CLI arg format
                parts.append(f"--{dim_name.replace('_', '-')} {dim_value}")

        return " ".join(parts)

    def to_dict(self) -> dict[str, object]:
        """Convert shard to dictionary for serialization."""
        return {
            "service": self.service,
            "shard_index": self.shard_index,
            "total_shards": self.total_shards,
            "dimensions": self.dimensions,
            "cli_command": self.cli_command,
        }
