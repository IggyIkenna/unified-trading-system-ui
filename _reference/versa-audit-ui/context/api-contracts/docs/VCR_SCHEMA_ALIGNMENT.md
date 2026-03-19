# VCR mocks ↔ schema alignment (comprehensive)

This document lists **all data types** we need to contract, **every venue/data vendor**, and whether each (type × vendor) has a **schema**, **VCR cassette**, and/or **example**. Use it to close gaps so every type is covered for every relevant vendor.

---

## Definitions

- **VCR**: Live request recorded to `unified_api_contracts/<venue>/mocks/<name>.yaml`; replayed in `tests/test_vcr_replay.py` and validated with the venue schema.
- **Example**: Static JSON in `unified_api_contracts/<venue>/examples/<name>.json`; validated in `tests/test_every_venue_endpoint.py` and `test_contracts_vs_reality.py`.
- **Covered**: Schema has ≥1 VCR cassette or example that validates it.
- **Missing**: Schema has no VCR and no example; needs either a new cassette (add to `vcr_endpoints.py` + record) or a new example file + `example_schema_map` entry.

**Source of truth**

- Schemas: `unified_api_contracts/venue_manifest.py` → `response_schema_classes`, `error_schema_classes`, `example_schema_map`.
- VCR config: `unified_api_contracts/vcr_endpoints.py` → `VCR_ENDPOINTS`.
- Existing cassettes: `unified_api_contracts/<venue>/mocks/*.yaml`.
- Existing examples: `unified_api_contracts/<venue>/examples/*.json`.

---

## 1. Comprehensive data types (taxonomy)

Everything that can be produced by data vendors and exchanges, and that we may need to contract.

### 1.1 Market data – time series / bars

| Data type     | Description                                     | Typical fields                           |
| ------------- | ----------------------------------------------- | ---------------------------------------- |
| **OHLCV bar** | Candlestick / aggregated bar (1s, 1m, 1h, etc.) | open, high, low, close, volume, ts_event |

### 1.2 Ticker: spot vs derivative, and ticker trades

| Data type                  | Description                                       | Typical fields                                                                  |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Spot ticker / 24hr**     | Spot summary quote                                | lastPrice, bidPrice, askPrice, volume, quoteVolume                              |
| **Derivative ticker**      | Perps/futures ticker (mark, index, funding, OI)   | lastPrice, markPx, indexPx, funding, fundingRate, openInterest, nextFundingTime |
| **Ticker with last trade** | Ticker that embeds last trade (price, size, time) | same as ticker + lastTradePrice, lastTradeQty, lastTradeTime                    |
| **Trades (tape)**          | Individual executed trades (separate from ticker) | price, size, side, ts_event, trade_id, sequence                                 |

### 1.3 Market data – top of book and depth

| Data type                    | Description                            | Typical fields                              |
| ---------------------------- | -------------------------------------- | ------------------------------------------- |
| **Top of book (BBO)**        | Best bid and best ask only             | bid_px, ask_px, bid_sz, ask_sz              |
| **MBP-1**                    | Market by price, 1 level (same as BBO) | best bid/ask price and size                 |
| **MBP-5**                    | Market by price, 5 levels              | bid/ask levels 0..4 (price, size per level) |
| **MBP-10**                   | Market by price, 10 levels             | bid/ask levels 0..9                         |
| **Order book snapshot (L2)** | Full or N-level depth snapshot         | bids[], asks[] (price, size), timestamp     |

### 1.4 Reference data / instrument data

| Data type                    | Description                                          | Typical fields                                                                    |
| ---------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Instrument / symbol list** | List of tradeable instruments                        | symbol, base, quote, exchange                                                     |
| **Instrument definition**    | Full contract/symbol metadata                        | raw_symbol, instrument_id, class, expiry, tick_size, lot_size, etc.               |
| **Type information**         | Instrument/product type (spot, perp, future, option) | instrument_type, product_type, asset_class, option_style (e.g. American/European) |
| **Contract specs**           | Tick size, lot size, min notional, etc.              | tick_size, lot_size, min_qty, max_qty, currency                                   |

### 1.5 Market data – derived and events

| Data type         | Description                                     | Typical fields                                                                        |
| ----------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Funding rate**  | Perpetual funding rate                          | funding, fundingRate, nextFundingTime                                                 |
| **Open interest** | Open interest (perps/futures)                   | openInterest, symbol                                                                  |
| **Liquidations**  | Liquidation events (where available)            | price, size, side, time, liquidationId, symbol                                        |
| **Options chain** | Options surface (strikes, expiries, IV, greeks) | strikes[], expiries[], impliedVol, delta, gamma, theta, vega, openInterest per strike |

### 1.6 Execution and account

| Data type    | Description                      | Typical fields                                          |
| ------------ | -------------------------------- | ------------------------------------------------------- |
| **Order**    | Order submit ack / status / fill | orderId, symbol, side, price, qty, status, filled, time |
| **Position** | Open position                    | symbol, size, entryPrice, markPrice, unrealizedPnl      |
| **Balance**  | Wallet/account balance           | currency, free, used, total                             |

### 1.7 DeFi data types by venue

DeFi data shapes **depend on the venue** (subgraph schema, RPC API, or indexer). Below is what each venue exposes and what we contract.

| Venue          | Data types                                           | Schema / notes                                                                                                                                                                                                                                                      |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The Graph**  | Subgraph-specific; entity set depends on deployment. | **Uniswap-style:** SubgraphPool, SubgraphSwap, SubgraphToken. **Aave-style:** SubgraphReserve. Generic: TheGraphResponse, GraphQLError. Other subgraphs (e.g. Sushi, Curve) may have different entities (pairs, liquidity, gauges) — add schemas when we integrate. |
| **Alchemy**    | RPC, indexer APIs.                                   | AlchemyRpcResponse (eth_blockNumber, etc.), AlchemyAssetTransfer (getAssetTransfers), AlchemyTokenBalance. NFT/other APIs not yet in unified-api-contracts.                                                                                                         |
| **Other DeFi** | 0x, 1inch, Covalent, Dune, etc.                      | Not yet contracted; add venue-specific schemas when we integrate.                                                                                                                                                                                                   |

**The Graph (subgraph-by-subgraph):**

- **Uniswap V2/V3:** pools (reserves, liquidity, sqrtPriceX96, tick), swaps, tokens.
- **Aave:** reserves (totalLiquidity, totalBorrows, liquidityRate), users, deposits, borrows.
- **Other:** Each subgraph has its own schema; we need one contract set per subgraph or a generic GraphQL response + documented entity names.

**Alchemy:** RPC (generic result/error), getAssetTransfers (transfers), token balances; optional NFT, webhooks — add schemas as we use them.

### 1.8 Meta and errors

| Data type           | Description                                 |
| ------------------- | ------------------------------------------- |
| **Exchange list**   | List of supported exchanges (vendor)        |
| **Error payload**   | API/HTTP error (code, message, details)     |
| **Universe / meta** | Instrument universe (e.g. Hyperliquid meta) |
| **Stats row**       | Aggregated stats (e.g. daily volume row)    |

---

## 2. Data vendors and venues (who provides what)

| Vendor          | Type           | OHLCV   | Spot ticker | Deriv ticker | Trades | BBO/MBP-1 | MBP-5/10   | Order book | Reference / instrument   | Type info     | Funding/OI   | Liquidations | Options chain | Order/Pos/Bal | DeFi (by venue)            | Errors |
| --------------- | -------------- | ------- | ----------- | ------------ | ------ | --------- | ---------- | ---------- | ------------------------ | ------------- | ------------ | ------------ | ------------- | ------------- | -------------------------- | ------ |
| **Databento**   | Historical     | ✓       | —           | —            | ✓      | ✓ Mbp1    | MBP-5/10\* | —          | ✓ symbology, definition  | in definition | —            | —            | —             | —             | —                          | —      |
| **TARDIS**      | Historical     | —       | —           | —            | ✓      | —         | —          | ✓          | ✓ exchanges, instruments | —             | —            | —            | —             | —             | —                          | ✓      |
| **CCXT**        | Unified        | —       | ✓           | per exchange | ✓      | —         | —          | ✓          | ✓ markets                | in market     | per exchange | —            | —             | ✓             | —                          | ✓      |
| **Binance**     | CeFi           | —       | ✓           | ✓ (futures)  | ✓      | —         | —          | ✓          | —                        | —             | ✓            | ✓ (futures)  | —             | ✓             | —                          | ✓      |
| **OKX**         | CeFi           | —       | ✓           | ✓            | ✓      | —         | —          | ✓          | ✓ instruments            | instType      | ✓            | ✓            | ✓ options     | ✓             | —                          | ✓      |
| **Bybit**       | CeFi           | —       | ✓           | ✓            | ✓      | —         | —          | ✓          | ✓                        | —             | ✓            | ✓            | —             | ✓             | —                          | ✓      |
| **Upbit**       | CeFi           | —       | ✓           | —            | ✓      | —         | —          | ✓          | ✓ market/all             | —             | —            | —            | —             | ✓             | —                          | ✓      |
| **Hyperliquid** | On-chain perps | —       | —           | ✓            | ✓      | —         | —          | ✓          | ✓ meta                   | in meta       | ✓            | ✓            | —             | ✓             | —                          | ✓      |
| **Aster**       | On-chain perps | —       | —           | ✓            | —      | —         | —          | ✓          | ✓                        | —             | —            | —            | —             | ✓             | —                          | ✓      |
| **The Graph**   | DeFi subgraphs | —       | —           | —            | —      | —         | —          | —          | —                        | —             | —            | —            | —             | —             | ✓ subgraph-specific        | ✓      |
| **Alchemy**     | DeFi RPC/API   | —       | —           | —            | —      | —         | —          | —          | —                        | —             | —            | —            | —             | —             | ✓ RPC, transfers, balances | ✓      |
| **Yahoo**       | TradFi         | ✓ chart | ✓ quote     | —            | —      | —         | —          | —          | —                        | —             | —            | —            | —             | —             | —                          | ✓      |
| **IBKR**        | TradFi TWS     | ✓ bars  | ✓ ticker    | —            | —      | —         | —          | —          | —                        | ✓             | —            | —            | ✓ options     | ✓             | —                          | ✓      |

\* Databento supports MBP-5, MBP-10 in data; we currently have only Mbp1 schema.

---

## 3. Data type × vendor: schema + VCR + example coverage

For each (data type, vendor) we show: **Schema** (exists in unified-api-contracts?), **VCR** (cassette?), **Example** (example JSON?). Empty = missing.

### 3.1 OHLCV / bars

| Vendor      | Schema            | VCR | Example                  |
| ----------- | ----------------- | --- | ------------------------ |
| Databento   | DatabentoOhlcvBar | —   | ✓ ohlcv_bar_example.json |
| TARDIS      | —                 | —   | —                        |
| CCXT        | —                 | —   | —                        |
| Binance     | —                 | —   | —                        |
| OKX         | —                 | —   | —                        |
| Bybit       | —                 | —   | —                        |
| Upbit       | —                 | —   | —                        |
| Hyperliquid | —                 | —   | —                        |
| Yahoo       | —                 | —   | —                        |
| IBKR        | IBKRBar           | —   | ✓ bar_example.json       |

### 3.2 Spot ticker / 24hr

| Vendor  | Schema               | VCR                | Example               |
| ------- | -------------------- | ------------------ | --------------------- |
| CCXT    | CcxtTicker           | —                  | —                     |
| Binance | BinanceTicker (spot) | ✓ ticker_24hr.yaml | ✓ ticker_example.json |
| OKX     | OKXTicker            | ✓ ticker.yaml      | ✓ ticker_example.json |
| Bybit   | BybitTicker          | ✓ ticker.yaml      | ✓ ticker_example.json |
| Upbit   | UpbitTicker          | ✓ ticker.yaml      | ✓ ticker_example.json |
| Yahoo   | YahooQuote           | —                  | ✓ quote_example.json  |
| IBKR    | IBKRTicker           | —                  | —                     |

### 3.2b Derivative ticker (mark, funding, OI)

| Vendor      | Schema                                            | VCR                  | Example               |
| ----------- | ------------------------------------------------- | -------------------- | --------------------- |
| Binance     | BinanceTicker (futures 24hr)                      | —                    | —                     |
| OKX         | OKXTicker (swap/futures)                          | ✓ ticker.yaml (swap) | ✓                     |
| Bybit       | BybitTicker (linear)                              | ✓ ticker.yaml        | ✓                     |
| Hyperliquid | HyperliquidTicker (markPx, funding, openInterest) | —                    | ✓ ticker_example.json |
| Aster       | (in ticker/market)                                | —                    | —                     |

**Gap:** No dedicated DerivativeTicker schema; derivative-specific fields (markPx, indexPx, funding, openInterest) are often on the same ticker schema. Ensure examples/VCR include these fields where the venue is perps/futures.

### 3.2c Ticker and last trade (embedded)

Many tickers include last trade price/size/time. Same schemas as 3.2/3.2b; ensure contract includes lastTradePrice, lastTradeQty, lastTradeTime (or venue equivalents) where the API provides them.

### 3.3 Top of book (BBO) / MBP-1

| Vendor      | Schema                  | VCR | Example |
| ----------- | ----------------------- | --- | ------- |
| Databento   | DatabentoMbp1           | —   | —       |
| TARDIS      | (in OrderBook snapshot) | —   | —       |
| CCXT        | (in CcxtOrderBook)      | —   | —       |
| Binance     | (in BinanceOrderBook)   | —   | —       |
| OKX         | —                       | —   | —       |
| Bybit       | —                       | —   | —       |
| Upbit       | —                       | —   | —       |
| Hyperliquid | —                       | —   | —       |
| Aster       | —                       | —   | —       |

### 3.4 Trades

| Vendor      | Schema         | VCR | Example              |
| ----------- | -------------- | --- | -------------------- |
| Databento   | DatabentoTrade | —   | —                    |
| TARDIS      | TardisTrade    | —   | ✓ trade_example.json |
| CCXT        | CcxtTrade      | —   | —                    |
| Binance     | BinanceTrade   | —   | —                    |
| OKX         | —              | —   | —                    |
| Bybit       | —              | —   | —                    |
| Upbit       | —              | —   | —                    |
| Hyperliquid | —              | —   | —                    |
| Aster       | —              | —   | —                    |

### 3.5 MBP-5 / MBP-10 (multi-level depth)

| Vendor    | Schema                           | VCR | Example |
| --------- | -------------------------------- | --- | ------- |
| Databento | **No schema yet** (only Mbp1)    | —   | —       |
| TARDIS    | (OrderBook has bids/asks arrays) | —   | —       |
| CCXT      | CcxtOrderBook                    | —   | —       |
| Binance   | BinanceOrderBook                 | —   | —       |
| OKX       | —                                | —   | —       |
| Bybit     | —                                | —   | —       |
| Others    | per-venue order book schema      | —   | —       |

**Gap:** Add Databento Mbp5 / Mbp10 schemas (or generic MbpN) if we consume multi-level MBP from Databento. Add VCR/examples for order book (depth) for Binance, OKX, Bybit, etc.

### 3.6 Order book snapshot (L2)

| Vendor      | Schema                                | VCR | Example |
| ----------- | ------------------------------------- | --- | ------- |
| TARDIS      | TardisOrderBook, TardisOrderBookLevel | —   | —       |
| CCXT        | CcxtOrderBook                         | —   | —       |
| Binance     | BinanceOrderBook                      | —   | —       |
| OKX         | —                                     | —   | —       |
| Bybit       | —                                     | —   | —       |
| Upbit       | —                                     | —   | —       |
| Hyperliquid | —                                     | —   | —       |
| Aster       | AsterOrderBook                        | —   | —       |

### 3.7 Instrument / symbol list and definition

| Vendor      | Schema                               | VCR                         | Example |
| ----------- | ------------------------------------ | --------------------------- | ------- |
| Databento   | DatabentoDefinition, DatabentoSymbol | —                           | —       |
| TARDIS      | TardisExchange, TardisInstrument     | ✓ exchanges.yaml (Exchange) | —       |
| CCXT        | CcxtMarket                           | —                           | —       |
| Binance     | —                                    | —                           | —       |
| OKX         | OKXMarket                            | —                           | —       |
| Bybit       | BybitMarket                          | —                           | —       |
| Upbit       | UpbitMarket                          | —                           | —       |
| Hyperliquid | HyperliquidMeta (universe)           | ✓ meta.yaml                 | —       |
| Aster       | AsterMarket                          | —                           | —       |

### 3.8 Funding / open interest

| Vendor      | Schema                                        | VCR | Example               |
| ----------- | --------------------------------------------- | --- | --------------------- |
| Hyperliquid | (in HyperliquidTicker: funding, openInterest) | —   | ✓ ticker_example.json |
| Others      | Often in ticker or separate endpoint          | —   | —                     |

**Gap:** No dedicated FundingRate or OpenInterest schema per venue unless we add them.

### 3.8b Liquidations

| Vendor                 | Schema            | VCR | Example |
| ---------------------- | ----------------- | --- | ------- |
| Binance                | **No schema yet** | —   | —       |
| OKX                    | **No schema yet** | —   | —       |
| Bybit                  | **No schema yet** | —   | —       |
| Hyperliquid            | **No schema yet** | —   | —       |
| Others (futures/perps) | —                 | —   | —       |

**Gap:** Add Liquidation or LiquidationEvent schema per venue that exposes liquidation feed (e.g. Binance futures, OKX, Bybit, Hyperliquid); add VCR or examples.

### 3.8c Options chain

| Vendor | Schema                                         | VCR | Example |
| ------ | ---------------------------------------------- | --- | ------- |
| OKX    | **No schema yet** (options instruments/ticker) | —   | —       |
| IBKR   | **No schema yet** (options chain, greeks)      | —   | —       |
| Others | —                                              | —   | —       |

**Gap:** Add OptionsChain, OptionStrike, or venue-specific options schemas (strikes, expiries, IV, greeks, OI per strike) for OKX options, IBKR options; add examples/VCR.

### 3.8d Reference data / instrument data / type information

| Vendor      | Schema                                                         | VCR              | Example |
| ----------- | -------------------------------------------------------------- | ---------------- | ------- |
| Databento   | DatabentoDefinition, DatabentoSymbol (instrument_class = type) | —                | —       |
| TARDIS      | TardisExchange, TardisInstrument                               | ✓ exchanges.yaml | —       |
| CCXT        | CcxtMarket (type in market)                                    | —                | —       |
| Binance     | —                                                              | —                | —       |
| OKX         | OKXMarket (instType)                                           | —                | —       |
| Bybit       | BybitMarket                                                    | —                | —       |
| Upbit       | UpbitMarket                                                    | —                | —       |
| Hyperliquid | HyperliquidMeta (universe: name, szDecimals, etc.)             | ✓ meta.yaml      | —       |
| Aster       | AsterMarket                                                    | —                | —       |
| IBKR        | (contract details in position/order)                           | —                | —       |

**Gap:** Type information (instrument_type: spot, perp, future, option) is often inside market/instrument; ensure schemas and examples include it. Add VCR or examples for every venue’s instrument/market/list endpoint.

### 3.9 Order / position / balance

| Vendor      | Schema                                                                | VCR | Example                            |
| ----------- | --------------------------------------------------------------------- | --- | ---------------------------------- |
| CCXT        | CcxtOrder, CcxtPosition, CcxtBalance, CcxtBalanceResponse             | —   | ✓ fetch_order_example.json (Order) |
| Binance     | BinanceOrder, BinancePosition                                         | —   | ✓ order_example.json (Order)       |
| OKX         | OKXOrder, OKXPosition                                                 | —   | —                                  |
| Bybit       | BybitOrder, BybitPosition                                             | —   | —                                  |
| Upbit       | UpbitOrder, UpbitBalance                                              | —   | —                                  |
| Hyperliquid | HyperliquidOrder, HyperliquidPosition                                 | —   | —                                  |
| Aster       | AsterOrder, AsterPosition                                             | —   | ✓ order_example.json (Order)       |
| IBKR        | IBKROrder, IBKRPosition, IBKRAccountValue, IBKRPortfolioItem, IBKRPnL | —   | ✓ bar/error only                   |

### 3.10 DeFi by venue

**The Graph (subgraph-specific; entity set depends on deployment)**

| Data type                | Schema           | VCR | Example                      |
| ------------------------ | ---------------- | --- | ---------------------------- |
| GraphQL response wrapper | TheGraphResponse | —   | ✓ response_example.json      |
| GraphQL error            | GraphQLError     | —   | ✓ graphql_error_example.json |
| Uniswap-style pool       | SubgraphPool     | —   | —                            |
| Uniswap-style swap       | SubgraphSwap     | —   | —                            |
| Token (subgraph)         | SubgraphToken    | —   | —                            |
| Aave-style reserve       | SubgraphReserve  | —   | —                            |

Other subgraphs (Sushi, Curve, etc.) may expose different entities — add schemas when we integrate; each subgraph = different contract set.

**Alchemy**

| Data type            | Schema               | VCR | Example                     |
| -------------------- | -------------------- | --- | --------------------------- |
| Generic RPC response | AlchemyRpcResponse   | —   | ✓ rpc_response_example.json |
| Asset transfer       | AlchemyAssetTransfer | —   | —                           |
| Token balance        | AlchemyTokenBalance  | —   | —                           |
| Error                | AlchemyError         | —   | ✓ error_example.json        |

Other Alchemy APIs (NFT, webhooks) — add schemas when we use them.

### 3.11 Errors

| Vendor      | Schema           | VCR | Example |
| ----------- | ---------------- | --- | ------- |
| TARDIS      | TardisError      | —   | ✓       |
| CCXT        | CcxtErrorPayload | —   | —       |
| Binance     | BinanceError     | —   | ✓       |
| OKX         | OKXError         | —   | ✓       |
| Bybit       | BybitError       | —   | ✓       |
| Yahoo       | YahooError       | —   | ✓       |
| Alchemy     | AlchemyError     | —   | ✓       |
| Hyperliquid | HyperliquidError | —   | ✓       |
| Aster       | AsterError       | —   | ✓       |
| Upbit       | UpbitError       | —   | ✓       |
| IBKR        | IBKRError        | —   | ✓       |
| The Graph   | GraphQLError     | —   | ✓       |

---

## 4. Per-venue schema table (current manifest)

Same as before: every schema in the venue manifest and its VCR/example status.

### databento

| Schema              | VCR | Example                | Status       |
| ------------------- | --- | ---------------------- | ------------ |
| DatabentoOhlcvBar   | —   | ohlcv_bar_example.json | Example only |
| DatabentoTrade      | —   | —                      | **Missing**  |
| DatabentoMbp1       | —   | —                      | **Missing**  |
| DatabentoDefinition | —   | —                      | **Missing**  |
| DatabentoSymbol     | —   | —                      | **Missing**  |

### tardis

| Schema               | VCR            | Example            | Status       |
| -------------------- | -------------- | ------------------ | ------------ |
| TardisExchange       | exchanges.yaml | —                  | VCR only     |
| TardisInstrument     | —              | —                  | **Missing**  |
| TardisTrade          | —              | trade_example.json | Example only |
| TardisOrderBookLevel | —              | —                  | **Missing**  |
| TardisOrderBook      | —              | —                  | **Missing**  |
| TardisError          | —              | error_example.json | Example only |

### ccxt

| Schema              | VCR | Example                  | Status       |
| ------------------- | --- | ------------------------ | ------------ |
| CcxtOrder           | —   | fetch_order_example.json | Example only |
| CcxtTrade           | —   | —                        | **Missing**  |
| CcxtBalance         | —   | —                        | **Missing**  |
| CcxtBalanceResponse | —   | —                        | **Missing**  |
| CcxtPosition        | —   | —                        | **Missing**  |
| CcxtMarket          | —   | —                        | **Missing**  |
| CcxtTicker          | —   | —                        | **Missing**  |
| CcxtOrderBook       | —   | —                        | **Missing**  |
| CcxtErrorPayload    | —   | —                        | **Missing**  |

### binance

| Schema           | VCR              | Example             | Status        |
| ---------------- | ---------------- | ------------------- | ------------- |
| BinanceTicker    | ticker_24hr.yaml | ticker_example.json | VCR + example |
| BinanceOrderBook | —                | —                   | **Missing**   |
| BinanceTrade     | —                | —                   | **Missing**   |
| BinanceOrder     | —                | order_example.json  | Example only  |
| BinancePosition  | —                | —                   | **Missing**   |
| BinanceError     | —                | error_example.json  | Example only  |

### thegraph

| Schema           | VCR | Example                    | Status       |
| ---------------- | --- | -------------------------- | ------------ |
| TheGraphResponse | —   | response_example.json      | Example only |
| SubgraphPool     | —   | —                          | **Missing**  |
| SubgraphSwap     | —   | —                          | **Missing**  |
| SubgraphToken    | —   | —                          | **Missing**  |
| SubgraphReserve  | —   | —                          | **Missing**  |
| GraphQLError     | —   | graphql_error_example.json | Example only |

### okx

| Schema      | VCR         | Example             | Status        |
| ----------- | ----------- | ------------------- | ------------- |
| OKXMarket   | —           | —                   | **Missing**   |
| OKXTicker   | ticker.yaml | ticker_example.json | VCR + example |
| OKXOrder    | —           | —                   | **Missing**   |
| OKXPosition | —           | —                   | **Missing**   |
| OKXError    | —           | error_example.json  | Example only  |

### bybit

| Schema        | VCR         | Example             | Status        |
| ------------- | ----------- | ------------------- | ------------- |
| BybitMarket   | —           | —                   | **Missing**   |
| BybitTicker   | ticker.yaml | ticker_example.json | VCR + example |
| BybitOrder    | —           | —                   | **Missing**   |
| BybitPosition | —           | —                   | **Missing**   |
| BybitError    | —           | error_example.json  | Example only  |

### yahoo_finance

| Schema           | VCR | Example            | Status       |
| ---------------- | --- | ------------------ | ------------ |
| YahooQuote       | —   | quote_example.json | Example only |
| YahooChartResult | —   | —                  | **Missing**  |
| YahooError       | —   | error_example.json | Example only |

### alchemy

| Schema               | VCR | Example                   | Status       |
| -------------------- | --- | ------------------------- | ------------ |
| AlchemyRpcResponse   | —   | rpc_response_example.json | Example only |
| AlchemyAssetTransfer | —   | —                         | **Missing**  |
| AlchemyTokenBalance  | —   | —                         | **Missing**  |
| AlchemyError         | —   | error_example.json        | Example only |

### hyperliquid

| Schema              | VCR       | Example             | Status       |
| ------------------- | --------- | ------------------- | ------------ |
| HyperliquidMeta     | meta.yaml | —                   | VCR only     |
| HyperliquidTicker   | —         | ticker_example.json | Example only |
| HyperliquidOrder    | —         | —                   | **Missing**  |
| HyperliquidPosition | —         | —                   | **Missing**  |
| HyperliquidStatsRow | —         | —                   | **Missing**  |
| HyperliquidError    | —         | error_example.json  | Example only |

### aster

| Schema         | VCR | Example            | Status       |
| -------------- | --- | ------------------ | ------------ |
| AsterMarket    | —   | —                  | **Missing**  |
| AsterOrderBook | —   | —                  | **Missing**  |
| AsterOrder     | —   | order_example.json | Example only |
| AsterPosition  | —   | —                  | **Missing**  |
| AsterError     | —   | error_example.json | Example only |

### upbit

| Schema       | VCR         | Example             | Status        |
| ------------ | ----------- | ------------------- | ------------- |
| UpbitMarket  | —           | —                   | **Missing**   |
| UpbitTicker  | ticker.yaml | ticker_example.json | VCR + example |
| UpbitOrder   | —           | —                   | **Missing**   |
| UpbitBalance | —           | —                   | **Missing**   |
| UpbitError   | —           | error_example.json  | Example only  |

### ibkr

| Schema            | VCR | Example            | Status       |
| ----------------- | --- | ------------------ | ------------ |
| IBKRBar           | —   | bar_example.json   | Example only |
| IBKRTicker        | —   | —                  | **Missing**  |
| IBKROrder         | —   | —                  | **Missing**  |
| IBKRPosition      | —   | —                  | **Missing**  |
| IBKRAccountValue  | —   | —                  | **Missing**  |
| IBKRPortfolioItem | —   | —                  | **Missing**  |
| IBKRPnL           | —   | —                  | **Missing**  |
| IBKRError         | —   | error_example.json | Example only |

---

## 5. Summary counts

| Venue         | Response | Error | With VCR | Example only | Missing |
| ------------- | -------- | ----- | -------- | ------------ | ------- |
| databento     | 5        | 0     | 0        | 1            | 4       |
| tardis        | 5        | 1     | 1        | 2            | 3       |
| ccxt          | 8        | 1     | 0        | 1            | 8       |
| binance       | 5        | 1     | 1        | 3            | 3       |
| thegraph      | 5        | 1     | 0        | 2            | 4       |
| okx           | 4        | 1     | 1        | 2            | 2       |
| bybit         | 4        | 1     | 1        | 2            | 2       |
| yahoo_finance | 2        | 1     | 0        | 2            | 1       |
| alchemy       | 3        | 1     | 0        | 2            | 2       |
| hyperliquid   | 5        | 1     | 1        | 2            | 3       |
| aster         | 4        | 1     | 0        | 2            | 2       |
| upbit         | 4        | 1     | 1        | 2            | 2       |
| ibkr          | 7        | 1     | 0        | 2            | 6       |

**Total:** 61 response + 13 error = 74 schemas. **VCR cassettes:** 5. **Many types (trades, order book, MBP-5/10, order, position, balance, DeFi entities) have no or partial coverage.**

---

## 6. Checklist for next agent: full alignment

### 6.1 Data types to cover everywhere relevant

- **OHLCV/bars** – Already: Databento, IBKR. Consider: TARDIS, CCXT, exchange-native if we consume bars from them.
- **Spot ticker** – Covered for Binance, OKX, Bybit, Upbit, Yahoo; add VCR or examples for CCXT ticker.
- **Derivative ticker** – Ensure perps/futures ticker responses (markPx, funding, openInterest) are in schema and examples for Binance futures, OKX swap, Bybit linear, Hyperliquid, Aster.
- **Ticker and last trade** – Where APIs embed last trade in ticker, ensure schemas include lastTradePrice, lastTradeQty, lastTradeTime (or venue equivalents).
- **Trades (tape)** – Add VCR or examples for: DatabentoTrade, TardisTrade (has example), CcxtTrade, BinanceTrade; and any venue that exposes trades.
- **Top of book / BBO / MBP-1** – Databento (Mbp1), others via order book; add VCR/examples for DatabentoMbp1, and depth for Binance/OKX/Bybit.
- **MBP-5 / MBP-10** – Add schemas (e.g. DatabentoMbp5, DatabentoMbp10 or generic) if we consume multi-level MBP; add VCR/examples.
- **Order book snapshot** – Add VCR or examples for: TardisOrderBook, CcxtOrderBook, BinanceOrderBook, OKX/Bybit/Upbit/Hyperliquid/Aster order book types.
- **Reference data / instrument data** – Add VCR or examples for: DatabentoSymbol, DatabentoDefinition, TardisInstrument, CcxtMarket, OKXMarket, BybitMarket, UpbitMarket, AsterMarket, HyperliquidMeta.
- **Type information** – Ensure instrument_type / product_type (spot, perp, future, option) is in instrument/market schemas and examples.
- **Liquidations** – Add Liquidation (or venue-specific) schema + example/VCR for Binance futures, OKX, Bybit, Hyperliquid if we consume liquidation feed.
- **Options chain** – Add options-chain schema(s) and examples for OKX options, IBKR options (strikes, expiries, IV, greeks, OI per strike).
- **Order / position / balance** – Add examples (and VCR where HTTP) for every venue that has these schemas (see per-venue tables).
- **DeFi by venue** – The Graph: add VCR or examples for SubgraphPool, SubgraphSwap, SubgraphToken, SubgraphReserve (and document which subgraph each applies to). Alchemy: add for AlchemyAssetTransfer, AlchemyTokenBalance. Add schemas for other DeFi venues (e.g. new subgraph entities) when we integrate.
- **Errors** – Add example for CcxtErrorPayload; ensure every error schema has at least one example or VCR.

### 6.2 Add missing schemas (if needed)

- **Databento:** Mbp5, Mbp10 (or MbpN) if we use multi-level MBP.
- **Funding / open interest:** Dedicated schema per venue only if we have a dedicated endpoint; else keep in ticker.
- **Liquidations:** Add Liquidation / LiquidationEvent (or per-venue) for Binance, OKX, Bybit, Hyperliquid.
- **Options chain:** Add OptionsChain or OptionStrike (or per-venue) for OKX options, IBKR options.
- **Type information:** Ensure all instrument/market schemas include instrument_type or product_type where the API provides it.

### 6.3 Concrete steps

1. Add **missing examples** for every schema marked **Missing** in section 4; register in `venue_manifest.py` → `example_schema_map`.
2. Add **VCR endpoints** in `unified_api_contracts/vcr_endpoints.py` for every type that has an HTTP endpoint (public or key_env). Recording is done from the six interfaces; commit `mocks/*.yaml` (or the interface’s cassette dir) after recording.
3. **IBKR:** No HTTP; add static examples for IBKRTicker, IBKROrder, IBKRPosition, IBKRAccountValue, IBKRPortfolioItem, IBKRPnL.
4. **YahooChartResult:** Add `yahoo_finance/examples/chart_result_example.json` and add to `example_schema_map`.
5. Re-run **tests**: `pytest tests/test_every_venue_endpoint.py tests/test_contracts_vs_reality.py tests/test_vcr_replay.py -v`.
6. **Update this doc** when adding schemas, VCR, or examples.
