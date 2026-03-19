# Resource Profile: ml-inference-service

## Deployment Mode

- Mode: both (batch scoring + live inference)
- Cloud Run region: asia-northeast1
- Execution: Cloud Run Job (batch) | Cloud Run Service (live)

## Resource Allocation

### Batch Mode (Scoring)

| Resource    | Value           | Rationale                                                                      |
| ----------- | --------------- | ------------------------------------------------------------------------------ |
| CPU         | 2 vCPU          | Model inference across instrument universe; LightGBM/XGBoost are CPU-efficient |
| Memory      | 8 Gi            | Loads model artefacts + feature matrix for all instruments simultaneously      |
| Timeout     | 86400 s (24 hr) | Maximum — scoring over multiple models × instruments × timeframes              |
| Max retries | 3               | Idempotent; retry on transient GCS or model store failures                     |

### Live Mode (Real-time Inference)

| Resource      | Value  | Rationale                                                                               |
| ------------- | ------ | --------------------------------------------------------------------------------------- |
| CPU           | 2 vCPU | Single-instrument inference is fast; parallelised per inference request                 |
| Memory        | 8 Gi   | Must hold all live model artefacts in memory to avoid cold-load latency                 |
| Min instances | 1      | Keep-warm: model loading is slow (~10–30s); cold start unacceptable during live trading |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario                   | Invocations/day | Avg duration  | Est. monthly cost |
| -------------------------- | --------------- | ------------- | ----------------- |
| Daily batch scoring        | 1               | 3600 s (1 hr) | ~$2.15            |
| Live inference (always-on) | always-on       | 86400 s       | ~$25/month        |

Assumptions: 2 vCPU + 8 Gi; live mode billed continuously.

## Data Flow

- **Source (batch):** GCS features bucket (features-delta-one, features-volatility, features-multi-timeframe)
- **Source (live):** PubSub `FEATURES_READY` event + feature vectors from features-delta-one-service
- **Sink:** GCS predictions bucket; PubSub `PREDICTIONS_READY` event (triggers strategy-service)
- **Model store:** GCS models bucket (`uts-prod-models/models/`)

## Special Requirements

- Upstream dependency: ml-training-service must have trained and uploaded model artefacts to GCS
- Live mode subscribes to `FEATURES_READY` PubSub topic (published by features-delta-one-service)
- Model naming convention: `{CATEGORY}_{ASSET}_{target-type}_{MODEL-TYPE}_{TIMEFRAME}_V{N}`

## Source References

- `deployment-service/terraform/services/ml-inference-service/gcp/variables.tf`
- `deployment-service/configs/services/ml-inference-service/live.env`
