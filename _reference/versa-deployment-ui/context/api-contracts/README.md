# unified-api-contracts

Pydantic schemas, example JSON, and VCR cassette directories for external APIs used by the unified-trading system (UMI, UOI, and services). Contracts cover the full venue surface: public market data, private order feed, position feed, errors, WebSockets, FIX, and corner cases for CeFi, DeFi, and TradFi.

**✅ Schema Validation**: All schemas validated against real API responses using Context7 for accurate type definitions and Decimal precision for financial data.

**Version = Mappings + Schemas + Endpoints**: The unified-api-contracts package version (pyproject.toml) is the single source of truth for endpoint-to-schema mappings, base URLs, and all Pydantic schemas. When you bump the version, you version the entire contract surface. See [SCHEMA_VERSIONS.md](SCHEMA_VERSIONS.md).

**Chain of events**: Config → SDK/API call → schema validation → adapter output. See [docs/API_CONTRACTS_CHAIN_OF_EVENTS.md](docs/API_CONTRACTS_CHAIN_OF_EVENTS.md).

## Purpose

- **Single source of truth** for external API request/response shapes (Databento, Tardis, CCXT, The Graph, OKX, Bybit, Upbit, Yahoo Finance, Alchemy, Hyperliquid, Aster, IBKR, etc.).
- **Type safety**: UMI and UOI validate or parse raw responses through these schemas before mapping to canonical types.
- **Testability**: VCR cassettes under each `mocks/` directory allow tests to run without live API calls.
- **Contract-vs-reality**: Examples and optional live verification keep schemas aligned with provider behavior.

## Structure

```
unified_api_contracts/
├── market.py, execution.py, ...   # Root facade files (domain re-exports)
├── canonical/                     # Canonical types
│   ├── domain/                    # Per-domain canonical types
│   │   ├── market/                #   Market data (spread, tradfi)
│   │   ├── execution/             #   Execution (base, defi, prime_broker, sports, trade)
│   │   ├── sports/                #   Sports (fixtures, odds, features, mappings, etc.)
│   │   ├── reference/             #   Reference data
│   │   ├── position/              #   Position types
│   │   ├── features/              #   Feature models
│   │   ├── derivatives/           #   Derivatives / options
│   │   ├── infrastructure/        #   Infra (ci, compute)
│   │   └── onchain/               #   On-chain types
│   ├── crosscutting/              # Cross-domain: analytics, connectivity, latency, risk
│   ├── errors/                    # Canonical errors: cefi, defi, altdata, sports
│   └── canonical_mappings.py      # Cross-venue mapping tables
├── external/                      # Raw per-source schemas (79 source dirs)
│   ├── binance/                   #   Each contains: schemas.py, normalize.py,
│   ├── databento/                 #   examples/, mocks/
│   ├── hyperliquid/
│   ├── betfair/
│   └── ...
├── normalize_utils/               # Shared normalization helpers (25 modules)
├── registry/                      # Venue/capability/endpoint registry
│   ├── capability.py, capability_data.py
│   ├── endpoint_registry.py, venue_constants.py
│   └── venue_manifest/            # Manifest data by category
├── config/                        # Validation config
└── testing/                       # Test infrastructure for consumers
```

Per-source directories (under `external/`) contain:

- `schemas.py` -- Pydantic models for request/response shapes.
- `normalize.py` -- Maps raw venue schemas to canonical types.
- `examples/` -- Captured JSON (or CSV) from real or trial API calls.
- `mocks/` -- VCR cassettes for replay in tests.

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a venue, capture examples, and record VCR.

## Venues covered

| Category                         | Venues                                                             |
| -------------------------------- | ------------------------------------------------------------------ |
| **High-Priority CeFi exchanges** | **✅ Binance, ✅ Coinbase** (validated schemas)                    |
| Other CeFi exchanges             | OKX, Bybit, Upbit (CCXT and/or REST)                               |
| CeFi / TradFi data               | Databento (~506 venues), Tardis, Yahoo Finance, Barchart (VIX 15m) |
| DeFi                             | The Graph, Alchemy, Hyperliquid, Aster                             |
| TradFi execution                 | Interactive Brokers (IBKR, TWS/ib_insync)                          |
| Sports                           | Betfair, Pinnacle, Polymarket, Odds API, API-Football              |

**Sports schemas** in `unified_api_contracts/canonical/domain/sports/`: canonical models (fixtures, odds, features, mappings, etc.) and per-source sports schemas in `external/{betfair,pinnacle,polymarket,odds_api,...}/`.

**TradFi**: IBKR + Databento only; no direct CME/NASDAQ/NYSE. See [docs/TRADFI_VENUE_NUANCES.md](docs/TRADFI_VENUE_NUANCES.md) for CCXT, IBKR, and Databento symbol formats; [docs/VIX_LIVE_RESEARCH.md](docs/VIX_LIVE_RESEARCH.md) for VIX live streaming research.

See per-venue README or index under each directory for market data, order feed, position feed, errors, WebSocket, and FIX coverage.

## Consuming from UMI / UOI

**Dependency and tier:** Canonical data is in `unified-trading-pm/workspace-manifest.json` (this repo is Tier 0, no workspace path deps). Consumers use path dependency `../unified-api-contracts` (see path-dependency-ci.mdc). Example:

```python
# Canonical types via root facade files (preferred for consumers)
from unified_api_contracts.market import CanonicalTicker
from unified_api_contracts.execution import CanonicalOrder
from unified_api_contracts.sports import CanonicalFixture

# Raw venue schemas (for interface-level parsing)
from unified_api_contracts.external.binance.schemas import BinanceTicker
```

**Import rule:** Consumer repos import from domain facade files (`unified_api_contracts.market`, `unified_api_contracts.execution`, etc.). Do not import from `unified_api_contracts.canonical.*` or `unified_api_contracts.normalize_utils.*` directly -- those are UAC-internal.

## Self-test: schemas and coverage

Quality gates run tests that ensure:

- **Per-venue schema coverage**: Each venue’s `schemas.py` exports the response and error classes declared in the `registry/venue_manifest/` data files (REST, WebSocket, FIX, and error types per venue).
- **Example validation**: Every `examples/*.json` file validates against the correct Pydantic schema.
- **Manifest consistency**: Venues declare `has_rest`, `has_websocket`, `has_fix`; at least one venue has REST and one has WebSocket.

See `tests/test_venue_contract_coverage.py` and `tests/test_contracts_vs_reality.py`.

## Schema Validation & Collection

**Full flow**: [docs/API_CONTRACTS_CHAIN_OF_EVENTS.md](docs/API_CONTRACTS_CHAIN_OF_EVENTS.md) — chain overview, version alignment (SCHEMA_VERSIONS.md, [schema-validation] deps, check_sdk_version_alignment.py), ENDPOINT_SCHEMA_MAP, BASE_URLS, venue_manifest. **Live validation and VCR recording** are done in the interfaces that depend on AC (they hold API keys): unified-trade-execution-interface, unified-sports-execution-interface, unified-reference-data-interface, unified-position-interface, unified-market-interface, unified-cloud-interface.

**In-repo (AC):** Quality gates validate `examples/*.json` and schema coverage only; AC does not run VCR tests. Recording and replay are invoked by the six interfaces; they contribute cassettes to AC mocks via PR and run VCR replay in their CI (replay uses no API calls—VCR returns the saved response from the cassette).; SSOT: `unified-trading-codex/02-data/vcr-cassette-ownership.md`.

**Quality gates**: Schema validation tests in `tests/test_schema_validation.py` run via `bash scripts/quality-gates.sh`.

### Fast unit runs (no API calls)

Unit tests are pure schema/normalization checks and should be quick. AC does not run VCR in CI (replay is invoked by the interfaces). If local runs feel slow:

- **Hypothesis**: Default profile uses few examples; CI can set `HYPOTHESIS_PROFILE=ci` for more. See `tests/conftest.py`.
- **VCR / integration**: VCR replay tests in AC are marked `@pytest.mark.integration` and are for use by interfaces; run only unit tests with `pytest -m "not integration"`.
- **Collection**: Importing many venue packages adds ~0.5–1 s per test module.

## Usage Patterns

### Financial Precision

Always use `Decimal` for financial data to avoid floating-point precision errors:

```python
from decimal import Decimal
from unified_api_contracts.external.binance.schemas import BinanceTicker

# Correct - preserves precision
ticker = BinanceTicker(
    symbol="BTCUSDT",
    lastPrice=Decimal("50000.12345678"),  # 8 decimal places preserved
    volume=Decimal("1234.56789"),
    # ...
)

# Wrong - loses precision
ticker = BinanceTicker(
    symbol="BTCUSDT",
    lastPrice=50000.12345678,  # May lose precision
    # ...
)
```

### List-Based API Responses

Handle APIs that return arrays (klines, candles, trades):

```python
from unified_api_contracts.external.binance.schemas import BinanceKline

# Binance klines return [timestamp, open, high, low, close, volume, ...]
kline_data = [1771898400000, "64160.26", "64500.00", "64000.00", "64109.81", "599.63527", ...]

# Use from_list classmethod for conversion
kline = BinanceKline.from_list(kline_data)
print(kline.open_price)  # Decimal('64160.26')
```

### Error Response Handling

Standard error handling across venues:

```python
from unified_api_contracts.external.binance.schemas import BinanceError
from unified_api_contracts.external.coinbase.schemas import CoinbaseError

try:
    # API call
    response_data = api_call()
except APIError as e:
    # Parse venue-specific error format
    if venue == "binance":
        error = BinanceError(**e.response)
        print(f"Binance error {error.code}: {error.msg}")
    elif venue == "coinbase":
        error = CoinbaseError(**e.response)
        print(f"Coinbase error: {error.message}")
```

### WebSocket Schema Reuse

REST and WebSocket schemas are often compatible:

```python
from unified_api_contracts.external.binance.schemas import BinanceTicker

# Same schema works for both REST and WebSocket
rest_ticker = BinanceTicker(**rest_api_response)
ws_ticker = BinanceTicker(**websocket_message_data)
```

## Development Setup

### Quick start

```bash
# One-command setup: checks Python 3.13, installs uv, creates venv, installs all deps
bash scripts/setup.sh

# Or equivalently:
make setup
```

The setup script is **idempotent** — safe to re-run anytime. Use `--check` to verify your environment without installing anything:

```bash
bash scripts/setup.sh --check
```

### Manual installation

If you prefer manual steps or already have Python 3.13 and uv:

```bash
uv venv .venv --python python3.13
source .venv/bin/activate
uv pip install -e .

# Install pre-commit hooks
pre-commit install
```

### Pre-commit Hooks

Install and run pre-commit hooks:

```bash
# Install hooks (one-time setup)
pre-commit install

# Run hooks on all files
pre-commit run --all-files

# Hooks run automatically on commit
git commit -m "your message"
```

### Quality Gates

```bash
bash scripts/quality-gates.sh        # Auto-fix
bash scripts/quality-gates.sh --no-fix  # Verify
```

## Contract-vs-reality

- **CI (in AC)**: Validate all `examples/*.json` against the corresponding Pydantic models (no live calls).
- **Live verification**: Run in the **six interfaces** (unified-market-interface, unified-trade-execution-interface, unified-sports-execution-interface, unified-reference-data-interface, unified-position-interface, unified-cloud-interface); they hold API keys and run integration tests with VCR recording and contract-vs-reality validation. Do not run live verification from AC as the primary path.

## Permissions and collaborators

GitHub usernames **CosmicTrader** and **datadodo** have Write/Maintain (or Admin per org policy) access for maintaining contracts and running contract-vs-reality checks. Documented in this README and optionally in a PERMISSIONS or COLLABORATORS file.

## Creating this repo on GitHub

If you are setting up the repo for the first time:

1. Create a new GitHub repository (e.g. `unified-trading-unified-api-contracts` or `unified-api-contracts`) under the same org/owner as other unified-trading repos.
2. Add collaborators **CosmicTrader** and **datadodo** with Write or Admin access (Settings → Collaborators).
3. Push this directory: `git remote add origin <repo-url> && git push -u origin main`.

Quality gates and optional contract-vs-reality can be added to GitHub Actions once the repo exists.
