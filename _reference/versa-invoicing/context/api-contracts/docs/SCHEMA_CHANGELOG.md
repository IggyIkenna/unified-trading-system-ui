# UAC Canonical Schema Changelog

Tracks per-type version bumps for all canonical Pydantic types in
`canonical/domain.py` and `execution.py`.

Semver rules: MAJOR = breaking (required field add/remove/type-change/rename);
MINOR = optional field added, new Enum member; PATCH = docs/metadata only.

See full rules: `unified-trading-codex/02-data/canonical-schema-versioning.md`

---

## CanonicalBetOrder

- **1.1.0** (2026-03-06): Added `american_odds: int | None` and `odds_format: OddsFormat` (optional fields — minor bump). Negative `american_odds` encodes bookmaker favorites (e.g. -110).
- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalComboBet _(new in 1.0.0)_

- **1.0.0** (2026-03-06): Initial release. Multi-leg parlay/accumulator/options-combo. `net_premium` can be negative for options combos.

## CanonicalComboLeg _(new in 1.0.0)_

- **1.0.0** (2026-03-06): Initial release. Single leg of a combo bet with `american_odds: int | None` and `odds_format`.

## CanonicalOrderBook

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalTrade

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalTicker

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalLiquidation

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalDerivativeTicker

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalWebSocketLifecycle

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalFee

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalOdds

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalBetMarket

- **1.0.0** (2026-03-06): Initial semver release (promoted from "1.0" string).

## CanonicalOrder _(execution.py)_

- **1.0.0** (2026-03-06): Initial semver release. Added `schema_version` field.

## CanonicalFill _(execution.py)_

- **1.0.0** (2026-03-06): Initial semver release. Added `schema_version` field.

## ExecutionInstruction _(execution.py)_

- **1.0.0** (2026-03-06): Initial semver release. Added `schema_version` field.

## ExecutionResult _(execution.py)_

- **1.0.0** (2026-03-06): Initial semver release. Added `schema_version` field.
