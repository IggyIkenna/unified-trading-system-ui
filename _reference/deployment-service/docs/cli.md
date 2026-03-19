# CLI Reference

Deployment CLI, sharding, data catalog, and dependencies.

**Last consolidated:** 2026-02-09

---

## Entry Points

| Context                   | Command                                         |
| ------------------------- | ----------------------------------------------- |
| After `pip install`       | `deploy-shards <subcommand>`                    |
| From repo root            | `python deploy.py <subcommand>`                 |
| Any directory (installed) | `python -m deployment_service.cli <subcommand>` |

All three invoke the same CLI.

---

## Quick Start

```bash
deploy-shards list-services
deploy-shards calculate market-tick-data-handler --start-date 2025-01-01 --end-date 2025-01-07 --category CEFI
python deploy.py deploy -s market-tick-data-handler -c cloud_run --start-date 2025-01-01 --end-date 2025-01-07 --category CEFI --dry-run
python deploy.py status <deployment-id>
```

---

## Deploy Command

```bash
python deploy.py deploy -s SERVICE -c cloud_run|vm --start-date YYYY-MM-DD --end-date YYYY-MM-DD [OPTIONS]
```

| Option             | Description                                                               |
| ------------------ | ------------------------------------------------------------------------- |
| `--category`       | CEFI, TRADFI, DEFI                                                        |
| `--venue`          | Filter venues                                                             |
| `--force`          | Overwrite existing GCS data                                               |
| `--dry-run`        | Preview only                                                              |
| `--no-wait`        | Fire-and-forget                                                           |
| `--max-workers`    | **NEW:** Dates per shard (parallel processing), default: service-specific |
| `--max-concurrent` | VMs/jobs at once (default 2000, max 2500)                                 |
| `--max-threads`    | Parallel API calls (default 50)                                           |

### NEW: MAX_WORKERS for Date Parallelism

**Purpose:** Process multiple dates in parallel per VM (maximize C2 machine utilization)

**How it works:**

- Batches dates into multi-date shards
- Each shard processes N dates in parallel (multiprocessing)
- Reduces VM count OR speeds up completion

**Service-specific defaults:**

```python
instruments-service: 16      # 10% CPU → 90% CPU, 16x speedup
features-calendar-service: 16
ml-inference-service: 3
Others: 1 (memory-bound, no parallelism)
```

**Examples:**

```bash
# Use service default (instruments: 16)
python deploy.py deploy -s instruments-service --start-date 2024-01-01 --end-date 2024-12-31
# → 23 shards (365 days / 16 = 23), each processes 16 dates in parallel

# Override (force serial)
python deploy.py deploy -s instruments-service --start-date 2024-01-01 --end-date 2024-12-31 --max-workers 1
# → 365 shards (1 date each), serial processing

# Small range
python deploy.py deploy -s instruments-service --start-date 2024-01-01 --end-date 2024-01-05 --max-workers 16
# → 1 shard (5 dates), processes all 5 in parallel
```

**See:** [MAX_WORKERS_UNIFIED_IMPLEMENTATION_PLAN.md](MAX_WORKERS_UNIFIED_IMPLEMENTATION_PLAN.md) for complete details

---

## Status and Management

| Command                                       | Description                     |
| --------------------------------------------- | ------------------------------- |
| `status <deployment-id>`                      | Check deployment status         |
| `list [--service X] [--limit N]`              | List recent deployments         |
| `logs <deployment-id>`                        | View aggregated errors/warnings |
| `resume <deployment-id>`                      | Retry failed shards             |
| `retry-failed <deployment-id>`                | Retry only failed shards        |
| `cancel <deployment-id>`                      | Cancel deployment               |
| `fix-stale [--service X] [--max-age-hours N]` | Fix stuck "running" state       |

---

## Sharding

```bash
deploy-shards calculate -s instruments-service --start-date 2024-01-01 --end-date 2024-01-31
deploy-shards info -s market-tick-data-handler
deploy-shards venues
```

**Dimension types:** fixed, hierarchical (venue ← category), date_range, gcs_dynamic.

---

## Data Catalog and Dependencies

```bash
python -m deployment_service.cli catalog -s instruments-service --start-date 2024-01-01 --end-date 2024-01-31
python -m deployment_service.cli catalog-all --start-date 2024-01-01 --end-date 2024-01-31 -o catalog.json
python -m deployment_service.cli data-status -s instruments-service --start-date 2024-01-01 --end-date 2024-01-31
python -m deployment_service.cli check-deps -s ml-training-service -d 2024-01-15 --category CEFI
```

---

## State Bucket (Important)

**Deployment state** uses `deployment-orchestration-{project}`, **not** `terraform-state-{project}`.

```bash
# Correct - deployment state
gsutil ls gs://deployment-orchestration-test-project/deployments.development/

# terraform-state-* is for Terraform backend only (different bucket)
```

---

## Compute Backends

| Backend       | Best For                  |
| ------------- | ------------------------- |
| **Cloud Run** | Daily runs, quick jobs    |
| **VM**        | Backfills, better logging |

### Zone Failover Strategy

Deployments use **single-region, multi-zone** architecture:

- **Primary region:** `asia-northeast1` (matches GCS bucket location)
- **Zones:** `1a`, `1b`, `1c`
- **VM:** Each job attempts 3 zones with 3 retries each (9 total attempts)
- **Zone round-robin:** Batch of 30 shards distributed 10-10-10 across zones
- **No cross-region failover:** Avoids GCS Fuse issues and egress costs

---

## Configuration

- `configs/sharding.{service}.yaml` - Dimensions, CLI args
- `configs/venues.yaml` - Category → venue mapping
- `configs/dependencies.yaml` - Upstream/downstream

---

## Related

- [SETUP.md](SETUP.md) - Installation
- [HARDENING.md](HARDENING.md) - 4-stage readiness
