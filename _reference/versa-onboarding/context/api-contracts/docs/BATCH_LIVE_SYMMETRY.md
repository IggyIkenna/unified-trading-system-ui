# Batch-Live Symmetry Contract

**SSOT:** `docs/UAC_FULL_GAP_ANALYSIS_AND_BATCH_LIVE_SYMMETRY.md` §2
**Date:** 2026-03-05

---

## Core Contract

> **If two raw records represent the same logical event, their normalized canonical output MUST be equal for all shared fields.**

Normalizers are **pure functions**. No `if mode == "batch"` or `if source == "live"` branching is allowed inside any `normalize/*.py` file. Aggregation, routing, and fan-out are the caller's responsibility.

---

## Per-Venue Source Mapping

### Binance

| Data Type  | Live Source                                                 | Batch Source                   |
| ---------- | ----------------------------------------------------------- | ------------------------------ |
| Trades     | WebSocket `wss://stream.binance.com:9443/ws/<symbol>@trade` | Tardis GCS (`tardis/binance/`) |
| Order Book | WebSocket `@depth` stream                                   | Tardis GCS (`tardis/binance/`) |
| Ticker     | WebSocket `@ticker` stream                                  | —                              |
| OHLCV      | WebSocket `@kline_<interval>`                               | Databento / Tardis             |

**Normalizers:** `normalize_binance_trade`, `normalize_binance_orderbook`, `normalize_binance_ticker`, `normalize_binance_kline`
**Fields that may differ by source:** `received_at` (ingestion timestamp), `sequence` (WS-only); all trade/price/qty/side fields MUST match.

---

### Bybit

| Data Type  | Live Source                                       | Batch Source                 |
| ---------- | ------------------------------------------------- | ---------------------------- |
| Trades     | WebSocket `wss://stream.bybit.com/v5/public/spot` | Tardis GCS (`tardis/bybit/`) |
| Order Book | WebSocket `orderbook.<depth>.<symbol>`            | Tardis                       |

**Normalizers:** `normalize_bybit_trade`, `normalize_bybit_orderbook`, `normalize_bybit_ticker`, `normalize_bybit_kline`

---

### OKX

| Data Type  | Live Source                                    | Batch Source               |
| ---------- | ---------------------------------------------- | -------------------------- |
| Trades     | WebSocket `wss://ws.okx.com:8443/ws/v5/public` | Tardis GCS (`tardis/okx/`) |
| Order Book | WebSocket `books` channel                      | Tardis                     |

**Normalizers:** `normalize_okx_trade`, `normalize_okx_orderbook`, `normalize_okx_ticker`, `normalize_okx_kline`

---

### Deribit

| Data Type  | Live Source                                     | Batch Source                   |
| ---------- | ----------------------------------------------- | ------------------------------ |
| Trades     | WebSocket `wss://www.deribit.com/ws/api/v2`     | Tardis GCS (`tardis/deribit/`) |
| Order Book | WebSocket `book.<instrument_name>.<interval>`   | Tardis                         |
| Options    | WebSocket `ticker.<instrument_name>.<interval>` | Tardis option quotes           |

**Normalizers:** `normalize_deribit_trade`, `normalize_deribit_orderbook`, `normalize_deribit_option_ticker`, `normalize_tardis_option_quote`

---

### Coinbase

| Data Type  | Live Source                                      | Batch Source |
| ---------- | ------------------------------------------------ | ------------ |
| Trades     | WebSocket `wss://advanced-trade-ws.coinbase.com` | —            |
| Order Book | WebSocket `level2` channel                       | —            |

**Normalizers:** `normalize_coinbase_trade`, `normalize_coinbase_orderbook`, `normalize_coinbase_ticker`

---

### Hyperliquid

| Data Type | Live Source                                                      | Batch Source |
| --------- | ---------------------------------------------------------------- | ------------ |
| Trades    | WebSocket `wss://api.hyperliquid.xyz/ws` (`trades` subscription) | —            |
| Ticker    | WebSocket `allMids` / `webData2`                                 | —            |

**Normalizers:** `normalize_hyperliquid_order`, `normalize_hyperliquid_fill`, `normalize_hyperliquid_ticker`, `normalize_hyperliquid_derivative_ticker`, `normalize_hyperliquid_orderbook`
**Gap:** No batch source available for Hyperliquid (live-only venue).

---

### Tardis (batch aggregator)

Tardis is a **batch-only** source that replays normalized venue data in original format. Symbol format is venue-native (uppercase, passed through unchanged by `normalize_symbol("tardis", raw)`).

| Data Type       | Schema                 | Normalizer                         |
| --------------- | ---------------------- | ---------------------------------- |
| Trade           | `TardisTrade`          | `normalize_tardis_trade`           |
| Order Book      | `TardisOrderBook`      | `normalize_tardis_orderbook`       |
| Option Quote    | `TardisOptionQuote`    | `normalize_tardis_option_quote`    |
| WS Subscription | `TardisWSSubscription` | `normalize_tardis_ws_subscription` |

---

### Databento (batch aggregator)

Databento provides normalized CME/CBOT/NYMEX data with fixed-point prices (divide by 1e9).

| Data Type             | Schema                    | Normalizer                                                       |
| --------------------- | ------------------------- | ---------------------------------------------------------------- |
| Trade (MBO)           | `DatabentoTrade`          | `normalize_databento_trade` / `normalize_databento_mbo_to_trade` |
| Order Book (MBP-1)    | `DatabentoMBP1`           | `normalize_databento_mbp1_orderbook`                             |
| Order Book (MBP-10)   | `DatabentoMBP10`          | `normalize_databento_mbp10_orderbook`                            |
| Order Book (BBO-1s)   | `DatabentoBBO1s`          | `normalize_databento_bbo1s_orderbook`                            |
| Order Book (BBO-1m)   | `DatabentoBBO1m`          | `normalize_databento_bbo1m_orderbook`                            |
| Order Book (TBBO)     | `DatabentoTBBO`           | `normalize_databento_tbbo_orderbook`                             |
| Order Book (CMBP-1)   | `DatabentoCMBP1`          | `normalize_databento_cmbp1_orderbook`                            |
| OHLCV Bar             | `DatabentoOHLCVBar`       | `normalize_databento_ohlcv_bar`                                  |
| Option Quote          | `DatabentoOptionQuote`    | `normalize_databento_option_quote`                               |
| CME Option Quote      | `DatabentoCMEOptionQuote` | `normalize_databento_cme_option_quote`                           |
| Instrument Definition | `DatabentoDefinition`     | `normalize_databento_definition`                                 |
| Symbol Mapping        | `DatabentoSymbolMapping`  | `normalize_databento_symbol`                                     |

---

## Per-Normalizer Field Variance

The following fields are **allowed** to differ between live and batch sources for the same logical event:

| Field         | Reason                                                   | Guidance                                |
| ------------- | -------------------------------------------------------- | --------------------------------------- |
| `received_at` | Ingestion wall-clock time                                | Never assert equal in parity tests      |
| `sequence`    | WS-only; batch may be 0 or None                          | Skip if None                            |
| `raw`         | Original raw payload (optional)                          | Not in canonical output                 |
| `venue`       | May differ: live=`"binance"`, batch=`"BINANCE"` (Tardis) | Normalize to lowercase before comparing |

All other canonical fields (`trade_id`, `price`, `quantity`, `side`, `symbol`, `timestamp`) MUST be equal for matching logical events.

---

## Symmetry Helpers (Phase A)

| Helper                         | Module                 | Purpose                                            |
| ------------------------------ | ---------------------- | -------------------------------------------------- | --------- |
| `normalize_symbol(venue, raw)` | `normalize/symbols.py` | Convert venue-native symbol to `BASE-QUOTE[-PERP   | -EXPIRY]` |
| `normalize_side(raw)`          | `normalize/sides.py`   | Convert any side string/int to `"buy"` or `"sell"` |

All normalizers that set `symbol` or `side` MUST use these helpers. See audit checklist in `UAC_FULL_GAP_ANALYSIS_AND_BATCH_LIVE_SYMMETRY.md` §2.A–C.

---

## Timestamp Contract

All normalizers MUST:

1. Accept `timestamp_ms: int | None` or `timestamp_iso: str | None` as override.
2. Convert the raw timestamp to `datetime` with `tzinfo=timezone.utc`.
3. Use `datetime.now(timezone.utc)` **only** when the raw record has no timestamp.

Nanosecond timestamps (Databento): divide by `1_000_000_000` to get seconds, then construct UTC datetime.
Millisecond timestamps (Binance, Bybit, OKX): divide by `1_000`.
ISO-8601 strings: parse with `datetime.fromisoformat()`, ensure UTC.

---

## Parity Test Contract

**File:** `tests/test_batch_live_parity.py`

For each venue pair (live source + batch/Tardis source) with overlapping trade data:

1. Construct equivalent raw records for the same logical event.
2. Normalize both independently.
3. Assert equality on: `trade_id`, `price`, `quantity`, `side`, `symbol` (after symbol normalization).
4. Skip: `received_at`, `sequence`, `venue` (case-insensitive compare allowed).

---

## References

- `docs/UAC_FULL_GAP_ANALYSIS_AND_BATCH_LIVE_SYMMETRY.md`
- `normalize/symbols.py` — symbol normalization SSOT
- `normalize/sides.py` — side normalization SSOT
- `tests/test_batch_live_parity.py` — parity tests
- `unified-trading-codex/04-architecture/batch-live-symmetry.md`
