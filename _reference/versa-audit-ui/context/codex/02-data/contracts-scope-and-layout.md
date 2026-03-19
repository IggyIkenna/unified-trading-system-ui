# Contracts Scope and Layout — SSOT

**SSOT for:** AC vs UIC scope, dependency rule (AC cannot import UIC), and package layout. For full detail:
unified-api-contracts/docs/PACKAGE_LAYOUT_AND_SCOPE.md. VCR:
[02-data/vcr-cassette-ownership.md](vcr-cassette-ownership.md).

**Repo:** [unified-api-contracts](https://github.com/central-element/unified-api-contracts) — raw external schemas
(`unified_api_contracts/external/`) and normalised canonicals (`unified_api_contracts/canonical/`). An auto-generated
**schema audit matrix** (`docs/SCHEMA_AUDIT_MATRIX.md`) lists Provider × Schema Type with ✓/~/— and canonical target.
Regenerate via `python scripts/generate_schema_audit_matrix.py`. Use for auditing usage, orphaned schemas, import
errors, and missing functionality in downstream consumers.

---

## Dependency rule (blocking)

**unified-api-contracts must not import from unified-internal-contracts.** AC is a Tier 0 leaf; it has no `unified-*`
dependencies. Internal contracts can depend on AC; AC cannot depend on UIC.

Therefore **all schemas needed for mapping must remain in unified-api-contracts**, including:

- Canonical instrument IDs and venue identifiers used in normalization
- Venue enums / manifest used by `normalize.py` and external→canonical mapping
- Any type that `unified_api_contracts.canonical` or venue adapters need to produce canonical output

---

## Scope rule

- **unified-api-contracts** = **external API contracts** + **mapping surface**. Schemas for third-party APIs (exchanges,
  data providers, cloud SDKs) and anything required to map them to canonical types.
- **unified-internal-contracts** = **internal contracts only**. Schemas used to contract our codebase to our codebase
  (no external API surface). If a schema is **not** used for any external API contract and **not** needed for mapping,
  it does **not** belong in api-contracts — move or keep it in internal-contracts.

---

## Normalization ideology

- **UAC = normalization layer** — like an internal CCXT/TARDIS. unified-api-contracts maps raw venue responses to
  canonical types.
- **Interfaces** (UMI, UTEI, USEI, UDEFI) are **venue routers** — they choose venue but return normalized data only.
- **Raw venue responses must never flow to services** — always normalize via UAC before returning.
- **Scope:** all response types — trades, orderbooks, tickers, positions, balances, liquidations, funding, OHLCV, market
  info, errors, WebSocket, sports, alt data.
- **Domain split:** canonical with optional fields; sub-types only when structures are incompatible; group by
  instruction type (TRADE, SWAP, LEND, BORROW, etc.).

---

## Layout rule

Top-level packages under `unified_api_contracts/` are grouped into three buckets:

| Bucket                              | Purpose                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **shared**                          | Cross-venue shared types, errors, quotas                                                               |
| **unified_api_contracts/external**  | Raw per-venue request/response/errors; venue_manifest, sports, nautilus, prime_broker, fix, regulatory |
| **unified_api_contracts.canonical** | Canonical domain/execution/errors + normalize                                                          |

Internal-only schemas (e.g. risk, VaR, stress testing) belong in unified-internal-contracts.

---

## Import direction rules

- **unified-api-contracts**: stdlib + pydantic only; **no `unified-*` imports at all** — not even in tests.
  `test_ac_uic_alignment.py` (which imports UIC inside the UAC test suite) is a **known CIRCULAR violation** and must be
  moved to `unified-internal-contracts/tests/`.
- **unified-internal-contracts**: stdlib + pydantic + **permitted to import from `unified_api_contracts.canonical`**
  (normalization canonicals re-used in messaging). No cloud SDKs. UIC → UAC is the **only** permitted inter-T0 import
  direction.
- **Tier formalization:** UAC = true T0 leaf (no workspace imports). UIC = T0-with-UAC-dependency. Build order must
  place UAC (L2a) before UIC (L2b) in CI/CD.

## Canonical type ownership (normalization vs messaging)

- **Canonical types output by normalizers** (e.g. CanonicalOrderBook, CanonicalTrade, CanonicalTicker) → defined in UAC
  `unified_api_contracts/canonical/`, re-exported by UIC `market_data/__init__.py` for messaging use.
- **Canonical types used only in internal messaging** (e.g. CanonicalOHLCV, CanonicalBookUpdate, CeFiPosition) → defined
  in UIC.
- **Duplicate or conflict**: If the same concept has different definitions in both repos, resolve by determining which
  side is the normalizer output (UAC) vs messaging contract (UIC). Known conflicts: InstrumentRecord (CONFLICT — UAC
  76-field warehouse schema vs UIC 31-field adapter contract), CanonicalOraclePrice, CanonicalStakingRate,
  CanonicalOptionsChainEntry (DUPLICATE — must resolve ownership).

## Domain schema placement

- **Service domain data schemas** (Pydantic BaseModel, TypedDict, @dataclass used as cross-repo contracts) belong in UIC
  `domain/<service-name>/`.
- Services access their domain schemas via `unified-trading-library` or `unified-domain-client`, not by defining them
  locally.
- **SchemaDefinition / ColumnSchema** (parquet infrastructure from unified-trading-library) stay in the service's
  `schemas/output_schemas.py` — these are enforcement descriptors, not data contracts.
- Audit: see `plans/active/SCHEMA_CONTRACTS_AUDIT.md` Section 3b for all known violations.

## Quality gates and schema organization checks

Quality gates enforce schema placement:

- **UAC** (`scripts/check_schema_organization.py`): Schemas in `unified_api_contracts/schemas/` must be used in at least
  one of: `unified_api_contracts/canonical/normalize/`, `unified_api_contracts/external/`, or `tests/`. If not used, the
  schema is internal-only and should live in UIC.
- **UIC** (`scripts/check_schema_organization.py`): Domain schemas under `domain/<service-name>/`; UAC imports only from
  `unified_api_contracts.canonical`.
- **Other repos** (`unified-trading-pm/scripts/validation/check_schema_provenance.py`): Local
  BaseModel/TypedDict/dataclass definitions should import from UAC or UIC. Cross-repo contracts must come from one of
  those two.

### Exception: schemas required in UAC for normalization/testing

If a schema that looks internal (UIC-style) is **actually used** in UAC for normalization or testing, it must remain in
UAC to avoid circular imports (UAC cannot import UIC). Add `# SCHEMA_UAC_REQUIRED` in the first 20 lines of the file to
exempt it from the UAC organization check.

### Exception: internal-only schemas in services

If a service defines a schema that is purely internal (not a cross-repo contract), add `# SCHEMA_PROVENANCE_EXEMPT` in
the first 20 lines to exempt from the provenance check.

---

## Internal schema reference locations

| Schema                   | SSOT                                                         | Consumers                                     |
| ------------------------ | ------------------------------------------------------------ | --------------------------------------------- |
| **InstrumentDefinition** | `unified_internal_contracts.reference.instrument_definition` | instruments-service, market-tick-data-service |

Import: `from unified_internal_contracts import InstrumentDefinition`

---

## UAC Citadel Architecture (v2 layout)

UAC follows a **facade pattern** with strict import surface rules. The top-level package `unified_api_contracts/`
exposes thin facade modules that re-export from internal sub-packages.

### Package structure

| Package                    | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `canonical/`               | Canonical normalized types, grouped by domain                           |
| `canonical/domain/`        | Domain-specific canonicals (market_data, execution, defi, sports, etc.) |
| `canonical/crosscutting/`  | Cross-domain canonicals (errors, pagination, metadata)                  |
| `registry/`                | Capability registry + venue manifest                                    |
| `registry/capability/`     | Per-source capability declarations (modes, envs, operations)            |
| `registry/venue_manifest/` | Venue metadata, connection params, rate limits                          |
| `external/`                | Raw per-source external schemas, flat layout (one module per source)    |
| `normalize_utils/`         | Internal normalization helpers (not part of public import surface)      |

### Import surface rules

1. **Services and libraries** import from the top-level facade only:
   `from unified_api_contracts import CanonicalTrade, CanonicalOrderBook`
2. **Internal sub-packages** (`canonical/`, `registry/`, `external/`) are implementation detail. Direct imports from
   sub-packages are permitted but not required.
3. **`normalize_utils/`** is internal-only. Never import from outside UAC.
4. **`external/`** modules are flat (one file per source). No nesting beyond one level.

### Capability registry

Each source declares its capabilities in `registry/capability/`:

- Supported modes (batch, live, replay)
- Supported environments (prod, sandbox, testnet)
- Supported operations (trades, orderbook, ohlcv, etc.)
- API key scope requirements (prod vs test keys)

Fail-fast error classes in UTL (`unified_trading_library.core.capability_errors`) are raised BEFORE any network call
when an adapter is called with an unsupported mode, environment, or auth scope. Error classes: `UnsupportedModeError`,
`UnsupportedEnvironmentError`, `ApiKeyScopeMismatchError`, `CapabilityResolutionError`, `UnsupportedOperationError`.
