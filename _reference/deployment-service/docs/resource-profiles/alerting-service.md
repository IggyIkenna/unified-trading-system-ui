# Resource Profile: alerting-service

## Deployment Mode

- Mode: both (batch + live)
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job (batch polling) + Cloud Workflow (live, triggered every 5 minutes)

## Resource Allocation

### Batch / Live Polling Mode

| Resource    | Value         | Rationale                                                                           |
| ----------- | ------------- | ----------------------------------------------------------------------------------- |
| CPU         | 1 vCPU        | Lightweight — reads positions and sends alert notifications; no heavy computation   |
| Memory      | 1 Gi          | Small in-memory state; only current position snapshot needed                        |
| Timeout     | 240 s (4 min) | Shorter than the 5 min Cloud Scheduler poll interval to prevent overlap             |
| Max retries | 1             | Alerts are idempotent but re-firing is noisy; fail fast and let next poll handle it |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                   | Invocations/day | Avg duration | Est. monthly cost |
| -------------------------- | --------------- | ------------ | ----------------- |
| Live polling (every 5 min) | 288             | 30 s         | ~$0.10            |
| Peak (high alert volume)   | 288             | 120 s        | ~$0.40            |

Assumptions: 1 vCPU + 1 Gi; billed per invocation. Cost is negligible — service is I/O bound waiting on PubSub.

## Data Flow

- **Source:** PubSub (position_events topic) + Secret Manager (alert thresholds)
- **Sink:** GCS (alert audit log) + external notification endpoints (Slack/PagerDuty)
- **Event bus:** PubSub (publishes alert dispatched events)

## Special Requirements

- Cloud Scheduler SA must have `run.jobs.run` permission on the Cloud Run Job
- Live workflow triggered via Cloud Workflows on the `*/5 * * * *` cron schedule (UTC)

## Source References

- `deployment-service/terraform/services/alerting-service/gcp/variables.tf`
- `deployment-service/configs/services/alerting-service/batch.env`
- `deployment-service/configs/services/alerting-service/live.env`
