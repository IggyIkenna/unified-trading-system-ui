# Unified API Contracts — Schema Normalization Gaps Audit

**Date:** 2026-03-05
**Type:** Specification / Audit
**Scope:** Exact schemas skipped, live vs batch alignment, remediation recommendations

**Audit grade:** Citadel-grade. Every data type from every provider must be accounted for. No half-baked coverage. Strict: (1) Is there any data a provider offers that we don't have in raw? (2) Is there any raw schema not planned to be normalized? Both must be NO.

**Success criteria:** **0 orphaned schemas.** Every external schema must have a normalization path to a canonical type.

---

## 1. Executive Summary

**Principle:** All external schemas should be normalized. Batch and live modes must produce the same canonical output (batch-live symmetry). Raw venue responses must never flow to services; interfaces return normalized data only.

**Current state (BAD):**

- ~60 external providers; ~10 CeFi providers have partial normalization (trades, orderbooks, orders, tickers).
- **~50 providers have external schemas with no normalizer path (orphaned). This is unacceptable.**
- **Order/Fill normalization exists for binance, bybit, ccxt, deribit, okx only.** coinbase, upbit, kalshi, polymarket, hyperliquid, nautilus lack order/fill normalizers. **This is a critical gap.**
- Batch is **cloud historical** (GCS, BigQuery, or other object/SQL storage) — not necessarily GCS. Live is WebSocket/REST streaming.
- Live vs batch schema alignment is implicit where normalizers exist; no explicit audit of batch vs live schema parity.
- **Scope is incomplete:** Audit currently focuses on trades, orderbook, ticker, order, fill. Missing: **fees**, **reference data** (instruments, symbols, exchange info), **error normalization** (venue errors → expanded taxonomy: rate limit, network, insufficient balance/margin, price bound, internal server, schema/inverted), **FIX/IBKR canonical fill** (FixExecutionReport, IBKRExecution → CanonicalFill), **liquidations** (market + own → CanonicalLiquidation), **derivative ticker** (→ CanonicalDerivativeTicker), **options chain** (→ CanonicalOptionsChainEntry), and **Databento full coverage** (MBO, BBO-1s, BBO-1m, Cmbp1, OptionQuote, CMEOptionQuote — only Mbp1, Mbp10, Tbbo are normalized today).

**Reference:** [SCHEMA_NORMALIZATION_AUDIT_FULL.md](./SCHEMA_NORMALIZATION_AUDIT_FULL.md), `.cursor/rules/core/batch-live-symmetry.mdc`, CODEX: `04-architecture/batch-live-symmetry.md`

---

## 2. Exact Schemas Skipped — Per Provider

Tables list external schema classes, file path, canonical target, normalizer exists (yes/no), and priority (P0=critical trading path, P1=active venue, P2=planned, P3=low).

### 2.1 CeFi — Trading Domain

| Provider    | External Schema                                         | File Path                 | Canonical Target              | Normalizer | Priority             |
| ----------- | ------------------------------------------------------- | ------------------------- | ----------------------------- | ---------- | -------------------- |
| binance     | BinanceTrade                                            | binance/                  | CanonicalTrade                | yes        | —                    |
| binance     | BinanceOrderBook                                        | binance/market_schemas.py | CanonicalOrderBook            | yes        | —                    |
| binance     | BinanceTicker                                           | binance/market_schemas.py | CanonicalTicker               | yes        | —                    |
| binance     | BinanceOrder                                            | binance/                  | CanonicalOrder                | yes        | —                    |
| binance     | BinanceMyTrades                                         | binance/                  | CanonicalFill                 | yes        | —                    |
| bybit       | BybitTrade, OrderBook, Ticker, Order, ExecutionWS       | bybit/schemas.py          | Canonical\*                   | yes        | —                    |
| okx         | OKXTrade, OrderBook, Ticker, Order                      | okx/schemas.py            | Canonical\*                   | yes        | —                    |
| coinbase    | CoinbaseTrade, OrderBook, Ticker                        | coinbase/schemas.py       | Canonical\*                   | yes        | —                    |
| coinbase    | CoinbaseOrder, CoinbaseFill                             | coinbase/schemas.py       | CanonicalOrder, CanonicalFill | no         | P1                   |
| ccxt        | CcxtTrade, Order, OrderBook, Ticker                     | ccxt/schemas.py           | Canonical\*                   | yes        | —                    |
| deribit     | DeribitTrade, OrderBook, Ticker, Order                  | deribit/schemas.py        | Canonical\*                   | yes        | —                    |
| upbit       | UpbitTrade, OrderBook, Ticker                           | upbit/schemas.py          | Canonical\*                   | yes        | —                    |
| upbit       | UpbitOrder                                              | upbit/schemas.py          | CanonicalOrder                | no         | P1                   |
| databento   | DatabentoTrade, Mbp1, Mbp10, Tbbo                       | databento/schemas.py      | Canonical\*                   | yes        | —                    |
| databento   | DatabentoOhlcvBar                                       | databento/schemas.py      | CanonicalOhlcvBar             | partial    | P1                   |
| tardis      | TardisTrade, TardisOrderBook                            | tardis/schemas.py         | Canonical\*                   | yes        | —                    |
| aster       | AsterTrade, AsterOrderBook, AsterOrder, AsterTicker24hr | aster/schemas.py          | Canonical\*                   | no         | P1                   |
| hyperliquid | HyperliquidOrder, HyperliquidFill, HyperliquidTicker    | hyperliquid/schemas.py    | Canonical\*                   | no         | P1                   |
| bloxroute   | (schemas)                                               | bloxroute/schemas.py      | CanonicalTrade, etc.          | no         | P2                   |
| thegraph    | (schemas)                                               | thegraph/schemas.py       | —                             | no         | P2                   |
| alchemy     | AlchemyTransaction, etc.                                | alchemy/schemas.py        | —                             | no         | P2                   |
| nautilus    | Order, Fill                                             | nautilus/schemas.py       | CanonicalOrder, CanonicalFill | no         | P2 (engine-internal) |

### 2.2 TradFi

**Gap:** FIX and IBKR have execution/fill schemas but no CanonicalFill normalizers. FixExecutionReport and IBKRExecution must normalize to CanonicalFill for batch-live symmetry.

**TradFi parity:** Try to get as much of what we have for CeFi as possible (trades, orderbook, ticker, order, fill, liquidations, derivative ticker, options chain, errors). Some won't be possible, but a lot will be.

**Databento is a TradFi provider:** CME, futures, options, FX futures, commodities. Add Databento to TradFi scope — not just CeFi. Databento schemas (Mbp1, Mbp10, Tbbo, OptionQuote, CMEOptionQuote, etc.) apply to TradFi instruments.

| Provider     | External Schema                                                | File Path               | Canonical Target                  | Normalizer | Priority |
| ------------ | -------------------------------------------------------------- | ----------------------- | --------------------------------- | ---------- | -------- |
| ibkr         | IBKRTicker, IBKROrder                                          | ibkr/schemas.py         | CanonicalTicker, CanonicalOrder   | no         | P1       |
| ibkr         | IBKRExecution                                                  | ibkr/schemas.py         | CanonicalFill                     | no         | P1       |
| fix          | FixNewOrderSingle, FixOrderCancelRequest, FixOrderCancelReject | fix/schemas.py          | CanonicalOrder (request/response) | no         | P2       |
| fix          | FixExecutionReport                                             | fix/schemas.py          | CanonicalFill                     | no         | P1       |
| prime_broker | PrimeBrokerFill                                                | prime_broker/schemas.py | CanonicalFill                     | no         | P2       |
| versifi      | (not yet added — ref: docs/reference/versifi/)                 | —                       | CanonicalOrder, CanonicalFill     | no         | P2       |

**VersiFi — Error handling (partial mapping possible):**

- **What we have:** HTTP status codes 400, 401, 404, 409, 500 with labels. **At least network/server errors (500) can be mapped** to RETRY_WITH_BACKOFF. Add partial VENUE_ERROR_MAP entry for VersiFi using status codes.
- **What we lack:** Error response body schema, vendor error codes beyond HTTP status, retry guidance, rate limits, WebSocket errors.
- **Reverse-engineer approach:** No auth should not block us. Use **Context7** to reverse-engineer what the docs say as a first pass. VCR tests in interfaces verify things and attach to versions — that's when we need auth. For now: reverse-engineer from docs.
- **Next steps:** (1) Add partial VersiFi entry to VENUE_ERROR_MAP (500→RETRY, 401→FAIL, etc.); (2) Use Context7 to extract error patterns from docs; (3) VCR tests in interfaces for full verification when auth available.

### 2.3 Prediction / Betting Markets (Sports)

**Sports:** We will get less detail on market and order feed than CeFi, but map as much as we can. CanonicalOdds, BetOrder, CanonicalFixture where applicable.

**Batch vs live for sports — the ONLY exception to "normalize directly from source":**

- **Public odds (market data):**
  - **Batch (historical):** Odds API (aggregator) — we do NOT scrape providers for historical; we use Odds API.
  - **Live:** We scrape providers directly (or use OddsStream, Odds Engine, MetaBet, SharpAPI for fast feeds). NOT from Odds API for live.
  - Both batch and live must produce same CanonicalOdds output.
- **Orders and positions:** ALWAYS from scraping (or API where available). Never from Odds API. Odds API is aggregator for public odds only; it does not provide orders/positions. Orders and positions come directly from each bookmaker (API: Pinnacle, Betfair, Matchbook, Smarkets, Betdaq; Scraping: Bovada, BetOnline, etc.).

**Sports providers (from archive/sports-betting-service + UAC + arb use):**

| Provider      | In UAC | In archive/sports-betting-service | API | Orders path        | Normalizer |
| ------------- | ------ | --------------------------------- | --- | ------------------ | ---------- |
| pinnacle      | yes    | yes                               | yes | API                | Adapters   |
| betfair       | yes    | yes                               | yes | API                | Adapters   |
| betfair_ex_uk | no     | yes                               | yes | API                | no         |
| matchbook     | yes    | yes                               | yes | API                | Adapters   |
| smarkets      | yes    | yes                               | yes | API                | Adapters   |
| betdaq        | yes    | yes                               | yes | API                | no         |
| betonlineag   | no     | yes                               | no  | Scraping           | no         |
| lowvig        | no     | yes                               | no  | Scraping           | no         |
| onexbet       | no     | yes                               | no  | Scraping           | no         |
| marathonbet   | no     | yes                               | no  | Scraping           | no         |
| bovada        | no     | yes                               | no  | Scraping           | no         |
| virginbet     | no     | yes                               | no  | Scraping           | no         |
| betsson       | no     | yes                               | no  | Scraping           | no         |
| unibet        | no     | yes                               | no  | Scraping           | no         |
| unibet_uk     | no     | yes                               | no  | Scraping           | no         |
| livescorebet  | no     | yes                               | no  | Scraping           | no         |
| skybet        | no     | yes                               | no  | Scraping           | no         |
| paddypower    | no     | yes                               | no  | Scraping           | no         |
| betway        | no     | yes                               | no  | Scraping           | no         |
| coral         | no     | yes                               | no  | Scraping           | no         |
| boylesports   | no     | yes                               | no  | Scraping           | no         |
| leovegas      | no     | yes                               | no  | Scraping           | no         |
| casumo        | no     | yes                               | no  | Scraping           | no         |
| williamhill   | no     | yes                               | no  | Scraping           | no         |
| betvictor     | no     | yes                               | no  | Scraping           | no         |
| betus         | no     | yes                               | no  | Scraping           | no         |
| gtbets        | no     | yes                               | no  | Scraping           | no         |
| mybookieag    | no     | yes                               | no  | Scraping           | no         |
| tab           | no     | yes                               | no  | Scraping (AU only) | no         |
| kalshi        | yes    | —                                 | yes | API                | no         |
| polymarket    | yes    | —                                 | yes | API                | no         |
| manifold      | yes    | —                                 | yes | API                | no         |
| predictit     | yes    | —                                 | yes | API                | no         |
| odds_api      | yes    | yes (used)                        | yes | — (aggregator)     | Adapters   |
| odds_engine   | yes    | —                                 | yes | — (aggregator)     | Adapters   |
| metabet       | yes    | —                                 | yes | — (aggregator)     | Adapters   |
| sharpapi      | yes    | —                                 | yes | — (aggregator)     | Adapters   |

**Many sports brokers from sports-betting-service are missing from UAC.** Add external schemas for betonlineag, lowvig, onexbet, marathonbet, bovada, virginbet, betsson, unibet, unibet_uk, livescorebet, skybet, paddypower, betway, coral, boylesports, leovegas, casumo, williamhill, betvictor, betus, gtbets, mybookieag, tab — then normalize.

| Provider   | External Schema                                                       | File Path             | Canonical Target        | Normalizer | Priority |
| ---------- | --------------------------------------------------------------------- | --------------------- | ----------------------- | ---------- | -------- |
| kalshi     | KalshiTrade, KalshiOrder, KalshiOrderBook, KalshiFill                 | kalshi/schemas.py     | Canonical\*             | no         | P1       |
| polymarket | PolymarketTrade, PolymarketOrder, PolymarketOrderBook, PolymarketFill | polymarket/schemas.py | Canonical\*             | no         | P1       |
| manifold   | ManifoldTrade                                                         | manifold/schemas.py   | CanonicalTrade          | no         | P2       |
| predictit  | (schemas)                                                             | predictit/schemas.py  | —                       | no         | P2       |
| matchbook  | (schemas)                                                             | matchbook/schemas.py  | BetOrder, CanonicalOdds | Adapters   | —        |
| betfair    | BetfairCurrentOrderSummary, BetfairOrderUpdate                        | betfair/schemas.py    | BetOrder                | Adapters   | —        |
| betdaq     | (schemas)                                                             | betdaq/schemas.py     | —                       | no         | P2       |
| smarkets   | SmarketsOrderBook                                                     | smarkets/schemas.py   | —                       | no         | P2       |
| pinnacle   | (schemas)                                                             | pinnacle/schemas.py   | —                       | no         | P2       |

### 2.4 Fees

| Provider | External Schema         | File Path                  | Canonical Target                       | Normalizer | Priority |
| -------- | ----------------------- | -------------------------- | -------------------------------------- | ---------- | -------- |
| binance  | BinanceFeeRate          | binance/account_schemas.py | CanonicalFee (or extend CanonicalFill) | no         | P1       |
| ccxt     | CcxtFee, CcxtTradingFee | ccxt/schemas.py            | CanonicalFee                           | no         | P1       |
| bybit    | BybitFeeRate            | bybit/schemas.py           | CanonicalFee                           | no         | P1       |
| okx      | OKXFeeRate              | okx/schemas.py             | CanonicalFee                           | no         | P1       |
| deribit  | (fee in fills)          | deribit/schemas.py         | CanonicalFill.fee                      | partial    | P1       |

**Gap:** No CanonicalFee or fee normalization. Venue-specific fee schemas (BinanceFeeRate, CcxtFee, etc.) should normalize to a canonical fee type.

### 2.5 Reference Data

| Provider  | External Schema                                           | File Path                 | Canonical Target                      | Normalizer | Priority |
| --------- | --------------------------------------------------------- | ------------------------- | ------------------------------------- | ---------- | -------- |
| binance   | BinanceSymbol, BinanceExchangeInfo, BinanceInstrumentInfo | binance/market_schemas.py | CanonicalMarketInfo, InstrumentRecord | no         | P1       |
| bybit     | BybitMarket, BybitInstrumentInfo                          | bybit/schemas.py          | CanonicalMarketInfo                   | no         | P1       |
| okx       | OKXMarket, OKXInstrumentInfo                              | okx/schemas.py            | CanonicalMarketInfo                   | no         | P1       |
| ccxt      | CcxtMarket, CcxtCurrency                                  | ccxt/schemas.py           | CanonicalMarketInfo                   | no         | P1       |
| deribit   | DeribitInstrument, DeribitInstrumentInfoFull              | deribit/schemas.py        | CanonicalMarketInfo                   | no         | P1       |
| databento | DatabentoSymbol, DatabentoDefinition                      | databento/schemas.py      | InstrumentRecord                      | no         | P1       |
| ibkr      | IBKRContractDetails                                       | ibkr/schemas.py           | InstrumentRecord                      | no         | P1       |

**Gap:** No normalization for instruments, symbols, exchange info. CanonicalMarketInfo and InstrumentRecord exist in UAC but no normalizers from venue-specific schemas.

### 2.6 Error Normalization

See §2.17 for full error taxonomy (CanonicalRateLimitError, CanonicalNetworkError, CanonicalInsufficientBalanceError, CanonicalInsufficientMarginError, CanonicalPriceBoundError, CanonicalInternalServerError, CanonicalSchemaError, CanonicalError).

| Provider | External Schema                | File Path                | Canonical Target                | Normalizer | Priority |
| -------- | ------------------------------ | ------------------------ | ------------------------------- | ---------- | -------- |
| binance  | BinanceError                   | binance/order_schemas.py | Canonical\* (expanded taxonomy) | no         | P1       |
| ccxt     | CcxtErrorPayload               | ccxt/schemas.py          | Canonical\*                     | no         | P1       |
| okx      | OKXError                       | okx/schemas.py           | Canonical\*                     | no         | P1       |
| bybit    | BybitError                     | bybit/schemas.py         | Canonical\*                     | no         | P1       |
| deribit  | DeribitError                   | deribit/schemas.py       | Canonical\*                     | no         | P1       |
| (all)    | Venue-specific error responses | various                  | Canonical\* (expanded taxonomy) | no         | P1       |

**Gap:** CanonicalError and CanonicalRateLimitError exist; expanded taxonomy (network, balance, margin, price bound, internal, schema) to add. **Zero** `normalize_*_error` functions. Venue errors should normalize for consistent handling downstream.

### 2.7 Data / Alt

| Provider     | External Schema                     | File Path               | Canonical Target                | Normalizer | Priority |
| ------------ | ----------------------------------- | ----------------------- | ------------------------------- | ---------- | -------- |
| api_football | ApiFootballFixture, Odds, etc.      | api_football/schemas.py | CanonicalFixture, CanonicalOdds | Adapters   | —        |
| footystats   | (schemas)                           | footystats/schemas.py   | —                               | no         | P2       |
| understat    | (schemas)                           | understat/schemas.py    | —                               | no         | P2       |
| barchart     | BarchartOhlcv15m                    | barchart/schemas.py     | CanonicalOhlcvBar               | no         | P2       |
| fred         | (schemas)                           | fred/schemas.py         | —                               | no         | P3       |
| glassnode    | (schemas)                           | glassnode/schemas.py    | —                               | no         | P3       |
| open_meteo   | (schemas)                           | open_meteo/schemas.py   | —                               | no         | P3       |
| coingecko    | (schemas)                           | coingecko/schemas.py    | —                               | no         | P3       |
| arkham       | ArkhamEntity, TokenFlow, etc.       | arkham/schemas.py       | —                               | no         | P3       |
| pyth         | (schemas)                           | pyth/schemas.py         | —                               | no         | P2       |
| openbb       | (schemas)                           | openbb/schemas.py       | —                               | no         | P3       |
| defillama    | (schemas)                           | defillama/schemas.py    | —                               | no         | P2       |
| regulatory   | MifidIITradeReport, EmirTradeReport | regulatory/schemas.py   | —                               | no         | P2       |

### 2.8 Liquidations (Market vs Own — Two Distinct Feeds)

**CanonicalLiquidation** exists. Two distinct feeds, often different endpoints:

| Feed                    | Scope                                      | Endpoint type                     | Venue coverage                                                                            |
| ----------------------- | ------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------- |
| **Market liquidations** | Public feed of all liquidations on venue   | Public WebSocket/REST             | Some venues offer (Binance, Bybit, OKX, Deribit, Tardis, Coinglass); others do not        |
| **Own liquidations**    | User's own position liquidations (private) | Private/account WebSocket or REST | **All venues** that support leveraged/margin trading must provide this for our own trades |

**Critical:** Own liquidations are required for risk and PnL. Market liquidations are optional (analytics, heatmaps). Document per-venue which feed(s) exist and which endpoint(s) to use. Both normalize to CanonicalLiquidation.

| Provider    | External Schema                              | File Path              | Canonical Target                           | Normalizer | Priority |
| ----------- | -------------------------------------------- | ---------------------- | ------------------------------------------ | ---------- | -------- |
| binance     | BinanceLiquidationOrder                      | binance/ws_schemas.py  | CanonicalLiquidation                       | no         | P1       |
| bybit       | BybitLiquidationOrder                        | bybit/schemas.py       | CanonicalLiquidation                       | no         | P1       |
| okx         | OKXLiquidationOrder                          | okx/schemas.py         | CanonicalLiquidation                       | no         | P1       |
| deribit     | DeribitLiquidationOrder                      | deribit/schemas.py     | CanonicalLiquidation                       | no         | P1       |
| aster       | AsterLiquidationOrder                        | aster/schemas.py       | CanonicalLiquidation                       | no         | P1       |
| ccxt        | CcxtLiquidation                              | ccxt/schemas.py        | CanonicalLiquidation                       | no         | P1       |
| hyperliquid | HyperliquidLiquidation                       | hyperliquid/schemas.py | CanonicalLiquidation                       | no         | P1       |
| tardis      | TardisLiquidations                           | tardis/schemas.py      | CanonicalLiquidation                       | no         | P1       |
| coinglass   | LiquidationLevel, LiquidationHeatmapResponse | coinglass/schemas.py   | CanonicalLiquidation (or heatmap-specific) | no         | P2       |

**Gap:** Zero liquidation normalizers. All raw liquidation schemas are orphaned.

### 2.9 Ticker vs Derivative Ticker (Distinct Types)

**CanonicalTicker** vs **CanonicalDerivativeTicker** are distinct. Check Tardis.dev docs: derivative ticker may be a separate concept (perps/futures: funding, OI, mark). Spot/non-derivatives may not have a "derivative ticker" at all; they use CanonicalTicker. Document per-provider which applies.

**CanonicalDerivativeTicker** exists (perps/futures: funding, OI, mark). Raw schemas map to it.

| Provider    | External Schema                                               | File Path                 | Canonical Target                                   | Normalizer | Priority |
| ----------- | ------------------------------------------------------------- | ------------------------- | -------------------------------------------------- | ---------- | -------- |
| tardis      | TardisDerivativeTicker                                        | tardis/schemas.py         | CanonicalDerivativeTicker                          | no         | P1       |
| binance     | BinanceOptionTicker                                           | binance/market_schemas.py | CanonicalDerivativeTicker                          | no         | P1       |
| deribit     | DeribitTickerFull (perp)                                      | deribit/schemas.py        | CanonicalDerivativeTicker                          | no         | P1       |
| bybit       | BybitMarkPriceKline, IndexPriceKline                          | bybit/schemas.py          | CanonicalDerivativeTicker                          | no         | P1       |
| okx         | OKXMarkPrice, OKXOptionTicker                                 | okx/schemas.py            | CanonicalDerivativeTicker                          | no         | P1       |
| hyperliquid | funding_rate, open_interest, mark_price (no dedicated ticker) | hyperliquid/schemas.py    | CanonicalDerivativeTicker (proxy: map what we can) | no         | P1       |

**Proxy mapping when provider lacks full derivative ticker:** Where a provider does not have a specifically named "derivative ticker" but has funding rates, open interest, mark price, etc. (e.g. Hyperliquid), grab what we can and map to CanonicalDerivativeTicker. Fields that don't exist in that provider become **optional** (None). Example: Hyperliquid has funding_rate, open_interest, mark_price → populate those; leave predicted_funding_rate, borrow_long_rate, etc. as None.

**Optional fields (provider-dependent):** CanonicalDerivativeTicker already has most fields optional (mark_price, index_price, funding_rate, open_interest, etc.). Document per-provider which fields are populated vs always None. Required: instrument_key, venue, timestamp. All others optional.

### 2.10 Options Chain

**CanonicalOptionsChainEntry** (UIC). Raw equivalents vary by provider — the normalized name is CanonicalOptionsChainEntry; find per-provider raw schemas for trading options, futures, etc.

| Provider  | Raw equivalent                                                                        | Notes                                                                                      |
| --------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| tardis    | TardisOptionsChain                                                                    | Explicit options chain                                                                     |
| deribit   | DeribitMarkPriceOption, DeribitOptionsGreeks, DeribitTickerFull (options), order book | Live: may use markprice.options channel, REST order book; not always named "options chain" |
| databento | DatabentoOptionQuote, DatabentoCMEOptionQuote                                         | CME options                                                                                |
| yahoo     | YahooOptionsChain                                                                     |                                                                                            |
| ibkr      | IBKROptionGreeks, etc.                                                                |                                                                                            |

| Provider  | External Schema                                                           | File Path                | Canonical Target           | Normalizer | Priority |
| --------- | ------------------------------------------------------------------------- | ------------------------ | -------------------------- | ---------- | -------- |
| tardis    | TardisOptionsChain                                                        | tardis/schemas.py        | CanonicalOptionsChainEntry | no         | P1       |
| deribit   | DeribitMarkPriceOption, DeribitOptionsGreeks, DeribitTickerFull (options) | deribit/schemas.py       | CanonicalOptionsChainEntry | no         | P1       |
| databento | DatabentoOptionQuote                                                      | databento/schemas.py     | CanonicalOptionQuote       | no         | P1       |
| databento | DatabentoCMEOptionQuote                                                   | databento/schemas.py     | CanonicalOptionQuote       | no         | P1       |
| yahoo     | YahooOptionsChain                                                         | yahoo_finance/schemas.py | CanonicalOptionsChainEntry | no         | P2       |
| ibkr      | IBKROptionGreeks, etc.                                                    | ibkr/schemas.py          | CanonicalOptionsChainEntry | no         | P1       |

**Gap:** No options chain normalization. UIC has CanonicalOptionsChainEntry; UAC needs normalizers.

### 2.11 Databento Full Coverage

**Currently normalized:** Mbp1, Mbp10, Tbbo (all → CanonicalOrderBook), DatabentoTrade (→ CanonicalTrade).

- **TBBO (Trade-by-Best-Bid-Offer):** DatabentoTbbo → `normalize_databento_tbbo_orderbook` → CanonicalOrderBook. ✓ Included.
- **MBP-10 (Market-by-Price 10-level):** DatabentoMbp10 → `normalize_databento_mbp10_orderbook` → CanonicalOrderBook. ✓ Included.
- **MBP-1 (BBO):** DatabentoMbp1 → `normalize_databento_mbp1_orderbook` → CanonicalOrderBook. ✓ Included.

**Gap — Databento schemas with NO normalizer:**

| Schema                  | Type             | Canonical Target                     | Normalizer | Priority |
| ----------------------- | ---------------- | ------------------------------------ | ---------- | -------- |
| DatabentoMbo            | orderbook        | CanonicalOrderBook (or MBO-specific) | no         | P1       |
| DatabentoBbo1s          | BBO 1s           | CanonicalOrderBook                   | no         | P1       |
| DatabentoBbo1m          | BBO 1m           | CanonicalOrderBook                   | no         | P1       |
| DatabentoCmbp1          | consolidated MBP | CanonicalOrderBook                   | no         | P1       |
| DatabentoOhlcvBar       | OHLCV            | CanonicalOhlcvBar                    | partial    | P1       |
| DatabentoOptionQuote    | option quote     | CanonicalOptionQuote                 | no         | P1       |
| DatabentoCMEOptionQuote | CME option       | CanonicalOptionQuote                 | no         | P1       |
| DatabentoStatus         | status           | (define canonical)                   | no         | P2       |
| DatabentoImbalance      | imbalance        | (define canonical)                   | no         | P2       |
| DatabentoStatistics     | statistics       | (define canonical)                   | no         | P2       |
| DatabentoSymbol         | reference        | InstrumentRecord                     | no         | P1       |
| DatabentoDefinition     | reference        | InstrumentRecord                     | no         | P1       |

**TBBO and MBP-10:** Already normalized (DatabentoTbbo → CanonicalOrderBook, DatabentoMbp10 → CanonicalOrderBook). ✓

### 2.12 Bonds, CDS, Fixed Income

**Canonical types (UIC):** CanonicalBondData, CanonicalYieldCurve, YieldCurveTenor.

**Raw schemas (UAC):** EcbYieldCurveObservation, EcbDataflowObservation, FredObservation, OpenBBTreasuryPrice, IBKRBondMarketData, OfrCdsSpreadIndex, OfrCdsResponse.

**Cheap/free sources:** OFR (CDS indices, free), ECB (yield curves, CDS, free), FRED (US Treasury, free with API key), OpenBB (Treasury, API key). **Corporate bonds:** IBKR (broker), OSAP TRACE (free, academic). No free institutional-grade corporate bond-level data; OFR+ECB+FRED for research/analytics.

| Provider | Schema                                          | Canonical Target                    | Normalizer | Priority |
| -------- | ----------------------------------------------- | ----------------------------------- | ---------- | -------- |
| ofr      | OfrCdsSpreadIndex, OfrCdsResponse               | CanonicalYieldCurve or CDS-specific | no         | P1       |
| ecb      | EcbYieldCurveObservation, EcbDataflowResponse   | CanonicalYieldCurve                 | no         | P1       |
| fred     | FredObservation, FredSeriesObservationsResponse | CanonicalYieldCurve                 | no         | P1       |
| openbb   | OpenBBTreasuryPrice                             | CanonicalBondData                   | no         | P1       |
| ibkr     | IBKRBondMarketData                              | CanonicalBondData                   | no         | P1       |

**Gap:** No bond/CDS normalizers. CanonicalBondData and CanonicalYieldCurve exist in UIC; UAC needs normalizers.

### 2.13 FX Futures, Commodities, Derivatives

**FX futures:** We only trade FX futures (not spot). Databento CME Globex covers 6E, 6B, 6J, etc. Generic Databento schemas apply; no FX-futures-specific schema. Add symbol mappings.

**Commodities:** Databento CME (NYMEX, COMEX, CBOT) covers CL, NG, GC, ZC. DatabentoDefinition has unit_of_measure. No commodity-specific normalizers.

**Derivatives (futures, perpetuals, options, ETFs):** Databento, IBKR, CCXT, Tardis, Deribit, OKX, Bybit, Binance. See §2.9 (derivative ticker), §2.10 (options chain). ETFs: Yahoo Finance; no ETF-specific schema.

| Asset       | Coverage                          | Normalized?        |
| ----------- | --------------------------------- | ------------------ |
| FX futures  | Databento CME                     | Partial (generic)  |
| Commodities | Databento CME                     | Partial (generic)  |
| Futures     | Databento, IBKR, CCXT             | Partial            |
| Perpetuals  | Crypto venues                     | Partial            |
| Options     | Tardis, Databento, Deribit, Yahoo | No (options chain) |
| ETFs        | Yahoo                             | No                 |

### 2.14 Corporate Actions, Reference Data, Exchange Holidays

**Corporate actions:** IBKRCorporateAction (UAC). DividendRecord, StockSplitRecord, EarningsRecord in instruments-service only — not in UAC. CanonicalCorporateAction in unified-reference-data-interface. **Fees:** BinanceFeeRate, CcxtFee, etc. (see §2.4). **News, forecast results:** No schemas. **Timestamps:** Ad hoc; no shared convention.

**Reference data — exchange holidays, trading hours:** InstrumentRecord has trading_hours_open/close, holiday_calendar (string), regular_open_utc, etc. No ExchangeHoliday or TradingHours standalone schema. Instrument service grabs via reference data interface; schemas should be in API contracts.

| Schema                                           | Location                         | In UAC? | Normalized? |
| ------------------------------------------------ | -------------------------------- | ------- | ----------- |
| IBKRCorporateAction                              | UAC                              | yes     | no          |
| DividendRecord, StockSplitRecord, EarningsRecord | instruments-service              | no      | no          |
| CanonicalCorporateAction                         | unified-reference-data-interface | no      | —           |
| ExchangeHoliday, TradingHours                    | —                                | no      | no          |
| InstrumentRecord (trading hours)                 | UAC domain                       | yes     | —           |

**Gap:** Corporate action schemas not in UAC; exchange holidays/trading hours not structured; no normalizers.

### 2.15 Market State (Exchange Open/Closed/Halted)

**Canonical:** MarketState enum (NORMAL, HALTED, AUCTION, PRE_MARKET, POST_MARKET, CLOSED). ProcessedCandle has market_state. InstrumentRecord has trading hours but no market_state.

**Raw:** Kalshi status, Polymarket closed/status, CcxtMarket.active, Binance symbol status (TRADING, HALT, BREAK) — API only, no UAC schema. No normalizers. MarketState not exported from UAC **init**.py.

**Gap:** Exchange open/closed/halted per instrument is not normalized. No normalize_market_state.

### 2.16 Connectivity (Ping, Disconnect, Connect)

**Ping:** Bybit, OKX, Binance, Deribit, Coinbase, Versifi have explicit schemas. Generic WebSocketPingFrame, WebSocketPongFrame, HealthPingResponse in UAC. Aster, Hyperliquid, IBKR, Upbit lack explicit ping schemas.

**Disconnect:** All WebSocket venues have \*WebSocketClose. WebSocketConnectionClosed, WebSocketDisconnectEvent (UIC). Databento: DatabentoStatus, DatabentoSystemMsg, DatabentoErrorMsg.

**Connect:** WebSocketConnectionOpened, WebSocketConnectEvent (UIC). No provider-specific connect schemas.

**Batch vs live:** TRANSPORT_AND_ENDPOINTS.md describes transport; no per-endpoint connectivity table (ping/disconnect/connect) for every batch and live endpoint.

**Gap:** Connectivity schemas exist but are not normalized to canonical types. No single table documenting ping/disconnect/connect for every endpoint.

**Proxy schemas when provider lacks explicit support:** Where a provider does not have a defined ping (e.g. Databento, Tardis, Hyperliquid, Aster, Upbit, IBKR), we still have a normalized schema. Use a **proxy** to the same concept: e.g. heartbeat = ping, periodic keepalive = ping, or first successful message = implicit connect. Document per-provider which proxy is used. The canonical connectivity schema accepts these proxies.

### 2.17 Error Handling — Full Audit (Citadel-Grade)

**CRITICAL:** Every API error must be extracted and normalized. **Assume any provider may send malformed data.** We need more than CanonicalError and CanonicalRateLimitError.

**Canonical error taxonomy (extensive):**

**A. Request / client-side (our side — bad request format or parameters)**

| Canonical Type                     | Use Case                                                                    | Examples                                        |
| ---------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| CanonicalInvalidRequestFormatError | Malformed JSON, wrong content-type, wrong field types, invalid request body | 400 Bad Request (format), invalid JSON          |
| CanonicalMissingParameterError     | Required parameter missing                                                  | "symbol is required", "quantity required"       |
| CanonicalInvalidParameterError     | Invalid parameter value (negative qty, invalid enum, out-of-range)          | -1013 invalid lot size, invalid side            |
| CanonicalInstrumentNotFoundError   | Symbol/instrument does not exist on venue                                   | Binance -1121, "Unknown symbol", 404 instrument |
| CanonicalInvalidOrderTypeError     | Unsupported order type for this instrument                                  | LIMIT not allowed, invalid order type           |
| CanonicalInvalidSideError          | Not BUY/SELL or equivalent                                                  | Invalid side                                    |
| CanonicalAuthenticationError       | Bad API key, expired token, invalid signature                               | 401 Unauthorized, -2015 invalid API key         |
| CanonicalAuthorizationError        | No permission for this action                                               | 403 Forbidden, insufficient permissions         |

**B. Server-side (provider infrastructure)**

| Canonical Type                   | Use Case                            | Examples                              |
| -------------------------------- | ----------------------------------- | ------------------------------------- |
| CanonicalRateLimitError          | 429, X-RateLimit-\*, Retry-After    | Binance -1003, Bybit 10006, OKX 50011 |
| CanonicalInternalServerError     | 500, provider-side failure          | Coinbase INTERNAL_SERVICE_ERROR       |
| CanonicalServiceUnavailableError | 503, maintenance, overloaded        | 503 Service Unavailable               |
| CanonicalNetworkError            | Connection reset, timeout, DNS, TLS | Databento CONNECTION_RESET, IBKR 1100 |

**C. Business / trading (venue business rules)**

| Canonical Type                       | Use Case                                        | Examples                            |
| ------------------------------------ | ----------------------------------------------- | ----------------------------------- |
| CanonicalInsufficientBalanceError    | Not enough balance                              | OKX 51008, Deribit 11044            |
| CanonicalInsufficientMarginError     | Not enough margin                               | Hyperliquid INSUFFICIENT_MARGIN     |
| CanonicalPriceBoundError             | Price outside bounds, slippage, tick size       | Order rejected (price), -1013       |
| CanonicalOrderRejectedError          | Generic order rejection (venue-specific reason) | Order rejected, -2011 unknown order |
| CanonicalMarketClosedError           | Market not open for trading                     | Market closed, pre/post market      |
| CanonicalInstrumentHaltedError       | Instrument halted, suspended                    | TRADING_HALT, symbol suspended      |
| CanonicalDuplicateOrderError         | Duplicate order ID, idempotency conflict        | Duplicate clientOrderId, -2011      |
| CanonicalPositionLimitExceededError  | Max positions exceeded                          | Position limit                      |
| CanonicalSizeLimitError              | Order size too small or too large               | Min notional, max order size        |
| CanonicalInstrumentNotTradeableError | Instrument exists but not tradeable             | Not tradeable, delisted             |
| CanonicalContractExpiredError        | Futures/options contract expired                | Contract expired                    |
| CanonicalMaintenanceModeError        | Venue in maintenance                            | Maintenance, system upgrade         |

**D. Schema / response (provider sent wrong structure)**

| Canonical Type       | Use Case                                          | Examples                               |
| -------------------- | ------------------------------------------------- | -------------------------------------- |
| CanonicalSchemaError | Inverted schema, empty JSON, unexpected structure | Binance empty `{}`, malformed response |

**E. Fallback**

| Canonical Type | Use Case                     |
| -------------- | ---------------------------- |
| CanonicalError | Unclassified, unknown, other |

**Inverted schema / malformed responses:** Providers (e.g. Binance) sometimes return empty JSON `{}`, wrong schema, or unexpected structure. Normalize to CanonicalSchemaError with `message` describing the anomaly. Never assume schema is valid.

**Distinction:** CanonicalInvalidRequestFormatError = _we_ sent a bad request (malformed JSON, wrong params). CanonicalSchemaError = _they_ sent a bad response (empty `{}`, wrong structure). Both must be handled.

**Current state:** CanonicalError and CanonicalRateLimitError exist. **Zero** `normalize_*_error` functions. **50+** venue error schemas; **none** normalize.

| Provider                                                                                                                                                                                                  | Error Schema | Has classify() | Normalizes? |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------- | ----------- |
| binance, ccxt, okx, bybit, deribit, coinbase, upbit, ibkr, hyperliquid, aster, kalshi, polymarket, databento, tardis, alchemy, yahoo, thegraph, defillama, pinnacle, betfair, odds_api, api_football, ... | \*Error      | Most yes       | **NO**      |
| bloxroute, sharpapi, odds_engine, metabet, aws                                                                                                                                                            | \*Error      | No             | **NO**      |

**Gap:** Full error normalization is missing. Add normalize/errors.py with normalize\_<provider>\_error for every venue. Map venue errors to the expanded taxonomy. Batch and live must both normalize for consistent handling.

### 2.18 Rate Limit Handling — Full Gap Analysis

**See:** [RATE_LIMIT_HANDLING_GAPS.md](./RATE_LIMIT_HANDLING_GAPS.md) for detailed current state vs gaps.

**Summary:** VENUE_ERROR_MAP classifies ~15 venues' rate limit codes → RETRY. RateLimitResponse and HttpRateLimitHeaders exist but are **not used** on 429. No header extraction (Retry-After, X-RateLimit-\*), no normalization to CanonicalRateLimitError, no RATE_LIMIT_HIT event, no Retry-After-aware backoff. Kalshi, Polymarket, Pinnacle, Betfair, Odds API missing from VENUE_ERROR_MAP. WebSocket rate limit disconnects not normalized.

**Action:** Implement header extraction, CanonicalRateLimitError normalization, Retry-After-aware backoff, RATE_LIMIT_HIT event, full venue coverage, WS rate limit mapping. Per RATE_LIMIT_HANDLING_GAPS.md remediation order.

---

## 3. Live vs Batch Audit

Per batch-live-symmetry: data source differs (**cloud historical** vs WebSocket/REST), but the shared engine must receive the same canonical schema. **Batch** = cloud historical (GCS, BigQuery, or other object/SQL storage). **Live** = WebSocket/REST streaming. If batch and live use different raw schemas for the same provider/data-type, both must normalize to the same canonical type.

**After adding all normalizers, run a final live vs batch alignment pass** to ensure every provider/data-type pair produces identical canonical output regardless of source (historical vs live).

| Provider    | Data Type | Batch Schema (GCS source)    | Live Schema (stream source)                              | Aligned | Action if Not                                                       |
| ----------- | --------- | ---------------------------- | -------------------------------------------------------- | ------- | ------------------------------------------------------------------- |
| binance     | trades    | BinanceTrade (REST snapshot) | BinanceTrade (WS)                                        | yes     | —                                                                   |
| binance     | orderbook | BinanceOrderBook             | BinanceOrderBook                                         | yes     | —                                                                   |
| databento   | trades    | DatabentoTrade               | DatabentoTrade                                           | yes     | —                                                                   |
| tardis      | trades    | TardisTrade                  | TardisTrade                                              | yes     | —                                                                   |
| ccxt        | trades    | CcxtTrade                    | CcxtTrade                                                | yes     | —                                                                   |
| okx         | trades    | OKXTrade                     | OKXTrade (REST/WS)                                       | yes     | —                                                                   |
| bybit       | trades    | BybitTrade                   | BybitExecutionWS (fills)                                 | partial | Use BybitExecutionWS for live fills; ensure trade stream normalizes |
| bybit       | orderbook | BybitOrderBook               | BybitOrderBook (WS)                                      | yes     | —                                                                   |
| coinbase    | trades    | CoinbaseTrade                | CoinbaseTrade                                            | yes     | —                                                                   |
| deribit     | trades    | DeribitTrade                 | DeribitTrade                                             | yes     | —                                                                   |
| upbit       | trades    | UpbitTrade                   | UpbitTrade                                               | yes     | —                                                                   |
| kalshi      | trades    | KalshiTrade                  | KalshiWebSocketTradeMsg                                  | no      | Add normalizers for both → CanonicalTrade                           |
| kalshi      | orderbook | KalshiOrderBook              | KalshiWebSocketOrderbookDeltaMsg                         | no      | Add normalizers; delta may need incremental merge                   |
| polymarket  | trades    | PolymarketTrade              | (stream)                                                 | no      | Add PolymarketTrade → CanonicalTrade                                |
| hyperliquid | orders    | —                            | HyperliquidOpenOrder                                     | no      | Add HyperliquidOrder → CanonicalOrder                               |
| hyperliquid | fills     | —                            | HyperliquidFill                                          | no      | Add HyperliquidFill → CanonicalFill                                 |
| ibkr        | ticker    | —                            | IBKRTicker                                               | no      | Add IBKRTicker → CanonicalTicker                                    |
| aster       | trades    | AsterTrade                   | AsterAggTrade (WS)                                       | no      | Add normalizers for both → CanonicalTrade                           |
| aster       | orderbook | AsterOrderBook               | AsterOrderBook                                           | no      | Add AsterOrderBook → CanonicalOrderBook                             |
| sports      | odds      | Odds API (historical)        | OddsStream / Odds Engine / MetaBet / SharpAPI (live)     | no      | Add normalizers for all; ensure same CanonicalOdds output           |
| sports      | orders    | —                            | API (Pinnacle, Betfair, etc.) or Scraping (Bovada, etc.) | no      | BetOrder normalizers; scraping output → same canonical as API       |

**Summary:** Providers with full normalizer coverage have batch-live alignment where the same raw schema is used. Gaps exist where (a) live uses a different schema (e.g. WebSocket-specific) than batch, or (b) no normalizer exists.

---

## 4. Completeness Audit (Citadel-Grade)

**Two strict questions. Both must be NO for audit pass.**

### 4.1 Is there any data a provider offers that we don't have in raw?

For each provider we integrate: every endpoint, every message type, every schema the provider exposes must have a corresponding raw schema in `external/<provider>/`. If a provider offers liquidations, we must have the raw schema. If they offer options chain, we must have it. **Gap = audit fail.** Action: add missing raw schemas.

### 4.2 Is there any raw schema not planned to be normalized?

Every class in `external/` must have a normalization path to a canonical type (or a documented reason: e.g. request-only schemas that don't flow to engine). **Orphan = audit fail.** Action: add normalizer or document exception.

### 4.3 Do we know every connection lifecycle for every endpoint?

For batch and live: **ping responses**, **connectivity dropouts**, **successful connect** — must be documented and normalized for every endpoint. Do we know what ping looks like per provider? What disconnect looks like? What connect looks like? **Gap = audit fail.** Action: add per-endpoint connectivity table; normalize to canonical lifecycle events.

### 4.4 Raw → Canonical Matrix (Strict)

| Canonical Type                                     | Raw Schemas (sample)                                       | All Normalized?                            |
| -------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------ |
| CanonicalTrade                                     | BinanceTrade, DatabentoTrade, TardisTrade, ...             | Partial                                    |
| CanonicalOrderBook                                 | BinanceOrderBook, DatabentoMbp1, Mbp10, Tbbo, ...          | Partial (Mbo, Bbo1s, Bbo1m, Cmbp1 missing) |
| CanonicalTicker                                    | BinanceTicker, ...                                         | Partial                                    |
| CanonicalDerivativeTicker                          | TardisDerivativeTicker, BinanceOptionTicker, ...           | **NO**                                     |
| CanonicalOrder                                     | BinanceOrder, ...                                          | Partial                                    |
| CanonicalFill                                      | BinanceMyTrades, FixExecutionReport, IBKRExecution, ...    | Partial                                    |
| CanonicalLiquidation                               | BinanceLiquidationOrder, TardisLiquidations, ...           | **NO**                                     |
| CanonicalOhlcvBar                                  | DatabentoOhlcvBar, CcxtOhlcv, ...                          | **NO**                                     |
| CanonicalPosition                                  | BinancePositionRisk, CcxtPosition, ...                     | **NO**                                     |
| CanonicalBalance                                   | CcxtBalance, ...                                           | **NO**                                     |
| CanonicalOptionsChainEntry                         | TardisOptionsChain, DatabentoOptionQuote, ...              | **NO**                                     |
| CanonicalInvalidRequestFormatError                 | 400 Bad Request (format)                                   | **NO**                                     |
| CanonicalMissingParameterError                     | Required param missing                                     | **NO**                                     |
| CanonicalInvalidParameterError                     | Invalid param value                                        | **NO**                                     |
| CanonicalInstrumentNotFoundError                   | Symbol/instrument not found                                | **NO**                                     |
| CanonicalAuthenticationError                       | 401, bad API key                                           | **NO**                                     |
| CanonicalAuthorizationError                        | 403, no permission                                         | **NO**                                     |
| CanonicalRateLimitError                            | 429, X-RateLimit-\*                                        | **NO**                                     |
| CanonicalInternalServerError                       | 500                                                        | **NO**                                     |
| CanonicalServiceUnavailableError                   | 503                                                        | **NO**                                     |
| CanonicalNetworkError                              | Connection reset, timeout, DNS                             | **NO**                                     |
| CanonicalInsufficientBalanceError                  | Not enough balance                                         | **NO**                                     |
| CanonicalInsufficientMarginError                   | Not enough margin                                          | **NO**                                     |
| CanonicalPriceBoundError                           | Price outside bounds                                       | **NO**                                     |
| CanonicalOrderRejectedError                        | Generic order rejection                                    | **NO**                                     |
| CanonicalMarketClosedError                         | Market closed                                              | **NO**                                     |
| CanonicalInstrumentHaltedError                     | Instrument halted                                          | **NO**                                     |
| CanonicalDuplicateOrderError                       | Duplicate order ID                                         | **NO**                                     |
| CanonicalSizeLimitError                            | Order size too small/large                                 | **NO**                                     |
| CanonicalInstrumentNotTradeableError               | Instrument not tradeable                                   | **NO**                                     |
| CanonicalSchemaError                               | Empty JSON, malformed, inverted schema                     | **NO**                                     |
| CanonicalError                                     | Fallback unclassified                                      | **NO**                                     |
| CanonicalFee                                       | BinanceFeeRate, CcxtFee, ...                               | **NO**                                     |
| CanonicalMarketInfo                                | BinanceSymbol, BybitMarket, ...                            | **NO**                                     |
| CanonicalBondData                                  | IBKRBondMarketData, OpenBBTreasuryPrice                    | **NO**                                     |
| CanonicalYieldCurve                                | EcbYieldCurveObservation, FredObservation, OfrCdsResponse  | **NO**                                     |
| CanonicalCorporateAction                           | IBKRCorporateAction, DividendRecord, ...                   | **NO**                                     |
| MarketState                                        | Kalshi status, CcxtMarket.active, Binance symbol status    | **NO**                                     |
| ExchangeHoliday / TradingHours                     | —                                                          | **NO** (no raw schema)                     |
| WebSocket lifecycle (ping/pong/disconnect/connect) | *WebSocketPing, *WebSocketClose, WebSocketConnectionOpened | Partial (not normalized)                   |

**Current state: 0 canonical types have full coverage. Audit FAIL.**

---

## 5. Recommendations

1. **Success criteria: 0 orphaned schemas.** Every external schema must have a normalization path. No exceptions.
2. **Normalize everything:** Add normalizers for all external schemas: trades, orders, orderbooks, tickers, fills, **fees**, **reference data** (instruments, exchange info), **errors** (→ full taxonomy §2.17: request format, missing param, invalid param, instrument not found, auth, authz, rate limit, server, network, balance, margin, price bound, order rejected, market closed, halted, duplicate, size limit, not tradeable, schema/malformed — **every API error, batch and live**; assume any provider may send malformed data), **liquidations** (market + own → CanonicalLiquidation), **derivative ticker** (→ CanonicalDerivativeTicker), **options chain** (→ CanonicalOptionsChainEntry), **Databento full** (Mbo, Bbo1s, Bbo1m, Cmbp1, OptionQuote, CMEOptionQuote, OhlcvBar), **bonds/CDS** (→ CanonicalBondData, CanonicalYieldCurve), **FX futures** (symbol mappings; Databento CME), **commodities** (Databento CME), **corporate actions** (→ CanonicalCorporateAction; move DividendRecord etc. to UAC), **market state** (→ MarketState; exchange open/closed/halted), **connectivity** (ping/pong/disconnect/connect → canonical lifecycle). Prioritize P1: coinbase (order/fill), upbit (order), kalshi, polymarket, hyperliquid, aster, ibkr, **FIX**, **IBKR**, **error normalization (all 50+ venues)**.
3. **Add normalizers for gaps:** Create `normalize_<provider>_<type>` for each orphaned schema in §2. Follow existing patterns. **Proxy schemas:** Where provider lacks explicit support (e.g. no ping), use proxy (heartbeat = ping). **Optional fields:** Populate only fields the provider offers; document per-provider which fields are None. in `canonical/normalize/` (trades.py, orderbooks.py, orders_fills.py, tickers.py). Add: **liquidations.py**, **derivative_tickers.py**, **options_chain.py**, **errors.py**, **fees.py**, **reference_data.py**.
4. **Sports providers:** Add external schemas for all bookmakers from archive/sports-betting-service (betonlineag, lowvig, onexbet, marathonbet, bovada, etc.) that are missing from UAC. **Public odds:** batch = Odds API (aggregator); live = scrape providers directly or use OddsStream/Odds Engine/MetaBet/SharpAPI (fast). **Orders and positions:** always from scraping (or API where available). Never from Odds API. Both batch and live must produce same canonical output.
5. **Error handling — full coverage:** Every API error (batch and live) must be extracted and normalized to the full taxonomy (§2.17): request format, missing/invalid params, instrument not found, auth/authz, rate limit, server/network, balance/margin, price bound, order rejected, market closed/halted, duplicate, size limit, not tradeable, schema/malformed. Add normalize/errors.py with normalize\_<provider>\_error for all 50+ venues. Handle inverted schema / empty JSON / malformed responses → CanonicalSchemaError. No exception.
6. **Connectivity — full documentation:** Document ping responses, connectivity dropouts, successful connect for every batch and live endpoint. Add per-endpoint connectivity table. Normalize to canonical WebSocket lifecycle events.
7. **Align live/batch schemas:** For each provider with both batch and live data paths, ensure same canonical output type. If live uses a different raw schema (e.g. KalshiWebSocketTradeMsg), add a dedicated normalizer that produces the same canonical output as the batch path. Document in adapter/service which raw schema is used per mode.
8. **Final live vs batch alignment pass:** After all normalizers are added, go through every provider/data-type and verify batch (cloud historical) and live (streaming) produce identical canonical output. No mode-specific schema handling in the engine.
9. **Batch-live symmetry enforcement:** Engine receives only canonical types. No `if mode == "batch"` branches that change schema handling. Data source adapter (batch: cloud reader; live: WebSocket handler) normalizes at the boundary before passing to engine.
10. **VersiFi (institutional broker):** Scraped API docs in [docs/reference/versifi/](./reference/versifi/). Extract request/response schemas for normalization to CanonicalOrder, CanonicalFill. Re-scrape: `python scripts/scrape_versifi_docs.py`.
11. **Reference documents:**

- [SCHEMA_NORMALIZATION_AUDIT_FULL.md](./SCHEMA_NORMALIZATION_AUDIT_FULL.md) — full mapping table, interface usage.
- `.cursor/rules/core/batch-live-symmetry.mdc` — 4 seams, shared engine.
- CODEX: `02-data/contracts-scope-and-layout.md`, `04-architecture/batch-live-symmetry.md`

12. **Schema audit matrix:** Run `python scripts/generate_schema_audit_matrix.py` to produce [SCHEMA_AUDIT_MATRIX.md](./SCHEMA_AUDIT_MATRIX.md) — Provider × Schema Type with ✓/~/— and canonical target. Regenerate when schemas change. Use as visual audit artifact.
13. **Context7 / reverse-engineer:** Use Context7 for up-to-date provider docs when implementing normalizers. **No auth should not block schema extraction:** reverse-engineer from public docs as first pass. VCR tests in interfaces verify and attach to versions — that's when auth is needed. Apply to VersiFi, Tardis, Deribit, and any provider with docs but no sandbox access.
