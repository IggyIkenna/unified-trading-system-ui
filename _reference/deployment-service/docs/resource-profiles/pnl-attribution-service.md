# Resource Profile: pnl-attribution-service

## Deployment Mode

- Mode: batch
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value           | Rationale                                                                                                             |
| ----------- | --------------- | --------------------------------------------------------------------------------------------------------------------- |
| CPU         | 2 vCPU          | P&L decomposition calculations (factor attribution, Greeks); compute-bound for large portfolios                       |
| Memory      | 8 Gi            | Loads full trade history + market prices for attribution period; multi-leg positions need cross-instrument price data |
| Timeout     | 86400 s (24 hr) | Maximum — full historical attribution over large trade histories                                                      |
| Max retries | 3               | Idempotent; retry on transient GCS or execution results failures                                                      |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                        | Invocations/day | Avg duration    | Est. monthly cost |
| ------------------------------- | --------------- | --------------- | ----------------- |
| Daily end-of-day attribution    | 1               | 1800 s (30 min) | ~$1.10            |
| Monthly full portfolio backfill | 1               | 10800 s (3 hr)  | ~$6.45            |

Assumptions: 2 vCPU + 8 Gi; daily attribution on live portfolio positions.

## Data Flow

- **Source:** GCS execution results bucket (trade history) + GCS market data buckets (closing prices for mark-to-market)
- **Sink:** GCS P&L attribution reports bucket + BigQuery P&L attribution table

## Attribution Dimensions

- Factor attribution (market, sector, instrument-specific)
- Strategy attribution (which strategy generated each P&L component)
- Greeks attribution (for options positions: delta, gamma, vega, theta P&L)

## Special Requirements

- Upstream dependency: execution-service must have completed for the target period
- Requires market data closing prices from market-data-processing-service
- BigQuery write access required for P&L analytics queries

## Source References

- `deployment-service/terraform/services/pnl-attribution-service/gcp/variables.tf`
- `deployment-service/configs/services/pnl-attribution-service/batch.env`
