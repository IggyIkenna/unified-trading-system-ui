# Resource Profile: position-balance-monitor-service

## Deployment Mode

- Mode: both (batch reconciliation + live monitoring)
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job (polling, scheduled every 5 minutes in live mode)

## Resource Allocation

### Batch / Live Polling Mode

| Resource    | Value         | Rationale                                                                                                                   |
| ----------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| CPU         | 1 vCPU        | Lightweight position query and comparison; network-bound, not CPU-bound                                                     |
| Memory      | 2 Gi          | Holds current positions + expected positions for drift comparison; larger than alerting-service due to position vector size |
| Timeout     | 240 s (4 min) | Shorter than the 5 min poll interval to prevent overlapping job executions                                                  |
| Max retries | 1             | Position snapshots are point-in-time; stale retries are misleading; fail fast                                               |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                   | Invocations/day | Avg duration | Est. monthly cost |
| -------------------------- | --------------- | ------------ | ----------------- |
| Live polling (every 5 min) | 288             | 60 s         | ~$0.20            |
| Daily reconciliation batch | 1               | 120 s        | ~$0.01            |

Assumptions: 1 vCPU + 2 Gi; monitor runs in tight poll loop during trading hours.

## Data Flow

- **Source:** Exchange position APIs (via UTEI adapters) + GCS internal position state
- **Sink:** GCS position snapshots; PubSub alerts topic (on position drift detected)
- **Live env backend:** Secret Manager (config), PubSub (event bus)

## Special Requirements

- Exchange read API keys required (read-only position query)
- Alerts when actual exchange positions diverge from internal expected positions by > threshold
- Live mode uses Cloud Scheduler to trigger every 5 minutes (same pattern as alerting-service)
- Timeout intentionally 4 min to prevent job overlap; if query takes > 4 min, investigate exchange API latency

## Source References

- `deployment-service/terraform/services/position-balance-monitor-service/gcp/variables.tf`
- `deployment-service/configs/services/position-balance-monitor-service/live.env`
