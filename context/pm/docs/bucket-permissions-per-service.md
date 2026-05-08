# Bucket Permissions Per Service

**Source of truth:** `deployment-service/configs/dependencies.yaml` and `deployment-service/configs/bucket_config.yaml`

**SA used in CI:** `github-actions-deploy@central-element-323112.iam.gserviceaccount.com` **CI role:**
`roles/storage.admin` (sufficient for all read/write/list operations) **Production:** Each service uses a per-service SA
with narrower permissions (principle of least privilege)

---

## Per-Service Bucket Access Matrix

| Service                              | Reads From                                                                                                                                                                     | Writes To                                                                                                      |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| **instruments-service**              | —                                                                                                                                                                              | `instruments-store-{category}-{project_id}`                                                                    |
| **corporate-actions**                | `instruments-store-tradfi-{project_id}`                                                                                                                                        | `instruments-store-tradfi-{project_id}` (corporate_actions/ path)                                              |
| **market-tick-data-service**         | `instruments-store-{category}-{project_id}`                                                                                                                                    | `market-data-tick-{category}-{project_id}`                                                                     |
| **market-data-processing-service**   | `market-data-tick-{category}-{project_id}`, `instruments-store-{category}-{project_id}`                                                                                        | `market-data-tick-{category}-{project_id}` (processed_candles/), `market-data-candles-{category}-{project_id}` |
| **features-calendar-service**        | —                                                                                                                                                                              | `features-calendar-{project_id}`                                                                               |
| **features-delta-one-service**       | `market-data-tick-{category}-{project_id}`, `features-calendar-{project_id}`                                                                                                   | `features-delta-one-{category}-{project_id}`                                                                   |
| **features-volatility-service**      | `market-data-tick-{category}-{project_id}`, `features-calendar-{project_id}`                                                                                                   | `features-volatility-{category}-{project_id}` (cefi/tradfi only — no defi)                                     |
| **features-onchain-service**         | `market-data-tick-{category}-{project_id}`, `features-calendar-{project_id}`                                                                                                   | `features-onchain-{project_id}`                                                                                |
| **features-sports-service**          | —                                                                                                                                                                              | `features-sports-{project_id}`                                                                                 |
| **ml-training-service**              | `features-delta-one-{category}-{project_id}`, `features-volatility-*`, `features-onchain-*`, `features-calendar-*`                                                             | `ml-models-store-{project_id}`, `ml-configs-store-{project_id}`                                                |
| **ml-inference-service**             | `ml-models-store-{project_id}`, `features-delta-one-{category}-{project_id}`, `features-calendar-*`, `features-volatility-*`, `features-onchain-*`                             | `ml-predictions-store-{project_id}`                                                                            |
| **strategy-service**                 | `ml-predictions-store-{project_id}`, `features-delta-one-{category}-{project_id}`, `instruments-store-*`, `risk-store-{project_id}-{category}`, `positions-store-{project_id}` | `strategy-store-{project_id}`                                                                                  |
| **execution-service**                | `strategy-store-{project_id}`, `market-data-tick-{category}-{project_id}`, `instruments-store-{category}-{project_id}`, `execution-store-{project_id}` (config)                | `execution-store-{project_id}`                                                                                 |
| **position-balance-monitor-service** | `execution-store-{project_id}`, `instruments-store-{category}-{project_id}`                                                                                                    | `positions-store-{project_id}`                                                                                 |
| **pnl-attribution-service**          | `positions-store-{project_id}-{category}`, `market-data-tick-{category}-{project_id}`, `instruments-store-{project_id}`                                                        | `pnl-store-{project_id}-{category}`                                                                            |
| **risk-and-exposure-service**        | `positions-store-{project_id}-{category}`, `market-data-tick-{category}-{project_id}`, `pnl-store-{project_id}-{category}`                                                     | `risk-store-{project_id}-{category}`                                                                           |

---

## Infrastructure Buckets (not service-owned, always-present)

| Bucket                                       | Owner / Purpose                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `terraform-state-{project_id}`               | infrastructure — Terraform remote state                                  |
| `deployment-orchestration-{project_id}`      | infrastructure — deployment pipeline artefacts                           |
| `databento-batch-registry-asia-{project_id}` | unified-trading-library — Databento batch job registry                   |
| `config-store-{project_id}`                  | unified-config-interface — shared runtime config                         |
| `positions-store-{project_id}`               | position-balance-monitor-service — shared positions (no category suffix) |
| `ml-configs-store-{project_id}`              | ml-training-service — ML hyperparameter configs and experiment metadata  |

---

## Notes

- `{category}` expands to `cefi`, `tradfi`, or `defi` depending on the market domain
- `{project_id}` = `central-element-323112` in production
- Test buckets follow the pattern `{bucket-name}-test-{project_id}` (GCS infix naming)
- `features-sports-service` uses a shared bucket (no category suffix) — added to `shared_bucket_services` in
  `bucket_config.yaml`
- `ml-configs-store` exists in GCS but was missing from `infrastructure_buckets` in `bucket_config.yaml` — now added

---

## Per-Service Quality Gate Integration

Per-service bucket permission smoke tests (real GCS read/write against test buckets in `quality-gates.sh`) are tracked
separately. See plan:
[`unified-trading-pm/plans/active/cloud_infra_bucket_auth_2026_03_10.md`](../plans/active/cloud_infra_bucket_auth_2026_03_10.md)
(todo `per-repo-bucket-permissions-check`).

The decision to defer per-repo QG integration: modifying all ~20 service `quality-gates.sh` files is a large
cross-cutting change that should be done in a dedicated wave with proper coordination. The SIT smoke tests in
`system-integration-tests/tests/smoke/test_cloud_infra_smoke.py` provide system-level bucket auth coverage in the
meantime.
