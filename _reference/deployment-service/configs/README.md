# Deployment Configuration Checklists

Two-checklist model:

- **Codex `unified-trading-codex/10-audit/`** = comprehensive codex compliance (100+ items, all 9 principle areas) ← CANONICAL
- **`deployment-v3/configs/`** = deployment readiness delta (infrastructure-specific items only)

The codex checklists are the source of truth for compliance. These deployment checklists only track infrastructure provisioning items not covered by the codex.

## Infrastructure Items Tracked Here

Each `checklist.{service}.yaml` covers only:

- Dockerfile / containerization readiness
- Cloud Build config and trigger setup
- GCS bucket provisioning and IAM
- Terraform resource definitions
- Sharding config, dependencies config, expected-start-dates config
- Deployment CLI smoke-check
- Image build verification

## Key Files

| Pattern                         | Purpose                                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `checklist.{service}.yaml`      | Deployment readiness delta (infra-specific items only)                                                         |
| `checklist.template.yaml`       | Template for new services                                                                                      |
| `checklist.prerequisites.yaml`  | One-time infra setup (GCP/AWS project, IAM, networking)                                                        |
| `sharding.{service}.yaml`       | Shard dimensions (category, venue, date, etc.)                                                                 |
| `data-catalogue.{service}.yaml` | GCS paths, output structure                                                                                    |
| `dependencies.yaml`             | Service dependency-readiness checks (derived readiness view, not primary SSOT).                                |
| `runtime-topology.yaml`         | Runtime topology SSOT: transport selection by mode + deployment profile (e.g. co-located in-memory live path). |
| `venues.yaml`                   | Canonical venue–category mappings                                                                              |
| `cloud-providers.yaml`          | GCP/AWS project and region config                                                                              |

## Checklist Usage

1. Copy `checklist.template.yaml` to `checklist.{service}.yaml`
2. Set `status` per item: `done`, `partial`, `pending`, `n/a`
3. Add `verified_date` when complete
4. For code-quality compliance tracking, use the canonical codex checklists at `unified-trading-codex/10-audit/`

## Sharding Config

Shard dimensions are defined in `sharding.{service}.yaml`. The deployment CLI uses these to compute combinatorics. See [docs/CLI.md](../docs/CLI.md).

## Deployment Flexibility (dependencies.yaml)

Upstream entries use `required: true` (must have) or `required: false` (optional, can_use). This file is a derived readiness/check model from the primary SSOTs and enables different deployment topologies without code changes:

- **features-delta-one** can use: market-data-processing, features-calendar, market-tick-data-service
- **features-volatility** can use: market-data-processing, features-calendar (in addition to market-tick-data-service)
- **features-onchain** can use: features-calendar, market-tick-data-service (in addition to market-data-processing)
- **ml-training** can use: market-tick-data-service, features-calendar, market-data-processing (in addition to features-\*)
- **ml-inference** can use: features-calendar, features-volatility, features-onchain (in addition to ml-training, features-delta-one)
- **strategy-service** can use: market-data-processing, features-volatility, features-onchain, market-tick-data-service, features-calendar, risk-and-exposure, position-balance-monitor
- **execution-service** can use: features-delta-one, features-calendar (in addition to strategy, market-tick-data-service, instruments)
- **risk-and-exposure** can use: pnl-attribution. Does NOT need Order/Algo (talks to strategy for risk management).

## Runtime Topology SSOT (runtime-topology.yaml)

Two primary machine-readable SSOTs:

- `unified-trading-pm/workspace-manifest.json` defines _what code components exist and their DAG/dependencies_.
- `runtime-topology.yaml` defines _how runtime interaction happens_ (service flows, API interactions, storage patterns, transport by mode/profile).

`dependencies.yaml` is a derived readiness subset used for dependency checks.

`runtime-topology.yaml` defines runtime behavior by mode and deployment profile:

- `mode=batch|live`
- `deployment_profile=distributed|co_located_vm`
- `transport=storage|pubsub|in_memory`
- `dependency_check=gcs|none`

Example: `market-data-processing-service <- market-tick-data-service` can run:

- `batch`: `storage` (`gcs` dependency check enabled)
- `live` on `co_located_vm`: `in_memory` (`dependency_check: none`)

This keeps hybrid live coupling in deployment config, not service import wiring.
