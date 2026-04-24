"""Circuit breaker configuration contracts.

Defines per-venue-type thresholds and error-class discrimination rules
for the execution-service circuit breaker. Configuration is loaded from
``unified-trading-pm/configs/circuit_breaker_config.yaml`` at runtime via
the UCI topology-reader pattern; these Pydantic models are the schema used
to parse and validate that YAML.

Design notes
------------
- ``triggering_error_classes``: CanonicalError subclass names that increment
  the failure counter toward the OPEN threshold.
- ``non_triggering_error_classes``: errors that do NOT count as failures
  (e.g. rate limits, market closed) — the circuit breaker stays CLOSED.
- ``environment`` narrows the config to a deployment tier; dev overrides
  use a lower ``failure_threshold`` and shorter ``cooldown_seconds`` to
  allow faster test iteration without waiting out 300-second windows.

Usage
-----
    from unified_internal_contracts.reference.circuit_breaker_config import (
        VenueCircuitBreakerConfig,
        CircuitBreakerConfigRegistry,
    )

    registry = CircuitBreakerConfigRegistry(
        venue_types={
            "cefi_exchange": VenueCircuitBreakerConfig(
                venue_type="cefi_exchange",
                failure_threshold=5,
                cooldown_seconds=300.0,
                triggering_error_classes=["CanonicalNetworkError"],
                non_triggering_error_classes=["CanonicalRateLimitError"],
            )
        }
    )
    cfg = registry.for_venue_type("cefi_exchange")
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class VenueCircuitBreakerConfig(BaseModel):
    """Circuit breaker thresholds and error-class rules for one venue type.

    Attributes
    ----------
    venue_type:
        Canonical venue category key (e.g. "cefi_exchange", "defi_protocol").
        Matches the top-level keys in ``circuit_breaker_config.yaml``.
    failure_threshold:
        Number of *triggering* errors required to move the breaker to OPEN.
        Non-triggering errors (rate limits, market closed) do not count.
    cooldown_seconds:
        Duration in seconds the breaker stays OPEN before returning to
        HALF_OPEN and allowing a single probe request.
    triggering_error_classes:
        List of ``CanonicalError`` subclass names whose occurrences count
        toward ``failure_threshold`` and can trip the breaker.
    non_triggering_error_classes:
        List of ``CanonicalError`` subclass names that are explicitly excluded
        from the failure counter; the breaker remains CLOSED regardless of
        how many times these errors occur.
    environment:
        Deployment tier this config applies to: ``"production"``,
        ``"staging"``, or ``"dev"``. Dev configs typically use lower
        thresholds to speed up test iteration.
    """

    venue_type: str = Field(description="Canonical venue category key.")
    failure_threshold: int = Field(
        gt=0,
        description=("Number of triggering errors required to open the circuit breaker."),
    )
    cooldown_seconds: float = Field(
        gt=0.0,
        description=("Seconds the breaker remains OPEN before transitioning to HALF_OPEN."),
    )
    triggering_error_classes: list[str] = Field(
        description=(
            "CanonicalError subclass names whose occurrences count as failures. "
            "Reaching failure_threshold with these errors opens the breaker."
        ),
    )
    non_triggering_error_classes: list[str] = Field(
        description=(
            "CanonicalError subclass names that are explicitly excluded from "
            "the failure counter (e.g. rate limits, market closed)."
        ),
    )
    environment: str = Field(
        default="production",
        description="Deployment tier: 'production', 'staging', or 'dev'.",
    )
    degraded_threshold: float = Field(
        default=0.3,
        description="Failure rate (0-1) at which the breaker enters DEGRADED state.",
    )
    open_threshold: float = Field(
        default=0.6,
        description="Failure rate (0-1) at which the breaker enters OPEN state.",
    )
    recovery_threshold: float = Field(
        default=0.05,
        description="Failure rate (0-1) below which the breaker recovers from DEGRADED to CLOSED.",
    )
    degraded_rate_limit_pct: float = Field(
        default=0.5,
        description="Fraction of normal throughput allowed while in DEGRADED state (0-1).",
    )
    window_seconds: int = Field(
        default=60,
        description="Sliding window duration in seconds used to calculate failure rate.",
    )


class CircuitBreakerConfigRegistry(BaseModel):
    """Registry mapping venue-type keys to their circuit breaker configs.

    Loaded once at startup from ``circuit_breaker_config.yaml``. Services
    call ``for_venue_type()`` to retrieve the config for a given venue.

    Attributes
    ----------
    venue_types:
        Mapping of venue-type key → ``VenueCircuitBreakerConfig``.
        Keys must match the ``venue_type`` field on each config entry.
    """

    venue_types: dict[str, VenueCircuitBreakerConfig] = Field(
        description="Mapping of venue-type key to circuit breaker config.",
    )

    def for_venue_type(self, venue_type: str) -> VenueCircuitBreakerConfig:
        """Return the circuit breaker config for a given venue type.

        Parameters
        ----------
        venue_type:
            Canonical venue category key (e.g. ``"cefi_exchange"``).

        Returns
        -------
        VenueCircuitBreakerConfig

        Raises
        ------
        KeyError
            If ``venue_type`` is not present in the registry.
        """
        if venue_type not in self.venue_types:
            raise KeyError(
                f"No circuit breaker config for venue_type={venue_type!r}. "
                f"Available: {sorted(self.venue_types)}"
            )
        return self.venue_types[venue_type]


__all__ = [
    "CircuitBreakerConfigRegistry",
    "VenueCircuitBreakerConfig",
]
