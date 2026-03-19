"""
Shared shard building utilities for CLI and API.

This module contains the canonical implementations of:
- _build_args: Build CLI args from shard dimensions
- _build_shard_id: Build unique shard identifier
- build_storage_env_vars: Build GCS/S3 bucket env vars for shard container launch

Both CLI and API should import from this module to ensure
consistent behavior between dry run and live deployments.
"""

import logging
import shlex
from typing import cast

from deployment_service.config_loader import ConfigLoader

logger = logging.getLogger(__name__)

# Maps service name → list of storage domains (from cloud-providers.yaml) used by that service.
# Per-category domains (e.g. features-delta-one) require a "category" shard dimension.
# Shared domains (e.g. ml-models-store) resolve the same bucket regardless of category.
_SERVICE_STORAGE_DOMAINS: dict[str, list[str]] = {
    "features-delta-one-service": ["features-delta-one"],
    "features-volatility-service": ["features-volatility"],
    "features-onchain-service": ["features-onchain"],
    "ml-training-service": ["ml-models-store", "ml-configs-store"],
    "ml-inference-service": ["ml-predictions-store", "ml-models-store"],
    "strategy-service": ["strategy-store"],
    "execution-services": ["execution-store"],
}


def build_shard_args(
    shard: object,
    service_config: dict[str, object],
    extra_options: dict[str, object] | None = None,
) -> list[str]:
    """
    Build CLI args from shard dimensions, config defaults, and extra options.

    This is the CANONICAL implementation used by both CLI and API.
    Any changes here affect both dry run previews and live deployments.

    Args:
        shard: Shard object with dimensions attribute (dict)
        service_config: Service configuration dict with cli_args, cli_flags, cli_defaults
        extra_options: Dict with optional keys:
            - force: bool - add --force flag
            - log_level: str - override log level
            - max_workers: int - override max workers
            - extra_args: str - additional CLI args to pass through

    Returns:
        List of CLI argument strings
    """
    args: list[str] = []
    extra_options = extra_options or {}
    cli_args_mapping = cast(dict[str, object], service_config.get("cli_args") or {})
    cli_flags = cast(dict[str, object], service_config.get("cli_flags") or {})
    cli_defaults = cast(dict[str, object], service_config.get("cli_defaults") or {})

    # 1. Add CLI flags from config (--operation <op> and --mode batch|live per codex cli-standards)
    for _flag_name, flag_value in cli_flags.items():
        args.extend(str(flag_value).split())

    # 2. Add dimension values from shard
    # Support both object.dimensions and dict["dimensions"] access
    dimensions = cast(
        dict[str, object],
        getattr(shard, "dimensions", None)
        or cast(dict[str, object], shard).get("dimensions")
        or {},
    )

    for dim_name, dim_value in dimensions.items():
        cli_arg_raw = cli_args_mapping.get(dim_name)

        # Skip if no mapping (e.g., date has null mapping, handled specially)
        if cli_arg_raw is None and dim_name != "date":
            continue

        cli_arg: str | None = str(cli_arg_raw) if cli_arg_raw is not None else None

        if dim_name == "date" and isinstance(dim_value, dict):
            # "none" granularity: no date args at all
            # (service fetches all data without date filter)
            if dim_value.get("type") == "none":
                continue

            # Special handling for date dimension
            cli_arg_raw = cli_args_mapping.get("date")
            cli_arg = str(cli_arg_raw) if cli_arg_raw is not None else None
            if cli_arg == "--date":
                # Single date mode: use the date value (start == end for daily sharding)
                args.extend([cli_arg, str(dim_value["start"])])
            else:
                # Check if service uses custom start/end mappings (e.g., execution-service)
                start_arg = str(cli_args_mapping.get("start_date") or "--start-date")
                end_arg = str(cli_args_mapping.get("end_date") or "--end-date")

                # Check if service needs ISO datetime format (has --start/--end style args)
                if start_arg == "--start":
                    # Convert to ISO datetime format for services like execution-service
                    start_val: str = f"{dim_value['start']}T00:00:00Z"
                    end_val: str = f"{dim_value['end']}T23:59:59Z"
                else:
                    start_val = str(dim_value["start"])
                    end_val = str(dim_value["end"])

                args.extend([start_arg, start_val])
                args.extend([end_arg, end_val])
        elif isinstance(dim_value, list):
            if cli_arg is not None:
                for v in cast(list[object], dim_value):
                    args.extend([cli_arg, str(v)])
        elif cli_arg:
            # Handle boolean flag patterns like "--CEFI/--TRADFI/--DEFI"
            # These indicate multiple flags where we pick the one matching the dimension value
            if "/" in cli_arg:
                # Boolean flag pattern - split and find matching flag
                flags: list[str] = cli_arg.split("/")
                for flag in flags:
                    flag_name = flag.lstrip("-").upper()
                    if flag_name == str(dim_value).upper():
                        args.append(flag)
                        break
            else:
                # Regular argument with value
                args.extend([cli_arg, str(dim_value)])

    # 3. Add default arguments from config
    for arg_name, arg_value in cli_defaults.items():
        args.extend([f"--{arg_name}", str(arg_value)])

    # 4. Add force flag if specified
    if extra_options.get("force"):
        args.append("--force")

    # 5. Add log-level if specified (overrides config default)
    if extra_options.get("log_level"):
        args.extend(["--log-level", str(extra_options["log_level"])])

    # 6. Add max-workers if specified AND the service accepts it
    # Only inject --max-workers if the service's sharding config lists it as a cli_optional arg.
    # Injecting unknown args into services using strict parse_args() causes them to crash.
    if extra_options.get("max_workers"):
        cli_optional = cast(list[object], service_config.get("cli_optional") or [])
        accepts_max_workers = any(
            cast(dict[str, object], opt).get("name") == "max-workers"
            or cast(dict[str, object], opt).get("flag") == "--max-workers"
            for opt in cli_optional
            if isinstance(opt, dict)
        )
        if accepts_max_workers:
            args.extend(["--max-workers", str(extra_options["max_workers"])])
        else:
            service_name = service_config.get("service", "unknown")
            logger.warning(
                "--max-workers=%s requested but %s does not accept --max-workers"
                " in its cli_optional config. Ignoring."
                " Add it to sharding.%s.yaml cli_optional if needed.",
                extra_options["max_workers"],
                service_name,
                service_name,
            )

    # 7. Add any extra args passed through
    if extra_options.get("extra_args"):
        # Split the extra args string and add them
        extra_args_str = str(extra_options["extra_args"])
        try:
            extra = shlex.split(extra_args_str)
            args.extend(extra)
        except ValueError:
            # If shlex fails, just split on spaces
            args.extend(extra_args_str.split())

    return args


def build_shard_id(shard: object, index: int) -> str:
    """
    Build a unique shard identifier from dimensions.

    This is the CANONICAL implementation used by both CLI and API.

    Args:
        shard: Shard object with dimensions attribute
        index: Index of shard in the list (used as fallback)

    Returns:
        Unique shard ID string (e.g., "2024-01-15_CEFI_binance")
    """
    # Support both object.dimensions and dict["dimensions"] access
    dimensions = cast(
        dict[str, object],
        getattr(shard, "dimensions", None)
        or cast(dict[str, object], shard).get("dimensions")
        or {},
    )

    parts = []
    for dim_name, dim_value in dimensions.items():
        if dim_name == "date" and isinstance(dim_value, dict):
            if dim_value.get("type") == "none":
                parts.append("bulk")  # No date for "none" granularity services
            else:
                parts.append(dim_value["start"])
        elif isinstance(dim_value, list):
            parts.append("_".join(str(v) for v in dim_value))
        else:
            parts.append(str(dim_value))

    if parts:
        return "_".join(parts)
    return f"shard_{index}"


def build_storage_env_vars(
    service: str,
    dimensions: dict[str, object],
    config_dir: str = "configs",
) -> dict[str, str]:
    """
    Build GCS/S3 bucket name env vars to inject into a shard's container at launch time.

    Resolves bucket names via ConfigLoader.get_bucket_name() — which calls substitute_env_vars()
    so ${DEPLOYMENT_ENV}, ${GCP_PROJECT_ID}, and ${AWS_ACCOUNT_ID} are substituted from
    os.environ at runtime, giving each env's container the correct bucket name automatically.

    Env var naming convention:
      - Per-category domain + category:  {DOMAIN_UPPER}_{CATEGORY}_GCS_BUCKET
          e.g. features-delta-one + CEFI  →  FEATURES_DELTA_ONE_CEFI_GCS_BUCKET
      - Shared domain (no category):     {DOMAIN_UPPER}_GCS_BUCKET
          e.g. ml-models-store           →  ML_MODELS_STORE_GCS_BUCKET

    Args:
        service: Service name (e.g. "features-delta-one-service")
        dimensions: Shard dimensions dict (e.g. {"category": "CEFI", "venue": "binance"})
        config_dir: Path to configs directory (default: "configs")

    Returns:
        Dict of env var name → resolved bucket name (empty dict if service has no mapping
        or cloud-providers config is unavailable)
    """
    domains = _SERVICE_STORAGE_DOMAINS.get(service, [])
    if not domains:
        return {}

    loader = ConfigLoader(config_dir)
    category = str(dimensions.get("category", "")).upper()  # noqa: qg-empty-fallback — no category is valid (shared domain)
    result: dict[str, str] = {}

    for domain in domains:
        bucket = loader.get_bucket_name(domain, category)
        if not bucket:
            continue
        domain_key = domain.replace("-", "_").upper()
        env_key = f"{domain_key}_{category}_GCS_BUCKET" if category else f"{domain_key}_GCS_BUCKET"
        result[env_key] = bucket

    return result


def validate_shard_uniqueness(
    shards: list[object],
    service_config: dict[str, object],
    extra_options: dict[str, object] | None = None,
) -> None:
    """
    Validate that all shards have unique CLI arguments.

    This prevents duplicate work and catches configuration bugs where
    multiple shards would execute the same command.

    Args:
        shards: List of shard objects (with dimensions attribute)
        service_config: Service configuration dict
        extra_options: Optional extra options dict (same as build_shard_args)

    Raises:
        ValueError: If duplicate CLI arguments are found
    """
    if not shards:
        return

    # Build CLI args for each shard and normalize them
    cli_args_map = {}  # normalized_args -> list of (shard_index, shard_id)
    duplicates = []

    for i, shard in enumerate(shards):
        cli_args = build_shard_args(shard, service_config, extra_options)
        # Normalize: sort args to handle order differences
        # Convert to tuple for hashing
        normalized = tuple(sorted(cli_args))
        shard_id = build_shard_id(shard, i)

        if normalized in cli_args_map:
            # Found duplicate
            existing_shard_idx, existing_shard_id = cli_args_map[normalized][0]
            duplicates.append(
                {
                    "cli_args": " ".join(cli_args),
                    "shard_1": {"index": existing_shard_idx, "id": existing_shard_id},
                    "shard_2": {"index": i, "id": shard_id},
                }
            )
        else:
            cli_args_map[normalized] = [(i, shard_id)]

    if duplicates:
        error_msg = (
            f"\n{'=' * 80}\n"
            f"DUPLICATE SHARD CLI ARGUMENTS DETECTED\n"
            f"{'=' * 80}\n"
            f"Found {len(duplicates)} duplicate shard(s) with identical CLI arguments:\n\n"
        )

        for dup in duplicates:
            error_msg += (
                f"CLI Args: {dup['cli_args']}\n"
                f"  Shard 1: index={dup['shard_1']['index']}, id={dup['shard_1']['id']}\n"
                f"  Shard 2: index={dup['shard_2']['index']}, id={dup['shard_2']['id']}\n\n"
            )

        error_msg += (
            "This indicates a configuration bug where multiple shards would execute "
            "the same command.\n"
            "Check your sharding configuration for:\n"
            "  - Duplicate dimension combinations\n"
            "  - Incorrect CLI argument mappings\n"
            "  - Missing dimensions that should differentiate shards\n"
            f"{'=' * 80}\n"
        )

        raise ValueError(error_msg)
