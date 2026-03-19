# UAC Full Gap Analysis + Batch-Live Symmetry Spec

**Date:** 2026-03-05
**SSOT:** Combined from SCHEMA_NORMALIZATION_GAPS_AUDIT, sports/alt-data audit, and batch-live-symmetry requirements.

---

## 1. Consolidated Gap Analysis

### 1.1 CeFi Core (Trades, Orderbooks, Tickers, Orders, Fills)

| Venue        | Trade | OrderBook | Ticker | Order | Fill | Fee | Error |
| ------------ | ----- | --------- | ------ | ----- | ---- | --- | ----- |
| binance      | ✓     | ✓         | ✓      | ✓     | ✓    | ✓   | ✓     |
| bybit        | ✓     | ✓         | ✓      | ✓     | ✓    | ✓   | ✓     |
| okx          | ✓     | ✓         | ✓      | ✓     | ✓    | ✓   | ✓     |
| coinbase     | ✓     | ✓         | ✓      | ✓     | ✓    | ✓   | ✓     |
| deribit      | ✓     | ✓         | ✓      | ✓     | ✓    | ✓   | ✓     |
| hyperliquid  | ✓     | —         | ✓      | ✓     | ✓    | ✓   | ✓     |
| upbit        | ✓     | ✓         | ✓      | ✓     | —    | —   | ✓     |
| aster        | ✓     | ✓         | ✓      | ✓     | —    | —   | —     |
| ccxt         | ✓     | ✓         | ✓      | ✓     | ✓    | ✓   | ✓     |
| tardis       | ✓     | ✓         | —      | —     | —    | —   | ✓     |
| databento    | ✓     | ✓ (6)     | —      | —     | —    | —   | —     |
| ibkr         | —     | —         | ✓      | ✓     | ✓    | —   | ✓     |
| fix          | —     | —         | —      | ✓     | ✓    | —   | —     |
| prime_broker | —     | —         | —      | —     | ✓    | —   | —     |
| nautilus     | —     | —         | —      | ✓     | ✓    | —   | —     |

**Gaps:** Hyperliquid orderbook; Tardis ticker/order/fill; Databento ticker/order/fill/fee/error; aster/upbit errors; fix/prime_broker/nautilus errors.

---

### 1.2 OHLCV, Options, Instruments

| Provider  | OHLCV | Options | Instruments            |
| --------- | ----- | ------- | ---------------------- |
| databento | ✓     | ✓ (2)   | ✓ (definition, symbol) |
| tardis    | —     | —       | —                      |
| binance   | —     | —       | —                      |
| bybit     | —     | —       | —                      |
| okx       | —     | —       | —                      |
| deribit   | —     | —       | —                      |
| ibkr      | —     | —       | —                      |
| yahoo     | —     | —       | —                      |

**Gaps:** OHLCV for tardis, binance, bybit, okx, ccxt; Options for tardis, deribit, yahoo, ibkr; Reference (BinanceSymbol, BybitMarket, OKXMarket, CcxtMarket, DeribitInstrument, IBKRContractDetails).

---

### 1.3 Derivative Ticker, Liquidations

| Provider    | Derivative Ticker | Liquidation (market) | Liquidation (own) |
| ----------- | ----------------- | -------------------- | ----------------- |
| binance     | —                 | —                    | —                 |
| bybit       | —                 | —                    | —                 |
| okx         | —                 | —                    | —                 |
| deribit     | —                 | —                    | —                 |
| hyperliquid | —                 | —                    | —                 |
| tardis      | —                 | —                    | —                 |
| dydx        | —                 | —                    | —                 |

**Gaps:** All. CanonicalDerivativeTicker and CanonicalLiquidation exist or must be added; no normalizers.

---

### 1.4 Sports & Prediction Markets

| Provider             | Market | Odds | Order | Error |
| -------------------- | ------ | ---- | ----- | ----- |
| kalshi               | ✓      | ✓    | ✓     | ✓     |
| polymarket           | ✓      | —    | —     | ✓     |
| betfair              | ✓      | ✓    | —     | ✓     |
| betdaq               | ✓      | —    | —     | —     |
| smarkets             | ✓      | —    | —     | —     |
| pinnacle             | ✓      | —    | —     | —     |
| manifold             | ✓      | ✓    | —     | —     |
| odds_api             | ✓      | —    | —     | —     |
| predictit            | —      | —    | —     | —     |
| matchbook            | —      | —    | —     | —     |
| ~20 other bookmakers | —      | —    | —     | —     |

**Gaps:** PredictIt (all); odds/order for betdaq, smarkets, pinnacle, odds_api, polymarket; matchbook; 20+ bookmakers.

---

### 1.5 Alt Data

| Provider   | Schema | Normalizer | Canonical Type      |
| ---------- | ------ | ---------- | ------------------- |
| fred       | —      | —          | —                   |
| ofr        | —      | —          | CanonicalBondData   |
| ecb        | —      | —          | CanonicalYieldCurve |
| openbb     | —      | —          | —                   |
| barchart   | —      | —          | —                   |
| footystats | —      | —          | —                   |
| understat  | —      | —          | —                   |
| glassnode  | —      | —          | —                   |
| coingecko  | —      | —          | —                   |
| arkham     | —      | —          | —                   |
| pyth       | —      | —          | —                   |
| defillama  | —      | —          | —                   |
| regulatory | —      | —          | —                   |

**Gaps:** All. No external schemas, no canonical types, no normalizers.

---

### 1.6 Errors (50+ Venues)

**Implemented (~14):** alchemy, betfair, binance, bybit, ccxt, coinbase, deribit, hyperliquid, ibkr, kalshi, okx, polymarket, tardis, upbit.

**Gaps:** kraken, kucoin, gateio, bitfinex, bitstamp, mexc, huobi, bitget, dydx, databento, fix, prime_broker, nautilus, betdaq, smarkets, pinnacle, manifold, predictit, aster, and all alt-data providers.

---

### 1.7 Rate Limits, Connectivity, Market State

| Area                | Status                          | Gap                                                                    |
| ------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| Rate limits         | extract_rate_limit_headers only | Full §4 of RATE_LIMIT_HANDLING_GAPS.md (6 steps)                       |
| WebSocket lifecycle | —                               | CanonicalWebSocketLifecycle; ping/pong/disconnect/connect per endpoint |
| Market state        | —                               | MarketState normalization                                              |

---

## 2. Batch-Live Symmetry Specification

### 2.1 Principle

**Same canonical output regardless of source.** Whether data comes from live WebSocket, batch GCS/Parquet, REST API, or multi-venue aggregator, the normalizer must produce **identical** `Canonical*` instances for equivalent logical events.

### 2.2 Current State

Normalizers are pure functions — no `if mode == "batch"` or `if source == "live"` inside `normalize/*.py`. This is correct.

### 2.3 Required Additions for Full Symmetry

#### A. Symbol Normalization (NEW)

```
normalize/symbols.py
  normalize_symbol(venue: str, raw: str) -> str
  - binance: BTCUSDT -> BTC-USDT
  - coinbase: BTC-USD -> BTC-USDT (or venue-specific)
  - deribit: BTC-PERPETUAL -> BTC-PERP
  SSOT: docs/SYMBOL_NORMALIZATION_MAP.md
```

Every normalizer that sets `symbol` should use this (or document venue-specific format).

#### B. Timestamp Contract

All normalizers MUST:

- Accept `timestamp_ms: int | None` or `timestamp_iso: str | None` as override
- Convert to `datetime` with `tzinfo=timezone.utc`
- Use `datetime.now(UTC)` only when raw has no timestamp

#### C. Side Normalization

```
normalize/sides.py
  normalize_side(raw: str | int) -> Literal["buy", "sell"]
  - "BUY"|"buy"|1 -> "buy"
  - "SELL"|"sell"|2 -> "sell"
```

Use in trades, orders, fills.

#### D. Live-Batch Parity Tests

Add `tests/test_batch_live_parity.py`:

- For venues with both live and batch sources (e.g. Binance: WebSocket + Tardis)
- Fetch equivalent logical event (same trade_id) from both
- Normalize both
- Assert `canonical_live == canonical_batch` (or equal for relevant fields)

#### E. Documentation

`docs/BATCH_LIVE_SYMMETRY.md`:

- Per-venue: live source (WebSocket URL), batch source (GCS path / Tardis / Databento)
- Per-normalizer: which fields may differ by source
- Contract: "If raw records represent the same logical event, normalized output MUST be equal."

---

## 3. Normalization for EVERYTHING (Regardless of Venue Count)

### 3.1 Single-Venue vs Multi-Venue

| Scenario                | Normalization                                     | Notes                                          |
| ----------------------- | ------------------------------------------------- | ---------------------------------------------- |
| One venue, live         | `normalize_binance_trade(raw)`                    | Same as batch                                  |
| One venue, batch        | `normalize_binance_trade(raw)`                    | Same as live                                   |
| Many venues, aggregator | Loop: `for r in records: normalize_ccxt_trade(r)` | Each record normalized independently           |
| Many venues, mixed      | Route by `venue`; call `normalize_<venue>_trade`  | Caller routes; normalizers stay venue-specific |

**Rule:** Normalizers never branch on venue count. They take one raw record and return one canonical. Aggregation is the caller's responsibility.

### 3.2 What Must Exist for "EVERYTHING"

1. Every external schema has a corresponding `normalize_<provider>_<schema>`.
2. Every canonical type has at least one normalizer producing it.
3. Symbol/side/timestamp helpers are used consistently.
4. Matrix script generates `SCHEMA_AUDIT_MATRIX.md` with 0 gaps (or documented exceptions).
5. Parity tests for venues with live + batch sources.

---

## 4. Implementation Checklist (Ordered)

### Phase A — Symmetry Foundation

- [x] Add `normalize/symbols.py` + `normalize_symbol(venue, raw) -> str`
- [x] Add `normalize/sides.py` + `normalize_side(raw) -> Literal["buy","sell"]`
- [ ] Audit all normalizers: timestamp handling, symbol usage
- [x] Add `docs/BATCH_LIVE_SYMMETRY.md`
- [x] Add `tests/test_batch_live_parity.py`

### Phase B — CeFi Gaps

- [x] Hyperliquid orderbook (`normalize_hyperliquid_orderbook` — HyperliquidL2Book)
- [ ] Tardis ticker, OHLCV
- [x] Databento error normalizer (`normalize_databento_error`)
- [x] aster, upbit, fix, prime_broker, nautilus error normalizers

### Phase C — Derivative & Liquidation

- [ ] CanonicalDerivativeTicker + normalizers (binance, bybit, okx, deribit, hyperliquid, tardis)
- [ ] CanonicalLiquidation + normalizers (market + own per venue)

### Phase D — Reference Data

- [ ] BinanceSymbol, BybitMarket, OKXMarket, CcxtMarket, DeribitInstrument, IBKRContractDetails → CanonicalMarketInfo/InstrumentRecord

### Phase E — Options Chain

- [ ] Tardis, Deribit, Yahoo, IBKR → CanonicalOptionsChainEntry

### Phase F — Sports Completion

- [ ] PredictIt (schema + normalizers)
- [ ] Odds/order for betdaq, smarkets, pinnacle, odds_api, polymarket
- [ ] Matchbook, 20+ bookmakers (as needed)

### Phase G — Alt Data

- [ ] Canonical types (CanonicalBondData, CanonicalYieldCurve, CanonicalMacroSeries, etc.)
- [ ] External schemas for fred, ofr, ecb, openbb, barchart, footystats, understat, glassnode, coingecko, arkham, pyth, defillama, regulatory
- [ ] Normalizers for each

### Phase H — Errors & Rate Limits

- [x] Error normalizers: kraken, kucoin, gateio, bitfinex, bitstamp, mexc, huobi, bitget, dydx, databento, fix, prime_broker, nautilus, aster, betdaq, smarkets, pinnacle, manifold (18 new; 35 total including previous 15+2)
- [ ] Remaining: predictit, matchbook, odds_api, openbb, fred, ofr, ecb, glassnode, coingecko, arkham, pyth, defillama, regulatory (alt-data venues)
- [ ] Full rate limit handling per RATE_LIMIT_HANDLING_GAPS.md §4

### Phase I — Connectivity & Market State

- [x] CanonicalWebSocketLifecycle + normalizers (11 functions)
- [ ] MarketState normalization

### Phase J — Matrix & Validation

- [ ] Enhance `scripts/generate_schema_audit_matrix.py` to cover all providers, sports, alt data
- [ ] Run matrix; achieve 0 gaps or document exceptions
- [ ] UAC test coverage ≥70%

---

## 5. References

- `docs/SCHEMA_NORMALIZATION_GAPS_AUDIT.md`
- `docs/SCHEMA_AUDIT_MATRIX.md`
- `docs/RATE_LIMIT_HANDLING_GAPS.md`
- `unified-trading-codex/04-architecture/batch-live-symmetry.md`
- `unified-trading-pm/plans/active/uac_schema_normalization_complete.plan.md`
