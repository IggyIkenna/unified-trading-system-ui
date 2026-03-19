# Resource Profile: features-cross-instrument-service

## Deployment Mode

- Mode: batch
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value           | Rationale                                                                                       |
| ----------- | --------------- | ----------------------------------------------------------------------------------------------- |
| CPU         | 4 vCPU          | Cross-instrument correlation matrices are compute-intensive; parallelised over instrument pairs |
| Memory      | 16 Gi           | Must hold OHLCV matrices for all instruments simultaneously to compute pair-wise correlations   |
| Timeout     | 86400 s (24 hr) | Maximum — computing rolling correlations across 2000+ instrument pairs is time-intensive        |
| Max retries | 3               | Idempotent; retry on transient failures                                                         |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                      | Invocations/day | Avg duration   | Est. monthly cost |
| ----------------------------- | --------------- | -------------- | ----------------- |
| Daily incremental (CEFI only) | 1               | 3600 s (1 hr)  | ~$4.25            |
| Full cross-asset run          | 1               | 10800 s (3 hr) | ~$12.75           |

Assumptions: 4 vCPU + 16 Gi; cross-instrument is the most resource-intensive feature service.

## Data Flow

- **Source:** GCS features bucket (upstream per-instrument features from delta-one + volatility)
- **Sink:** GCS features bucket (`features-cross-instrument-{project_id}`)

## Special Requirements

- Upstream dependency: features-delta-one-service and features-volatility-service must complete first
- Cross-instrument correlations span CEFI, TRADFI, DEFI — all category buckets must be available

## Source References

- `deployment-service/terraform/services/features-cross-instrument-service/gcp/variables.tf`
- `deployment-service/configs/services/features-cross-instrument-service/batch.env`
