# Unified API Contracts — Schema Normalization Audit (Full)

**Date:** 2026-03-05
**Scope:** External vs normalised schemas, orphan detection, mapping coverage, interface usage, sports, instruction-type

**Relationship:** This document is updated **after** [SCHEMA_NORMALIZATION_GAPS_AUDIT.md](./SCHEMA_NORMALIZATION_GAPS_AUDIT.md) is fully satisfied. GAPS audit is the source of truth for gaps; this doc is the full mapping table.

**Audit grade:** Citadel-grade. Every data type from every provider must be accounted for.

---

## 1. Table 1: Provider | External Schema | Canonical Type | Normalizer Function | Status

| Provider  | External Schema                   | Canonical Type                            | Normalizer Function               | Status   |
| --------- | --------------------------------- | ----------------------------------------- | --------------------------------- | -------- |
| binance   | BinanceTrade                      | CanonicalTrade                            | normalize_binance_trade           | Mapped   |
| binance   | BinanceOrderBook                  | CanonicalOrderBook                        | normalize_binance_orderbook       | Mapped   |
| binance   | BinanceTicker                     | CanonicalTicker                           | normalize_binance_ticker          | Mapped   |
| binance   | BinanceOrder                      | CanonicalOrder                            | normalize_binance_order           | Mapped   |
| binance   | BinanceMyTrades                   | CanonicalFill                             | normalize_binance_fill            | Mapped   |
| databento | DatabentoTrade                    | CanonicalTrade                            | normalize_databento_trade         | Mapped   |
| databento | DatabentoOhlcvBar                 | CanonicalOhlcvBar                         | (partial)                         | Planned  |
| databento | DatabentoMbp1, Mbp10, Tbbo        | CanonicalOrderBook                        | normalize*databento*\*\_orderbook | Mapped   |
| tardis    | TardisTrade                       | CanonicalTrade                            | normalize_tardis_trade            | Mapped   |
| tardis    | TardisOrderBook                   | CanonicalOrderBook                        | normalize_tardis_orderbook        | Mapped   |
| coinbase  | CoinbaseTrade                     | CanonicalTrade                            | normalize_coinbase_trade          | Mapped   |
| coinbase  | CoinbaseOrderBook                 | CanonicalOrderBook                        | normalize_coinbase_orderbook      | Mapped   |
| coinbase  | CoinbaseTicker                    | CanonicalTicker                           | normalize_coinbase_ticker         | Mapped   |
| ccxt      | CcxtTrade                         | CanonicalTrade                            | normalize_ccxt_trade              | Mapped   |
| ccxt      | CcxtOrder                         | CanonicalOrder                            | normalize_ccxt_order              | Mapped   |
| ccxt      | CcxtTrade                         | CanonicalFill                             | normalize_ccxt_trade_to_fill      | Mapped   |
| ccxt      | CcxtOrderBook                     | CanonicalOrderBook                        | normalize_ccxt_orderbook          | Mapped   |
| ccxt      | CcxtTicker                        | CanonicalTicker                           | normalize_ccxt_ticker             | Mapped   |
| okx       | OKXTrade                          | CanonicalTrade                            | normalize_okx_trade               | Mapped   |
| okx       | OKXOrderBook                      | CanonicalOrderBook                        | normalize_okx_orderbook           | Mapped   |
| okx       | OKXOrder                          | CanonicalOrder                            | normalize_okx_order               | Mapped   |
| bybit     | BybitTrade                        | CanonicalTrade                            | normalize_bybit_trade             | Mapped   |
| bybit     | BybitOrderBook                    | CanonicalOrderBook                        | normalize_bybit_orderbook         | Mapped   |
| bybit     | BybitOrder                        | CanonicalOrder                            | normalize_bybit_order             | Mapped   |
| bybit     | BybitExecutionWS                  | CanonicalFill                             | normalize_bybit_fill              | Mapped   |
| bybit     | BybitTicker                       | CanonicalTicker                           | normalize_bybit_ticker            | Mapped   |
| deribit   | DeribitTrade                      | CanonicalTrade                            | normalize_deribit_trade           | Mapped   |
| deribit   | DeribitOrderBook                  | CanonicalOrderBook                        | normalize_deribit_orderbook       | Mapped   |
| deribit   | DeribitOrder                      | CanonicalOrder                            | normalize_deribit_order           | Mapped   |
| deribit   | DeribitTicker                     | CanonicalTicker                           | normalize_deribit_ticker          | Mapped   |
| upbit     | UpbitTrade                        | CanonicalTrade                            | normalize_upbit_trade             | Mapped   |
| upbit     | UpbitOrderBook                    | CanonicalOrderBook                        | normalize_upbit_orderbook         | Mapped   |
| upbit     | UpbitTicker                       | CanonicalTicker                           | normalize_upbit_ticker            | Mapped   |
| alchemy   | AlchemyTransaction, etc.          | —                                         | —                                 | Orphaned |
| sports    | Matchbook, Betfair, OddsApi, etc. | CanonicalOdds, CanonicalFixture, BetOrder | Adapters                          | Mapped   |

## 2. Table 2: Interface | Canonical Types Used | Import Source | Status

| Interface                          | Canonical Types Used                                               | Import Source                   | Status |
| ---------------------------------- | ------------------------------------------------------------------ | ------------------------------- | ------ |
| unified-market-interface           | CanonicalTrade, CanonicalOrderBook, CanonicalTicker, etc.          | unified_api_contracts.canonical | UAC    |
| unified-trade-execution-interface  | CanonicalOrder, CanonicalFill, CanonicalBalance, CanonicalPosition | unified_api_contracts.canonical | UAC    |
| unified-internal-contracts         | CanonicalTrade, CanonicalOrderBook, CanonicalTicker, etc.          | Re-export from UAC              | UAC    |
| unified-sports-execution-interface | CanonicalOdds, BetExecution, BetOrder                              | unified_api_contracts           | UAC    |

## 3. UAC Normalizers (Current)

**Trades:** normalize_binance_trade, normalize_databento_trade, normalize_tardis_trade, normalize_coinbase_trade, normalize_ccxt_trade, normalize_okx_trade, normalize_bybit_trade, normalize_deribit_trade, normalize_upbit_trade

**Orderbooks:** normalize_binance_orderbook, normalize_coinbase_orderbook, normalize_ccxt_orderbook, normalize_bybit_orderbook, normalize_okx_orderbook, normalize_deribit_orderbook, normalize_upbit_orderbook, normalize_tardis_orderbook, normalize_databento_mbp1_orderbook, normalize_databento_mbp10_orderbook, normalize_databento_tbbo_orderbook

**Orders/Fills:** normalize_ccxt_order, normalize_ccxt_trade_to_fill, normalize_binance_order, normalize_binance_fill, normalize_okx_order, normalize_bybit_order, normalize_bybit_fill, normalize_deribit_order

**Tickers:** normalize_binance_ticker, normalize_ccxt_ticker, normalize_coinbase_ticker, normalize_bybit_ticker, normalize_okx_ticker, normalize_deribit_ticker, normalize_upbit_ticker

## 4. Canonical Error Taxonomy (To Implement)

**A. Request/client-side:** CanonicalInvalidRequestFormatError, CanonicalMissingParameterError, CanonicalInvalidParameterError, CanonicalInstrumentNotFoundError, CanonicalInvalidOrderTypeError, CanonicalInvalidSideError, CanonicalAuthenticationError, CanonicalAuthorizationError

**B. Server-side:** CanonicalRateLimitError, CanonicalInternalServerError, CanonicalServiceUnavailableError, CanonicalNetworkError

**C. Business/trading:** CanonicalInsufficientBalanceError, CanonicalInsufficientMarginError, CanonicalPriceBoundError, CanonicalOrderRejectedError, CanonicalMarketClosedError, CanonicalInstrumentHaltedError, CanonicalDuplicateOrderError, CanonicalPositionLimitExceededError, CanonicalSizeLimitError, CanonicalInstrumentNotTradeableError, CanonicalContractExpiredError, CanonicalMaintenanceModeError

**D. Schema/response:** CanonicalSchemaError

**E. Fallback:** CanonicalError

**Module:** `normalize/errors.py`. Assume any provider may send malformed data. See [SCHEMA_NORMALIZATION_GAPS_AUDIT.md](./SCHEMA_NORMALIZATION_GAPS_AUDIT.md) §2.17 for full table.

## 5. Proxy Schemas and Optional Fields

**Proxy schemas:** Where a provider lacks explicit support (e.g. no ping), use a proxy to the same concept: heartbeat = ping, keepalive = ping, first successful message = implicit connect. Document per-provider which proxy is used.

**Optional fields:** Canonical types (e.g. CanonicalDerivativeTicker) have most fields optional. Populate only what the provider offers; document per-provider which fields are None. Example: Hyperliquid has funding_rate, open_interest, mark_price → populate those; leave predicted_funding_rate, borrow_long_rate as None.

## 6. Gaps (See GAPS Audit)

Liquidations, derivative ticker, options chain, fees, reference data, bonds/CDS, FX futures, commodities, corporate actions, market state, connectivity, **errors** — all have raw schemas but **no normalizers**. See [SCHEMA_NORMALIZATION_GAPS_AUDIT.md](./SCHEMA_NORMALIZATION_GAPS_AUDIT.md) for full gap list and remediation.
