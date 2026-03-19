# UIC Domain Schema Changelog

Tracks per-file version bumps for domain schema files in
`unified_internal_contracts/domain/<service>/`.

Semver rules: MAJOR = breaking (required field add/remove/type-change/rename);
MINOR = optional field added, new Enum member; PATCH = docs/metadata only.

UIC types that re-use UAC canonical types (e.g. `CanonicalBetOrder`) do NOT carry
their own version — reference UAC's `CANONICAL_*_VERSION` constant instead.

See full rules: `unified-trading-codex/02-data/canonical-schema-versioning.md`

---

## execution_service/sports.py

- **1.0.0** (2026-03-06): Initial semver release. Added `__schema_version__` constant and `schema_version` field on `SportsBetResult`.

## market_data_api/orderbook_schema.py

- **1.0.0** (2026-03-06): Initial semver release. Added `__schema_version__` module constant (dataclass — no instance field).

## market_data_processing/candle_schema.py

- **1.0.0** (2026-03-06): Initial semver release. Added `__schema_version__` module constant (StrEnum types — no instance field).

## market_data_processing/adapter_models.py

- **1.0.0** (2026-03-06): Initial semver release. Added `__schema_version__` module constant (dataclass/dict subclass — no instance field).

## strategy_service/order.py

- **1.0.0** (2026-03-06): Initial semver release. Added `__schema_version__` module constant (dataclass — no instance field).

## strategy_service/domain_events.py

- **1.0.0** (2026-03-06): Initial semver release. Added `__schema_version__` module constant (dataclasses — no instance field).
