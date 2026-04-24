"""Deterministic mock scenario configuration.

Each scenario is identified by a MockScenario enum value and loaded from a
YAML file in the scenarios/ directory. Using the same scenario name always
produces identical synthetic data — the seed is baked into the YAML.
"""

from __future__ import annotations

from enum import StrEnum
from pathlib import Path

import yaml
from pydantic import BaseModel, Field

from unified_internal_contracts.modes import MockScenario


class InstrumentOverrideAction(StrEnum):
    """Action to perform on an instrument in a scenario."""

    INJECT = "inject"
    EXPIRE = "expire"
    DELIST = "delist"


class InstrumentOverride(BaseModel):
    """Instrument override for scenario-specific instrument mutations.

    Layer 2 of the 3-layer instrument architecture:
      Layer 1: REPRESENTATIVE_INSTRUMENT_SAMPLE (default, in UAC)
      Layer 2: Scenario overrides (this model — inject, expire, delist)
      Layer 3: User ad-hoc (runtime API mutations)
    """

    action: InstrumentOverrideAction
    instrument_key: str = ""
    pattern: str = ""
    missing_fields: list[str] = Field(default_factory=list)
    available_from: str = ""
    available_to: str = ""


class InstrumentFaultRule(BaseModel):
    """Per-instrument fault targeting — applies FaultConfig overrides to specific instruments.

    Use glob patterns to target specific venues, types, or symbols.
    Example: pattern="DERIBIT:OPTION:*" with error_rate=0.5 makes Deribit options
    fail 50% of the time while other instruments use the global fault rates.
    """

    pattern: str
    error_rate: float | None = None
    timeout_rate: float | None = None
    corrupt_schema_rate: float | None = None
    missing_data_rate: float | None = None
    latency_ms: int | None = None
    price_drop_pct: float | None = None


class FaultConfig(BaseModel):
    """Fault injection parameters for a scenario.

    Global rates apply to all instruments. Per-instrument rules (instrument_faults)
    override global rates for matching instruments, enabling targeted fault testing.
    """

    latency_ms: int = 0
    error_rate: float = 0.0
    timeout_rate: float = 0.0
    rate_limit_rate: float = 0.0
    corrupt_schema_rate: float = 0.0
    error_burst_duration_s: int = 0
    price_drop_pct: float = 0.0
    recovery_minutes: int = 0
    instrument_faults: list[InstrumentFaultRule] = Field(default_factory=list)

    def effective_rate(self, instrument_key: str, field: str) -> float:
        """Get the effective fault rate for a specific instrument.

        Checks per-instrument rules first, falls back to global rate.
        """
        import fnmatch

        for rule in self.instrument_faults:
            if fnmatch.fnmatch(instrument_key, rule.pattern):
                override = getattr(rule, field, None)
                if override is not None:
                    return float(override)
        return float(getattr(self, field, 0.0))


class ScenarioConfig(BaseModel):
    """Complete configuration for a named deterministic mock scenario.

    Same ``name`` (and therefore same ``seed``) always produces identical
    synthetic data across all generators that honour this config.
    """

    name: MockScenario
    seed: int
    vol_multiplier: float = Field(default=1.0, ge=0.0)
    volume_multiplier: float = Field(default=1.0, ge=0.0)
    missing_data_rate: float = Field(default=0.0, ge=0.0, le=1.0)
    delay_ms: int = Field(default=0, ge=0)
    fast_forward_factor: float = Field(default=1.0, gt=0.0)
    fault: FaultConfig | None = None
    instrument_overrides: list[InstrumentOverride] = Field(default_factory=list)
    description: str = ""

    @classmethod
    def load(cls, scenario: MockScenario) -> ScenarioConfig:
        """Load scenario config from bundled YAML file.

        Args:
            scenario: Scenario identifier.

        Returns:
            ScenarioConfig for the given scenario.

        Raises:
            FileNotFoundError: If no YAML file exists for the scenario.
        """
        yaml_path = Path(__file__).parent / "scenarios" / f"{scenario}.yaml"
        if not yaml_path.exists():
            raise FileNotFoundError(f"No scenario YAML for {scenario!r} — expected {yaml_path}")
        return cls.model_validate(yaml.safe_load(yaml_path.read_text()))
