# Deployment System Architecture

**Last Updated:** 2026-03-07
**Repos:** deployment-service · deployment-api · deployment-ui · system-integration-tests

---

## Overview

The deployment system is a four-repo cluster that manages the deployment lifecycle for all services in
the Unified Trading System. It is a **standalone operational tool** — no trading service imports from
it or depends on it at runtime.

```
deployment-service     Core orchestration engine (shard calculator, VM/Cloud Run backends, config)
deployment-api         FastAPI service exposing deployment operations over HTTP
deployment-ui          React web UI (port 5173) for self-service deployment management
system-integration-tests   Layer 3 smoke + e2e tests that validate deployments end-to-end
```

---

## How Services Relate to the Deployment System

Services **are managed by** the deployment system — they do not import from it.

| Services DO                                                 | Services DO NOT                                     |
| ----------------------------------------------------------- | --------------------------------------------------- |
| Run inside containers orchestrated by deployment-service    | Import deployment-service as a Python dependency    |
| Expose `/health` and `/readiness` endpoints                 | Call deployment-api at runtime                      |
| Emit `SERVICE_STARTED` / `SERVICE_STOPPED` lifecycle events | Know about shard calculation or deployment topology |

---

## deployment-service

The orchestration engine. Standalone CLI tool and library; no FastAPI server.

```
deployment_service/
├── shard_calculator.py      # Parallelise work across date/venue/symbol dimensions
├── orchestrator.py          # Multi-service deployment sequencing
├── monitor.py               # Deployment status monitoring
├── dependencies.py          # Service dependency graph (topological order)
├── catalog.py               # Data catalog tracking
├── cloud_client.py          # Cloud-agnostic storage (wraps get_storage_client())
├── config_loader.py         # Runtime topology + config loading
├── config/
│   ├── base_config.py
│   ├── config_validator.py
│   └── env_substitutor.py   # Template substitution (# config-bootstrap layer)
├── backends/
│   ├── vm.py                # Compute Engine VM backend
│   ├── cloud_run.py         # Cloud Run backend
│   └── provider_factory.py  # Backend selection
└── cli/                     # Click commands: deploy, monitor, shard
```

### Deployment Modes

| Mode  | Transport    | Compute                       | Trigger              |
| ----- | ------------ | ----------------------------- | -------------------- |
| Batch | Date-sharded | Cloud Run ephemeral jobs      | Cloud Build / cron   |
| Live  | Scheduled    | Cloud Run persistent / GCE VM | Cloud Build on merge |

### Sharding

Shard calculator partitions work across (date × venue × symbol) then dispatches shards to parallel
Cloud Run jobs or VMs. Zone failover and quota management are handled by `backends/`.

---

## deployment-api

FastAPI HTTP service that exposes deployment-service operations for the UI and operator tooling.

```
deployment_api/
├── api/routes/
│   ├── deployments.py   # POST /deployments, GET /deployments/{id}
│   ├── data_status.py   # GET /data-status
│   └── health.py        # GET /health, GET /readiness
└── services/
    ├── deployment_manager.py
    └── deployment_state.py
```

Auth: operator IAM service account token. Not exposed to the internet — internal VPC only.

---

## deployment-ui

React SPA at port 5173. Communicates exclusively with deployment-api over the internal VPC.

---

## system-integration-tests

Layer 3 (smoke + e2e) tests per the 5-layer integration testing strategy:

- **Layer 3a smoke**: fast pre-deploy gate — `/health`, `/readiness` on all services
- **Layer 3b e2e**: full pipeline smoke — deploy → run batch → verify outputs in GCS

---

## Deployment Model

This service uses **runtime-driven deployment** rather than declarative Terraform per-service.

### Why no Terraform Cloud Run / ECS task definitions?

Cloud Run Jobs and ECS task definitions are intentionally NOT defined in Terraform.
All service compute resources are deployed at runtime by the deployment-service backends:

- `backends/cloud_run.py` — deploys GCP Cloud Run Jobs programmatically via the Google Cloud Run SDK
- `backends/aws_batch.py` — submits AWS Batch jobs programmatically via boto3
- `backends/vm.py` — provisions VMs for long-running workloads

**Rationale:**

- Services have dynamic config (env vars, resource limits) that changes per-run
- Terraform state would require plan/apply cycles for each service version update
- Runtime deployment enables per-run parameterisation without IaC overhead
- Secrets are injected at runtime from Secret Manager, not baked into Terraform

**GCP Terraform scope** (`terraform/gcp/main.tf`): GCS buckets, BigQuery datasets, Secret Manager secrets, IAM bindings, Artifact Registry

**AWS Terraform scope** (`terraform/aws/main.tf`): S3 buckets, Athena workgroup/databases, Secrets Manager stubs, IAM role, ECS cluster (cluster only — no task definitions)

This is intentional and documented. Cloud Run Jobs and ECS task definitions are
managed by the deployment-service runtime backends, not Terraform.

---

## Infrastructure as Code

Terraform modules in `deployment-service/terraform/`:

```
terraform/
├── gcp/main.tf   # GCS buckets, BigQuery, Secret Manager, IAM (NO Cloud Run definitions)
└── aws/main.tf   # S3 buckets, Athena, Secrets Manager, IAM, ECS cluster (NO task definitions)
```

Additional IaC in `deployment-service/infra/`:

```
infra/
└── ibkr-gateway/   # IB Gateway infrastructure (IBKR connectivity)
```

---

## Design Principles

1. **Services are unaware of deployment tooling.** No deployment-service import in any trading service.
2. **Cloud-agnostic.** `cloud_client.py` routes through `get_storage_client()` from `unified-cloud-interface`.
   Direct cloud SDK usage only in `unified_cloud_interface/providers/` (approved permanent exception).
3. **Topology SSOT.** Runtime topology decisions come from `unified-trading-pm/configs/runtime-topology.yaml`,
   read via `unified_config_interface.topology_reader`. deployment-service does not duplicate this.
4. **Parallel by default.** Shard calculator maximises parallelism; sequential is the fallback for
   services with strict DAG ordering.

---

## Key Technologies

| Layer         | Technology                        |
| ------------- | --------------------------------- |
| Orchestration | Python 3.13, Click CLI            |
| API           | FastAPI, uvicorn                  |
| UI            | React, Vite                       |
| CI/CD         | Cloud Build (GCP), GitHub Actions |
| IaC           | Terraform                         |
| Containers    | Docker, Artifact Registry         |
| Observability | UEI log_event(), Cloud Monitoring |
