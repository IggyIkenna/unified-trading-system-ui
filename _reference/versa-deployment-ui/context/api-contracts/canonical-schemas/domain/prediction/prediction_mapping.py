"""Canonical prediction market mapping — maps markets from various venues to canonical IDs.

Supports Polymarket, Kalshi, Manifold, and other prediction market venues.
Provides deterministic canonical IDs, keyword-based categorization, and
cross-venue matching via normalized question hashing.
"""

from __future__ import annotations

import hashlib
import re
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict


class PredictionMarketCategory(StrEnum):
    """Category of a prediction market question."""

    POLITICS = "politics"
    FINANCIAL = "financial"
    SPORTS = "sports"
    CRYPTO = "crypto"
    WEATHER = "weather"
    ENTERTAINMENT = "entertainment"
    OTHER = "other"


class CanonicalPredictionMarket(BaseModel):
    """Canonical representation of a prediction market across venues.

    The ``canonical_id`` is deterministic: ``PRED:{category}:{hash12}``
    where hash12 = first 12 hex chars of SHA-256 of ``question_normalized``.
    """

    model_config = ConfigDict(frozen=True)

    canonical_id: str  # PRED:{category}:{normalized_hash[:12]}
    source_venue: str  # polymarket, kalshi, manifold, etc.
    source_market_id: str  # venue-native identifier
    category: PredictionMarketCategory
    question_normalized: str  # lowercased, whitespace-collapsed, stripped
    resolution_date: datetime | None = None
    outcomes: tuple[str, ...]  # ("YES", "NO") for binary; tuple for immutability
    mapped_sport_event_id: str | None = None  # link to canonical sport event
    mapped_instrument_id: str | None = None  # link to canonical financial instrument


class MappingRule(BaseModel):
    """Rule for keyword-based categorization of prediction markets."""

    model_config = ConfigDict(frozen=True)

    keywords: tuple[str, ...]
    category: PredictionMarketCategory
    priority: int = 0  # higher = checked first


# ---------------------------------------------------------------------------
# Default rules — ordered by priority (highest first at runtime)
# ---------------------------------------------------------------------------

_DEFAULT_RULES: tuple[MappingRule, ...] = (
    MappingRule(
        keywords=(
            "president",
            "election",
            "congress",
            "senate",
            "governor",
            "political",
            "vote",
            "primary",
            "electoral",
            "inauguration",
        ),
        category=PredictionMarketCategory.POLITICS,
        priority=10,
    ),
    MappingRule(
        keywords=(
            "price",
            "stock",
            "market cap",
            "fed",
            "interest rate",
            "gdp",
            "inflation",
            "s&p",
            "nasdaq",
            "dow jones",
            "treasury",
            "yield curve",
            "recession",
        ),
        category=PredictionMarketCategory.FINANCIAL,
        priority=9,
    ),
    MappingRule(
        keywords=(
            "win",
            "championship",
            "mvp",
            "playoff",
            "super bowl",
            "world cup",
            "match",
            "tournament",
            "finals",
            "league",
            "goal",
            "touchdown",
        ),
        category=PredictionMarketCategory.SPORTS,
        priority=8,
    ),
    MappingRule(
        keywords=(
            "ethereum",
            "solana",
            "defi",
            "nft",
            "blockchain",
            "token",
            "airdrop",
            "bitcoin",
            "crypto",
            "altcoin",
            "staking",
            "eth",
        ),
        category=PredictionMarketCategory.CRYPTO,
        priority=7,
    ),
    MappingRule(
        keywords=(
            "temperature",
            "hurricane",
            "weather",
            "climate",
            "rainfall",
            "drought",
            "tornado",
            "snowfall",
        ),
        category=PredictionMarketCategory.WEATHER,
        priority=6,
    ),
    MappingRule(
        keywords=(
            "oscar",
            "grammy",
            "box office",
            "movie",
            "tv show",
            "emmy",
            "golden globe",
            "streaming",
            "album",
            "billboard",
        ),
        category=PredictionMarketCategory.ENTERTAINMENT,
        priority=5,
    ),
)

_WS_RE = re.compile(r"\s+")


def _normalize_question(question: str) -> str:
    """Lowercase, collapse whitespace, strip."""
    return _WS_RE.sub(" ", question.lower().strip())


def _build_canonical_id(category: PredictionMarketCategory, question_normalized: str) -> str:
    """Deterministic canonical ID: ``PRED:{category}:{hash12}``."""
    digest = hashlib.sha256(question_normalized.encode()).hexdigest()[:12]
    return f"PRED:{category}:{digest}"


class PredictionMarketMapper:
    """Maps prediction markets from various venues to canonical IDs.

    Uses keyword rules (default + optional custom) sorted by descending
    priority.  Falls back to ``OTHER`` when no rule matches.
    """

    def __init__(self, custom_rules: list[MappingRule] | None = None) -> None:
        all_rules = list(_DEFAULT_RULES)
        if custom_rules:
            all_rules.extend(custom_rules)
        # Sort descending by priority — first match wins
        self._rules: list[MappingRule] = sorted(all_rules, key=lambda r: r.priority, reverse=True)

    def _categorize(self, question_normalized: str) -> PredictionMarketCategory:
        for rule in self._rules:
            for kw in rule.keywords:
                if kw in question_normalized:
                    return rule.category
        return PredictionMarketCategory.OTHER

    def map_market(
        self,
        venue: str,
        market_id: str,
        question: str,
        resolution_date: datetime | None = None,
        outcomes: tuple[str, ...] = ("YES", "NO"),
        mapped_sport_event_id: str | None = None,
        mapped_instrument_id: str | None = None,
    ) -> CanonicalPredictionMarket:
        """Map a venue-native market to a canonical prediction market."""
        q_norm = _normalize_question(question)
        category = self._categorize(q_norm)
        canonical_id = _build_canonical_id(category, q_norm)

        return CanonicalPredictionMarket(
            canonical_id=canonical_id,
            source_venue=venue,
            source_market_id=market_id,
            category=category,
            question_normalized=q_norm,
            resolution_date=resolution_date,
            outcomes=outcomes,
            mapped_sport_event_id=mapped_sport_event_id,
            mapped_instrument_id=mapped_instrument_id,
        )

    def find_cross_venue_matches(
        self,
        market: CanonicalPredictionMarket,
        all_markets: list[CanonicalPredictionMarket],
    ) -> list[CanonicalPredictionMarket]:
        """Find markets on other venues with the same canonical_id (same normalized question)."""
        return [
            m for m in all_markets if m.canonical_id == market.canonical_id and m.source_venue != market.source_venue
        ]


class OrphanDetector:
    """Detects prediction markets that could not be confidently categorized."""

    def detect_orphans(
        self,
        markets: list[CanonicalPredictionMarket],
    ) -> list[CanonicalPredictionMarket]:
        """Return markets categorized as OTHER (no rule matched)."""
        return [m for m in markets if m.category == PredictionMarketCategory.OTHER]
