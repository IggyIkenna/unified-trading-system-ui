# Per-venue data types: trades, OHLCV, orderbook, ticker, funding, liquidations

Single source of truth for which data types each venue/data vendor provides. Align with `venue_manifest.py` and `INDEX.md`.

| Venue             | trades | OHLCV      | orderbook | ticker  | funding      | liquidations | Notes                                          |
| ----------------- | ------ | ---------- | --------- | ------- | ------------ | ------------ | ---------------------------------------------- |
| **databento**     | ✓      | ✓ (1m, 1s) | ✓ MBP-1   | —       | —            | —            | Historical; symbology, definition              |
| **tardis**        | ✓      | —          | ✓         | —       | —            | —            | Exchanges, instruments, trades, book           |
| **ccxt**          | ✓      | —          | ✓         | ✓       | per exchange | —            | Unified; Binance, OKX, Bybit, Upbit, etc.      |
| **binance**       | ✓      | ✓ klines   | ✓         | ✓       | ✓ (futures)  | ✓ (futures)  | REST + WebSocket                               |
| **okx**           | ✓      | ✓          | ✓         | ✓       | ✓            | ✓            | UMI adapter                                    |
| **bybit**         | ✓      | ✓          | ✓         | ✓       | ✓            | ✓            | UMI adapter                                    |
| **deribit**       | ✓      | —          | ✓         | ✓       | ✓            | —            | Options chain                                  |
| **hyperliquid**   | ✓      | —          | ✓         | ✓       | ✓            | ✓            | On-chain perps                                 |
| **aster**         | ✓      | —          | ✓         | ✓       | ✓            | ✓            | On-chain perps                                 |
| **upbit**         | ✓      | —          | ✓         | ✓       | —            | —            | CeFi full surface                              |
| **coinbase**      | ✓      | ✓ candles  | ✓         | ✓       | —            | —            | Spot only                                      |
| **ibkr**          | ✓      | ✓ bars     | —         | ✓       | —            | —            | TWS/ib_insync                                  |
| **yahoo_finance** | —      | ✓ 24h      | —         | ✓ quote | —            | —            | OHLCV daily, splits, dividends; TradFi adapter |
| **barchart**      | —      | ✓ 15m      | —         | —       | —            | —            | VIX index (CBOE); manual CSV dumps             |
| **thegraph**      | —      | —          | —         | —       | —            | —            | Subgraph-specific (swaps, pools, reserves)     |
| **alchemy**       | —      | —          | —         | —       | —            | —            | RPC/API; DeFi fallback                         |

## Schema mapping

| Venue         | OHLCV schema      | Ticker schema | Trades schema  | Orderbook schema |
| ------------- | ----------------- | ------------- | -------------- | ---------------- |
| databento     | DatabentoOhlcvBar | —             | DatabentoTrade | DatabentoMbp1    |
| tardis        | —                 | —             | TardisTrade    | TardisOrderBook  |
| binance       | BinanceKline      | BinanceTicker | BinanceTrade   | BinanceOrderBook |
| yahoo_finance | YahooOhlcv24h     | YahooQuote    | —              | —                |
| barchart      | BarchartOhlcv15m  | —             | —              | —                |

## Yahoo Finance and Barchart (TradFi external providers)

- **yahoo_finance**: Daily OHLCV (YahooOhlcv24h), quote (YahooQuote), splits (YahooSplits), dividends (YahooDividends). Used for FX (KRW/USD), equities, ETFs. No trades, orderbook, funding, liquidations.
- **barchart**: 15-minute OHLCV (BarchartOhlcv15m). Used for VIX index (CBOE). Manual CSV dumps; no API, no live. No trades, orderbook, ticker, funding, liquidations.
