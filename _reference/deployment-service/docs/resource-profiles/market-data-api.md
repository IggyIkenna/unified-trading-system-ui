# Resource Profile: market-data-api

## Deployment Mode

- Mode: batch (query/export job)
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value          | Rationale                                                                                             |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| CPU         | 2 vCPU         | REST API serving with parallel request handling                                                       |
| Memory      | 4 Gi           | Buffers query results for market data exports; response payloads can be large (bulk candle downloads) |
| Timeout     | 840 s (14 min) | Allows time for paginated bulk exports; shorter than feature services                                 |
| Max retries | 1              | API calls are not idempotent from client perspective; fail fast                                       |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario          | Invocations/day | Avg duration | Est. monthly cost |
| ----------------- | --------------- | ------------ | ----------------- |
| Bulk data export  | 4               | 300 s        | ~$0.60            |
| Interactive query | 20              | 30 s         | ~$0.30            |

Assumptions: 2 vCPU + 4 Gi; API is used both for bulk exports and interactive data queries.

## Data Flow

- **Source:** GCS market data buckets (candles, tick data)
- **Sink:** API response (streaming or buffered)

## Special Requirements

- Read-only access to market data GCS buckets
- No exchange API keys required (reads from processed data only)

## Source References

- `deployment-service/terraform/services/market-data-api/gcp/variables.tf`
