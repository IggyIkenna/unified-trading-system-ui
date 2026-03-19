"""Dynamic service status display functions for data status commands.

This module handles status display for services with dynamic dimensions (configs-driven).
"""

import time

import click

from ...cloud_client import CloudClient
from ...config_loader import ConfigLoader
from ...deployment_config import DeploymentConfig
from .data_status_formatters import format_dynamic_service_header


def display_dynamic_service_status(
    service: str,
    start_date,
    end_date,
    category: tuple[str, ...],
    output: str,
    config_dir: str,
    mode: str = "batch",
):
    """
    Display status for dynamic-dimension services (configs-driven).

    OPTIMIZED: Uses parallel bucket scanning for multiple domains.

    For execution-service: Shows completion % by comparing configs vs results.
    Other services: Shows timestamp info only.
    """
    _deployment_config = DeploymentConfig()
    scan_start = time.time()

    format_dynamic_service_header(service, start_date, end_date)

    loader = ConfigLoader(config_dir)
    service_config = loader.load_service_config(service)
    cloud_client = CloudClient()

    # Get the bucket template and config prefix
    gcs_dim = None
    for dim in service_config.get("dimensions") or []:
        if dim.get("type") == "gcs_dynamic":
            gcs_dim = dim
            break

    if not gcs_dim:
        click.echo("No GCS dynamic dimension found in config.")
        return

    # Build buckets to check based on category/domain
    domains_or_categories = list(category) if category else []

    # Check for domain vs category dimension
    for dim in service_config.get("dimensions") or []:
        if (dim["name"] == "domain" and dim["type"] == "fixed") or (
            dim["name"] == "category" and dim["type"] == "fixed"
        ):
            if not domains_or_categories:
                domains_or_categories = dim.get("values") or []
            break

    if not domains_or_categories:
        domains_or_categories = ["default"]

    click.echo(click.style("Scanning config buckets...", dim=True))

    # OPTIMIZATION: Build list of paths to scan in parallel
    bucket_paths = []
    path_to_domain = {}
    bucket_to_domain = {}

    for domain in domains_or_categories:
        bucket_template = gcs_dim.get("source_bucket") or ""
        try:
            bucket = bucket_template.format(
                domain=domain.lower(),
                category_lower=domain.lower(),
            )
        except KeyError:
            bucket = bucket_template

        prefix = gcs_dim.get("gcs_prefix") or ""
        if mode == "live":
            prefix = "live/" + prefix
        gcs_path = f"gs://{bucket}/{prefix}"  # noqa: gs-uri — CLI data status display builds GCS paths for bucket scanning
        bucket_paths.append(gcs_path)
        path_to_domain[gcs_path] = domain
        bucket_to_domain[bucket] = domain

    # OPTIMIZATION: Parallel scan all buckets (max_workers must be >= 1)
    bucket_indexes = cloud_client.parallel_scan_buckets(
        bucket_paths,
        pattern="*.json",
        max_workers=max(1, min(8, len(bucket_paths))),
    )

    # For execution-service: Also scan results bucket to calculate completion %
    results_by_domain = {}
    if service == "execution-service":
        click.echo(click.style("Scanning results buckets...", dim=True))
        results_paths = []
        results_path_to_domain = {}

        for domain in domains_or_categories:
            # Results are in the same bucket under results/ prefix
            bucket_template = gcs_dim.get("source_bucket") or ""
            try:
                bucket = bucket_template.format(
                    domain=domain.lower(),
                    category_lower=domain.lower(),
                )
            except KeyError:
                bucket = bucket_template

            results_path = (
                f"gs://{bucket}/live/results/" if mode == "live" else f"gs://{bucket}/results/"  # noqa: gs-uri — CLI data status builds GCS results paths
            )
            results_paths.append(results_path)
            results_path_to_domain[results_path] = domain

        # Scan results buckets (max_workers must be >= 1)
        results_indexes = cloud_client.parallel_scan_buckets(
            results_paths,
            pattern="*/summary.json",  # Each result run has a summary.json
            max_workers=max(1, min(8, len(results_paths))),
        )

        for results_path, index in results_indexes.items():
            domain = results_path_to_domain.get(results_path, "?")
            stats = index.get_stats()
            results_by_domain[domain] = stats.file_count

    scan_time = time.time() - scan_start
    click.echo(click.style(f"Scan complete in {scan_time:.1f}s", fg="green"))
    click.echo()

    # Header depends on whether we have results data
    if service == "execution-service" and results_by_domain:
        click.echo(
            f"{'Domain/Category':<15} {'Configs':<10} {'Results':<10}"
            f" {'Completion':<12} {'Oldest':<18} {'Newest':<18}"
        )
        click.echo("-" * 90)
    else:
        click.echo(click.style("NOTE: This service uses dynamic GCS configs.", fg="yellow"))
        click.echo("Completion % is not applicable - showing timestamp info only.")
        click.echo()
        click.echo(
            f"{'Domain/Category':<20} {'Configs':<12} {'Oldest Created':<20} {'Newest Updated':<20}"
        )
        click.echo("-" * 70)

    total_configs = 0
    total_results = 0

    for gcs_path, index in bucket_indexes.items():
        domain = path_to_domain.get(gcs_path, "?")
        stats = index.get_stats()
        total_configs += stats.file_count

        oldest = (
            stats.oldest_file_time.strftime("%Y-%m-%d %H:%M") if stats.oldest_file_time else "N/A"
        )
        newest = (
            stats.newest_update_time.strftime("%Y-%m-%d %H:%M")
            if stats.newest_update_time
            else "N/A"
        )

        if service == "execution-service" and results_by_domain:
            result_count = results_by_domain.get(domain, 0)
            total_results += result_count
            if stats.file_count > 0:
                completion_pct = (result_count / stats.file_count) * 100
                completion_str = f"{completion_pct:.1f}%"
                if completion_pct >= 100:
                    completion_str = click.style(completion_str, fg="green")
                elif completion_pct >= 50:
                    completion_str = click.style(completion_str, fg="yellow")
                else:
                    completion_str = click.style(completion_str, fg="red")
            else:
                completion_str = "N/A"
            click.echo(
                f"{domain:<15} {stats.file_count:<10} {result_count:<10}"
                f" {completion_str:<12} {oldest:<18} {newest:<18}"
            )
        else:
            click.echo(f"{domain:<20} {stats.file_count:<12} {oldest:<20} {newest:<20}")

    click.echo()
    click.echo("-" * (90 if service == "execution-service" and results_by_domain else 70))

    if service == "execution-service" and results_by_domain:
        if total_configs > 0:
            overall_pct = (total_results / total_configs) * 100
            click.echo(
                f"Overall: {total_results}/{total_configs} configs have results"
                f" ({overall_pct:.1f}%)"
            )
            if total_results < total_configs:
                click.echo()
                click.echo(click.style("To rerun missing configs:", fg="cyan"))
                click.echo(
                    "  python -m execution_service.cli.backtest"
                    " --config-gcs <config_path> --start <date> --end <date>"
                )
                click.echo("  Add --force to overwrite existing results")
        else:
            click.echo("No configs found.")
    else:
        click.echo(
            "To check if configs are complete, run the config generation script with --dry-run."
        )
