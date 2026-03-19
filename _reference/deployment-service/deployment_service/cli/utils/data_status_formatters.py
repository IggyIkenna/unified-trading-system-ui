"""Output formatting utilities for data status commands."""

import json
import time
from collections import defaultdict
from datetime import datetime
from typing import cast

import click


def format_json_output(
    service: str,
    start_date: datetime,
    end_date: datetime,
    hierarchy: dict[str, dict[str, dict[str, object]]],
    overall_complete: int,
    overall_total: int,
    overall_excluded: int,
    category_start_dates: dict[str, object],
    category_excluded: dict[str, object],
) -> None:
    """Format and output JSON results."""
    categories: dict[str, dict[str, object]] = {}
    result: dict[str, object] = {
        "service": service,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "overall_completion": (
            (overall_complete / overall_total * 100) if overall_total > 0 else 0
        ),
        "overall_complete": overall_complete,
        "overall_total": overall_total,
        "overall_excluded": overall_excluded,
        "categories": categories,
    }
    for cat, venues_data in hierarchy.items():
        cat_start = category_start_dates.get(cat)
        cat_venues: dict[str, object] = {}
        categories[cat] = {
            "expected_start": cat_start,
            "excluded_days": category_excluded.get(cat, 0),
            "venues": cat_venues,
        }
        for v, data in venues_data.items():
            d_complete = int(cast(int, data["complete"]))
            d_total = int(cast(int, data["total"]))
            pct = (d_complete / d_total * 100) if d_total > 0 else 0
            cat_venues[v] = {
                "completion_percent": pct,
                "complete": d_complete,
                "total": d_total,
                "excluded": data.get("excluded", 0),
                "missing_dates": data.get("missing_dates") or [],
                "oldest_update": (
                    cast(datetime, data["oldest"]).isoformat() if data["oldest"] else None
                ),
                "newest_update": (
                    cast(datetime, data["newest"]).isoformat() if data["newest"] else None
                ),
            }
    click.echo(json.dumps(result, indent=2))


def format_summary_output(
    hierarchy: dict[str, dict[str, dict[str, object]]], overall_complete: int, overall_total: int
) -> None:
    """Format and output summary results."""
    overall_pct = (overall_complete / overall_total * 100) if overall_total > 0 else 0
    click.echo(
        f"\nOverall: {overall_pct:.1f}% ({overall_complete}/{overall_total} day-combinatorics)"
    )
    click.echo()

    for cat in sorted(hierarchy.keys()):
        cat_complete = sum(int(cast(int, d["complete"])) for d in hierarchy[cat].values())
        cat_total = sum(int(cast(int, d["total"])) for d in hierarchy[cat].values())
        cat_pct = (cat_complete / cat_total * 100) if cat_total > 0 else 0
        click.echo(f"  {cat}: {cat_pct:.1f}% ({cat_complete}/{cat_total})")


def format_tree_output(
    hierarchy: dict[str, dict[str, dict[str, object]]],
    overall_complete: int,
    overall_total: int,
    overall_excluded: int,
    category_excluded: dict[str, object],
    show_timestamps: bool = False,
) -> None:
    """Format and output tree-style results."""
    overall_pct = (overall_complete / overall_total * 100) if overall_total > 0 else 0
    overall_icon = "✅" if overall_pct == 100 else ("⏳" if overall_pct > 0 else "❌")

    excluded_note = ""
    if overall_excluded > 0:
        excluded_note = click.style(f" [{overall_excluded} pre-launch days excluded]", dim=True)

    click.echo(
        f"\n{overall_icon} Overall: {overall_pct:.1f}%"
        f" ({overall_complete}/{overall_total}){excluded_note}"
    )

    for cat in sorted(hierarchy.keys()):
        cat_complete = sum(int(cast(int, d["complete"])) for d in hierarchy[cat].values())
        cat_total = sum(int(cast(int, d["total"])) for d in hierarchy[cat].values())
        cat_excluded: int = int(cast(int, category_excluded.get(cat, 0)))
        cat_pct = (cat_complete / cat_total * 100) if cat_total > 0 else 0
        cat_icon = "✅" if cat_pct == 100 else ("⏳" if cat_pct > 0 else "📋")
        cat_style = "green" if cat_pct == 100 else ("yellow" if cat_pct > 0 else "white")

        cat_excluded_note = ""
        if cat_excluded > 0:
            cat_excluded_note = click.style(f" [{cat_excluded} excluded]", dim=True)

        click.echo()
        click.echo(
            f"├── {cat_icon} {click.style(cat, fg=cat_style, bold=True)}"
            f" ({cat_pct:.1f}%){cat_excluded_note}"
        )

        venues_sorted = sorted(hierarchy[cat].keys())
        for i, v in enumerate(venues_sorted):
            data = hierarchy[cat][v]
            d_complete = int(cast(int, data["complete"]))
            d_total = int(cast(int, data["total"]))
            pct = (d_complete / d_total * 100) if d_total > 0 else 0
            icon = "✅" if pct == 100 else ("⏳" if pct > 0 else "🕐")
            style = "green" if pct == 100 else ("yellow" if pct > 0 else "white")
            is_last = i == len(venues_sorted) - 1
            prefix = "└──" if is_last else "├──"

            timestamp_info = ""
            if show_timestamps and (data["oldest"] or data["newest"]):
                oldest = (
                    cast(datetime, data["oldest"]).strftime("%m/%d %H:%M")
                    if data["oldest"]
                    else "?"
                )
                newest = (
                    cast(datetime, data["newest"]).strftime("%m/%d %H:%M")
                    if data["newest"]
                    else "?"
                )
                timestamp_info = f" [updated: {oldest} - {newest}]"

            click.echo(
                f"│   {prefix} {icon} {click.style(v, fg=style)}:"
                f" {d_complete}/{d_total} days ({pct:.0f}%){timestamp_info}"
            )


def format_detailed_breakdown(fast_results: dict[str, object]) -> None:
    """Format and display detailed breakdown for timeframes and data types."""
    tf_breakdown = cast(
        dict[str, dict[str, dict[str, int]]], fast_results.get("_tf_breakdown") or {}
    )
    dt_breakdown = cast(
        dict[str, dict[str, dict[str, int]]], fast_results.get("_dt_breakdown") or {}
    )

    if tf_breakdown or dt_breakdown:
        click.echo()
        click.echo(click.style("DETAILED BREAKDOWN:", fg="cyan", bold=True))
        click.echo("-" * 70)

        for cat in sorted(set(list(tf_breakdown.keys()) + list(dt_breakdown.keys()))):
            click.echo()
            click.echo(click.style(f"{cat}:", bold=True))

            # Timeframe breakdown
            if cat in tf_breakdown:
                click.echo()
                click.echo("  Timeframe completion:")
                for tf in ["15s", "1m", "5m", "15m", "1h", "4h", "24h"]:
                    if tf in tf_breakdown[cat]:
                        data = tf_breakdown[cat][tf]
                        pct = (data["complete"] / data["total"] * 100) if data["total"] > 0 else 0
                        icon = "✅" if pct == 100 else ("⏳" if pct > 0 else "❌")
                        bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
                        click.echo(
                            f"    {tf:>5}: {icon} {bar}"
                            f" {pct:5.1f}% ({data['complete']}/{data['total']})"
                        )

            # Data type breakdown
            if cat in dt_breakdown:
                click.echo()
                click.echo("  Data type completion:")
                for dt, data in sorted(dt_breakdown[cat].items()):
                    if data["total"] > 0:
                        pct = data["complete"] / data["total"] * 100
                        icon = "✅" if pct == 100 else ("⏳" if pct > 0 else "❌")
                        bar = "█" * int(pct / 10) + "░" * (10 - int(pct / 10))
                        click.echo(
                            f"    {dt:>20}: {icon} {bar}"
                            f" {pct:5.1f}% ({data['complete']}/{data['total']})"
                        )

        click.echo()
        click.echo("-" * 70)


def format_missing_dates_output(hierarchy: dict[str, dict[str, dict[str, object]]]) -> None:
    """Format and display missing dates information."""
    click.echo()
    click.echo(click.style("MISSING DATES:", fg="red", bold=True))
    click.echo("-" * 70)

    any_missing = False
    for cat in sorted(hierarchy.keys()):
        for v in sorted(hierarchy[cat].keys()):
            data = hierarchy[cat][v]
            missing = data.get("missing_dates") or []
            if missing:
                any_missing = True
                click.echo()
                if v == "ALL":
                    click.echo(click.style(f"{cat}:", fg="yellow", bold=True))
                else:
                    click.echo(click.style(f"{cat} / {v}:", fg="yellow", bold=True))

                # Group consecutive dates for cleaner output
                if len(missing) <= 10:
                    # Show all dates if 10 or fewer
                    for d in sorted(missing):
                        click.echo(f"  • {d}")
                else:
                    # Show first 5, ..., last 5
                    sorted_missing = sorted(missing)
                    click.echo(f"  {len(missing)} dates missing:")
                    for d in sorted_missing[:5]:
                        click.echo(f"  • {d}")
                    click.echo(f"  ... ({len(missing) - 10} more)")
                    for d in sorted_missing[-5:]:
                        click.echo(f"  • {d}")

    if not any_missing:
        click.echo(click.style("  No missing dates! ✅", fg="green"))


def format_benchmark_info(start_time: float, start_date: datetime, end_date: datetime) -> None:
    """Format and display benchmark information."""
    total_time = time.time() - start_time
    days = (end_date - start_date).days + 1
    click.echo()
    click.echo(click.style("BENCHMARK:", fg="cyan", bold=True))
    click.echo(f"  Total time: {total_time:.2f}s")
    click.echo(f"  Date range: {days} days")
    click.echo(f"  Throughput: {days / total_time:.1f} days/second")


def format_backfill_hint(
    service: str, start_date: datetime, end_date: datetime, overall_pct: float
) -> None:
    """Format and display backfill command hint."""
    if overall_pct < 100:
        click.echo()
        click.echo(click.style("Missing data detected. To backfill:", fg="yellow"))
        click.echo(f"  python deploy.py deploy -s {service} \\")
        click.echo(
            f"      --start-date {start_date.strftime('%Y-%m-%d')}"
            f" --end-date {end_date.strftime('%Y-%m-%d')}"
        )


def format_dynamic_service_header(service: str, start_date: datetime, end_date: datetime) -> None:
    """Format header for dynamic service status."""
    click.echo()
    click.echo(f"DATA STATUS: {click.style(service, fg='cyan', bold=True)}")
    click.echo(f"Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    click.echo("=" * 70)
    click.echo()


def format_fixed_service_header(
    service: str,
    start_date: datetime,
    end_date: datetime,
    total_requested_days: int,
    category_excluded: dict[str, object],
    categories: list[str],
    category_start_dates: dict[str, object],
) -> None:
    """Format header for fixed service status."""
    click.echo()
    click.echo(f"DATA COMPLETION STATUS: {click.style(service, fg='cyan', bold=True)}")
    click.echo(
        f"Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        f" ({total_requested_days} days)"
    )
    click.echo("=" * 70)

    # Show expected start dates info
    has_exclusions = any(int(cast(int, category_excluded.get(c, 0))) > 0 for c in categories)
    if has_exclusions:
        click.echo()
        click.echo(click.style("Expected Start Dates (pre-launch dates excluded):", bold=True))
        for cat in categories:
            start_dt = category_start_dates.get(cat)
            excluded: int = int(cast(int, category_excluded.get(cat, 0)))
            valid_count = total_requested_days - excluded
            if start_dt and excluded > 0:
                click.echo(f"  {cat}: {start_dt} ({excluded} days excluded, {valid_count} valid)")
            elif start_dt:
                click.echo(f"  {cat}: {start_dt} (all {valid_count} days valid)")
            else:
                click.echo(f"  {cat}: No start date configured ({valid_count} days)")

    click.echo()


def format_venue_coverage_header(start_date: datetime, end_date: datetime) -> None:
    """Format header for venue coverage check."""
    click.echo()
    click.echo(f"VENUE COVERAGE CHECK: {click.style('instruments-service', fg='cyan', bold=True)}")
    click.echo(f"Date Range: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")
    click.echo("=" * 80)
    click.echo()


def format_venue_coverage_results(
    results: dict[str, dict[str, object]],
    output: str,
    start_date: datetime,
    end_date: datetime,
) -> None:
    """Format venue coverage check results."""
    if output == "json":
        json_categories: dict[str, dict[str, object]] = {}
        json_result: dict[str, object] = {
            "service": "instruments-service",
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "categories": json_categories,
        }
        for cat in sorted(results.keys()):
            cat_dates_with_missing: list[object] = []
            json_categories[cat] = {
                "dates_with_missing_venues": cat_dates_with_missing,
                "total_dates": len(results[cat]),
            }
            for date_str in sorted(results[cat].keys()):
                data = cast(dict[str, object], results[cat][date_str])
                if data["missing_venues"]:
                    cat_dates_with_missing.append(
                        {
                            "date": date_str,
                            "missing": list(cast(set[object], data["missing_venues"])),
                            "file_exists": data["file_exists"],
                        }
                    )
        click.echo(json.dumps(json_result, indent=2))
    else:
        # Tree view
        for cat in sorted(results.keys()):
            dates_data = results[cat]
            dates_with_issues = sum(
                1 for d in dates_data.values() if cast(dict[str, object], d)["missing_venues"]
            )
            total_dates = len(dates_data)
            pct_ok = (
                ((total_dates - dates_with_issues) / total_dates * 100) if total_dates > 0 else 100
            )

            cat_icon = "✅" if pct_ok == 100 else ("⚠️" if pct_ok > 80 else "❌")
            cat_style = "green" if pct_ok == 100 else ("yellow" if pct_ok > 80 else "red")

            click.echo(
                f"├── {cat_icon} {click.style(cat, fg=cat_style, bold=True)}"
                f" ({pct_ok:.0f}% complete venue coverage)"
            )

            if dates_with_issues > 0:
                # Group by missing venue
                venue_missing_dates = defaultdict(list)
                for date_str, data in sorted(dates_data.items()):
                    data_dict = cast(dict[str, object], data)
                    for venue in cast(list[object], data_dict["missing_venues"]):
                        venue_missing_dates[venue].append(date_str)

                for venue, dates in sorted(
                    venue_missing_dates.items(), key=lambda x: len(x[1]), reverse=True
                ):
                    date_range = f"{min(dates)} to {max(dates)}" if len(dates) > 1 else dates[0]
                    click.echo(
                        f"│   ├── ⚠️  {click.style(venue, fg='yellow')}:"
                        f" missing in {len(dates)} dates ({date_range})"
                    )

            click.echo("│")

        click.echo("-" * 80)

        # Summary
        total_issues = sum(
            1
            for cat in results.values()
            for data in cat.values()
            if cast(dict[str, object], data)["missing_venues"]
        )
        if total_issues > 0:
            click.echo()
            click.echo(click.style("⚠️  VENUE COVERAGE ISSUES DETECTED", fg="yellow", bold=True))
            click.echo(f"   {total_issues} datexcategory combinations have missing venues")
            click.echo()
            click.echo("Possible causes:")
            click.echo("  • API rate limiting for specific venue adapters")
            click.echo(
                "  • Venue adapter errors (check logs with: logs <deployment-id> --severity ERROR)"
            )
            click.echo("  • Venue not yet available on that date (check expected_start_dates.yaml)")
        else:
            click.echo()
            click.echo(
                click.style("✅ All expected venues present in all files!", fg="green", bold=True)
            )
