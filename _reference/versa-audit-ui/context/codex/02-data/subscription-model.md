# Data Subscription Model

## TL;DR

- Services access data through **domain clients** from `unified-domain-client` (UDS), not direct storage paths.
- Available clients: `InstrumentsDomainClient`, `MarketCandleDataDomainClient`, `MarketTickDataDomainClient`,
  `ExecutionDomainClient`, plus factory functions for features.
- Domain clients wrap `StandardizedDomainCloudService` (UDS imports from UCS internally), providing domain-specific
  query methods over a generic cloud I/O layer.
- Services declare what data dimensions they need (date, venue, instrument_type, timeframe); clients handle path
  construction and I/O.
- **Schema contracts** between services: upstream defines schema, downstream depends on schema shape, not storage path.
- The data catalogue tracks what data exists across all dimensions for each service.

---

## Domain Client Architecture

All domain clients follow the same layered pattern:

```
Service Code (imports domain clients from unified-domain-client)
    |
    v
Domain Client (e.g., InstrumentsDomainClient)
    |  - Domain-specific query methods
    |  - Date/venue/instrument filtering
    |
    v
StandardizedDomainCloudService
    |  - Domain validation rules
    |  - Synchronous public API (wraps async internally)
    |  - Timestamp semantics handling
    |
    v
UnifiedCloudService
    |  - Cloud-agnostic I/O (GCS, S3, BigQuery)
    |  - Async optimization
    |  - Multi-cloud provider detection
    |
    v
Cloud Storage (GCS / S3)
```

---

## Available Domain Clients

### InstrumentsDomainClient

```python
from unified_domain_client import create_instruments_client

client = create_instruments_client()

# Query instrument definitions for a specific date
instruments = client.get_instruments_for_date(
    date='2024-01-15',
    venue='BINANCE-FUTURES',
    instrument_type='PERPETUAL',
    base_currency='BTC',
)

# Get all instruments across venues
all_instruments = client.get_instruments_for_date(date='2024-01-15')
```

**Query dimensions**: date, venue, instrument_type, base_currency, symbol pattern

### MarketCandleDataDomainClient

```python
from unified_domain_client import create_market_candle_data_client

client = create_market_candle_data_client()

# Get processed candles
candles = client.get_candles(
    date=datetime(2024, 1, 15),
    instrument_id='BINANCE-FUTURES:PERPETUAL:BTC-USDT@LIN',
    timeframe='15s',
    data_type='trades',
    venue='BINANCE-FUTURES',
)
```

**Query dimensions**: date, instrument_id, timeframe, data_type, venue

### MarketTickDataDomainClient

```python
from unified_domain_client import create_market_tick_data_client

client = create_market_tick_data_client()

# Get raw tick data
ticks = client.get_ticks(
    date=datetime(2024, 1, 15),
    instrument_id='BINANCE-FUTURES:PERPETUAL:BTC-USDT@LIN',
    data_type='trades',
)
```

**Query dimensions**: date, instrument_id, data_type, venue

### ExecutionDomainClient

```python
from unified_domain_client import create_execution_client

client = create_execution_client()

# Get execution results
results = client.get_results(
    strategy_id='momentum_btc_1h',
    date=datetime(2024, 1, 15),
)
```

**Query dimensions**: strategy_id, date, run_id

### Feature Clients

```python
from unified_domain_client import create_features_client

# Create a client for a specific feature domain
delta_one = create_features_client(feature_type='delta_one')
volatility = create_features_client(feature_type='volatility')
```

---

## How Services Declare Data Needs

Services don't hardcode GCS paths. Instead, they declare their upstream dependencies in `dependencies.yaml`:

```yaml
features-delta-one-service:
  upstream:
    - service: market-data-processing-service
      required: true
      description: Needs processed candles
      check:
        bucket_template: "market-data-tick-{category_lower}-{project_id}"
        path_template: "processed_candles/by_date/day={date}/"
    - service: features-calendar-service
      required: true
      description: Reads pre-computed calendar features
      check:
        bucket_template: "features-calendar-{project_id}"
        path_template: "calendar/category=temporal/by_date/day={date}/"
```

At runtime, each service runs a `BaseDependencyChecker` that validates upstream data exists before processing:

```python
from unified_trading_services import BaseDependencyChecker

checker = BaseDependencyChecker(service_name="features-delta-one-service")
report = checker.check_dependencies(date=processing_date, category="CEFI")

if not report.all_satisfied:
    for failure in report.failures:
        logger.error(f"Missing: {failure.service} - {failure.reason}")
    raise DependencyError("Upstream data not ready")
```

---

## Schema Contracts Between Services

Each service pair has an implicit contract defined by the upstream output schema:

```
instruments-service                    market-tick-data-service
  Output Schema:                         Input Expectation:
  - timestamp (datetime64)               - Read instruments.parquet
  - instrument_id (string)               - Filter by venue, instrument_type
  - venue (string)                       - Use instrument_id for download
  - instrument_type (string)             - Use trading_hours for scheduling
  - base_currency (string)
  - trading_hours (JSON)
```

The contract is:

1. **Upstream** defines schema in `schemas/output_schemas.py`
2. **Downstream** reads using domain client, which handles path and format
3. **Validation** ensures upstream output matches schema before write
4. **Breaking changes** require updating both service schemas and downstream consumers

---

## Data Catalogue

The data catalogue tracks what data exists across all services:

### Catalogue Dimensions Per Service

| Service                        | Dimensions                                                   | Example                                                       |
| ------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------- |
| instruments-service            | category, venue, date                                        | CEFI / BINANCE-FUTURES / 2024-01-15                           |
| market-tick-data-service       | category, venue, instrument_type, data_type, date            | CEFI / BINANCE-FUTURES / PERPETUAL / trades / 2024-01-15      |
| market-data-processing-service | category, venue, instrument_type, data_type, timeframe, date | CEFI / BINANCE-FUTURES / PERPETUAL / trades / 5m / 2024-01-15 |
| features-delta-one-service     | category, feature_group, timeframe, date                     | CEFI / momentum / 5m / 2024-01-15                             |
| features-volatility-service    | category, feature_group, timeframe, date                     | CEFI / iv_surface / 1h / 2024-01-15                           |
| features-onchain-service       | feature_group, date                                          | tvl / 2024-01-15                                              |
| features-calendar-service      | date                                                         | 2024-01-15                                                    |
| ml-training-service            | model_id, training_period                                    | swing-high-v1 / 2023-Q4                                       |
| ml-inference-service           | mode, instrument, date                                       | batch / BTC / 2024-01-15                                      |
| strategy-service               | strategy_id, date                                            | momentum_btc_1h / 2024-01-15                                  |
| execution-service              | strategy_id, config, date, instruction_type                  | momentum_btc_1h / v2 / 2024-01-15 / TRADE                     |

### Catalogue Status Files

Each service has a data catalogue YAML in `deployment-service/configs/`:

```yaml
# data-catalogue.instruments-service.yaml
service_name: "instruments-service"
status: "FULLY DONE"
catalogue_dimensions:
  - category
  - venue
  - date
shard_status:
  CEFI:
    BINANCE-SPOT:
      start_date: "2019-03-30"
      stage_1_has_run: true
      stage_2_data_complete: true
```

---

## Deprecation: Old Client Pattern

The old pattern of per-service client directories has been **fully deprecated**:

```python
# DEPRECATED: Don't use service-specific clients
from instruments_service.clients.instruments_client import InstrumentsClient

# CORRECT: Use unified-domain-client domain clients
from unified_domain_client import create_instruments_client
```

All client logic is now centralized in `unified-domain-client` (UDS). UDS imports from UCS internally for cloud I/O.

---

## Data Publishing (Data Out)

Every service publishes its output through a standardized write path:

```python
# Standardized publish pattern (via UDS — UDS imports StandardizedDomainCloudService from UCS internally)
from unified_domain_client import StandardizedDomainCloudService

cloud_service = StandardizedDomainCloudService(config=service_config)
cloud_service.upload_dataframe(
    df=output_df,
    date=processing_date,
    output_type="features",
    # Schema validation, timestamp alignment, NaN checks happen automatically
)
```

Publishing principles:

- **Schema validation is automatic.** Pre-upload checks in `StandardizedDomainCloudService` validate column types,
  nullability, and timestamp-date alignment before any bytes hit storage.
- **The publisher does not know or care who consumes its output.** There is no consumer registry or fanout config on the
  write side. Downstream services pull from well-known paths.
- **Output path is deterministic.** The same `(date, shard dimensions)` always writes to the same GCS path. This makes
  idempotent re-runs safe.
- **Batch: publish = write Parquet to GCS** (synchronous, on the primary thread). The service blocks until the write
  completes, then moves to the next date/shard.
- **Live: publish = broadcast to consumers** (unicast for one-to-one, multicast for one-to-many) **+ async persistence**
  to GCS/BigQuery on a separate thread. The primary event loop never blocks on persistence I/O. [PLANNED]

---

## Messaging Topology

Per-service subscribe/publish map showing what each service consumes and produces:

| Service                                        | Subscribes From                                 | Publishes To                                             | Cardinality                          | Batch Transport | Live Transport                                                 | Live Deployment                                                                  |
| ---------------------------------------------- | ----------------------------------------------- | -------------------------------------------------------- | ------------------------------------ | --------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| instruments-service                            | External APIs (Tardis, Databento, The Graph)    | 5+ services                                              | ONE-TO-MANY                          | GCS write       | Broadcast [PLANNED]                                            | Standalone                                                                       |
| instruments-service (corporate-actions domain) | instruments-service                             | Downstream (TRADFI only)                                 | ONE-TO-ONE                           | GCS             | N/A (batch only)                                               | Batch only                                                                       |
| market-tick-data-service                       | instruments-service + external APIs             | market-data-processing + features-volatility + execution | ONE-TO-MANY                          | GCS             | WebSocket stream [PLANNED]                                     | Embedded in feature services + execution-service + standalone TARDIS persistence |
| market-data-processing-service                 | market-tick-data-service + instruments          | features-delta-one + features-onchain                    | ONE-TO-MANY                          | GCS             | Embedded package [PLANNED]                                     | **Embedded in feature services (no standalone)**                                 |
| features-calendar-service                      | External APIs (FRED, earnings)                  | features-delta-one                                       | ONE-TO-ONE                           | GCS             | Timer-based refresh [PLANNED]                                  | Standalone                                                                       |
| features-delta-one-service                     | market-data-processing + features-calendar      | ml-training + ml-inference + strategy                    | ONE-TO-MANY (key publisher)          | GCS             | Embedded package [PLANNED]                                     | Standalone (embeds market-data-processing + market-tick-data-service)            |
| features-volatility-service                    | market-tick-data-service                        | ml-training (optional)                                   | ONE-TO-ONE                           | GCS             | Embedded [PLANNED]                                             | Standalone (embeds market-data-processing + market-tick-data-service)            |
| features-onchain-service                       | market-data-processing                          | ml-training (optional)                                   | ONE-TO-ONE                           | GCS             | Embedded [PLANNED]                                             | Standalone (embeds market-data-processing + market-tick-data-service)            |
| ml-training-service                            | features-delta-one + volatility + onchain       | ml-inference (model artifacts)                           | MANY-TO-ONE input, ONE-TO-ONE output | Batch only      | N/A                                                            | Batch only                                                                       |
| ml-inference-service                           | ml-training + features-delta-one                | strategy                                                 | ONE-TO-ONE                           | GCS             | FeatureSubscriber + PredictionPublisher [IMPLEMENTED: partial] | Embedded in strategy-service                                                     |
| strategy-service                               | ml-inference + features-delta-one + instruments | execution                                                | MANY-TO-ONE input, ONE-TO-ONE output | GCS             | Signal stream [PLANNED]                                        | Standalone (embeds features-delta-one + ml-inference)                            |
| execution-service                              | strategy + market-tick-data + instruments       | Results to GCS                                           | MANY-TO-ONE input                    | GCS             | Exchange WebSocket [PLANNED]                                   | Standalone per-client (embeds market-tick-data-service)                          |

---

## Batch vs Live Data Flow Per Service

Concise comparison of the two modes:

| Aspect                    | Batch                                                  | Live                                                                           |
| ------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------ |
| **Subscribe**             | Domain client pulls from GCS (cold, pull-based)        | In-process callback, WebSocket stream, or polling (hot, push-based)            |
| **Publish**               | Validated write to well-known GCS path (synchronous)   | In-process function call to consumer(s) + async persistence on separate thread |
| **When data arrives**     | All-at-once (full day/shard available)                 | Streaming (incremental, real-time)                                             |
| **How data is delivered** | File read (Parquet from GCS)                           | Function call / message / WebSocket frame                                      |
| **What the data is**      | Identical. Same schema, same columns, same validation. | Identical.                                                                     |

The key difference is **WHEN** data arrives (all-at-once vs streaming) and **HOW** it is delivered (file vs function
call), not **WHAT** the data is. The engine processes the same DataFrame shape regardless of mode.

---

## ADR-2026-02-11: BaseClient Plugin Pattern for External Data Providers

**Context**: Services integrate with 10+ external data providers (Tardis, Databento, Aster, Hyperliquid, The Graph,
Alchemy, yfinance, Barchart, etc.). Previously, each service (instruments-service, market-tick-data-service) implemented
HTTP client logic independently, causing:

- Code duplication (Aster/Hyperliquid adapters duplicated 3x across defi/ and onchain_perps/ modules)
- Inconsistent error handling and retry logic
- No session reuse (creating new HTTP sessions for every API call)
- DNS resolution failures in async contexts (breaking Aster/Hyperliquid adapters)
- Violation of Single Responsibility Principle (adapters handling both network and domain logic)

**Decision**: Standardize all external data provider integrations using a 2-layer plugin pattern:

**Layer 1: BaseClient** (unified-trading-services/clients/)

- HTTP session management (sync via `requests.Session` for instruments-service, async via `aiohttp.ClientSession` for
  market-tick-data-service)
- Connection pooling with HTTP/2 persistent connections (reduces TCP/TLS handshake overhead by 60-80%)
- DNS resilience (`ThreadedResolver` for async sessions to prevent asyncio DNS failures)
- Automatic retry with exponential backoff (transient error recovery)
- Module-level caching for API keys, auth tokens, and repeated responses
- TLS session resumption (reduces SSL/TLS negotiation overhead)
- Lazy initialization (sessions created on first use, not at import time)

**Layer 2: Adapter** (service code in instruments-service/ and market-tick-data-service/)

- Domain logic only (instrument parsing, data download, schema transformation)
- Lazy-loaded when venue requested (not imported at module load, avoiding unnecessary dependencies)
- Singleton per protocol (cached adapter instance, reused across all dates/shards)
- Wraps BaseClient for all HTTP operations (adapters do not create their own sessions)

**Implementation Example**:

```python
# unified-trading-services: AsterBaseClient (network layer)
class AsterBaseClient:
    """Centralizes network concerns for Aster API."""

    def __init__(self, config: Optional[AsterClientConfig] = None):
        self.config = config or AsterClientConfig.from_env()
        self._sync_session: Optional[requests.Session] = None
        self._async_session: Optional[aiohttp.ClientSession] = None

    @property
    def sync_session(self) -> requests.Session:
        """Lazy-loaded requests.Session with retries and connection pooling."""
        if self._sync_session is None:
            self._sync_session = requests.Session()
            retry_strategy = Retry(
                total=self.config.max_retries,
                backoff_factor=self.config.retry_delay,
                status_forcelist=[429, 500, 502, 503, 504],
            )
            adapter = HTTPAdapter(
                max_retries=retry_strategy,
                pool_connections=self.config.connection_pool_size,
                pool_maxsize=self.config.connection_pool_size,
            )
            self._sync_session.mount("https://", adapter)
            self._sync_session.mount("http://", adapter)
        return self._sync_session

    @property
    def async_session(self) -> aiohttp.ClientSession:
        """Lazy-loaded aiohttp.ClientSession with ThreadedResolver and connection pooling."""
        if self._async_session is None:
            resolver = ThreadedResolver()  # Prevents DNS failures in asyncio
            connector = TCPConnector(
                limit=self.config.connection_pool_size,
                resolver=resolver,
            )
            self._async_session = aiohttp.ClientSession(
                connector=connector,
                timeout=aiohttp.ClientTimeout(total=self.config.request_timeout),
            )
        return self._async_session

    def get_futures_url(self, endpoint: str) -> str:
        """Construct Aster Futures API URL."""
        return f"{self.config.futures_api_base_url}/{endpoint}"

# instruments-service: AsterAdapter (domain layer)
class AsterAdapter:
    """Parses Aster perpetual contract data into instrument definitions."""

    def __init__(self, base_client: Optional[AsterBaseClient] = None):
        self._base_client = base_client

    @property
    def client(self) -> AsterBaseClient:
        """Lazy-loaded BaseClient (only created when adapter used)."""
        if self._base_client is None:
            self._base_client = AsterBaseClient()
        return self._base_client

    def fetch_perpetuals(self) -> List[Dict[str, Any]]:
        """Fetch perpetual contracts from Aster API."""
        url = self.client.get_futures_url("fapi/v1/exchangeInfo")
        response = self.client.sync_session.get(url)  # Uses BaseClient session
        response.raise_for_status()
        data = response.json()
        # Parse and transform into instrument schema...
        return [self._parse_perpetual(s) for s in data.get("symbols", [])]
```

**Consequences**:

✅ **Benefits**:

- **Code reduction**: 1,200+ lines of duplicate network code eliminated (Aster/Hyperliquid adapters across
  instruments-service and market-tick-data-service)
- **Session reuse**: HTTP/2 persistent connections maintained across all API calls (2-5x speedup for repeated requests)
- **DNS resilience**: ThreadedResolver prevents asyncio DNS failures that broke Aster/Hyperliquid adapters
- **Consistent error handling**: All providers use same retry/backoff logic
- **Testability**: Adapters can be tested with mocked BaseClients (no live API calls needed)
- **Ready for live mode**: Same BaseClient foundation, add streaming methods in Phase 3

⚠️ **Trade-offs**:

- Requires unified-trading-services PR to merge before service refactors can proceed
- Breaking change for anyone directly importing old adapters (e.g.,
  `from instruments_service.venues.defi.aster_adapter import AsterAdapter` → now in `onchain_perps/`)
- BaseClients add one layer of indirection (minor complexity increase)

❌ **Limitations**:

- Provider-specific authentication (e.g., API key signing, OAuth) still handled in adapters (not network-layer concern)
- S3-specific logic (e.g., Hyperliquid S3 downloads) remains in adapters (BaseClient only covers HTTP APIs)

**Alternatives Considered**:

1. **Keep adapter-specific HTTP logic** - Rejected: caused 3x code duplication for Aster/Hyperliquid adapters across
   defi/ and onchain_perps/ modules
2. **Central HTTP client for all providers** - Rejected: different APIs have vastly different requirements (S3 vs REST
   vs GraphQL vs WebSocket)
3. **Provider-specific BaseClients** - **Accepted**: balances code reuse with API-specific flexibility

**Status**: ✅ Implemented 2026-02-11

**Affected Services**: instruments-service, market-tick-data-service

**BaseClients Implemented**:

- `TardisBaseClient` (CEFI exchanges via Tardis API)
- `DatabentoBaseClient` (TRADFI market data via Databento API)
- `AsterBaseClient` (on-chain perps DEX)
- `HyperliquidBaseClient` (on-chain perps DEX, HTTP API only, S3 logic stays in adapter)
- `TheGraphBaseClient` (DeFi subgraphs) [PLANNED]
- `AlchemyBaseClient` (on-chain RPC) [PLANNED]
- `YFinanceBaseClient` (TRADFI FX pairs) [PLANNED]
- `BarchartBaseClient` (TRADFI VIX data) [PLANNED]

**Evidence**:

- unified-trading-services PR [#33](https://github.com/IggyIkenna/unified-trading-services/pull/33)
- instruments-service PR [#44](https://github.com/IggyIkenna/instruments-service/pull/44)
- market-tick-data-service PR [#40](https://github.com/IggyIkenna/market-tick-data-service/pull/40)

**Code Reduction Summary**:

- instruments-service: 480 lines removed (defi/aster_adapter.py, defi/hyperliquid_adapter.py)
- market-tick-data-service: Network logic removed from adapters (now using BaseClients)
- unified-trading-services: 800 lines added (centralized BaseClients with tests and docs)
- **Net reduction**: ~1,200 lines of duplicate code eliminated

---

## Future: Live Streaming Subscriptions

**[PLANNED]** For live trading mode, services will subscribe to real-time data streams instead of batch downloads.

market-tick-data-service will be embeddable as a package in other services (market-data-processing, execution-service)
to enable real-time streaming without network hops.

```python
# Live mode: market-tick-data-service embedded in execution-service
from market_tick_data_handler.streaming import TardisStreamingClient

stream = TardisStreamingClient(venues=["BINANCE-FUTURES"], mode="live")
async for tick in stream.subscribe(["BTC-USDT-SWAP"]):
    await execution_engine.process_tick(tick)  # In-memory, no GCS latency
```

**Design considerations**:

- Same BaseClient foundation (add streaming methods in Phase 3)
- market-tick-data-service as package (embedded in consumers)
- Separate persistence stream (2x connections, but ingress free on GCP)
- Backpressure handling
- Subscription lifecycle management
