# Resource Profile: features-commodity-service

## Deployment Mode

- Mode: batch
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value           | Rationale                                                                             |
| ----------- | --------------- | ------------------------------------------------------------------------------------- |
| CPU         | 2 vCPU          | Commodity feature computation (rolling stats, correlation) across instrument universe |
| Memory      | 8 Gi            | Loads multi-year OHLCV history for commodity instruments + rolling window buffers     |
| Timeout     | 86400 s (24 hr) | Maximum — large historical backfills over commodity futures chains can be slow        |
| Max retries | 3               | Idempotent; retry on transient GCS or BigQuery failures                               |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario              | Invocations/day | Avg duration    | Est. monthly cost |
| --------------------- | --------------- | --------------- | ----------------- |
| Daily incremental     | 1               | 1800 s (30 min) | ~$1.10            |
| Monthly full backfill | 1               | 14400 s (4 hr)  | ~$8.80            |

Assumptions: 2 vCPU + 8 Gi; daily incremental is typical runtime.

## Data Flow

- **Source:** GCS market data buckets (candles — TRADFI commodity venues)
- **Sink:** GCS features bucket

## Special Requirements

- Depends on market-data-processing-service having processed TRADFI candles first
- FRED adapter API key required for macro commodity indices (fred-api-key in Secret Manager)

## Source References

- `deployment-service/terraform/services/features-commodity-service/gcp/variables.tf`
