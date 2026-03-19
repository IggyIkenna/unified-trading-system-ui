#!/usr/bin/env python3
"""
Weather data utilities for sports venues.

Fetches historical weather for stadium coordinates using the Open-Meteo API
(free, no key required) and returns structured records suitable for joining
with fixture data stored in GCS Parquet.

The original implementation used Google Maps + OpenWeatherMap with hardcoded
API keys.  This version uses Open-Meteo for weather and expects venue
coordinates to be supplied via a GCS-hosted venues Parquet file or CLI args.

Usage:
    python scripts/sports/weather_utils.py --lat 53.4631 --lon -2.2913 --date 2024-03-15
    python scripts/sports/weather_utils.py --venues-bucket my-bucket --venues-prefix sports/venues
"""

from __future__ import annotations

import argparse
import logging
from datetime import UTC, datetime, timedelta

import requests
from unified_config_interface import UnifiedCloudConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Weather record type
# ---------------------------------------------------------------------------

WeatherRecord = dict[str, float | str | None]


# ---------------------------------------------------------------------------
# Open-Meteo historical weather API (free, no key required)
# ---------------------------------------------------------------------------

OPEN_METEO_BASE = "https://archive-api.open-meteo.com/v1/archive"


def get_historical_weather(
    lat: float,
    lon: float,
    date_str: str,
) -> WeatherRecord | None:
    """Fetch historical daily weather from Open-Meteo for a single date.

    Parameters
    ----------
    lat:
        Latitude of the venue.
    lon:
        Longitude of the venue.
    date_str:
        ISO date string (YYYY-MM-DD).

    Returns
    -------
    A dict with temperature, humidity, wind speed, precipitation, and
    weather description fields, or ``None`` on failure.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": date_str,
        "end_date": date_str,
        "daily": "temperature_2m_max,temperature_2m_min,apparent_temperature_max,relative_humidity_2m_mean,wind_speed_10m_max,precipitation_sum,weather_code",
        "timezone": "UTC",
    }

    try:
        resp = requests.get(OPEN_METEO_BASE, params=params, timeout=15)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException:
        logger.exception("Open-Meteo request failed for lat=%s lon=%s date=%s", lat, lon, date_str)
        return None

    daily = data.get("daily")
    if not daily:
        logger.warning("No daily data returned for lat=%s lon=%s date=%s", lat, lon, date_str)
        return None

    return {
        "date": date_str,
        "temp_max": daily["temperature_2m_max"][0] if daily.get("temperature_2m_max") else None,
        "temp_min": daily["temperature_2m_min"][0] if daily.get("temperature_2m_min") else None,
        "apparent_temp_max": daily["apparent_temperature_max"][0]
        if daily.get("apparent_temperature_max")
        else None,
        "humidity_mean": daily["relative_humidity_2m_mean"][0]
        if daily.get("relative_humidity_2m_mean")
        else None,
        "wind_speed_max": daily["wind_speed_10m_max"][0]
        if daily.get("wind_speed_10m_max")
        else None,
        "precipitation_mm": daily["precipitation_sum"][0]
        if daily.get("precipitation_sum")
        else None,
        "weather_code": daily["weather_code"][0] if daily.get("weather_code") else None,
    }


def fetch_weather_range(
    lat: float,
    lon: float,
    start_date: datetime,
    end_date: datetime,
) -> list[WeatherRecord]:
    """Fetch weather for each day in [start_date, end_date]."""
    results: list[WeatherRecord] = []
    current = start_date
    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        record = get_historical_weather(lat, lon, date_str)
        if record is not None:
            results.append(record)
        current += timedelta(days=1)
    return results


# ---------------------------------------------------------------------------
# Example stadiums (used for demo / smoke-test)
# ---------------------------------------------------------------------------

EXAMPLE_STADIUMS: list[dict[str, str | float]] = [
    {"stadium": "Old Trafford", "city": "Manchester, England", "lat": 53.4631, "lon": -2.2913},
    {"stadium": "Anfield", "city": "Liverpool, England", "lat": 53.4308, "lon": -2.9608},
    {"stadium": "Emirates Stadium", "city": "London, England", "lat": 51.5549, "lon": -0.1084},
    {"stadium": "Santiago Bernabeu", "city": "Madrid, Spain", "lat": 40.4530, "lon": -3.6883},
]


# ---------------------------------------------------------------------------
# Standalone entry-point
# ---------------------------------------------------------------------------


def main() -> None:
    """Fetch historical weather for a venue or run demo with example stadiums."""
    logging.basicConfig(level=logging.INFO, format="[%(levelname)s] %(message)s")

    parser = argparse.ArgumentParser(description="Fetch historical weather for sports venues")
    parser.add_argument("--lat", type=float, help="Latitude of venue")
    parser.add_argument("--lon", type=float, help="Longitude of venue")
    parser.add_argument("--date", type=str, help="Date (YYYY-MM-DD)")
    parser.add_argument(
        "--days-back", type=int, default=2, help="Number of days back from --date (default 2)"
    )
    parser.add_argument(
        "--venues-bucket", type=str, default="", help="GCS bucket with venues Parquet"
    )
    parser.add_argument(
        "--venues-prefix", type=str, default="sports/venues", help="GCS prefix for venues data"
    )
    parser.add_argument("--demo", action="store_true", help="Run with example stadiums")
    args = parser.parse_args()

    config = UnifiedCloudConfig()
    logger.info("Project: %s", config.gcp_project_id)

    if args.lat is not None and args.lon is not None:
        date_str = args.date or datetime.now(UTC).strftime("%Y-%m-%d")
        end_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=UTC)
        start_date = end_date - timedelta(days=args.days_back)

        logger.info(
            "Fetching weather for lat=%.4f lon=%.4f from %s to %s",
            args.lat,
            args.lon,
            start_date.date(),
            end_date.date(),
        )
        records = fetch_weather_range(args.lat, args.lon, start_date, end_date)

        for rec in records:
            logger.info(
                "  %s: temp_max=%.1f temp_min=%.1f precip=%.1fmm wind=%.1f",
                rec["date"],
                rec.get("temp_max") or 0.0,
                rec.get("temp_min") or 0.0,
                rec.get("precipitation_mm") or 0.0,
                rec.get("wind_speed_max") or 0.0,
            )
        logger.info("Total records: %d", len(records))
        return

    if args.demo:
        logger.info("Demo mode: fetching weather for example stadiums")
        end_date = datetime.now(UTC) - timedelta(
            days=3
        )  # Use 3 days ago to ensure archive availability
        start_date = end_date - timedelta(days=args.days_back)

        for stadium in EXAMPLE_STADIUMS:
            lat = float(stadium["lat"])
            lon = float(stadium["lon"])
            logger.info("")
            logger.info("Stadium: %s (%s)", stadium["stadium"], stadium["city"])
            records = fetch_weather_range(lat, lon, start_date, end_date)
            for rec in records:
                logger.info(
                    "  %s: temp_max=%.1f precip=%.1fmm wind=%.1f",
                    rec["date"],
                    rec.get("temp_max") or 0.0,
                    rec.get("precipitation_mm") or 0.0,
                    rec.get("wind_speed_max") or 0.0,
                )
        return

    logger.info("Use --lat/--lon/--date or --demo. Run with --help for details.")


if __name__ == "__main__":
    main()
