# VIX Live Streaming Research

**Current state (batch):** Barchart manual CSV dumps → `BarchartOhlcv15m` schema → market-tick-data-service → GCS. Instrument: `CBOE:INDEX:VIX-USD`.

**Gap:** We need live VIX streaming (index or futures) for real-time strategies.

## Research Targets

| Provider      | Status               | Notes                                                                   |
| ------------- | -------------------- | ----------------------------------------------------------------------- |
| **Databento** | Index in development | VIX options (OPRA) available; VIX index real-time/historical on roadmap |
| **IBKR**      | Available            | TWS API streams VIX index/futures; requires market data subscription    |
| **CBOE**      | Direct               | CBOE direct feed; evaluate cost/coverage                                |
| **Others**    | TBD                  | Document as we find them                                                |

## Barchart Batch (Current)

- **Schema**: `BarchartOhlcv15m` (Time, Open, High, Low, Last, Volume)
- **Source**: Manual CSV from Barchart subscription
- **Path**: `market-tick-data-service/data/vix/vix_intraday-15min_historical-data-*.csv`
- **No API, no live** — migrate when Databento index or IBKR VIX streaming is chosen

## Migration Path

1. **Short term**: Keep Barchart batch; document schema in unified-api-contracts (done)
2. **When Databento index ships**: Add Databento VIX schemas; migrate market-tick-data-service
3. **When IBKR VIX chosen**: Add IBKR VIX streaming schemas; integrate TWS
