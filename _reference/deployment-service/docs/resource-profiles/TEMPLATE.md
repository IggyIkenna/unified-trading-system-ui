# Resource Profile: <service-name>

## Deployment Mode

- Mode: batch | live | both
- Cloud Run region: us-central1 (or asia-northeast1 — see per-service doc)
- Execution: Cloud Run Job (batch) | Cloud Run Service (live)

## Resource Allocation

### Batch Mode

| Resource      | Value      | Rationale                         |
| ------------- | ---------- | --------------------------------- |
| CPU           | X vCPU     | ...                               |
| Memory        | XGi        | ...                               |
| Timeout       | Xs (X min) | ...                               |
| Max retries   | X          | ...                               |
| Min instances | X          | N/A for batch jobs                |
| Max instances | X          | Controlled by sharding dispatcher |

### Live Mode (if applicable)

| Resource      | Value  | Rationale                             |
| ------------- | ------ | ------------------------------------- |
| CPU           | X vCPU | ...                                   |
| Memory        | XGi    | ...                                   |
| Timeout       | Xs     | ...                                   |
| Min instances | X      | Keep-warm to avoid cold-start latency |
| Max instances | X      | Scale ceiling                         |

## Cost Estimate

GCP Cloud Run pricing (vCPU-second: $0.00002400, GB-second: $0.00000250).

| Scenario     | Invocations/day | Avg duration | Est. monthly cost |
| ------------ | --------------- | ------------ | ----------------- |
| Normal batch | X               | X min        | $X–$Y             |
| Peak         | X               | X min        | $X–$Y             |

Assumptions: costs calculated on active execution time only (Cloud Run Jobs billed per invocation duration).

## VM Override (if applicable)

Some shards (e.g., COINBASE) exceed Cloud Run memory limits and must run on Compute Engine VMs.

| Resource     | Value          |
| ------------ | -------------- |
| Machine type | c2-standard-XX |
| RAM          | XXX GB         |
| Disk         | XXX GB         |
| Preemptible  | No             |

## Special Requirements

- Any special networking, GPU, or storage requirements
- Note any per-venue overrides from sharding YAML

## Source References

- `deployment-service/terraform/services/<service>/gcp/variables.tf`
- `deployment-service/configs/services/<service>/batch.env`
- `deployment-service/configs/sharding.<service>.yaml` (if applicable)
