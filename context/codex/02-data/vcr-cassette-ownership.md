# VCR Cassette Ownership and SSOT

## Rule

**unified-api-contracts (AC)** holds **schemas and static examples** only. **VCR recording and live schema validation**
are performed by the **interfaces** (unified-market-interface, unified-trade-execution-interface,
unified-sports-execution-interface, unified-reference-data-interface, unified-position-interface,
unified-cloud-interface) in their integration tests; those interfaces hold API keys. Cassettes may be recorded and
validated from interface repos. Consumers reference cassettes by path — they do not duplicate them (HTTP only; WebSocket
capture requires different tooling).

---

## Who Owns What

| Asset                               | SSOT Owner / Performer                          | Location                                                                                                                                       | Notes                                                                                                |
| ----------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Schemas + static examples**       | unified-api-contracts                           | `unified_api_contracts/external/<venue>/schemas.py`, `examples/*.json`                                                                         | AC holds these only                                                                                  |
| **VCR recording & live validation** | Interfaces (UMI, UTEI, USEI, URDI, UPI, UCI)    | In each interface repo’s integration tests                                                                                                     | Interfaces hold API keys; they record and validate against live/schemas                              |
| **VCR cassettes** (raw venue HTTP)  | Preferred: AC `mocks/` (via PR from interfaces) | `unified_api_contracts/external/<venue>/mocks/*.yaml`                                                                                          | Interfaces contribute cassettes to AC via PR; optional: keep in interface repo and reference by path |
| **Replay tests**                    | Interfaces (invoke); AC holds code/cassettes    | Interfaces run replay in their CI (use AC schemas + cassettes); AC `tests/test_vcr_replay.py` is for use by interfaces; AC CI does not run VCR | No duplicate cassettes; consumers reference by path                                                  |
| **Internal contract fixtures**      | unified-internal-contracts                      | `tests/fixtures/`                                                                                                                              | Services consuming internal schemas                                                                  |

---

## Current Cassettes (unified-api-contracts)

**Legend:** `VALIDATED` = cassette recorded + tests pass. `PENDING_CASSETTE_AWAITING_AUTH` = key in Secret Manager,
cassette not yet recorded. `BLACKLISTED_NO_ACCESS` = no key.

| Venue           | Cassette File                                    | Status                                                         |
| --------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| `alchemy`       | `alchemy/mocks/alchemy_ws_eth_subscription.yaml` | `VALIDATED`                                                    |
| `barchart`      | `barchart/mocks/get_quote_es1.yaml`              | `VALIDATED`                                                    |
| `betdaq`        | `betdaq/mocks/betdaq_get_markets.yaml`           | `VALIDATED` (mock/public data)                                 |
| `binance`       | `binance/mocks/ticker_24hr.yaml`                 | `VALIDATED`                                                    |
| `binance`       | private WS (listen key endpoint)                 | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `bybit`         | `bybit/mocks/ticker.yaml`                        | `VALIDATED`                                                    |
| `coinbase`      | brokerage orders endpoint                        | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `databento`     | timeseries.get_range                             | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `defillama`     | `defillama/mocks/protocols.yaml`                 | `VALIDATED`                                                    |
| `deribit`       | private WS                                       | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `fear_greed`    | `fear_greed/mocks/fng_latest.yaml`               | `VALIDATED`                                                    |
| `fred`          | `fred/mocks/series_observations_dgs10.yaml`      | `VALIDATED`                                                    |
| `hyperliquid`   | `hyperliquid/mocks/meta.yaml`                    | `VALIDATED`                                                    |
| `hyperliquid`   | private user-state endpoint                      | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `ibkr`          | TWS reqMarketData()                              | `PENDING_CASSETTE_AWAITING_AUTH` (TWS not HTTP — approach TBD) |
| `kalshi`        | portfolio/balance endpoint                       | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `matchbook`     | `matchbook/mocks/matchbook_get_markets.yaml`     | `VALIDATED`                                                    |
| `okx`           | `okx/mocks/ticker.yaml`                          | `VALIDATED`                                                    |
| `open_meteo`    | `open_meteo/mocks/forecast_current_weather.yaml` | `VALIDATED`                                                    |
| `api_football`  | leagues endpoint                                 | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `betfair`       | JSON-RPC betting endpoint                        | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `bloxroute`     | mempool streaming                                | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `odds_api`      | sports odds endpoint                             | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `pinnacle`      | leagues endpoint                                 | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `polymarket`    | `polymarket/mocks/clob_markets.yaml`             | `VALIDATED`                                                    |
| `pyth`          | `pyth/mocks/pyth_ws_price_update.yaml`           | `VALIDATED` (WS mock)                                          |
| `smarkets`      | `smarkets/mocks/smarkets_get_markets.yaml`       | `VALIDATED` (mock/public data)                                 |
| `tardis`        | datasets.tardis.dev batch endpoint               | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `thegraph`      | subgraph GraphQL endpoint                        | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `alchemy`       | REST eth-mainnet endpoint                        | `PENDING_CASSETTE_AWAITING_AUTH`                               |
| `upbit`         | `upbit/mocks/ticker.yaml`                        | `VALIDATED`                                                    |
| `yahoo_finance` | `yahoo_finance/mocks/chart_aapl_1d.yaml`         | `VALIDATED`                                                    |
| `yahoo_finance` | `yahoo_finance/mocks/dividends_aapl.yaml`        | `VALIDATED`                                                    |
| `yahoo_finance` | `yahoo_finance/mocks/earnings_msft.yaml`         | `VALIDATED`                                                    |
| `yahoo_finance` | `yahoo_finance/mocks/error_invalid_symbol.yaml`  | `VALIDATED`                                                    |
| `yahoo_finance` | `yahoo_finance/mocks/error_rate_limit.yaml`      | `VALIDATED`                                                    |
| `yahoo_finance` | `yahoo_finance/mocks/splits_tsla.yaml`           | `VALIDATED`                                                    |

**15 endpoints `PENDING_CASSETTE_AWAITING_AUTH`** — keys confirmed, cassettes not recorded. See
`unified-trading-pm/plans/ai/VCR_CREDENTIAL_RECORDING_PLAN.md` for the recording checklist.

---

## VCR Flow

1. **Record** (with live API keys): Recording is done only from **interface repos** (UMI, UTEI, USEI, URDI, UPI, UCI),
   which hold API keys. unified-api-contracts does not ship recording scripts; add a recording script in each interface
   that needs VCR (or use a shared template in codex/PM).

2. **Commit cassettes**: Preferred — **contribute to AC’s `mocks/` via PR** (interface opens a PR against
   unified-api-contracts adding or updating `unified_api_contracts/external/<venue>/mocks/*.yaml`). Alternative: commit
   in the interface repo and reference by path; no duplication.

3. **Replay in CI** (no API keys required): Run by the **interfaces** in their CI (they depend on AC; they run replay
   using AC schemas and cassettes from AC `mocks/`). AC does not run VCR tests in its own CI. Replay uses no live API
   calls—VCR returns the saved response from the cassette file.

   ```bash
   # In an interface repo (e.g. UMI), with path dep on AC:
   pytest path/to/unified-api-contracts/tests/test_vcr_replay.py -v
   ```

4. **Consumers** reference cassettes by path:

   ```python
   import vcr
   cassette_dir = Path("../unified-api-contracts/unified_api_contracts/external")

   @vcr.use_cassette(str(cassette_dir / "binance/mocks/ticker_24hr.yaml"))
   def test_binance_ticker():
       ...
   ```

---

## Cassette Naming Convention

```
unified_api_contracts/external/<venue>/mocks/<endpoint_description>.yaml
```

Rules:

- `<venue>` — lowercase, matches the venue subdirectory name (e.g. `binance`, `bybit`, `yahoo_finance`)
- `<endpoint_description>` — snake_case description of the endpoint (e.g. `ticker_24hr`, `order_book_depth`,
  `error_rate_limit`)
- Include error cassettes for each documented error type (e.g. `error_rate_limit.yaml`, `error_invalid_symbol.yaml`)

---

## Contributing cassettes to AC mocks/ via PR (recommended)

Interfaces that record VCR cassettes should **contribute them to unified-api-contracts** so one canonical location is
used for replay (AC’s `tests/test_vcr_replay.py`) and by all consumers.

1. **In the interface repo** (UMI, UTEI, USEI, URDI, UPI, UCI): run the interface’s recording script with live
   credentials; filter secrets (authorization, x-api-key, etc.) in the cassette.
2. **Open a PR against unified-api-contracts** adding or updating files under
   `unified_api_contracts/external/<venue>/mocks/<name>.yaml`. Create the venue `mocks/` directory if it doesn’t exist.
3. **PR contents:** cassette YAML only (no code changes in AC unless you’re adding a new endpoint to `vcr_endpoints.py`
   or a new venue). PR description: e.g. “VCR: add/update &lt;venue&gt; &lt;endpoint&gt; cassette (recorded from UMI).”
4. After merge, interfaces run replay in their CI (using AC schemas and cassettes); consumers reference the cassette
   path in AC.

**Reference:** This section is the SSOT for the “contribute via PR” flow. See also
`05-infrastructure/contracts-integration.md` (contracts integration) and unified-api-contracts `CONTRIBUTING.md`
(AC-side expectations).

---

## Adding New Cassettes

1. Ensure the venue directory exists under `unified_api_contracts/external/<venue>/mocks/` (add in AC or via the same PR
   as the cassette).
2. Add recording logic in the **interface repo** that uses that venue (UMI, UTEI, etc.); AC does not ship a recording
   script.
3. Run the interface’s record script with live credentials; **contribute the cassette to AC via PR** (see “Contributing
   cassettes to AC mocks/ via PR” above).
4. In AC, add or extend replay assertions in `tests/test_vcr_replay.py` if the endpoint is new in `vcr_endpoints.py`.
5. Consumers reference the cassette path in AC — no copy required.

---

## IBKR / TWS Test Mocking (NOT VCR)

**HTTP VCR does not apply to IBKR.** IB Gateway uses a proprietary binary socket protocol (EClient/EWrapper via
`ib_insync`), not HTTP. Standard VCR cassette recording/replay cannot capture TWS messages.

### Canonical test approach: mock at the `ib_insync` Python object level

```python
from unittest.mock import AsyncMock, MagicMock

import pytest
from ib_insync import IB


@pytest.fixture
def mock_ib() -> MagicMock:
    """Shared fixture for IBKR adapter tests.

    Injects a MagicMock(spec=IB) so tests never require a running TWS/IB Gateway.
    All async methods that need specific return values must be configured per test.

    Example:
        def test_connect(mock_ib: MagicMock) -> None:
            adapter = IBKRAdapter(ib=mock_ib)
            adapter.connect()
            mock_ib.connect.assert_called_once()
    """
    ib = MagicMock(spec=IB)
    # async helpers: configure as AsyncMock so await works in async tests
    ib.connectAsync = AsyncMock()
    ib.reqHistoricalDataAsync = AsyncMock(return_value=[])
    ib.reqTickersAsync = AsyncMock(return_value=[])
    ib.reqContractDetailsAsync = AsyncMock(return_value=[])
    ib.reqHistoricalTicksAsync = AsyncMock(return_value=[])
    ib.reqPositions = AsyncMock(return_value=[])
    ib.reqAccountSummary = AsyncMock(return_value=[])
    ib.managedAccounts = MagicMock(return_value=[])
    ib.positions = MagicMock(return_value=[])
    return ib
```

Each adapter constructor **must** accept `ib: IB` as an injected parameter (not create its own `IB()` inline). In
production, the caller creates one connected `IB()` instance pointing at `ibkr-gateway-infra`. In tests, the caller
injects a `MagicMock(spec=IB)`.

```python
# After refactor — correct pattern
class IBKRMarketAdapter:
    def __init__(self, ib: IB) -> None:
        self._ib = ib  # caller owns the lifecycle; no inline IB().connect() here
```

This fixture is registered in each interface repo's `conftest.py` (UMI, UTEI, UPI, URDI). See
`unified-trading-codex/06-coding-standards/ibkr-mock-pattern.md` for the full pattern reference.

### Why not VCR

| Property      | HTTP REST (Binance, OKX, etc.)               | IBKR TWS (ib_insync)                             |
| ------------- | -------------------------------------------- | ------------------------------------------------ |
| Transport     | HTTP/HTTPS                                   | Proprietary binary socket (EClient/EWrapper)     |
| VCR capture   | Yes — cassette YAML records request/response | No — binary protocol; VCR sees no HTTP traffic   |
| Test strategy | Record cassette → replay in CI               | MagicMock(spec=IB) — mock at Python object level |

---

## VCR Scope

VCR captures **HTTP only**. WebSocket capture is separate (different tooling and flow — not yet standardised).

Do **not** use VCR for:

- WebSocket streams
- Internal service-to-service calls (use mocks or synthetic fixtures instead)
- GCS/S3 operations (use `unittest.mock` or `pytest-mock`)
- IBKR TWS connections (use `MagicMock(spec=IB)` — see IBKR section above)

---

## Testing Ownership by Repo Type

| Repo type                           | Unit tests                       | Integration tests     | VCR                                                                                     |
| ----------------------------------- | -------------------------------- | --------------------- | --------------------------------------------------------------------------------------- |
| **unified-api-contracts**           | Schema validation, normalization | —                     | Holds schemas + static examples + mocks/; does not run VCR in CI; interfaces run replay |
| **unified-internal-contracts**      | Internal schema validation       | —                     | N/A (no external API)                                                                   |
| **UMI, UTEI, USEI, URDI, UPI, UCI** | Raw → canonical conversion       | VCR + live validation | Record and validate; hold API keys; reference AC schemas/cassettes                      |
| **Services**                        | Business logic                   | Service integration   | Use interface or AC cassettes by path when calling external APIs                        |

---

## Normalization Tests (unified-api-contracts)

Normalization logic and tests live together in unified-api-contracts:

```python
# unified-api-contracts/tests/test_normalization.py
def test_binance_to_canonical():
    raw = BinanceTrade(...)
    canonical = normalize_trade(raw)
    assert isinstance(canonical, CanonicalTrade)
    assert canonical.venue == "binance"
```

Property-based testing covers all venues:

```python
from hypothesis import given
from hypothesis.strategies import sampled_from

@given(venue=sampled_from(ALL_VENUES))
def test_normalization_preserves_core_fields(venue):
    """All venues must produce same core CanonicalTrade fields."""
    ...
```

---

## Circular Dependency Rules

**Scope and layout SSOT:** [02-data/contracts-scope-and-layout.md](contracts-scope-and-layout.md). AC cannot import UIC;
see that doc for dependency and layout rules.

- **unified-api-contracts**: stdlib + pydantic only; no `unified-*` imports
- **unified-internal-contracts**: stdlib + pydantic + (optionally) `unified_api_contracts.canonical`; no cloud SDKs
- **Implementations** (UCS, UCI, services): can import both contracts repos; never the reverse

**CI guardrails (blocking):**

- Fail if unified-api-contracts imports `unified-*`
- Fail if unified-internal-contracts imports cloud SDKs (`google-cloud-*`, `boto3`, redis clients)

See: `dep-enforcement` and `dep-enforcement-cloud-sdks` quality gates.

---

## References

- Plan: `.cursor/plans/schema_ownership_three_tiers_267ab636.md`
- unified-api-contracts restructure: `unified_api_contracts/external/`, `unified_api_contracts/canonical/`
- Testing standards: `06-coding-standards/testing.md`
- Schema governance: `02-data/schema-governance.md`
