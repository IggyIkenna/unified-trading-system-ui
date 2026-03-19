# Resource Profile: features-volatility-service

## Deployment Mode

- Mode: batch
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value           | Rationale                                                                                  |
| ----------- | --------------- | ------------------------------------------------------------------------------------------ |
| CPU         | 2 vCPU          | Volatility surface estimation (GARCH, realized vol, implied vol interpolation); CPU-bound  |
| Memory      | 8 Gi            | Options chain data across expiries per instrument; DERIBIT universe has dense strike grids |
| Timeout     | 86400 s (24 hr) | Maximum — full options universe across all instruments is time-intensive                   |
| Max retries | 3               | Idempotent; retry on transient failures                                                    |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario              | Invocations/day | Avg duration    | Est. monthly cost |
| --------------------- | --------------- | --------------- | ----------------- |
| Daily incremental     | 1               | 2700 s (45 min) | ~$1.60            |
| Full surface backfill | 1               | 10800 s (3 hr)  | ~$6.45            |

Assumptions: 2 vCPU + 8 Gi; DERIBIT options universe is the primary driver of runtime.

## Data Flow

- **Source:** GCS market data buckets (CEFI options and futures candles; TRADFI options via CBOE)
- **Sink:** GCS features bucket

## Feature Groups Produced

- Realized volatility (rolling windows: 5d, 10d, 30d, 90d)
- Implied volatility surface (term structure + strike skew)
- Volatility risk premium (RVP = implied - realized)
- VIX-equivalent indices for crypto instruments

## Special Requirements

- Upstream dependency: market-data-processing-service must have processed OPTION instrument types
- CBOE VIX data requires TRADFI market data to be available

## Source References

- `deployment-service/terraform/services/features-volatility-service/gcp/variables.tf`
- `deployment-service/configs/services/features-volatility-service/batch.env`
