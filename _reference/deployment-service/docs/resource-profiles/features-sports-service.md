# Resource Profile: features-sports-service

## Deployment Mode

- Mode: batch
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job

## Resource Allocation

### Batch Mode

| Resource    | Value           | Rationale                                                                     |
| ----------- | --------------- | ----------------------------------------------------------------------------- |
| CPU         | 2 vCPU          | Feature computation over sports odds and market movement data                 |
| Memory      | 8 Gi            | Loads odds history across multiple sports, leagues, and bookmakers            |
| Timeout     | 86400 s (24 hr) | Maximum — sports universe is broad (multiple leagues, many markets per event) |
| Max retries | 3               | Idempotent; retry on transient API or GCS failures                            |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario            | Invocations/day | Avg duration    | Est. monthly cost |
| ------------------- | --------------- | --------------- | ----------------- |
| Daily incremental   | 1               | 1800 s (30 min) | ~$1.10            |
| Historical backfill | 1               | 7200 s (2 hr)   | ~$4.30            |

Assumptions: 2 vCPU + 8 Gi; daily incremental is the typical pattern during sporting seasons.

## Data Flow

- **Source:** GCS market data buckets (SPORTS category tick data from market-tick-data-service)
- **Sink:** GCS features bucket (sports features)

## Special Requirements

- Upstream dependency: market-tick-data-service must have fetched SPORTS category data (via OpticOdds/OddsJam scrapers)
- Sports API keys required in Secret Manager: `odds-api-key`, `oddsjam-api-key`, `opticodds-api-key`
- Features are only relevant during active sporting seasons; batch frequency can be reduced in off-season

## Source References

- `deployment-service/terraform/services/features-sports-service/gcp/variables.tf`
