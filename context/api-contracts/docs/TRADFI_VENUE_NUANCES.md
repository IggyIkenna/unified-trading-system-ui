# TradFi Venue Nuances: Databento, IBKR, Symbol Formats

TradFi coverage: **IBKR + Databento** (~506 venues). No direct CME/NASDAQ/NYSE.

## Symbol Format Comparison

| System        | Format Example        | Notes                                  |
| ------------- | --------------------- | -------------------------------------- |
| **CCXT**      | `BTC/USDT`, `VIX/USD` | Unified: `BASE/QUOTE`                  |
| **IBKR**      | `VIX`, `ES`, `AAPL`   | TWS: `symbol` + `secType` + `exchange` |
| **Databento** | `ES.c.0`, `AAPL`      | Raw exchange symbol per dataset        |
| **Canonical** | `CBOE:INDEX:VIX-USD`  | Our instrument_key format              |

### CCXT Symbol Format

- `BASE/QUOTE` (e.g. `BTC/USDT`, `VIX/USD`)
- Used by CeFi adapters; not used for TradFi (Databento/IBKR)

### IBKR Symbol Format

- **Stocks**: `AAPL`, `SPY`
- **Index**: `VIX`, `SPX`
- **Futures**: `ES`, `NQ`, `VIX` (with `lastTradeDateOrContractMonth` for expiry)
- **Options**: `AAPL` + `strike` + `right` (C/P) + `expiry`
- **secType**: `STK`, `IND`, `FUT`, `OPT`, `CASH`, `CFD`
- **exchange**: `SMART`, `CBOE`, `CME`, `NYMEX`, etc.

### Databento Symbol Format

- **Raw symbol** per dataset (e.g. `ES.c.0` for CME E-mini, `AAPL` for XNAS)
- **dataset_id** determines venue: `GLBX.MDP3` (CME), `XNAS.ITCH` (NASDAQ), `OPRA.PILLAR` (options)
- **instrument_id**: Databento internal ID; use symbology API to map raw_symbol ↔ instrument_id
- **publisher_id**: Venue identifier (~506 publishers)

## Dataset → Canonical Venue Mapping

| Databento dataset_id | Canonical Venue | Notes                    |
| -------------------- | --------------- | ------------------------ |
| GLBX.MDP3            | CME             | Futures, options         |
| XNAS.ITCH            | NASDAQ          | Equities                 |
| XNYS.ITCH            | NYSE            | Equities                 |
| OPRA.PILLAR          | OPRA            | Options (incl. VIX opts) |
| DBEQ.BASIC           | DBEQ            | US equities (basic)      |
| IFEU.IMPACT          | ICE             | EU derivatives           |

Full list: https://databento.com/docs/api-reference-historical/metadata/list-datasets

## VIX Data Sources

| Source        | Type        | Granularity | Live?          | Schema                           |
| ------------- | ----------- | ----------- | -------------- | -------------------------------- |
| **Barchart**  | Historical  | 15m         | No             | BarchartOhlcv15m                 |
| **Databento** | Index (dev) | TBD         | In development | DatabentoOhlcvBar when available |
| **IBKR**      | TWS stream  | Real-time   | Yes            | IBKRTicker, IBKRBar              |

**VIX live research**: Databento VIX index listed "in development"; IBKR TWS can stream VIX index/futures with market data subscription. See docs/VIX_LIVE_RESEARCH.md.
