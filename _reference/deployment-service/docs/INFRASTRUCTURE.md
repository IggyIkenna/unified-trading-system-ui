# Infrastructure, Access, and Quotas

GCP access, secrets, Cloud Build triggers, and quota requirements.

**Last consolidated:** 2026-02-09

---

## GCP Access

- **Project:** `test-project`
- **Region:** `asia-northeast1` (Tokyo)
- **Failover:** `europe-west1`, `us-central1`

### Required IAM Roles

| Role                                 | Purpose               |
| ------------------------------------ | --------------------- |
| `roles/viewer`                       | Console UI            |
| `roles/compute.instanceAdmin.v1`     | Create/manage VMs     |
| `roles/run.admin`                    | Manage Cloud Run jobs |
| `roles/storage.objectAdmin`          | GCS read/write        |
| `roles/artifactregistry.reader`      | Pull Docker images    |
| `roles/secretmanager.secretAccessor` | Access secrets        |
| `roles/logging.viewer`               | View logs             |
| `roles/cloudbuild.builds.viewer`     | View Cloud Build logs |

### Deployment State Bucket

**Use `deployment-orchestration-{project}`** for deployment state. This is separate from `terraform-state-{project}` (Terraform backend).

```bash
gsutil ls gs://deployment-orchestration-test-project/
```

---

## Secrets (Secret Manager)

| Secret                                                          | Purpose                                            |
| --------------------------------------------------------------- | -------------------------------------------------- |
| `github-token`                                                  | Clone private repos                                |
| `tardis-api-key`                                                | CeFi market data                                   |
| `databento-api-key`                                             | TradFi market data                                 |
| `alchemy-api-key`                                               | DeFi RPC                                           |
| `thegraph-api-key`, `thegraph-api-key-2` … `thegraph-api-key-9` | TheGraph API (9 keys, round-robin via SHARD_INDEX) |
| `openbb-fred-api-key`                                           | FRED economic data                                 |
| `openbb-fmp-api-key`                                            | FMP fundamentals                                   |

---

## Cloud Build Triggers

All triggers are in **asia-northeast1** (not global):

```bash
gcloud builds triggers list --project=test-project --region=asia-northeast1
```

### CLI Setup (Phase 4)

Create or update triggers from the command line:

```bash
cd deployment-service
bash scripts/setup-cloud-build-triggers.sh setup    # Add repos, create missing triggers
bash scripts/setup-cloud-build-triggers.sh list    # List triggers
bash scripts/setup-cloud-build-triggers.sh run-ordered  # Run builds in dependency order
```

**Build order:** Libraries first (config → events → UCS → domain → market/order/algo), then services (instruments → market-tick → market-data-processing → execution → others).

**unified-domain-client:** If the repo is not accessible to the Cloud Build GitHub App, add it via GCP Console: Cloud Build → Repositories → Link repository.

| Service                             | Trigger Name                         |
| ----------------------------------- | ------------------------------------ |
| instruments-service                 | instruments-service-build            |
| market-tick-data-handler            | market-tick-data-handler-build       |
| market-data-processing-service      | market-data-processing-service-build |
| ... (all 12 services + 7 libraries) | \*-build                             |

**Flow:** Push to main → Cloud Build runs quality gates → builds Docker image or wheel → pushes to Artifact Registry.

---

## Quota Requirements

- **Target:** ~20,000 concurrent shards for 6-year backfill
- **Heavy service:** market-tick-data-handler (26 venues × 2,190 days)
- **Cap:** `--max-concurrent 2000` (hard limit 2500)
- See [QUOTA_REQUIREMENTS.md](QUOTA_REQUIREMENTS.md) for full matrix (or inline if kept)

---

## Required GCP APIs

- Cloud Run API
- Compute Engine API
- Cloud Storage API
- Cloud Workflows API
- Cloud Scheduler API
- Secret Manager API
- Artifact Registry API

---

## Related

**Setup Guides:**

- [SETUP.md](SETUP.md) - Initial installation and workspace setup
- [GCS_FUSE_VM_SETUP.md](GCS_FUSE_VM_SETUP.md) - GCS FUSE configuration for VMs and Cloud Run
- [BIGQUERY_INTEGRATION_GUIDE.md](BIGQUERY_INTEGRATION_GUIDE.md) - BigQuery external tables setup

**Operations:**

- [CLI.md](CLI.md) - Deployment commands and CLI reference
