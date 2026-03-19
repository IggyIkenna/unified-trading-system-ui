# Schema Versions and Validation Dependencies

This document tracks schema versions, validation tooling, and pinned dependencies for the schema-validation pipeline.

## Cassette Versioning Protocol

VCR cassettes are pinned to a schema version to detect stale cassettes before they cause silent wrong-behavior in tests.

### How it works

1. **`VCR_ENDPOINTS`** declares `schema_version: str` (e.g. `"1.0"`) per endpoint.
2. **Recording** is done in the six interfaces (they hold API keys); the recording script there should inject an `x-contract-schema-version` response header into every cassette at record time.
3. **`tests/test_vcr_replay.py`** (`test_vcr_replay_schema_version_matches`) reads the header from the cassette YAML and asserts it matches the declared version. A mismatch is a hard test failure.

### When to bump `schema_version`

Bump the version in `VCR_ENDPOINTS` whenever the **response schema changes** for that endpoint:

- New required field added
- Field renamed or removed
- Response envelope restructured

Existing cassettes without the header are **skipped** (pre-versioning cassettes). Re-record to bring them into the versioning system.

### Re-recording cassettes

VCR recording is done in the **six interfaces** (unified-market-interface, unified-trade-execution-interface, unified-sports-execution-interface, unified-reference-data-interface, unified-position-interface, unified-cloud-interface). Run the interface repo’s recording script (e.g. per-venue or all venues); do not run recording from unified-api-contracts.

### Internal service cassettes

The `internal_execution_services` VCR section records execution-services HTTP endpoints. These cassettes:

- Are recorded against a locally running service (not a public API)
- Are committed to the repo so CI can replay them without a running service
- Use `record_mode="none"` in CI; tests skip if cassette absent

---

## unified-api-contracts Version = Mappings + Schemas + Endpoints

**The unified-api-contracts package version (pyproject.toml) is the single source of truth for:**

- Endpoint-to-schema mappings (`unified_api_contracts/endpoints.py` ENDPOINT_SCHEMA_MAP)
- Base URLs (`unified_api_contracts/endpoints.py` BASE_URLS)
- All Pydantic schemas in `unified_api_contracts/*/schemas.py`
- Venue manifest (`unified_api_contracts/venue_manifest.py`)

When you bump `version` in pyproject.toml, you are versioning the entire contract surface. Consumers (UMI, UOI, services) depend on a specific unified-api-contracts version for type safety and validation.

## Pinned [schema-validation] Dependencies

Install with: `uv pip install -e ".[schema-validation]"`

| Package       | Version         | Purpose                                                       |
| ------------- | --------------- | ------------------------------------------------------------- |
| pydantic      | >=2.12.5,<3.0.0 | Schema validation (core dep)                                  |
| requests      | >=2.32.5,<3.0.0 | Optional; interfaces use for live validation                  |
| databento     | >=0.32.0,<1.0.0 | Schema validation vs Databento Historical/Live API (optional) |
| tardis-client | >=1.3.7,<2.0.0  | Schema validation vs Tardis HTTP API v1 (optional)            |
| ccxt          | >=4.5.24,<5.0.0 | Schema validation vs CCXT unified responses (optional)        |
| ib_insync     | >=0.9.86,<1.0.0 | Schema validation vs IBKR TWS/ib_insync (optional, UTEI)      |

**SDK pins are for schema-validation only.** Interfaces (UMI, market-tick-data-service) may use different versions but must produce data that validates against unified-api-contracts schemas.

For live API verification (LIVE_API_VERIFICATION=1), also install from workspace:
`uv pip install -e ../unified-trading-services -e ../unified-config-interface`

## Schema Validation Pipeline (live flow in interfaces)

1. **collect_responses.py** — Fetches real API responses → `collected_responses/{venue}/*.json`
2. **Schema validation vs live responses** — Done in the six interfaces (integration tests).
3. **unified_api_contracts** — Canonical schemas; generated schemas are reviewed and promoted here

See README "Schema Validation & Collection" for usage.

## Binance Schema–Version Alignment

**Target API versions (verified 2026-02):**

- **Spot**: `api.binance.com` — REST `/api/v3`
- **USD-M Futures**: `fapi.binance.com` — REST `/fapi/v1` (market data), `/fapi/v2` (account, positionRisk, balance)
- **Coin-M Futures**: `dapi.binance.com` — REST `/dapi/v1` (market data), `/dapi/v2` (account, positionRisk, balance)
- **Options (EAPI)**: `eapi.binance.com` — REST `/eapi/v1`

**Recommended pin:** Use `/api/v3` for Spot, `/fapi/v1` and `/fapi/v2` for USD-M, `/dapi/v1` and `/dapi/v2` for Coin-M. No single version string; document per-endpoint.

### Endpoint → Schema Mapping (Binance)

| Endpoint                        | Method | Schema                                                                                            | Notes                                                      |
| ------------------------------- | ------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Spot (api.binance.com)**      |
| /api/v3/ticker/24hr             | GET    | BinanceTicker                                                                                     | prevClosePrice, bid/ask present                            |
| /api/v3/depth                   | GET    | BinanceOrderBook                                                                                  | lastUpdateId, bids, asks                                   |
| /api/v3/trades                  | GET    | BinanceTrade                                                                                      | id, price, qty, quoteQty, time, isBuyerMaker, isBestMatch  |
| /api/v3/klines                  | GET    | BinanceKline                                                                                      | Use from_list() for array format                           |
| /api/v3/exchangeInfo            | GET    | BinanceExchangeInfo                                                                               | timezone, serverTime, rateLimits, exchangeFilters, symbols |
| /api/v3/order                   | POST   | BinanceSpotOrderSubmitRequest/Response                                                            |                                                            |
| /api/v3/order                   | DELETE | BinanceOrderCancelRequest/Response                                                                |                                                            |
| **USD-M (fapi.binance.com)**    |
| /fapi/v1/ticker/24hr            | GET    | BinanceTicker                                                                                     | No bid/ask; lastFundingRate, nextFundingTime, time         |
| /fapi/v1/depth                  | GET    | BinanceOrderBook                                                                                  |                                                            |
| /fapi/v1/klines                 | GET    | BinanceKline                                                                                      | Same format as Spot                                        |
| /fapi/v1/markPriceKlines        | GET    | BinanceMarkPriceKline                                                                             | Mark price OHLCV                                           |
| /fapi/v1/indexPriceKlines       | GET    | BinanceIndexPriceKline                                                                            | Index price OHLCV                                          |
| /fapi/v1/userTrades             | GET    | BinanceMyTrades                                                                                   | REST fills with fees                                       |
| /fapi/v1/income                 | GET    | BinanceIncome                                                                                     | PnL/funding history                                        |
| /futures/data/delivery-price    | GET    | BinanceDeliveryHistory                                                                            | Settlement price history                                   |
| /fapi/v1/exchangeInfo           | GET    | BinanceInstrumentInfo                                                                             | Futures contract specs                                     |
| /fapi/v1/order                  | POST   | BinanceUsdmOrderSubmitRequest/Response                                                            |                                                            |
| /fapi/v1/order                  | DELETE | BinanceOrderCancelRequest/Response                                                                |                                                            |
| /fapi/v2/positionRisk           | GET    | BinancePositionQueryResponse                                                                      |                                                            |
| /fapi/v2/balance                | GET    | BinanceMarginBalanceResponse                                                                      |                                                            |
| /fapi/v1/listenKey              | POST   | BinanceListenKeyCreate                                                                            | User data stream                                           |
| /fapi/v1/markPriceKlines        | GET    | BinanceMarkPriceKline                                                                             | Mark price OHLC; use from_list()                           |
| /fapi/v1/indexPriceKlines       | GET    | BinanceIndexPriceKline                                                                            | Index price OHLC; uses pair                                |
| /fapi/v1/userTrades             | GET    | BinanceMyTrades                                                                                   | REST fills with commission, realizedPnl                    |
| /fapi/v1/income                 | GET    | BinanceIncome                                                                                     | PnL, funding, commission history                           |
| /futures/data/delivery-price    | GET    | BinanceDeliveryPrice, BinanceDeliveryHistory                                                      | Quarterly delivery prices                                  |
| **Coin-M (dapi.binance.com)**   |
| /dapi/v1/ticker/24hr            | GET    | BinanceTicker                                                                                     | pair field; no bid/ask                                     |
| /dapi/v1/depth                  | GET    | BinanceOrderBook                                                                                  |                                                            |
| /dapi/v1/klines                 | GET    | BinanceKline                                                                                      |                                                            |
| /dapi/v1/markPriceKlines        | GET    | BinanceMarkPriceKline                                                                             |                                                            |
| /dapi/v1/indexPriceKlines       | GET    | BinanceIndexPriceKline                                                                            |                                                            |
| /dapi/v1/userTrades             | GET    | BinanceMyTrades                                                                                   |                                                            |
| /dapi/v1/income                 | GET    | BinanceIncome                                                                                     |                                                            |
| /futures/data/delivery-price    | GET    | BinanceDeliveryHistory                                                                            | Coin-M settlement                                          |
| /dapi/v1/exchangeInfo           | GET    | BinanceInstrumentInfo                                                                             |                                                            |
| /dapi/v1/order                  | POST   | BinanceCoinmOrderSubmitRequest/Response                                                           |                                                            |
| /dapi/v2/positionRisk           | GET    | BinancePositionQueryResponse                                                                      |                                                            |
| /dapi/v2/balance                | GET    | BinanceMarginBalanceResponse                                                                      |                                                            |
| **Wallet (sapi.binance.com)**   |
| /sapi/v1/capital/withdraw/apply | POST   | BinanceWithdrawalRequest/Response (binance/) or BinanceWithdrawRequest/Response (cex_withdrawals) | Duplicate schemas; cex uses addressTag, binance uses name  |
| **Options (eapi.binance.com)**  |
| /eapi/v1/exchangeInfo           | GET    | BinanceOptionInstrumentInfo                                                                       |                                                            |
| WebSocket @ticker, @markPrice   | —      | BinanceOptionTicker, BinanceOptionMarkPrice                                                       |                                                            |

### Binance Gaps (2026-02)

| Gap                           | Severity | Description                                                                                                                                                                                 |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BinanceSymbol missing fields  | Low      | API returns otoAllowed, opoAllowed, amendAllowed, pegInstructionsAllowed, filters. Schema has extra="ignore" (Pydantic default) so validation passes; add optional fields for completeness. |
| Withdrawal schema duplication | Low      | BinanceWithdrawRequest (cex_withdrawals) vs BinanceWithdrawalRequest (binance/). cex uses addressTag; binance uses name. API supports both addressTag and name. Consolidate or document.    |
| VCR vs live (interfaces)      | Info     | VCR uses fapi (USD-M) ticker; interfaces may use api (Spot). Both validate against BinanceTicker (supports both).                                                                           |
| !ticker@arr deprecation       | Info     | All Market Tickers Stream deprecated 2025-11; retire 2026-03-26. Use @ticker or !miniTicker@arr.                                                                                            |
| /fapi/v3, /dapi/v3 endpoints  | Info     | New v3 account/balance/positionRisk exist; we use v2. v2 remains supported.                                                                                                                 |

---

## OKX and Bybit: Schema–Version Alignment

### Version Targets

| Venue     | API Version           | Base URL                                                                                      | Recommended Pin                       |
| --------- | --------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------- |
| **OKX**   | REST v5, WebSocket v5 | `https://www.okx.com/api/v5`, `wss://ws.okx.com:8443/ws/v5/{public\|private\|business}`       | v5 (current; no v5.1)                 |
| **Bybit** | REST v5, WebSocket v5 | `https://api.bybit.com/v5`, `wss://stream.bybit.com/v5/{public/spot\|public/linear\|private}` | v5 (unified Spot/Derivatives/Options) |

### OKX v5: Endpoint → Schema Mapping

| Endpoint                                           | Method | Schema                                               | Status                  |
| -------------------------------------------------- | ------ | ---------------------------------------------------- | ----------------------- |
| /api/v5/market/ticker                              | GET    | OKXTicker                                            | ✓ Covered               |
| /api/v5/market/books                               | GET    | OKXOrderBook                                         | ✓ Covered               |
| /api/v5/market/history-mark-price-candles          | GET    | OKXMarkPriceKline                                    | ✓ Covered               |
| /api/v5/market/history-index-candles               | GET    | OKXIndexPriceKline                                   | ✓ Covered               |
| opt-summary (WS), /api/v5/public/option-instrument | —      | OKXOptionSummary                                     | ✓ Covered (vol surface) |
| /api/v5/market/ticker (instType=OPTION)            | GET    | OKXOptionTicker                                      | ✓ Covered               |
| /api/v5/public/instruments                         | GET    | OKXInstrumentInfo                                    | ✓ Covered               |
| /api/v5/trade/order                                | POST   | OKXOrderSubmitRequest/Response                       | ✓ Covered               |
| /api/v5/trade/cancel-order                         | POST   | OKXOrderCancelRequest/Response                       | ✓ Covered               |
| /api/v5/account/positions                          | GET    | OKXPositionQueryResponse                             | ✓ Covered               |
| /api/v5/account/balance                            | GET    | OKXMarginBalanceResponse                             | ✓ Covered               |
| /api/v5/asset/withdrawal                           | POST   | OKXWithdrawalRequest/Response                        | ✓ Covered               |
| WS tickers, candle1m, mark-price, funding-rate     | —      | OKXTicker, OKXCandleWS, OKXMarkPrice, OKXFundingRate | ✓ Covered               |
| WS orders, positions                               | —      | OKXOrderUpdateWS, OKXPositionUpdateWS                | ✓ Covered               |

**OKX REST order book** (`GET /api/v5/market/books`): `data[0]` = `{ asks, bids, ts, seqId }`. OKXOrderBook schema covers this.

### Bybit v5: Endpoint → Schema Mapping

| Endpoint                              | Method | Schema                                                               | Status    |
| ------------------------------------- | ------ | -------------------------------------------------------------------- | --------- |
| /v5/market/tickers                    | GET    | BybitTicker                                                          | ✓ Covered |
| /v5/market/orderbook                  | GET    | BybitOrderBook                                                       | ✓ Covered |
| /v5/market/mark-price-kline           | GET    | BybitMarkPriceKline                                                  | ✓ Covered |
| /v5/market/index-price-kline          | GET    | BybitIndexPriceKline                                                 | ✓ Covered |
| /v5/market/instruments-info           | GET    | BybitInstrumentInfo                                                  | ✓ Covered |
| /v5/order/create                      | POST   | BybitOrderSubmitRequest/Response                                     | ✓ Covered |
| /v5/order/cancel                      | POST   | BybitOrderCancelRequest/Response                                     | ✓ Covered |
| /v5/position/list                     | GET    | BybitPositionQueryResponse                                           | ✓ Covered |
| /v5/account/wallet-balance            | GET    | BybitMarginBalanceResponse                                           | ✓ Covered |
| /v5/asset/withdraw/create             | POST   | BybitWithdrawalRequest/Response                                      | ✓ Covered |
| WS orderbook.{depth}.{symbol}         | —      | BybitOrderBook (WS snapshot/delta)                                   | ✓ Covered |
| WS order, execution, position, wallet | —      | BybitOrderUpdateWS, BybitExecutionWS, BybitPositionWS, BybitWalletWS | ✓ Covered |

**Bybit REST order book** (`GET /v5/market/orderbook`): `result` = `{ s, a (asks), b (bids), ts, u, seq, cts }`. BybitOrderBook schema covers this.

### OKX / Bybit Gaps Summary

| Gap                | Severity | Description                                                             |
| ------------------ | -------- | ----------------------------------------------------------------------- |
| ~~OKXOrderBook~~   | ~~High~~ | **Resolved** — added to unified_api_contracts/okx/schemas.py            |
| ~~BybitOrderBook~~ | ~~High~~ | **Resolved** — added to unified_api_contracts/bybit/schemas.py          |
| OKX trades REST    | Low      | GET /api/v5/market/trades — no schema; low priority                     |
| Bybit trades REST  | Low      | GET /v5/market/recent-trade — no schema; low priority                   |
| OKX candles REST   | Low      | GET /api/v5/market/candles — OKXCandleWS covers WS; REST format similar |
| Bybit klines REST  | Low      | GET /v5/market/kline — no schema; low priority                          |

### Recommended Version Pins (OKX / Bybit)

| Venue              | API     | Pin | Notes                                                                                     |
| ------------------ | ------- | --- | ----------------------------------------------------------------------------------------- |
| OKX                | REST v5 | v5  | No SDK; direct HTTP. docs-v5 is current.                                                  |
| Bybit              | REST v5 | v5  | pybit optional; direct HTTP. V5 unified API.                                              |
| Bybit deprecations | —       | —   | cumRealisedPnl deprecated for Options → use curRealisedPnl; Set Risk Limit API deprecated |

---

## Per-Venue Schema Coverage

| Venue         | Key Schemas                                                                                                                                                                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Databento     | DatabentoOhlcvBar, DatabentoTrade, DatabentoMbp1, DatabentoMbp10, DatabentoTbbo, DatabentoMbo, DatabentoBbo1s, DatabentoBbo1m, DatabentoCmbp1, DatabentoStatus, DatabentoImbalance, DatabentoStatistics, DatabentoSystemMsg, DatabentoErrorMsg, DatabentoDefinition, DatabentoSymbol |
| IBKR          | IBKRBar, IBKRTicker, IBKROrder, IBKRPosition, IBKRAccountValue, IBKRPortfolioItem, IBKRPnL                                                                                                                                                                                           |
| Barchart      | BarchartOhlcv15m (VIX 15m historical)                                                                                                                                                                                                                                                |
| Binance       | BinanceTicker, BinanceKline, BinanceOrderBook, BinanceTrade, BinanceOrder, BinanceExchangeInfo                                                                                                                                                                                       |
| Coinbase      | CoinbaseTicker, CoinbaseOrderBook, CoinbaseTrade, CoinbaseCandle, CoinbaseProduct                                                                                                                                                                                                    |
| Tardis        | TardisExchange, TardisInstrument, TardisTrade, TardisOrderBook, TardisBookSnapshot5, TardisBookSnapshot25, TardisIncrementalBookL2, TardisQuotes, TardisLiquidations, TardisDerivativeTicker, TardisOptionsChain                                                                     |
| Yahoo         | YahooQuote, YahooChartResult                                                                                                                                                                                                                                                         |
| The Graph     | TheGraphResponse, SubgraphPool, SubgraphSwap, SubgraphToken, SubgraphReserve, GraphQLError, SubgraphAaveUserPosition, SubgraphUniV3Position, SubgraphCurveGauge, SubgraphMorphoPosition, SubgraphLidoRebase, SubgraphEthenaYield, SubgraphERC20Transfer, SubgraphERC20Approval       |
| Alchemy       | AlchemyRpcResponse, AlchemyAssetTransfer, AlchemyTokenBalance, AlchemyError, AlchemyBlock, AlchemyTransaction, AlchemyLog, AlchemyDecodedLog, AlchemyGasOracle, AlchemySimulationResult, AlchemyWebhookSubscription, AlchemyWebhookCreateParams                                      |
| Flashbots/MEV | FlashbotsBundleParams, FlashbotsBundleResult, FlashbotsCallBundleParams, FlashbotsCallBundleResult, FlashbotsPrivateTransactionParams, FlashbotsCancelPrivateTransactionParams, MevShareBundleParams, MevBlockerEndpoints                                                            |

## TradFi Coverage

- **Databento**: ~506 venues via publisher_id; datasets map to canonical venues (see docs/TRADFI_VENUE_NUANCES.md)
- **IBKR**: TWS/ib_insync; no REST; execution only
- **Barchart**: CSV only (no API); VIX 15m historical
- **No direct CME/NASDAQ/NYSE** — we use Databento for market data

## SDK/API Version Pins

Per-venue/provider API versions and SDK pins used for schema validation. Interfaces (UMI, market-tick-data-service) may use different SDK versions but must align with these schemas.

| Provider/Venue | API Version                                                        | SDK Package   | SDK Version         | Schema→Version Mapping                                                                                                                                                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------ | ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Binance**    | REST v3 (spot), fapi v1 (futures), dapi v1 (coin-m)                | —             | —                   | BinanceTicker, BinanceKline, BinanceOrderBook, BinanceTrade, BinanceOrder, BinanceExchangeInfo ↔ Binance REST v3 / fapi v1                                                                                                                                                                                               |
| **Coinbase**   | Exchange API (no version in path)                                  | —             | —                   | CoinbaseTicker, CoinbaseOrderBook, CoinbaseTrade, CoinbaseCandle, CoinbaseProduct ↔ Coinbase Exchange API                                                                                                                                                                                                                |
| **Databento**  | Historical API (hist.databento.com), Live API (feed.databento.com) | databento     | >=0.32.0            | DatabentoOhlcvBar, DatabentoTrade, DatabentoMbp1, DatabentoMbp10, DatabentoTbbo, DatabentoMbo, DatabentoBbo1s, DatabentoBbo1m, DatabentoCmbp1, DatabentoStatus, DatabentoImbalance, DatabentoStatistics, DatabentoSystemMsg, DatabentoErrorMsg, DatabentoDefinition, DatabentoSymbol ↔ Databento Historical/Live schemas |
| **Tardis**     | HTTP API v1 (api.tardis.dev/v1)                                    | tardis-client | >=1.3.7             | TardisExchange, TardisInstrument, TardisTrade, TardisOrderBook, TardisBookSnapshot5, TardisBookSnapshot25, TardisIncrementalBookL2, TardisQuotes, TardisLiquidations, TardisDerivativeTicker, TardisOptionsChain ↔ Tardis HTTP API v1                                                                                    |
| **OKX**        | REST v5                                                            | —             | —                   | OKXTicker, OKXOrderBook ↔ OKX v5                                                                                                                                                                                                                                                                                         |
| **Bybit**      | REST v5                                                            | —             | —                   | BybitTicker, BybitOrderBook ↔ Bybit v5                                                                                                                                                                                                                                                                                   |
| **CCXT**       | Unified (per-exchange)                                             | ccxt          | >=4.5.24,<5.0.0     | CcxtOrder, CcxtTrade, CcxtTicker, CcxtOrderBook, CcxtMarket ↔ CCXT unified response format                                                                                                                                                                                                                               |
| **Alchemy**    | Node API + Data APIs v2                                            | —             | URL `/v2`           | AlchemyRpcResponse, AlchemyAssetTransfer, AlchemyTokenBalance ↔ alchemy_getAssetTransfers, JSON-RPC                                                                                                                                                                                                                      |
| **The Graph**  | GraphQL (subgraph)                                                 | —             | Gateway endpoint    | TheGraphResponse, SubgraphPool, SubgraphSwap, SubgraphToken, SubgraphReserve ↔ subgraph queries                                                                                                                                                                                                                          |
| **Flashbots**  | JSON-RPC OpenRPC 1.0.0                                             | —             | relay.flashbots.net | FlashbotsBundleParams, FlashbotsBundleResult, FlashbotsPrivateTransactionParams ↔ eth_sendBundle, eth_sendPrivateTransaction                                                                                                                                                                                             |

**Notes:**

- Binance: Spot `api.binance.com/api/v3`; USD-M futures `fapi.binance.com/fapi/v1`; Coin-M `dapi.binance.com/dapi/v1`
- Databento/Tardis SDK pins are for schema-validation only; install via `uv pip install -e ".[schema-validation]"`
- Interfaces may use different SDK versions but must produce data that validates against these schemas

---

## Databento and Tardis: Schema–Version Alignment

### Version Targets

| Provider  | API/Client             | Recommended Version Pin | Workspace Usage                                                                                       |
| --------- | ---------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| Databento | databento-python       | `>=0.70.0`              | unified-trading-services: >=0.70.0; unified-market-interface: >=0.32.0; instruments-service: >=0.20.0 |
| Tardis    | tardis-client (Python) | `>=1.3.7`               | market-tick-data-service: >=1.3.7                                                                     |

**Databento API** (historical + live): https://hist.databento.com, https://feed.databento.com
**Tardis API** (HTTP + CSV datasets): https://api.tardis.dev/v1

### Databento: Endpoint/Dataset → Schema Mapping

| Databento Schema (API)                 | unified-api-contracts Schema   | Status                                            |
| -------------------------------------- | ------------------------------ | ------------------------------------------------- |
| ohlcv-1s, ohlcv-1m, ohlcv-1h, ohlcv-1d | DatabentoOhlcvBar              | ✓ Covered (rtype: 32=OHLCV-1M, 17=OHLCV-1S, etc.) |
| trades                                 | DatabentoTrade                 | ✓ Covered                                         |
| mbp-1                                  | DatabentoMbp1                  | ✓ Covered                                         |
| mbp-10                                 | DatabentoMbp10                 | ✓ Covered                                         |
| tbbo                                   | DatabentoTbbo                  | ✓ Covered                                         |
| definition                             | DatabentoDefinition            | ✓ Covered                                         |
| symbology/metadata                     | DatabentoSymbol                | ✓ Covered                                         |
| mbo                                    | DatabentoMbo                   | ✓ Covered                                         |
| bbo-1s, bbo-1m                         | DatabentoBbo1s, DatabentoBbo1m | ✓ Covered                                         |
| cmbp-1                                 | DatabentoCmbp1                 | ✓ Covered                                         |
| statistics                             | DatabentoStatistics            | ✓ Covered                                         |
| status                                 | DatabentoStatus                | ✓ Covered                                         |
| imbalance                              | DatabentoImbalance             | ✓ Covered                                         |
| system_msg                             | DatabentoSystemMsg             | ✓ Covered (Live feed control)                     |
| error_msg                              | DatabentoErrorMsg              | ✓ Covered (Live feed control)                     |

**Databento full schema list** (per `/v1/metadata/list_schemas`): mbo, mbp-1, mbp-10, tbbo, trades, bbo-1s, bbo-1m, ohlcv-1s, ohlcv-1m, ohlcv-1h, ohlcv-1d, definition, statistics, status, imbalance, cmbp-1; system_msg/error_msg (Live API control records)

### Tardis: Data Type → Schema Mapping

| Tardis Data Type    | unified-api-contracts Schema                               | Status    |
| ------------------- | ---------------------------------------------------------- | --------- |
| trades              | TardisTrade, TARDIS_TRADES_SCHEMA                          | ✓ Covered |
| book_snapshot_5     | TardisBookSnapshot5, TARDIS_BOOK_SNAPSHOT_5_SCHEMA         | ✓ Covered |
| book_snapshot_25    | TardisBookSnapshot25, TARDIS_BOOK_SNAPSHOT_25_SCHEMA       | ✓ Covered |
| incremental_book_L2 | TardisIncrementalBookL2, TARDIS_INCREMENTAL_BOOK_L2_SCHEMA | ✓ Covered |
| quotes              | TardisQuotes, TARDIS_QUOTES_SCHEMA                         | ✓ Covered |
| liquidations        | TardisLiquidations, TARDIS_LIQUIDATIONS_SCHEMA             | ✓ Covered |
| derivative_ticker   | TardisDerivativeTicker, TARDIS_DERIVATIVE_TICKER_SCHEMA    | ✓ Covered |
| options_chain       | TardisOptionsChain, TARDIS_OPTIONS_CHAIN_SCHEMA            | ✓ Covered |
| exchanges           | TardisExchange                                             | ✓ Covered |
| instruments         | TardisInstrument                                           | ✓ Covered |
| orderbook (generic) | TardisOrderBook                                            | ✓ Covered |

**Tardis schema format**: Timestamps in microseconds since epoch; CSV columns per https://docs.tardis.dev/downloadable-csv-files

### Gaps Summary (Databento/Tardis)

| Provider | Gap | Priority | Notes                                                            |
| -------- | --- | -------- | ---------------------------------------------------------------- |
| —        | —   | —        | All Databento and Tardis schemas verified via Context7 (2026-02) |

### Recommended Version Pins

- **databento**: `>=0.70.0` — align all repos (unified-trading-services already uses this; unified-market-interface and instruments-service use lower).
- **tardis-client**: `>=1.3.7` — keep current; market-tick-data-service uses this.

---

## CCXT Schema–Version Alignment

**Target version:** `ccxt>=4.4.0,<5.0.0` (Context7: /ccxt/ccxt; PyPI latest 4.4.x–4.5.x)

**Consumer pins (workspace):**

- unified-market-interface: `ccxt>=4.0`
- market-tick-data-service: `ccxt>=4.5.24,<5.0.0`
- unified-trade-execution-interface: `ccxt>=4.0`
- unified-reference-data-interface: `ccxt>=4.0.0`

### Endpoint → Schema Mapping (CCXT)

| CCXT Method    | Endpoint Key | Schema Class        | Status |
| -------------- | ------------ | ------------------- | ------ |
| fetchOrder     | order        | CcxtOrder           | ✅     |
| fetchMyTrades  | trade        | CcxtTrade           | ✅     |
| fetchBalance   | balance      | CcxtBalanceResponse | ✅     |
| fetchPositions | position     | CcxtPosition        | ✅     |
| fetchTicker    | ticker       | CcxtTicker          | ✅     |
| fetchOrderBook | orderbook    | CcxtOrderBook       | ✅     |
| fetchMarkets   | market       | CcxtMarket          | ✅     |

### CCXT Schema Gaps (vs CCXT Manual / Context7)

| Schema       | Missing Fields (CCXT unified)                                                  | Notes                          |
| ------------ | ------------------------------------------------------------------------------ | ------------------------------ |
| CcxtOrder    | lastTradeTimestamp, cost, trades, fee                                          | fee nested object; trades list |
| CcxtTrade    | type, takerOrMaker                                                             | Optional                       |
| CcxtPosition | id, percentage, collateral, liquidationPrice, realizedPnl, timestamp, datetime | Futures-specific               |
| CcxtTicker   | timestamp, datetime, open, close, previousClose                                | Optional                       |
| CcxtBalance  | —                                                                              | Aligned (free, used, total)    |

---

## IBKR / ib_insync Schema–Version Alignment

**Target version:** `ib_insync>=0.9.86` (Context7: /erdewit/ib_insync; PyPI latest 0.9.86)

**Consumer pins (workspace):**

- unified-trade-execution-interface: `ib_insync>=0.9.86`

**API model:** TWS API (no REST). ib_insync wraps TWS over WebSocket/socket. Schemas represent callback/response shapes.

### Endpoint → Schema Mapping (IBKR)

| TWS / ib_insync Method                      | Endpoint Key         | Schema Class           | Status |
| ------------------------------------------- | -------------------- | ---------------------- | ------ |
| reqHistoricalData / reqBarChartData         | bar                  | IBKRBar                | ✅     |
| ticker / reqMktData                         | ticker               | IBKRTicker             | ✅     |
| placeOrder / openTrades                     | order                | IBKROrder              | ✅     |
| reqPositions / positions()                  | position             | IBKRPosition           | ✅     |
| reqAccountSummary / accountValues()         | account_value        | IBKRAccountValue       | ✅     |
| reqAccountUpdatesMulti / updateAccountValue | account_update_multi | IBKRAccountUpdateMulti | ✅     |
| reqAccountUpdates / portfolio()             | portfolio            | IBKRPortfolioItem      | ✅     |
| reqPnL                                      | pnl                  | IBKRPnL                | ✅     |
| reqContractDetails                          | contract_details     | IBKRContractDetails    | ✅     |
| — (WebSocket close)                         | —                    | IBKRWebSocketClose     | ✅     |
| — (error callback)                          | —                    | IBKRError              | ✅     |

### IBKR Schemas Deferred (Complex; Document Only)

The following IBKR TWS API surfaces are complex and not yet modeled. Add schemas when integrating:

| Surface             | TWS / ib_insync                                  | Notes                                                                                    |
| ------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Financial Advisor   | reqManagedAccts, reqFA\*, managedAccounts        | IBKRFAProfile, IBKRFAAccountGroup, IBKRFAAllocationProfile — FA hierarchy and allocation |
| News                | reqNewsProviders, reqHistoricalNews, newsArticle | IBKRNewsProvider, IBKRNewsArticle, IBKRHistoricalNews — provider list, article payload   |
| Flex Query          | flexReport, flexStatement                        | IBKRFlexQuery, IBKRCashReport, IBKRStatement — XML/CSV report parsing                    |
| Portfolio Analytics | reqPnL, reqPositionPnL                           | IBKRPortfolioAnalytics — analytics aggregation                                           |

### IBKR Schema Gaps (vs ib_insync / TWS API)

| Schema              | Notes                                                                                                                                                                                                 |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| IBKROrder           | Subset of ib_insync Order dataclass (~80+ fields). Core fields (orderId, action, totalQuantity, lmtPrice, status) aligned.                                                                            |
| IBKRPosition        | Aligned: account, contract, position, avgCost, marketPrice, marketValue, unrealizedPNL, realizedPNL. ib_insync uses `averageCost` in PortfolioItem; our schema uses `avgCost` (TWS API uses avgCost). |
| IBKRPortfolioItem   | Same as Position; `averageCost` vs `avgCost` — TWS/ib_insync may expose either; schema supports avgCost.                                                                                              |
| IBKRContractDetails | Used for reference data (reqContractDetails).                                                                                                                                                         |
| Execution/Fill      | No dedicated schema. ib_insync Fill has execution (execId, shares, price), commissionReport. Consider IBKRExecution if execution validation needed.                                                   |

---

## Recommended Version Pins

| Venue/Provider | Schema Module              | Package / API | Recommended Pin | Last Validated |
| -------------- | -------------------------- | ------------- | --------------- | -------------- |
| CCXT           | unified_api_contracts.ccxt | ccxt          | >=4.4.0,<5.0.0  | 2026-02        |
| IBKR           | unified_api_contracts.ibkr | ib_insync     | >=0.9.86        | 2026-02        |

**Note:** unified-api-contracts does not import ccxt or ib_insync. Version pins are for consumer repos (UMI, UTEI, etc.) and for schema-validation tests when collecting responses.

---

## DeFi APIs: Alchemy, The Graph, Flashbots

Schema–version alignment for DeFi data sources and MEV protection. Sources: Alchemy docs, The Graph GraphQL API docs, Flashbots OpenRPC spec and Protect docs.

### Version Targets

| Provider      | API/Spec                  | Recommended Version Pin                      | Schema Module                  |
| ------------- | ------------------------- | -------------------------------------------- | ------------------------------ |
| **Alchemy**   | Node API + Data APIs (v2) | URL path `/v2`                               | unified_api_contracts.alchemy  |
| **The Graph** | GraphQL API (subgraph)    | Gateway endpoint; Hosted deprecated Jun 2024 | unified_api_contracts.thegraph |
| **Flashbots** | JSON-RPC OpenRPC 1.2.4    | API spec 1.0.0                               | unified_api_contracts.mev      |

### Alchemy

**Target:** Node API (JSON-RPC) + Data APIs. Base URL: `https://eth-mainnet.g.alchemy.com/v2` (chain-specific; e.g. `eth-mainnet`, `arb-mainnet`).

**API surface (docs):**

- Node API: standard JSON-RPC (eth_blockNumber, eth_getLogs, etc.)
- Data APIs: Transfers (`alchemy_getAssetTransfers`), Portfolio, NFT, Prices, Webhooks, Simulation

**Endpoint → Schema Mapping**

| Alchemy Method / API         | Endpoint Key                         | Schema Class                                                    | Status               |
| ---------------------------- | ------------------------------------ | --------------------------------------------------------------- | -------------------- |
| Any JSON-RPC                 | rpc                                  | AlchemyRpcResponse                                              | ✅                   |
| alchemy_getAssetTransfers    | transfers                            | AlchemyAssetTransfer                                            | ✅                   |
| alchemy_getTokenBalances     | —                                    | AlchemyTokenBalance                                             | ✅ (no endpoint map) |
| alchemy_createWebhook        | webhook                              | AlchemyWebhookSubscription, AlchemyWebhookCreateParams          | ✅                   |
| Block, Transaction, Log      | block, transaction, log, decoded_log | AlchemyBlock, AlchemyTransaction, AlchemyLog, AlchemyDecodedLog | ✅                   |
| alchemy_getGasPrice          | gas_oracle                           | AlchemyGasOracle                                                | ✅                   |
| alchemy_simulateAssetChanges | simulation_result                    | AlchemySimulationResult                                         | ✅                   |
| NFT API                      | nft_metadata, nft_ownership          | AlchemyNFTMetadata, AlchemyNFTOwnership                         | ✅                   |
| —                            | —                                    | AlchemyError                                                    | ✅                   |
| Portfolio API                | —                                    | —                                                               | ✗ Gap                |
| Prices API                   | —                                    | —                                                               | ✗ Gap                |

**AlchemyAssetTransfer** fields (per Transfers API): blockNum, hash, from, to, value, asset, category, metadata. Schema aligned.

### The Graph

**Target:** GraphQL API. Entity schema is subgraph-specific. Hosted Service (`api.thegraph.com`) deprecated June 2024.

**Endpoint structure:**

- **Production:** `https://gateway.thegraph.com/api/<API_KEY>/subgraphs/id/<SUBGRAPH_ID>`
- **Studio (dev):** `https://api.studio.thegraph.com/query/<ID>/<SUBGRAPH_NAME>/<VERSION>`

**Current BASE_URLS:** `https://api.thegraph.com` — consider updating to gateway for production use.

**Endpoint → Schema Mapping**

| Query / Entity Type  | Endpoint Key | Schema Class     | Subgraph Examples | Status |
| -------------------- | ------------ | ---------------- | ----------------- | ------ |
| Any GraphQL response | response     | TheGraphResponse | —                 | ✅     |
| GraphQL errors       | —            | GraphQLError     | —                 | ✅     |
| Pool entity          | —            | SubgraphPool     | Uniswap V2/V3     | ✅     |
| Swap entity          | —            | SubgraphSwap     | Uniswap           | ✅     |
| Token entity         | —            | SubgraphToken    | Uniswap, Aave     | ✅     |
| Reserve entity       | —            | SubgraphReserve  | Aave              | ✅     |
| Pair / Liquidity     | —            | —                | Sushi, Curve      | ✗ Gap  |
| Gauge / Vote         | —            | —                | Curve, Balancer   | ✗ Gap  |

**Note:** The Graph has no single API version; each subgraph defines its own schema. Our schemas cover Uniswap-style and Aave-style entities. Add SubgraphPair, SubgraphGauge when integrating Sushi/Curve/Balancer.

### Flashbots

**Target:** Flashbots JSON-RPC API. OpenRPC spec: https://flashbots.github.io/api-specs/latest/openrpc.json (version 1.0.0). Protect docs: https://docs.flashbots.net/flashbots-protect/

**Endpoint:** `https://relay.flashbots.net` (bundles, eth_sendPrivateTransaction, eth_cancelPrivateTransaction)

**Endpoint → Schema Mapping**

| Flashbots Method                | Schema (Request)                        | Schema (Response)         | Status             |
| ------------------------------- | --------------------------------------- | ------------------------- | ------------------ |
| eth_sendBundle                  | FlashbotsBundleParams                   | FlashbotsBundleResult     | ✅                 |
| eth_callBundle                  | FlashbotsCallBundleParams               | FlashbotsCallBundleResult | ✅                 |
| eth_sendPrivateTransaction      | FlashbotsPrivateTransactionParams       | (tx hash string)          | ✅                 |
| eth_cancelPrivateTransaction    | FlashbotsCancelPrivateTransactionParams | (boolean)                 | ✅                 |
| mev_sendBundle (MEV-Share v0.1) | MevShareBundleParams                    | MevShareBundleResult      | ✅                 |
| MEV Blocker RPC                 | —                                       | MevBlockerEndpoints       | ✅ (endpoint list) |

**FlashbotsBundleParams** (per OpenRPC): txs, blockNumber (required); replacementUuid, minTimestamp, maxTimestamp, revertingTxHashes, builders (optional). Schema aligned.

**eth_sendPrivateTransaction** preferences (per Protect docs): fast, privacy (hints, builders), validity (refund). Schema aligned.

**eth_cancelPrivateTransaction** (FlashbotsCancelPrivateTransactionParams): txHash (required). Cancels a previously submitted private tx; must be signed by same key

### bloXroute BDN

**Target:** Gateway-API, Cloud-API, Protect RPC for Ethereum/BSC. Docs: docs.bloxroute.com (some paths return 404).

**Endpoints:**

- **Cloud-API:** `https://api.blxrbdn.com` (HTTPS POST), `wss://api.blxrbdn.com/ws` (WebSocket)
- **Protect RPC:** `https://eth-protect.rpc.blxrbdn.com` (frontrunning protection), `https://eth.rpc.blxrbdn.com` (Gas Protect)
- **Regional:** `wss://virginia.eth.blxrbdn.com/ws`, `wss://virginia.bsc.blxrbdn.com/ws`

**Endpoint → Schema Mapping**

| bloXroute Method / Stream   | Endpoint Key      | Schema Class              | Status    |
| --------------------------- | ----------------- | ------------------------- | --------- |
| blxr_tx (submit tx)         | tx_submit         | BloxrouteTxSubmitResult   | ✅        |
| subscribe bdnBlocks         | bdn_blocks        | BloxrouteBdnBlocksParams  | ✅        |
| subscribe newTxs/pendingTxs | subscribe         | BloxrouteSubscribeParams  | ✅ (stub) |
| Protect RPC URLs            | protect_endpoints | BloxrouteProtectEndpoints | ✅        |
| JSON-RPC error              | —                 | BloxrouteError            | ✅        |

**Gaps:** Full streaming payload schemas (bdnBlocks block body, newTxs tx format) require live samples; docs.bloxroute.com returns 404 for some paths. BloxrouteSubscribeParams is a minimal stub.

### DeFi / MEV Schema Gaps Summary

| Provider    | Gap                                                           | Priority | Notes                                                      |
| ----------- | ------------------------------------------------------------- | -------- | ---------------------------------------------------------- |
| Alchemy     | Portfolio API, Prices API                                     | Low      | Add schemas when integrating                               |
| The Graph   | SubgraphProtocolTvlSnapshot, Pair, protocol-specific entities | Low      | Sushi, Curve, Balancer subgraphs                           |
| MEV Blocker | GET /tx/{hash} transaction status                             | Low      | status, hash, rpc_timestamp, transaction, backruns, refund |
| bloXroute   | bdnBlocks/newTxs stream payload schemas                       | Low      | Minimal stubs added; full schemas need live samples        |
| Endpoints   | BASE_URLS thegraph → gateway.thegraph.com                     | Medium   | Hosted Service deprecated                                  |

### DeFi / MEV Endpoint Inventory (Context7 Discovery)

| Provider        | Endpoints Contracted                                                                                                                                                | Endpoints Not Contracted                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Alchemy**     | Node RPC, getAssetTransfers, getTokenBalances, createWebhook, Block/Tx/Log, GasOracle, Simulation, NFT                                                              | Portfolio, Prices, deleteWebhook, listWebhooks                    |
| **The Graph**   | GraphQL (entity-specific: Pool, Swap, Token, Reserve, AaveUserPosition, UniV3Position, CurveGauge, MorphoPosition, LidoRebase, EthenaYield, ERC20Transfer/Approval) | SubgraphProtocolTvlSnapshot, protocol-specific entities           |
| **Flashbots**   | eth_sendBundle, eth_callBundle, eth_sendPrivateTransaction, eth_cancelPrivateTransaction, mev_sendBundle                                                            | eth_sendPrivateRawTransaction (alias)                             |
| **MEV Blocker** | Endpoint URLs (fast, noreverts, fullprivacy, maxbackruns, nochecks); eth_sendRawTransaction                                                                         | GET /tx/{hash} status                                             |
| **bloXroute**   | blxr_tx, subscribe (bdnBlocks, newTxs, pendingTxs), Protect RPC URLs                                                                                                | Full stream payload schemas; Solana Trader API (separate product) |

### Recommended Version Pins (DeFi)

| Provider  | Pin / Reference                                                 |
| --------- | --------------------------------------------------------------- |
| Alchemy   | Base URL `/v2`; no SDK — HTTP/JSON-RPC direct                   |
| The Graph | Gateway endpoint; GraphQL Oct 2021 spec (validation)            |
| Flashbots | OpenRPC spec 1.0.0; Protect docs for eth_sendPrivateTransaction |
| bloXroute | Cloud-API api.blxrbdn.com; JSON-RPC 2.0; docs.bloxroute.com     |

---

## Sports Venues: Betfair, Kalshi, Pinnacle, Polymarket, Odds API, API-Football

Schema–version alignment for sports betting and prediction market APIs.

### Version Targets

| Venue            | API Version               | Base URL                                                                                      | Recommended Pin |
| ---------------- | ------------------------- | --------------------------------------------------------------------------------------------- | --------------- |
| **Betfair**      | REST v1.0, Stream API     | `https://api.betfair.com/exchange/betting/rest/v1.0`                                          | v1.0            |
| **Kalshi**       | REST v2, WebSocket v2     | `https://trading-api.kalshi.com/trade-api/v2`, `wss://trading-api.kalshi.com/trade-api/ws/v2` | v2              |
| **Pinnacle**     | REST (no version in path) | `https://api.pinnacle.com`                                                                    | —               |
| **Polymarket**   | CLOB API                  | `https://clob.polymarket.com`                                                                 | —               |
| **Odds API**     | v4                        | `https://api.the-odds-api.com/v4`                                                             | v4              |
| **API-Football** | v3                        | `https://v3.football.api-sports.io`                                                           | v3              |

### Schema → Version Mapping (Sports)

| Venue            | Schema                     | Endpoint / Source                                             |
| ---------------- | -------------------------- | ------------------------------------------------------------- |
| **Betfair**      | BetfairAuthResponse        | POST /identity/certlogin or /identity/login                   |
| **Betfair**      | BetfairMarketBook          | Stream API mcm (market change)                                |
| **Betfair**      | BetfairMarketChangeMessage | Stream API market subscription                                |
| **Betfair**      | BetfairOrderUpdate         | Stream API order subscription                                 |
| **Kalshi**       | KalshiSeries               | GET /trade-api/v2/series/{series_ticker}                      |
| **Kalshi**       | KalshiEvent                | GET /trade-api/v2/events/{event_ticker}                       |
| **Kalshi**       | KalshiMarket               | GET /trade-api/v2/markets, GET /trade-api/v2/markets/{ticker} |
| **Kalshi**       | KalshiOrderBook            | GET /trade-api/v2/markets/{ticker}/orderbook                  |
| **Kalshi**       | KalshiTrade                | GET /trade-api/v2/markets/{ticker}/trades                     |
| **Kalshi**       | KalshiOrder                | GET /trade-api/v2/portfolio/orders/{order_id}                 |
| **Kalshi**       | KalshiFill                 | GET /trade-api/v2/portfolio/fills                             |
| **Kalshi**       | KalshiPosition             | GET /trade-api/v2/portfolio/positions                         |
| **Kalshi**       | KalshiBalance              | GET /trade-api/v2/portfolio/balance                           |
| **Kalshi**       | KalshiCandlestick          | GET /trade-api/v2/markets/{ticker}/candlesticks               |
| **Kalshi**       | KalshiHistoricalCutoff     | GET /trade-api/v2/historical/cutoff                           |
| **Pinnacle**     | PinnacleLeague             | GET /v1/leagues                                               |
| **Pinnacle**     | PinnacleEvent              | GET /v1/events                                                |
| **Pinnacle**     | PinnacleOddsResponse       | GET /v1/odds                                                  |
| **Pinnacle**     | PinnacleSettlementResponse | GET /v1/settlements                                           |
| **Polymarket**   | PolymarketMarket           | GET /markets                                                  |
| **Polymarket**   | PolymarketOrderBook        | GET /book                                                     |
| **Polymarket**   | PolymarketTrade            | GET /trades                                                   |
| **Polymarket**   | PolymarketOrder            | CLOB order                                                    |
| **Polymarket**   | PolymarketFill             | CLOB fill                                                     |
| **Polymarket**   | PolymarketMarketResult     | Market resolution                                             |
| **Odds API**     | OddsApiFixture             | GET /sports/{sport}/odds                                      |
| **Odds API**     | OddsApiHistoricalOdds      | GET /sports/{sport}/odds/history                              |
| **API-Football** | ApiFootballTeam            | GET /v3/teams                                                 |
| **API-Football** | ApiFootballLeague          | GET /v3/leagues                                               |
| **API-Football** | ApiFootballFixture         | GET /v3/fixtures                                              |
| **API-Football** | ApiFootballLineup          | GET /v3/fixtures/lineups                                      |
| **API-Football** | ApiFootballStanding        | GET /v3/standings                                             |
| **API-Football** | ApiFootballOdds            | GET /v3/odds, GET /v3/odds/live                               |

---

## Deribit Schema–Version Alignment

**Target version:** REST API v2, WebSocket JSON-RPC 2.0

**Base URL:** `https://www.deribit.com/api/v2`

### Version Targets

| Component             | API Version  | Recommended Pin |
| --------------------- | ------------ | --------------- |
| **Deribit REST**      | v2           | /api/v2         |
| **Deribit WebSocket** | JSON-RPC 2.0 | —               |

### Schema → Version Mapping (Deribit)

| Endpoint / Channel                           | Schema                        | Notes                 |
| -------------------------------------------- | ----------------------------- | --------------------- |
| private/get_account_summary                  | DeribitAccountSummary         | Full account snapshot |
| user.portfolio.{currency}                    | DeribitPortfolioMarginSummary | WS portfolio margin   |
| public/get_volatility_index_data             | DeribitVolatilityIndex        | DVOL/BVOL             |
| public/get_funding_rate_history              | DeribitFundingRateHistory     | Perpetual funding     |
| private/get_settlement_history_by_instrument | DeribitSettlementCashFlows    | Settlement/delivery   |
| public/get_instrument(s)                     | DeribitInstrumentInfoFull     | Instrument specs      |
| public/get_order_book                        | DeribitOrderBook              | L2 book               |
| ticker.{instrument}.{interval}               | DeribitTickerFull             | WS full ticker        |
| perpetual.{instrument}.{interval}            | DeribitPerpetualFunding       | WS funding            |
| user.portfolio.{currency}                    | DeribitUserPortfolio          | WS user portfolio     |
| private/get_settlement_history_by_currency   | DeribitSettlementHistory      | Settlement history    |

---

## Hyperliquid Schema–Version Alignment

**Target version:** HTTP POST /info, WebSocket

**Base URL:** `https://api.hyperliquid.xyz`

### Version Targets

| Component                 | API Version                  | Recommended Pin |
| ------------------------- | ---------------------------- | --------------- |
| **Hyperliquid REST**      | POST /info (type param)      | —               |
| **Hyperliquid WebSocket** | wss://api.hyperliquid.xyz/ws | —               |

### Schema → Version Mapping (Hyperliquid)

| POST /info type                 | Schema                         | Notes                      |
| ------------------------------- | ------------------------------ | -------------------------- |
| meta                            | HyperliquidMeta                | Universe/asset metadata    |
| ticker                          | HyperliquidTicker              | Mark/mid price             |
| clearinghouseState              | HyperliquidUserState           | User state                 |
| l2Book                          | HyperliquidL2Book              | L2 order book              |
| fundingHistory / userFunding    | HyperliquidFundingHistoryEntry | Funding                    |
| userFills                       | HyperliquidFill                | Fills                      |
| openOrders / frontendOpenOrders | HyperliquidOpenOrder           | Open orders                |
| candleSnapshot                  | HyperliquidCandle              | OHLCV                      |
| vaultDetails                    | HyperliquidVaultDetails        | Vault info                 |
| spotMeta                        | HyperliquidSpotMeta            | Spot metadata              |
| userFees                        | HyperliquidUserFees            | Fee schedule               |
| subAccounts                     | HyperliquidSubAccount          | Sub-accounts               |
| order                           | HyperliquidOrder               | Order (REST/WS)            |
| position                        | HyperliquidPosition            | Position (from user state) |

---

## Aster Schema–Version Alignment

**Target version:** Binance Futures-compatible REST + WebSocket

**Base URL:** `https://api.aster.finance`

**WebSocket:** `wss://fstream.asterdex.com`

### Version Targets

| Component           | API Version                           | Recommended Pin  |
| ------------------- | ------------------------------------- | ---------------- |
| **Aster REST**      | fapi/v1, fapi/v2 (Binance-compatible) | fapi/v1, fapi/v2 |
| **Aster WebSocket** | Binance Futures stream format         | —                |

### Schema → Version Mapping (Aster)

| Endpoint / Stream                  | Schema                   | Notes               |
| ---------------------------------- | ------------------------ | ------------------- |
| GET /fapi/v1/aggTrades             | AsterAggTrade            | Aggregate trades    |
| GET /fapi/v1/trades                | AsterTrade               | Recent trades       |
| GET /fapi/v1/klines                | AsterKline               | OHLCV               |
| GET /fapi/v1/premiumIndex          | AsterMarkPrice           | Mark price          |
| GET /fapi/v1/fundingRate           | AsterFundingRate         | Funding rate        |
| GET /fapi/v1/openInterest          | AsterOpenInterest        | OI                  |
| GET /futures/data/openInterestHist | AsterOpenInterestHistory | OI history          |
| GET /fapi/v1/ticker/24hr           | AsterTicker24hr          | 24h ticker          |
| GET /fapi/v1/exchangeInfo          | AsterExchangeInfo        | Exchange info       |
| GET /fapi/v2/account               | AsterAccount             | Account             |
| GET /fapi/v1/income                | AsterIncome              | Income/funding PnL  |
| GET /fapi/v1/leverageBracket       | AsterLeverageBracket     | Leverage brackets   |
| WS ORDER_TRADE_UPDATE              | AsterOrderTradeUpdate    | Order/trade update  |
| WS ACCOUNT_UPDATE                  | AsterAccountUpdate       | Account update      |
| WS @forceOrder                     | AsterLiquidationOrder    | Liquidation         |
| —                                  | AsterMarket              | Market/instrument   |
| —                                  | AsterOrderBook           | Order book snapshot |
| —                                  | AsterOrder               | Order submit/status |
| —                                  | AsterPosition            | Position            |

---

## DeFi Protocol Lending Schema–Version Alignment

**Target:** Aave V3, Compound V3, Morpho, Euler — on-chain data and subgraph queries.

### Version Targets

| Protocol        | API / Source             | Recommended Pin        |
| --------------- | ------------------------ | ---------------------- |
| **Aave V3**     | Contract reads, subgraph | Aave V3 pool addresses |
| **Compound V3** | Contract reads, subgraph | cUSDCv3, cETH, etc.    |
| **Morpho**      | Contract reads, subgraph | Morpho Blue markets    |
| **Euler**       | Contract reads, subgraph | Euler vaults           |

### Schema → Version Mapping (DeFi Lending)

| Protocol        | Schema                 | Source                             |
| --------------- | ---------------------- | ---------------------------------- |
| **Aave V3**     | AaveV3ReserveData      | getReserveData()                   |
| **Aave V3**     | AaveV3UserAccountData  | getUserAccountData()               |
| **Aave V3**     | AaveV3UserReserveData  | getUserReserveData()               |
| **Compound V3** | CompoundV3MarketInfo   | getSupplyBalance, getBorrowBalance |
| **Compound V3** | CompoundV3UserPosition | User supply/borrow                 |
| **Morpho**      | MorphoMarketParams     | market params                      |
| **Morpho**      | MorphoUserPosition     | supply/borrow shares               |
| **Euler**       | EulerVaultData         | vault data                         |
| **Euler**       | EulerUserPosition      | user position                      |

---

## GCP and AWS Cloud SDK Schema–Version Alignment

Schema–version verification for GCP (google-cloud-python: compute, run, storage, bigquery) and AWS (boto3: ec2, ecs, s3, glue) Cloud SDKs. unified-api-contracts defines Pydantic request/response schemas in `unified_api_contracts/cloud_sdks/`; these align with SDK resource shapes for validation and type safety.

### Version Targets

| SDK               | Package               | Recommended Pin    | Workspace Usage                                                         |
| ----------------- | --------------------- | ------------------ | ----------------------------------------------------------------------- |
| **GCP Compute**   | google-cloud-compute  | `>=1.0.0,<2.0.0`   | deployment-service                                                      |
| **GCP Cloud Run** | google-cloud-run      | `>=0.15.0,<1.0.0`  | deployment-service                                                      |
| **GCP Storage**   | google-cloud-storage  | `>=3.8.0,<4.0.0`   | unified-trading-services, unified-cloud-interface                       |
| **GCP BigQuery**  | google-cloud-bigquery | `>=3.40.0,<4.0.0`  | unified-trading-services                                                |
| **AWS boto3**     | boto3                 | `>=1.40.70,<2.0.0` | unified-cloud-interface, unified-ml-interface, unified-config-interface |
| **AWS botocore**  | botocore              | `>=1.34.0,<2.0.0`  | unified-trading-services, unified-cloud-interface                       |

**Note:** unified-api-contracts does not depend on these SDKs. Version pins are for consumer repos (unified-trading-services, unified-cloud-interface, etc.) that use the schemas for validation.

### GCP: Resource → Schema Mapping

| SDK           | API Resource / Method               | unified-api-contracts Schema                                                       | Status |
| ------------- | ----------------------------------- | ---------------------------------------------------------------------------------- | ------ |
| **Compute**   | InstancesClient.insert()            | InsertInstanceRequest, ComputeOperation                                            | ✓      |
| **Compute**   | InstancesClient.get()               | GetInstanceRequest, ComputeInstance                                                | ✓      |
| **Compute**   | InstancesClient.list()              | ListInstancesRequest, InstanceListResponse                                         | ✓      |
| **Compute**   | InstancesClient.delete/start/stop() | DeleteInstanceRequest, StartInstanceRequest, StopInstanceRequest, ComputeOperation | ✓      |
| **Cloud Run** | ServicesClient.create_service()     | CreateServiceRequest, CloudRunService                                              | ✓      |
| **Cloud Run** | ServicesClient.update_service()     | UpdateServiceRequest, UpdateTrafficSplitRequest                                    | ✓      |
| **Cloud Run** | RevisionsClient.list_revisions()    | ListRevisionsRequest, RevisionListResponse                                         | ✓      |
| **GCS**       | Client.create_bucket()              | BucketCreateRequest                                                                | ✓      |
| **GCS**       | Bucket.list_blobs()                 | BlobListRequest, BlobListResponse, GcsBlobInfo                                     | ✓      |
| **GCS**       | Blob.upload/download                | BlobUploadRequest, BlobDownloadRequest                                             | ✓      |
| **BigQuery**  | Client.query()                      | QueryRequest, QueryJobResult                                                       | ✓      |
| **BigQuery**  | Client.create_table()               | TableCreateRequest, TableInfo                                                      | ✓      |
| **BigQuery**  | External table (Hive)               | ExternalTableConfig, ExternalTableCreateRequest, HivePartitioningOptions           | ✓      |

### AWS: Resource → Schema Mapping

| SDK                | API Method                             | unified-api-contracts Schema                                                                                   | Status |
| ------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------ |
| **EC2**            | run_instances                          | EC2RunInstancesRequest, EC2RunInstancesResponse                                                                | ✓      |
| **EC2**            | describe_instances                     | EC2DescribeInstancesRequest, EC2DescribeInstancesResponse, EC2Reservation, EC2Instance                         | ✓      |
| **EC2**            | start/stop/terminate_instances         | EC2StartInstancesRequest, EC2StopInstancesRequest, EC2TerminateInstancesRequest, EC2StartStopTerminateResponse | ✓      |
| **ECS**            | run_task                               | ECSRunTaskRequest, ECSRunTaskResponse                                                                          | ✓      |
| **ECS**            | describe_tasks                         | ECSDescribeTasksRequest, ECSDescribeTasksResponse                                                              | ✓      |
| **Lambda**         | invoke                                 | LambdaInvokeRequest, LambdaInvokeResponse                                                                      | ✓      |
| **S3**             | create_bucket                          | S3CreateBucketRequest, S3CreateBucketResponse                                                                  | ✓      |
| **S3**             | list_objects_v2                        | S3ListObjectsV2Request, S3ListObjectsV2Response, S3ObjectSummary                                               | ✓      |
| **S3**             | put_object                             | S3PutObjectRequest, S3PutObjectResponse                                                                        | ✓      |
| **S3**             | get_object                             | S3GetObjectRequest, S3GetObjectResponse                                                                        | ✓      |
| **Glue**           | create_table                           | GlueCreateTableRequest, GlueCreateTableResponse                                                                | ✓      |
| **Glue**           | get_table                              | GlueGetTableRequest, GlueGetTableResponse, GlueTable                                                           | ✓      |
| **Glue**           | get_tables                             | GlueGetTablesRequest, GlueGetTablesResponse                                                                    | ✓      |
| **Glue**           | get_database                           | GlueGetDatabaseRequest, GlueGetDatabaseResponse, GlueDatabase                                                  | ✓      |
| **Service Quotas** | get_service_quota, list_service_quotas | ServiceQuotasGetServiceQuotaRequest/Response, ServiceQuotasListServiceQuotasRequest/Response                   | ✓      |

### GCP Schema Gaps (vs SDK Docs / Context7)

| Resource                               | Missing Fields                                                                         | Notes                                                                                             |
| -------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **GcsBlobInfo**                        | generation, metageneration, storage_class, crc32c, md5_hash                            | GCS API returns these; schema has name, size, content_type, etag, updated                         |
| **QueryJobResult**                     | schema.fields (full TableSchema), jobReference, rows, totalBytesProcessed, jobComplete | BigQuery query response has many fields; schema is simplified                                     |
| **TableInfo**                          | tableReference, schema, timePartitioning, creationTime                                 | BigQuery Table resource is large; schema is simplified                                            |
| **ComputeInstance**                    | disks, networkInterfaces, labels, metadata                                             | Full Instance has 50+ fields; schema has id, name, zone, machine_type, status, creation_timestamp |
| **CloudRunService / CloudRunRevision** | template, scaling, traffic                                                             | Full Service/Revision resources are large; schema has core identity fields                        |

### AWS Schema Gaps (vs boto3 Docs / Context7)

| Resource                | Missing Fields                                                                     | Notes                                                            |
| ----------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **EC2Instance**         | BlockDeviceMappings, NetworkInterfaces, IamInstanceProfile, ElasticGpuAssociations | describe_instances returns 40+ fields; schema has core fields    |
| **S3GetObjectResponse** | Body (StreamingBody)                                                               | Body is object \| None — not modeled (streaming)                 |
| **S3ObjectSummary**     | ChecksumAlgorithm, RestoreStatus                                                   | list_objects_v2 Contents may include these                       |
| **GlueTable**           | Owner, TableType, Parameters, ViewDefinition                                       | get_table returns full Table; schema has core fields             |
| **ECSTask**             | containers, attachments, connectivity                                              | run_task/describe_tasks return full Task; schema has core fields |

### Quota Schemas (Monitoring)

| SDK           | unified-api-contracts Schema                             | Purpose                                                 |
| ------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| GCP Compute   | GcpComputeQuotaUsage                                     | instances_count, cpus_used, memory_mb_used, disks_count |
| GCP Cloud Run | GcpCloudRunQuotaUsage                                    | services_count, revisions_count, concurrent_requests    |
| GCP GCS       | GcsQuotaUsage                                            | buckets_count, objects_count, storage_bytes             |
| GCP BigQuery  | BqQuotaUsage                                             | datasets_count, tables_count, query_bytes_processed     |
| AWS           | EC2QuotaInfo, ECSQuotaInfo, LambdaQuotaInfo, S3QuotaInfo | Via Service Quotas API                                  |

### Recommended Version Pins (Cloud SDKs)

| Package               | Recommended Pin    | Rationale                                                    |
| --------------------- | ------------------ | ------------------------------------------------------------ |
| google-cloud-compute  | `>=1.0.0,<2.0.0`   | Align with deployment-service                                |
| google-cloud-run      | `>=0.15.0,<1.0.0`  | Align with deployment-service                                |
| google-cloud-storage  | `>=3.8.0,<4.0.0`   | Align with unified-trading-services, unified-cloud-interface |
| google-cloud-bigquery | `>=3.40.0,<4.0.0`  | Align with unified-trading-services                          |
| boto3                 | `>=1.40.70,<2.0.0` | Python 3.13 support; align with unified-cloud-interface      |
| botocore              | `>=1.34.0,<2.0.0`  | Matches boto3; Python 3.9+ (3.8 EOL Apr 2025)                |
