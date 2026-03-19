"""Odds format conversion utilities.

Supports conversion between decimal, American, and fractional formats.
American odds can be negative (favorite, e.g. -110) or positive (underdog, e.g. +200).
Decimal odds are always >= 1.01.

These utilities are used by normalizers that receive American-format odds
(common in Pinnacle, DraftKings, FanDuel, US sportsbooks) and need to store
them in the canonical decimal format while preserving the original value.
"""

from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal


def american_to_decimal(american: int) -> Decimal:
    """Convert American odds (positive or negative) to decimal odds.

    American odds semantics:
      Positive (+200): underdog — profit of 200 on a 100 stake → decimal 3.0
      Negative (-110): favorite — stake 110 to profit 100 → decimal ~1.909

    Args:
        american: American odds integer. Positive = underdog, negative = favorite.
                  Must not be 0 or -100 (degenerate cases with no sensible mapping).

    Returns:
        Decimal odds (always >= 1.0).

    Raises:
        ValueError: If american is 0 or -100.
    """
    if american == 0:
        raise ValueError("American odds of 0 is not valid")
    if american == -100:
        raise ValueError("American odds of -100 is degenerate (implies even money — use +100 or -100 consistently)")
    if american > 0:
        return (Decimal(american) / 100 + 1).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)
    return (Decimal(100) / Decimal(-american) + 1).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


def decimal_to_american(decimal_odds: Decimal) -> int:
    """Convert decimal odds to American odds integer.

    Args:
        decimal_odds: Decimal odds >= 1.01.

    Returns:
        American odds integer. Positive for underdogs (>= 2.0 decimal),
        negative for favorites (< 2.0 decimal).

    Raises:
        ValueError: If decimal_odds < 1.01.
    """
    if decimal_odds < Decimal("1.01"):
        raise ValueError(f"Decimal odds must be >= 1.01, got {decimal_odds}")
    if decimal_odds >= 2:
        return int((decimal_odds - 1) * 100)
    return -int(100 / (decimal_odds - 1))


def fractional_to_decimal(numerator: int, denominator: int) -> Decimal:
    """Convert fractional odds (e.g. 3/1) to decimal.

    Args:
        numerator: Numerator of the fraction (e.g. 3 for "3/1" odds).
        denominator: Denominator of the fraction (e.g. 1 for "3/1" odds).

    Returns:
        Decimal odds.

    Raises:
        ValueError: If denominator is 0.
    """
    if denominator == 0:
        raise ValueError("Fractional odds denominator cannot be 0")
    return (Decimal(numerator) / Decimal(denominator) + 1).quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


__all__ = [
    "american_to_decimal",
    "decimal_to_american",
    "fractional_to_decimal",
]
