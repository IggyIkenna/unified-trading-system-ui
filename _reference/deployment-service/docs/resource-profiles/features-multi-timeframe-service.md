# Resource Profile: features-multi-timeframe-service

## Deployment Mode

- Mode: batch
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value           | Rationale                                                                                    |
| ----------- | --------------- | -------------------------------------------------------------------------------------------- |
| CPU         | 2 vCPU          | Rolling window feature computation across 7 timeframes (15s–24h); CPU-bound for pandas/numpy |
| Memory      | 8 Gi            | Holds full OHLCV history for all timeframes concurrently to compute aligned features         |
| Timeout     | 86400 s (24 hr) | Maximum — computing features at 7 timeframes × CEFI universe is time-intensive               |
| Max retries | 3               | Idempotent; retry on transient failures                                                      |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                | Invocations/day | Avg duration    | Est. monthly cost |
| ----------------------- | --------------- | --------------- | ----------------- |
| Daily incremental       | 1               | 2700 s (45 min) | ~$1.60            |
| Full timeframe backfill | 1               | 14400 s (4 hr)  | ~$8.60            |

Assumptions: 2 vCPU + 8 Gi; 7 output timeframes: 15s, 1m, 5m, 15m, 1h, 4h, 24h.

## Data Flow

- **Source:** GCS market data buckets (raw candles per timeframe)
- **Sink:** GCS features bucket (multi-timeframe aligned feature sets)

## Feature Groups Produced

- Aligned OHLCV across all timeframes for use in ML model training
- Lagged features (1, 3, 5, 10 candle lookback) at each timeframe

## Special Requirements

- Upstream dependency: market-data-processing-service must have completed all 7 timeframes for the target date range
- Memory scales with number of instruments × timeframes; BINANCE-SPOT (2000+ instruments) is the worst case

## Source References

- `deployment-service/terraform/services/features-multi-timeframe-service/gcp/variables.tf`
