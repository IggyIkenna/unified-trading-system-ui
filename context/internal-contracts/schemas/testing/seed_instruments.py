"""Instrument metadata seeder for the dev project — registry-driven.

Generates instruments.json from InstrumentGenerator (which reads UAC
representative_sample registry). No hardcoded instrument lists.

Usage:
    python seed_instruments.py --output /tmp/seed_data/
    python seed_instruments.py --output /tmp/seed_data/ --dry-run
    python seed_instruments.py --output /tmp/seed_data/ --scenario flash_crash
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import date
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def build_instruments(
    ref_date: date | None = None,
    seed: int = 42,
    include_options_chain: bool = False,
    scenario_name: str | None = None,
) -> list[dict[str, object]]:
    """Generate instruments from UAC registry via InstrumentGenerator.

    Args:
        ref_date: Reference date for expiry calculations (default: today).
        seed: RNG seed for deterministic generation.
        include_options_chain: Whether to include the full options chain.
        scenario_name: Optional MockScenario name for instrument_overrides.

    Returns:
        List of instrument dicts (JSON-serializable).
    """
    from unified_internal_contracts.testing.instrument_generator import InstrumentGenerator

    gen = InstrumentGenerator(seed=seed)

    # Apply scenario instrument_overrides if provided
    if scenario_name:
        from unified_internal_contracts.modes import MockScenario
        from unified_internal_contracts.testing.scenario_config import ScenarioConfig

        cfg = ScenarioConfig.load(MockScenario(scenario_name))
        for override in cfg.instrument_overrides:
            if override.action == "expire":
                gen.expire_instrument(override.instrument_key or override.pattern)
            elif override.action == "delist":
                gen.delete_instrument(override.instrument_key or override.pattern)

    effective_date = ref_date or date.today()
    instruments = gen.generate_all(
        ref_date=effective_date,
        include_options_chain=include_options_chain,
    )

    results: list[dict[str, object]] = []
    for inst in instruments:
        d = inst.model_dump(mode="json", exclude_none=True)
        results.append(d)

    # Log asset class breakdown
    classes: dict[str, int] = {}
    for d in results:
        ac = str(d.get("asset_group", "unknown"))
        classes[ac] = classes.get(ac, 0) + 1
    log.info("Generated %d instruments: %s", len(results), dict(sorted(classes.items())))

    return results


def _validate_instruments(instruments: list[dict[str, object]]) -> int:
    """Validate instruments against CanonicalInstrument schema. Returns error count."""
    from unified_api_contracts import CanonicalInstrument

    errors = 0
    for inst in instruments:
        key = inst.get("instrument_key", "UNKNOWN")
        required = {"instrument_key", "venue", "symbol", "timestamp"}
        missing = required - set(inst.keys())
        if missing:
            log.error("Instrument %s missing required fields: %s", key, missing)
            errors += 1
            continue
        # Validate by round-tripping through CanonicalInstrument
        try:
            CanonicalInstrument.model_validate(inst)
        except Exception as exc:
            log.error("Validation failed for %s: %s", key, exc)
            errors += 1

    return errors


def main() -> None:
    """CLI entry point."""
    parser = argparse.ArgumentParser(description="Seed instrument metadata from UAC registry")
    parser.add_argument("--output", type=Path, required=True, help="Output directory")
    parser.add_argument("--dry-run", action="store_true", help="Validate only, don't write")
    parser.add_argument("--seed", type=int, default=42, help="RNG seed")
    parser.add_argument("--ref-date", type=str, default=None, help="Reference date (YYYY-MM-DD)")
    parser.add_argument("--include-options", action="store_true", help="Include full options chain")
    parser.add_argument(
        "--scenario", type=str, default=None, help="MockScenario name for overrides"
    )
    args = parser.parse_args()

    ref = date.fromisoformat(args.ref_date) if args.ref_date else None
    instruments = build_instruments(
        ref_date=ref,
        seed=args.seed,
        include_options_chain=args.include_options,
        scenario_name=args.scenario,
    )

    errors = _validate_instruments(instruments)
    if errors > 0:
        log.error("Validation failed: %d errors", errors)
        sys.exit(1)

    log.info("All %d instruments validated successfully", len(instruments))

    if args.dry_run:
        log.info("Dry run — not writing files")
        return

    output_path = args.output / "instruments.json"
    args.output.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(instruments, indent=2, default=str) + "\n")
    log.info("Wrote %s (%d instruments)", output_path, len(instruments))


if __name__ == "__main__":
    main()
