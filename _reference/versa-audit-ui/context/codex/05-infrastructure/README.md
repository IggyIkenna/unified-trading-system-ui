# 05 - Infrastructure Principles

## TL;DR

- **Infrastructure as Code**: all infrastructure is managed by Terraform. No manual resource creation via console.
- **Cloud-agnostic**: GCP is the primary cloud (project `test-project`, region `asia-northeast1`). AWS is the secondary
  cloud (`ap-northeast-1`). The `CLOUD_PROVIDER` env var switches at runtime.
- **Docker everywhere**: every service is a Docker container. Multi-stage builds with `unified-trading-services` as a
  build dependency.
- **Dual CI/CD**: Cloud Build builds and pushes Docker images on merge to main. GitHub Actions runs quality gates on PRs
  (thin `workflow_call` callers delegating to PM reusable workflows). Both run the same checks. **SSOT for CI/CD**:
  `unified-trading-pm/docs/ci-cd-ssot.md`.
- **Per-service isolation**: each service has its own Terraform module, Cloud Build trigger, Artifact Registry
  repository, and GCS buckets.
- **Shared modules**: common Terraform modules (`compute-vm`, `container-job`, `cloud-build`, `shared-infrastructure`)
  provide consistent patterns across services.
- **Branch protection**: all repos enforce `enforce_admins=true`. No direct pushes to main. All changes go through PRs
  with quality gates.

---

## Infrastructure Stack

```
Layer 1: Cloud Provider
  GCP (primary): asia-northeast1 (Tokyo)
  AWS (secondary): ap-northeast-1 (Tokyo) [PLANNED]

Layer 2: Infrastructure as Code
  Terraform: per-service modules + shared modules
  State: GCS bucket (terraform-state-{project_id})

Layer 3: Container Platform
  Docker: multi-stage builds, Artifact Registry
  Compute: GCE VMs (primary), Cloud Run Jobs (alternative)

Layer 4: CI/CD
  Cloud Build: build + push Docker images on merge to main
  GitHub Actions: quality gates on PRs (lint, test, format)

Layer 5: Data Storage
  GCS: Parquet files (per-category buckets, versioning enabled)
  BigQuery: analytics, event logs (external tables over GCS)
  Secret Manager: API keys, tokens

Layer 6: Deployment Orchestration
  deployment-service: orchestration + configs + terraform (Python)
  deployment-api: FastAPI monitoring API
  deployment-ui: React UI
  Deploys VMs/Cloud Run Jobs per shard
  Monitors via GCS status files
```

---

## Cloud Provider Configuration [IMPLEMENTED]

### GCP (Primary)

| Setting            | Value                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| Project ID         | `test-project`                                                             |
| Region             | `asia-northeast1` (Tokyo)                                                  |
| Failover regions   | `europe-west1`, `us-central1`                                              |
| Container Registry | `asia-northeast1-docker.pkg.dev/{project_id}/{repository}/{service}:{tag}` |
| Bucket naming      | `{domain}-{category_lower}-{project_id}`                                   |
| Terraform state    | `gs://terraform-state-test-project/`                                       |

### AWS (Secondary) [PLANNED]

| Setting            | Value                                                              |
| ------------------ | ------------------------------------------------------------------ |
| Region             | `ap-northeast-1` (Tokyo -- matches GCP for low latency to Binance) |
| Failover region    | `ap-southeast-1` (Singapore)                                       |
| Container Registry | `{account_id}.dkr.ecr.{region}.amazonaws.com/{service}:{tag}`      |
| Bucket naming      | `unified-trading-{domain}-{category_lower}-{account_id}`           |

### Cloud Provider Switching

Services detect the cloud provider at runtime:

```python
# CLOUD_PROVIDER env var: "gcp" or "aws"
from unified_trading_services import get_storage_client
client = get_storage_client()  # Returns GCS Client or S3 Client
```

No service imports `google.cloud` or `boto3` directly. All cloud-specific logic is encapsulated in
`unified-trading-services`.

---

## Required GCP APIs [IMPLEMENTED]

| API                   | Purpose                    |
| --------------------- | -------------------------- |
| Cloud Run API         | Cloud Run Job management   |
| Compute Engine API    | VM creation and management |
| Cloud Storage API     | GCS read/write             |
| Cloud Workflows API   | Pipeline orchestration     |
| Cloud Scheduler API   | Cron-based job triggers    |
| Secret Manager API    | API keys and tokens        |
| Artifact Registry API | Docker image storage       |

---

## IAM Roles [IMPLEMENTED]

### Required Roles for Deployment

| Role                                 | Purpose               |
| ------------------------------------ | --------------------- |
| `roles/compute.instanceAdmin.v1`     | Create/manage VMs     |
| `roles/run.admin`                    | Manage Cloud Run jobs |
| `roles/storage.objectAdmin`          | GCS read/write        |
| `roles/artifactregistry.reader`      | Pull Docker images    |
| `roles/secretmanager.secretAccessor` | Access secrets        |
| `roles/logging.viewer`               | View logs             |
| `roles/cloudbuild.builds.viewer`     | View Cloud Build logs |

### Service Account

A shared service account (`batch-processing-sa`) is used for all batch processing services. It has:

- GCS object admin access (read/write all data buckets)
- Secret Manager accessor (read API keys)
- Cloud Run invoker (trigger workflows)
- Workflows invoker (orchestrate pipeline)

---

## Secrets Management [IMPLEMENTED]

Secrets are stored in GCP Secret Manager:

| Secret                | Purpose                                        |
| --------------------- | ---------------------------------------------- |
| `github-token`        | Clone private repos (unified-trading-services) |
| `tardis-api-key`      | CeFi market data (Tardis API)                  |
| `databento-api-key`   | TradFi market data (Databento API)             |
| `alchemy-api-key`     | DeFi RPC (Alchemy)                             |
| `graph-api-key`       | The Graph API (DeFi protocols)                 |
| `openbb-fred-api-key` | FRED economic data                             |
| `openbb-fmp-api-key`  | FMP fundamentals                               |
| `betfair-api-key`     | Sports: Betfair exchange (Application Key)     |

Secrets are injected into containers via:

- Cloud Build: `gcloud secrets versions access latest --secret=github-token`
- Cloud Run: Terraform `secret_environment_variables` block
- VM: environment variables passed via cloud-init

---

---

## Related Documents

| Document                                                   | Description                                                |
| ---------------------------------------------------------- | ---------------------------------------------------------- |
| [cloud-agnostic-migration.md](cloud-agnostic-migration.md) | GCP/AWS abstraction, migration phases, testing strategy    |
| [terraform.md](terraform.md)                               | Terraform module structure, per-service and shared modules |
| [ci-cd.md](ci-cd.md)                                       | Cloud Build + GitHub Actions pipeline                      |
| [cicd-setup.md](cicd-setup.md)                             | Complete CI/CD setup guide (Act, Docker, Cloud Build)      |
| [docker.md](docker.md)                                     | Multi-stage Docker builds, base images                     |
| [versioning-rollback.md](versioning-rollback.md)           | Image tagging, rollback procedures                         |
| [new-repo-setup.md](new-repo-setup.md)                     | Complete workflow for creating new repositories            |
| [service-setup-checklist.md](service-setup-checklist.md)   | Complete service setup (CLI, config, tests, CI/CD)         |
| [ui-setup-checklist.md](ui-setup-checklist.md)             | TypeScript UI setup (React/Vue, smoke tests, ESLint)       |
| [workspace-root-variable.md](workspace-root-variable.md)   | User-specific workspace root variable pattern              |
| [auth-setup.md](auth-setup.md)                             | Authentication setup (tokens, service accounts, secrets)   |
| [artifact-registry-setup.md](artifact-registry-setup.md)   | Publishing libraries to Artifact Registry                  |
| [contracts-integration.md](contracts-integration.md)       | Using unified-api-contracts and unified-internal-contracts |
| [batch/README.md](batch/README.md)                         | Batch infrastructure (VMs, schedulers, triggers)           |
| [live/README.md](live/README.md)                           | Live infrastructure (long-running VMs, health checks)      |
