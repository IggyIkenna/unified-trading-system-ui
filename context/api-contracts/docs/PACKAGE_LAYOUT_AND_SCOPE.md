# Package Layout and Scope: unified-api-contracts

**SSOT:** This doc defines the layout for `unified-api-contracts`. See also `unified-trading-pm/workspace-manifest.json` (arch_tier, L6 and below) and codex `02-data/vcr-cassette-ownership.md` (circular dependency rules).

## Dependency rule (blocking)

**unified-api-contracts must not import from unified-internal-contracts.** AC is a Tier 0 leaf; it has no `unified-*` dependencies. Internal contracts can depend on AC; AC cannot depend on UIC.

Therefore **all schemas needed for mapping must remain in unified-api-contracts**, including:

- Canonical instrument IDs and venue identifiers used in normalization
- Venue enums / manifest used by `normalize.py` and external-to-canonical mapping
- Any type that `canonical` or venue adapters need to produce canonical output

If a schema is only used for internal service-to-service contracts and is not needed for external API mapping, it belongs in unified-internal-contracts. If it is needed for mapping (or for external API request/response typing), it stays in AC.

## Scope rule

- **unified-api-contracts** = **external API contracts** + **mapping surface**. Schemas for third-party APIs (exchanges, data providers, cloud SDKs) and anything required to map them to canonical types (venues, canonical IDs, normalised types). Interfaces own connectivity; this repo owns **mapping** (normalize) and **external contract availability and typing**.
- **unified-internal-contracts** = **internal contracts only**. Schemas used to contract our codebase to our codebase (no external API surface). If a schema is **not** used for any external API contract and **not** needed for mapping, it does **not** belong in api-contracts -- move or keep it in internal-contracts.

**Check order:** (1) Is it needed for mapping or external contract? If yes, AC. (2) Is it used for external contract? If no and not needed for mapping, internal-contracts. (3) Is it imported by repos at/below L6 only for internal use? If yes and not external, internal-contracts.

## Current package layout

```
unified_api_contracts/
├── __init__.py
│
├── # ── Root facade files (domain re-exports) ──
├── market.py                  # Market data canonical re-exports
├── execution.py               # Execution canonical re-exports
├── reference.py               # Reference data canonical re-exports
├── sports.py                  # Sports canonical re-exports
├── sports_reference.py        # Sports reference data
├── position.py                # Position canonical re-exports
├── features.py                # Feature vector re-exports
├── derivatives.py             # Derivatives / options re-exports
├── infrastructure.py          # Infrastructure canonical re-exports
├── connectivity.py            # Connectivity canonical re-exports
├── latency.py                 # Latency canonical re-exports
├── options.py                 # Options canonical re-exports
├── odds.py                    # Odds canonical re-exports
├── errors.py                  # Error canonical re-exports
├── rate_limits.py             # Rate limits re-exports
│
├── canonical/                 # Canonical types (domain + crosscutting + errors)
│   ├── canonical_mappings.py  # Cross-venue canonical mapping tables
│   ├── crosscutting/          # Cross-domain canonical types
│   │   ├── analytics.py
│   │   ├── connectivity.py
│   │   ├── latency.py
│   │   ├── rate_limits.py
│   │   └── risk.py
│   ├── domain/                # Per-domain canonical types
│   │   ├── market/            # Canonical market data (spread, tradfi)
│   │   ├── execution/         # Canonical execution (base, defi, prime_broker, sports, trade)
│   │   ├── reference/         # Canonical reference data
│   │   ├── sports/            # Canonical sports (fixtures, odds, features, mappings, etc.)
│   │   ├── position/          # Canonical position types
│   │   ├── features/          # Canonical feature models
│   │   ├── derivatives/       # Canonical derivatives / options
│   │   ├── infrastructure/    # Canonical infra (ci, compute)
│   │   └── onchain/           # Canonical on-chain types
│   └── errors/                # Canonical error types (cefi, defi, altdata, sports)
│
├── external/                  # Raw per-source request/response/error schemas (79 sources)
│   ├── binance/               # CeFi exchanges
│   ├── coinbase/
│   ├── okx/
│   ├── bybit/
│   ├── kraken/
│   ├── ...
│   ├── databento/             # TradFi / data providers
│   ├── tardis/
│   ├── ibkr/
│   ├── yahoo_finance/
│   ├── ...
│   ├── hyperliquid/           # DeFi
│   ├── alchemy/
│   ├── thegraph/
│   ├── dydx/
│   ├── ...
│   ├── betfair/               # Sports
│   ├── pinnacle/
│   ├── polymarket/
│   ├── odds_api/
│   ├── ...
│   ├── fix/                   # Protocols
│   ├── nautilus/
│   ├── prime_broker/
│   ├── regulatory/
│   ├── protocol_sdks/
│   ├── gcp/                   # Cloud SDKs
│   ├── aws/
│   └── github/
│   # Each source dir contains: schemas.py, normalize.py, examples/, mocks/
│
├── normalize_utils/           # Shared normalization helpers (used by per-source normalize.py)
│   ├── ohlcv.py
│   ├── tickers.py
│   ├── orderbooks.py
│   ├── trades.py
│   ├── symbols.py
│   ├── instruments.py
│   ├── options.py
│   ├── sports.py
│   ├── onchain.py
│   ├── tradfi.py
│   ├── sides.py
│   ├── fees.py
│   ├── liquidations.py
│   ├── connectivity.py
│   ├── infrastructure.py
│   ├── rate_limits.py
│   ├── market_state.py
│   └── ...  (25 modules total)
│
├── registry/                  # Venue/capability/endpoint registry
│   ├── capability.py          # Capability enum + types
│   ├── capability_data.py     # Capability data per venue
│   ├── endpoint_registry.py   # Endpoint registry API
│   ├── endpoints.py           # Endpoint definitions
│   ├── venue_constants.py     # Venue name constants
│   ├── venue_rate_limits.py   # Per-venue rate limit config
│   ├── provider_modes.py      # Provider mode config
│   ├── quota_broker.py        # Quota broker types
│   ├── venue_manifest/        # Venue manifest data files
│   │   ├── betting_sports.py
│   │   ├── cefi.py
│   │   ├── data_providers.py
│   │   ├── defi.py
│   │   ├── internal_services.py
│   │   └── tradfi.py
│   └── _endpoint_registry_data.py / _endpoint_registry_types.py
│
├── config/                    # Validation config
│   └── trading_validation.py
│
├── shared/                    # Reserved (currently empty)
│
└── testing/                   # Test infrastructure (exported for consumers)
    ├── conftest_helper.py
    ├── detect_cassette_drift.py
    ├── fault_injection.py
    ├── network_block_plugin.py
    └── vcr_endpoints.py
```

## Key design points

**Root facade files.** Each domain has a root-level `.py` file (e.g. `market.py`, `execution.py`, `sports.py`) that re-exports canonical types for that domain. Consumers import from these for convenience: `from unified_api_contracts.market import ...`.

**Per-source normalize.py.** Each `external/{source}/` directory contains its own `normalize.py` that maps raw venue schemas to canonical types. There are 74 normalize.py files across the 79 source directories. Shared normalization helpers live in `normalize_utils/`.

**Registry.** The `registry/` package replaced the old top-level `venue_manifest/`. It contains capability definitions, endpoint registry, venue constants, rate limits, and venue manifest data files organized by category (cefi, defi, tradfi, sports, data providers, internal services).

**Canonical domain split.** The old flat `canonical/domain.py` + `canonical/execution.py` + `canonical/errors.py` + `canonical/normalize.py` structure has been replaced with `canonical/domain/{market,execution,reference,sports,position,features,derivatives,infrastructure,onchain}/`, `canonical/crosscutting/`, and `canonical/errors/`.

## Deleted directories (no longer exist)

The following directories referenced in earlier documentation have been removed:

- `canonical/normalize/` -- normalization moved to per-source `external/{source}/normalize.py` + shared `normalize_utils/`
- `schemas/` -- cross-venue schemas moved into `canonical/crosscutting/` or `external/`
- `shared/` content -- currently empty (only `__pycache__`)
- `sports/` (top-level) -- sports canonical types now in `canonical/domain/sports/`; per-source sports schemas in `external/{betfair,pinnacle,polymarket,...}/`
- `internal/` -- internal service-to-service schemas belong in unified-internal-contracts
- `external/sports/` (sub-directory) -- sports sources are individual dirs under `external/`
- `external/venue_manifest/` -- moved to `registry/venue_manifest/`
- `external/cloud_sdks/` -- cloud SDK schemas live directly under `external/gcp/`, `external/aws/`
- `external/onchain/` -- on-chain schemas in `external/alchemy/`, `external/thegraph/`, etc.
- `external/macro/` -- macro data in `external/fred/`, `external/ecb/`, etc.

## Who tests what

- **Interfaces** (UMI, UOI, etc.): Connectivity and **validity of raw external schemas** against live or VCR-recorded responses.
- **unified-api-contracts (this repo):** **Mapping** (normalize), **external contract availability**, and **typing**; VCR replay is invoked by interfaces, not run in AC CI.
