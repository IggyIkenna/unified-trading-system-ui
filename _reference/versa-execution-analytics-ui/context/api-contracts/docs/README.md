# unified-api-contracts docs

This directory holds **contract- and schema-centric** documentation only. Recording, transport, and venue-implementation details live in **codex** or **interface** docs per separation of concerns.

## Doc ownership (separation of concerns)

| Doc                                      | Stays here (AC)                                                | Moved / consolidated to                                                          |
| ---------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **INDEX.md**                             | ✅ Per-venue contract index, schema paths                      | —                                                                                |
| **API_CONTRACTS_AVAILABLE_INVENTORY.md** | ✅ What AC has (inventory)                                     | —                                                                                |
| **API_CONTRACTS_CHAIN_OF_EVENTS.md**     | ✅ Config → schema validation → adapter; VCR replay only in AC | —                                                                                |
| **ARCHITECTURE.md**                      | ✅ Package layout, external vs normalised                      | —                                                                                |
| **CONFIGURATION.md**                     | ✅ Consumers + AC-only (no live/keys)                          | —                                                                                |
| **CROSS_VENUE_MATRIX.md**                | ✅ Schema coverage, CCXT vs direct                             | —                                                                                |
| **VENUE_DATA_TYPES.md**                  | ✅ Data types per venue (schema-level)                         | —                                                                                |
| **TESTING.md**                           | ✅ AC tests, replay only                                       | Recording → codex / interfaces                                                   |
| **MOCKS_AND_VCR.md**                     | Replay + cassette layout only                                  | **Recording how-to** → `unified-trading-codex/02-data/vcr-cassette-ownership.md` |
| **VCR_SCHEMA_ALIGNMENT.md**              | Schema/coverage checklist in AC                                | **Recording + alignment workflow** → codex or interface docs                     |
| **TRANSPORT_AND_ENDPOINTS.md**           | Optional short ref (REST/WS/FIX per venue)                     | **Full transport/how-to** → codex `02-data` or interface docs                    |
| **TRADFI_VENUE_NUANCES.md**              | Optional short ref                                             | **Implementation nuances** → codex or UMI/URDI docs                              |
| **VIX_LIVE_RESEARCH.md**                 | Optional (research note)                                       | **Codex** `02-data` or UMI if UMI-specific                                       |

## Where to look

- **Schemas, versions, chain of events, inventory**: this directory + repo root (SCHEMA_VERSIONS.md, README, CONTRIBUTING).
- **VCR recording, live validation, contributing cassettes via PR**: `unified-trading-codex/02-data/vcr-cassette-ownership.md` (SSOT). Interfaces record and **contribute cassettes to AC’s `mocks/` via PR**; they hold API keys and run recording.
- **Contract integration (consumers)**: `unified-trading-codex/05-infrastructure/contracts-integration.md`.

## Consolidation status

- AC docs have been trimmed so they do not describe collection/VCR recording in this repo.
- Recording and “how to add cassettes” are documented in codex (vcr-cassette-ownership.md). Interfaces are expected to add their own recording scripts when needed; no recording script ships in AC.
