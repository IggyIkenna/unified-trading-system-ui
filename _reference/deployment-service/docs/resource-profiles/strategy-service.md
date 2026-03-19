# Resource Profile: strategy-service

## Deployment Mode

- Mode: both (batch backtesting + live signal generation)
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job (batch) | Cloud Run Service (live)

## Resource Allocation

### Batch Mode (Backtesting / Signal Generation)

| Resource    | Value           | Rationale                                                                                   |
| ----------- | --------------- | ------------------------------------------------------------------------------------------- |
| CPU         | 2 vCPU          | Strategy logic evaluation across instrument universe; parallelised by strategy × instrument |
| Memory      | 8 Gi            | Loads feature vectors + model predictions for all instruments over backtest window          |
| Timeout     | 86400 s (24 hr) | Maximum — full historical backtest across multi-year feature history                        |
| Max retries | 3               | Idempotent; retry on transient failures                                                     |

### Live Mode (Signal Generation)

| Resource      | Value  | Rationale                                                                               |
| ------------- | ------ | --------------------------------------------------------------------------------------- |
| CPU           | 2 vCPU | Real-time strategy evaluation on incoming prediction events                             |
| Memory        | 8 Gi   | Holds strategy state and recent feature history for all active instruments              |
| Min instances | 1      | Always-on: subscribes to `PREDICTIONS_READY` PubSub topic; cold start would miss events |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                           | Invocations/day | Avg duration  | Est. monthly cost |
| ---------------------------------- | --------------- | ------------- | ----------------- |
| Daily backtest run                 | 1               | 3600 s (1 hr) | ~$2.15            |
| Live signal generation (always-on) | always-on       | 86400 s       | ~$25/month        |

Assumptions: 2 vCPU + 8 Gi; live mode billed continuously.

## Data Flow

- **Source (batch):** GCS features + GCS predictions (from ml-inference-service)
- **Source (live):** PubSub `PREDICTIONS_READY` event + live feature vectors
- **Sink:** GCS signals bucket; PubSub `SIGNALS_READY` event (triggers execution-service)

## Special Requirements

- Upstream dependency (live): ml-inference-service must publish `PREDICTIONS_READY` first
- CascadeSubscriber wired in live mode to consume upstream prediction events
- Strategy validation performed by batch-live-reconciliation-service (T+1) before signals are forwarded to execution-service

## Source References

- `deployment-service/terraform/services/strategy-service/gcp/variables.tf`
- `deployment-service/configs/services/strategy-service/batch.env`
- `deployment-service/configs/services/strategy-service/live.env`
