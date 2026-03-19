# Cross-Venue Matrix

Single source of truth for CCXT vs direct access, normalization flow, venue-unique exposure, data source mapping, and schema coverage. Aligns with `canonical_mappings.py`, `venue_manifest.py`, `endpoints.py`, and `INDEX.md`.

---

## 1. CCXT vs Direct Access

| Venue               | Access        | Notes                                                              |
| ------------------- | ------------- | ------------------------------------------------------------------ |
| **BINANCE-SPOT**    | CCXT + Direct | CCXT unified; direct for Binance-specific (PAPI, EAPI options)     |
| **BINANCE-FUTURES** | CCXT + Direct | CCXT unified; direct for fapi/dapi, PAPI portfolio margin          |
| **OKX**             | CCXT + Direct | CCXT unified; direct for OKX v5 REST/WS, options, portfolio margin |
| **BYBIT**           | CCXT + Direct | CCXT unified; direct for Bybit v5 REST/WS                          |
| **COINBASE-SPOT**   | CCXT + Direct | CCXT unified; direct for Coinbase Advanced Trade API               |
| **UPBIT**           | CCXT + Direct | CCXT unified; direct for Upbit REST/WS                             |
| **KUCOIN**          | CCXT only     | Via CCXT; no direct adapter                                        |
| **GATEIO-SPOT**     | CCXT + Tardis | CCXT unified; Tardis for historical                                |
| **BITFINEX-SPOT**   | CCXT + Tardis | CCXT unified; Tardis for historical                                |
| **HUOBI-SPOT**      | CCXT + Tardis | CCXT unified; Tardis for historical                                |
| **DERIBIT**         | Direct only   | No CCXT; direct REST/WS (options, DVOL)                            |
| **HYPERLIQUID**     | Direct only   | No CCXT; direct HTTP + WebSocket                                   |
| **ASTER**           | Direct only   | No CCXT; on-chain perps                                            |
| **DATABENTO**       | Direct only   | Historical API; ~506 TradFi venues                                 |
| **TARDIS**          | Direct only   | Historical API; CeFi exchanges                                     |
| **IBKR**            | Direct only   | TWS/ib_insync; no REST                                             |
| **THEGRAPH**        | Direct only   | GraphQL subgraphs                                                  |
| **YAHOO_FINANCE**   | Direct only   | HTTP quote/chart                                                   |
| **BARCHART**        | Direct only   | CSV dumps (VIX)                                                    |
| **ALCHEMY**         | Direct only   | JSON-RPC                                                           |

---

## 2. Normalization Flow

### CCXT Path (Unified API)

```
Exchange API (Binance, OKX, Bybit, etc.)
    → CCXT fetch_* methods
    → CCXT normalizes response (symbol, timestamp, side, etc.)
    → CcxtOrder, CcxtTrade, CcxtTicker, CcxtOrderBook, etc.
    → Adapter maps to canonical types (UMI/UOI)
```

- **Pros**: Single adapter for many exchanges; consistent symbol format (`BASE/QUOTE`).
- **Cons**: CCXT may lag behind venue-specific features; some endpoints not exposed.

### Direct API Path (Per-Venue Adapters)

```
Venue REST/WebSocket (Binance, OKX, Deribit, etc.)
    → Raw response (venue-specific format)
    → unified_api_contracts.<venue>.schemas validate
    → Per-venue adapter maps to canonical types
    → UMI/UOI canonical output
```

- **Pros**: Full access to venue-unique endpoints; no CCXT lag.
- **Cons**: One adapter per venue; symbol/format mapping per venue.

### Flow Summary

| Path   | Normalization               | Adapter Count     |
| ------ | --------------------------- | ----------------- |
| CCXT   | CCXT library                | 1 (CCXT adapter)  |
| Direct | Per-venue schemas + adapter | N (one per venue) |

---

## 3. Venue-Unique Exposure

| Venue            | Unique Exposure                                          | Schema / Endpoint                                                                            |
| ---------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Binance PAPI** | Portfolio margin account, balance, position              | BinancePapiAccount, BinancePapiBalance, BinancePapiPosition; `papi.binance.com`              |
| **Binance EAPI** | Options exchange info, ticker, mark price                | BinanceOptionInstrumentInfo, BinanceOptionTicker, BinanceOptionMarkPrice; `eapi.binance.com` |
| **Deribit**      | DVOL/BVOL volatility index                               | DeribitVolatilityIndex; `public/get_volatility_index_data`                                   |
| **Deribit**      | Options chain, settlement cash flows, session bankruptcy | DeribitInstrumentInfoFull, DeribitSettlementCashFlows, DeribitSessionBankruptcyDetails       |
| **OKX**          | Options market data, account greeks                      | OKXOptionMarketData, OKXOptionGreeks; mark-price, account-greeks channels                    |
| **OKX**          | Portfolio margin account, delivery/exercise history      | OKXPortfolioMarginAccount, OKXDeliveryExerciseHistory                                        |
| **Bybit**        | Delivery record, insurance fund                          | BybitDeliveryRecord, BybitInsuranceFund                                                      |
| **Hyperliquid**  | Vault details, spot meta, sub-account, user fees         | HyperliquidVaultDetails, HyperliquidSpotMeta, HyperliquidSubAccount, HyperliquidUserFees     |
| **IBKR**         | Option greeks, historical volatility, sec def opt params | IBKROptionGreeks, IBKRHistoricalVolatility, IBKRSecDefOptParams                              |
| **Databento**    | Symbology, definition, imbalance, statistics             | DatabentoSymbol, DatabentoDefinition, DatabentoImbalance, DatabentoStatistics                |
| **Tardis**       | Exchanges, instruments, liquidations, options chain      | TardisExchange, TardisInstrument, TardisLiquidations, TardisOptionsChain                     |

---

## 4. Data Source → Venue Mapping

| Data Source       | Venues                                                                                                                                                                                                                                                    | Notes                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Tardis**        | BINANCE-SPOT, BINANCE-FUTURES, COINBASE-SPOT, DERIBIT, BYBIT-SPOT, BYBIT-FUTURES, OKX-SPOT, OKX-FUTURES, OKX-SWAP, BITFINEX-SPOT, GEMINI-SPOT, BITSTAMP-SPOT, HUOBI-SPOT, HUOBI-FUTURES, GATEIO-SPOT, GATEIO-FUTURES, BITMEX, PHEMEX-SPOT, PHEMEX-FUTURES | Historical CeFi; exchanges, instruments, trades, book              |
| **Databento**     | CME, CBOT, NYMEX, COMEX, GLOBEX, XCME, XNAS, XNYS, BATS, ARCX, IEXG, XPSX, EPRL, XCHI, CBOE                                                                                                                                                               | TradFi ~506 venues via publisher_id; OHLCV, trades, MBP, symbology |
| **CCXT**          | BINANCE-SPOT, BINANCE-FUTURES, OKX, BYBIT, COINBASE-SPOT, UPBIT, KUCOIN, GATEIO-SPOT, BITFINEX-SPOT, HUOBI-SPOT                                                                                                                                           | Unified REST; order, trade, balance, position, ticker, orderbook   |
| **IBKR**          | NASDAQ, NYSE, CME, CBOE, ARCA, BATS, IEX                                                                                                                                                                                                                  | TWS execution + market data                                        |
| **Aster**         | ASTER                                                                                                                                                                                                                                                     | On-chain perps                                                     |
| **Hyperliquid**   | HYPERLIQUID                                                                                                                                                                                                                                               | On-chain perps                                                     |
| **The Graph**     | UNISWAP-V2, UNISWAP-V3, UNISWAP-V4, AAVE-V3, CURVE, BALANCER, MORPHO, EULER, FLUID, LIDO, ETHERFI, ETHENA                                                                                                                                                 | DeFi subgraphs                                                     |
| **Yahoo Finance** | FX                                                                                                                                                                                                                                                        | Quote, chart, OHLCV 24h                                            |
| **Barchart**      | VIX                                                                                                                                                                                                                                                       | 15m OHLCV; manual CSV                                              |

---

## 5. Schema Coverage Matrix

Rows = data categories; columns = venues; cells = ✓ (have) / — (missing) / ○ (partial).

| Category               | databento | tardis | ccxt | binance | okx | bybit | deribit | hyperliquid | aster | upbit | coinbase | ibkr | thegraph | yahoo_finance | barchart | alchemy |
| ---------------------- | --------- | ------ | ---- | ------- | --- | ----- | ------- | ----------- | ----- | ----- | -------- | ---- | -------- | ------------- | -------- | ------- |
| **trades**             | ✓         | ✓      | ✓    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | ✓     | ✓        | ✓    | —        | —             | —        | —       |
| **OHLCV**              | ✓         | —      | ○    | ✓       | ✓   | ✓     | —       | ✓           | ✓     | —     | ✓        | ✓    | —        | ✓             | ✓        | —       |
| **orderbook**          | ✓         | ✓      | ✓    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | ✓     | ✓        | —    | —        | —             | —        | —       |
| **ticker**             | —         | —      | ✓    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | ✓     | ✓        | ✓    | —        | ✓             | —        | —       |
| **fee**                | —         | —      | ✓    | ✓       | ✓   | ✓     | —       | ✓           | —     | ✓     | ✓        | —    | —        | —             | —        | —       |
| **deposit**            | —         | —      | ✓    | ✓       | ✓   | ✓     | —       | —           | —     | ✓     | —        | —    | —        | —             | —        | —       |
| **funding**            | —         | —      | ○    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | —     | —        | —    | —        | —             | —        | —       |
| **OI (open interest)** | —         | —      | ✓    | ○       | ✓   | ○     | —       | ✓           | ✓     | —     | —        | —    | —        | —             | —        | —       |
| **vol surface / DVOL** | —         | —      | ○    | —       | ○   | —     | ✓       | —           | —     | —     | —        | ○    | —        | —             | —        | —       |
| **options chain**      | —         | ○      | ○    | ○       | ○   | —     | ✓       | —           | —     | —     | —        | ○    | —        | —             | —        | —       |
| **position**           | —         | —      | ✓    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | —     | ✓        | ✓    | —        | —             | —        | —       |
| **balance**            | —         | —      | ✓    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | ✓     | ✓        | ✓    | —        | —             | —        | —       |
| **order**              | —         | —      | ✓    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | —     | ✓        | ✓    | —        | —             | —        | —       |
| **liquidations**       | —         | ○      | —    | ✓       | ✓   | ✓     | —       | ✓           | ✓     | —     | —        | —    | —        | —             | —        | —       |
| **portfolio margin**   | —         | —      | —    | ✓       | ✓   | —     | ✓       | —           | —     | —     | —        | —    | —        | —             | —        | —       |
| **symbology**          | ✓         | —      | —    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | ✓     | ✓        | —    | —        | —             | —        | —       |
| **error**              | ✓         | ✓      | ✓    | ✓       | ✓   | ✓     | ✓       | ✓           | ✓     | ✓     | ✓        | ✓    | ✓        | ✓             | —        | ✓       |

**Legend**: ✓ = full coverage; ○ = partial (e.g. CCXT has some exchanges, not all); — = not available or not modeled.

---

## References

- `unified_api_contracts/canonical_mappings.py` — DATA_SOURCE_TO_VENUES, VENUE_TO_DATA_SOURCE, DATASET_TO_CANONICAL_VENUE
- `unified_api_contracts/venue_manifest.py` — VenueContract (has_rest, has_websocket, response_schema_classes)
- `unified_api_contracts/endpoints.py` — BASE_URLS, ENDPOINT_SCHEMA_MAP
- [INDEX.md](INDEX.md) — Per-venue contract index
- [VENUE_DATA_TYPES.md](VENUE_DATA_TYPES.md) — trades, OHLCV, orderbook, ticker per venue
- [TRANSPORT_AND_ENDPOINTS.md](TRANSPORT_AND_ENDPOINTS.md) — REST vs WebSocket vs FIX
