# Separation of Concerns: Three-Layer Architecture

## Layer Model

| Layer               | Repos                                                         | Responsibility                                                                                                       | Allowed imports                                                                                                                        |
| ------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Contracts (T0)**  | unified-api-contracts (UAC), unified-internal-contracts (UIC) | Schema definitions. UAC = external API schemas + canonical normalization. UIC = internal service-to-service schemas. | UAC: no deps except pydantic. UIC: depends on UAC only.                                                                                |
| **Interfaces (T2)** | UMI, UTEI, USEI, UDEI, UPI, URDI, UFI, USRI                   | Venue connectivity + canonical routing. Each interface owns adapters for a domain (market data, execution, etc.).    | Import from UAC (schemas + normalizers), UTL (infrastructure). Never define schemas.                                                   |
| **Services (T3)**   | All _-service, _-api repos                                    | Business logic. Consume canonical types from interfaces.                                                             | Import from UTL (infrastructure), interfaces (canonical output), UAC/UIC (type annotations). Never import from UAC external/{source}/. |

## Key Rules

1. **UAC owns all external schemas and normalization.** If a venue's API response needs a Pydantic model, it goes in
   `unified_api_contracts/external/{source}/schemas.py`. The normalizer goes in `external/{source}/normalize.py`.

2. **UIC owns all internal cross-service contracts.** If two services communicate (via PubSub, REST, or shared state),
   the message schema goes in UIC.

3. **Interfaces are adapters, not schema owners.** An interface adapter calls the external API, validates against UAC
   raw schemas, normalizes to UAC canonical types, and returns the canonical object. It does NOT define new schema
   types.

4. **Services consume canonical output only.** A service receives `CanonicalTicker`, `CanonicalOrder`, etc. from
   interfaces. It never parses raw API payloads or imports from `unified_api_contracts.external.{source}`.

5. **UAC and UIC are independent.** UAC cannot import from UIC. UIC can import from UAC (canonical types are shared).
   This prevents circular dependencies.

## Import Surface Rules

See `unified-trading-codex/02-data/contracts-scope-and-layout.md` section UAC Citadel Architecture for the full import
surface specification.

## Quality Gate Enforcement

- STEP 5.23 in `base-service.sh` and `base-library.sh` blocks deep UAC imports (`canonical.*`, `normalize_utils.*`,
  `config.*`, `shared.*`, `schemas.*`)
- Exempt repos: UAC (self), UIC (canonical neighbor), SIT (test harness)
- Auto-detected by `PACKAGE_NAME`/`SERVICE_NAME` in base scripts
