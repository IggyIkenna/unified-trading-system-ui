"""Cross-provider mapping resolver for sports entities.

Reads mapping tables from GCS (instruments-store-sports-{project}/sports_reference/mappings/)
and resolves canonical IDs to provider-specific IDs at runtime.

Usage from services (via facade):
    from unified_api_contracts.sports import resolve_team_mapping, resolve_fixture_mapping

    # Get FootyStats team ID for Arsenal
    mapping = resolve_team_mapping("ARSENAL", season=2025)
    ft_id = mapping.get("ft_team_id")  # → provider-specific numeric ID

    # Get all provider IDs for a fixture
    fx = resolve_fixture_mapping("EPL:ARSENAL_v_CHELSEA:20260322")
    af_id = fx.get("af_fixture_id")  # → API-Football numeric ID
    us_id = fx.get("us_fixture_id")  # → Understat fixture ID

No hardcoded mappings — reads from GCS parquet at runtime.
New teams/fixtures are picked up automatically when instruments-service
writes updated mapping tables.

Caches in memory for the duration of a batch run (cleared between runs).
"""

from __future__ import annotations

import logging

import pandas as pd

logger = logging.getLogger(__name__)

# Module-level cache — loaded once per process, invalidated by clear_mapping_cache()
_team_mapping_df: pd.DataFrame | None = None
_fixture_mapping_df: pd.DataFrame | None = None
_league_mapping_df: pd.DataFrame | None = None


def _get_mapping_bucket() -> str:
    """Resolve the instruments-store-sports bucket name."""
    project = "test-project"
    return f"instruments-store-sports-{project}"


def _load_team_mapping() -> pd.DataFrame:
    """Load team mapping parquet from GCS. Cached in module-level variable."""
    global _team_mapping_df
    if _team_mapping_df is not None:
        return _team_mapping_df

    bucket = _get_mapping_bucket()
    path = f"gs://{bucket}/sports_reference/mappings/team_mapping.parquet"
    try:
        _team_mapping_df = pd.read_parquet(path)
        logger.info("Team mapping loaded: %d rows from %s", len(_team_mapping_df), path)
    except (FileNotFoundError, OSError) as exc:
        logger.warning("Team mapping not available: %s", exc)
        _team_mapping_df = pd.DataFrame()
    return _team_mapping_df


def _load_fixture_mapping() -> pd.DataFrame:
    """Load fixture mapping parquet from GCS. Cached in module-level variable."""
    global _fixture_mapping_df
    if _fixture_mapping_df is not None:
        return _fixture_mapping_df

    bucket = _get_mapping_bucket()
    path = f"gs://{bucket}/sports_reference/mappings/fixture_mapping.parquet"
    try:
        _fixture_mapping_df = pd.read_parquet(path)
        logger.info("Fixture mapping loaded: %d rows from %s", len(_fixture_mapping_df), path)
    except (FileNotFoundError, OSError) as exc:
        logger.warning("Fixture mapping not available: %s", exc)
        _fixture_mapping_df = pd.DataFrame()
    return _fixture_mapping_df


def _load_league_mapping() -> pd.DataFrame:
    """Load league mapping parquet from GCS. Cached in module-level variable."""
    global _league_mapping_df
    if _league_mapping_df is not None:
        return _league_mapping_df

    bucket = _get_mapping_bucket()
    path = f"gs://{bucket}/sports_reference/mappings/league_mapping.parquet"
    try:
        _league_mapping_df = pd.read_parquet(path)
        logger.info("League mapping loaded: %d rows from %s", len(_league_mapping_df), path)
    except (FileNotFoundError, OSError) as exc:
        logger.warning("League mapping not available: %s", exc)
        _league_mapping_df = pd.DataFrame()
    return _league_mapping_df


def clear_mapping_cache() -> None:
    """Clear all cached mapping DataFrames. Call between batch runs."""
    global _team_mapping_df, _fixture_mapping_df, _league_mapping_df
    _team_mapping_df = None
    _fixture_mapping_df = None
    _league_mapping_df = None
    logger.debug("Mapping cache cleared")


def resolve_team_mapping(
    canonical_key: str | None = None,
    af_team_id: int | None = None,
    season: int | None = None,
) -> dict[str, object]:
    """Resolve a team's cross-provider IDs.

    Look up by canonical_key OR af_team_id. Returns a dict with all provider IDs.

    Args:
        canonical_key: Canonical team key (e.g. from team_canonical_key column).
        af_team_id: API-Football team ID (numeric).
        season: Optional season filter (mappings can vary by season for promoted teams).

    Returns:
        Dict with: team_canonical_key, af_team_id, af_team_name, us_team_id,
        us_team_name, ft_team_id, ft_team_name, sf_team_id, sf_team_name,
        od_team_id, od_team_name, tm_team_id, tm_team_name.
        Empty dict if not found.
    """
    df = _load_team_mapping()
    if df.empty:
        return {}

    if canonical_key and "team_canonical_key" in df.columns:
        matches = df[df["team_canonical_key"].str.contains(canonical_key, case=False, na=False)]
    elif af_team_id is not None and "af_team_id" in df.columns:
        matches = df[df["af_team_id"] == af_team_id]
    else:
        return {}

    if season is not None and "season" in matches.columns:
        season_matches = matches[matches["season"] == season]
        if not season_matches.empty:
            matches = season_matches

    if matches.empty:
        return {}

    # Return the most recent match (highest season)
    if "season" in matches.columns:
        matches = matches.sort_values("season", ascending=False)
    return dict(matches.iloc[0])


def resolve_fixture_mapping(
    canonical_key: str | None = None,
    af_fixture_id: int | None = None,
) -> dict[str, object]:
    """Resolve a fixture's cross-provider IDs.

    Args:
        canonical_key: Canonical fixture key.
        af_fixture_id: API-Football fixture ID (numeric).

    Returns:
        Dict with: fixture_canonical_key, af_fixture_id, us_fixture_id,
        ft_fixture_id, sf_fixture_id, od_fixture_id, tm_fixture_id, etc.
        Empty dict if not found.
    """
    df = _load_fixture_mapping()
    if df.empty:
        return {}

    if canonical_key and "fixture_canonical_key" in df.columns:
        matches = df[df["fixture_canonical_key"].str.contains(canonical_key, case=False, na=False)]
    elif af_fixture_id is not None and "af_fixture_id" in df.columns:
        matches = df[df["af_fixture_id"] == af_fixture_id]
    else:
        return {}

    if matches.empty:
        return {}

    return dict(matches.iloc[0])


def resolve_league_mapping(
    league_id: int | None = None,
    league_name: str | None = None,
) -> dict[str, object]:
    """Resolve a league's cross-provider IDs.

    Args:
        league_id: API-Football league ID (numeric).
        league_name: League name to search for.

    Returns:
        Dict with: league_id, league_name, understat_name, odds_api_name,
        footystats_name, footystats_id, soccer_football_info_id, tm_league_id, etc.
        Empty dict if not found.
    """
    df = _load_league_mapping()
    if df.empty:
        return {}

    if league_id is not None and "league_id" in df.columns:
        matches = df[df["league_id"] == league_id]
    elif league_name and "league_name" in df.columns:
        matches = df[df["league_name"].str.contains(league_name, case=False, na=False)]
    else:
        return {}

    if matches.empty:
        return {}

    # Return most recent season
    if "season" in matches.columns:
        matches = matches.sort_values("season", ascending=False)
    return dict(matches.iloc[0])
