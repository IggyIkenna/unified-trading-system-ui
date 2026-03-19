# Resource Profile: features-delta-one-service

## Deployment Mode

- Mode: batch
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value           | Rationale                                                                                               |
| ----------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| CPU         | 2 vCPU          | Per-instrument feature computation (momentum, funding rates, open interest); parallelised by instrument |
| Memory      | 8 Gi            | Loads multi-timeframe OHLCV + order book data per instrument; buffer for parallel workers               |
| Timeout     | 86400 s (24 hr) | Maximum — full CEFI universe (BINANCE 2000+ instruments) across multiple feature groups                 |
| Max retries | 3               | Idempotent; retry on transient GCS or upstream failures                                                 |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                 | Invocations/day | Avg duration   | Est. monthly cost |
| ------------------------ | --------------- | -------------- | ----------------- |
| Daily incremental (CEFI) | 1               | 3600 s (1 hr)  | ~$2.15            |
| Full universe backfill   | 1               | 21600 s (6 hr) | ~$12.90           |

Assumptions: 2 vCPU + 8 Gi; daily incremental is the primary run pattern.

## Data Flow

- **Source:** GCS market data buckets (candles via market-data-processing-service)
- **Sink:** GCS features bucket
- **Events:** Publishes `FEATURES_READY` event on PubSub after completion (triggers ml-inference-service)

## Feature Groups Produced

- `momentum` — price momentum at multiple timeframes
- `funding_oi` — funding rates and open interest (CEFI perpetuals)
- `basis` — spot/futures basis spread
- `microstructure` — bid-ask spread, order book imbalance

## Special Requirements

- Upstream dependency: market-data-processing-service must complete for the target date
- `onchain_perps` feature group deprecated — use features-onchain-service instead

## Source References

- `deployment-service/terraform/services/features-delta-one-service/gcp/variables.tf`
- `deployment-service/configs/services/features-delta-one-service/batch.env`
