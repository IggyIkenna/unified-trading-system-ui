# Schema Governance — UAC vs UIC

**SSOT for:** Where schemas live, UAC vs UIC scope, placement rules. See also `unified-trading-codex/02-data/contracts-scope-and-layout.md`.

## Dependency Rule (Blocking)

**unified-api-contracts must not import from unified-internal-contracts.** UAC is a Tier 0 leaf; it has no `unified-*` dependencies.

Therefore **all schemas needed for mapping remain in UAC**, including:

- Canonical instrument IDs and venue identifiers used in normalization
- Venue enums / manifest used by `canonical/normalize/` and external→canonical mapping
- Any type that canonical normalizers or venue adapters need to produce canonical output

## Scope Rule

| Repo    | Scope                                                                                                                                                                |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **UAC** | External API contracts + mapping surface. Schemas for third-party APIs (exchanges, data providers, cloud SDKs) and anything required to map them to canonical types. |
| **UIC** | Internal contracts only. Schemas used to contract our codebase to our codebase (no external API surface).                                                            |

**Check order:** (1) Is it needed for mapping or external contract? If yes → UAC. (2) Is it used for external contract? If no and not needed for mapping → UIC. (3) Is it imported by repos at/below L6 only for internal use? If yes and not external → UIC.

## Placement Rules (UAC)

| Content Type                                 | Location               | Examples                                       |
| -------------------------------------------- | ---------------------- | ---------------------------------------------- |
| Raw schemas for external API/venue           | `external/<name>/`     | binance, databento, ccxt, thegraph             |
| Canonical domain/execution/error types       | `canonical/`           | domain.py, execution.py, errors.py             |
| Normalizers (raw → canonical)                | `canonical/normalize/` | cefi_trades.py, cefi_orderbooks.py, errors.py  |
| Cross-venue shared (not single external API) | `schemas/`             | \_venue_errors_cefi.py, \_venue_errors_defi.py |
| Cross-venue utilities                        | `shared/`              | ErrorAction, quota_types                       |

## Canonical vs Messaging Ownership

- **Canonical types output by normalizers** (CanonicalTrade, CanonicalOrderBook, CanonicalOrder, CanonicalFill, CanonicalError) → defined in UAC `canonical/`, re-exported by UIC for messaging use.
- **Canonical types used only in internal messaging** (e.g. CeFiPosition, DeFiLPPosition) → defined in UIC.
- **Conflict:** If the same concept has different definitions in both repos, resolve by: normalizer output → UAC; messaging-only → UIC.

## Quality Gate Checks

- **UAC:** Schemas in `schemas/` must be used in at least one of: `canonical/normalize/`, `external/`, or `tests/`. If not used, the schema is internal-only and should live in UIC.
- **UIC:** Domain schemas under `domain/<service-name>/`; UAC imports only from `unified_api_contracts.canonical`.
- **Other repos:** Local BaseModel/TypedDict/dataclass definitions should import from UAC or UIC. Cross-repo contracts must come from one of those two.

## Exception: SCHEMA_UAC_REQUIRED

If a schema that looks internal (UIC-style) is **actually used** in UAC for normalization or testing, it must remain in UAC to avoid circular imports. Add `# SCHEMA_UAC_REQUIRED` in the first 20 lines of the file to exempt it from the UAC organization check.
