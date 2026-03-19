# Resource Profiles — All Services

This directory contains per-service resource profiles documenting CPU/memory allocation, cost estimates,
deployment mode, and special requirements for all 22 services with Terraform configurations.

See [TEMPLATE.md](TEMPLATE.md) for the document structure used in each profile.

## Service Index

| Service                                                                   | CPU      | Memory  | Timeout | Mode  | Resource Class | Notes                                                      |
| ------------------------------------------------------------------------- | -------- | ------- | ------- | ----- | -------------- | ---------------------------------------------------------- |
| [alerting-service](alerting-service.md)                                   | 1 vCPU   | 1 Gi    | 4 min   | both  | Small          | Polls every 5 min                                          |
| [execution-results-api](execution-results-api.md)                         | 1 vCPU   | 2 Gi    | 14 min  | batch | Small          | Exchange results reconciliation                            |
| [execution-service](execution-service.md)                                 | 4 vCPU   | 16 Gi   | 4 hr    | both  | Large          | Live min-instances=1                                       |
| [features-calendar-service](features-calendar-service.md)                 | 1 vCPU   | 1 Gi    | 10 min  | batch | Small          | Cheapest feature service                                   |
| [features-commodity-service](features-commodity-service.md)               | 2 vCPU   | 8 Gi    | 24 hr   | batch | Medium         | TRADFI dependency                                          |
| [features-cross-instrument-service](features-cross-instrument-service.md) | 4 vCPU   | 16 Gi   | 24 hr   | batch | Large          | Cross-asset correlation matrices                           |
| [features-delta-one-service](features-delta-one-service.md)               | 2 vCPU   | 8 Gi    | 24 hr   | batch | Medium         | Publishes FEATURES_READY event                             |
| [features-multi-timeframe-service](features-multi-timeframe-service.md)   | 2 vCPU   | 8 Gi    | 24 hr   | batch | Medium         | 7 output timeframes                                        |
| [features-onchain-service](features-onchain-service.md)                   | 1 vCPU   | 4 Gi    | 30 min  | batch | Small          | DeFi API aggregation; shared output bucket                 |
| [features-sports-service](features-sports-service.md)                     | 2 vCPU   | 8 Gi    | 24 hr   | batch | Medium         | Season-dependent frequency                                 |
| [features-volatility-service](features-volatility-service.md)             | 2 vCPU   | 8 Gi    | 24 hr   | batch | Medium         | Options surface computation                                |
| [instruments-service](instruments-service.md)                             | 2 vCPU   | 4 Gi    | 24 hr   | batch | Medium         | First in pipeline DAG                                      |
| [market-data-api](market-data-api.md)                                     | 2 vCPU   | 4 Gi    | 14 min  | batch | Medium         | Read-only GCS query API                                    |
| [market-data-processing-service](market-data-processing-service.md)       | 2–8 vCPU | 8–32 Gi | 24 hr   | batch | Medium–Large   | BINANCE shards need 32 Gi; VM for heavy venues             |
| [market-tick-data-service](market-tick-data-service.md)                   | 8 vCPU   | 64 Gi   | 24 hr   | both  | X-Large        | **COINBASE shard: c2-standard-60 VM required (see below)** |
| [ml-inference-service](ml-inference-service.md)                           | 2 vCPU   | 8 Gi    | 24 hr   | both  | Medium         | Live min-instances=1                                       |
| [ml-training-service](ml-training-service.md)                             | 4 vCPU   | 16 Gi   | 4 hr    | batch | Large          | Most expensive batch service                               |
| [pnl-attribution-service](pnl-attribution-service.md)                     | 2 vCPU   | 8 Gi    | 24 hr   | batch | Medium         | Needs execution results + market data                      |
| [position-balance-monitor-service](position-balance-monitor-service.md)   | 1 vCPU   | 2 Gi    | 4 min   | both  | Small          | Polls every 5 min during live trading                      |
| [risk-and-exposure-service](risk-and-exposure-service.md)                 | 4 vCPU   | 16 Gi   | 24 hr   | both  | Large          | Live min-instances=1; Monte Carlo VaR                      |
| [strategy-service](strategy-service.md)                                   | 2 vCPU   | 8 Gi    | 24 hr   | both  | Medium         | Live min-instances=1; CascadeSubscriber                    |

## Resource Classes

| Class   | CPU    | Memory | Typical Use                                        |
| ------- | ------ | ------ | -------------------------------------------------- |
| Small   | 1 vCPU | 1–2 Gi | I/O-bound polling, calendar, API queries           |
| Medium  | 2 vCPU | 4–8 Gi | Per-instrument feature computation, batch ML       |
| Large   | 4 vCPU | 16 Gi  | Cross-asset computation, training, execution       |
| X-Large | 8 vCPU | 64 Gi  | Full exchange universe download (market-tick-data) |

## Critical VM Requirement: market-tick-data-service COINBASE Shard

The COINBASE shard of market-tick-data-service **cannot run on Cloud Run**.

- Largest BTC-USD order book snapshot file: **409 MB on disk (~1.2 GB in memory)**
- With 8 concurrent workers: **peak ~10 GB per file × workers = exceeds Cloud Run 32 Gi limit**
- Required VM: **c2-standard-60** (60 vCPU, 240 GB RAM)
- Required disk: **500 GB** (≥ 2× RAM for swap + temp files)
- Cloud Run max memory is 32 Gi; COINBASE in-memory peak far exceeds this

See [market-tick-data-service.md](market-tick-data-service.md) for full details.

## Pipeline DAG (Simplified)

```
instruments-service
    └── market-tick-data-service
            └── market-data-processing-service
                    ├── features-delta-one-service  ──── (FEATURES_READY) ──► ml-inference-service
                    ├── features-volatility-service                               └── (PREDICTIONS_READY) ──► strategy-service
                    ├── features-multi-timeframe-service
                    ├── features-onchain-service                                                                            └── execution-service
                    ├── features-calendar-service
                    ├── features-commodity-service
                    ├── features-sports-service
                    └── features-cross-instrument-service (needs delta-one + volatility first)

ml-training-service (runs separately on schedule; writes to model store read by ml-inference-service)

execution-service ──► execution-results-api ──► pnl-attribution-service
                  └──► risk-and-exposure-service (parallel, always-on in live mode)

Monitoring (always-on in live mode):
    alerting-service
    position-balance-monitor-service
```

## Cost Summary (Approximate Monthly)

| Category                    | Services                                     | Est. Monthly Cost     |
| --------------------------- | -------------------------------------------- | --------------------- |
| Always-on live services     | execution, risk, ml-inference, strategy (4×) | ~$150                 |
| Daily batch (data pipeline) | market-tick, market-data-processing          | ~$300–$500            |
| Daily batch (features)      | 8 feature services                           | ~$50–$100             |
| Periodic batch              | ml-training (weekly/monthly)                 | ~$100–$500            |
| Low-frequency               | pnl-attribution, validation, APIs            | ~$20                  |
| **Total**                   |                                              | **~$620–$1270/month** |

Estimates assume production-level data volume. Actual costs depend on number of shards dispatched per day.
